-- Existing rooms keep the rules they started with. No saved work or historical
-- submission is rewritten. Existing service-only function ACLs are retained.
alter table public.foundation_pairs add column individual_pace boolean not null default false;
alter table public.foundation_pairs alter column individual_pace set default true;
alter table public.foundation_pairs add column closed_at timestamptz;
alter table public.foundation_checkpoint_responses add column example_selected boolean not null default false,
 add constraint foundation_one_comparison_source check(not example_selected or reply_to_user_id is null);

-- A first idea from a table that never started belongs to its author. Retain
-- its original text and time even when the next table gives them a different role.
create table public.foundation_setup_notes (
 id uuid primary key default gen_random_uuid(),
 assignment_id uuid not null references public.interactive_assignments(id),
 user_id uuid not null references public.students(id),
 source_group uuid not null references public.foundation_pairs(id),
 source_slot smallint not null check(source_slot between 1 and 4),
 idea text not null, contributed_at timestamptz not null, left_at timestamptz not null default now()
);
create index foundation_setup_notes_latest on public.foundation_setup_notes(assignment_id,user_id,left_at desc);
alter table public.foundation_setup_notes enable row level security;
revoke all on public.foundation_setup_notes from public,anon,authenticated;
grant select,insert on public.foundation_setup_notes to service_role;
grant delete on public.foundation_pair_members,public.foundation_checkpoint_responses to service_role;

