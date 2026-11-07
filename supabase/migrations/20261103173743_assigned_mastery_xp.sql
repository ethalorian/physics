-- One eligible submission = 10 XP; four of five eligible assignments meets the unit floor.
-- The authoring catalog has no database grade-mode field. This positive list is
-- checked against the interactive catalog in assigned-mastery-xp.test.ts.
create table public.mastery_xp_interactive_catalog(slug text primary key, unit_id text not null, title text not null);
insert into public.mastery_xp_interactive_catalog values
('day-1-the-briefing','unit-1','Day 1 · The Briefing'),
('day-2-motion-language','unit-1','Day 2 · How Do We Talk About Motion'),
('day-3-velocity','unit-1','Day 3 · Velocity: motion with direction'),
('day-4-velocity-time-vectors','unit-1','Day 4 · Velocity-Time Graphs and Vectors'),
('day-5-predicting-position','unit-1','Day 5 · Predicting the Position'),
('day-6-vectors','unit-1','Day 6 · Vector Addition and Decomposition'),
('day-7-acceleration','unit-1','Day 7 · Acceleration'),
('day-8-kinematics-problems','unit-1','Day 8 · Constant Acceleration Problem-Solving'),
('day-9-inertia','unit-1','Day 9 · Newton’s 1st Law - Inertia'),
('day-10-forces','unit-1','Day 10 · Forces'),
('day-11-vary-mass','unit-1','Day 11 · Newton’s 2nd Law - Vary Mass'),
('day-12-vary-force','unit-1','Day 12 · Newton’s 2nd Law - Vary Force'),
('day-13-fma-practice','unit-1','Day 13 · F equals ma in Practice'),
('day-14-third-law','unit-1','Day 14 · Newton’s 3rd Law'),
('day-15-force-diagrams','unit-1','Day 15 · Free Body Diagrams Part 1'),
('day-16-net-force','unit-1','Day 16 · Free Body Diagrams Part 2 - Net Force'),
('day-17-friction','unit-1','Day 17 · Friction'),
('day-18-equilibrium','unit-1','Day 18 · Equilibrium'),
('day-19-workshop-revision','unit-1','Day 19 · Workshop and Revision'),
('day-20-synthesis','unit-1','Day 20 · Synthesis'),
('day-1-foundation-briefing','unit-1','Day 1 · Foundation: The briefing'),
('day-2-foundation-motion','unit-1','Day 2 · Foundation: Talking about motion'),
('day-4-foundation-vectors','unit-1','Day 4 · Foundation: Velocity–time graphs and vectors'),
('day-5-foundation-prediction','unit-1','Day 5 · Foundation: Predicting position and uncertainty'),
('day-6-foundation-vector-tools','unit-1','Day 6 · Foundation: Vector addition and decomposition'),
('day-7-foundation-acceleration','unit-1','Day 7 · Foundation: Acceleration'),
('day-8-foundation-kinematics','unit-1','Day 8 · Foundation: Constant acceleration problem-solving'),
('day-9-foundation-inertia','unit-1','Day 9 · Foundation: Newton’s first law and inertia'),
('day-13-foundation-net-force','unit-1','Day 13 · Foundation: F = ma in practice'),
('day-15-foundation-free-body-diagrams','unit-1','Day 15 · Foundation: Free-body diagrams'),
('day-16-foundation-net-force-from-diagrams','unit-1','Day 16 · Foundation: Net force from diagrams');

-- Teachers opt in per class; migration alone never pays or posts real student work.
create table public.mastery_xp_courses(course_id uuid primary key references public.courses, enabled_by text not null, enabled_at timestamptz not null default now());
alter table public.mastery_xp_courses enable row level security;
revoke all on public.mastery_xp_courses from public,anon,authenticated,service_role;
grant select,insert on public.mastery_xp_courses to service_role;

