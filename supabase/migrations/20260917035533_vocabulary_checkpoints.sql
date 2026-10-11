-- Extend the existing quiz format without changing or deleting existing assignments.
alter table public.vocab_tasks drop constraint vocab_tasks_quiz_format_check;
alter table public.vocab_tasks add constraint vocab_tasks_quiz_format_check
 check (quiz_format in ('multiple_choice','matching','recall','definition','sentence','quiz_game','checkpoint'));
create table public.vocab_checkpoint_blueprints (
 task_id uuid primary key references public.vocab_tasks(id),
 questions jsonb not null check(jsonb_typeof(questions)='array' and jsonb_array_length(questions)=10)
);
create table public.vocab_checkpoint_attempts (
 id uuid primary key default gen_random_uuid(),
 task_id uuid not null references public.vocab_checkpoint_blueprints(task_id),
 user_id uuid not null references public.students(id),
 number integer not null default 1 check(number>0),
 version integer not null default 0,
 questions jsonb not null,
 answers jsonb not null default '{}',
 scores jsonb not null default '{}',
 notes jsonb not null default '{}',
 submitted_at timestamptz,
 released_at timestamptz,
 created_at timestamptz not null default clock_timestamp(),
 unique(task_id,user_id,number)
);
create index vocab_checkpoint_attempts_user on public.vocab_checkpoint_attempts(user_id,task_id);
create table public.vocab_checkpoint_events (
 id uuid primary key default gen_random_uuid(),
 attempt_id uuid not null references public.vocab_checkpoint_attempts(id),
 actor text not null,
 action text not null,
 snapshot jsonb not null,
 created_at timestamptz not null default clock_timestamp()
);
create index vocab_checkpoint_events_attempt on public.vocab_checkpoint_events(attempt_id,created_at);
alter table public.vocab_checkpoint_blueprints enable row level security;
alter table public.vocab_checkpoint_attempts enable row level security;
alter table public.vocab_checkpoint_events enable row level security;
revoke all on public.vocab_checkpoint_blueprints,public.vocab_checkpoint_attempts,public.vocab_checkpoint_events from public,anon,authenticated;
grant select,insert on public.vocab_checkpoint_blueprints,public.vocab_checkpoint_events to service_role;
grant select,insert,update on public.vocab_checkpoint_attempts to service_role;

-- One transaction prevents a visible assignment without its private question snapshot.
create function public.create_vocab_checkpoint(p_tasks jsonb,p_questions jsonb) returns jsonb
language plpgsql security invoker set search_path=pg_catalog,public as $$
declare item jsonb; t public.vocab_tasks; ids jsonb:='[]';
begin
 for item in select value from jsonb_array_elements(p_tasks) loop
  insert into public.vocab_tasks(course_id,target_id,title,assigned_by,student_ids,term_ids,words,due_on,note,threshold,min_checks,check_mode,task_kind,quiz_format)
  select course_id,target_id,title,assigned_by,student_ids,term_ids,words,due_on,note,threshold,min_checks,check_mode,task_kind,quiz_format from jsonb_populate_record(null::public.vocab_tasks,item)
  returning * into t;
  insert into public.vocab_checkpoint_blueprints values(t.id,p_questions);
  ids:=ids||jsonb_build_array(jsonb_build_object('id',t.id));
 end loop;
 return ids;
