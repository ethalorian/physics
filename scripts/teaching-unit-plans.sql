-- Shared drafts and explicit per-class snapshots. No grades are stored here.
begin;
create table public.teaching_unit_plans (
 id uuid primary key default gen_random_uuid(), owner_email text not null,
 program text not null, track text not null default '', unit_id text not null references public.units(id),
 version integer not null default 1 check(version>0), steps jsonb not null default '[]' check(jsonb_typeof(steps)='array'),
 updated_at timestamptz not null default now(), updated_by text not null,
 unique(owner_email,program,track,unit_id)
);
create index teaching_unit_plans_unit on public.teaching_unit_plans(unit_id);
create table public.teaching_plan_classes (
 plan_id uuid not null references public.teaching_unit_plans(id), course_id uuid not null references public.courses(id),
 version integer not null default 1 check(version>0), plan_version integer not null,
 steps jsonb not null, meetings jsonb not null default '{}', current_step_id text,
 confirmed_at timestamptz, confirmed_by text, updated_at timestamptz not null default now(),
 primary key(plan_id,course_id), check(jsonb_typeof(steps)='array'),check(jsonb_typeof(meetings)='object')
);
create index teaching_plan_classes_course on public.teaching_plan_classes(course_id);
alter table public.teaching_unit_plans enable row level security;
alter table public.teaching_plan_classes enable row level security;
revoke all on public.teaching_unit_plans, public.teaching_plan_classes from public, anon, authenticated;
grant select,insert,update on public.teaching_unit_plans, public.teaching_plan_classes to service_role;

