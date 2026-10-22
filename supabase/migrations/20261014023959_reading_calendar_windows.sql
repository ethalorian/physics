-- Scheduled readings retain every response, exemption, review, and XP award.
alter table public.textbook_assignments add column opens_at timestamptz;
alter table public.textbook_assignments add constraint textbook_reading_window check (opens_at is null or due_at is not null and opens_at < due_at);

create function public.schedule_textbook_reading(p_assignment uuid,p_due timestamptz,p_open timestamptz,p_version integer,p_owner text,p_actor text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.textbook_assignments; saved jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_assignment::text,0));
  select a0.* into a from public.textbook_assignments a0 join public.courses c on c.id=a0.course_id
    where a0.id=p_assignment and lower(c.teacher_email)=lower(p_owner) and c.archived_at is null for update of a0;
  if not found then raise exception 'This class reading is unavailable.'; end if;
  if p_version is null or p_version<1 or p_version>=2147483647 or nullif(btrim(p_actor),'') is null then raise exception 'Refresh the reading before scheduling it.'; end if;
  if p_open is not null and (p_due is null or p_open>=p_due) then raise exception 'Opening must be before the due date.'; end if;
  -- An exact retry after a lost response must not create another version.
  if a.status='published' and a.due_at is not distinct from p_due and a.opens_at is not distinct from p_open and a.version in (p_version,p_version+1) then return to_jsonb(a); end if;
  if a.version<>p_version then raise exception 'Assignment changed. Refresh before scheduling it.'; end if;
  if a.status='draft' then
    -- Reuse curriculum validation and publish within this same transaction.
    saved:=public.save_textbook_assignment(to_jsonb(a)||jsonb_build_object('due_at',p_due,'status','published'),p_actor,p_owner);
    update public.textbook_assignments set opens_at=p_open where id=a.id returning * into a;
  else
    update public.textbook_assignments set status='published',due_at=p_due,opens_at=p_open,version=version+1,updated_at=now() where id=a.id returning * into a;
  end if;
  return to_jsonb(a);
end $$;
revoke all on function public.schedule_textbook_reading(uuid,timestamptz,timestamptz,integer,text,text) from public,anon,authenticated;
grant execute on function public.schedule_textbook_reading(uuid,timestamptz,timestamptz,integer,text,text) to service_role;

create or replace function public.textbook_student_action(p_assignment uuid,p_user uuid,p_action text,p_answers jsonb,p_version integer,p_request uuid)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.textbook_assignments; w public.textbook_work; s public.textbook_submissions; q jsonb;
begin
  select * into a from public.textbook_assignments where id=p_assignment and status='published' for share;
  if not found or not exists(select 1 from public.course_students cs join public.courses c on c.id=cs.course_id join public.students st on st.id=cs.student_id where cs.course_id=a.course_id and cs.student_id=p_user and cs.enrollment_state='ACTIVE' and st.is_active is not false and c.archived_at is null) then raise exception 'This reading is unavailable.'; end if;
  if exists(select 1 from public.textbook_reading_exemptions where assignment_id=p_assignment and user_id=p_user) then raise exception 'This reading has been unassigned for you.'; end if;
  if a.opens_at > now() then raise exception 'This reading has not opened yet.'; end if;
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