create table public.mastery_xp_receipts (
 course_id uuid not null references public.courses, user_id uuid not null references public.students,
 work_key text not null, unit_id text not null, earned_at timestamptz not null,
 wallet_added integer not null check(wallet_added between 0 and 10), primary key(course_id,user_id,work_key)
);
create table public.mastery_xp_releases (
 course_id uuid not null references public.courses, unit_id text not null, term_id text not null,
 released_at timestamptz not null default now(), released_by text not null,
 primary key(course_id,unit_id)
);
create table public.mastery_xp_results (
 course_id uuid not null, unit_id text not null, user_id uuid not null references public.students,
 assigned integer not null check(assigned>0), completed integer not null check(completed between 0 and assigned),
 primary key(course_id,unit_id,user_id), foreign key(course_id,unit_id) references public.mastery_xp_releases
);
alter table public.mastery_xp_interactive_catalog enable row level security;
alter table public.mastery_xp_receipts enable row level security;
alter table public.mastery_xp_releases enable row level security;
alter table public.mastery_xp_results enable row level security;
revoke all on public.mastery_xp_interactive_catalog,public.mastery_xp_receipts,public.mastery_xp_releases,public.mastery_xp_results from public,anon,authenticated,service_role;
grant select on public.mastery_xp_interactive_catalog to service_role;
grant select,insert on public.mastery_xp_receipts,public.mastery_xp_releases,public.mastery_xp_results to service_role;

-- Math missions previously had only a teacher and a student; do not guess a unit.
alter table public.math_mission_assignments add column xp_course_id uuid references public.courses, add column xp_unit_id text references public.units,
 add constraint math_mission_xp_context check ((xp_course_id is null)=(xp_unit_id is null));

