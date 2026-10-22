-- Vocabulary practice is due with the reading. Its quiz is due at 11:59 PM
-- Eastern on the following calendar day (including across daylight saving).
create function public.reading_vocabulary_quiz_due(p_due date)
returns timestamptz language sql stable strict security invoker set search_path=public,pg_temp as $$
 select (p_due + 1 + time '23:59') at time zone 'America/New_York';
$$;
revoke all on function public.reading_vocabulary_quiz_due(date) from public,anon,authenticated;
grant execute on function public.reading_vocabulary_quiz_due(date) to service_role;

create function public.sync_reading_vocabulary_quiz_date()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
declare b public.reading_syllabus_bundles; q public.quiz_assignments; deadline timestamptz;
begin
 select * into b from public.reading_syllabus_bundles where practice_id=new.id;
 if not found then return new; end if;
 if b.course_id<>new.course_id then raise exception 'Reading attachments belong to another class.'; end if;
 select * into q from public.quiz_assignments where id=b.vocabulary_quiz_id for update;
 if not found or q.course_id<>new.course_id then raise exception 'Reading vocabulary quiz is unavailable.'; end if;
 deadline:=public.reading_vocabulary_quiz_due(new.due_on);
 if q.due_at is distinct from deadline then
   update public.quiz_assignments set due_at=deadline,version=version+1,updated_at=now() where id=q.id;
 end if;
 return new;
end $$;
revoke all on function public.sync_reading_vocabulary_quiz_date() from public,anon,authenticated;
grant execute on function public.sync_reading_vocabulary_quiz_date() to service_role;
create trigger reading_vocabulary_quiz_date after update of due_on on public.vocab_tasks
 for each row execute function public.sync_reading_vocabulary_quiz_date();

create or replace function public.sync_reading_linked_dates()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
declare b public.reading_syllabus_bundles; q public.quiz_assignments;
begin
 select * into b from public.reading_syllabus_bundles where reading_id=new.id;
 if not found then return new; end if;
 if b.course_id<>new.course_id then raise exception 'Reading attachments belong to another class.'; end if;
 perform 1 from public.vocab_tasks where id=b.practice_id and course_id=new.course_id for update;
 if not found then raise exception 'Reading vocabulary practice is unavailable.'; end if;
 -- Always fire the practice trigger, including when the day is unchanged.
 update public.vocab_tasks set due_on=(new.due_at at time zone 'America/New_York')::date where id=b.practice_id;
 select * into q from public.quiz_assignments where id=b.reading_quiz_id for update;
 if not found or q.course_id<>new.course_id then raise exception 'Reading quiz is unavailable.'; end if;
 if q.due_at is distinct from new.due_at then
   update public.quiz_assignments set due_at=new.due_at,version=version+1,updated_at=now() where id=q.id;
 end if;
 return new;
end $$;

-- Store server-owned before/after state for the most recent calendar assignment.
-- Undo never accepts resource IDs or publication states from the browser.
create table public.reading_planner_assignments (
 assignment_id uuid primary key references public.textbook_assignments(id) on delete cascade,
 from_version integer not null,
 reading_version integer not null,
 before_state jsonb not null,
 after_state jsonb not null,
 created_at timestamptz not null default now()
);
alter table public.reading_planner_assignments enable row level security;
revoke all on public.reading_planner_assignments from public,anon,authenticated;
grant select,insert,update,delete on public.reading_planner_assignments to service_role;
create policy reading_planner_assignments_service on public.reading_planner_assignments
 for all to service_role using(true) with check(true);

