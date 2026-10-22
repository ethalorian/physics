-- Remember only the resources deactivated by a calendar unassignment so Undo
-- and later calendar reassignment preserve drafts and previously unassigned work.
create table public.reading_planner_unassignments (
 assignment_id uuid primary key references public.textbook_assignments(id) on delete cascade,
 reading_version integer not null,
 attachment_state jsonb not null check(jsonb_typeof(attachment_state)='object'),
 created_at timestamptz not null default now()
);
alter table public.reading_planner_unassignments enable row level security;
revoke all on public.reading_planner_unassignments from public,anon,authenticated;
grant select,insert,update,delete on public.reading_planner_unassignments to service_role;
create policy reading_planner_unassignments_service on public.reading_planner_unassignments
 for all to service_role using (true) with check (true);

create function public.unassign_reading_sequence(p_assignment uuid,p_version integer,p_owner text,p_actor text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.textbook_assignments; b public.reading_syllabus_bundles; task public.vocab_tasks; quiz public.quiz_assignments;
 practice_state jsonb:='null'; quiz_states jsonb:='[]';
begin
 perform pg_advisory_xact_lock(hashtextextended(p_assignment::text,0));
 select a0.* into a from public.textbook_assignments a0 join public.courses c on c.id=a0.course_id
   where a0.id=p_assignment and lower(c.teacher_email)=lower(p_owner) and c.archived_at is null for update of a0;
 if not found then raise exception 'This class reading is unavailable.'; end if;
 if p_version is null or p_version<1 or p_version>=2147483647 or nullif(btrim(p_actor),'') is null then raise exception 'Refresh before unassigning this reading.'; end if;
 if a.status='archived' and a.version=p_version+1 and exists(select 1 from public.reading_planner_unassignments where assignment_id=a.id and reading_version=a.version) then return to_jsonb(a); end if;
 if a.status<>'published' or a.version<>p_version then raise exception 'Assignment changed. Refresh before unassigning it.'; end if;
 select * into b from public.reading_syllabus_bundles where reading_id=a.id;
 if found then
   if b.course_id<>a.course_id then raise exception 'Reading attachments belong to another class.'; end if;
   select * into task from public.vocab_tasks where id=b.practice_id and course_id=a.course_id for update;
   if not found then raise exception 'Reading vocabulary practice is unavailable.'; end if;
   if task.active then
     update public.vocab_tasks set active=false where id=task.id returning * into task;
     practice_state:=to_jsonb(task);
   end if;
   for quiz in select * from public.quiz_assignments where id in (b.reading_quiz_id,b.vocabulary_quiz_id) order by id for update loop
     if quiz.course_id<>a.course_id then raise exception 'Reading quiz belongs to another class.'; end if;
     if quiz.status='published' and quiz.deleted_at is null then
       update public.quiz_assignments set status='archived',version=version+1,updated_at=now() where id=quiz.id returning * into quiz;
       quiz_states:=quiz_states||jsonb_build_array(jsonb_build_object('id',quiz.id,'version',quiz.version));
     end if;
   end loop;
 end if;
 update public.textbook_assignments set status='archived',version=version+1,updated_at=now() where id=a.id returning * into a;
 insert into public.reading_planner_unassignments(assignment_id,reading_version,attachment_state)
 values(a.id,a.version,jsonb_build_object('practice',practice_state,'quizzes',quiz_states))
 on conflict(assignment_id) do update set reading_version=excluded.reading_version,attachment_state=excluded.attachment_state,created_at=now();
 return to_jsonb(a);
end $$;
revoke all on function public.unassign_reading_sequence(uuid,integer,text,text) from public,anon,authenticated;
grant execute on function public.unassign_reading_sequence(uuid,integer,text,text) to service_role;

create or replace function public.schedule_textbook_reading(p_assignment uuid,p_due timestamptz,p_open timestamptz,p_version integer,p_owner text,p_actor text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.textbook_assignments; saved jsonb; receipt public.reading_planner_unassignments;
 b public.reading_syllabus_bundles; task public.vocab_tasks; quiz public.quiz_assignments; entry jsonb;
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
  if a.status='archived' then
    select * into receipt from public.reading_planner_unassignments where assignment_id=a.id for update;
    if found then
      if receipt.reading_version<>a.version then raise exception 'This unassigned reading changed. Review its pieces in Assignments before reassigning.'; end if;
      select * into b from public.reading_syllabus_bundles where reading_id=a.id;
      if receipt.attachment_state->'practice' is distinct from 'null'::jsonb then
        select * into task from public.vocab_tasks where id=(receipt.attachment_state->'practice'->>'id')::uuid for update;
        if not found or task.course_id<>a.course_id or task.id is distinct from b.practice_id or to_jsonb(task) is distinct from receipt.attachment_state->'practice' then
          raise exception 'Vocabulary practice changed after unassignment. Review it in Assignments before reassigning.';
        end if;
        update public.vocab_tasks set active=true where id=task.id;
      end if;
      for entry in select value from jsonb_array_elements(receipt.attachment_state->'quizzes') loop
        select * into quiz from public.quiz_assignments where id=(entry->>'id')::uuid for update;
        if not found or quiz.course_id<>a.course_id or b.reading_id is null or quiz.id not in (b.reading_quiz_id,b.vocabulary_quiz_id)
          or quiz.version<>(entry->>'version')::integer or quiz.status<>'archived' or quiz.deleted_at is not null then
          raise exception 'A linked quiz changed after unassignment. Review it in Assignments before reassigning.';
        end if;
        update public.quiz_assignments set status='published',version=version+1,updated_at=now() where id=quiz.id;
      end loop;
      delete from public.reading_planner_unassignments where assignment_id=a.id;
    end if;
  end if;
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

