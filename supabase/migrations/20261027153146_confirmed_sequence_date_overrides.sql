-- Confirmation-only date overrides. No existing dates or student records are changed.
create or replace function public.schedule_daily_lesson_sequence()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
declare t daily_lesson_templates;b daily_lesson_sequences;c courses;other_id uuid;fid uuid;rid uuid;qid uuid;
 foundation_day date;review_day date;other_slug text;other_day date;questions jsonb;deadline timestamptz;
begin
 -- Only this trigger writes the companion assignment. Do not let that write
 -- recursively reinterpret the companion as a second calendar placement.
 if pg_trigger_depth()>1 then return new;end if;
 select * into t from daily_lesson_templates where new.slug in (foundation_slug,review_slug);
 if not found then return new;end if;
 perform pg_advisory_xact_lock(hashtextextended(new.course_id::text||':'||t.key,0));
 select * into b from daily_lesson_sequences where course_id=new.course_id and sequence_key=t.key;
 -- A confirmed, class/sequence-scoped transaction may change one date only.
 if new.due_on is not null and current_setting('app.sequence_date_override',true)=new.course_id::text||'|'||t.key then return new;end if;
 if new.due_on is null then
  if b.quiz_id is not null then
   update interactive_assignments set due_on=null where id in (b.foundation_id,b.review_id) and id<>new.id and due_on is not null;
   update quiz_assignments set status='archived',version=version+1,updated_at=now() where id=b.quiz_id and status<>'archived';
  end if;
  return new;
 end if;
 select * into c from courses where id=new.course_id and program='physics' and archived_at is null;
 if not found then raise exception 'Choose an active Physics class.';end if;
 if new.slug=t.foundation_slug then
  foundation_day:=new.due_on;review_day:=public.lesson_school_day_shift(foundation_day,3);
  other_slug:=t.review_slug;other_day:=review_day;
 else
  review_day:=new.due_on;foundation_day:=public.lesson_school_day_shift(review_day,-3);
  other_slug:=t.foundation_slug;other_day:=foundation_day;
 end if;
 if foundation_day<'2000-01-01'::date or review_day>'2100-12-31'::date then raise exception 'Choose dates between 2000 and 2100 for the whole lesson sequence.';end if;
 insert into interactive_assignments(course_id,slug,target_id,due_on) values(new.course_id,other_slug,new.target_id,other_day)
 on conflict(course_id,slug) do update set due_on=excluded.due_on returning id into other_id;
 fid:=case when new.slug=t.foundation_slug then new.id else other_id end;
 rid:=case when new.slug=t.review_slug then new.id else other_id end;
 deadline:=(review_day+time '23:59') at time zone 'America/New_York';
 if b.quiz_id is null then
  qid:=gen_random_uuid();
  select jsonb_agg(x||jsonb_build_object('target_id',new.target_id,'id',gen_random_uuid()) order by ordinality) into questions from jsonb_array_elements(t.quiz->'questions') with ordinality a(x,ordinality);
  insert into quiz_assignments(id,course_id,created_by,title,kind,instructions,grade_mode,questions,due_at,status,daily_sequence_key)
  values(qid,new.course_id,c.teacher_email,t.quiz->>'title','understanding',t.quiz->>'instructions','numeric',questions,deadline,'published',t.key);
  insert into daily_lesson_sequences(course_id,sequence_key,foundation_id,review_id,quiz_id) values(new.course_id,t.key,fid,rid,qid);
 else
  if b.foundation_id<>fid or b.review_id<>rid then raise exception 'The linked lesson assignments changed. Reload the calendar.';end if;
  if exists(select 1 from quiz_assignments where id=b.quiz_id and deleted_at is not null) then raise exception 'Restore the linked daily quiz before rescheduling this lesson.';end if;
  update quiz_assignments set due_at=deadline,status='published',version=version+1,updated_at=now() where id=b.quiz_id and (due_at is distinct from deadline or status<>'published');
 end if;
 return new;
end $$;


