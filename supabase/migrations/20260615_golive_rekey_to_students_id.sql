-- ============================================================================
-- 20260615_golive_rekey_to_students_id.sql
--
-- PRE-LAUNCH CUTOVER. Run ONCE, before importing next year's rosters, while no
-- students are using the app. Makes students.id the single identity principal
-- and enforces it with database-level foreign keys, so the avatar/XP/mastery
-- fragmentation that prompted this work becomes structurally impossible.
--
-- Validated logically (FK rejection, cascade purge, archive-preserves-mastery,
-- multi-sub login convergence) in docs/IDENTITY_REKEY_PLAN.md §7 — 11/11 checks.
--
-- ORDER OF DEPLOY:
--   1. Take the app offline / pre-launch (no active student sessions).
--   2. Run THIS migration (Sections A–F below).
--   3. Deploy the re-keyed application code (session.user.id == students.id).
--   4. Import new sections/rosters. Students sign in fresh -> clean single ids.
--
-- This migration is destructive of STUDENT data by design (the go-live wipe).
-- It NEVER touches curriculum, the avatar catalog, the rewards catalog, staff
-- accounts, schedules, or economy config.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- SECTION A — GO-LIVE RESET: wipe student state (Task #9 / D3).
-- Explicit deletes (foreign keys are added later in Section B). Children first.
-- ----------------------------------------------------------------------------
delete from public.avatar_likes;
delete from public.challenges;
delete from public.lobby_members;
delete from public.notification_reads;
delete from public.question_usage_log;
delete from public.video_question_responses;
delete from public.student_activity;
delete from public.reward_redemptions;
delete from public.economy_point_grants;
delete from public.math_spine_point_grants;
delete from public.math_warmup_submissions;
delete from public.math_competency_records;
delete from public.mastery_task_results;
delete from public.mastery_records;
delete from public.lesson_submissions;
delete from public.lesson_progress;
delete from public.gradebook_entries;
delete from public.submissions;
delete from public.assignment_submissions;
delete from public.vocabulary_game_scores;
delete from public.arcade_plays;
delete from public.block_responses;
delete from public.student_owned_items;
delete from public.student_avatars;
delete from public.student_identities;
delete from public.course_students;
delete from public.students;
-- Preserved on purpose: courses (re-imported next year), lessons/units/simulations,
-- vocabulary_*, concept_exercises, learning_targets, math_* definitions,
-- avatar_items (catalog), rewards (catalog), section_schedules, section_pacing,
-- staff_presence, user_roles, admin_emails, teacher_onboarding.

-- ----------------------------------------------------------------------------
-- SECTION A2 — Capture & drop every RLS policy that depends on a work-table
-- user_id column. Postgres refuses ALTER COLUMN TYPE while a policy references
-- the column, so we save their definitions to a temp table, drop them here, and
-- recreate them (type-adjusted for user_id now being uuid) at the end of G.
-- (Verified against the live policy set via the transactional dry-run.)
-- ----------------------------------------------------------------------------
create temporary table _saved_user_policies on commit drop as
select tablename, policyname, cmd, permissive, roles, qual as using_expr, with_check as check_expr
from pg_policies
where schemaname='public'
  and tablename = any(array['arcade_plays','assignment_submissions','block_responses','economy_point_grants',
    'gradebook_entries','lesson_progress','lesson_submissions','mastery_records','mastery_task_results',
    'math_competency_records','math_spine_point_grants','math_warmup_submissions','notification_reads',
    'question_usage_log','reward_redemptions','student_activity','student_avatars','student_owned_items',
    'submissions','video_question_responses','vocabulary_game_scores','lobby_members','avatar_likes','challenges'])
  and (coalesce(qual,'')||coalesce(with_check,'')) ilike '%user_id%';
do $$ declare r record; begin
  for r in select tablename, policyname from _saved_user_policies loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- SECTION B — RE-KEY: every work-table identity column becomes a uuid FK to
-- students(id) ON DELETE CASCADE. Safe because the tables are now empty.
-- ----------------------------------------------------------------------------
do $$
declare
  t text;
  -- tables with a single `user_id` identity column
  single_user_id text[] := array[
    'arcade_plays','assignment_submissions','block_responses','economy_point_grants',
    'gradebook_entries','lesson_progress','lesson_submissions','mastery_records',
    'mastery_task_results','math_competency_records','math_spine_point_grants',
    'math_warmup_submissions','notification_reads','question_usage_log',
    'reward_redemptions','student_activity','student_avatars','student_owned_items',
    'submissions','video_question_responses','vocabulary_game_scores','lobby_members'
  ];
begin
  foreach t in array single_user_id loop
    execute format('alter table public.%I alter column user_id type uuid using user_id::uuid', t);
    execute format(
      'alter table public.%I add constraint %I foreign key (user_id) references public.students(id) on delete cascade',
      t, t || '_user_fk');
  end loop;
end $$;

-- Multi-column / differently-named identity references.
alter table public.avatar_likes
  alter column liker_user_id  type uuid using liker_user_id::uuid,
  alter column target_user_id type uuid using target_user_id::uuid,
  add constraint avatar_likes_liker_fk  foreign key (liker_user_id)  references public.students(id) on delete cascade,
  add constraint avatar_likes_target_fk foreign key (target_user_id) references public.students(id) on delete cascade;

alter table public.challenges
  alter column challenger_user_id type uuid using challenger_user_id::uuid,
  alter column opponent_user_id   type uuid using opponent_user_id::uuid,
  alter column winner_user_id     type uuid using winner_user_id::uuid,
  add constraint challenges_challenger_fk foreign key (challenger_user_id) references public.students(id) on delete cascade,
  add constraint challenges_opponent_fk   foreign key (opponent_user_id)   references public.students(id) on delete cascade,
  add constraint challenges_winner_fk     foreign key (winner_user_id)     references public.students(id) on delete set null;

-- Helpful indexes for the per-student lookups that now drive every surface.
create index if not exists idx_block_responses_user        on public.block_responses(user_id);
create index if not exists idx_mastery_records_user        on public.mastery_records(user_id);
create index if not exists idx_math_comp_records_user      on public.math_competency_records(user_id);
create index if not exists idx_lesson_progress_user        on public.lesson_progress(user_id);
create index if not exists idx_economy_grants_user         on public.economy_point_grants(user_id);

-- ----------------------------------------------------------------------------
-- SECTION C — The redundant Google sub column (students.google_user_id) is
-- dropped in SECTION G, *after* every DB function and policy that referenced it
-- has been recreated. Postgres tracks policy->column dependencies and would
-- refuse the drop otherwise; functions aren't tracked but would silently break
-- at runtime, so we recreate them too. (D1)
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- SECTION D — LIFECYCLE dimension for the yearly archive/purge (Task #11).
-- ----------------------------------------------------------------------------
alter table public.courses  add column if not exists school_year text;
alter table public.courses  add column if not exists archived_at timestamptz;
alter table public.students add column if not exists cohort_year text;
create index if not exists idx_courses_school_year on public.courses(school_year);

-- ----------------------------------------------------------------------------
-- SECTION E — RLS remap (D2 enabler). The roster RLS policies compare
-- `user_id = app_uid()`. Re-point app_uid() at students.id so those policies
-- become correct under the new key with no per-policy rewrites. Email-based
-- policies are unaffected.
-- ----------------------------------------------------------------------------
-- NOTE: app_uid() keeps its existing TEXT return type (changing it would require
-- dropping every dependent policy first). It now returns students.id::text, and
-- policy comparisons use user_id::text = app_uid().
create or replace function public.app_uid()
returns text
language sql stable
as $$
  select s.id::text
  from public.students s
  where lower(s.email) = lower(auth.jwt() ->> 'email')
  limit 1
$$;

-- ----------------------------------------------------------------------------
-- SECTION F — YEARLY LIFECYCLE FUNCTIONS (Task #11). Self-serve, dry-run-first.
-- ----------------------------------------------------------------------------

-- Archive a school year: hide its sections + deactivate students who are left
-- with no ACTIVE enrollment. Reversible. NEVER deletes work or mastery.
create or replace function public.archive_school_year(p_year text)
returns table (sections_archived int, students_deactivated int)
language plpgsql as $$
declare n_sec int; n_stu int;
begin
  update public.courses set archived_at = now(), course_state = 'ARCHIVED'
   where school_year = p_year and archived_at is null;
  get diagnostics n_sec = row_count;

  update public.course_students set enrollment_state = 'archived'
   where course_id in (select id from public.courses where school_year = p_year);

  update public.students s set is_active = false, updated_at = now()
   where s.is_active
     and not exists (
       select 1 from public.course_students cs
       join public.courses c on c.id = cs.course_id
       where cs.student_id = s.id and cs.enrollment_state = 'ACTIVE' and c.archived_at is null);
  get diagnostics n_stu = row_count;

  sections_archived := n_sec; students_deactivated := n_stu; return next;
end $$;

-- Reactivate a returning student by email (their math spine is untouched and
-- resumes automatically — see plan §10). Returns true if a row was reactivated.
create or replace function public.reactivate_student(p_email text)
returns boolean
language plpgsql as $$
declare hit int;
begin
  update public.students set is_active = true, updated_at = now()
   where lower(email) = lower(p_email);
  get diagnostics hit = row_count;
  return hit > 0;
end $$;

-- PURGE: permanently delete confirmed-departed students. ONE delete per student;
-- all their work cascades away via the Section B foreign keys. Dry-run by default
-- (returns the count without deleting); pass p_confirm := true to actually purge.
create or replace function public.purge_students(p_student_ids uuid[], p_confirm boolean default false)
returns table (would_delete int, deleted int)
language plpgsql as $$
declare n int;
begin
  select count(*) into n from public.students where id = any(p_student_ids);
  if not p_confirm then
    would_delete := n; deleted := 0; return next; return;
  end if;
  delete from public.students where id = any(p_student_ids);  -- cascades to all work
  get diagnostics deleted = row_count;
  would_delete := n; return next;
end $$;

-- ----------------------------------------------------------------------------
-- SECTION G — Recreate every DB object that referenced students.google_user_id
-- to use students.id instead, then drop the column. Order matters: policies are
-- dependency-tracked, so they (and the helper functions) must be fixed first.
-- (Set discovered live via pg_proc/pg_policies — no other objects reference it.)
-- ----------------------------------------------------------------------------

-- app_owns_gid: a teacher "owns" a student id if that student is enrolled in one
-- of the teacher's courses. Now compares students.id (passed as text) directly.
create or replace function public.app_owns_gid(student_gid text)
returns boolean language sql stable security definer set search_path to 'public'
as $$
  select exists (
    select 1 from public.courses c
    join public.course_students cs on cs.course_id = c.id
    join public.students s on s.id = cs.student_id
    where c.teacher_email = public.app_email() and s.id::text = student_gid
  )
$$;

-- enroll_student_with_code: stop seeding a fake google_user_id; the students.id
-- default supplies the canonical id. (Signature unchanged.)
create or replace function public.enroll_student_with_code(p_student_email text, p_join_code text)
returns table(success boolean, message text, course_id uuid, course_name text)
language plpgsql security definer set search_path to 'public'
as $$
declare
  v_course_id uuid; v_course_name text; v_student_id uuid;
  v_enrollment_count integer; v_max_enrollments integer;
  v_code_enabled boolean; v_code_expires timestamptz;
begin
  select c.id, c.name, c.join_code_enabled, c.join_code_expires_at, c.max_enrollments
    into v_course_id, v_course_name, v_code_enabled, v_code_expires, v_max_enrollments
  from public.courses c where c.join_code = upper(p_join_code);

  if v_course_id is null then
    return query select false, 'Invalid join code'::text, null::uuid, null::text; return;
  end if;
  if not v_code_enabled then
    return query select false, 'This join code is no longer active'::text, null::uuid, null::text; return;
  end if;
  if v_code_expires is not null and v_code_expires < now() then
    return query select false, 'This join code has expired'::text, null::uuid, null::text; return;
  end if;
  if v_max_enrollments is not null then
    select count(*) into v_enrollment_count from public.course_students cs where cs.course_id = v_course_id;
    if v_enrollment_count >= v_max_enrollments then
      return query select false, 'This course has reached maximum enrollment'::text, null::uuid, null::text; return;
    end if;
  end if;

  select id into v_student_id from public.students where email = p_student_email;
  if v_student_id is null then
    insert into public.students (email, name)
    values (p_student_email, split_part(p_student_email, '@', 1))
    returning id into v_student_id;
  end if;

  if exists (select 1 from public.course_students cs where cs.course_id = v_course_id and cs.student_id = v_student_id) then
    return query select true, 'Already enrolled in this course'::text, v_course_id, v_course_name; return;
  end if;

  insert into public.course_students (course_id, student_id, enrollment_state, enrolled_via, enrolled_at)
  values (v_course_id, v_student_id, 'ACTIVE', 'join_code', now());

  return query select true, 'Successfully enrolled'::text, v_course_id, v_course_name;
end;
$$;

-- get_course_students / get_unassigned_students: drop google_user_id from the
-- result (return type change requires DROP + CREATE). Consumers were updated in
-- the code refactor; smoke-test these two admin/roster endpoints post-deploy.
drop function if exists public.get_course_students(uuid);
create function public.get_course_students(p_course_id uuid)
returns table(id uuid, email text, name text, photo_url text)
language plpgsql security definer set search_path to 'public'
as $$
begin
  return query
    select s.id, s.email, s.name, s.photo_url
    from public.students s
    join public.course_students cs on cs.student_id = s.id
    where cs.course_id = p_course_id
    order by s.name;
end;
$$;

drop function if exists public.get_unassigned_students();
create function public.get_unassigned_students()
returns table(id uuid, email text, name text, created_at timestamptz, last_sign_in timestamptz, course_count integer)
language plpgsql security definer set search_path to 'public'
as $$
begin
  return query
    select s.id, s.email, s.name, s.created_at, s.updated_at as last_sign_in,
      coalesce((select count(*) from public.course_students cs where cs.student_id = s.id),0)::integer as course_count
    from public.students s
    where not exists (select 1 from public.course_students cs where cs.student_id = s.id)
    order by s.created_at desc;
end;
$$;

-- sync_student: re-key the Classroom upsert onto EMAIL (the new natural key).
-- New signature matches the import route's .rpc() call (no p_google_user_id).
drop function if exists public.sync_student(text, text, text, text, uuid);
create function public.sync_student(
  p_email text, p_name text, p_photo_url text default null, p_course_id uuid default null
) returns uuid language plpgsql security definer set search_path to 'public'
as $$
declare v_student_id uuid;
begin
  insert into public.students (email, name, photo_url, updated_at)
  values (p_email, p_name, p_photo_url, now())
  on conflict (email) do update set
    name = excluded.name, photo_url = excluded.photo_url, updated_at = now()
  returning id into v_student_id;

  if p_course_id is not null then
    insert into public.course_students (course_id, student_id, enrollment_state, enrolled_at)
    values (p_course_id, v_student_id, 'ACTIVE', now())
    on conflict (course_id, student_id) do update set enrollment_state = 'ACTIVE', updated_at = now();
  end if;
  return v_student_id;
end;
$$;

-- Obsolete one-time consolidation (references the dropped column).
drop function if exists public.consolidate_fragmented_identities();

-- Recreate the captured work-table policies (Section A2), type-adjusted now that
-- user_id is uuid: app_uid() returns text -> compare user_id::text; app_owns_gid
-- takes text; auth.uid() is already uuid. The string substitutions cover every
-- pattern observed in the live policy set.
do $$ declare r record; u text; c text; sql text;
begin
  for r in select * from _saved_user_policies loop
    u := r.using_expr; c := r.check_expr;
    if u is not null then
      u := replace(u, '(auth.uid())::text', 'auth.uid()');
      u := replace(u, 'user_id = app_uid()', '(user_id)::text = app_uid()');
      u := replace(u, 'app_owns_gid(user_id)', 'app_owns_gid((user_id)::text)');
      u := replace(u, 'user_id = get_auth_user_id_text()', '(user_id)::text = get_auth_user_id_text()');
    end if;
    if c is not null then
      c := replace(c, '(auth.uid())::text', 'auth.uid()');
      c := replace(c, 'user_id = app_uid()', '(user_id)::text = app_uid()');
      c := replace(c, 'app_owns_gid(user_id)', 'app_owns_gid((user_id)::text)');
      c := replace(c, 'user_id = get_auth_user_id_text()', '(user_id)::text = get_auth_user_id_text()');
    end if;
    sql := format('create policy %I on public.%I as %s for %s to %s',
                  r.policyname, r.tablename, r.permissive, r.cmd, array_to_string(r.roles, ', '));
    if r.cmd in ('SELECT','UPDATE','ALL','DELETE') and coalesce(u,'') <> '' then sql := sql || format(' using (%s)', u); end if;
    if r.cmd in ('INSERT','UPDATE','ALL') and coalesce(c,'') <> '' then sql := sql || format(' with check (%s)', c); end if;
    execute sql;
  end loop;
end $$;

-- Recreate the two roster policies that compared s.google_user_id = app_uid().
-- app_uid() now returns students.id::text, so compare s.id::text.
drop policy if exists rls2_read on public.course_students;
create policy rls2_read on public.course_students for select using (
  public.app_is_admin()
  or exists (select 1 from public.courses c where c.id = course_students.course_id and c.teacher_email = public.app_email())
  or exists (select 1 from public.students s where s.id = course_students.student_id and s.id::text = public.app_uid())
);

drop policy if exists rls2_read on public.courses;
create policy rls2_read on public.courses for select using (
  public.app_is_admin()
  or (teacher_email = public.app_email())
  or exists (
    select 1 from public.course_students cs
    join public.students s on s.id = cs.student_id
    where cs.course_id = courses.id and s.id::text = public.app_uid())
);

-- Now safe: no DB object references the column.
alter table public.students drop column if exists google_user_id;

commit;
