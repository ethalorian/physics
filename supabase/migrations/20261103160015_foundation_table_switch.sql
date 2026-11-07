-- Separate the current seat from the table at which each response was authored.
-- Existing responses, submissions, assignment drafts and grades are never rewritten.
create table public.foundation_table_authors (
 pair_id uuid not null, assignment_id uuid not null, user_id uuid not null references public.students(id),
 first_slot smallint not null check(first_slot between 1 and 4),
 idea_key uuid not null default gen_random_uuid() unique,
 primary key(pair_id,assignment_id,user_id),
 foreign key(pair_id,assignment_id) references public.foundation_pairs(id,assignment_id)
);
alter table public.foundation_table_authors enable row level security;
revoke all on public.foundation_table_authors from public,anon,authenticated;
grant select,insert on public.foundation_table_authors to service_role;
lock table public.foundation_pair_members in share row exclusive mode;
insert into public.foundation_table_authors(pair_id,assignment_id,user_id,first_slot)
 select pair_id,assignment_id,user_id,slot from public.foundation_pair_members;
do $$declare fk name;begin
 select conname into strict fk from pg_constraint where contype='f' and conrelid='public.foundation_checkpoint_responses'::regclass and confrelid='public.foundation_pair_members'::regclass;
 execute format('alter table public.foundation_checkpoint_responses drop constraint %I',fk);
end $$;
alter table public.foundation_checkpoint_responses
 add foreign key(pair_id,assignment_id,user_id) references public.foundation_table_authors(pair_id,assignment_id,user_id),
 add column source_slot smallint check(source_slot between 1 and 4);

create function public.foundation_remember_author() returns trigger
language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 insert into foundation_table_authors(pair_id,assignment_id,user_id,first_slot) values(new.pair_id,new.assignment_id,new.user_id,new.slot)
 on conflict(pair_id,assignment_id,user_id) do nothing;
 return new;
end $$;
create trigger foundation_remember_author after insert or update of pair_id on public.foundation_pair_members
 for each row execute function public.foundation_remember_author();
create function public.foundation_response_seat() returns trigger
language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 select slot into strict new.source_slot from foundation_pair_members
  where pair_id=new.pair_id and assignment_id=new.assignment_id and user_id=new.user_id;
 return new;
end $$;
create trigger foundation_response_seat before insert on public.foundation_checkpoint_responses
 for each row execute function public.foundation_response_seat();

create table public.foundation_table_switches (
 id uuid primary key default gen_random_uuid(), assignment_id uuid not null, user_id uuid not null references public.students(id),
 source_id uuid not null, destination_id uuid not null, source_code text not null, destination_code text not null,
 status text not null default 'pending' check(status in('pending','reserved','moved','declined','canceled','unavailable')),
 requested_at timestamptz not null default clock_timestamp(), decided_at timestamptz, decided_by text, moved_at timestamptz,
 foreign key(source_id,assignment_id) references public.foundation_pairs(id,assignment_id),
 foreign key(destination_id,assignment_id) references public.foundation_pairs(id,assignment_id),
 check(source_id<>destination_id)
);
create unique index foundation_switch_open on public.foundation_table_switches(assignment_id,user_id) where status in('pending','reserved');
create index foundation_switch_history on public.foundation_table_switches(assignment_id,user_id,requested_at desc);
create index foundation_switch_reservations on public.foundation_table_switches(destination_id) where status='reserved';
alter table public.foundation_table_switches enable row level security;
revoke all on public.foundation_table_switches from public,anon,authenticated;
grant select,insert,update on public.foundation_table_switches to service_role;

-- The caller locks both rooms in ID order. Recheck capacity and eligibility at decision time.
create function public.foundation_switch_seat_open(g foundation_pairs, student_id uuid) returns boolean
language sql stable security invoker set search_path=public,pg_temp as $$
 select g.protocol_version=3 and g.individual_pace and g.closed_at is null
 and (select count(*) from foundation_pair_members where pair_id=g.id)
     +(select count(*) from foundation_table_switches where destination_id=g.id and status='reserved' and user_id<>student_id)<4
 and exists(select 1 from foundation_pair_members m where m.pair_id=g.id
  and not exists(select 1 from interactive_assignment_work w where w.assignment_id=m.assignment_id and w.user_id=m.user_id and w.status='submitted')
  and not exists(select 1 from foundation_makeup_work w where w.assignment_id=m.assignment_id and w.user_id=m.user_id))
 and not exists(select 1 from foundation_pair_members m join interactive_assignments a on a.id=m.assignment_id where m.pair_id=g.id
  and not exists(select 1 from course_students cs join students s on s.id=cs.student_id where cs.course_id=a.course_id and cs.student_id=m.user_id and cs.enrollment_state='ACTIVE' and s.is_active is not false))