create function public.assign_reading_sequence(p_assignment uuid,p_due timestamptz,p_open timestamptz,p_version integer,p_owner text,p_actor text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.textbook_assignments; b public.reading_syllabus_bundles; task public.vocab_tasks; q public.quiz_assignments;
 receipt public.reading_planner_assignments; prior jsonb; following jsonb; audience uuid[];
begin
 perform pg_advisory_xact_lock(hashtextextended(p_assignment::text,0));
 select a0.* into a from public.textbook_assignments a0 join public.courses c on c.id=a0.course_id
 where a0.id=p_assignment and lower(c.teacher_email)=lower(p_owner) and c.archived_at is null for update of a0;
 if not found then raise exception 'This class reading is unavailable.'; end if;
 if p_version is null or p_version<1 or p_version>=2147483647 or nullif(btrim(p_actor),'') is null then raise exception 'Refresh before assigning this reading.'; end if;
 if p_open is not null and (p_due is null or p_open>=p_due) then raise exception 'Opening must be before the due date.'; end if;
 select * into receipt from public.reading_planner_assignments where assignment_id=a.id for update;
 if found and receipt.from_version=p_version and receipt.reading_version=a.version
   and a.due_at is not distinct from p_due and a.opens_at is not distinct from p_open and a.status='published' then return to_jsonb(a); end if;
 if a.version<>p_version then raise exception 'Assignment changed. Refresh before assigning it.'; end if;
 prior:=jsonb_build_object('reading',to_jsonb(a),'practice',null,'quizzes','[]'::jsonb);
 select * into b from public.reading_syllabus_bundles where reading_id=a.id;
 if found then
   if b.course_id<>a.course_id then raise exception 'Reading attachments belong to another class.'; end if;
   select * into task from public.vocab_tasks where id=b.practice_id and course_id=a.course_id for update;
   if not found then raise exception 'Reading vocabulary practice is unavailable.'; end if;
   perform 1 from public.quiz_assignments where id in (b.reading_quiz_id,b.vocabulary_quiz_id) order by id for update;
   if (select count(*) from public.quiz_assignments where id in (b.reading_quiz_id,b.vocabulary_quiz_id) and course_id=a.course_id and deleted_at is null)<>2 then
     raise exception 'Restore the attached quizzes in Assignments before assigning this reading.';
   end if;
   prior:=prior||jsonb_build_object('practice',to_jsonb(task),'quizzes',(select jsonb_agg(to_jsonb(q0) order by q0.id) from public.quiz_assignments q0 where id in (b.reading_quiz_id,b.vocabulary_quiz_id)));
   if not task.active then
     if exists(select 1 from unnest(task.term_ids) tid left join public.vocabulary_terms t on t.id=tid left join public.vocabulary_sets s on s.id=t.vocabulary_set_id where t.id is null or t.archived or s.archived or not s.published) then
       raise exception 'Some vocabulary is unavailable. Restore its word set before assigning.';
     end if;
     -- A newly prepared task has no audience until the first assignment.
     if task.syllabus_draft then
       audience:=array(select cs.student_id from public.course_students cs join public.students s on s.id=cs.student_id where cs.course_id=a.course_id and cs.enrollment_state='ACTIVE' and s.is_active is not false order by cs.student_id);
       if cardinality(audience)=0 then raise exception 'Enroll students before assigning this step.'; end if;
     else audience:=task.student_ids; end if;
     update public.vocab_tasks set active=true,syllabus_draft=false,student_ids=audience where id=task.id;
   end if;
 end if;
 -- Normal calendar drops assign every piece; Undo of unassignment uses the
 -- separate schedule_textbook_reading function to restore only prior pieces.
 delete from public.reading_planner_unassignments where assignment_id=a.id;
 if a.status='draft' then
   perform public.save_textbook_assignment(to_jsonb(a)||jsonb_build_object('status','published','due_at',p_due),p_actor,p_owner);
   update public.textbook_assignments set opens_at=p_open where id=a.id returning * into a;
 else
   update public.textbook_assignments set status='published',due_at=p_due,opens_at=p_open,version=version+1,updated_at=now() where id=a.id returning * into a;
 end if;
 if b.reading_id is not null then
   -- Reload after the date triggers advance quiz versions. Draft publication
   -- uses the existing question/target/audience validation in the same transaction.
   for q in select * from public.quiz_assignments where id in (b.reading_quiz_id,b.vocabulary_quiz_id) order by id for update loop
     if q.status='draft' then perform public.save_quiz_assignment(to_jsonb(q)||jsonb_build_object('status','published'),p_actor,p_owner);
     elsif q.status='archived' then update public.quiz_assignments set status='published',version=version+1,updated_at=now() where id=q.id;
     end if;
   end loop;
 end if;
 following:=jsonb_build_object('reading',to_jsonb(a),'practice',(select to_jsonb(v) from public.vocab_tasks v where id=b.practice_id),
   'quizzes',coalesce((select jsonb_agg(to_jsonb(q0) order by q0.id) from public.quiz_assignments q0 where id in (b.reading_quiz_id,b.vocabulary_quiz_id)),'[]'::jsonb));
 insert into public.reading_planner_assignments(assignment_id,from_version,reading_version,before_state,after_state)
 values(a.id,p_version,a.version,prior,following)
 on conflict(assignment_id) do update set from_version=excluded.from_version,reading_version=excluded.reading_version,before_state=excluded.before_state,after_state=excluded.after_state,created_at=now();
 return to_jsonb(a);
end $$;
revoke all on function public.assign_reading_sequence(uuid,timestamptz,timestamptz,integer,text,text) from public,anon,authenticated;
grant execute on function public.assign_reading_sequence(uuid,timestamptz,timestamptz,integer,text,text) to service_role;

create function public.undo_reading_sequence_assignment(p_assignment uuid,p_version integer,p_owner text,p_actor text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a public.textbook_assignments; receipt public.reading_planner_assignments; task public.vocab_tasks; q public.quiz_assignments;
 before_reading jsonb; entry jsonb; prior_task jsonb; state text;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_assignment::text,0));
 select a0.* into a from public.textbook_assignments a0 join public.courses c on c.id=a0.course_id
 where a0.id=p_assignment and lower(c.teacher_email)=lower(p_owner) and c.archived_at is null for update of a0;
 if not found then raise exception 'This class reading is unavailable.'; end if;
 if p_version is null or p_version<1 or p_version>=2147483647 or nullif(btrim(p_actor),'') is null then raise exception 'Refresh before undoing this change.'; end if;
 select * into receipt from public.reading_planner_assignments where assignment_id=a.id for update;
 if not found or receipt.reading_version<>p_version or a.version<>p_version or to_jsonb(a) is distinct from receipt.after_state->'reading' then
   raise exception 'Assignment changed. Refresh before undoing it.';
 end if;
 if receipt.after_state->'practice' is distinct from 'null'::jsonb then
   select * into task from public.vocab_tasks where id=(receipt.after_state->'practice'->>'id')::uuid for update;
   if not found or to_jsonb(task) is distinct from receipt.after_state->'practice' then raise exception 'Vocabulary practice changed. Refresh before undoing it.'; end if;
 end if;
 for entry in select value from jsonb_array_elements(receipt.after_state->'quizzes') loop
   select * into q from public.quiz_assignments where id=(entry->>'id')::uuid for update;
   if not found or to_jsonb(q) is distinct from entry then raise exception 'An attached quiz changed. Refresh before undoing it.'; end if;
 end loop;
 before_reading:=receipt.before_state->'reading';
 state:=before_reading->>'status';
 -- Work may arrive between Assign and Undo. Retain it and keep questions fixed.
 if state='draft' and exists(select 1 from public.textbook_work where assignment_id=a.id) then state:='archived'; end if;
 update public.textbook_assignments set status=state,due_at=(before_reading->>'due_at')::timestamptz,opens_at=(before_reading->>'opens_at')::timestamptz,version=version+1,updated_at=now() where id=a.id returning * into a;
 prior_task:=receipt.before_state->'practice';
 if prior_task is distinct from 'null'::jsonb then
   update public.vocab_tasks set active=(prior_task->>'active')::boolean,syllabus_draft=(prior_task->>'syllabus_draft')::boolean,
     due_on=(prior_task->>'due_on')::date,student_ids=case when prior_task->'student_ids'='null'::jsonb then null else array(select value::uuid from jsonb_array_elements_text(prior_task->'student_ids')) end
     where id=(prior_task->>'id')::uuid;
 end if;
 -- Restore exact prior dates, including a teacher's earlier per-quiz date.
 for entry in select value from jsonb_array_elements(receipt.before_state->'quizzes') loop
   state:=entry->>'status';
   if state='draft' and exists(select 1 from public.quiz_work where quiz_id=(entry->>'id')::uuid) then state:='archived'; end if;
   update public.quiz_assignments set status=state,due_at=(entry->>'due_at')::timestamptz,version=version+1,updated_at=now() where id=(entry->>'id')::uuid;
 end loop;
 delete from public.reading_planner_assignments where assignment_id=a.id;
 return to_jsonb(a);
end $$;
revoke all on function public.undo_reading_sequence_assignment(uuid,integer,text,text) from public,anon,authenticated;
grant execute on function public.undo_reading_sequence_assignment(uuid,integer,text,text) to service_role;
