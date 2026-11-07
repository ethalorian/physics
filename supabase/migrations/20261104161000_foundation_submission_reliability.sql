
set local lock_timeout='5s';
set local statement_timeout='30s';
do $$begin if md5(pg_get_functiondef('public.capture_foundation_exchange()'::regprocedure)) <> '2ae7ef6413e52d18bc94f13f39341ed6' then raise exception 'Capture function changed; recheck before migrating.';end if;end $$;

create table public.foundation_discussion_drafts (
 assignment_id uuid not null references public.interactive_assignments(id),
 user_id uuid not null references public.students(id),
 drafts jsonb not null default '{}'::jsonb, version integer not null default 0,
 updated_at timestamptz not null default now(),primary key(assignment_id,user_id)
);
alter table public.foundation_discussion_drafts enable row level security;
revoke all on public.foundation_discussion_drafts from public,anon,authenticated;
grant select,insert,update on public.foundation_discussion_drafts to service_role;
create function public.foundation_save_discussion_drafts(p_assignment uuid,p_user uuid,p_version integer,p_drafts jsonb)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare current_draft foundation_discussion_drafts;
begin
 if not exists(select 1 from interactive_assignments a join courses c on c.id=a.course_id join course_students cs on cs.course_id=c.id join students s on s.id=cs.student_id where a.id=p_assignment and a.slug in(select foundation_slug from daily_lesson_templates) and a.due_on is not null and c.archived_at is null and cs.student_id=p_user and cs.enrollment_state='ACTIVE' and s.is_active is not false) then raise exception 'Assigned foundation unavailable.';end if;
 if p_version is null or p_version<0 or p_drafts is null or jsonb_typeof(p_drafts)<>'object' then raise exception 'Invalid discussion draft.';end if;
 if (select count(*) from jsonb_each(p_drafts))>18 or exists(select 1 from jsonb_each(p_drafts) e where e.key!~'^(group|independent):(evidence|model|questions)-(share|reply|reflect)$' or jsonb_typeof(e.value)<>'string' or length(e.value#>>'{}')>4000) then raise exception 'Invalid discussion draft field.';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_assignment::text||':'||p_user::text,0));
 if exists(select 1 from interactive_assignment_work where assignment_id=p_assignment and user_id=p_user and status='submitted') then raise exception 'This assignment has already been submitted. Your saved discussion writing is preserved.';end if;
 insert into foundation_discussion_drafts(assignment_id,user_id) values(p_assignment,p_user) on conflict do nothing;
 select * into current_draft from foundation_discussion_drafts where assignment_id=p_assignment and user_id=p_user for update;
 if current_draft.drafts=p_drafts then return jsonb_build_object('version',current_draft.version);end if;
 if current_draft.version<>p_version then raise exception 'Discussion drafts changed in another tab. Copy your unsaved text before reloading this assignment.';end if;
 update foundation_discussion_drafts set drafts=p_drafts,version=version+1,updated_at=now() where assignment_id=p_assignment and user_id=p_user returning * into current_draft;
 return jsonb_build_object('version',current_draft.version);
end $$;
revoke all on function public.foundation_save_discussion_drafts(uuid,uuid,integer,jsonb) from public,anon,authenticated;
grant execute on function public.foundation_save_discussion_drafts(uuid,uuid,integer,jsonb) to service_role;

-- Upgrade room workflow metadata, never student text or historical submission snapshots.
lock table interactive_assignment_submissions,foundation_pairs,foundation_checkpoint_responses in share row exclusive mode;
create temporary table protected_foundation_text on commit drop as
 select assignment_id,user_id,checkpoint,md5((to_jsonb(r)-'reply_to_user_id')::text) as fingerprint from foundation_checkpoint_responses r;
create temporary table protected_foundation_submissions on commit drop as
 select id,md5(to_jsonb(s)::text) as fingerprint from interactive_assignment_submissions s;
-- Legacy pairs have exactly one real comparison partner. Preserve this attribution.
update foundation_checkpoint_responses r set reply_to_user_id=(select m.user_id from foundation_pair_members m where m.pair_id=r.pair_id and m.user_id<>r.user_id limit 1)
 from foundation_pairs g where g.id=r.pair_id and g.protocol_version=2 and r.reply is not null and r.reply_to_user_id is null
 and (select count(*) from foundation_pair_members m where m.pair_id=g.id)=2;
update foundation_pairs g set started_at=case when g.protocol_version=2 and (select count(*) from foundation_pair_members m where m.pair_id=g.id)>=2 then coalesce(g.started_at,now()) else g.started_at end,
 protocol_version=3,individual_pace=true
 where g.protocol_version in(2,3) and not g.individual_pace;
do $$begin
 if exists(select 1 from protected_foundation_text p full join foundation_checkpoint_responses r using(assignment_id,user_id,checkpoint) where p.fingerprint is distinct from md5((to_jsonb(r)-'reply_to_user_id')::text))
 or exists(select 1 from protected_foundation_submissions p full join interactive_assignment_submissions s using(id) where p.fingerprint is distinct from md5(to_jsonb(s)::text)) then raise exception 'Existing writing or submission changed unexpectedly.';end if;
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
 new.state:=new.state||jsonb_build_object('foundation_discussion_drafts',coalesce((select drafts from foundation_discussion_drafts where assignment_id=new.assignment_id and user_id=new.user_id),'{}'::jsonb));
 -- Teacher-authorized recovery for A-block Day 7 only. Preserve writing; never approve solo work or create grades.
 if new.assignment_id='524fc0a6-d23d-4ebd-a55e-7e0b8abf4161'::uuid then
  select * into w from foundation_makeup_work where assignment_id=new.assignment_id and user_id=new.user_id for update;
  select jsonb_agg(jsonb_build_object('id',step,'own',case when w.assignment_id is not null then coalesce(w.responses->step,'{}'::jsonb) else coalesce((select jsonb_build_object('contribution',r.contribution,'reply',r.reply,'reflection',r.reflection,'contributed_at',r.contributed_at,'replied_at',r.replied_at,'reflected_at',r.reflected_at) from foundation_checkpoint_responses r where r.assignment_id=new.assignment_id and r.user_id=new.user_id and r.checkpoint=step),'{}'::jsonb) end) order by position)
  into evidence from unnest(array['evidence','model','questions']) with ordinality as steps(step,position);
  new.state:=new.state||jsonb_build_object('partner_exchange',jsonb_build_object(
   'version',5,'mode','recovery','status','incomplete','notice','Day 7 submission recovery: discussion stops are incomplete. Saved discussion writing is preserved below. Submission does not establish collaboration or mastery; review only the student’s recorded evidence.',
   'own_user_id',new.user_id,'requested_mode',case when w.assignment_id is not null then 'independent' else 'group' end,
   'approved_at',w.approved_at,'checkpoints',evidence,
   'original_group_writing',coalesce((select jsonb_agg(to_jsonb(r)-'assignment_id'-'user_id' order by r.checkpoint) from foundation_checkpoint_responses r where r.assignment_id=new.assignment_id and r.user_id=new.user_id),'[]'::jsonb)));
  return new;
 end if;

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
end $function$;