$$;
create function public.foundation_protect_reserved_seat() returns trigger
language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 perform 1 from foundation_pairs where id=new.pair_id for update;
 if (select count(*) from foundation_pair_members where pair_id=new.pair_id)
  +(select count(*) from foundation_table_switches where destination_id=new.pair_id and status='reserved' and user_id<>new.user_id)>=4
 then raise exception 'This table is full or its last seat is held for an approved switch.';end if;
 return new;
end $$;
create trigger foundation_protect_reserved_seat before insert or update of pair_id on public.foundation_pair_members
 for each row execute function public.foundation_protect_reserved_seat();

-- Ordinary setup cancellation must not send a student with completed discussion
-- work into a legacy room that cannot submit evidence from multiple tables.
create function public.foundation_protect_finished_stops() returns trigger
language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if exists(select 1 from foundation_checkpoint_responses where assignment_id=old.assignment_id and user_id=old.user_id and pair_id<>old.pair_id and reflection is not null)
 then raise exception 'You have finished stops at a previous table. Ask your teacher to switch tables.';end if;
 return old;
end $$;
create trigger foundation_protect_finished_stops before delete on public.foundation_pair_members for each row execute function public.foundation_protect_finished_stops();

create function public.foundation_finish_table_switch(req foundation_table_switches) returns text
language plpgsql security invoker set search_path=public,pg_temp as $$
declare dest foundation_pairs;
begin
 if req.status<>'reserved' then return req.status;end if;
 if exists(select 1 from foundation_checkpoint_responses where pair_id=req.source_id and user_id=req.user_id and contribution is not null and reflection is null)
 then return 'reserved';end if;
 select * into dest from foundation_pairs where id=req.destination_id;
 if not foundation_switch_seat_open(dest,req.user_id) then
  update foundation_table_switches set status='unavailable' where id=req.id;
  return 'unavailable';
 end if;
 update foundation_pair_members set pair_id=dest.id,slot=(select n from generate_series(1,4) n where not exists(
   select 1 from foundation_pair_members where pair_id=dest.id and slot=n) order by n limit 1)
 where assignment_id=req.assignment_id and user_id=req.user_id and pair_id=req.source_id;
 if not found then raise exception 'Your table changed. Check your current table.';end if;
 update foundation_table_switches set status='moved',moved_at=clock_timestamp() where id=req.id;
 update foundation_pairs set closed_at=case when id=req.source_id and not exists(select 1 from foundation_pair_members where pair_id=id) then now() else closed_at end
 where id in(req.source_id,req.destination_id);
 return 'moved';
end $$;

