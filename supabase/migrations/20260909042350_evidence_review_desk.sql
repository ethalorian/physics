create table if not exists public.mastery_evidence_reviews (
  id uuid primary key,
  user_id uuid not null references public.students(id),
  target_id uuid not null references public.learning_targets(id),
  lesson_id uuid not null references public.lessons(id),
  reviewer_email text not null,
  evidence jsonb not null check(jsonb_typeof(evidence)='array' and jsonb_array_length(evidence)>0),
  mean numeric not null check(mean between 1 and 3),
  overall_level smallint not null check(overall_level between 1 and 3),
  message text not null,
  record_id uuid not null references public.mastery_records(id),
  feedback_id uuid not null references public.teacher_feedback(id),
  created_at timestamptz not null default now()
);
create index if not exists mastery_evidence_reviews_student_target on public.mastery_evidence_reviews(user_id,target_id,created_at desc);
create index if not exists mastery_evidence_reviews_lesson on public.mastery_evidence_reviews(lesson_id);
create index if not exists mastery_evidence_reviews_record on public.mastery_evidence_reviews(record_id);
create index if not exists mastery_evidence_reviews_feedback on public.mastery_evidence_reviews(feedback_id);
alter table public.mastery_evidence_reviews enable row level security;
revoke all on public.mastery_evidence_reviews from public,anon,authenticated;
grant select,insert on public.mastery_evidence_reviews to service_role;

create or replace function public.submit_mastery_evidence_review(
 p_id uuid,p_user uuid,p_reviewer text,p_target uuid,p_lesson uuid,p_evidence jsonb,p_message text,
 p_submissions uuid[],p_required_targets uuid[]
) returns jsonb language plpgsql security invoker set search_path=pg_catalog,public as $$
declare prior public.mastery_evidence_reviews; score numeric; overall smallint; rec uuid; feedback uuid; sid uuid; e jsonb;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 select * into prior from public.mastery_evidence_reviews where id=p_id;
 if found then
  if prior.user_id<>p_user or prior.target_id<>p_target or prior.lesson_id<>p_lesson or prior.reviewer_email<>p_reviewer then raise exception 'Review identifier conflict';end if;
  return jsonb_build_object('id',prior.id,'level',prior.overall_level,'mean',prior.mean);
 end if;
 if jsonb_typeof(p_evidence)<>'array' or jsonb_array_length(p_evidence) not between 1 and 300 then raise exception 'Invalid evidence';end if;
 for e in select value from jsonb_array_elements(p_evidence) loop
  if not(e ? 'key') or not(e ? 'level') or (e->'level'<>'null'::jsonb and e->'level' not in('1'::jsonb,'2'::jsonb,'3'::jsonb)) then raise exception 'Invalid evidence score';end if;
  if e->'level'='null'::jsonb and length(trim(coalesce(e->>'reason','')))=0 then raise exception 'Exclusion needs a reason';end if;
 end loop;
 if (select count(distinct value->>'key') from jsonb_array_elements(p_evidence))<>jsonb_array_length(p_evidence) then raise exception 'Duplicate evidence';end if;
 select avg((value->>'level')::numeric) into score from jsonb_array_elements(p_evidence) where value->'level'<>'null'::jsonb;
 if score is null then raise exception 'At least one rating required';end if;
 overall:=round(score)::smallint;
 insert into public.mastery_records(user_id,target_id,level,rated_by,evidence_source)
 values(p_user,p_target,overall,p_reviewer,'lesson evidence review') returning id into rec;
 insert into public.teacher_feedback(user_id,teacher_email,target_id,message)
 values(p_user::text,p_reviewer,p_target,p_message) returning id into feedback;
 insert into public.mastery_evidence_reviews(id,user_id,target_id,lesson_id,reviewer_email,evidence,mean,overall_level,message,record_id,feedback_id)
 values(p_id,p_user,p_target,p_lesson,p_reviewer,p_evidence,score,overall,p_message,rec,feedback);
 -- Close a lesson submission only after each required target has a committed review of that exact snapshot.
 foreach sid in array coalesce(p_submissions,'{}'::uuid[]) loop
  if cardinality(p_required_targets)>0 and not exists (
   select 1 from unnest(p_required_targets) t(id) where not exists (
    select 1 from public.mastery_evidence_reviews r where r.user_id=p_user and r.target_id=t.id and r.lesson_id=p_lesson
    and exists(select 1 from jsonb_array_elements(r.evidence) w where w->>'submissionId'=sid::text)
   )
  ) then
   insert into public.lesson_reviews(user_id,lesson_id,submission_id,reviewer_email)
   select p_user::text,p_lesson,sid,p_reviewer where exists(select 1 from public.lesson_submissions s where s.id=sid and s.user_id=p_user and s.lesson_id=p_lesson)
   on conflict(submission_id) do nothing;
  end if;
 end loop;
 return jsonb_build_object('id',p_id,'level',overall,'mean',score);
end $$;
revoke all on function public.submit_mastery_evidence_review(uuid,uuid,text,uuid,uuid,jsonb,text,uuid[],uuid[]) from public,anon,authenticated;
grant execute on function public.submit_mastery_evidence_review(uuid,uuid,text,uuid,uuid,jsonb,text,uuid[],uuid[]) to service_role;
-- The legacy bridge must not mark a whole lesson reviewed after just one new target review.
do $$
declare definition text;
begin
 if to_regprocedure('public.bridge_legacy_lesson_review()') is not null then
  select pg_get_functiondef('public.bridge_legacy_lesson_review()'::regprocedure) into definition;
  if position('lesson evidence review' in definition)=0 then
   definition:=replace(definition,'if tg_table_name=''mastery_records'' then','if tg_table_name=''mastery_records'' and event->>''evidence_source''=''lesson evidence review'' then return new; end if; if tg_table_name=''mastery_records'' then');
   execute definition;
  end if;
 end if;
end $$;
