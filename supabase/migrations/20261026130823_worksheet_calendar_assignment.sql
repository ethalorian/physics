-- A reusable sequence entry resolves to one native worksheet/quiz pair per class.
-- Existing independently scheduled pairs remain intact and can be adopted once.
alter table public.worksheet_assignments add column plan_key text;
alter table public.worksheet_assignments add constraint worksheet_plan_identity check (
 plan_key is null or plan_key = 'worksheet-template:' || unit_id || ':' || day::text || ':' || edition
);
create unique index worksheet_plan_class on public.worksheet_assignments(course_id,plan_key) where plan_key is not null;

create function public.place_worksheet_pair(p_course uuid,p_key text,p_due timestamptz,p_payload jsonb,p_actor text,p_owner text,p_remove boolean)
returns uuid language plpgsql security invoker set search_path=public,pg_temp as $$
declare a worksheet_assignments; q quiz_assignments; d jsonb; expected jsonb; copies integer;
 unit text; day_number integer; edition_name text; quiz_due timestamptz; quiz_gap integer;
begin
 perform 1 from courses where id=p_course and teacher_email=p_owner and archived_at is null and program='physics' for update;
 if not found or nullif(btrim(p_actor),'') is null then raise exception 'Choose your own active Physics class.'; end if;
 if p_key is null or p_key !~ '^worksheet-template:unit-[1-8]:[1-9][0-9]?:(cpa|honors|cpa-sei|honors-sei)$' then raise exception 'Choose an available worksheet.'; end if;
 unit:=split_part(p_key,':',2); day_number:=split_part(p_key,':',3)::integer; edition_name:=split_part(p_key,':',4);
 select * into a from worksheet_assignments where course_id=p_course and plan_key=p_key for update;
 if a.id is null and not p_remove then
  select count(*) into copies from worksheet_assignments where course_id=p_course and unit_id=unit and day=day_number and edition=edition_name and plan_key is null and student_ids is null and status='published';
  if copies>1 then raise exception 'This class has multiple active copies of this worksheet. Archive the extra copies before scheduling.'; end if;
  select * into a from worksheet_assignments where course_id=p_course and unit_id=unit and day=day_number and edition=edition_name and plan_key is null and student_ids is null order by (status='published') desc,created_at desc,id desc limit 1 for update;
 end if;
 if p_remove then
  if not p_payload ? 'expected' then raise exception 'Reload the worksheet before unassigning.'; end if;
  expected:=p_payload->'expected';
  if a.id is null then
   if expected is distinct from 'null'::jsonb then raise exception 'The worksheet changed. Reload before unassigning.'; end if;
   return null;
  end if;
  if expected->>'sourceId' is distinct from a.id::text or (expected->>'version')::integer is distinct from a.version or (expected->>'dueAt')::timestamptz is distinct from a.due_at then raise exception 'The worksheet changed. Reload before unassigning.'; end if;
 else
  if p_due is null or not isfinite(p_due) then raise exception 'Choose a valid worksheet deadline.'; end if;
  if a.id is distinct from (p_payload->>'worksheetId')::uuid or coalesce(a.version,0) is distinct from (p_payload->>'worksheetVersion')::integer then raise exception 'The worksheet changed. Reload before assigning.'; end if;
 end if;
 if a.id is not null then
  select * into q from quiz_assignments where id=a.quiz_id and course_id=p_course for update;
  if not found or q.deleted_at is not null or a.student_ids is not null or q.student_ids is not null then raise exception 'This worksheet pair is unavailable for whole-class scheduling.'; end if;
  if exists(select 1 from choice_sections s cross join lateral jsonb_array_elements(s.options) o cross join lateral jsonb_array_elements(o->'steps') st where s.course_id=p_course and s.published_at is not null and st->>'kind'='quiz' and st->>'sourceId'=q.id::text) then raise exception 'This quiz belongs to a student choice menu. Remove it from that menu before scheduling the worksheet for the whole class.'; end if;
  if p_remove then
   perform update_worksheet_pair(a.id,a.version,a.due_at,q.due_at,'archived',p_actor,p_owner);
  else
   quiz_gap:=greatest(0,(q.due_at at time zone 'America/New_York')::date-(a.due_at at time zone 'America/New_York')::date);
   quiz_due:=quiz_schedule_due(((p_due at time zone 'America/New_York')::date+quiz_gap+time '23:59') at time zone 'America/New_York',false);
   perform update_worksheet_pair(a.id,a.version,p_due,quiz_due,'published',p_actor,p_owner);
   update worksheet_assignments set plan_key=p_key where id=a.id;
  end if;
 else
  d:=p_payload->'worksheetDraft';
  if d->>'unit' is distinct from unit or (d->>'day')::integer is distinct from day_number or d->>'edition' is distinct from edition_name or d->'quiz'->>'course_id' is distinct from p_course::text or d->'quiz'->'student_ids' is distinct from 'null'::jsonb then raise exception 'Reload this worksheet and its paired quiz before assigning.'; end if;
  quiz_due:=quiz_schedule_due(p_due,false);
  perform assign_worksheet_pair((d->>'id')::uuid,unit,day_number,edition_name,p_due,d->>'source',d->'quiz'||jsonb_build_object('due_at',quiz_due),p_actor,p_owner);
  update worksheet_assignments set plan_key=p_key where id=(d->>'id')::uuid returning * into a;
 end if;
 return a.id;