create or replace function public.foundation_partner_action(p_assignment uuid,p_user uuid,p_action text,p_text text default '')
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a interactive_assignments;g foundation_pairs;m foundation_pair_members;n integer;capacity integer;
begin
 select a0.* into a from interactive_assignments a0 join courses c on c.id=a0.course_id join course_students cs on cs.course_id=c.id join students s on s.id=cs.student_id
 where a0.id=p_assignment and a0.slug in(select foundation_slug from daily_lesson_templates) and a0.due_on is not null and c.archived_at is null and cs.student_id=p_user and cs.enrollment_state='ACTIVE' and s.is_active is not false for share of a0;
 if not found then raise exception 'Assigned foundation unavailable.';end if;
 if p_action is null or p_action not in('create','join','start','leave') then raise exception 'Choose a group action.';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_assignment::text||':'||p_user::text,0));
 if exists(select 1 from foundation_makeup_work where assignment_id=p_assignment and user_id=p_user) then raise exception 'Continue with your independent make-up activities.';end if;
 if exists(select 1 from interactive_assignment_work where assignment_id=p_assignment and user_id=p_user and status='submitted') then raise exception 'This assignment has already been submitted.';end if;
 select * into m from foundation_pair_members where assignment_id=p_assignment and user_id=p_user;
 if p_action='leave' then
  if nullif(btrim(p_text),'') is null then raise exception 'Choose the group you want to leave.';end if;
  if m.pair_id is null then return jsonb_build_object('ok',true);end if;
  select * into g from foundation_pairs where id=m.pair_id for update;
  if g.code<>upper(btrim(p_text)) then raise exception 'Your group has changed. Check the current code.';end if;
  if g.protocol_version<>3 or g.started_at is not null then raise exception 'This discussion has started. Your group work is saved.';end if;
  if m.contribution is not null or m.reply is not null or exists(
   select 1 from foundation_checkpoint_responses r where r.pair_id=g.id and r.user_id=p_user
   and (r.checkpoint<>'evidence' or r.reply is not null or r.reflection is not null or r.reply_to_user_id is not null or r.example_selected)
  ) then raise exception 'This group already has discussion work.';end if;
  insert into foundation_setup_notes(assignment_id,user_id,source_group,source_slot,idea,contributed_at)
   select p_assignment,p_user,g.id,m.slot,r.contribution,r.contributed_at from foundation_checkpoint_responses r
   where r.pair_id=g.id and r.user_id=p_user and r.checkpoint='evidence' and r.contribution is not null;
  delete from foundation_checkpoint_responses where pair_id=g.id and user_id=p_user;
  delete from foundation_pair_members where pair_id=g.id and user_id=p_user;
  -- The group update also notifies remaining classmates through its existing channel.
  update foundation_pairs set closed_at=case when exists(select 1 from foundation_pair_members where pair_id=g.id)
    then null else now() end where id=g.id;
  return jsonb_build_object('ok',true);
 end if;
 if m.pair_id is not null then
  select * into g from foundation_pairs where id=m.pair_id for update;
  if p_action='join' and g.code<>upper(btrim(p_text)) then raise exception 'You already belong to a group for this assignment.';end if;
  if p_action='start' and g.protocol_version=3 and g.started_at is null then
   select count(*) into n from foundation_pair_members pm where pm.pair_id=g.id and not exists(select 1 from foundation_makeup_work w where w.assignment_id=p_assignment and w.user_id=pm.user_id and (g.individual_pace or w.approved_at is not null));
   if n<2 then raise exception 'At least two students must join before starting.';end if;
   if exists(select 1 from foundation_pair_members pm where pm.pair_id=g.id and not exists(select 1 from foundation_makeup_work w where w.assignment_id=p_assignment and w.user_id=pm.user_id and (g.individual_pace or w.approved_at is not null)) and
     (exists(select 1 from foundation_makeup_work w where w.assignment_id=p_assignment and w.user_id=pm.user_id)
      or not exists(select 1 from course_students cs join students s on s.id=cs.student_id where cs.course_id=a.course_id and cs.student_id=pm.user_id and cs.enrollment_state='ACTIVE' and s.is_active is not false))) then raise exception 'A group member is unavailable. Resolve their independent-work request before starting.';end if;
   update foundation_pairs set started_at=now() where id=g.id;
  end if;
  return jsonb_build_object('ok',true);
 end if;
 if p_action='start' then raise exception 'Create or join your group first.';end if;
 if p_action='create' then
  insert into foundation_pairs(assignment_id) values(p_assignment) returning * into g;
  insert into foundation_pair_members(pair_id,assignment_id,user_id,slot) values(g.id,p_assignment,p_user,1);
 else
  select * into g from foundation_pairs where assignment_id=p_assignment and code=upper(btrim(p_text)) for update;
  if not found or g.closed_at is not null then raise exception 'Check the group code and class assignment.';end if;
  if g.individual_pace and g.started_at is not null and not exists(select 1 from foundation_pair_members pm where pm.pair_id=g.id and not exists(select 1 from interactive_assignment_work w where w.assignment_id=p_assignment and w.user_id=pm.user_id and w.status='submitted')) then raise exception 'This group has finished. Join another group.';end if;
  capacity:=case when g.protocol_version=3 then 4 else 2 end;
  select count(*) into n from foundation_pair_members where pair_id=g.id;
  if n>=capacity then raise exception 'This group is full.';end if;
  if g.started_at is not null and not g.individual_pace then raise exception 'This group has already started. Joining is closed.';end if;
  if exists(select 1 from foundation_pair_members pm where pm.pair_id=g.id and
   ((not g.individual_pace and exists(select 1 from foundation_makeup_work w where w.assignment_id=p_assignment and w.user_id=pm.user_id))
    or not exists(select 1 from course_students cs join students s on s.id=cs.student_id where cs.course_id=a.course_id and cs.student_id=pm.user_id and cs.enrollment_state='ACTIVE' and s.is_active is not false))) then raise exception 'A group member is no longer available for this activity.';end if;
  -- Fill an empty seat without renumbering anyone or changing their physics prompt.
  insert into foundation_pair_members(pair_id,assignment_id,user_id,slot)
   select g.id,p_assignment,p_user,seat from generate_series(1,capacity) seat
   where not exists(select 1 from foundation_pair_members pm where pm.pair_id=g.id and pm.slot=seat)
   order by seat limit 1;
 end if;
 return jsonb_build_object('ok',true);
end $$;

