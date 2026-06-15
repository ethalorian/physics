-- ============================================================================
-- 20260614_identity_hardening.sql
--
-- PROBLEM (observed 2026-06):
--   The app keys every work table on `session.user.id`, which is the Google
--   OAuth `sub` captured at login (see api-auth.ts). That value is NOT stable
--   for a person across OAuth-client changes / environments, so a single email
--   accumulated MULTIPLE identity strings. ensureStudentRecord only "self-heals"
--   students.google_user_id to the LATEST sub, leaving avatar, XP/points,
--   mastery and gradebook work stranded under older ids. Symptom: the same
--   account shows a different avatar / XP / progress on different devices, and
--   grading silently follows whichever id logged in last.
--
--   Audit at time of writing: 4 of 26 active accounts fragmented
--   (one with 4 ids), each with the roster link pointing at a near-empty
--   fragment while the real history lived under another id.
--
-- FIX (surgical / "Approach A"):
--   1. Make the EMAIL the canonical principal. A person's stable app id is the
--      single `students.google_user_id` value pinned on their (unique-email)
--      roster row. Login resolves email -> that pinned id and stops trusting the
--      raw incoming sub (see the accompanying auth.ts / student-management.ts
--      changes). This removes the drift at the source.
--   2. Record every OAuth sub ever seen for a person in `student_identities`,
--      so future drift is LINKED to the same student instead of forking a new
--      identity — and so we have an audit trail.
--   3. One-time, idempotent CONSOLIDATION of the already-fragmented accounts:
--      pick the richest fragment as canonical, repoint all historical rows onto
--      it (conserving XP and keeping the real avatar), and pin the roster link.
--
-- SAFETY: every step is idempotent. Re-running after a clean state is a no-op
-- (there are no multi-fragment emails left to consolidate). The consolidation
-- merges value rather than dropping it: point grants are append-only and simply
-- sum once repointed; per-lesson progress is collapsed to the BEST row; the
-- custom avatar is preserved.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Identity link table: (provider, sub) -> one student. Audit + drift catch.
-- ----------------------------------------------------------------------------
create table if not exists public.student_identities (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references public.students(id) on delete cascade,
  provider      text not null default 'google',
  provider_sub  text not null,
  email_at_link text,
  first_seen    timestamptz not null default now(),
  last_seen     timestamptz not null default now(),
  unique (provider, provider_sub)
);

comment on table public.student_identities is
  'Every external auth identity (provider + sub) ever seen for a student. The app keys work tables on the pinned students.google_user_id; this table maps any *other* sub the same person presents back to that one student, so OAuth-sub drift is linked, never forked.';

create index if not exists student_identities_student_id_idx
  on public.student_identities (student_id);

-- RLS: server uses the service role (bypasses RLS). Enabling with no public
-- policy keeps this identity map invisible to the anon/auth client, matching
-- the locked-down posture of the rest of the schema.
alter table public.student_identities enable row level security;

-- Backfill: the currently-pinned google_user_id for every student is, by
-- definition, a known identity for that student.
insert into public.student_identities (student_id, provider, provider_sub, email_at_link)
select s.id, 'google', s.google_user_id, s.email
from public.students s
where s.google_user_id is not null
on conflict (provider, provider_sub) do nothing;

