-- Vocabulary evidence contributes only through an explicit teacher judgment.
-- Canonical grades remain append-only mastery_records; this table is the audit trail.
create table public.vocab_mastery_reviews (
  id uuid primary key,
  task_id uuid not null references public.vocab_tasks(id),
  user_id uuid not null references public.students(id),
  target_id uuid not null references public.learning_targets(id),
  reviewer_email text not null,
  level smallint not null check (level between 1 and 3),
  note text not null default '' check (length(note) <= 2000),
  evidence_key text not null,
  evidence jsonb not null,
  record_id uuid not null unique references public.mastery_records(id),
  created_at timestamptz not null default clock_timestamp()
);
create index vocab_mastery_reviews_latest on public.vocab_mastery_reviews(task_id,user_id,target_id,created_at desc);
create index vocab_mastery_reviews_user on public.vocab_mastery_reviews(user_id);
create index vocab_mastery_reviews_target on public.vocab_mastery_reviews(target_id);
alter table public.vocab_mastery_reviews enable row level security;
revoke all on public.vocab_mastery_reviews from public,anon,authenticated;
grant select,insert on public.vocab_mastery_reviews to service_role;

create function public.submit_vocab_mastery_review(
  p_id uuid, p_task uuid, p_user uuid, p_target uuid, p_reviewer text,
  p_level smallint, p_note text, p_evidence_key text, p_previous uuid
) returns jsonb language plpgsql security invoker set search_path=pg_catalog,public as $$
declare task public.vocab_tasks; prior public.vocab_mastery_reviews;
  latest uuid; evidence jsonb; fingerprint text; rec uuid; result public.vocab_mastery_reviews;
begin
  -- Serialize both request retries and parallel reviews of the same assignment.
  perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
  select * into task from public.vocab_tasks where id=p_task for update;
  if not found or not exists(select 1 from public.courses c where c.id=task.course_id and c.teacher_email=p_reviewer and c.archived_at is null)
    or not (p_user=any(task.student_ids))
    or not exists(select 1 from public.course_students cs where cs.course_id=task.course_id and cs.student_id=p_user and cs.enrollment_state='ACTIVE')
    then raise exception 'Student is not assigned in your active class.'; end if;
  select * into prior from public.vocab_mastery_reviews where id=p_id;
  if found then
    if prior.task_id<>p_task or prior.user_id<>p_user or prior.target_id<>p_target or prior.reviewer_email<>p_reviewer or prior.level<>p_level or prior.note is distinct from p_note then raise exception 'Review identifier conflict. Refresh before rating again.'; end if;
    return to_jsonb(prior)-'evidence';
  end if;
  if task.target_id is distinct from p_target or not exists(
    select 1 from public.learning_targets t join public.courses c on c.id=task.course_id
    where t.id=p_target and t.domain='knowledge' and coalesce(t.program,'physics')=coalesce(c.program,'physics')
  ) then raise exception 'The linked Knowledge target changed. Refresh before rating.'; end if;
  if p_level is null or p_level not between 1 and 3 or p_note is null or length(p_note)>2000 then raise exception 'Choose a rating from 1 to 3 and a note up to 2000 characters.'; end if;
  -- Share locks keep a simultaneous quiz review from changing the saved snapshot.
  perform id from public.vocab_checks where task_id=p_task and user_id=p_user and completed_at is not null order by id for share;
  select string_agg(id::text||':'||coalesce(review_version,0)::text,',' order by id),
    jsonb_agg(jsonb_build_object('id',id,'completed_at',completed_at,'review_version',review_version,'result',vc.result) order by id)
    into fingerprint,evidence from public.vocab_checks vc where task_id=p_task and user_id=p_user and completed_at is not null;
  if fingerprint is null then raise exception 'A completed vocabulary check is required.'; end if;
  if fingerprint is distinct from p_evidence_key then raise exception 'Vocabulary evidence changed. Refresh before rating.'; end if;
  if exists(select 1 from jsonb_array_elements(evidence) c cross join lateral jsonb_array_elements(c->'result') r where r->'correct'='null'::jsonb) then raise exception 'Review the quiz answers before recording mastery.'; end if;
  select id into latest from public.vocab_mastery_reviews where task_id=p_task and user_id=p_user and target_id=p_target order by created_at desc,id desc limit 1;
  if latest is distinct from p_previous then raise exception 'A newer rating was saved. Refresh before rating again.'; end if;
  insert into public.mastery_records(user_id,target_id,level,rated_by,evidence_source)
    values(p_user,p_target,p_level,p_reviewer,'vocabulary: '||task.title) returning id into rec;
  insert into public.vocab_mastery_reviews(id,task_id,user_id,target_id,reviewer_email,level,note,evidence_key,evidence,record_id)
    values(p_id,p_task,p_user,p_target,p_reviewer,p_level,p_note,fingerprint,evidence,rec) returning * into result;
  return to_jsonb(result)-'evidence';
end $$;
revoke all on function public.submit_vocab_mastery_review(uuid,uuid,uuid,uuid,text,smallint,text,text,uuid) from public,anon,authenticated;
grant execute on function public.submit_vocab_mastery_review(uuid,uuid,uuid,uuid,text,smallint,text,text,uuid) to service_role;