-- Decisions use the immutable request ID so an old tab cannot approve a replacement.
create function public.foundation_table_switch_action(p_assignment uuid,p_user uuid,p_action text,p_code text default null,p_request uuid default null,p_teacher text default null,p_source text default null)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare req foundation_table_switches;src foundation_pairs;dest foundation_pairs;result text;
begin
 if p_action is null or p_action not in('request','cancel','approve','decline') then raise exception 'Choose a table switch action.';end if;
 if not exists(select 1 from interactive_assignments a join courses c on c.id=a.course_id join course_students cs on cs.course_id=c.id join students s on s.id=cs.student_id
  where a.id=p_assignment and a.slug in(select foundation_slug from daily_lesson_templates) and a.due_on is not null and c.archived_at is null
  and cs.student_id=p_user and cs.enrollment_state='ACTIVE' and s.is_active is not false
  and (p_action not in('approve','decline') or lower(c.teacher_email)=lower(nullif(trim(p_teacher),''))))
 then raise exception 'Use the teacher account for this class or your own assigned lesson.';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_assignment::text||':'||p_user::text,0));
 if p_action='request' then
  select g.* into src from foundation_pair_members m join foundation_pairs g on g.id=m.pair_id where m.assignment_id=p_assignment and m.user_id=p_user;
  if src.id is null or src.code is distinct from upper(trim(p_source)) or src.protocol_version<>3 or not src.individual_pace or (src.started_at is null and not exists(select 1 from foundation_checkpoint_responses where
    assignment_id=p_assignment and user_id=p_user and pair_id<>src.id and reflection is not null)) then raise exception 'Check your current table before asking to switch.';end if;
  select * into dest from foundation_pairs where assignment_id=p_assignment and code=upper(trim(p_code));
  if dest.id is null or dest.id=src.id then raise exception 'Enter the other table’s code for this lesson.';end if;
 else
  select * into req from foundation_table_switches where id=p_request and assignment_id=p_assignment and user_id=p_user for update;
  if not found then raise exception 'This request is no longer available.';end if;
  if p_action='approve' and req.status in('reserved','moved') or p_action='decline' and req.status='declined' or p_action='cancel' and req.status='canceled'
  then return jsonb_build_object('ok',true,'status',req.status);end if;
  if req.status<>'pending' and not(p_action='cancel' and req.status='reserved') then raise exception 'This request has already changed.';end if;
  src.id:=req.source_id;dest.id:=req.destination_id;
 end if;
 perform 1 from foundation_pairs where id in(src.id,dest.id) order by id for update;
 select * into dest from foundation_pairs where id=dest.id;
 if p_action in('cancel','decline') then
  result:=case when p_action='cancel' then 'canceled' else 'declined' end;
  update foundation_table_switches set status=result,decided_by=coalesce(p_teacher,decided_by),decided_at=clock_timestamp() where id=req.id;
 else
  if not exists(select 1 from foundation_pair_members where pair_id=src.id and user_id=p_user)
   or exists(select 1 from interactive_assignment_work where assignment_id=p_assignment and user_id=p_user and status='submitted')
   or exists(select 1 from foundation_makeup_work where assignment_id=p_assignment and user_id=p_user)
   then raise exception 'Your table or lesson status has changed.';end if;
  if not foundation_switch_seat_open(dest,p_user) then raise exception 'That table has no open seat. Check its code or choose another table.';end if;
  if p_action='request' then
   select * into req from foundation_table_switches where assignment_id=p_assignment and user_id=p_user and status in('pending','reserved');
   if found and (req.source_id<>src.id or req.destination_id<>dest.id) then raise exception 'Cancel your current request before choosing another table.';end if;
   if req.id is null then
    insert into foundation_table_switches(assignment_id,user_id,source_id,destination_id,source_code,destination_code)
     values(p_assignment,p_user,src.id,dest.id,src.code,dest.code) returning * into req;
   end if;
   result:=req.status;
  else
   update foundation_table_switches set status='reserved',decided_at=clock_timestamp(),decided_by=p_teacher where id=req.id returning * into req;
   result:=foundation_finish_table_switch(req);
  end if;
 end if;
 update foundation_pairs set closed_at=closed_at where id=src.id; -- data-free refresh on the old table
 return jsonb_build_object('ok',true,'status',result);
end $$;

