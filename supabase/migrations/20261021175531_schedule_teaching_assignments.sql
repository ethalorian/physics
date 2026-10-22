-- A calendar placement and its native student assignment are one transaction.
-- Existing teaching-only clients remain compatible; the new UI uses this RPC.
create function public.schedule_teaching_activity(p_owner text,p_plan uuid,p_course uuid,p_plan_version integer,p_version integer,p_payload jsonb,p_actor text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare result jsonb; step jsonb; activity_key text; kind text; source text;
 c courses; w lesson_class_windows; r textbook_assignments; q quiz_assignments;
 b reading_syllabus_bundles; due_day date; deadline timestamptz; native_id uuid;
begin
 -- Choice publication locks the course first too. It must never race a direct assignment.
 select * into c from courses where id=p_course and teacher_email=p_owner and archived_at is null for update;
 if not found then raise exception 'Class unavailable'; end if;
 if p_payload->'slot' is null or p_payload->'slot'='null'::jsonb then raise exception 'Choose a calendar day to assign this activity.'; end if;
 due_day := (p_payload->'slot'->>'date')::date;
 if due_day is null then raise exception 'Choose a valid due date.'; end if;
 deadline := (due_day + time '23:59') at time zone 'America/New_York';
 -- Reuse the plan ownership, class/track and optimistic-version checks. Any later
 -- error rolls this placement back, as well as any newly prepared reading drafts.
 if p_version=0 then
   result := public.change_teaching_class(p_owner,p_plan,p_course,p_plan_version,0,'apply','{}',p_actor);
   result := public.change_teaching_class(p_owner,p_plan,p_course,p_plan_version,1,'meeting',p_payload,p_actor);
 else
   result := public.change_teaching_class(p_owner,p_plan,p_course,p_plan_version,p_version,'meeting',p_payload,p_actor);
 end if;
 select v into step from jsonb_array_elements(result->'state'->'steps') v where v->>'id'=p_payload->>'stepId';
 activity_key := step->>'activityKey'; kind := split_part(activity_key,':',1); source := substring(activity_key from position(':' in activity_key)+1);
 if kind='interactive' then
   select id into native_id from interactive_assignments where course_id=p_course and slug=source;
 elsif kind='reading-template' then
   select * into b from reading_syllabus_bundles where course_id=p_course and step_id=source;
   if b.reading_id is null then
     if p_payload->'readingDraft' is null or p_payload->'readingDraft'->>'step_id' is distinct from source or p_payload->'readingDraft'->'reading'->>'course_id' is distinct from p_course::text then raise exception 'Prepare this interactive reading before assigning it.'; end if;
     perform public.create_reading_syllabus_bundle(p_payload->'readingDraft',p_actor,p_owner);
     select * into b from reading_syllabus_bundles where course_id=p_course and step_id=source;
   end if;
   native_id := b.reading_id;
 elsif kind in ('lesson','reading','quiz') then native_id := source::uuid;
 else raise exception 'Use this activity’s assignment settings before scheduling it.';
 end if;
 if exists(select 1 from choice_sections s cross join lateral jsonb_array_elements(s.options) o cross join lateral jsonb_array_elements(o->'steps') st
   where s.course_id=p_course and s.published_at is not null and
    ((kind='interactive' and st->>'kind'='interactive' and (st->>'assignmentSlug'=source or st->>'sourceId'=native_id::text))
     or (st->>'kind'=case when kind='reading-template' then 'reading' else kind end and st->>'sourceId'=native_id::text))) then
   raise exception 'This activity is in a student choice menu. Remove it from that menu before assigning it to the whole class.';
 end if;
 if kind='interactive' then
   if c.program<>'physics' or not exists(select 1 from learning_targets where id=(p_payload->>'targetId')::uuid and program='physics') then raise exception 'Choose a Physics assignment with a valid target.'; end if;
   perform pg_advisory_xact_lock(hashtextextended(p_course::text||source,0));
   insert into interactive_assignments(course_id,slug,target_id,due_on) values(p_course,source,(p_payload->>'targetId')::uuid,due_day)
     on conflict(course_id,slug) do update set due_on=excluded.due_on returning id into native_id;
 elsif kind='lesson' then
   perform 1 from lessons l join units u on u.id=l.unit_id where l.id=native_id and l.published and coalesce(u.program,'physics')=c.program
     and (nullif(l.visibility_track,'') is null or l.visibility_track=case when c.track in ('honors','ap','pbl') then c.track else 'cpa' end);
   if not found then raise exception 'This lesson is not published for this class.'; end if;
   select * into w from lesson_class_windows where course_id=p_course::text and lesson_id=source for update;
   insert into lesson_class_windows(course_id,lesson_id,open_at,close_at,due_at,set_by,updated_at)
     values(p_course::text,source,least(coalesce(w.open_at,now()),now(),deadline),case when w.close_at>=deadline and w.close_at>now() then w.close_at else null end,deadline,p_actor,now())
     on conflict(course_id,lesson_id) do update set open_at=excluded.open_at,close_at=excluded.close_at,due_at=excluded.due_at,set_by=excluded.set_by,updated_at=excluded.updated_at;
 elsif kind in ('reading-template','reading') then
   select * into r from textbook_assignments where id=native_id and course_id=p_course for update;
   if not found then raise exception 'This reading belongs to another class.'; end if;
   if p_payload->>'readingVersion' is not null and (r.version is distinct from (p_payload->>'readingVersion')::integer or r.id::text is distinct from p_payload->>'readingId') then raise exception 'This reading changed. Reload before assigning.'; end if;
   -- Uses the established bundle assignment, due-date and quiz-unlock rules.
   perform public.assign_reading_sequence(r.id,deadline,case when r.opens_at<deadline then r.opens_at else null end,r.version,p_owner,p_actor);
 elsif kind='quiz' then
   select * into q from quiz_assignments where id=native_id and course_id=p_course and deleted_at is null for update;
   if not found or q.version is distinct from (p_payload->>'quizVersion')::integer then raise exception 'This quiz changed. Reload before assigning.'; end if;
   if exists(select 1 from reading_syllabus_bundles where reading_quiz_id=q.id or vocabulary_quiz_id=q.id) then raise exception 'Drag the linked reading to schedule this quiz with its reading sequence.'; end if;
   perform public.save_quiz_assignment(to_jsonb(q)||jsonb_build_object('status','published','due_at',deadline),p_actor,p_owner);
 end if;
 return result || jsonb_build_object('assigned',true,'dueOn',due_day,'sourceId',native_id);
end $$;
revoke all on function public.schedule_teaching_activity(text,uuid,uuid,integer,integer,jsonb,text) from public,anon,authenticated;
grant execute on function public.schedule_teaching_activity(text,uuid,uuid,integer,integer,jsonb,text) to service_role;
