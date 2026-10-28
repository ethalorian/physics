-- Extend the local foundation sequence to Day 2. Preserve existing review records.
insert into public.interactive_assignment_templates(slug,day,title,target_slugs) values ('day-2-foundation-motion',2,'Day 2 · Foundation: Talking about motion',array['u1.vocab-position-distance-displacement']);
insert into public.daily_lesson_templates(key,foundation_slug,review_slug,foundation_questions,review_questions,quiz) values ('unit-1-day-2','day-2-foundation-motion','day-2-motion-language',array['f2-position','f2-distance','f2-endpoints','f2-walk','f2-route','f2-headline','f2-track','f2-transfer','f2-axes'],array['r2-1a','r2-1b','r2-1c','r2-2a','r2-2b','r2-2c','r2-3a','r2-3b','r2-3c','r2-4a','r2-4b','r2-5a','r2-5b'],'{"title":"Day 2 · Quiz: Position, distance, and displacement","instructions":"Work independently after submitting the foundation and review. State direction and units where needed. Your teacher releases the quiz grade and reviews mastery separately.","questions":[{"kind":"choice","prompt":"With east positive and the door at zero, what does x = −3 m tell you?","options":["The object moves west","The object is 3 m west of the door","Its total travel is 3 m","Its speed is negative"],"correct_index":1,"guide":"A signed position locates an object relative to an origin; it does not establish motion.","points":1,"demand":{"blooms":"Understand","dok":1,"evidence":"Interprets signed position."}},{"kind":"choice","prompt":"A student walks 7 m east and 7 m west to the start. Which pair is correct?","options":["Distance 0 m; displacement 14 m east","Distance 14 m; displacement 0 m","Distance 7 m; displacement 7 m west","Both are 0 m"],"correct_index":1,"guide":"Both legs count toward distance; the endpoints coincide.","points":1,"demand":{"blooms":"Apply","dok":2,"evidence":"Distinguishes path length from endpoint change."}},{"kind":"choice","prompt":"Which quantity requires a direction as well as a magnitude?","options":["Elapsed time","Distance","Displacement","Path length"],"correct_index":2,"guide":"Displacement is a vector.","points":1,"demand":{"blooms":"Remember","dok":1,"evidence":"Identifies a vector quantity."}},{"kind":"choice","prompt":"A cart moves directly from −5 m to −1 m with east positive. What is its displacement?","options":["−6 m","−4 m","+4 m","+6 m"],"correct_index":2,"guide":"Final minus initial: −1 − (−5) = +4 m.","points":1,"demand":{"blooms":"Apply","dok":2,"evidence":"Calculates displacement between negative coordinates."}},{"kind":"written","prompt":"A walker takes 4 equal steps north, 6 east, and 4 south. Find distance and displacement. A real walk finishes slightly north of the start: give two plausible explanations and a measurement to distinguish them.","guide":"14 step-lengths of distance and 6 east displacement in the ideal route. Unequal north/south step lengths or an incorrect turn/route are plausible; measure leg lengths and directions against a common scale and reference. Explain how the evidence separates the causes.","points":3,"demand":{"blooms":"Evaluate","dok":3,"evidence":"Applies the route model and justifies a test of competing explanations."}},{"kind":"written","prompt":"Two objects each travel 20 m. Does that guarantee equal displacements? Construct two routes to defend your answer, state their displacements with directions, and explain what information distance leaves out.","guide":"No. For example, 20 m east gives 20 m east displacement; 10 m east then 10 m west gives zero displacement. Equal path lengths do not fix endpoints or direction.","points":3,"demand":{"blooms":"Create","dok":3,"evidence":"Constructs and justifies a counterexample to a general claim."}}]}'::jsonb);

