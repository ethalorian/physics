-- Choice planning is separate from assignment submissions and mastery evidence.
create table public.choice_sections (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id),
  title text not null check (length(title) between 1 and 160),
  opens_at timestamptz not null,
  due_at timestamptz not null,
  required_count integer not null check (required_count between 1 and 40),
  category_minimums jsonb not null default '{}',
  points_per_choice numeric not null default 10 check (points_per_choice > 0 and points_per_choice <= 1000),
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) <= 40),
  published boolean not null default false,
  published_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  check (opens_at < due_at)
);
create index choice_sections_course on public.choice_sections(course_id, due_at);
create table public.choice_selections (
  section_id uuid not null references public.choice_sections(id),
  option_id text not null,
  user_id uuid not null references public.students(id),
  planned_on date,
  step_dates jsonb not null default '{}' check (jsonb_typeof(step_dates)='object'),
  selected boolean not null default true,
  lab_completed_at timestamptz,
  swap_requested boolean not null default false,
  score numeric check (score between 0 and 1000),
  graded_by text,
  updated_at timestamptz not null default now(),
  primary key(section_id, option_id, user_id)
);
create index choice_selections_student on public.choice_selections(user_id, section_id);
create table public.choice_lab_slots (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.choice_sections(id),
  option_id text not null,
  teacher_email text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  group_number integer not null check (group_number between 1 and 2),
  capacity integer not null default 4 check (capacity between 1 and 4),
  cancelled boolean not null default false,
  check (ends_at > starts_at and ends_at <= starts_at + interval '3 hours')
);
create index choice_lab_slots_section on public.choice_lab_slots(section_id, starts_at);
create index choice_lab_slots_teacher on public.choice_lab_slots(teacher_email, starts_at, ends_at) where not cancelled;
create table public.choice_lab_bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.choice_lab_slots(id),
  section_id uuid not null references public.choice_sections(id),
  option_id text not null,
  user_id uuid not null references public.students(id),
  booked_by text not null,
  created_at timestamptz not null default now(),
  unique(section_id, option_id, user_id)
);
create index choice_lab_bookings_slot on public.choice_lab_bookings(slot_id);
create index choice_lab_bookings_student on public.choice_lab_bookings(user_id);
create table public.choice_audit (
  id bigint generated always as identity primary key,
  section_id uuid not null references public.choice_sections(id),
  user_id uuid,
  actor text not null,
  action text not null,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index choice_audit_section on public.choice_audit(section_id, created_at);
alter table public.choice_sections enable row level security;
alter table public.choice_selections enable row level security;
alter table public.choice_lab_slots enable row level security;
alter table public.choice_lab_bookings enable row level security;
alter table public.choice_audit enable row level security;
revoke all on public.choice_sections, public.choice_selections, public.choice_lab_slots, public.choice_lab_bookings, public.choice_audit from public, anon, authenticated;
grant all on public.choice_sections, public.choice_selections, public.choice_lab_slots, public.choice_lab_bookings, public.choice_audit to service_role;
grant usage, select on sequence public.choice_audit_id_seq to service_role;

-- Receipts come from existing work tables. Merely opening an assignment does
-- not lock a choice; a saved response, attempt, submission, or lab completion does.
create function public.choice_option_attempted(p_option jsonb, p_user uuid)
returns boolean language plpgsql stable security invoker set search_path = public as $$
declare s jsonb; sid uuid;
begin
  for s in select value from jsonb_array_elements(p_option->'steps') loop
    sid := (s->>'sourceId')::uuid;
    if s->>'kind'='reading' and exists(select 1 from textbook_work where assignment_id=sid and user_id=p_user and (answers<>'{}'::jsonb or submission_id is not null)) then return true; end if;
    if s->>'kind'='quiz' and exists(select 1 from quiz_work where quiz_id=sid and user_id=p_user and (answers<>'{}'::jsonb or submission_id is not null)) then return true; end if;
    if s->>'kind'='lesson' and (exists(select 1 from block_responses where lesson_id=sid and user_id=p_user) or exists(select 1 from block_drafts where lesson_id=sid and user_id=p_user) or exists(select 1 from lesson_submissions where lesson_id=sid and user_id=p_user) or exists(select 1 from lesson_artifacts where lesson_id=sid and user_id=p_user)) then return true; end if;
    if s->>'kind'='vocabulary' and (exists(select 1 from vocab_checks where task_id=sid and user_id=p_user and (coalesce(result,'[]'::jsonb)<>'[]'::jsonb or completed_at is not null)) or exists(select 1 from vocab_checkpoint_attempts where task_id=sid and user_id=p_user and (answers<>'{}'::jsonb or submitted_at is not null)) or exists(select 1 from vocab_attempts a join vocab_tasks t on a.term_id=any(t.term_ids) and a.created_at>=t.created_at where t.id=sid and a.user_id=p_user)) then return true; end if;
    if s->>'kind'='simulation' and exists(select 1 from student_simulation_assignments where simulation_assignment_id=sid and student_id=p_user::text and (started_at is not null or submitted_at is not null)) then return true; end if;
    if s->>'kind'='math' and exists(select 1 from math_mission_sessions where assignment_id=sid and user_id=p_user) then return true; end if;
  end loop;
  return false;
end $$;
revoke all on function public.choice_option_attempted(jsonb,uuid) from public,anon,authenticated;
grant execute on function public.choice_option_attempted(jsonb,uuid) to service_role;

-- All mutations use the same short transaction and section lock. Booking also
-- locks the student globally, preventing simultaneous reservations in two tabs.
create function public.mutate_choice_calendar(p_section uuid,p_user uuid,p_actor text,p_teacher boolean,p_action text,p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare sec choice_sections; opt jsonb; sel choice_selections; sl choice_lab_slots; option_key text; day date; started boolean; owner text; item jsonb;
begin
  select * into sec from choice_sections where id=p_section for update;
  if not found then raise exception 'Choice section unavailable.'; end if;
  select teacher_email into owner from courses where id=sec.course_id and archived_at is null and coalesce(program,'physics')='physics';
  if owner is null then raise exception 'Physics class unavailable.'; end if;
  if p_teacher then
    if p_actor<>owner then raise exception 'Only the teacher of this class can make this change.'; end if;
  elsif not exists(select 1 from course_students where course_id=sec.course_id and student_id=p_user and enrollment_state='ACTIVE') then
    raise exception 'Student is not enrolled in this class.';
  end if;
  if not p_teacher and (not sec.published or now()<sec.opens_at) then raise exception 'This choice section is not available yet.'; end if;
  if p_action='publish' and p_teacher then
    update choice_sections set published=(p_payload->>'published')::boolean,published_at=case when (p_payload->>'published')::boolean then coalesce(published_at,now()) else published_at end,version=version+1 where id=p_section;
  elsif p_action='slots' and p_teacher then
    -- A teacher can supervise two groups simultaneously. Groups sharing a
    -- number may never overlap, including across classes and choice sections.
    perform pg_advisory_xact_lock(hashtextextended(owner,1));
    for item in select value from jsonb_array_elements(p_payload->'slots') loop
      if (item->>'group_number')::integer not between 1 and 2 or (item->>'capacity')::integer not between 1 and 4 then raise exception 'Use groups 1 or 2 with at most four seats.'; end if;
      select value into opt from jsonb_array_elements(sec.options) where value->>'id'=item->>'option_id';
      if opt is null or not (opt->>'lab')::boolean then raise exception 'Choose an instructor lab.'; end if;
      if (item->>'starts_at')::timestamptz < sec.opens_at or (item->>'ends_at')::timestamptz > sec.due_at then raise exception 'Lab sessions must fit the choice availability window.'; end if;
      if exists(select 1 from choice_lab_slots where teacher_email=owner and not cancelled and group_number=(item->>'group_number')::integer and starts_at<(item->>'ends_at')::timestamptz and ends_at>(item->>'starts_at')::timestamptz) then raise exception 'This instructor group already has an overlapping session.'; end if;
      insert into choice_lab_slots(section_id,option_id,teacher_email,starts_at,ends_at,group_number,capacity) values(p_section,item->>'option_id',owner,(item->>'starts_at')::timestamptz,(item->>'ends_at')::timestamptz,(item->>'group_number')::integer,(item->>'capacity')::integer);
    end loop;
  elsif p_action='book-group' and p_teacher then
    if jsonb_array_length(p_payload->'student_ids') not between 1 and 4 then raise exception 'Choose up to four students.'; end if;
    for item in select value from jsonb_array_elements(p_payload->'student_ids') order by value loop
      if exists(select 1 from choice_lab_bookings where section_id=p_section and option_id=p_payload->>'option_id' and user_id=(item#>>'{}')::uuid) then raise exception 'A student booked a session after this suggestion. Refresh the groups.'; end if;
      perform public.mutate_choice_calendar(p_section,(item#>>'{}')::uuid,p_actor,true,'book',jsonb_build_object('option_id',p_payload->>'option_id','slot_id',p_payload->>'slot_id'));
    end loop;
  elsif p_action='cancel-slot' and p_teacher then
    update choice_lab_slots set cancelled=true where id=(p_payload->>'slot_id')::uuid and section_id=p_section;
    update choice_selections s set planned_on=null,updated_at=now() from choice_lab_bookings b where b.slot_id=(p_payload->>'slot_id')::uuid and b.section_id=p_section and s.section_id=b.section_id and s.option_id=b.option_id and s.user_id=b.user_id;
    delete from choice_lab_bookings where slot_id=(p_payload->>'slot_id')::uuid and section_id=p_section;
  else
    option_key:=p_payload->>'option_id';
    select value into opt from jsonb_array_elements(sec.options) where value->>'id'=option_key;
    if opt is null then raise exception 'Choice unavailable.'; end if;
    if p_user is null or not exists(select 1 from course_students where course_id=sec.course_id and student_id=p_user and enrollment_state='ACTIVE') then raise exception 'Choose an enrolled student.'; end if;
    perform pg_advisory_xact_lock(hashtextextended(p_user::text,2));
    select * into sel from choice_selections where section_id=p_section and option_id=option_key and user_id=p_user;
    started:=sel.lab_completed_at is not null or public.choice_option_attempted(opt,p_user);
    if p_action='plan-step' then
      if not p_teacher and now()>sec.due_at then raise exception 'Ask your teacher to change a plan after the deadline.'; end if;
      if not exists(select 1 from jsonb_array_elements(opt->'steps') s where s->>'id'=p_payload->>'step_id' and not coalesce((s->>'followUp')::boolean,false)) then raise exception 'Choose an activity from this choice.'; end if;
      day:=(p_payload->>'planned_on')::date;
      if day is not null and (day<(sec.opens_at at time zone 'America/New_York')::date or day>(sec.due_at at time zone 'America/New_York')::date) then raise exception 'Choose a date inside the availability window.'; end if;
      insert into choice_selections(section_id,option_id,user_id,step_dates) values(p_section,option_key,p_user,jsonb_build_object(p_payload->>'step_id',day))
      on conflict(section_id,option_id,user_id) do update set selected=true,step_dates=choice_selections.step_dates || excluded.step_dates,updated_at=now();
    elsif p_action in ('select','book') then
      if not p_teacher and now()>sec.due_at then raise exception 'Ask your teacher to add or change a choice after the deadline.'; end if;
      if p_action='book' then
        select * into sl from choice_lab_slots where id=(p_payload->>'slot_id')::uuid and section_id=p_section and option_id=option_key and not cancelled for update;
        if not found or sl.starts_at<=now() then raise exception 'Choose an upcoming available lab session.'; end if;
        if exists(select 1 from choice_lab_bookings b join choice_lab_slots s on s.id=b.slot_id where b.user_id=p_user and not s.cancelled and s.starts_at<sl.ends_at and s.ends_at>sl.starts_at and not (b.section_id=p_section and b.option_id=option_key)) then raise exception 'You already have a lab appointment at that time.'; end if;
        if (select count(*) from choice_lab_bookings where slot_id=sl.id and user_id<>p_user)>=sl.capacity then raise exception 'This group is full. Choose another session.'; end if;
        if sel.lab_completed_at is not null then raise exception 'This lab is already complete.'; end if;
        insert into choice_lab_bookings(slot_id,section_id,option_id,user_id,booked_by) values(sl.id,p_section,option_key,p_user,p_actor) on conflict(section_id,option_id,user_id) do update set slot_id=excluded.slot_id,booked_by=excluded.booked_by,created_at=now();
        day:=(sl.starts_at at time zone 'America/New_York')::date;
      else
        day:=(p_payload->>'planned_on')::date;
        if day is not null and (day<(sec.opens_at at time zone 'America/New_York')::date or day>(sec.due_at at time zone 'America/New_York')::date) then raise exception 'Choose a date inside the availability window.'; end if;
        if (opt->>'lab')::boolean and exists(select 1 from choice_lab_bookings where section_id=p_section and option_id=option_key and user_id=p_user) then raise exception 'Move this lab by choosing a different available session.'; end if;
      end if;
      insert into choice_selections(section_id,option_id,user_id,planned_on) values(p_section,option_key,p_user,day) on conflict(section_id,option_id,user_id) do update set selected=true,planned_on=excluded.planned_on,step_dates=case when p_action='select' then '{}'::jsonb else choice_selections.step_dates end,swap_requested=false,updated_at=now();
    elsif p_action='cancel-booking' then
      if sel.lab_completed_at is not null and not p_teacher then raise exception 'Ask your instructor to change a completed lab.'; end if;
      delete from choice_lab_bookings where section_id=p_section and option_id=option_key and user_id=p_user;
      update choice_selections set planned_on=null,updated_at=now() where section_id=p_section and option_id=option_key and user_id=p_user;
    elsif p_action='remove' then
      if started and not p_teacher then
        insert into choice_selections(section_id,option_id,user_id,swap_requested) values(p_section,option_key,p_user,true) on conflict(section_id,option_id,user_id) do update set swap_requested=true,updated_at=now();
        insert into choice_audit(section_id,user_id,actor,action,detail) values(p_section,p_user,p_actor,'request-swap',p_payload);
        return jsonb_build_object('requested',true);
      end if;
      update choice_selections set selected=false,swap_requested=false,planned_on=null,step_dates='{}',updated_at=now() where section_id=p_section and option_id=option_key and user_id=p_user;
      delete from choice_lab_bookings where section_id=p_section and option_id=option_key and user_id=p_user;
    elsif p_action='complete-lab' and p_teacher then
      if not (opt->>'lab')::boolean then raise exception 'Choose an instructor lab.'; end if;
      insert into choice_selections(section_id,option_id,user_id,lab_completed_at) values(p_section,option_key,p_user,now()) on conflict(section_id,option_id,user_id) do update set lab_completed_at=now(),updated_at=now();
    elsif p_action='grade' and p_teacher then
      if (p_payload->>'score')::numeric<0 or (p_payload->>'score')::numeric>sec.points_per_choice then raise exception 'Enter a score within this activity’s points.'; end if;
      if not started then raise exception 'Grade attempted work; missing choices are handled automatically.'; end if;
      insert into choice_selections(section_id,option_id,user_id,score,graded_by) values(p_section,option_key,p_user,(p_payload->>'score')::numeric,p_actor) on conflict(section_id,option_id,user_id) do update set score=excluded.score,graded_by=p_actor,updated_at=now();
    else raise exception 'Unsupported choice action.';
    end if;
  end if;
  insert into choice_audit(section_id,user_id,actor,action,detail) values(p_section,p_user,p_actor,p_action,p_payload);
  return jsonb_build_object('ok',true);
end $$;
revoke all on function public.mutate_choice_calendar(uuid,uuid,text,boolean,text,jsonb) from public,anon,authenticated;
grant execute on function public.mutate_choice_calendar(uuid,uuid,text,boolean,text,jsonb) to service_role;

-- A course lock makes source ownership atomic across concurrent editors.
create function public.save_choice_section(p_section uuid,p_course uuid,p_actor text,p_version integer,p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare old choice_sections; open_time timestamptz; due_time timestamptz;
begin
  perform 1 from courses where id=p_course and teacher_email=p_actor and archived_at is null and coalesce(program,'physics')='physics' for update;
  if not found then raise exception 'Choose one of your Physics classes.'; end if;
  select * into old from choice_sections where id=p_section and course_id=p_course for update;
  if (p_version is null and old.id is not null) or (p_version is not null and (old.id is null or old.version<>p_version)) then raise exception 'This section changed. Refresh before saving.'; end if;
  open_time:=(p_payload->>'opens_at')::timestamptz; due_time:=(p_payload->>'due_at')::timestamptz;
  if (old.published or old.published_at is not null) and (old.options<>p_payload->'options' or old.required_count<>(p_payload->>'required_count')::integer or old.points_per_choice<>(p_payload->>'points_per_choice')::numeric or old.category_minimums<>p_payload->'category_minimums') then raise exception 'Published activity and grading rules are fixed. Create another section for new rules.'; end if;
  if old.options<>p_payload->'options' and (exists(select 1 from choice_lab_slots where section_id=p_section and not cancelled) or exists(select 1 from choice_selections where section_id=p_section)) then raise exception 'Keep activities fixed once students or lab sessions use them.'; end if;
  if exists(select 1 from choice_lab_slots where section_id=p_section and not cancelled and (starts_at<open_time or ends_at>due_time)) or exists(select 1 from choice_selections where section_id=p_section and selected and (planned_on<(open_time at time zone 'America/New_York')::date or planned_on>(due_time at time zone 'America/New_York')::date)) or exists(select 1 from choice_selections s cross join lateral jsonb_each_text(s.step_dates) d where s.section_id=p_section and s.selected and (d.value::date<(open_time at time zone 'America/New_York')::date or d.value::date>(due_time at time zone 'America/New_York')::date)) then raise exception 'The window must include existing student plans and lab reservations. Move those first.'; end if;
  if exists(select 1 from choice_sections s cross join lateral jsonb_array_elements(s.options) o cross join lateral jsonb_array_elements(o->'steps') st cross join lateral jsonb_array_elements(p_payload->'options') n cross join lateral jsonb_array_elements(n->'steps') ns where s.course_id=p_course and s.id<>p_section and st->>'kind'=ns->>'kind' and st->>'sourceId'=ns->>'sourceId') then raise exception 'An activity already belongs to another choice section.'; end if;
  insert into choice_sections(id,course_id,title,opens_at,due_at,required_count,category_minimums,points_per_choice,options)
  values(p_section,p_course,p_payload->>'title',open_time,due_time,(p_payload->>'required_count')::integer,p_payload->'category_minimums',(p_payload->>'points_per_choice')::numeric,p_payload->'options')
  on conflict(id) do update set title=excluded.title,opens_at=excluded.opens_at,due_at=excluded.due_at,required_count=excluded.required_count,category_minimums=excluded.category_minimums,points_per_choice=excluded.points_per_choice,options=excluded.options,version=choice_sections.version+1;
  insert into choice_audit(section_id,actor,action,detail) values(p_section,p_actor,case when p_version is null then 'create' else 'update' end,p_payload);
  return jsonb_build_object('id',p_section);
end $$;
revoke all on function public.save_choice_section(uuid,uuid,text,integer,jsonb) from public,anon,authenticated;
grant execute on function public.save_choice_section(uuid,uuid,text,integer,jsonb) to service_role;