create function public.save_teaching_plan(p_owner text,p_course uuid,p_unit text,p_version integer,p_steps jsonb,p_actor text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare c courses; p teaching_unit_plans;
begin
 select * into c from courses where id=p_course and teacher_email=p_owner and archived_at is null;
 if not found then raise exception 'Class unavailable'; end if;
 if not exists(select 1 from units where id=p_unit and program=c.program) then raise exception 'Choose a unit in this course'; end if;
 if jsonb_typeof(p_steps)<>'array' or jsonb_array_length(p_steps)>100 then raise exception 'Invalid sequence'; end if;
 -- The unique key makes simultaneous first saves safe. The loser must reload.
 if p_version=0 then
  insert into teaching_unit_plans(owner_email,program,track,unit_id,steps,updated_by)
  values(p_owner,c.program,case when c.program='physics' then case when c.track in('honors','ap','pbl') then c.track else 'cpa' end else coalesce(c.track,'') end,p_unit,p_steps,p_actor) on conflict do nothing returning * into p;
  if p.id is null then raise exception 'This plan changed. Reload before saving.'; end if;
 else
  update teaching_unit_plans set steps=p_steps,version=version+1,updated_by=p_actor,updated_at=now()
  where owner_email=p_owner and program=c.program and track=case when c.program='physics' then case when c.track in('honors','ap','pbl') then c.track else 'cpa' end else coalesce(c.track,'') end and unit_id=p_unit and version=p_version returning * into p;
  if not found then raise exception 'This plan changed. Reload before saving.'; end if;
 end if;
 return to_jsonb(p);
end $$;

create function public.change_teaching_class(p_owner text,p_plan uuid,p_course uuid,p_plan_version integer,p_version integer,p_action text,p_payload jsonb,p_actor text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare p teaching_unit_plans; c courses; s teaching_plan_classes; step jsonb; a interactive_assignments; v_slug text;
begin
 select * into p from teaching_unit_plans where id=p_plan and owner_email=p_owner for update;
 if not found then raise exception 'Plan unavailable'; end if;
 select * into c from courses where id=p_course and teacher_email=p_owner and archived_at is null and program=p.program and (case when program='physics' then case when track in('honors','ap','pbl') then track else 'cpa' end else coalesce(track,'') end)=p.track;
 if not found then raise exception 'Class unavailable'; end if;
 select * into s from teaching_plan_classes where plan_id=p_plan and course_id=p_course for update;
 if coalesce(s.version,0)<>p_version then raise exception 'This class plan changed. Reload before saving.'; end if;
 if p_action='apply' then
  if p.version<>p_plan_version then raise exception 'The shared plan changed. Review its latest version.'; end if;
  if s.course_id is null then
   insert into teaching_plan_classes(plan_id,course_id,plan_version,steps) values(p.id,c.id,p.version,p.steps) returning * into s;
  else
   update teaching_plan_classes set steps=p.steps,plan_version=p.version,version=version+1,
    meetings=(select coalesce(jsonb_object_agg(key,value),'{}') from jsonb_each(s.meetings) where key in(select v->>'id' from jsonb_array_elements(p.steps) v)),
    current_step_id=case when exists(select 1 from jsonb_array_elements(p.steps) v where v->>'id'=s.current_step_id) then s.current_step_id else null end,
    confirmed_at=case when exists(select 1 from jsonb_array_elements(p.steps) v where v->>'id'=s.current_step_id) then s.confirmed_at else null end,
    confirmed_by=case when exists(select 1 from jsonb_array_elements(p.steps) v where v->>'id'=s.current_step_id) then s.confirmed_by else null end,
    updated_at=now() where plan_id=p.id and course_id=c.id returning * into s;
  end if;
 else
  if s.course_id is null then raise exception 'Apply the sequence to this class first'; end if;
  select v into step from jsonb_array_elements(s.steps) v where v->>'id'=p_payload->>'stepId';
  if step is null then raise exception 'Step unavailable in this class version'; end if;
  if p_action='position' then
   s.current_step_id=step->>'id';s.confirmed_at=now();s.confirmed_by=p_actor;
  elsif p_action='meeting' then
   if p_payload->'slot'='null'::jsonb then s.meetings=s.meetings-(step->>'id');
   else s.meetings=jsonb_set(s.meetings,array[step->>'id'],p_payload->'slot'); end if;
  elsif p_action='assign' then
   if left(step->>'activityKey',12)<>'interactive:' or c.program<>'physics' then raise exception 'Use this activity’s assignment settings'; end if;
   v_slug=substring(step->>'activityKey' from 13);
   -- A class+slug is the native identity. Never create a second work/grade store.
   perform pg_advisory_xact_lock(hashtextextended(c.id::text||v_slug,0));
   select * into a from interactive_assignments where course_id=c.id and interactive_assignments.slug=v_slug for update;
   if a.id is distinct from nullif(p_payload->>'expectedId','')::uuid or a.due_on is distinct from (p_payload->>'expectedDue')::date then raise exception 'The student deadline changed. Reload before saving.'; end if;
   if a.id is null then
    insert into interactive_assignments(course_id,slug,target_id,due_on) values(c.id,v_slug,(p_payload->>'targetId')::uuid,(p_payload->>'dueOn')::date) returning * into a;
   else
    update interactive_assignments set due_on=(p_payload->>'dueOn')::date where id=a.id returning * into a;
   end if;
  else raise exception 'Unknown plan action';
  end if;
  update teaching_plan_classes set current_step_id=s.current_step_id,confirmed_at=s.confirmed_at,confirmed_by=s.confirmed_by,meetings=s.meetings,version=version+1,updated_at=now()
  where plan_id=p.id and course_id=c.id returning * into s;
 end if;
 return jsonb_build_object('state',to_jsonb(s),'assignment',case when a.id is null then null else to_jsonb(a) end);
end $$;
revoke all on function public.save_teaching_plan(text,uuid,text,integer,jsonb,text), public.change_teaching_class(text,uuid,uuid,integer,integer,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.save_teaching_plan(text,uuid,text,integer,jsonb,text), public.change_teaching_class(text,uuid,uuid,integer,integer,text,jsonb,text) to service_role;
commit;