create or replace function public.foundation_partner_action(p_assignment uuid,p_user uuid,p_action text,p_text text default '')
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a interactive_assignments;pair foundation_pairs;m foundation_pair_members;count_members integer;
begin
 select a0.* into a from interactive_assignments a0 join courses c on c.id=a0.course_id join course_students cs on cs.course_id=c.id join students s on s.id=cs.student_id
 where a0.id=p_assignment and a0.slug in (select foundation_slug from daily_lesson_templates) and a0.due_on is not null and c.archived_at is null and cs.student_id=p_user and cs.enrollment_state='ACTIVE' and s.is_active is not false for share of a0;
 if not found then raise exception 'Assigned foundation unavailable.';end if;
 if p_action is null or p_action not in('create','join') then raise exception 'Choose a partner stop before sharing or replying.';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_assignment::text||':'||p_user::text,0));
 if exists(select 1 from foundation_makeup_work where assignment_id=p_assignment and user_id=p_user) then raise exception 'Continue with your independent make-up activities.';end if;
 select * into m from foundation_pair_members where assignment_id=p_assignment and user_id=p_user;
 if m.pair_id is not null then return jsonb_build_object('ok',true);end if;
 if exists(select 1 from interactive_assignment_work where assignment_id=p_assignment and user_id=p_user and status='submitted') then raise exception 'This assignment has already been submitted.';end if;
 if p_action='create' then
  insert into foundation_pairs(assignment_id) values(p_assignment) returning * into pair;
  insert into foundation_pair_members(pair_id,assignment_id,user_id,slot) values(pair.id,p_assignment,p_user,1);
 else
  select * into pair from foundation_pairs where assignment_id=p_assignment and code=upper(btrim(p_text)) for update;
  if not found then raise exception 'Check your partner code and class assignment.';end if;
  select count(*) into count_members from foundation_pair_members where pair_id=pair.id;
  if count_members<>1 then raise exception 'This pair is already full.';end if;
  if not exists(select 1 from foundation_pair_members pm join course_students cs on cs.student_id=pm.user_id and cs.course_id=a.course_id join students s on s.id=pm.user_id where pm.pair_id=pair.id and cs.enrollment_state='ACTIVE' and s.is_active is not false) then raise exception 'Your partner is no longer active in this class.';end if;
  insert into foundation_pair_members(pair_id,assignment_id,user_id,slot) values(pair.id,p_assignment,p_user,2);
 end if;
 return jsonb_build_object('ok',true);
end $$;

create or replace function public.foundation_checkpoint_action(p_assignment uuid,p_user uuid,p_checkpoint text,p_action text,p_text text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare m foundation_pair_members;own foundation_checkpoint_responses;peer foundation_checkpoint_responses;
 steps text[]:=array['evidence','model','questions'];step integer;prior integer;body text:=btrim(p_text);
begin
 if not exists(select 1 from interactive_assignments a join courses c on c.id=a.course_id join course_students cs on cs.course_id=c.id join students s on s.id=cs.student_id
  where a.id=p_assignment and a.slug in (select foundation_slug from daily_lesson_templates) and a.due_on is not null and c.archived_at is null and cs.student_id=p_user and cs.enrollment_state='ACTIVE' and s.is_active is not false) then raise exception 'Assigned foundation unavailable.';end if;
 step:=array_position(steps,p_checkpoint);
 if step is null or p_action is null or p_action not in('share','reply','reflect') or body is null or length(body) not between 10 and 4000 then raise exception 'Choose a partner stop and write between 10 and 4,000 characters.';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_assignment::text||':'||p_user::text,0));
 if exists(select 1 from foundation_makeup_work where assignment_id=p_assignment and user_id=p_user) then raise exception 'Continue with your independent make-up activities.';end if;
 -- The submission trigger takes the same member lock before freezing the evidence.
 select * into m from foundation_pair_members where assignment_id=p_assignment and user_id=p_user for update;
 if not found then raise exception 'Join your partner first.';end if;
 if exists(select 1 from interactive_assignment_work where assignment_id=p_assignment and user_id=p_user and status='submitted') then raise exception 'This assignment has already been submitted.';end if;
 for prior in 1..step-1 loop
  if not exists(select 1 from foundation_checkpoint_responses o join foundation_checkpoint_responses p on p.pair_id=o.pair_id and p.checkpoint=o.checkpoint and p.user_id<>o.user_id
   where o.assignment_id=p_assignment and o.user_id=p_user and o.checkpoint=steps[prior] and o.reply is not null and p.reply is not null and o.reflection is not null) then raise exception 'Finish the earlier partner stop and your own reflection first.';end if;
 end loop;
 insert into foundation_checkpoint_responses(pair_id,assignment_id,user_id,checkpoint) values(m.pair_id,p_assignment,p_user,p_checkpoint) on conflict do nothing;
 select * into own from foundation_checkpoint_responses where assignment_id=p_assignment and user_id=p_user and checkpoint=p_checkpoint;
 select * into peer from foundation_checkpoint_responses where pair_id=m.pair_id and user_id<>p_user and checkpoint=p_checkpoint;
 if p_action='share' then
  if own.contribution is not null and own.contribution<>body then raise exception 'Your shared idea is saved. Develop it in your reply and reflection.';end if;
  update foundation_checkpoint_responses set contribution=body,contributed_at=coalesce(contributed_at,now()) where assignment_id=p_assignment and user_id=p_user and checkpoint=p_checkpoint;
 elsif p_action='reply' then
  if own.contribution is null or peer.contribution is null then raise exception 'Both partners must share an idea at this stop before replying.';end if;
  if own.reply is not null and own.reply<>body then raise exception 'Your reply is saved. Continue your reasoning in your own reflection.';end if;
  update foundation_checkpoint_responses set reply=body,replied_at=coalesce(replied_at,now()) where assignment_id=p_assignment and user_id=p_user and checkpoint=p_checkpoint;
 else
  if own.reply is null or peer.reply is null then raise exception 'Both partners must reply before your individual reflection.';end if;
  if own.reflection is not null and own.reflection<>body then raise exception 'Your reflection is saved. You can develop your thinking in your individual assignment answers.';end if;
  update foundation_checkpoint_responses set reflection=body,reflected_at=coalesce(reflected_at,now()) where assignment_id=p_assignment and user_id=p_user and checkpoint=p_checkpoint;
 end if;
 return jsonb_build_object('ok',true);