create or replace function public.enforce_quiz_schedule()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if new.daily_sequence_key is not null then
  if tg_op='UPDATE' and new.due_at is not distinct from old.due_at then return new;end if;
  if current_setting('app.sequence_date_override',true)=new.course_id::text||'|'||new.daily_sequence_key then return new;end if;
  if exists(select 1 from daily_lesson_sequences b join interactive_assignments a on a.id=b.review_id where b.quiz_id=new.id and a.due_on is not null and new.due_at is distinct from ((a.due_on::date+time '23:59') at time zone 'America/New_York')) then
   raise exception 'Move the review on the teaching calendar to move its daily quiz.' using errcode='23514';
  end if;
  return new;
 end if;
 if tg_op='UPDATE' and new.due_at is not distinct from old.due_at and new.kind=old.kind then return new;end if;
 if new.due_at is not null and new.due_at is distinct from public.quiz_schedule_due(new.due_at,new.kind='vocabulary') then
  if new.kind='vocabulary' then raise exception 'Vocabulary quizzes are scheduled on Tuesdays and Thursdays.' using errcode='23514';
  else raise exception 'Quizzes are scheduled on Mondays, Wednesdays, and Fridays.' using errcode='23514';end if;
 end if;return new;
end $$;


create function public.daily_lesson_date_context(p_course uuid,p_source text,p_due text)
returns jsonb language sql stable security invoker set search_path=public,pg_temp as $$
 with linked as (
  select b.sequence_key, f.id fid,f.slug fslug,f.due_on fdue,r.id rid,r.slug rslug,r.due_on rdue,
    q.id qid,q.due_at qdue,q.version qversion,q.status qstatus,q.deleted_at qdeleted,
    case p_source when 'interactive:'||f.slug then 'foundation' when 'interactive:'||r.slug then 'review' else 'quiz' end role
  from daily_lesson_sequences b join interactive_assignments f on f.id=b.foundation_id and f.course_id=b.course_id
   join interactive_assignments r on r.id=b.review_id and r.course_id=b.course_id
   join quiz_assignments q on q.id=b.quiz_id and q.course_id=b.course_id
  where b.course_id=p_course and p_source in ('interactive:'||f.slug,'interactive:'||r.slug,'quiz:'||q.id::text)
 ), dates as (
  select *,case when role='foundation' then p_due::date else public.lesson_school_day_shift(p_due::date,-3) end normal_foundation,
   case when role='foundation' then public.lesson_school_day_shift(p_due::date,3) else p_due::date end normal_review
  from linked
 )
 select jsonb_build_object('role',role,'snapshot',jsonb_build_object('course',p_course,'source',p_source,'requestedDue',p_due,'sequenceKey',sequence_key,
  'foundation',jsonb_build_object('id',fid,'slug',fslug,'date',fdue),'review',jsonb_build_object('id',rid,'slug',rslug,'date',rdue),
  'quiz',jsonb_build_object('id',qid,'date',qdue,'version',qversion,'status',qstatus,'deletedAt',qdeleted)),
  'normalDates',jsonb_build_object('foundation',normal_foundation,'review',normal_review,'quiz',(normal_review+time '23:59') at time zone 'America/New_York')) from dates;
$$;