-- ----------------------------------------------------------------------------
-- 2. Repoint helper: move every "this is me" row from a losing id to canonical,
--    respecting each table's unique/PK constraints (collapse, don't collide).
-- ----------------------------------------------------------------------------
create or replace function public.merge_user_identity(p_canonical text, p_loser text)
returns void
language plpgsql
as $$
begin
  if p_canonical is null or p_loser is null or p_canonical = p_loser then
    return;
  end if;

  -- --- Append-only / no user-scoped unique constraint: plain repoint. ---
  -- Point sources sum correctly once repointed (grants carry a GLOBAL dedupe_key,
  -- so repointing user_id cannot collide).
  update public.economy_point_grants    set user_id = p_canonical where user_id = p_loser;
  update public.math_spine_point_grants  set user_id = p_canonical where user_id = p_loser;
  update public.vocabulary_game_scores   set user_id = p_canonical where user_id = p_loser;
  update public.arcade_plays             set user_id = p_canonical where user_id = p_loser;
  update public.block_responses          set user_id = p_canonical where user_id = p_loser;
  update public.lesson_submissions       set user_id = p_canonical where user_id = p_loser;
  update public.mastery_records          set user_id = p_canonical where user_id = p_loser;
  update public.mastery_task_results     set user_id = p_canonical where user_id = p_loser;
  update public.math_competency_records  set user_id = p_canonical where user_id = p_loser;
  update public.math_warmup_submissions  set user_id = p_canonical where user_id = p_loser;
  update public.reward_redemptions       set user_id = p_canonical where user_id = p_loser;
  update public.student_activity         set user_id = p_canonical where user_id = p_loser;
  update public.video_question_responses set user_id = p_canonical where user_id = p_loser;
  update public.question_usage_log       set user_id = p_canonical where user_id = p_loser;

  -- --- lesson_progress: UNIQUE(user_id, lesson_id). Keep the BEST per lesson. ---
  update public.lesson_progress c
     set progress_percentage      = greatest(coalesce(c.progress_percentage,0),      coalesce(l.progress_percentage,0)),
         video_questions_correct  = greatest(coalesce(c.video_questions_correct,0),  coalesce(l.video_questions_correct,0))
    from public.lesson_progress l
   where c.user_id = p_canonical and l.user_id = p_loser and c.lesson_id = l.lesson_id;
  delete from public.lesson_progress l
   where l.user_id = p_loser
     and exists (select 1 from public.lesson_progress c where c.user_id = p_canonical and c.lesson_id = l.lesson_id);
  update public.lesson_progress set user_id = p_canonical where user_id = p_loser;

  -- --- gradebook_entries: UNIQUE(user_id,item_type,item_id). Keep canonical's. ---
  delete from public.gradebook_entries l
   where l.user_id = p_loser
     and exists (select 1 from public.gradebook_entries c
                  where c.user_id = p_canonical and c.item_type = l.item_type and c.item_id = l.item_id);
  update public.gradebook_entries set user_id = p_canonical where user_id = p_loser;

  -- --- assignment_submissions / submissions: UNIQUE(assignment_id,user_id). ---
  delete from public.assignment_submissions l
   where l.user_id = p_loser
     and exists (select 1 from public.assignment_submissions c
                  where c.user_id = p_canonical and c.assignment_id = l.assignment_id);
  update public.assignment_submissions set user_id = p_canonical where user_id = p_loser;

  delete from public.submissions l
   where l.user_id = p_loser
     and exists (select 1 from public.submissions c
                  where c.user_id = p_canonical and c.assignment_id = l.assignment_id);
  update public.submissions set user_id = p_canonical where user_id = p_loser;

  -- --- student_owned_items: PK(user_id,item_slug). Union the inventory. ---
  delete from public.student_owned_items l
   where l.user_id = p_loser
     and exists (select 1 from public.student_owned_items c
                  where c.user_id = p_canonical and c.item_slug = l.item_slug);
  update public.student_owned_items set user_id = p_canonical where user_id = p_loser;

  -- --- lobby_members: UNIQUE(session_id,user_id) (transient). ---
  delete from public.lobby_members l
   where l.user_id = p_loser
     and exists (select 1 from public.lobby_members c
                  where c.user_id = p_canonical and c.session_id = l.session_id);
  update public.lobby_members set user_id = p_canonical where user_id = p_loser;

  -- --- notification_reads: PK(user_id). Keep canonical's read state. ---
  delete from public.notification_reads where user_id = p_loser
     and exists (select 1 from public.notification_reads c where c.user_id = p_canonical);
  update public.notification_reads set user_id = p_canonical where user_id = p_loser;

  -- --- student_avatars: PK(user_id). Canonical is chosen to already hold the
  --     real avatar; only move the loser's if canonical somehow has none. ---
  delete from public.student_avatars where user_id = p_loser
     and exists (select 1 from public.student_avatars c where c.user_id = p_canonical);
  update public.student_avatars set user_id = p_canonical where user_id = p_loser;

  -- --- Social references (no user-scoped unique). ---
  update public.avatar_likes set liker_user_id  = p_canonical where liker_user_id  = p_loser;
  update public.avatar_likes set target_user_id = p_canonical where target_user_id = p_loser;
  update public.challenges    set challenger_user_id = p_canonical where challenger_user_id = p_loser;
  update public.challenges    set opponent_user_id   = p_canonical where opponent_user_id   = p_loser;
  update public.challenges    set winner_user_id     = p_canonical where winner_user_id     = p_loser;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. Driver: consolidate every fragmented email onto one canonical id.