end $$;

create or replace function public.foundation_makeup_action(p_assignment uuid,p_user uuid,p_action text,p_checkpoint text default null,p_text text default '')
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare w foundation_makeup_work;steps text[]:=array['evidence','model','questions'];step integer;prior integer;field text;body text:=btrim(p_text);entry jsonb;
begin
 if not exists(select 1 from interactive_assignments a join courses c on c.id=a.course_id join course_students cs on cs.course_id=c.id join students s on s.id=cs.student_id where a.id=p_assignment and a.slug in (select foundation_slug from daily_lesson_templates) and a.due_on is not null and c.archived_at is null and cs.student_id=p_user and cs.enrollment_state='ACTIVE' and s.is_active is not false) then raise exception 'Assigned foundation unavailable.';end if;
 -- Same student lock as pairing; the trigger also takes it for mode consistency.
 perform pg_advisory_xact_lock(hashtextextended(p_assignment::text||':'||p_user::text,0));
 if exists(select 1 from interactive_assignment_work where assignment_id=p_assignment and user_id=p_user and status='submitted') then raise exception 'This assignment has already been submitted.';end if;
 if p_action='flag' then
  insert into foundation_makeup_work(assignment_id,user_id) values(p_assignment,p_user) on conflict do nothing;
  return jsonb_build_object('ok',true);
 end if;
 select * into w from foundation_makeup_work where assignment_id=p_assignment and user_id=p_user for update;
 if not found then raise exception 'Request independent make-up work first.';end if;
 if w.approved_at is null then raise exception 'Your make-up request is waiting for teacher approval. Continue your individual questions while you wait.';end if;
 step:=array_position(steps,p_checkpoint);
 if step is null or p_action is null or p_action not in('share','reply','reflect') or body is null or length(body) not between 10 and 4000 then raise exception 'Choose a make-up stop and write between 10 and 4,000 characters.';end if;
 for prior in 1..step-1 loop
  if w.responses->steps[prior]->>'reflection' is null then raise exception 'Finish the earlier independent make-up stop first.';end if;
 end loop;
 entry:=coalesce(w.responses->p_checkpoint,'{}'::jsonb);
 field:=case p_action when 'share' then 'contribution' when 'reply' then 'reply' else 'reflection' end;
 if (p_action='reply' and entry->>'contribution' is null) or (p_action='reflect' and entry->>'reply' is null) then raise exception 'Write your idea, critique the example, then reflect in order.';end if;
 if entry->>field is not null and entry->>field<>body then raise exception 'This response is saved. Develop your reasoning in your next response or individual assignment answers.';end if;
 entry:=entry||jsonb_build_object(field,body,field||'_at',coalesce(entry->>(field||'_at'),now()::text));
 update foundation_makeup_work set responses=jsonb_set(responses,array[p_checkpoint],entry,true) where assignment_id=p_assignment and user_id=p_user;
 return jsonb_build_object('ok',true);
