-- Persist selected dates for both new and already-published reading sequences.
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
 if quiz.status='draft' then perform public.save_quiz_assignment(to_jsonb(quiz)||jsonb_build_object('status','published','due_at',coalesce(quiz.due_at,p_due)),p_actor,p_owner); end if;
 update public.vocab_tasks set active=true,syllabus_draft=false,student_ids=audience,due_on=(p_due at time zone 'America/New_York')::date where id=b.practice_id;
 return to_jsonb(b);
end $$;
revoke all on function public.release_reading_syllabus_step(uuid,text,text,text,integer,timestamptz) from public,anon,authenticated;
grant execute on function public.release_reading_syllabus_step(uuid,text,text,text,integer,timestamptz) to service_role;