create or replace function public.foundation_checkpoint_action(p_assignment uuid,p_user uuid,p_checkpoint text,p_action text,p_text text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare m foundation_pair_members;g foundation_pairs;own foundation_checkpoint_responses;members uuid[];target uuid;
 steps text[]:=array['evidence','model','questions'];step integer;prior integer;body text:=btrim(p_text);
begin
 if not exists(select 1 from interactive_assignments a join courses c on c.id=a.course_id join course_students cs on cs.course_id=c.id join students s on s.id=cs.student_id
  where a.id=p_assignment and a.slug in(select foundation_slug from daily_lesson_templates) and a.due_on is not null and c.archived_at is null and cs.student_id=p_user and cs.enrollment_state='ACTIVE' and s.is_active is not false) then raise exception 'Assigned foundation unavailable.';end if;
 step:=array_position(steps,p_checkpoint);
 if step is null or p_action is null or p_action not in('share','reply','reflect','compare') or body is null or (p_action<>'compare' and length(body) not between 10 and 4000) then raise exception 'Choose a discussion stop and write between 10 and 4,000 characters.';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_assignment::text||':'||p_user::text,0));
 if exists(select 1 from foundation_makeup_work where assignment_id=p_assignment and user_id=p_user) then raise exception 'Continue with your independent make-up activities.';end if;
 select * into m from foundation_pair_members where assignment_id=p_assignment and user_id=p_user for update;
 if not found then raise exception 'Join your group first.';end if;
 select * into g from foundation_pairs where id=m.pair_id for update;
 if p_action='compare' and (g.protocol_version<>3 or not g.individual_pace) then raise exception 'Use the original group routine for this lesson.';end if;
 if g.protocol_version=2 then return foundation_checkpoint_action_legacy(p_assignment,p_user,p_checkpoint,p_action,p_text);end if;
 if g.protocol_version=3 and g.individual_pace then
  if exists(select 1 from interactive_assignment_work where assignment_id=p_assignment and user_id=p_user and status='submitted') then raise exception 'This assignment has already been submitted.';end if;
  if g.started_at is null and not (step=1 and p_action='share') then raise exception 'Start with at least two classmates before comparing ideas.';end if;
  for prior in 1..step-1 loop
   if not exists(select 1 from foundation_checkpoint_responses r where r.pair_id=g.id and r.user_id=p_user and r.checkpoint=steps[prior] and r.reflection is not null) then raise exception 'Finish your earlier stop first.';end if;
  end loop;
  insert into foundation_checkpoint_responses(pair_id,assignment_id,user_id,checkpoint) values(g.id,p_assignment,p_user,p_checkpoint) on conflict do nothing;
  select * into own from foundation_checkpoint_responses where pair_id=g.id and user_id=p_user and checkpoint=p_checkpoint;
  if p_action='share' then
   if own.contribution is not null and own.contribution<>body then raise exception 'Your first idea is already saved.';end if;
   update foundation_checkpoint_responses set contribution=body,contributed_at=coalesce(contributed_at,now()) where pair_id=g.id and user_id=p_user and checkpoint=p_checkpoint and contribution is null;
  elsif p_action='compare' then
   if own.contribution is null then raise exception 'Save your own idea first.';end if;
   if body='example' then
    if own.reply_to_user_id is not null then raise exception 'Finish the comparison you already chose.';end if;
    if not own.example_selected then
     if clock_timestamp()<own.contributed_at+interval '90 seconds' then raise exception 'Give your group time to share first.';end if;
     if exists(select 1 from foundation_checkpoint_responses r where r.pair_id=g.id and r.checkpoint=p_checkpoint and r.user_id<>p_user and r.contribution is not null) then raise exception 'A classmate has shared. Refresh and compare their idea.';end if;
     update foundation_checkpoint_responses set example_selected=true where pair_id=g.id and user_id=p_user and checkpoint=p_checkpoint;
    end if;
   else
    if body not in ('1','2','3','4') then raise exception 'Choose a classmate who shared an idea.';end if;
    select pm.user_id into target from foundation_pair_members pm join foundation_checkpoint_responses r on r.pair_id=pm.pair_id and r.user_id=pm.user_id
     where pm.pair_id=g.id and pm.slot=body::int and pm.user_id<>p_user and r.checkpoint=p_checkpoint and r.contribution is not null;
    if target is null then raise exception 'Choose a classmate who shared an idea.';end if;
    if own.example_selected or (own.reply_to_user_id is not null and own.reply_to_user_id<>target) then raise exception 'Finish the comparison you already chose.';end if;
    update foundation_checkpoint_responses set reply_to_user_id=target where pair_id=g.id and user_id=p_user and checkpoint=p_checkpoint and reply_to_user_id is null;
   end if;
  elsif p_action='reply' then
   if own.contribution is null or (own.reply_to_user_id is null and not own.example_selected) then raise exception 'Choose an idea to compare first.';end if;
   if own.reply is not null and own.reply<>body then raise exception 'Your response is already saved.';end if;
   update foundation_checkpoint_responses set reply=body,replied_at=now() where pair_id=g.id and user_id=p_user and checkpoint=p_checkpoint and reply is null;
  else
   if own.reply is null then raise exception 'Save your comparison first.';end if;
   if own.reflection is not null and own.reflection<>body then raise exception 'Your private reflection is already saved.';end if;
   update foundation_checkpoint_responses set reflection=body,reflected_at=now() where pair_id=g.id and user_id=p_user and checkpoint=p_checkpoint and reflection is null;
  end if;
  return jsonb_build_object('ok',true);
 end if;
 if g.started_at is null then raise exception 'Start the group discussion when everyone has joined.';end if;
 if exists(select 1 from interactive_assignment_work where assignment_id=p_assignment and user_id=p_user and status='submitted') then raise exception 'This assignment has already been submitted.';end if;
 select array_agg(pm.user_id order by pm.slot) into members from foundation_pair_members pm
  where pm.pair_id=m.pair_id and not exists(select 1 from foundation_makeup_work w where w.assignment_id=pm.assignment_id and w.user_id=pm.user_id and w.approved_at is not null);
 if cardinality(members)<2 then raise exception 'You are the only remaining group member. Request teacher approval to work on your own.';end if;
 for prior in 1..step-1 loop
  if not exists(select 1 from foundation_checkpoint_responses where assignment_id=p_assignment and user_id=p_user and checkpoint=steps[prior] and reflection is not null)
   or exists(select 1 from unnest(members) member_id where not exists(select 1 from foundation_checkpoint_responses r where r.pair_id=m.pair_id and r.user_id=member_id and r.checkpoint=steps[prior] and r.reply is not null)) then raise exception 'Finish the earlier discussion and your own reflection first.';end if;
 end loop;
 insert into foundation_checkpoint_responses(pair_id,assignment_id,user_id,checkpoint) values(m.pair_id,p_assignment,p_user,p_checkpoint) on conflict do nothing;
 select * into own from foundation_checkpoint_responses where assignment_id=p_assignment and user_id=p_user and checkpoint=p_checkpoint;
 if p_action='share' then
  if own.contribution is not null and own.contribution<>body then raise exception 'Your shared idea is saved. Develop it in your reply and reflection.';end if;
  update foundation_checkpoint_responses set contribution=body,contributed_at=coalesce(contributed_at,now()) where assignment_id=p_assignment and user_id=p_user and checkpoint=p_checkpoint;
 elsif p_action='reply' then
  if exists(select 1 from unnest(members) member_id where not exists(select 1 from foundation_checkpoint_responses r where r.pair_id=m.pair_id and r.user_id=member_id and r.checkpoint=p_checkpoint and r.contribution is not null)) then raise exception 'Everyone must share their own idea before replying.';end if;
  target:=members[(array_position(members,p_user)%cardinality(members))+1];
  if own.reply is not null and own.reply<>body then raise exception 'Your reply is saved. Continue your reasoning in your own reflection.';end if;
  update foundation_checkpoint_responses set reply=body,replied_at=coalesce(replied_at,now()),reply_to_user_id=coalesce(reply_to_user_id,target) where assignment_id=p_assignment and user_id=p_user and checkpoint=p_checkpoint;
 else
  if exists(select 1 from unnest(members) member_id where not exists(select 1 from foundation_checkpoint_responses r where r.pair_id=m.pair_id and r.user_id=member_id and r.checkpoint=p_checkpoint and r.reply is not null)) then raise exception 'Everyone must reply before your individual reflection.';end if;
  if own.reflection is not null and own.reflection<>body then raise exception 'Your reflection is saved. Develop your thinking in your individual answers.';end if;
  update foundation_checkpoint_responses set reflection=body,reflected_at=coalesce(reflected_at,now()) where assignment_id=p_assignment and user_id=p_user and checkpoint=p_checkpoint;
 end if;
 return jsonb_build_object('ok',true);