-- Work in a graded lesson cannot earn indirectly through a video, a saved block,
-- or a live response attached to the lab/transfer session.
create function public.mastery_xp_graded_lesson(l public.lessons) returns boolean
language sql immutable security invoker set search_path='' as $$
 select coalesce(l.transfer_core,false) or l.simulation_id is not null or
 lower(coalesce(l.lesson_type,'')) in ('lab','quiz','transfer','simulation') or
 upper(coalesce(l.content_blocks->>'dayType','')) in ('LAB','QUIZ','TRANSFER') or
 coalesce(l.content_blocks#>>'{learningPath,kind}','') in ('investigation','mission','transfer','quiz','lab')
$$;

create function public.mastery_xp_work(p_course uuid,p_user uuid)
returns table(work_key text,unit_id text,title text,href text,submitted_at timestamptz)
language sql stable security invoker set search_path='' as $$
 with roster as (
 select c.track,cs.enrolled_at from public.course_students cs join public.courses c on c.id=cs.course_id join public.students st on st.id=cs.student_id
 where c.id=p_course and cs.student_id=p_user and cs.enrollment_state='ACTIVE' and st.is_active is not false and c.archived_at is null and c.program='physics'
 ), items as (
 select 'interactive:'||a.id work_key,cat.unit_id,cat.title,'/interactive-assignments/'||a.id href,
 (select min(s.submitted_at) from public.interactive_assignment_submissions s where s.assignment_id=a.id and s.user_id=p_user) submitted_at
 from public.interactive_assignments a join public.mastery_xp_interactive_catalog cat on cat.slug=a.slug
 where a.course_id=p_course and a.due_on is not null
 union all
 select 'reading:'||a.id,t.unit_id,a.title,'/readings/'||a.id,
 (select min(s.submitted_at) from public.textbook_submissions s where s.assignment_id=a.id and s.user_id=p_user)
 from public.textbook_assignments a cross join lateral (
 select t.unit_id from jsonb_array_elements(a.questions) with ordinality q(question,seq) join public.learning_targets t on t.id::text=q.question->>'target_id' where t.program='physics' and t.unit_id is not null order by q.seq limit 1
 ) t where a.course_id=p_course and a.status='published' and a.due_at is not null and (a.opens_at is null or a.opens_at<=now())
 and not exists(select from public.textbook_reading_exemptions e where e.assignment_id=a.id and e.user_id=p_user)
 union all
 select 'vocabulary:'||v.id,t.unit_id,v.title,'/vocabulary/work?task_id='||v.id,
 (select min(s.completed_at) from public.vocab_checks s where s.task_id=v.id and s.user_id=p_user and s.completed_at is not null
 and case when jsonb_typeof(s.result)='array' and jsonb_typeof(s.items)='array' then jsonb_array_length(s.result)>0 and jsonb_array_length(s.result)=jsonb_array_length(s.items) else false end)
 from public.vocab_tasks v join public.learning_targets t on t.id=v.target_id where v.course_id=p_course and p_user=any(v.student_ids)
 and v.active and not coalesce(v.syllabus_draft,false) and v.due_on is not null and v.task_kind='practice' and v.quiz_format is distinct from 'checkpoint'
 union all
 select 'lesson:'||l.id,l.unit_id,l.title,'/lessons/'||l.slug,
 (select min(s.submitted_at) from public.lesson_submissions s where s.lesson_id=l.id and s.user_id=p_user and s.submitted_at>=greatest(coalesce(w.open_at,'-infinity'::timestamptz),coalesce(r.enrolled_at,'-infinity'::timestamptz)))
 from public.lessons l join public.lesson_class_windows w on w.lesson_id=l.id::text and w.course_id=p_course::text cross join roster r
 where w.due_at is not null and (w.open_at is null or w.open_at<=now()) and l.published and not public.mastery_xp_graded_lesson(l) and l.unit_id ~ '^unit-[1-8]$'
 and (nullif(l.visibility_track,'') is null or l.visibility_track=coalesce(r.track,'cpa'))
 and (l.content_blocks#>>'{reflection,kind}' in ('manga','story','graphic-novel') or
 (l.content_blocks->>'presentation'='physics-path' and l.content_blocks#>>'{learningPath,kind}' in ('lesson','review','practice')))
 -- Unscoped lesson submissions must not fund two classes.
 and not exists(select from public.lesson_class_windows w2 join public.course_students cs on cs.course_id::text=w2.course_id and cs.student_id=p_user and cs.enrollment_state='ACTIVE' where w2.lesson_id=w.lesson_id and w2.course_id<>w.course_id and w2.due_at is not null)
 union all
 select 'presentation:'||p.id,t.unit_id,coalesce(nullif(p.prompt,''),'Classroom response'),'/home?view=week',
 (select min(s.created_at) from public.present_ticket_responses s where s.pulse_id=p.id and s.user_id=p_user and nullif(trim(s.response),'') is not null)
 from public.present_pulses p join public.present_sessions session on session.id=p.session_id join public.learning_targets t on t.id=p.target_id cross join roster r
 where session.course_id=p_course and not exists(select from public.lessons l where l.id=session.lesson_id and public.mastery_xp_graded_lesson(l)) and p.required and not p.anonymous and p.kind in ('warmup','solo','exit_ticket') and (r.enrolled_at is null or p.created_at>=r.enrolled_at)
 union all
 select 'mission:'||a.id,a.xp_unit_id,a.title,'/arcade/missions',
 (select min(s.completed_at) from public.math_mission_sessions s where s.assignment_id=a.id and s.user_id=p_user and s.status='completed' and not s.staff)
 from public.math_mission_assignments a where a.xp_course_id=p_course and a.user_id=p_user and a.cancelled_at is null and a.due_at is not null
 ), graded_choice_steps as (
 select step->>'kind'||':'||(step->>'sourceId') k from public.choice_sections sec cross join lateral jsonb_array_elements(sec.options) opt cross join lateral jsonb_array_elements(opt->'steps') step
 where sec.course_id=p_course and sec.published and sec.points_per_choice>0 and not coalesce((step->>'followUp')::boolean,false)
 )
 select i.* from items i where exists(select from roster) and i.unit_id is not null and not exists(select from graded_choice_steps g where g.k=i.work_key)
$$;

-- Credit the first immutable submission, regardless of later review or revision.
-- Historical payment stays in the wallet; only the difference is deposited.
create function public.credit_mastery_xp(p_course uuid,p_user uuid,p_key text default null) returns void
language plpgsql security invoker set search_path='' as $$
declare w record; delta integer; prior integer;
begin
 perform pg_advisory_xact_lock_shared(hashtextextended(p_course::text,0));
 if not exists(select from public.mastery_xp_courses where course_id=p_course) then return; end if;
 for w in select * from public.mastery_xp_work(p_course,p_user) where submitted_at is not null and (p_key is null or work_key=p_key) order by work_key loop
  select coalesce(sum(g.points),0) into prior from public.economy_point_grants g where g.user_id=p_user and g.dedupe_key=
   (case split_part(w.work_key,':',1) when 'reading' then 'reading-assignment' when 'vocabulary' then 'vocab-assignment' end)||':'||split_part(w.work_key,':',2)||':'||p_user;
  delta:=greatest(0,10-prior);
  insert into public.mastery_xp_receipts values(p_course,p_user,w.work_key,w.unit_id,w.submitted_at,delta) on conflict do nothing;
  if found and delta>0 then
   insert into public.economy_point_grants(user_id,user_email,source,reference,points,note,dedupe_key,awarded_at,unit_id)
   select p_user,s.email,'mastery-assignment',w.work_key,delta,'Assigned mastery work: '||w.title,'mastery-assignment:'||p_course||':'||w.work_key||':'||p_user,w.submitted_at,w.unit_id from public.students s where s.id=p_user;
  end if;
 end loop;
end $$;

create function public.on_mastery_xp_submission() returns trigger language plpgsql security invoker set search_path='' as $$
declare cid uuid; k text;
begin
 case tg_table_name
 when 'interactive_assignment_submissions' then select course_id into cid from public.interactive_assignments where id=new.assignment_id; k:='interactive:'||new.assignment_id;
 when 'textbook_submissions' then select course_id into cid from public.textbook_assignments where id=new.assignment_id; k:='reading:'||new.assignment_id;
 when 'vocab_checks' then select course_id into cid from public.vocab_tasks where id=new.task_id; k:='vocabulary:'||new.task_id;
 when 'present_ticket_responses' then select s.course_id into cid from public.present_pulses p join public.present_sessions s on p.session_id=s.id where p.id=new.pulse_id; k:='presentation:'||new.pulse_id;
 when 'math_mission_sessions' then select xp_course_id into cid from public.math_mission_assignments where id=new.assignment_id; k:='mission:'||new.assignment_id;
 when 'lesson_submissions' then
  for cid in select cs.course_id from public.course_students cs join public.lesson_class_windows w on w.course_id=cs.course_id::text and w.lesson_id=new.lesson_id::text where cs.student_id=new.user_id and cs.enrollment_state='ACTIVE' loop
   perform public.credit_mastery_xp(cid,new.user_id,'lesson:'||new.lesson_id); end loop;
  return new;
 end case;
 if cid is not null then perform public.credit_mastery_xp(cid,new.user_id,k); end if;
 return new;
end $$;
create trigger mastery_xp_submit after insert on public.interactive_assignment_submissions for each row execute function public.on_mastery_xp_submission();
create trigger mastery_xp_submit after insert on public.textbook_submissions for each row execute function public.on_mastery_xp_submission();
create trigger mastery_xp_submit after insert or update of completed_at on public.vocab_checks for each row when(new.completed_at is not null) execute function public.on_mastery_xp_submission();
create trigger mastery_xp_submit after insert on public.lesson_submissions for each row execute function public.on_mastery_xp_submission();
create trigger mastery_xp_submit after insert or update of response on public.present_ticket_responses for each row execute function public.on_mastery_xp_submission();
create trigger mastery_xp_submit after insert or update of completed_at on public.math_mission_sessions for each row when(new.completed_at is not null and new.assignment_id is not null) execute function public.on_mastery_xp_submission();

-- The old triggers still serve other programs. In Physics the new receipt
-- replaces them, including the old award for submitting a vocabulary quiz.
create function public.replace_physics_assignment_award() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.source in ('lesson-block','lesson-video') and exists(
  select from public.lessons l join public.units u on u.id=l.unit_id and u.program='physics'
  where l.id::text=split_part(new.reference,':',1) and public.mastery_xp_graded_lesson(l)
  and exists(select from public.mastery_xp_courses opt join public.course_students cs on cs.course_id=opt.course_id
   where cs.student_id=new.user_id and cs.enrollment_state='ACTIVE' and exists(select from public.lesson_class_windows w where w.course_id=opt.course_id::text and w.lesson_id=l.id::text))
 ) then return null; end if;
 if new.source='vocab-assignment' and exists(select from public.vocab_tasks a join public.mastery_xp_courses c on c.course_id=a.course_id where a.id::text=new.reference) then return null; end if;
 if new.source='reading-assignment' and exists(select from public.textbook_assignments a join public.mastery_xp_courses c on c.course_id=a.course_id where a.id::text=new.reference) then return null; end if;
 return new;
end $$;
create trigger mastery_xp_legacy before insert on public.economy_point_grants for each row when(new.source in ('reading-assignment','vocab-assignment','lesson-video','lesson-block')) execute function public.replace_physics_assignment_award();

-- Activation reconciles earlier eligible submissions at their original date.
-- New submissions racing with activation are serialized on the course lock.
create function public.enable_mastery_xp(p_course uuid,p_actor text) returns void language plpgsql security invoker set search_path='' as $$
declare member record;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_course::text,0));
 if not exists(select from public.courses where id=p_course and program='physics' and archived_at is null) then raise exception 'Choose an active Physics course.'; end if;
 insert into public.mastery_xp_courses(course_id,enabled_by) values(p_course,p_actor) on conflict do nothing;
 for member in select cs.student_id from public.course_students cs where cs.course_id=p_course and cs.enrollment_state='ACTIVE' order by cs.student_id loop
  perform public.credit_mastery_xp(p_course,member.student_id);
 end loop;
end $$;

-- If a teacher restores, reassigns, or maps already-submitted work, reconcile it
-- without requiring a second submission. Never infer a class for a free-play activity.
create function public.on_mastery_xp_assignment_change() returns trigger language plpgsql security invoker set search_path='' as $$
declare cid uuid; student uuid; k text;
begin
 case tg_table_name
  when 'lesson_class_windows' then
   select id into cid from public.courses where id::text=new.course_id;
   k:='lesson:'||new.lesson_id;
  when 'math_mission_assignments' then cid:=new.xp_course_id; k:='mission:'||new.id;
  when 'course_students' then cid:=new.course_id; student:=new.student_id;
  when 'textbook_reading_exemptions' then
   select course_id into cid from public.textbook_assignments where id=old.assignment_id;
   student:=old.user_id; k:='reading:'||old.assignment_id;
  when 'interactive_assignments' then cid:=new.course_id; k:='interactive:'||new.id;
  when 'vocab_tasks' then cid:=new.course_id; k:='vocabulary:'||new.id;
  when 'textbook_assignments' then cid:=new.course_id; k:='reading:'||new.id;
 end case;
 if not exists(select from public.mastery_xp_courses where course_id=cid) then return null; end if;
 if student is not null then perform public.credit_mastery_xp(cid,student,k);
 else
  for student in select cs.student_id from public.course_students cs where cs.course_id=cid and cs.enrollment_state='ACTIVE' order by cs.student_id loop
   perform public.credit_mastery_xp(cid,student,k);
  end loop;
 end if;
 return null;
end $$;
create trigger mastery_xp_remap after update of due_on,slug on public.interactive_assignments for each row execute function public.on_mastery_xp_assignment_change();
create trigger mastery_xp_remap after update of due_at,status,questions on public.textbook_assignments for each row execute function public.on_mastery_xp_assignment_change();
create trigger mastery_xp_remap after update of student_ids,active,task_kind,target_id,due_on,quiz_format on public.vocab_tasks for each row execute function public.on_mastery_xp_assignment_change();
create trigger mastery_xp_remap after insert or update of due_at,open_at on public.lesson_class_windows for each row execute function public.on_mastery_xp_assignment_change();
create trigger mastery_xp_remap after update of xp_course_id,xp_unit_id,cancelled_at on public.math_mission_assignments for each row execute function public.on_mastery_xp_assignment_change();
create trigger mastery_xp_remap after insert or update of enrollment_state on public.course_students for each row when (new.enrollment_state='ACTIVE') execute function public.on_mastery_xp_assignment_change();
create trigger mastery_xp_unexcuse after delete on public.textbook_reading_exemptions for each row execute function public.on_mastery_xp_assignment_change();

create function public.mastery_xp_preview(p_course uuid,p_unit text) returns jsonb
language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(x) order by x.name,x.user_id),'[]') from (
 select cs.student_id user_id,st.name,count(w.work_key)::int assigned,
        count(w.submitted_at)::int completed
 from public.course_students cs join public.students st on st.id=cs.student_id and st.is_active is not false
 left join lateral public.mastery_xp_work(p_course,cs.student_id) w on w.unit_id=p_unit
 where cs.course_id=p_course and cs.enrollment_state='ACTIVE' group by cs.student_id,st.name
 ) x