end $$;

create or replace function public.capture_foundation_exchange()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
declare m foundation_pair_members;w foundation_makeup_work;evidence jsonb;count_complete integer;
begin
 if not exists(select 1 from interactive_assignments where id=new.assignment_id and slug in (select foundation_slug from daily_lesson_templates)) then return new;end if;
 perform pg_advisory_xact_lock(hashtextextended(new.assignment_id::text||':'||new.user_id::text,0));
 select * into w from foundation_makeup_work where assignment_id=new.assignment_id and user_id=new.user_id for update;
 if found then
  if w.approved_at is null then raise exception 'Your make-up request needs teacher approval before you can submit.';end if;
  select count(*),jsonb_agg(jsonb_build_object('id',step,'own',w.responses->step) order by position) into count_complete,evidence
   from unnest(array['evidence','model','questions']) with ordinality as steps(step,position)
   where length(w.responses->step->>'contribution') between 10 and 4000 and length(w.responses->step->>'reply') between 10 and 4000 and length(w.responses->step->>'reflection') between 10 and 4000;
  if count_complete<>3 then raise exception 'Complete all three independent make-up stops: your idea, an example critique, and your reflection.';end if;
  new.state:=new.state||jsonb_build_object('partner_exchange',jsonb_build_object('version',2,'mode','independent','flagged_at',w.flagged_at,'approved_at',w.approved_at,'approved_by',w.approved_by,'own_user_id',new.user_id,'checkpoints',evidence));
  return new;
 end if;
 select * into m from foundation_pair_members where assignment_id=new.assignment_id and user_id=new.user_id for update;
 select count(*),jsonb_agg(jsonb_build_object('id',o.checkpoint,'own',to_jsonb(o)-'pair_id'-'assignment_id'-'user_id'-'checkpoint','peer',to_jsonb(p)-'pair_id'-'assignment_id'-'user_id'-'checkpoint'-'reflection'-'reflected_at') order by array_position(array['evidence','model','questions'],o.checkpoint))
 into count_complete,evidence from foundation_checkpoint_responses o join foundation_checkpoint_responses p on p.pair_id=o.pair_id and p.checkpoint=o.checkpoint and p.user_id<>o.user_id
 where o.assignment_id=new.assignment_id and o.user_id=new.user_id and o.contribution is not null and o.reply is not null and o.reflection is not null and p.contribution is not null and p.reply is not null;
 if count_complete<>3 then raise exception 'Complete all three partner stops: both partners share and reply, then save your own reflection at each stop.';end if;
 new.state:=new.state||jsonb_build_object('partner_exchange',jsonb_build_object('version',2,'mode','pair','pair_id',m.pair_id,'own_user_id',new.user_id,'peer_user_id',(select user_id from foundation_pair_members where pair_id=m.pair_id and user_id<>new.user_id),'checkpoints',evidence));
 return new;
end $$;

create or replace function public.foundation_approve_makeup(p_assignment uuid,p_student uuid,p_teacher text,p_admin boolean default false)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if p_teacher is null or btrim(p_teacher)='' or not exists(
  select 1 from interactive_assignments a join courses c on c.id=a.course_id join course_students cs on cs.course_id=c.id join students s on s.id=cs.student_id
  where a.id=p_assignment and a.slug in (select foundation_slug from daily_lesson_templates) and a.due_on is not null and c.archived_at is null and cs.student_id=p_student and cs.enrollment_state='ACTIVE' and s.is_active is not false and (p_admin or lower(c.teacher_email)=lower(p_teacher))
 ) then raise exception 'Only this class’s teacher can approve make-up work.';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_assignment::text||':'||p_student::text,0));
 if exists(select 1 from interactive_assignment_work where assignment_id=p_assignment and user_id=p_student and status='submitted') then raise exception 'This assignment has already been submitted.';end if;
 update foundation_makeup_work set approved_at=coalesce(approved_at,now()),approved_by=coalesce(approved_by,p_teacher) where assignment_id=p_assignment and user_id=p_student;
 if not found then raise exception 'No make-up request is waiting for this student.';end if;
 return jsonb_build_object('ok',true);
end $$;

-- CREATE OR REPLACE retains existing service-role-only grants.
