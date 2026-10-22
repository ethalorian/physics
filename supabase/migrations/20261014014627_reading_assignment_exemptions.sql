-- Unassign individual readers without deleting their work, submissions, or XP.
create table public.textbook_reading_exemptions (
  assignment_id uuid not null references public.textbook_assignments(id),
  user_id uuid not null references public.students(id),
  created_by text not null,
  created_at timestamptz not null default now(),
  primary key (assignment_id, user_id)
);
create index textbook_reading_exemptions_user on public.textbook_reading_exemptions(user_id, assignment_id);
alter table public.textbook_reading_exemptions enable row level security;
revoke all on public.textbook_reading_exemptions from public, anon, authenticated;
grant all on public.textbook_reading_exemptions to service_role;

create function public.set_textbook_reading_exemption(p_assignment uuid,p_user uuid,p_excused boolean,p_version integer,p_owner text,p_actor text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.textbook_assignments;
begin
  -- Serialize against student save/submit (which holds a shared assignment lock)
  -- and all class/roster assignment changes. A stale teacher tab must refresh.
  select a0.* into a from public.textbook_assignments a0 join public.courses c on c.id=a0.course_id
    where a0.id=p_assignment and lower(c.teacher_email)=lower(p_owner) and c.archived_at is null for update of a0;
  if not found then raise exception 'This class reading is unavailable.'; end if;
  if a.status<>'published' or p_version is null or p_version<1 or p_version>=2147483647 or a.version<>p_version then raise exception 'Assignment changed. Refresh before changing its students.'; end if;
  if p_excused is null or nullif(btrim(p_actor),'') is null then raise exception 'Invalid assignment change.'; end if;
  if not exists(select 1 from public.course_students cs join public.students s on s.id=cs.student_id
    where cs.course_id=a.course_id and cs.student_id=p_user and cs.enrollment_state='ACTIVE' and s.is_active is not false)
    then raise exception 'Choose an active student in this class.'; end if;
  if p_excused then
    insert into public.textbook_reading_exemptions(assignment_id,user_id,created_by) values(a.id,p_user,p_actor) on conflict do nothing;
  else
    delete from public.textbook_reading_exemptions where assignment_id=a.id and user_id=p_user;
  end if;
  update public.textbook_assignments set version=version+1,updated_at=now() where id=a.id returning * into a;
  return jsonb_build_object('ok',true,'version',a.version,'student_id',p_user,'excused',p_excused);
end $$;
revoke all on function public.set_textbook_reading_exemption(uuid,uuid,boolean,integer,text,text) from public,anon,authenticated;
grant execute on function public.set_textbook_reading_exemption(uuid,uuid,boolean,integer,text,text) to service_role;

create or replace function public.textbook_student_action(p_assignment uuid,p_user uuid,p_action text,p_answers jsonb,p_version integer,p_request uuid)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.textbook_assignments; w public.textbook_work; s public.textbook_submissions; q jsonb;
begin
  select * into a from public.textbook_assignments where id=p_assignment and status='published' for share;
  if not found or not exists(select 1 from public.course_students cs join public.courses c on c.id=cs.course_id join public.students st on st.id=cs.student_id where cs.course_id=a.course_id and cs.student_id=p_user and cs.enrollment_state='ACTIVE' and st.is_active is not false and c.archived_at is null) then raise exception 'This reading is unavailable.'; end if;
  if exists(select 1 from public.textbook_reading_exemptions where assignment_id=p_assignment and user_id=p_user) then raise exception 'This reading has been unassigned for you.'; end if;
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


-- Removing a prerequisite must not strand a still-assigned connected quiz.
create or replace function public.guard_reading_quiz_completion() returns trigger
language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if exists(select 1 from public.reading_syllabus_bundles b join public.textbook_assignments a on a.id=b.reading_id
   where b.reading_quiz_id=new.quiz_id and a.status<>'archived'
   and not exists(select 1 from public.textbook_reading_exemptions e where e.assignment_id=b.reading_id and e.user_id=new.user_id)
   and not exists(select 1 from public.textbook_submissions s where s.assignment_id=b.reading_id and s.user_id=new.user_id)) then
   raise exception 'Complete and submit the reading assignment before starting its quiz.';
 end if;
 return new;
end $$;