create or replace function public.foundation_checkpoint_action(p_assignment uuid,p_user uuid,p_checkpoint text,p_action text,p_text text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare m foundation_pair_members;g foundation_pairs;own foundation_checkpoint_responses;members uuid[];target uuid;req foundation_table_switches;
 steps text[]:=array['evidence','model','questions'];step integer;prior integer;body text:=btrim(p_text);
begin
 if not exists(select 1 from interactive_assignments a join courses c on c.id=a.course_id join course_students cs on cs.course_id=c.id join students s on s.id=cs.student_id
  where a.id=p_assignment and a.slug in(select foundation_slug from daily_lesson_templates) and a.due_on is not null and c.archived_at is null and cs.student_id=p_user and cs.enrollment_state='ACTIVE' and s.is_active is not false) then raise exception 'Assigned foundation unavailable.';end if;
 step:=array_position(steps,p_checkpoint);
 if step is null or p_action is null or p_action not in('share','reply','reflect','compare') or body is null or (p_action<>'compare' and length(body) not between 10 and 4000) then raise exception 'Choose a discussion stop and write between 10 and 4,000 characters.';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_assignment::text||':'||p_user::text,0));
 if exists(select 1 from foundation_makeup_work where assignment_id=p_assignment and user_id=p_user) then raise exception 'Continue with your independent make-up activities.';end if;
 select * into req from foundation_table_switches where assignment_id=p_assignment and user_id=p_user and status='reserved';
 if found then perform 1 from foundation_pairs where id in(req.source_id,req.destination_id) order by id for update;end if;
 select * into m from foundation_pair_members where assignment_id=p_assignment and user_id=p_user for update;
 if not found then raise exception 'Join your group first.';end if;
 select * into g from foundation_pairs where id=m.pair_id for update;
 if p_action='compare' and (g.protocol_version<>3 or not g.individual_pace) then raise exception 'Use the original group routine for this lesson.';end if;
 if g.protocol_version=2 then return foundation_checkpoint_action_legacy(p_assignment,p_user,p_checkpoint,p_action,p_text);end if;
 if g.protocol_version=3 and g.individual_pace then
  if exists(select 1 from interactive_assignment_work where assignment_id=p_assignment and user_id=p_user and status='submitted') then raise exception 'This assignment has already been submitted.';end if;
  if g.started_at is null and not (step=1 and p_action='share') then raise exception 'Start with at least two classmates before comparing ideas.';end if;
  for prior in 1..step-1 loop
   if not exists(select 1 from foundation_checkpoint_responses r where r.assignment_id=p_assignment and r.user_id=p_user and r.checkpoint=steps[prior] and r.reflection is not null) then raise exception 'Finish your earlier stop first.';end if;
  end loop;
  if exists(select 1 from foundation_checkpoint_responses where assignment_id=p_assignment and user_id=p_user and checkpoint=p_checkpoint and pair_id<>g.id)
  then raise exception 'You already saved this stop at your previous table.';end if;
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
    if body in('1','2','3','4') then
     -- Compatibility for a tab opened before stable idea keys were introduced.
     if (select count(*) from foundation_checkpoint_responses r join foundation_table_authors a using(pair_id,assignment_id,user_id)
      where r.pair_id=g.id and r.checkpoint=p_checkpoint and r.contribution is not null and coalesce(r.source_slot,a.first_slot)=body::int)>1
     then raise exception 'This seat changed. Refresh the lesson and choose the idea again.';end if;
     select pm.user_id into target from foundation_pair_members pm join foundation_checkpoint_responses r using(pair_id,user_id)
      where pm.pair_id=g.id and pm.slot=body::int and pm.user_id<>p_user and r.checkpoint=p_checkpoint and r.contribution is not null;
    else
     select a.user_id into target from foundation_table_authors a join foundation_checkpoint_responses r using(pair_id,assignment_id,user_id)
      where a.pair_id=g.id and a.idea_key::text=body and a.user_id<>p_user and r.checkpoint=p_checkpoint and r.contribution is not null;
    end if;
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
  if req.id is not null and p_action='reflect' then perform foundation_finish_table_switch(req);end if;
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
    'source_pair_id',o.pair_id,'source_slot',coalesce(o.source_slot,author.first_slot),
    'own',to_jsonb(o)-'source_slot'-'pair_id'-'assignment_id'-'user_id'-'checkpoint',
    'peers',case when r.user_id is null then '[]'::jsonb else jsonb_build_array(jsonb_build_object('slot',coalesce(r.source_slot,pm.first_slot),'user_id',r.user_id,'contribution',r.contribution,'reply',r.reply,'reply_to_user_id',r.reply_to_user_id)) end)
    order by array_position(array['evidence','model','questions'],o.checkpoint))
  into count_complete,evidence from foundation_checkpoint_responses o
  left join foundation_checkpoint_responses r on r.pair_id=o.pair_id and r.user_id=o.reply_to_user_id and r.checkpoint=o.checkpoint
  join foundation_table_authors author on author.pair_id=o.pair_id and author.user_id=o.user_id
  left join foundation_table_authors pm on pm.pair_id=o.pair_id and pm.user_id=r.user_id
  where o.assignment_id=new.assignment_id and o.user_id=new.user_id and o.contribution is not null and o.reply is not null and o.reflection is not null
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
    'own',to_jsonb(o)-'source_slot'-'example_selected'-'pair_id'-'assignment_id'-'user_id'-'checkpoint',
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
 select count(*),jsonb_agg(jsonb_build_object('id',o.checkpoint,'own',to_jsonb(o)-'source_slot'-'example_selected'-'pair_id'-'assignment_id'-'user_id'-'checkpoint','peer',to_jsonb(p)-'source_slot'-'example_selected'-'pair_id'-'assignment_id'-'user_id'-'checkpoint'-'reflection'-'reflected_at') order by array_position(array['evidence','model','questions'],o.checkpoint))
 into count_complete,evidence from foundation_checkpoint_responses o join foundation_checkpoint_responses p on p.pair_id=o.pair_id and p.checkpoint=o.checkpoint and p.user_id<>o.user_id
 where o.assignment_id=new.assignment_id and o.user_id=new.user_id and o.contribution is not null and o.reply is not null and o.reflection is not null and p.contribution is not null and p.reply is not null;
 if count_complete<>3 then raise exception 'Complete all three partner stops: both partners share and reply, then save your own reflection at each stop.';end if;
 new.state:=new.state||jsonb_build_object('partner_exchange',jsonb_build_object('version',2,'mode','pair','pair_id',m.pair_id,'own_user_id',new.user_id,'peer_user_id',(select user_id from foundation_pair_members where pair_id=m.pair_id and user_id<>new.user_id),'checkpoints',evidence));
 return new;
