-- Unit 1 assignments for days that have an animated teaching tool.
create table public.interactive_assignment_templates (
 slug text primary key, day integer not null check(day between 1 and 20), title text not null,
 target_slugs text[] not null check(cardinality(target_slugs)>0)
);
alter table public.interactive_assignment_templates enable row level security;
revoke all on public.interactive_assignment_templates from public,anon,authenticated;
grant select on public.interactive_assignment_templates to service_role;
insert into public.interactive_assignment_templates(slug,day,title,target_slugs) values

('day-1-the-briefing',1,'Day 1 · The Briefing',ARRAY['u1.anchor-know-unknow']),
('day-2-motion-language',2,'Day 2 · How Do We Talk About Motion',ARRAY['u1.vocab-position-distance-displacement']),
('day-3-velocity',3,'Day 3 · Velocity: motion with direction',ARRAY['u1.capture-pt-graph']),
('day-4-velocity-time-vectors',4,'Day 4 · Velocity-Time Graphs and Vectors',ARRAY['u1.read-vt-graph-components']),
('day-5-predicting-position',5,'Day 5 · Predicting the Position',ARRAY['u1.predict-position-uncertainty']),
('day-6-vectors',6,'Day 6 · Vector Addition and Decomposition',ARRAY['u1.vectors-tip-to-tail']),
('day-7-acceleration',7,'Day 7 · Acceleration',ARRAY['u1.acceleration-rate-of-change']),
('day-8-kinematics-problems',8,'Day 8 · Constant Acceleration Problem-Solving',ARRAY['u1.pick-equation-of-motion']),
('day-9-inertia',9,'Day 9 · Newton’s 1st Law - Inertia',ARRAY['u1.newtons-first-law-inertia']),
('day-10-forces',10,'Day 10 · Forces',ARRAY['u1.identify-forces']),
('day-11-vary-mass',11,'Day 11 · Newton’s 2nd Law - Vary Mass',ARRAY['u1.lab-accel-vs-mass']),
('day-12-vary-force',12,'Day 12 · Newton’s 2nd Law - Vary Force',ARRAY['u1.lab-accel-vs-force']),
('day-13-fma-practice',13,'Day 13 · F equals ma in Practice',ARRAY['u1.fma-solve-net-force']),
('day-14-third-law',14,'Day 14 · Newton’s 3rd Law',ARRAY['u1.third-law-pairs']),
('day-15-force-diagrams',15,'Day 15 · Free Body Diagrams Part 1',ARRAY['u1.draw-fbd']),
('day-16-net-force',16,'Day 16 · Free Body Diagrams Part 2 - Net Force',ARRAY['u1.net-force-from-fbd']),
('day-17-friction',17,'Day 17 · Friction',ARRAY['u1.friction-static-kinetic']),
('day-18-equilibrium',18,'Day 18 · Equilibrium',ARRAY['u1.equilibrium-find-unknown']),
('day-19-workshop-revision',19,'Day 19 · Workshop and Revision',ARRAY['u1.workshop-self-diagnose']),
('day-20-synthesis',20,'Day 20 · Synthesis',ARRAY['u1.predict-position-uncertainty','u1.vectors-tip-to-tail','u1.draw-fbd','u1.net-force-from-fbd'])
;
alter table public.interactive_assignments drop constraint interactive_assignments_slug_check;
alter table public.interactive_assignments add constraint interactive_assignments_template_fk foreign key(slug) references public.interactive_assignment_templates(slug);
alter table public.interactive_assignment_reviews add column target_id uuid references public.learning_targets(id);
update public.interactive_assignment_reviews r set target_id=a.target_id from public.interactive_assignment_submissions s join public.interactive_assignments a on a.id=s.assignment_id where s.id=r.submission_id;
alter table public.interactive_assignment_reviews alter column target_id set not null;
alter table public.interactive_assignment_reviews drop constraint interactive_assignment_reviews_submission_id_key;
alter table public.interactive_assignment_reviews add constraint interactive_assignment_reviews_target_key unique(submission_id,target_id);
alter table public.interactive_assignment_ai_reviews alter column rubric_version set default 'unit1-v2';