create function public.confirm_daily_lesson_date(p_owner text,p_course uuid,p_source text,p_due text,p_mode text,p_expected jsonb,p_operation text,p_arguments jsonb,p_actor text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare context jsonb; snapshot jsonb; result jsonb; prior_setting text; chosen_step jsonb; target_id uuid; saved_quiz quiz_assignments; source_slug text;
begin
 perform 1 from courses where id=p_course and teacher_email=p_owner and program='physics' and archived_at is null for update;
 if not found or nullif(btrim(p_actor),'') is null then raise exception 'Class unavailable.';end if;
 if p_due is null or p_mode not in ('single','linked') or p_mode is null then raise exception 'Confirm a valid date change.';end if;
 if p_due::date<'2000-01-01'::date or p_due::date>'2100-12-31'::date then raise exception 'Choose a date between 2000 and 2100.';end if;
 if p_operation in ('schedule','assign') then
  perform 1 from teaching_unit_plans where id=(p_arguments->>'plan')::uuid and owner_email=p_owner for update;
  if not found then raise exception 'Plan unavailable.';end if;
  perform 1 from teaching_plan_classes where plan_id=(p_arguments->>'plan')::uuid and course_id=p_course for update;
 end if;
 context:=public.daily_lesson_date_context(p_course,p_source,p_due); snapshot:=context->'snapshot';
 if context is null or p_expected is distinct from snapshot then raise exception 'Linked dates changed. Reload them and confirm again.';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_course::text||':'||(snapshot->>'sequenceKey'),0));
 perform 1 from interactive_assignments where id in ((snapshot->'foundation'->>'id')::uuid,(snapshot->'review'->>'id')::uuid) order by id for update;
 perform 1 from quiz_assignments where id=(snapshot->'quiz'->>'id')::uuid for update;
 -- Course lock is shared by every scheduling entry point. Recheck after the sequence lock.
 if p_expected is distinct from public.daily_lesson_date_context(p_course,p_source,p_due)->'snapshot' then raise exception 'Linked dates changed. Reload them and confirm again.';end if;
 if snapshot->'foundation'->>'date' is null or snapshot->'review'->>'date' is null or snapshot->'quiz'->>'deletedAt' is not null then raise exception 'Assign the linked discussion and review before overriding their dates.';end if;
 if context->>'role'='quiz' and p_mode<>'single' then raise exception 'Move the discussion or review to use linked spacing.';end if;
 prior_setting:=current_setting('app.sequence_date_override',true);
 perform set_config('app.sequence_date_override',case when p_mode='single' then p_course::text||'|'||(snapshot->>'sequenceKey') else '' end,true);
 if p_operation='interactive' then
  source_slug:=substring(p_source from 13);
  if p_source not in ('interactive:'||(snapshot->'foundation'->>'slug'),'interactive:'||(snapshot->'review'->>'slug')) then raise exception 'Assignment unavailable.';end if;
  select a.target_id into target_id from interactive_assignments a where a.course_id=p_course and a.slug=source_slug;
  result:=public.set_interactive_assignment_date(p_course,source_slug,target_id,p_due::date,p_owner);
 elsif p_operation in ('schedule','assign') then
  select st into chosen_step from teaching_plan_classes pc cross join lateral jsonb_array_elements(pc.steps) st
   where pc.plan_id=(p_arguments->>'plan')::uuid and pc.course_id=p_course and st->>'id'=p_arguments->'payload'->>'stepId';
  if chosen_step is null and p_operation='schedule' and (p_arguments->>'version')::integer=0 then
   select st into chosen_step from teaching_unit_plans p cross join lateral jsonb_array_elements(p.steps) st
    where p.id=(p_arguments->>'plan')::uuid and p.owner_email=p_owner and st->>'id'=p_arguments->'payload'->>'stepId';
  end if;
  if chosen_step is null or chosen_step->>'activityKey' is distinct from p_source or context->>'role'='quiz' then raise exception 'Reload this class activity before changing dates.';end if;
  if p_operation='schedule' then
   if p_arguments->'payload'->'slot'->>'date' is distinct from p_due then raise exception 'Confirm the chosen date.';end if;
   result:=public.schedule_teaching_activity(p_owner,(p_arguments->>'plan')::uuid,p_course,(p_arguments->>'planVersion')::integer,(p_arguments->>'version')::integer,p_arguments->'payload',p_actor);
  else
   if p_arguments->'payload'->>'dueOn' is distinct from p_due then raise exception 'Confirm the chosen date.';end if;
   result:=public.change_teaching_class(p_owner,(p_arguments->>'plan')::uuid,p_course,(p_arguments->>'planVersion')::integer,(p_arguments->>'version')::integer,'assign',p_arguments->'payload',p_actor);
  end if;
 elsif p_operation='quiz' then
  if p_source is distinct from 'quiz:'||(snapshot->'quiz'->>'id') or (p_arguments->>'version')::integer is distinct from (snapshot->'quiz'->>'version')::integer then raise exception 'Reload this quiz before changing dates.';end if;
  update quiz_assignments set due_at=p_due::timestamptz,status='published',version=version+1,updated_at=now()
   where id=(snapshot->'quiz'->>'id')::uuid and course_id=p_course and deleted_at is null and status in ('published','archived') returning * into saved_quiz;
  if not found then raise exception 'Quiz unavailable.';end if;
  result:=jsonb_build_object('due_at',saved_quiz.due_at,'version',saved_quiz.version);
 else raise exception 'Choose a supported date action.';
 end if;
 perform set_config('app.sequence_date_override',coalesce(prior_setting,''),true);
 return result;
end $$;
revoke all on function public.daily_lesson_date_context(uuid,text,text),public.confirm_daily_lesson_date(text,uuid,text,text,text,jsonb,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.daily_lesson_date_context(uuid,text,text),public.confirm_daily_lesson_date(text,uuid,text,text,text,jsonb,text,jsonb,text) to service_role;