end $$;
revoke all on function public.create_vocab_checkpoint(jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.create_vocab_checkpoint(jsonb,jsonb) to service_role;

-- Serialize draft saves, submission, review, release and retake creation.
-- A version check makes stale browser tabs fail instead of overwriting work.
create function public.mutate_vocab_checkpoint(p_task uuid,p_user uuid,p_actor text,p_staff boolean,p_action text,p_version integer,p_payload jsonb,p_attempt uuid)
returns jsonb language plpgsql security invoker set search_path=pg_catalog,public as $$
declare t public.vocab_tasks; a public.vocab_checkpoint_attempts; q jsonb; questions jsonb;
 answer text; pts integer; total integer:=0; best integer:=-1; results jsonb:='[]'; qid text; term jsonb;
begin
 select * into t from public.vocab_tasks where id=p_task for update;
 if not found or t.quiz_format is distinct from 'checkpoint' or not t.active
  or not(p_user=any(t.student_ids))
  or not exists(select 1 from public.course_students where course_id=t.course_id and student_id=p_user and enrollment_state='ACTIVE')
  or not exists(select 1 from public.courses where id=t.course_id and archived_at is null and (not p_staff or teacher_email=p_actor))
  or (not p_staff and p_actor<>p_user::text) then raise exception 'Assignment unavailable.'; end if;
 if (p_staff and p_action not in ('score','release','retake')) or (not p_staff and p_action not in ('start','save','submit')) then raise exception 'Action unavailable.'; end if;
 select * into a from public.vocab_checkpoint_attempts where task_id=p_task and user_id=p_user order by number desc limit 1 for update;
 if a.id is null then
  if p_action<>'start' then raise exception 'Start this checkpoint first.'; end if;
  select b.questions into questions from public.vocab_checkpoint_blueprints b where task_id=p_task;
  insert into public.vocab_checkpoint_attempts(task_id,user_id,questions) values(p_task,p_user,questions) returning * into a;
 end if;
 if p_action='start' then return to_jsonb(a); end if;
 if a.id is distinct from p_attempt then raise exception 'A newer attempt is available. Refresh before continuing.'; end if;
 -- A retried final submit/release returns its already committed result.
 if p_action='submit' and a.submitted_at is not null then return to_jsonb(a); end if;
 if p_action='release' and a.released_at is not null then return to_jsonb(a); end if;
 if a.version<>p_version then raise exception 'This checkpoint changed in another tab. Refresh before continuing.'; end if;
 if p_action='retake' then
  if a.released_at is null then raise exception 'Release the current attempt before assigning a reassessment.'; end if;
  if jsonb_array_length(p_payload->'questions')<>10 then raise exception 'A complete reassessment is required.'; end if;
  insert into public.vocab_checkpoint_attempts(task_id,user_id,number,questions) values(p_task,p_user,a.number+1,p_payload->'questions') returning * into a;
 elsif a.released_at is not null then raise exception 'Released grades are locked.';
 elsif p_action in ('save','submit') then
  if a.submitted_at is not null then raise exception 'Submitted answers are locked.'; end if;
  if jsonb_typeof(p_payload->'answers') is distinct from 'object' then raise exception 'Invalid answers.'; end if;
  for qid,answer in select key,value from jsonb_each_text(p_payload->'answers') loop
   select value into q from jsonb_array_elements(a.questions) where value->>'id'=qid;
   if q is null or answer is null or length(answer)>2000 or (q->>'part'<>'explain' and answer<>'' and answer not in ('0','1','2','3')) then raise exception 'Invalid answer.'; end if;
  end loop;
  a.answers:=p_payload->'answers';
  if p_action='submit' then
   for q in select value from jsonb_array_elements(a.questions) loop
    if nullif(trim(a.answers->>(q->>'id')),'') is null then raise exception 'Answer every question before submitting.'; end if;
   end loop;
   a.submitted_at:=clock_timestamp();
   -- Pending evidence enables the existing teacher queue but cannot be mastery-rated.
   if not exists(select 1 from public.vocab_checks where task_id=p_task and user_id=p_user) then
    insert into public.vocab_checks(task_id,user_id,items,result,completed_at)
     values(p_task,p_user,'[]',jsonb_build_array(jsonb_build_object('term_id',t.term_ids[1],'term_ids',to_jsonb(t.term_ids),'correct',null,'response','Checkpoint awaiting scoring and release','supports','[]'::jsonb)),a.submitted_at);
   end if;
  end if;
 elsif p_action='score' then
  if a.submitted_at is null then raise exception 'Wait for a submitted checkpoint.'; end if;
  qid:=p_payload->>'question_id';
  select value into q from jsonb_array_elements(a.questions) where value->>'id'=qid and value->>'part'='explain';
  if q is null or coalesce(p_payload->>'points','') !~ '^[0-4]$' or coalesce(length(p_payload->>'note'),0)>2000 then raise exception 'Choose a score from 0 to 4.'; end if;
  a.scores:=a.scores||jsonb_build_object(qid,(p_payload->>'points')::integer);
  a.notes:=a.notes||jsonb_build_object(qid,coalesce(p_payload->>'note',''));
 elsif p_action='release' then
  if a.submitted_at is null then raise exception 'Wait for a submitted checkpoint.'; end if;
  for q in select value from jsonb_array_elements(a.questions) loop
   qid:=q->>'id';
   if q->>'part'='explain' then
    if coalesce(a.scores->>qid,'') !~ '^[0-4]$' then raise exception 'Score both explanations before releasing.'; end if;
    pts:=(a.scores->>qid)::integer;
   else pts:=case when a.answers->>qid=q->>'answer' then (q->>'points')::integer else 0 end;
   end if;
   total:=total+pts;
   select value into term from jsonb_array_elements(t.words) where lower(value->>'term')=lower(q->'words'->>0) limit 1;
   results:=results||jsonb_build_array(jsonb_build_object('question_id',qid,'term_id',term->>'id','term_ids',(select jsonb_agg(w->>'id') from jsonb_array_elements(t.words) w where exists(select 1 from jsonb_array_elements_text(q->'words') n where lower(n)=lower(w->>'term'))),'term',array_to_string(array(select jsonb_array_elements_text(q->'words')),' · '),'correct',pts=(q->>'points')::integer,'points',pts,'max_points',(q->>'points')::integer,'response',case when q->>'part'='explain' then a.answers->>qid else q->'options'->>((a.answers->>qid)::integer) end,'feedback',concat(q->>'explanation',case when nullif(a.notes->>qid,'') is not null then ' Teacher: '|| (a.notes->>qid) else '' end),'supports','[]'::jsonb));
  end loop;
  select coalesce(sum((r->>'points')::integer),-1) into best from public.vocab_checks c cross join lateral jsonb_array_elements(c.result) r where c.task_id=p_task and c.user_id=p_user;
  if total>=best then
   update public.vocab_checks set result=results,completed_at=a.submitted_at,review_version=review_version+1,reviewed_at=clock_timestamp(),reviewed_by=p_actor where task_id=p_task and user_id=p_user;
  end if;
  a.released_at:=clock_timestamp();
 end if;
 update public.vocab_checkpoint_attempts set answers=a.answers,scores=a.scores,notes=a.notes,submitted_at=a.submitted_at,released_at=a.released_at,version=a.version+1 where id=a.id returning * into a;
 if p_action<>'save' then insert into public.vocab_checkpoint_events(attempt_id,actor,action,snapshot) values(a.id,p_actor,p_action,to_jsonb(a)); end if;
 return to_jsonb(a);
end $$;
revoke all on function public.mutate_vocab_checkpoint(uuid,uuid,text,boolean,text,integer,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.mutate_vocab_checkpoint(uuid,uuid,text,boolean,text,integer,jsonb,uuid) to service_role;
