-- Audit 4/5/7/8/11/15/18; additive A-2, E-4/E-6, M-1.
alter table public.lesson_submissions add column if not exists content_snapshot jsonb;
alter table public.lesson_submissions add column if not exists response_snapshot jsonb;
alter table public.lesson_submissions add column if not exists review_policy text not null default 'legacy';
create table if not exists public.lesson_reviews (
 id uuid primary key default gen_random_uuid(),
 user_id text not null, lesson_id uuid not null references public.lessons(id),
 submission_id uuid not null unique references public.lesson_submissions(id),
 reviewer_email text not null, reviewed_at timestamptz not null default now()
);
create table if not exists public.lesson_evidence_reviews (
 response_id uuid primary key references public.block_responses(id),
 reviewer_email text not null, reviewed_at timestamptz not null default now()
);
create table if not exists public.lesson_evidence_links (
 response_id uuid primary key references public.block_responses(id),
 lesson_id uuid references public.lessons(id),
 target_id uuid references public.learning_targets(id),
 linked_by text not null, linked_at timestamptz not null default now(),
 check (lesson_id is not null or target_id is not null)
);
alter table public.present_sessions add column if not exists current_anchor text;
alter table public.present_sessions add column if not exists poll_run_id uuid;
alter table public.block_responses add column if not exists present_session_id uuid references public.present_sessions(id);
alter table public.block_responses add column if not exists poll_run_id uuid;
alter table public.block_responses add column if not exists math_competency_ids uuid[] not null default '{}';
create index if not exists idx_block_responses_poll_round on public.block_responses(present_session_id,poll_run_id,block_id,created_at desc);
alter table public.lesson_section_progress add column if not exists completed_anchors text[] not null default '{}';
alter table public.lesson_section_progress add column if not exists document_revision text;
create table if not exists public.lobby_group_artifacts (
 group_id uuid primary key references public.lobby_groups(id),
 session_id uuid not null references public.lobby_sessions(id),
 response jsonb not null, submitted_by text not null,
 updated_at timestamptz not null default now()
);
create index if not exists idx_lobby_group_artifacts_session on public.lobby_group_artifacts(session_id);
alter table public.lesson_reviews enable row level security;
alter table public.lesson_evidence_reviews enable row level security;
alter table public.lesson_evidence_links enable row level security;
alter table public.lobby_group_artifacts enable row level security;
revoke all on public.lesson_reviews,public.lesson_evidence_reviews,public.lesson_evidence_links,public.lobby_group_artifacts from public,anon,authenticated;
grant select,insert,update,delete on public.lesson_reviews,public.lesson_evidence_reviews,public.lesson_evidence_links,public.lobby_group_artifacts to service_role;

-- Legacy reviews are reconstructed only where the OLD lesson-specific rule
-- recorded a real teacher action; never use the unit-wide queue's broad cutoff.
insert into public.lesson_reviews(user_id,lesson_id,submission_id,reviewer_email,reviewed_at)
select s.user_id::text,s.lesson_id,s.id,coalesce(a.reviewer,'legacy-review'),a.at
from public.lesson_submissions s
cross join lateral (
 select reviewer,at from (
  select m.rated_by as reviewer,m.observed_at as at
  from public.mastery_records m join public.learning_targets t on t.id=m.target_id
  where m.user_id=s.user_id and m.observed_at>s.submitted_at
    and (t.lesson_id=s.lesson_id::text or exists (
     select 1 from public.lessons l cross join lateral jsonb_array_elements(coalesce(l.content_blocks->'blocks','[]')) b
     where l.id=s.lesson_id and (b->>'targetId' in (t.slug,t.id::text) or coalesce(b->'targetIds','[]') ? t.slug or coalesce(b->'targetIds','[]') ? t.id::text)
    ))
  union all
  select 'legacy-gradebook',g.graded_at from public.gradebook_entries g
  where g.user_id=s.user_id and g.item_type='lesson' and g.item_id=s.lesson_id::text and g.graded_at>s.submitted_at
 ) actions order by at limit 1
) a where s.review_policy='legacy'
on conflict(submission_id) do nothing;

create or replace function public.capture_lesson_submission()
returns trigger language plpgsql security invoker set search_path=pg_catalog,public as $$
declare prior_id uuid; supplied boolean := new.content_snapshot is not null;
begin
 perform pg_advisory_xact_lock(hashtextextended(new.user_id::text || ':' || new.lesson_id::text,0));
 if supplied then
  select id into prior_id from public.lesson_submissions where user_id=new.user_id and lesson_id=new.lesson_id order by submitted_at desc,id desc limit 1;
  if prior_id is not null and not exists(select 1 from public.lesson_reviews where submission_id=prior_id) then
   raise exception 'lesson locked: pending review' using errcode='P0001';
  end if;
  if exists(select 1 from public.block_drafts d where d.user_id::text=new.user_id::text and d.lesson_id=new.lesson_id
    and exists(select 1 from jsonb_array_elements(coalesce(new.content_snapshot->'blocks','[]')) b where b->>'id'=d.block_id)) then
   raise exception 'save changed draft answers before submitting' using errcode='P0001';
  end if;
 end if;
 new.review_policy := case when supplied then 'explicit' else 'legacy' end;
 if new.content_snapshot is null then select content_blocks into new.content_snapshot from public.lessons where id=new.lesson_id; end if;
 new.submitted_at := clock_timestamp();
 select coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) into new.response_snapshot from (
  select distinct on (br.block_id) br.id,br.lesson_id,br.block_id,br.block_type,br.response,br.created_at,
   br.response_mode,br.scaffolds_used,br.evidence_source,br.confidence,br.role,br.target_id
  from public.block_responses br where br.user_id=new.user_id and br.lesson_id=new.lesson_id
   and coalesce(br.evidence_source,'lesson_checkpoint') not in ('lobby','live_poll')
   and exists(select 1 from jsonb_array_elements(coalesce(new.content_snapshot->'blocks','[]')) b where b->>'id'=br.block_id)
  order by br.block_id,br.created_at desc,br.id desc
 ) r;
 return new;
