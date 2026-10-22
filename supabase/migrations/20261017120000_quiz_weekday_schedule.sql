-- Quiz dates follow the school's Eastern calendar. Existing dates are preserved
-- for teacher review; newly assigned or changed dates must follow the rhythm.
create function public.quiz_schedule_due(p_due timestamptz,p_vocabulary boolean)
returns timestamptz language plpgsql stable strict security invoker set search_path=public,pg_temp as $$
declare local_due timestamp := p_due at time zone 'America/New_York';
begin
 while not extract(isodow from local_due)::integer = any(case when p_vocabulary then array[2,4] else array[1,3,5] end) loop
  local_due := local_due + interval '1 day';
 end loop;
 return local_due at time zone 'America/New_York';
end $$;
revoke all on function public.quiz_schedule_due(timestamptz,boolean) from public,anon,authenticated;
grant execute on function public.quiz_schedule_due(timestamptz,boolean) to service_role;

-- Sequence scheduling chooses the next eligible quiz day. Direct quiz edits
-- are rejected below, never silently moved to another day.
create or replace function public.reading_vocabulary_quiz_due(p_due date)
returns timestamptz language sql stable strict security invoker set search_path=public,pg_temp as $$
 select public.quiz_schedule_due((p_due + 1 + time '23:59') at time zone 'America/New_York',true);
$$;

create or replace function public.sync_reading_linked_dates()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
declare b public.reading_syllabus_bundles; q public.quiz_assignments; deadline timestamptz;
begin
 select * into b from public.reading_syllabus_bundles where reading_id=new.id;
 if not found then return new; end if;
 if b.course_id<>new.course_id then raise exception 'Reading attachments belong to another class.'; end if;
 perform 1 from public.vocab_tasks where id=b.practice_id and course_id=new.course_id for update;
 if not found then raise exception 'Reading vocabulary practice is unavailable.'; end if;
 update public.vocab_tasks set due_on=(new.due_at at time zone 'America/New_York')::date where id=b.practice_id;
 select * into q from public.quiz_assignments where id=b.reading_quiz_id for update;
 if not found or q.course_id<>new.course_id then raise exception 'Reading quiz is unavailable.'; end if;
 deadline:=public.quiz_schedule_due(new.due_at,q.kind='vocabulary');
 if q.due_at is distinct from deadline then
   update public.quiz_assignments set due_at=deadline,version=version+1,updated_at=now() where id=q.id;
 end if;
 return new;
end $$;

create function public.enforce_quiz_schedule()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if tg_op='UPDATE' and new.due_at is not distinct from old.due_at and new.kind=old.kind then return new; end if;
 if new.due_at is not null and new.due_at is distinct from public.quiz_schedule_due(new.due_at,new.kind='vocabulary') then
  if new.kind='vocabulary' then raise exception 'Vocabulary quizzes are scheduled on Tuesdays and Thursdays.' using errcode='23514';
  else raise exception 'Quizzes are scheduled on Mondays, Wednesdays, and Fridays.' using errcode='23514'; end if;
 end if;
 return new;
end $$;
revoke all on function public.enforce_quiz_schedule() from public,anon,authenticated;
grant execute on function public.enforce_quiz_schedule() to service_role;
create trigger quiz_weekday_schedule before insert or update of due_at,kind on public.quiz_assignments for each row execute function public.enforce_quiz_schedule();

create function public.enforce_vocab_quiz_schedule()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if tg_op='UPDATE' and new.due_on is not distinct from old.due_on and new.task_kind=old.task_kind then return new; end if;
 if new.task_kind='quiz' and new.due_on is not null and extract(isodow from new.due_on)::integer not in (2,4) then
  raise exception 'Vocabulary quizzes are scheduled on Tuesdays and Thursdays.' using errcode='23514';
 end if;
 return new;
end $$;
revoke all on function public.enforce_vocab_quiz_schedule() from public,anon,authenticated;
grant execute on function public.enforce_vocab_quiz_schedule() to service_role;
create trigger vocab_quiz_weekday_schedule before insert or update of due_on,task_kind on public.vocab_tasks for each row execute function public.enforce_vocab_quiz_schedule();

-- Keep the linked quiz date chosen by the sequence trigger on publication.
create or replace function public.release_reading_syllabus_step(p_course uuid,p_step text,p_owner text,p_actor text,p_version integer,p_due timestamptz)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare b public.reading_syllabus_bundles; a public.textbook_assignments; audience uuid[]; task public.vocab_tasks; quiz public.quiz_assignments;
begin
 perform 1 from public.courses where id=p_course and lower(teacher_email)=lower(p_owner) and archived_at is null for share;
 if not found then raise exception 'Choose your own active class.'; end if;
 select * into b from public.reading_syllabus_bundles where course_id=p_course and step_id=p_step for update;
 if not found then raise exception 'Prepare this step first.'; end if;
 select * into a from public.textbook_assignments where id=b.reading_id for update;
 select * into task from public.vocab_tasks where id=b.practice_id for update;
 select * into quiz from public.quiz_assignments where id=b.reading_quiz_id for update;
 if quiz.deleted_at is not null or quiz.status='archived' then raise exception 'Restore the reading quiz before assigning this step.'; end if;
 if a.version<>p_version or a.status='archived' then raise exception 'This reading changed. Refresh before assigning.'; end if;
 -- Date-only edits do not reassign the audience or publish any drafts.
 if a.status='published' and task.active and quiz.status='published' then
   update public.textbook_assignments set due_at=p_due,version=version+1,updated_at=now() where id=a.id;
   update public.vocab_tasks set due_on=(p_due at time zone 'America/New_York')::date where id=task.id;
   return to_jsonb(b);
 end if;
 audience:=array(select cs.student_id from public.course_students cs join public.students s on s.id=cs.student_id where cs.course_id=p_course and cs.enrollment_state='ACTIVE' and s.is_active is not false);
 if cardinality(audience)=0 then raise exception 'Enroll students before assigning this step.'; end if;
 if exists(select 1 from unnest(task.term_ids) tid left join public.vocabulary_terms t on t.id=tid left join public.vocabulary_sets s on s.id=t.vocabulary_set_id where t.id is null or t.archived or s.archived or not s.published) then raise exception 'Some vocabulary is unavailable. Restore its word set before assigning.'; end if;
 if a.status='draft' then perform public.save_textbook_assignment(to_jsonb(a)||jsonb_build_object('status','published','due_at',p_due),p_actor,p_owner);
 else update public.textbook_assignments set due_at=p_due,version=version+1,updated_at=now() where id=a.id; end if;
 -- Publish the reviewed quiz with the step. Per-student submission gates below
 -- keep its questions inaccessible until that student completes the reading.
 -- The reading date trigger may have advanced the quiz version.
 select * into quiz from public.quiz_assignments where id=b.reading_quiz_id for update;
 if quiz.status='draft' then perform public.save_quiz_assignment(to_jsonb(quiz)||jsonb_build_object('status','published'),p_actor,p_owner); end if;
 update public.vocab_tasks set active=true,syllabus_draft=false,student_ids=audience,due_on=(p_due at time zone 'America/New_York')::date where id=b.practice_id;
 return to_jsonb(b);
end $$;
revoke all on function public.release_reading_syllabus_step(uuid,text,text,text,integer,timestamptz) from public,anon,authenticated;
grant execute on function public.release_reading_syllabus_step(uuid,text,text,text,integer,timestamptz) to service_role;
