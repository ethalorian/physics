-- Additive rollout: never rewrite answers, membership IDs, original writing, submissions,
-- teacher reviews, released grades, mastery, assignment dates or lesson templates.
alter table public.foundation_pairs add column protocol_version smallint not null default 2 check(protocol_version in(2,3)),
 add column started_at timestamptz,
 add column notification_key uuid not null default gen_random_uuid();
alter table public.foundation_pairs alter column protocol_version set default 3;
alter table public.foundation_pair_members drop constraint foundation_pair_members_slot_check;
alter table public.foundation_pair_members add constraint foundation_pair_members_slot_check check(slot between 1 and 4);
alter table public.foundation_checkpoint_responses add column reply_to_user_id uuid references public.students(id);
-- Empty legacy rooms can grow. Any room with historical writing/submissions keeps its
-- original two-person completion rules and all of its existing evidence.
update public.foundation_pairs g set protocol_version=3 where
 not exists(select 1 from public.foundation_checkpoint_responses r where r.pair_id=g.id)
 and not exists(select 1 from public.foundation_pair_members m where m.pair_id=g.id and (m.contribution is not null or m.reply is not null))
 and not exists(select 1 from public.foundation_pair_members m join public.interactive_assignment_submissions s on s.assignment_id=m.assignment_id and s.user_id=m.user_id where m.pair_id=g.id);