end $$;
revoke all on function public.capture_lesson_submission() from public,anon,authenticated;
grant execute on function public.capture_lesson_submission() to service_role;
drop trigger if exists capture_lesson_submission on public.lesson_submissions;
create trigger capture_lesson_submission before insert on public.lesson_submissions for each row execute function public.capture_lesson_submission();

create or replace function public.guard_lesson_answer_write()
returns trigger language plpgsql security invoker set search_path=pg_catalog,public as $$
declare pending record;
begin
 if new.lesson_id is null then return new; end if;
 if tg_table_name='block_responses' and (to_jsonb(new)->>'evidence_source') in ('lobby','live_poll') then return new; end if;
 perform pg_advisory_xact_lock(hashtextextended(new.user_id::text || ':' || new.lesson_id::text,0));
 select id,review_policy into pending from public.lesson_submissions where user_id::text=new.user_id::text and lesson_id=new.lesson_id order by submitted_at desc,id desc limit 1;
 if pending.id is not null and pending.review_policy='explicit' and not exists(select 1 from public.lesson_reviews where submission_id=pending.id) then
  raise exception 'lesson locked: pending review' using errcode='P0001';
 end if;
 return new;
end $$;
revoke all on function public.guard_lesson_answer_write() from public,anon,authenticated;
grant execute on function public.guard_lesson_answer_write() to service_role;
drop trigger if exists guard_lesson_answer_write on public.block_responses;
create trigger guard_lesson_answer_write before insert or update on public.block_responses for each row execute function public.guard_lesson_answer_write();
drop trigger if exists guard_lesson_draft_write on public.block_drafts;
create trigger guard_lesson_draft_write before insert or update on public.block_drafts for each row execute function public.guard_lesson_answer_write();

create or replace function public.submit_lobby_group_artifact(p_session_id uuid,p_user_id text,p_response jsonb,p_block_type text)
returns jsonb language plpgsql security invoker set search_path=pg_catalog,public as $$
declare sess record; member record; mate record; artifact_block text; existing_id uuid; idx integer := 0; roles text[] := array['Facilitator','Skeptic','Recorder','Reporter']; stamp timestamptz:=clock_timestamp();
begin
 select * into sess from public.lobby_sessions where id=p_session_id for update;
 if not found or sess.status<>'open' then raise exception 'group task is not open'; end if;
 select * into member from public.lobby_members where session_id=p_session_id and user_id::text=p_user_id;
 if not found or member.group_id is null or member.phrase_completed_at is null then raise exception 'complete your group passphrase first'; end if;
 if not exists(select 1 from public.course_students where course_id=sess.course_id and student_id::text=p_user_id) then raise exception 'not enrolled'; end if;
 perform 1 from public.lobby_groups where id=member.group_id and session_id=p_session_id for update;
 if not found then raise exception 'group not found'; end if;
 if p_response is null or jsonb_typeof(p_response)<>'object' or p_response='{}'::jsonb then raise exception 'artifact required'; end if;
 artifact_block := 'lobby:' || p_session_id::text || ':' || coalesce(sess.block_id,'group');
 insert into public.lobby_group_artifacts(group_id,session_id,response,submitted_by,updated_at)
 values(member.group_id,p_session_id,p_response,p_user_id,stamp)
 on conflict(group_id) do update set response=excluded.response,submitted_by=excluded.submitted_by,updated_at=excluded.updated_at;
 for mate in select lm.user_id,lm.user_email from public.lobby_members lm
   join public.course_students cs on cs.student_id=lm.user_id and cs.course_id=sess.course_id
   where lm.session_id=p_session_id and lm.group_id=member.group_id order by lm.joined_at,lm.user_id
 loop
  select id into existing_id from public.block_responses where session_id=p_session_id and user_id=mate.user_id and block_id=artifact_block order by created_at desc limit 1;
  if existing_id is null then
   insert into public.block_responses(user_id,user_email,session_id,lesson_id,block_id,block_type,response,target_id,evidence_source,role,created_at)
   values(mate.user_id,mate.user_email,p_session_id,sess.lesson_id,artifact_block,'lobby_' || p_block_type,p_response,sess.target_id,'lobby',roles[(idx%4)+1],stamp);
  else
   update public.block_responses set response=p_response,target_id=sess.target_id,evidence_source='lobby',role=roles[(idx%4)+1],created_at=stamp where id=existing_id;
   -- An amended shared artifact needs a fresh explicit evidence review.
   delete from public.lesson_evidence_reviews where response_id=existing_id;
  end if;
  idx:=idx+1;
 end loop;
 return jsonb_build_object('ok',true,'members',idx,'updated_at',stamp);
end $$;
revoke all on function public.submit_lobby_group_artifact(uuid,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.submit_lobby_group_artifact(uuid,text,jsonb,text) to service_role;