end $$;
revoke all on function public.place_worksheet_pair(uuid,text,timestamptz,jsonb,text,text,boolean) from public,anon,authenticated;
grant execute on function public.place_worksheet_pair(uuid,text,timestamptz,jsonb,text,text,boolean) to service_role;

-- A calendar placement and its native student assignment are one transaction.
-- Existing teaching-only clients remain compatible; the new UI uses this RPC.
create or replace function public.schedule_teaching_activity(p_owner text,p_plan uuid,p_course uuid,p_plan_version integer,p_version integer,p_payload jsonb,p_actor text)
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
 elsif kind='worksheet-template' then
   select id into native_id from worksheet_assignments where course_id=p_course and plan_key=activity_key;
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
 elsif kind='worksheet-template' then
   native_id:=public.place_worksheet_pair(p_course,activity_key,deadline,p_payload,p_actor,p_owner,false);
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
   if exists(select 1 from worksheet_assignments where quiz_id=q.id) then raise exception 'Manage this quiz with its linked paper worksheet on the calendar.'; end if;
   if exists(select 1 from reading_syllabus_bundles where reading_quiz_id=q.id or vocabulary_quiz_id=q.id) then raise exception 'Drag the linked reading to schedule this quiz with its reading sequence.'; end if;
   perform public.save_quiz_assignment(to_jsonb(q)||jsonb_build_object('status','published','due_at',deadline),p_actor,p_owner);
 end if;
 return result || jsonb_build_object('assigned',true,'dueOn',due_day,'sourceId',native_id);
end $$;
revoke all on function public.schedule_teaching_activity(text,uuid,uuid,integer,integer,jsonb,text) from public,anon,authenticated;
grant execute on function public.schedule_teaching_activity(text,uuid,uuid,integer,integer,jsonb,text) to service_role;

-- Removing a calendar card withdraws its native assignment in the same transaction.
-- Keep assignment IDs, responses, grades and mastery evidence for later reassignment.
create or replace function public.unassign_teaching_activity(p_owner text,p_plan uuid,p_course uuid,p_plan_version integer,p_version integer,p_payload jsonb,p_actor text)
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
 elsif kind='worksheet-template' then
   select id into native_id from worksheet_assignments where course_id=p_course and plan_key=activity_key;
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
 elsif kind='worksheet-template' then
   native_id:=public.place_worksheet_pair(p_course,activity_key,null,p_payload,p_actor,p_owner,true);
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
   if exists(select 1 from worksheet_assignments where quiz_id=q.id) then raise exception 'Manage this quiz with its linked paper worksheet on the calendar.'; end if;
   if exists(select 1 from reading_syllabus_bundles where reading_quiz_id=q.id or vocabulary_quiz_id=q.id) then raise exception 'Unassign the linked reading to remove this quiz with its reading sequence.'; end if;
   if q.status='published' then update quiz_assignments set status='archived',due_at=null,version=version+1,updated_at=now() where id=q.id; end if;
 end if;
 return result || jsonb_build_object('unassigned',true,'sourceId',native_id);
end $$;
revoke all on function public.unassign_teaching_activity(text,uuid,uuid,integer,integer,jsonb,text) from public,anon,authenticated;
grant execute on function public.unassign_teaching_activity(text,uuid,uuid,integer,integer,jsonb,text) to service_role;