end $$;

CREATE OR REPLACE FUNCTION public.capture_foundation_exchange()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare m foundation_pair_members;w foundation_makeup_work;evidence jsonb;count_complete integer;g foundation_pairs;members uuid[];
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

 select * into g from foundation_pairs where id=m.pair_id for update;
 if g.protocol_version=3 and g.individual_pace then
  if g.started_at is null then raise exception 'Start your group before submitting.';end if;
  select count(*), jsonb_agg(jsonb_build_object('id',o.checkpoint,
    'own',to_jsonb(o)-'pair_id'-'assignment_id'-'user_id'-'checkpoint',
    'peers',case when r.user_id is null then '[]'::jsonb else jsonb_build_array(jsonb_build_object('slot',pm.slot,'user_id',r.user_id,'contribution',r.contribution,'reply',r.reply,'reply_to_user_id',r.reply_to_user_id)) end)
    order by array_position(array['evidence','model','questions'],o.checkpoint))
  into count_complete,evidence from foundation_checkpoint_responses o
  left join foundation_checkpoint_responses r on r.pair_id=o.pair_id and r.user_id=o.reply_to_user_id and r.checkpoint=o.checkpoint
  left join foundation_pair_members pm on pm.pair_id=o.pair_id and pm.user_id=r.user_id
  where o.pair_id=g.id and o.user_id=new.user_id and o.contribution is not null and o.reply is not null and o.reflection is not null
   and (o.example_selected or (r.user_id<>new.user_id and r.contribution is not null));
  if count_complete<>3 then raise exception 'Save your idea, comparison and private reflection at all three stops.';end if;
  new.state:=new.state||jsonb_build_object('partner_exchange',jsonb_build_object('version',4,'mode','group','pair_id',m.pair_id,'own_user_id',new.user_id,'own_slot',m.slot,'checkpoints',evidence));
  return new;
 end if;
 if g.protocol_version=3 then
  select array_agg(pm.user_id order by pm.slot) into members from foundation_pair_members pm
   where pm.pair_id=m.pair_id and not exists(select 1 from foundation_makeup_work mw where mw.assignment_id=pm.assignment_id and mw.user_id=pm.user_id and mw.approved_at is not null);
  if g.started_at is null or coalesce(cardinality(members),0)<2 then raise exception 'Start a group with at least two students, or request approval to work on your own.';end if;
  select count(*),jsonb_agg(jsonb_build_object('id',o.checkpoint,
    'own',to_jsonb(o)-'example_selected'-'pair_id'-'assignment_id'-'user_id'-'checkpoint',
    'peers',(select jsonb_agg(jsonb_build_object('user_id',pm.user_id,'slot',pm.slot,'contribution',r.contribution,'reply',r.reply,'reply_to_user_id',r.reply_to_user_id,'contributed_at',r.contributed_at,'replied_at',r.replied_at) order by pm.slot)
     from foundation_pair_members pm join foundation_checkpoint_responses r on r.pair_id=pm.pair_id and r.user_id=pm.user_id and r.checkpoint=o.checkpoint where pm.pair_id=m.pair_id and pm.user_id<>new.user_id)
    ) order by array_position(array['evidence','model','questions'],o.checkpoint))
   into count_complete,evidence from foundation_checkpoint_responses o
   where o.assignment_id=new.assignment_id and o.user_id=new.user_id and o.contribution is not null and o.reply is not null and o.reflection is not null
    and not exists(select 1 from unnest(members) member_id where not exists(select 1 from foundation_checkpoint_responses r where r.pair_id=m.pair_id and r.user_id=member_id and r.checkpoint=o.checkpoint and r.contribution is not null and r.reply is not null));
  if count_complete<>3 then raise exception 'Complete all three group discussions and your own private reflections before submitting.';end if;
  new.state:=new.state||jsonb_build_object('partner_exchange',jsonb_build_object('version',3,'mode','group','pair_id',m.pair_id,'own_user_id',new.user_id,'own_slot',m.slot,'checkpoints',evidence));
  return new;
 end if;
 select count(*),jsonb_agg(jsonb_build_object('id',o.checkpoint,'own',to_jsonb(o)-'example_selected'-'pair_id'-'assignment_id'-'user_id'-'checkpoint','peer',to_jsonb(p)-'example_selected'-'pair_id'-'assignment_id'-'user_id'-'checkpoint'-'reflection'-'reflected_at') order by array_position(array['evidence','model','questions'],o.checkpoint))
 into count_complete,evidence from foundation_checkpoint_responses o join foundation_checkpoint_responses p on p.pair_id=o.pair_id and p.checkpoint=o.checkpoint and p.user_id<>o.user_id
 where o.assignment_id=new.assignment_id and o.user_id=new.user_id and o.contribution is not null and o.reply is not null and o.reflection is not null and p.contribution is not null and p.reply is not null;
 if count_complete<>3 then raise exception 'Complete all three partner stops: both partners share and reply, then save your own reflection at each stop.';end if;
 new.state:=new.state||jsonb_build_object('partner_exchange',jsonb_build_object('version',2,'mode','pair','pair_id',m.pair_id,'own_user_id',new.user_id,'peer_user_id',(select user_id from foundation_pair_members where pair_id=m.pair_id and user_id<>new.user_id),'checkpoints',evidence));
 return new;
end $function$
;