$$;
create function public.release_mastery_xp(p_course uuid,p_unit text,p_term text,p_actor text,p_preview jsonb)
returns void language plpgsql security invoker set search_path='' as $$
declare roster jsonb; member record;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_course::text||':'||p_unit,0));
 if not exists(select from public.courses c join public.units u on u.program=c.program where c.id=p_course and c.program='physics' and c.archived_at is null and u.id=p_unit) then raise exception 'Choose an active Physics class and unit.'; end if;
 if exists(select from public.mastery_xp_releases where course_id=p_course and unit_id=p_unit) then raise exception 'This unit has already been posted.'; end if;
 if not exists(select from public.course_grading_settings s cross join lateral jsonb_array_elements(s.terms) t where s.course_id=p_course and t->>'id'=p_term) then raise exception 'Choose a configured grading term.'; end if;
 if not exists(select from public.mastery_xp_courses where course_id=p_course) then raise exception 'Enable assigned mastery XP before posting.'; end if;
 roster:=public.mastery_xp_preview(p_course,p_unit);
 if roster is distinct from p_preview then raise exception 'Assigned work changed. Refresh the preview before posting.'; end if;
 if not exists(select from jsonb_array_elements(roster) x where (x->>'assigned')::int>0) then raise exception 'No eligible work in this unit.'; end if;
 insert into public.mastery_xp_releases(course_id,unit_id,term_id,released_by) values(p_course,p_unit,p_term,p_actor);
 insert into public.mastery_xp_results(course_id,unit_id,user_id,assigned,completed)
 select p_course,p_unit,(x->>'user_id')::uuid,(x->>'assigned')::int,(x->>'completed')::int from jsonb_array_elements(roster) x where (x->>'assigned')::int>0;
 for member in select user_id from public.mastery_xp_results where course_id=p_course and unit_id=p_unit loop
  perform public.credit_mastery_xp(p_course,member.user_id);
 end loop;
