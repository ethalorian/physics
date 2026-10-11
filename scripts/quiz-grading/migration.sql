-- Quiz assignments and immutable evidence. NextAuth server routes are the only
-- public access boundary; browser database roles receive no table/RPC grants.
create table public.quiz_assignments (
 id uuid primary key, course_id uuid not null references public.courses(id), created_by text not null,
 title text not null check(length(title) between 1 and 160), kind text not null check(kind in ('vocabulary','understanding','mixed')),
 instructions text not null default '' check(length(instructions)<=3000), grade_mode text not null check(grade_mode in ('numeric','letter','credit')),
 questions jsonb not null check(jsonb_typeof(questions)='array' and jsonb_array_length(questions)<=30),
 student_ids uuid[], due_at timestamptz, status text not null check(status in ('draft','published','archived')),
 source_quiz_id uuid references public.quiz_assignments(id), version integer not null default 1,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index quiz_assignments_course on public.quiz_assignments(course_id,created_at desc);
create table public.quiz_work (
 quiz_id uuid not null references public.quiz_assignments(id),user_id uuid not null references public.students(id),
 answers jsonb not null default '{}' check(jsonb_typeof(answers)='object'),
 state text not null default 'in_progress' check(state in ('in_progress','submitted','returned','graded')),
 version integer not null default 0,submission_id uuid,updated_at timestamptz not null default now(),primary key(quiz_id,user_id)
);
create index quiz_work_user on public.quiz_work(user_id,quiz_id);
create table public.quiz_submissions (
 id uuid primary key,quiz_id uuid not null,user_id uuid not null,answers jsonb not null,snapshot jsonb not null,submitted_at timestamptz not null default now(),
 foreign key(quiz_id,user_id) references public.quiz_work(quiz_id,user_id)
);
create index quiz_submissions_work on public.quiz_submissions(quiz_id,user_id,submitted_at desc);
alter table public.quiz_work add foreign key(submission_id) references public.quiz_submissions(id);
create index quiz_work_submission on public.quiz_work(submission_id) where submission_id is not null;
create table public.quiz_reviews (
 id uuid primary key,submission_id uuid not null unique references public.quiz_submissions(id),reviewer_email text not null,
 decision text not null check(decision in ('graded','returned')),scores jsonb not null default '{}',ratings jsonb not null default '{}',question_notes jsonb not null default '{}',
 note text not null check(length(btrim(note)) between 1 and 3000),earned numeric,possible numeric,
 grade_mode text not null check(grade_mode in ('numeric','letter','credit')),grade_value text,reviewed_at timestamptz not null default now(),
 check(jsonb_typeof(scores)='object' and jsonb_typeof(ratings)='object' and jsonb_typeof(question_notes)='object'),
 check((decision='returned' and earned is null and possible is null and grade_value is null and ratings='{}' and scores='{}') or
 (decision='graded' and earned>=0 and possible>0 and earned<=possible and ((grade_mode='numeric' and grade_value is null) or (grade_mode='letter' and grade_value in ('A+','A','A−','B+','B','B−','C+','C','C−','D+','D','D−','F')) or (grade_mode='credit' and grade_value in ('credit','no_credit')))))
);
alter table public.quiz_assignments enable row level security;
alter table public.quiz_work enable row level security;
alter table public.quiz_submissions enable row level security;
alter table public.quiz_reviews enable row level security;
revoke all on public.quiz_assignments,public.quiz_work,public.quiz_submissions,public.quiz_reviews from public,anon,authenticated,service_role;
grant select,insert,update on public.quiz_assignments,public.quiz_work to service_role;
grant select,insert on public.quiz_submissions,public.quiz_reviews to service_role;

create table public.quiz_review_drafts (
 submission_id uuid primary key references public.quiz_submissions(id),reviewer_email text not null,payload jsonb not null,version integer not null default 1,updated_at timestamptz not null default now()
);
alter table public.quiz_review_drafts enable row level security;
revoke all on public.quiz_review_drafts from public,anon,authenticated,service_role;
grant select,insert,update on public.quiz_review_drafts to service_role;

create function public.save_quiz_assignment(p_quiz jsonb,p_actor text,p_owner text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.quiz_assignments;c public.courses;q jsonb;ids text[]:='{}'; audience uuid[];v integer;
begin
 select * into c from public.courses where id=(p_quiz->>'course_id')::uuid and lower(teacher_email)=lower(p_owner) and archived_at is null for share;
 if not found then raise exception 'Choose your own active class.';end if;
 if p_quiz->>'status' not in ('draft','published') or p_quiz->>'grade_mode' not in ('numeric','letter','credit') or p_quiz->>'kind' not in ('vocabulary','understanding','mixed') then raise exception 'Invalid quiz settings.';end if;
 if jsonb_typeof(p_quiz->'questions') is distinct from 'array' or jsonb_array_length(p_quiz->'questions')>30 or (p_quiz->>'status'='published' and jsonb_array_length(p_quiz->'questions')<1) then raise exception 'Add 1–30 questions before publishing.';end if;
 for q in select value from jsonb_array_elements(p_quiz->'questions') loop
  if (q->>'id')::uuid is null or q->>'id'=any(ids) or q->>'kind' not in ('choice','written','problem') or (q->>'points')::numeric not between 1 and 20 or (q->>'points')::numeric<>trunc((q->>'points')::numeric) then raise exception 'Invalid quiz question.';end if;
  ids:=array_append(ids,q->>'id');
  if coalesce(q->>'target_id','')<>'' and not exists(select 1 from public.learning_targets where id=(q->>'target_id')::uuid and coalesce(program,'physics')=coalesce(c.program,'physics') and not exclude_from_growth) then raise exception 'Choose targets from this class curriculum.';end if;
  if p_quiz->>'status'='published' then
   if coalesce(btrim(q->>'prompt'),'')='' or coalesce(btrim(q->>'guide'),'')='' or coalesce(q->>'target_id','')='' then raise exception 'Complete the prompt, answer guide and target for every question.';end if;
   if q->>'kind'='choice' and (jsonb_typeof(q->'options') is distinct from 'array' or jsonb_array_length(q->'options') not between 2 and 6 or coalesce((q->>'correct_index')::integer,-1) not between 0 and jsonb_array_length(q->'options')-1) then raise exception 'Complete the choices and answer key.';end if;
  end if;
 end loop;
 if p_quiz->'student_ids' is distinct from 'null'::jsonb then
  if jsonb_typeof(p_quiz->'student_ids') is distinct from 'array' or jsonb_array_length(p_quiz->'student_ids')<1 then raise exception 'Choose a class audience.';end if;
  audience:=array(select distinct value::uuid from jsonb_array_elements_text(p_quiz->'student_ids'));
  if exists(select 1 from unnest(audience) audience_row(student_id) where not exists(select 1 from public.course_students cs where cs.course_id=c.id and cs.student_id=audience_row.student_id and cs.enrollment_state='ACTIVE')) then raise exception 'Choose active students in this class.';end if;
 end if;
 if p_quiz->>'source_quiz_id' is not null and not exists(select 1 from public.quiz_assignments where id=(p_quiz->>'source_quiz_id')::uuid and course_id=c.id) then raise exception 'Reassessments must stay in the same class.';end if;
 v:=(p_quiz->>'version')::integer;
 perform pg_advisory_xact_lock(hashtextextended(p_quiz->>'id',0));
 select * into a from public.quiz_assignments where id=(p_quiz->>'id')::uuid for update;
 if found then
  if a.course_id=c.id and a.version=v+1 and a.title=p_quiz->>'title' and a.kind=p_quiz->>'kind' and a.instructions=p_quiz->>'instructions' and a.grade_mode=p_quiz->>'grade_mode' and a.questions=p_quiz->'questions' and a.student_ids is not distinct from audience and a.due_at is not distinct from (p_quiz->>'due_at')::timestamptz and a.status=p_quiz->>'status' and a.source_quiz_id is not distinct from (p_quiz->>'source_quiz_id')::uuid then return to_jsonb(a);end if;
  if a.course_id<>c.id or a.status<>'draft' or a.version<>v then raise exception 'This quiz changed or was published. Reload it; published questions stay fixed.';end if;
  update public.quiz_assignments set title=p_quiz->>'title',kind=p_quiz->>'kind',instructions=p_quiz->>'instructions',grade_mode=p_quiz->>'grade_mode',questions=p_quiz->'questions',student_ids=audience,due_at=(p_quiz->>'due_at')::timestamptz,status=p_quiz->>'status',source_quiz_id=(p_quiz->>'source_quiz_id')::uuid,version=version+1,updated_at=now() where id=a.id returning * into a;
 else
  if v<>0 then raise exception 'Quiz unavailable.';end if;
  insert into public.quiz_assignments(id,course_id,created_by,title,kind,instructions,grade_mode,questions,student_ids,due_at,status,source_quiz_id)
  values((p_quiz->>'id')::uuid,c.id,p_actor,p_quiz->>'title',p_quiz->>'kind',p_quiz->>'instructions',p_quiz->>'grade_mode',p_quiz->'questions',audience,(p_quiz->>'due_at')::timestamptz,p_quiz->>'status',(p_quiz->>'source_quiz_id')::uuid) returning * into a;
 end if;
 return to_jsonb(a);
end $$;

create function public.quiz_student_action(p_quiz uuid,p_user uuid,p_action text,p_answers jsonb,p_version integer,p_request uuid)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.quiz_assignments;w public.quiz_work;s public.quiz_submissions;q jsonb;e record;k text;
begin
 select * into a from public.quiz_assignments where id=p_quiz and status='published' for share;
 if not found or (a.student_ids is not null and not p_user=any(a.student_ids)) or not exists(select 1 from public.course_students cs join public.courses c on c.id=cs.course_id join public.students st on st.id=cs.student_id where cs.course_id=a.course_id and cs.student_id=p_user and cs.enrollment_state='ACTIVE' and st.is_active is not false and c.archived_at is null) then raise exception 'This quiz is unavailable.';end if;
 if p_action not in ('save','submit') or p_request is null or p_version<0 then raise exception 'Invalid quiz action.';end if;
 if jsonb_typeof(p_answers) is distinct from 'object' or octet_length(p_answers::text)>800000 then raise exception 'Invalid answers.';end if;
 for e in select * from jsonb_each(p_answers) loop
  select value into q from jsonb_array_elements(a.questions) where value->>'id'=e.key;
  if not found then raise exception 'Answer does not belong to this quiz.';end if;
  if q->>'kind'='problem' then
   if jsonb_typeof(e.value) is distinct from 'object' or exists(select 1 from jsonb_object_keys(e.value) key where key not in ('model','plan','work','answer')) then raise exception 'Invalid problem response.';end if;
   foreach k in array array['model','plan','work','answer'] loop
    if jsonb_typeof(e.value->k) is distinct from 'string' or length(e.value->>k)>10000 or (p_action='submit' and btrim(e.value->>k)='') then raise exception 'Complete Model, Plan, Work and Answer.';end if;
   end loop;
  else
   if jsonb_typeof(e.value) is distinct from 'string' or length(e.value#>>'{}')>10000 or (p_action='submit' and btrim(e.value#>>'{}')='') then raise exception 'Add a response to every question.';end if;
   if q->>'kind'='choice' and e.value#>>'{}'<>'' and not exists(select 1 from jsonb_array_elements(q->'options') with ordinality o where (o.ordinality-1)::text=e.value#>>'{}') then raise exception 'Choose an available answer.';end if;
  end if;
 end loop;
 insert into public.quiz_work(quiz_id,user_id) values(a.id,p_user) on conflict do nothing;
 select * into w from public.quiz_work where quiz_id=a.id and user_id=p_user for update;
 if p_action='submit' then
  select * into s from public.quiz_submissions where id=p_request;
  if found then
   if s.quiz_id<>a.id or s.user_id<>p_user or s.answers<>p_answers then raise exception 'Submission request changed.';end if;
   return to_jsonb(w);
  end if;
 end if;
 if w.version<>p_version then raise exception 'Your work changed in another window. Keep a copy of your answers, then reload.';end if;
 if w.state not in ('in_progress','returned') then raise exception 'This quiz is already submitted.';end if;
 if p_action='submit' then
  if exists(select 1 from jsonb_array_elements(a.questions) question_row(value) where not p_answers ? (question_row.value->>'id')) then raise exception 'Answer every question before submitting.';end if;
  insert into public.quiz_submissions(id,quiz_id,user_id,answers,snapshot) values(p_request,a.id,p_user,p_answers,to_jsonb(a));
 end if;
 update public.quiz_work set answers=p_answers,state=case when p_action='submit' then 'submitted' else w.state end,submission_id=case when p_action='submit' then p_request else w.submission_id end,version=version+1,updated_at=now() where quiz_id=a.id and user_id=p_user returning * into w;
 return to_jsonb(w);
end $$;

create function public.review_quiz_submission(p_submission uuid,p_request uuid,p_actor text,p_owner text,p_decision text,p_scores jsonb,p_ratings jsonb,p_note text,p_question_notes jsonb,p_grade_value text,p_draft_version integer default 0)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.quiz_assignments;w public.quiz_work;s public.quiz_submissions;r public.quiz_reviews;q jsonb;e record;earned numeric:=0;possible numeric:=0;score numeric;
begin
 select * into s from public.quiz_submissions where id=p_submission;
 if not found then raise exception 'Submission unavailable.';end if;
 select a0.* into a from public.quiz_assignments a0 join public.courses c on c.id=a0.course_id where a0.id=s.quiz_id and lower(c.teacher_email)=lower(p_owner) and c.archived_at is null for share of a0;
 if not found or not exists(select 1 from public.course_students where course_id=a.course_id and student_id=s.user_id and enrollment_state='ACTIVE') then raise exception 'Student is not in your class.';end if;
 select * into w from public.quiz_work where quiz_id=a.id and user_id=s.user_id for update;
 select * into r from public.quiz_reviews where id=p_request;
 if found then
  if r.submission_id<>s.id or r.reviewer_email<>p_actor or r.decision<>p_decision or r.scores<>p_scores or r.ratings<>p_ratings or r.note<>p_note or r.question_notes<>p_question_notes or r.grade_value is distinct from p_grade_value then raise exception 'Review request changed.';end if;
  return to_jsonb(r);
 end if;
 if coalesce((select version from public.quiz_review_drafts where submission_id=s.id),0)<>p_draft_version then raise exception 'The review draft changed in another window. Reload before returning the grade.';end if;
 if w.state<>'submitted' or w.submission_id<>s.id then raise exception 'This attempt has already been reviewed. Reload the roster.';end if;
 if p_decision not in ('graded','returned') or p_note is null or length(btrim(p_note)) not between 1 and 3000 or jsonb_typeof(p_scores) is distinct from 'object' or jsonb_typeof(p_ratings) is distinct from 'object' or jsonb_typeof(p_question_notes) is distinct from 'object' then raise exception 'Add feedback and complete this review.';end if;
 for e in select * from jsonb_each(p_question_notes) loop
  if jsonb_typeof(e.value)<>'string' or length(e.value#>>'{}')>2000 or not exists(select 1 from jsonb_array_elements(s.snapshot->'questions') question_row(value) where question_row.value->>'id'=e.key) then raise exception 'Invalid question feedback.';end if;
 end loop;
 if p_decision='returned' then
  if p_ratings<>'{}' or p_scores<>'{}' or p_grade_value is not null then raise exception 'Request revision without grades or mastery ratings.';end if;
  earned:=null;possible:=null;
 else
  if exists(select 1 from jsonb_each(p_ratings) rating_row where rating_row.value not in ('null'::jsonb,'1'::jsonb,'2'::jsonb,'3'::jsonb) or not exists(select 1 from jsonb_array_elements(s.snapshot->'questions') question_row(value) where question_row.value->>'target_id'=rating_row.key)) then raise exception 'Rate assessed targets using 1–3 or not enough evidence.';end if;
  if exists(select 1 from jsonb_each(p_scores) rating_row where not exists(select 1 from jsonb_array_elements(s.snapshot->'questions') question_row(value) where question_row.value->>'id'=rating_row.key and question_row.value->>'kind'<>'choice')) then raise exception 'Automatic question scores cannot be changed.';end if;
  for q in select value from jsonb_array_elements(s.snapshot->'questions') loop
   if not p_ratings ? (q->>'target_id') then raise exception 'Make a mastery decision for every assessed target.';end if;
   possible:=possible+(q->>'points')::numeric;
   if q->>'kind'='choice' then score:=case when s.answers->>(q->>'id')=q->>'correct_index' then (q->>'points')::numeric else 0 end;
   else
    if jsonb_typeof(p_scores->(q->>'id')) is distinct from 'number' then raise exception 'Score every written response.';end if;
    score:=(p_scores->>(q->>'id'))::numeric;
    if score<0 or score>(q->>'points')::numeric or score*2<>trunc(score*2) then raise exception 'Invalid written score.';end if;
   end if;
   earned:=earned+score;
  end loop;
  if (a.grade_mode='numeric' and p_grade_value is not null) or (a.grade_mode='letter' and (p_grade_value is null or p_grade_value not in ('A+','A','A−','B+','B','B−','C+','C','C−','D+','D','D−','F'))) or (a.grade_mode='credit' and (p_grade_value is null or p_grade_value not in ('credit','no_credit'))) then raise exception 'Choose the quiz grade.';end if;
 end if;
 insert into public.quiz_reviews(id,submission_id,reviewer_email,decision,scores,ratings,note,question_notes,earned,possible,grade_mode,grade_value)
 values(p_request,s.id,p_actor,p_decision,p_scores,p_ratings,p_note,p_question_notes,earned,possible,a.grade_mode,p_grade_value) returning * into r;
 if p_decision='graded' then
  insert into public.mastery_records(user_id,user_email,target_id,level,rated_by,evidence_source)
  select s.user_id,st.email,rating_row.key::uuid,(rating_row.value::text)::smallint,p_actor,'Quiz: '||(s.snapshot->>'title')||' · submission '||s.id::text from jsonb_each(p_ratings) rating_row cross join public.students st where st.id=s.user_id and rating_row.value<>'null'::jsonb;
 end if;
 update public.quiz_work set state=p_decision,version=version+1,updated_at=now() where quiz_id=a.id and user_id=s.user_id;
 return to_jsonb(r);
end $$;

revoke all on function public.save_quiz_assignment(jsonb,text,text),public.quiz_student_action(uuid,uuid,text,jsonb,integer,uuid),public.review_quiz_submission(uuid,uuid,text,text,text,jsonb,jsonb,text,jsonb,text,integer) from public,anon,authenticated;
grant execute on function public.save_quiz_assignment(jsonb,text,text),public.quiz_student_action(uuid,uuid,text,jsonb,integer,uuid),public.review_quiz_submission(uuid,uuid,text,text,text,jsonb,jsonb,text,jsonb,text,integer) to service_role;

create function public.save_quiz_review_draft(p_submission uuid,p_actor text,p_owner text,p_payload jsonb,p_version integer)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare s public.quiz_submissions;a public.quiz_assignments;w public.quiz_work;d public.quiz_review_drafts;e record;q jsonb;
begin
 select * into s from public.quiz_submissions where id=p_submission;
 if not found then raise exception 'Submission unavailable.';end if;
 select a0.* into a from public.quiz_assignments a0 join public.courses c on c.id=a0.course_id where a0.id=s.quiz_id and lower(c.teacher_email)=lower(p_owner) and c.archived_at is null for share of a0;
 if not found or not exists(select 1 from public.course_students where course_id=a.course_id and student_id=s.user_id and enrollment_state='ACTIVE') then raise exception 'Student is not in your class.';end if;
 select * into w from public.quiz_work where quiz_id=a.id and user_id=s.user_id for update;
 if w.state<>'submitted' or w.submission_id<>s.id then raise exception 'This attempt has already been reviewed.';end if;
 if jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text)>100000 or jsonb_typeof(p_payload->'scores') is distinct from 'object' or jsonb_typeof(p_payload->'ratings') is distinct from 'object' or jsonb_typeof(p_payload->'question_notes') is distinct from 'object' or jsonb_typeof(p_payload->'note') is distinct from 'string' or length(p_payload->>'note')>3000 then raise exception 'Invalid review draft.';end if;
 for e in select * from jsonb_each(p_payload->'scores') loop
  select value into q from jsonb_array_elements(s.snapshot->'questions') where value->>'id'=e.key and value->>'kind'<>'choice';
  if not found or jsonb_typeof(e.value)<>'number' then raise exception 'Invalid draft score.';end if;
  if (e.value::text)::numeric<0 or (e.value::text)::numeric>(q->>'points')::numeric or (e.value::text)::numeric*2<>trunc((e.value::text)::numeric*2) then raise exception 'Invalid draft score.';end if;
 end loop;
 if exists(select 1 from jsonb_each(p_payload->'ratings') rating_row where rating_row.value not in ('null'::jsonb,'1'::jsonb,'2'::jsonb,'3'::jsonb) or not exists(select 1 from jsonb_array_elements(s.snapshot->'questions') question_row(value) where question_row.value->>'target_id'=rating_row.key)) then raise exception 'Invalid draft mastery decision.';end if;
 for e in select * from jsonb_each(p_payload->'question_notes') loop
  if jsonb_typeof(e.value)<>'string' or length(e.value#>>'{}')>2000 or not exists(select 1 from jsonb_array_elements(s.snapshot->'questions') question_row(value) where question_row.value->>'id'=e.key) then raise exception 'Invalid question feedback.';end if;
 end loop;
 select * into d from public.quiz_review_drafts where submission_id=s.id for update;
 if found then
  if d.version=p_version+1 and d.payload=p_payload and d.reviewer_email=p_actor then return to_jsonb(d);end if;
  if d.version<>p_version then raise exception 'Review draft changed in another window. Reload before saving.';end if;
  update public.quiz_review_drafts set payload=p_payload,reviewer_email=p_actor,version=version+1,updated_at=now() where submission_id=s.id returning * into d;
 else
  if p_version<>0 then raise exception 'Review draft unavailable.';end if;
  insert into public.quiz_review_drafts(submission_id,reviewer_email,payload) values(s.id,p_actor,p_payload) returning * into d;
 end if;
 return to_jsonb(d);
end $$;
revoke all on function public.save_quiz_review_draft(uuid,text,text,jsonb,integer) from public,anon,authenticated;
grant execute on function public.save_quiz_review_draft(uuid,text,text,jsonb,integer) to service_role;

CREATE INDEX IF NOT EXISTS quiz_assignments_source_quiz ON public.quiz_assignments(source_quiz_id);
