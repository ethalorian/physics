-- Three attributable exchanges in the existing foundation assignment.
-- Earlier submissions are immutable and remain valid daily-quiz prerequisites.
alter table public.foundation_pair_members add constraint foundation_pair_members_identity unique(pair_id,assignment_id,user_id);
create table public.foundation_checkpoint_responses (
 pair_id uuid not null, assignment_id uuid not null, user_id uuid not null,
 checkpoint text not null check(checkpoint in ('evidence','model','questions')),
 contribution text check(length(btrim(contribution)) between 10 and 4000), contributed_at timestamptz,
 reply text check(length(btrim(reply)) between 10 and 4000), replied_at timestamptz,
 reflection text check(length(btrim(reflection)) between 10 and 4000), reflected_at timestamptz,
 primary key(assignment_id,user_id,checkpoint),
 foreign key(pair_id,assignment_id,user_id) references public.foundation_pair_members(pair_id,assignment_id,user_id),
 check(reply is null or contribution is not null), check(reflection is null or reply is not null)
);
create index foundation_checkpoint_pair on public.foundation_checkpoint_responses(pair_id,assignment_id,user_id);
alter table public.foundation_checkpoint_responses enable row level security;
revoke all on public.foundation_checkpoint_responses from public,anon,authenticated;
grant select,insert,update on public.foundation_checkpoint_responses to service_role;
-- Preserve any in-progress writing from the original prediction exchange.
insert into public.foundation_checkpoint_responses(pair_id,assignment_id,user_id,checkpoint,contribution,contributed_at,reply,replied_at)
 select pair_id,assignment_id,user_id,'model',contribution,contributed_at,reply,replied_at from public.foundation_pair_members where contribution is not null;

create or replace function public.foundation_partner_action(p_assignment uuid,p_user uuid,p_action text,p_text text default '')
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a interactive_assignments;pair foundation_pairs;m foundation_pair_members;count_members integer;
begin
 select a0.* into a from interactive_assignments a0 join courses c on c.id=a0.course_id join course_students cs on cs.course_id=c.id join students s on s.id=cs.student_id
 where a0.id=p_assignment and a0.slug='day-1-foundation-briefing' and a0.due_on is not null and c.archived_at is null and cs.student_id=p_user and cs.enrollment_state='ACTIVE' and s.is_active is not false for share of a0;
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

create function public.foundation_checkpoint_action(p_assignment uuid,p_user uuid,p_checkpoint text,p_action text,p_text text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare m foundation_pair_members;own foundation_checkpoint_responses;peer foundation_checkpoint_responses;
 steps text[]:=array['evidence','model','questions'];step integer;prior integer;body text:=btrim(p_text);
begin
 if not exists(select 1 from interactive_assignments a join courses c on c.id=a.course_id join course_students cs on cs.course_id=c.id join students s on s.id=cs.student_id
  where a.id=p_assignment and a.slug='day-1-foundation-briefing' and a.due_on is not null and c.archived_at is null and cs.student_id=p_user and cs.enrollment_state='ACTIVE' and s.is_active is not false) then raise exception 'Assigned foundation unavailable.';end if;
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

-- A student can request independent make-up work; their teacher must approve it.
-- This is an alternative evidence path, never invented partner participation.
create table public.foundation_makeup_work (
 assignment_id uuid not null references public.interactive_assignments(id),
 user_id uuid not null references public.students(id),
 flagged_at timestamptz not null default now(), approved_at timestamptz, approved_by text,
 check((approved_at is null)=(approved_by is null)),
 responses jsonb not null default '{}'::jsonb check(jsonb_typeof(responses)='object'),
 primary key(assignment_id,user_id)
);
create index foundation_makeup_user on public.foundation_makeup_work(user_id,assignment_id);
alter table public.foundation_makeup_work enable row level security;
revoke all on public.foundation_makeup_work from public,anon,authenticated;
grant select,insert,update on public.foundation_makeup_work to service_role;
create function public.foundation_makeup_action(p_assignment uuid,p_user uuid,p_action text,p_checkpoint text default null,p_text text default '')
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare w foundation_makeup_work;steps text[]:=array['evidence','model','questions'];step integer;prior integer;field text;body text:=btrim(p_text);entry jsonb;
begin
 if not exists(select 1 from interactive_assignments a join courses c on c.id=a.course_id join course_students cs on cs.course_id=c.id join students s on s.id=cs.student_id where a.id=p_assignment and a.slug='day-1-foundation-briefing' and a.due_on is not null and c.archived_at is null and cs.student_id=p_user and cs.enrollment_state='ACTIVE' and s.is_active is not false) then raise exception 'Assigned foundation unavailable.';end if;
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
-- Extend the existing capture function without rewriting earlier submissions.
create or replace function public.capture_foundation_exchange()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
declare m foundation_pair_members;w foundation_makeup_work;evidence jsonb;count_complete integer;
begin
 if not exists(select 1 from interactive_assignments where id=new.assignment_id and slug='day-1-foundation-briefing') then return new;end if;
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
revoke all on function public.foundation_makeup_action(uuid,uuid,text,text,text),public.capture_foundation_exchange() from public,anon,authenticated;
grant execute on function public.foundation_makeup_action(uuid,uuid,text,text,text),public.capture_foundation_exchange() to service_role;

revoke all on function public.foundation_checkpoint_action(uuid,uuid,text,text,text),public.foundation_partner_action(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.foundation_checkpoint_action(uuid,uuid,text,text,text),public.foundation_partner_action(uuid,uuid,text,text) to service_role;

create function public.foundation_approve_makeup(p_assignment uuid,p_student uuid,p_teacher text,p_admin boolean default false)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if p_teacher is null or btrim(p_teacher)='' or not exists(
  select 1 from interactive_assignments a join courses c on c.id=a.course_id join course_students cs on cs.course_id=c.id join students s on s.id=cs.student_id
  where a.id=p_assignment and a.slug='day-1-foundation-briefing' and a.due_on is not null and c.archived_at is null and cs.student_id=p_student and cs.enrollment_state='ACTIVE' and s.is_active is not false and (p_admin or lower(c.teacher_email)=lower(p_teacher))
 ) then raise exception 'Only this class’s teacher can approve make-up work.';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_assignment::text||':'||p_student::text,0));
 if exists(select 1 from interactive_assignment_work where assignment_id=p_assignment and user_id=p_student and status='submitted') then raise exception 'This assignment has already been submitted.';end if;
 update foundation_makeup_work set approved_at=coalesce(approved_at,now()),approved_by=coalesce(approved_by,p_teacher) where assignment_id=p_assignment and user_id=p_student;
 if not found then raise exception 'No make-up request is waiting for this student.';end if;
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.foundation_approve_makeup(uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.foundation_approve_makeup(uuid,uuid,text,boolean) to service_role;
