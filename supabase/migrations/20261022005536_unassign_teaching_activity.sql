-- Removing a calendar card withdraws its native assignment in the same transaction.
-- Keep assignment IDs, responses, grades and mastery evidence for later reassignment.
create function public.unassign_teaching_activity(p_owner text,p_plan uuid,p_course uuid,p_plan_version integer,p_version integer,p_payload jsonb,p_actor text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare result jsonb; step jsonb; activity_key text; kind text; source text; expected jsonb;
 c courses; a interactive_assignments; w lesson_class_windows; r textbook_assignments; q quiz_assignments;
 b reading_syllabus_bundles; native_id uuid;
begin
 select * into c from courses where id=p_course and teacher_email=p_owner and archived_at is null for update;
 if not found then raise exception 'Class unavailable'; end if;
 if not (p_payload ? 'expected') or nullif(btrim(p_actor),'') is null then raise exception 'Reload the assignment before unassigning it.'; end if;
 expected := p_payload->'expected';
 -- This validates ownership and the class-plan revision before any native write.
 -- A later failure rolls the calendar removal back too.
 result := public.change_teaching_class(p_owner,p_plan,p_course,p_plan_version,p_version,'meeting',jsonb_build_object('stepId',p_payload->>'stepId','slot',null),p_actor);
 select v into step from jsonb_array_elements(result->'state'->'steps') v where v->>'id'=p_payload->>'stepId';
 activity_key := step->>'activityKey'; kind := split_part(activity_key,':',1); source := substring(activity_key from position(':' in activity_key)+1);
 if kind='interactive' then
   perform pg_advisory_xact_lock(hashtextextended(p_course::text||source,0));
   select * into a from interactive_assignments where course_id=p_course and slug=source for update;
   native_id := a.id;
 elsif kind='reading-template' then
   select * into b from reading_syllabus_bundles where course_id=p_course and step_id=source;
   native_id := b.reading_id;
 elsif kind in ('lesson','reading','quiz') then native_id := source::uuid;
 else raise exception 'Use this activity’s assignment settings to unassign it.';
 end if;
 if exists(select 1 from choice_sections s cross join lateral jsonb_array_elements(s.options) o cross join lateral jsonb_array_elements(o->'steps') st
   where s.course_id=p_course and s.published_at is not null and
    ((kind='interactive' and st->>'kind'='interactive' and (st->>'assignmentSlug'=source or st->>'sourceId'=native_id::text))
     or (st->>'kind'=case when kind='reading-template' then 'reading' else kind end and st->>'sourceId'=native_id::text))) then
   raise exception 'This activity belongs to a student choice menu. Manage its availability in Student choice.';
 end if;
 if kind='interactive' then
   if a.id is not null and (expected->>'sourceId' is distinct from source or a.due_on is distinct from (expected->>'dueAt')::date) or a.id is null and expected<>'null'::jsonb then raise exception 'The assignment changed. Reload before unassigning it.'; end if;
   update interactive_assignments set due_on=null where id=a.id;
 elsif kind='lesson' then
   select * into w from lesson_class_windows where course_id=p_course::text and lesson_id=source for update;
   if w.id is not null and (expected->>'sourceId' is distinct from source or w.due_at is distinct from (expected->>'dueAt')::timestamptz or w.open_at is distinct from (expected->>'opensAt')::timestamptz or w.close_at is distinct from (expected->>'closesAt')::timestamptz)
     or w.id is null and (expected->>'dueAt' is not null or expected->>'opensAt' is not null or expected->>'closesAt' is not null) then raise exception 'The assignment changed. Reload before unassigning it.'; end if;
   update lesson_class_windows set open_at=null,close_at=now(),due_at=null,set_by=p_actor,updated_at=now() where id=w.id;
 elsif kind in ('reading-template','reading') then
   if native_id is not null then
     perform pg_advisory_xact_lock(hashtextextended(native_id::text,0));
     select * into r from textbook_assignments where id=native_id and course_id=p_course for update;
     if not found or expected->>'sourceId' is distinct from r.id::text or r.version is distinct from (expected->>'version')::integer or r.due_at is distinct from (expected->>'dueAt')::timestamptz then raise exception 'The reading changed. Reload before unassigning it.'; end if;
     -- The native operation also withdraws active attached quizzes and vocabulary.
     if r.status='published' then perform public.unassign_reading_sequence(r.id,r.version,p_owner,p_actor); end if;
   elsif expected<>'null'::jsonb then raise exception 'The reading changed. Reload before unassigning it.';
   end if;
 elsif kind='quiz' then
   select * into q from quiz_assignments where id=native_id and course_id=p_course and deleted_at is null for update;
   if not found or expected->>'sourceId' is distinct from q.id::text or q.version is distinct from (expected->>'version')::integer or q.due_at is distinct from (expected->>'dueAt')::timestamptz then raise exception 'The quiz changed. Reload before unassigning it.'; end if;
   if exists(select 1 from reading_syllabus_bundles where reading_quiz_id=q.id or vocabulary_quiz_id=q.id) then raise exception 'Unassign the linked reading to remove this quiz with its reading sequence.'; end if;
   if q.status='published' then update quiz_assignments set status='archived',due_at=null,version=version+1,updated_at=now() where id=q.id; end if;
 end if;
 return result || jsonb_build_object('unassigned',true,'sourceId',native_id);
end $$;
revoke all on function public.unassign_teaching_activity(text,uuid,uuid,integer,integer,jsonb,text) from public,anon,authenticated;
grant execute on function public.unassign_teaching_activity(text,uuid,uuid,integer,integer,jsonb,text) to service_role;