end $$;
create function public.student_mastery_xp(p_course uuid,p_user uuid) returns jsonb
language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('enabled',exists(select from public.mastery_xp_courses where course_id=p_course),'items',coalesce((select jsonb_agg(jsonb_build_object(
 'key',w.work_key,'unitId',w.unit_id,'title',w.title,'href',w.href,'submitted',w.submitted_at is not null,'credited',r.work_key is not null) order by w.unit_id,w.title,w.work_key)
 from public.mastery_xp_work(p_course,p_user) w left join public.mastery_xp_receipts r on r.course_id=p_course and r.user_id=p_user and r.work_key=w.work_key),'[]'),
 'posted',coalesce((select jsonb_agg(jsonb_build_object('unitId',r.unit_id,'termId',p.term_id,'assigned',r.assigned,'completed',r.completed) order by p.released_at)
 from public.mastery_xp_results r join public.mastery_xp_releases p using(course_id,unit_id) where r.course_id=p_course and r.user_id=p_user),'[]'))
$$;

revoke all on function public.on_mastery_xp_assignment_change(),public.mastery_xp_graded_lesson(public.lessons),public.enable_mastery_xp(uuid,text),public.mastery_xp_work(uuid,uuid),public.credit_mastery_xp(uuid,uuid,text),public.on_mastery_xp_submission(),public.replace_physics_assignment_award(),public.mastery_xp_preview(uuid,text),public.release_mastery_xp(uuid,text,text,text,jsonb),public.student_mastery_xp(uuid,uuid) from public,anon,authenticated;
grant execute on function public.on_mastery_xp_assignment_change(),public.mastery_xp_graded_lesson(public.lessons),public.enable_mastery_xp(uuid,text),public.mastery_xp_work(uuid,uuid),public.credit_mastery_xp(uuid,uuid,text),public.on_mastery_xp_submission(),public.replace_physics_assignment_award(),public.mastery_xp_preview(uuid,text),public.release_mastery_xp(uuid,text,text,text,jsonb),public.student_mastery_xp(uuid,uuid) to service_role;