--    Returns one row per (email, loser) action taken — empty when nothing to do.
-- ----------------------------------------------------------------------------
create or replace function public.consolidate_fragmented_identities()
returns table (email text, canonical text, merged_loser text)
language plpgsql
as $$
declare
  r_email   text;
  v_canon   text;
  r_loser   text;
begin
  -- Email -> all identity strings ever used as a work-row owner, via the
  -- denormalized user_email columns that exist alongside user_id everywhere.
  create temporary table _bridge on commit drop as
    select distinct user_id, lower(user_email) as email from (
      select user_id, user_email from public.economy_point_grants
      union all select user_id, user_email from public.math_spine_point_grants
      union all select user_id, user_email from public.vocabulary_game_scores
      union all select user_id, user_email from public.lesson_progress
      union all select user_id, user_email from public.lesson_submissions
      union all select user_id, user_email from public.mastery_records
      union all select user_id, user_email from public.mastery_task_results
      union all select user_id, user_email from public.math_competency_records
      union all select user_id, user_email from public.math_warmup_submissions
      union all select user_id, user_email from public.reward_redemptions
      union all select user_id, user_email from public.gradebook_entries
      union all select user_id, user_email from public.student_activity
      union all select user_id, user_email from public.video_question_responses
      union all select user_id, user_email from public.arcade_plays
      union all select user_id, user_email from public.block_responses
      union all select user_id, user_email from public.assignment_submissions
    ) u
    where user_id is not null and user_email is not null;

  -- Also fold in the id currently pinned on the roster row (it may not appear in
  -- any work table yet but is still one of the person's identities).
  insert into _bridge
    select s.google_user_id, lower(s.email) from public.students s
    where s.google_user_id is not null
    on conflict do nothing;

  for r_email in
    select email from _bridge group by email having count(distinct user_id) > 1
  loop
    -- Canonical = the richest fragment: prefer a completed/custom avatar, then
    -- the most accumulated work, then deterministic by id.
    select b.user_id into v_canon
    from _bridge b
    where b.email = r_email
    order by
      (select count(*) from public.student_avatars a where a.user_id = b.user_id and a.use_custom_avatar) desc,
      (select count(*) from public.student_avatars a where a.user_id = b.user_id and a.setup_completed)   desc,
      ( (select count(*) from public.lesson_progress        x where x.user_id = b.user_id)
      + (select count(*) from public.mastery_records        x where x.user_id = b.user_id)
      + (select count(*) from public.block_responses        x where x.user_id = b.user_id)
      + (select coalesce(sum(x.points),0) from public.economy_point_grants   x where x.user_id = b.user_id)
      + (select coalesce(sum(x.points),0) from public.math_spine_point_grants x where x.user_id = b.user_id)
      ) desc,
      b.user_id asc
    limit 1;

    -- Pin the roster link to the canonical id (drops the "chase newest sub" drift).
    update public.students set google_user_id = v_canon, updated_at = now()
     where lower(email) = r_email;

    -- Repoint every losing fragment onto canonical, and record it as a linked
    -- identity so a future login presenting that sub resolves to this student.
    for r_loser in
      select b.user_id from _bridge b where b.email = r_email and b.user_id <> v_canon
    loop
      insert into public.student_identities (student_id, provider, provider_sub, email_at_link)
        select s.id, 'google', r_loser, r_email from public.students s where lower(s.email) = r_email
        on conflict (provider, provider_sub) do nothing;

      perform public.merge_user_identity(v_canon, r_loser);

      email := r_email; canonical := v_canon; merged_loser := r_loser;
      return next;
    end loop;
  end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- 4. Run the one-time consolidation. (Idempotent: no-op once clean.)
--    NOTE: this line performs the data merge. Review the dry-run verification
--    before applying to production.
-- ----------------------------------------------------------------------------
select * from public.consolidate_fragmented_identities();

commit;