CREATE OR REPLACE FUNCTION public.foundation_checkpoint_action_legacy(p_assignment uuid, p_user uuid, p_checkpoint text, p_action text, p_text text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
end $function$
;

create or replace function public.foundation_partner_action(p_assignment uuid,p_user uuid,p_action text,p_text text default '')
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a interactive_assignments;g foundation_pairs;m foundation_pair_members;n integer;capacity integer;
begin
 select a0.* into a from interactive_assignments a0 join courses c on c.id=a0.course_id join course_students cs on cs.course_id=c.id join students s on s.id=cs.student_id
 where a0.id=p_assignment and a0.slug in(select foundation_slug from daily_lesson_templates) and a0.due_on is not null and c.archived_at is null and cs.student_id=p_user and cs.enrollment_state='ACTIVE' and s.is_active is not false for share of a0;
 if not found then raise exception 'Assigned foundation unavailable.';end if;
 if p_action is null or p_action not in('create','join','start') then raise exception 'Choose a group action.';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_assignment::text||':'||p_user::text,0));
 if exists(select 1 from foundation_makeup_work where assignment_id=p_assignment and user_id=p_user) then raise exception 'Continue with your independent make-up activities.';end if;
 if exists(select 1 from interactive_assignment_work where assignment_id=p_assignment and user_id=p_user and status='submitted') then raise exception 'This assignment has already been submitted.';end if;
 select * into m from foundation_pair_members where assignment_id=p_assignment and user_id=p_user;
 if m.pair_id is not null then
  select * into g from foundation_pairs where id=m.pair_id for update;
  if p_action='join' and g.code<>upper(btrim(p_text)) then raise exception 'You already belong to a group for this assignment.';end if;
  if p_action='start' and g.protocol_version=3 and g.started_at is null then
   select count(*) into n from foundation_pair_members pm where pm.pair_id=g.id and not exists(select 1 from foundation_makeup_work w where w.assignment_id=p_assignment and w.user_id=pm.user_id and w.approved_at is not null);
   if n<2 then raise exception 'At least two students must join before starting.';end if;
   if exists(select 1 from foundation_pair_members pm where pm.pair_id=g.id and not exists(select 1 from foundation_makeup_work w where w.assignment_id=p_assignment and w.user_id=pm.user_id and w.approved_at is not null) and
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
  if not found then raise exception 'Check the group code and class assignment.';end if;
  capacity:=case when g.protocol_version=3 then 4 else 2 end;
  select count(*) into n from foundation_pair_members where pair_id=g.id;
  if n>=capacity then raise exception 'This group is full.';end if;
  if g.started_at is not null then raise exception 'This group has already started. Joining is closed.';end if;
  if exists(select 1 from foundation_pair_members pm where pm.pair_id=g.id and
   (exists(select 1 from foundation_makeup_work w where w.assignment_id=p_assignment and w.user_id=pm.user_id)
    or not exists(select 1 from course_students cs join students s on s.id=cs.student_id where cs.course_id=a.course_id and cs.student_id=pm.user_id and cs.enrollment_state='ACTIVE' and s.is_active is not false))) then raise exception 'A group member is no longer available for this activity.';end if;
  insert into foundation_pair_members(pair_id,assignment_id,user_id,slot) values(g.id,p_assignment,p_user,n+1);
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
 if step is null or p_action is null or p_action not in('share','reply','reflect') or body is null or length(body) not between 10 and 4000 then raise exception 'Choose a discussion stop and write between 10 and 4,000 characters.';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_assignment::text||':'||p_user::text,0));
 if exists(select 1 from foundation_makeup_work where assignment_id=p_assignment and user_id=p_user) then raise exception 'Continue with your independent make-up activities.';end if;
 select * into m from foundation_pair_members where assignment_id=p_assignment and user_id=p_user for update;
 if not found then raise exception 'Join your group first.';end if;
 select * into g from foundation_pairs where id=m.pair_id for update;
 if g.protocol_version=2 then return foundation_checkpoint_action_legacy(p_assignment,p_user,p_checkpoint,p_action,p_text);end if;
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
 if g.protocol_version=3 then
  select array_agg(pm.user_id order by pm.slot) into members from foundation_pair_members pm
   where pm.pair_id=m.pair_id and not exists(select 1 from foundation_makeup_work mw where mw.assignment_id=pm.assignment_id and mw.user_id=pm.user_id and mw.approved_at is not null);
  if g.started_at is null or coalesce(cardinality(members),0)<2 then raise exception 'Start a group with at least two students, or request approval to work on your own.';end if;
  select count(*),jsonb_agg(jsonb_build_object('id',o.checkpoint,
    'own',to_jsonb(o)-'pair_id'-'assignment_id'-'user_id'-'checkpoint',
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
 select count(*),jsonb_agg(jsonb_build_object('id',o.checkpoint,'own',to_jsonb(o)-'pair_id'-'assignment_id'-'user_id'-'checkpoint','peer',to_jsonb(p)-'pair_id'-'assignment_id'-'user_id'-'checkpoint'-'reflection'-'reflected_at') order by array_position(array['evidence','model','questions'],o.checkpoint))
 into count_complete,evidence from foundation_checkpoint_responses o join foundation_checkpoint_responses p on p.pair_id=o.pair_id and p.checkpoint=o.checkpoint and p.user_id<>o.user_id
 where o.assignment_id=new.assignment_id and o.user_id=new.user_id and o.contribution is not null and o.reply is not null and o.reflection is not null and p.contribution is not null and p.reply is not null;
 if count_complete<>3 then raise exception 'Complete all three partner stops: both partners share and reply, then save your own reflection at each stop.';end if;
 new.state:=new.state||jsonb_build_object('partner_exchange',jsonb_build_object('version',2,'mode','pair','pair_id',m.pair_id,'own_user_id',new.user_id,'peer_user_id',(select user_id from foundation_pair_members where pair_id=m.pair_id and user_id<>new.user_id),'checkpoints',evidence));
 return new;
end $function$
;

-- No names, writing, IDs, codes, grades or private reflections are broadcast.
-- Opaque notification topics only invalidate the authenticated API, never authorize it.
-- Delivery is best-effort: a transport outage must never lose a student's save.
create function public.foundation_notify_change() returns trigger
language plpgsql security invoker set search_path=public,pg_temp as $$
declare topic uuid;
begin
 if tg_table_name='foundation_pairs' then topic:=new.notification_key;
 elsif tg_table_name='foundation_makeup_work' then
  select g.notification_key into topic from foundation_pairs g join foundation_pair_members m on m.pair_id=g.id where m.assignment_id=new.assignment_id and m.user_id=new.user_id;
 else select notification_key into topic from foundation_pairs where id=new.pair_id;
 end if;
 if topic is not null then
  begin perform realtime.send('{}'::jsonb,'change','foundation:'||topic,false);
  exception when others then raise warning 'Foundation notification unavailable';end;
 end if;
 return new;
end $$;
create trigger foundation_group_notify after update on public.foundation_pairs for each row execute function public.foundation_notify_change();
create trigger foundation_member_notify after insert on public.foundation_pair_members for each row execute function public.foundation_notify_change();
create trigger foundation_writing_notify after insert or update on public.foundation_checkpoint_responses for each row execute function public.foundation_notify_change();
create trigger foundation_makeup_notify after insert or update on public.foundation_makeup_work for each row execute function public.foundation_notify_change();

revoke all on function public.foundation_checkpoint_action_legacy(uuid,uuid,text,text,text),public.foundation_notify_change() from public,anon,authenticated;
grant execute on function public.foundation_checkpoint_action_legacy(uuid,uuid,text,text,text),public.foundation_notify_change() to service_role;
-- Replaced functions retain their existing service-only ACLs. Existing tables retain
-- their RLS and service-only grants. No client can query or mutate these records directly.

