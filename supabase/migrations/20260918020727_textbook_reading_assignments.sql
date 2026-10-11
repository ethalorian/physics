-- NextAuth-authenticated server routes are the access boundary. No browser
-- role has access to these records or RPCs. Mutations also check class ownership
-- or active enrollment and serialize against the assignment and student work.
create table public.textbook_assignments (
  id uuid primary key,
  course_id uuid not null references public.courses(id),
  created_by text not null,
  title text not null check (length(title) between 1 and 160),
  chapter integer not null check (chapter between 2 and 40),
  reading text not null check (length(reading) between 1 and 500),
  section_ids text[] not null default '{}',
  instructions text not null default '' check (length(instructions)<=3000),
  questions jsonb not null check (jsonb_typeof(questions)='array' and jsonb_array_length(questions) between 1 and 30),
  due_at timestamptz,
  status text not null check (status in ('draft','published','archived')),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index textbook_assignments_course on public.textbook_assignments(course_id,created_at desc);
create table public.textbook_work (
  assignment_id uuid not null references public.textbook_assignments(id),
  user_id uuid not null references public.students(id),
  answers jsonb not null default '{}' check (jsonb_typeof(answers)='object'),
  state text not null default 'in_progress' check (state in ('in_progress','submitted','returned','rated')),
  version integer not null default 0,
  submission_id uuid,
  updated_at timestamptz not null default now(),
  primary key(assignment_id,user_id)
);
create index textbook_work_user on public.textbook_work(user_id,assignment_id);
create table public.textbook_submissions (
  id uuid primary key,
  assignment_id uuid not null,
  user_id uuid not null,
  answers jsonb not null,
  snapshot jsonb not null,
  submitted_at timestamptz not null default now(),
  foreign key(assignment_id,user_id) references public.textbook_work(assignment_id,user_id)
);
create index textbook_submissions_work on public.textbook_submissions(assignment_id,user_id,submitted_at desc);
alter table public.textbook_work add constraint textbook_work_submission_fk foreign key(submission_id) references public.textbook_submissions(id);
create index textbook_work_submission on public.textbook_work(submission_id) where submission_id is not null;
create table public.textbook_reviews (
  id uuid primary key,
  submission_id uuid not null unique references public.textbook_submissions(id),
  reviewer_email text not null,
  decision text not null check (decision in ('rated','returned')),
  ratings jsonb not null default '{}' check (jsonb_typeof(ratings)='object'),
  note text not null default '' check (length(note)<=2000),
  reviewed_at timestamptz not null default now()
);
alter table public.textbook_assignments enable row level security;
alter table public.textbook_work enable row level security;
alter table public.textbook_submissions enable row level security;
alter table public.textbook_reviews enable row level security;
revoke all on public.textbook_assignments,public.textbook_work,public.textbook_submissions,public.textbook_reviews from public,anon,authenticated;
grant all on public.textbook_assignments,public.textbook_work,public.textbook_submissions,public.textbook_reviews to service_role;

create function public.save_textbook_assignment(p_assignment jsonb,p_actor text,p_owner text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.textbook_assignments; c public.courses; q jsonb;
begin
  select * into c from public.courses where id=(p_assignment->>'course_id')::uuid and lower(teacher_email)=lower(p_owner) and archived_at is null for share;
  if not found then raise exception 'This class is unavailable.'; end if;
  if p_assignment->>'status' not in ('draft','published') then raise exception 'Invalid assignment state.'; end if;
  if jsonb_typeof(p_assignment->'questions') is distinct from 'array' or jsonb_array_length(p_assignment->'questions') not between 1 and 30 then raise exception 'Add 1–30 questions.'; end if;
  for q in select value from jsonb_array_elements(p_assignment->'questions') loop
    if not exists(select 1 from public.learning_targets where id=(q->>'target_id')::uuid and coalesce(program,'physics')=coalesce(c.program,'physics') and not exclude_from_growth) then raise exception 'Choose mastery targets from this class curriculum.'; end if;
  end loop;
  -- Serializes first-save retries, too: row locks alone cannot lock a missing row.
  perform pg_advisory_xact_lock(hashtextextended(p_assignment->>'id',0));
  select * into a from public.textbook_assignments where id=(p_assignment->>'id')::uuid for update;
  if found then
    -- Same payload + previous version is an exact retry after a lost response.
    if a.course_id=c.id and a.version=(p_assignment->>'version')::integer+1 and a.title=p_assignment->>'title' and a.chapter=(p_assignment->>'chapter')::integer and a.reading=p_assignment->>'reading' and a.section_ids=array(select jsonb_array_elements_text(p_assignment->'section_ids')) and a.instructions=p_assignment->>'instructions' and a.questions=p_assignment->'questions' and a.due_at is not distinct from (p_assignment->>'due_at')::timestamptz and a.status=p_assignment->>'status' then return to_jsonb(a); end if;
    if a.course_id<>c.id or a.status<>'draft' or a.version<>(p_assignment->>'version')::integer then raise exception 'This assignment changed. Reload it before saving.'; end if;
    update public.textbook_assignments set title=p_assignment->>'title',chapter=(p_assignment->>'chapter')::integer,reading=p_assignment->>'reading',section_ids=array(select jsonb_array_elements_text(p_assignment->'section_ids')),instructions=p_assignment->>'instructions',questions=p_assignment->'questions',due_at=(p_assignment->>'due_at')::timestamptz,status=p_assignment->>'status',version=version+1,updated_at=now() where id=a.id returning * into a;
  else
    if (p_assignment->>'version')::integer<>0 then raise exception 'Assignment unavailable.'; end if;
    insert into public.textbook_assignments(id,course_id,created_by,title,chapter,reading,section_ids,instructions,questions,due_at,status)
    values ((p_assignment->>'id')::uuid,c.id,p_actor,p_assignment->>'title',(p_assignment->>'chapter')::integer,p_assignment->>'reading',array(select jsonb_array_elements_text(p_assignment->'section_ids')),p_assignment->>'instructions',p_assignment->'questions',(p_assignment->>'due_at')::timestamptz,p_assignment->>'status') returning * into a;
  end if;
  return to_jsonb(a);
end $$;

create function public.textbook_student_action(p_assignment uuid,p_user uuid,p_action text,p_answers jsonb,p_version integer,p_request uuid)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.textbook_assignments; w public.textbook_work; s public.textbook_submissions; q jsonb;
begin
  select * into a from public.textbook_assignments where id=p_assignment and status='published' for share;
  if not found or not exists(select 1 from public.course_students cs join public.courses c on c.id=cs.course_id join public.students st on st.id=cs.student_id where cs.course_id=a.course_id and cs.student_id=p_user and cs.enrollment_state='ACTIVE' and st.is_active is not false and c.archived_at is null) then raise exception 'This reading is unavailable.'; end if;
  if p_action not in ('save','submit') then raise exception 'Invalid action.'; end if;
  if jsonb_typeof(p_answers) is distinct from 'object' or octet_length(p_answers::text)>800000 then raise exception 'Invalid answers.'; end if;
  if exists(select 1 from jsonb_each(p_answers) e where jsonb_typeof(e.value)<>'string' or length(e.value#>>'{}')>10000 or not exists(select 1 from jsonb_array_elements(a.questions) aq where aq->>'id'=e.key)) then raise exception 'Answers do not match this reading.'; end if;
  insert into public.textbook_work(assignment_id,user_id) values(a.id,p_user) on conflict do nothing;
  select * into w from public.textbook_work where assignment_id=a.id and user_id=p_user for update;
  if p_action='submit' then
    select * into s from public.textbook_submissions where id=p_request;
    if found then
      if s.assignment_id<>a.id or s.user_id<>p_user or s.answers<>p_answers then raise exception 'Submission request changed.'; end if;
      return to_jsonb(w);
    end if;
  end if;
  if w.version<>p_version then raise exception 'Your work changed in another window. Reload before continuing; keep a copy of any unsaved answers.'; end if;
  if w.state not in ('in_progress','returned') then raise exception 'This work has already been submitted.'; end if;
  if p_action='submit' then
    for q in select value from jsonb_array_elements(a.questions) loop
      if coalesce(btrim(p_answers->>(q->>'id')),'')='' then raise exception 'Answer every question before submitting.'; end if;
    end loop;
    insert into public.textbook_submissions(id,assignment_id,user_id,answers,snapshot) values(p_request,a.id,p_user,p_answers,to_jsonb(a));
  end if;
  update public.textbook_work set answers=p_answers,version=version+1,state=case when p_action='submit' then 'submitted' else w.state end,submission_id=case when p_action='submit' then p_request else w.submission_id end,updated_at=now() where assignment_id=a.id and user_id=p_user returning * into w;
  return to_jsonb(w);
end $$;

create function public.review_textbook_submission(p_submission uuid,p_request uuid,p_actor text,p_owner text,p_decision text,p_ratings jsonb,p_note text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.textbook_assignments; w public.textbook_work; s public.textbook_submissions; r public.textbook_reviews; target uuid;
begin
  select * into s from public.textbook_submissions where id=p_submission;
  if not found then raise exception 'Submission unavailable.'; end if;
  select a0.* into a from public.textbook_assignments a0 join public.courses c on c.id=a0.course_id where a0.id=s.assignment_id and lower(c.teacher_email)=lower(p_owner) and c.archived_at is null for share of a0;
  if not found or not exists(select 1 from public.course_students where course_id=a.course_id and student_id=s.user_id and enrollment_state='ACTIVE') then raise exception 'Student is not on this class roster.'; end if;
  select * into w from public.textbook_work where assignment_id=a.id and user_id=s.user_id for update;
  select * into r from public.textbook_reviews where id=p_request;
  if found then
    if r.submission_id<>s.id or r.reviewer_email<>p_actor or r.decision<>p_decision or r.ratings<>p_ratings or r.note<>p_note then raise exception 'Review request changed.'; end if;
    return to_jsonb(r);
  end if;
  if w.state<>'submitted' or w.submission_id<>s.id then raise exception 'This submission has already been reviewed. Reload the roster.'; end if;
  if p_decision not in ('rated','returned') or p_note is null or length(p_note)>2000 or jsonb_typeof(p_ratings) is distinct from 'object' then raise exception 'Invalid review.'; end if;
  if p_decision='returned' and (btrim(p_note)='' or p_ratings<>'{}'::jsonb) then raise exception 'Add revision feedback. Return work without a mastery rating.'; end if;
  if p_decision='rated' then
    if exists(select 1 from jsonb_each(p_ratings) e where e.value not in ('1'::jsonb,'2'::jsonb,'3'::jsonb) or not exists(select 1 from jsonb_array_elements(s.snapshot->'questions') q where q->>'target_id'=e.key)) then raise exception 'Rate only the assigned targets using 1, 2, or 3.'; end if;
    for target in select distinct (value->>'target_id')::uuid from jsonb_array_elements(s.snapshot->'questions') loop
      if not p_ratings ? target::text then raise exception 'Choose a rating for every assigned target, or return for revision.'; end if;
    end loop;
  end if;
  insert into public.textbook_reviews(id,submission_id,reviewer_email,decision,ratings,note) values(p_request,s.id,p_actor,p_decision,p_ratings,p_note) returning * into r;
  if p_decision='rated' then
    insert into public.mastery_records(user_id,user_email,target_id,level,rated_by,evidence_source)
    select s.user_id,st.email,e.key::uuid,(e.value::text)::smallint,p_actor,'Textbook: '||(s.snapshot->>'title')||' · submission '||s.id::text from jsonb_each(p_ratings) e cross join public.students st where st.id=s.user_id;
  end if;
  update public.textbook_work set state=p_decision,version=version+1,updated_at=now() where assignment_id=a.id and user_id=s.user_id;
  return to_jsonb(r);
end $$;

revoke all on function public.save_textbook_assignment(jsonb,text,text), public.textbook_student_action(uuid,uuid,text,jsonb,integer,uuid), public.review_textbook_submission(uuid,uuid,text,text,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.save_textbook_assignment(jsonb,text,text), public.textbook_student_action(uuid,uuid,text,jsonb,integer,uuid), public.review_textbook_submission(uuid,uuid,text,text,text,jsonb,text) to service_role;