end $function$
;


-- Reject a stale tab's draft before it can post to the new table under the wrong prompt.
create function public.foundation_write_at_table(p_assignment uuid,p_user uuid,p_checkpoint text,p_action text,p_text text,p_code text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(p_assignment::text||':'||p_user::text,0));
 if p_code is not null and not exists(select 1 from foundation_pair_members m join foundation_pairs g on g.id=m.pair_id
  where m.assignment_id=p_assignment and m.user_id=p_user and g.code=p_code)
  or p_code is null and exists(select 1 from foundation_table_switches where assignment_id=p_assignment and user_id=p_user and status='moved')
 then raise exception 'Your table changed. Check your group updates before saving.';end if;
 return foundation_checkpoint_action(p_assignment,p_user,p_checkpoint,p_action,p_text);
end $$;

create function public.foundation_close_switch_on_makeup() returns trigger
language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 update foundation_table_switches set status='canceled' where assignment_id=new.assignment_id and user_id=new.user_id and status in('pending','reserved');
 return new;
end $$;
create trigger foundation_close_switch_on_makeup after insert on public.foundation_makeup_work for each row execute function public.foundation_close_switch_on_makeup();

create function public.foundation_close_switch_on_submission() returns trigger
language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 update foundation_table_switches set status='canceled' where assignment_id=new.assignment_id and user_id=new.user_id and status in('pending','reserved');
 return new;
end $$;
create trigger foundation_close_switch_on_submission after insert on public.interactive_assignment_submissions for each row execute function public.foundation_close_switch_on_submission();
revoke all on function public.foundation_protect_finished_stops(),public.foundation_remember_author(),public.foundation_response_seat(),public.foundation_switch_seat_open(foundation_pairs,uuid),public.foundation_protect_reserved_seat(),public.foundation_finish_table_switch(foundation_table_switches),public.foundation_table_switch_action(uuid,uuid,text,text,uuid,text,text),public.foundation_write_at_table(uuid,uuid,text,text,text,text),public.foundation_close_switch_on_makeup(),public.foundation_close_switch_on_submission() from public,anon,authenticated;
grant execute on function public.foundation_protect_finished_stops(),public.foundation_remember_author(),public.foundation_response_seat(),public.foundation_switch_seat_open(foundation_pairs,uuid),public.foundation_protect_reserved_seat(),public.foundation_finish_table_switch(foundation_table_switches),public.foundation_table_switch_action(uuid,uuid,text,text,uuid,text,text),public.foundation_write_at_table(uuid,uuid,text,text,text,text),public.foundation_close_switch_on_makeup(),public.foundation_close_switch_on_submission() to service_role;