create function public.rate_interactive_assignment_target(p_id uuid,p_submission uuid,p_reviewer text,p_level smallint,p_feedback text,p_admin boolean default false,p_target uuid default null)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare s interactive_assignment_submissions; a interactive_assignments; r interactive_assignment_reviews; record uuid; w interactive_assignment_work; target uuid; template interactive_assignment_templates;
begin
 if p_level is null or p_level not between 1 and 3 or p_feedback is null or length(p_feedback)>1600 then raise exception 'Invalid rating'; end if;
 select * into s from interactive_assignment_submissions where id=p_submission;
 if not found then raise exception 'Submission unavailable'; end if;
 select * into a from interactive_assignments where id=s.assignment_id;
 select * into template from interactive_assignment_templates where slug=a.slug;
 target=coalesce(p_target,a.target_id);
 if not exists(select 1 from learning_targets where id=target and unit_id='unit-1' and slug=any(template.target_slugs)) then raise exception 'Target is not part of this assignment'; end if;
 if not exists(select 1 from courses c join course_students cs on cs.course_id=c.id where c.id=a.course_id and c.archived_at is null and (p_admin or lower(c.teacher_email)=lower(p_reviewer)) and cs.student_id=s.user_id and cs.enrollment_state='ACTIVE') then raise exception 'Only the teacher of this class can rate this work'; end if;
 select * into w from interactive_assignment_work where assignment_id=s.assignment_id and user_id=s.user_id for update;
 select * into r from interactive_assignment_reviews where submission_id=p_submission and target_id=target;
 if found then
  if r.id=p_id and r.reviewer_email=p_reviewer then return to_jsonb(r); end if;
  raise exception 'This target already has a rating. Reload to see it.';
 end if;
 if w.status<>'submitted' or w.version<>s.version then raise exception 'A newer revision exists. Review the current submission.'; end if;
 insert into mastery_records(user_id,target_id,level,rated_by,evidence_source)
 values(s.user_id,target,p_level,p_reviewer,'Interactive lesson assignment · '||template.title||' · submission '||s.id::text) returning id into record;
 insert into interactive_assignment_reviews(id,submission_id,target_id,level,feedback,reviewer_email,record_id) values(p_id,s.id,target,p_level,p_feedback,p_reviewer,record) returning * into r;
 return to_jsonb(r);
end $$;
revoke all on function public.rate_interactive_assignment_target(uuid,uuid,text,smallint,text,boolean,uuid) from public,anon,authenticated;
grant execute on function public.rate_interactive_assignment_target(uuid,uuid,text,smallint,text,boolean,uuid) to service_role;

-- Keep older clients working while the new release is rolling out.
create or replace function public.rate_interactive_assignment(p_id uuid,p_submission uuid,p_reviewer text,p_level smallint,p_feedback text,p_admin boolean default false)
returns jsonb language sql security invoker set search_path=public as $$
 select public.rate_interactive_assignment_target(p_id,p_submission,p_reviewer,p_level,p_feedback,p_admin,null);
$$;

create or replace function public.claim_interactive_assignment_ai(p_submission uuid,p_retry boolean default false)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare j interactive_assignment_ai_reviews; snapshot jsonb; lesson_slug text;
begin
 select s.state,a.slug into snapshot,lesson_slug from interactive_assignment_submissions s join interactive_assignment_work w on w.assignment_id=s.assignment_id and w.user_id=s.user_id and w.version=s.version and w.status='submitted'
 join interactive_assignments a on a.id=s.assignment_id join interactive_assignment_templates t on t.slug=a.slug
 join courses c on c.id=a.course_id and c.archived_at is null
 join course_students cs on cs.course_id=a.course_id and cs.student_id=s.user_id and cs.enrollment_state='ACTIVE'
 where s.id=p_submission and (select count(*) from interactive_assignment_reviews r where r.submission_id=s.id)<cardinality(t.target_slugs);
 if not found then return null; end if;
 update interactive_assignment_ai_reviews set status='processing',rubric_version='unit1-v2',attempts=attempts+1,lock_id=gen_random_uuid(),locked_until=now()+interval '3 minutes',error=null,updated_at=now()
 where submission_id=p_submission and (status='queued' or (status='processing' and locked_until<now()) or (p_retry and status='error')) returning * into j;
 if not found then return null; end if;
 return jsonb_build_object('submission_id',j.submission_id,'lock_id',j.lock_id,'state',snapshot,'slug',lesson_slug);
end $$;
