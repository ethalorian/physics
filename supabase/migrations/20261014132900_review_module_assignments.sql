create table public.review_module_assignments (
 slug text primary key check (slug in ('unit-1','unit-1-honors')),
 title text not null,
 course_ids uuid[] not null,
 owner_email text not null,
 code_salt text not null,
 code_hash text not null,
 code_version integer not null default 1,
 created_at timestamptz not null default now()
);
create table public.review_module_work (
 module_slug text not null references public.review_module_assignments(slug),
 user_id uuid not null references public.students(id),
 state jsonb not null default '{"i":0,"ans":{},"num":{},"done":{},"responses":{}}',
 status text not null default 'draft' check (status in ('draft','submitted')),
 version integer not null default 0,
 unlocked_version integer not null,
 submitted_at timestamptz,
 updated_at timestamptz not null default now(),
 primary key(module_slug,user_id),
 check (jsonb_typeof(state)='object' and octet_length(state::text)<=200000)
);
create index review_module_work_user_idx on public.review_module_work(user_id);
create table public.review_module_attempts (
 user_id uuid not null references public.students(id),
 module_slug text not null references public.review_module_assignments(slug),
 window_start timestamptz not null default now(),
 attempts integer not null default 0,
 primary key(user_id,module_slug)
);
alter table public.review_module_assignments enable row level security;
alter table public.review_module_work enable row level security;
alter table public.review_module_attempts enable row level security;
revoke all on public.review_module_assignments,public.review_module_work,public.review_module_attempts from public,anon,authenticated;
grant all on public.review_module_assignments,public.review_module_work,public.review_module_attempts to service_role;

-- Shared across server instances. Only authenticated server routes may invoke it.
create function public.consume_review_module_attempt(p_user uuid,p_slug text)
returns boolean language plpgsql security invoker set search_path=public as $$
declare n integer;
begin
 insert into review_module_attempts as a(user_id,module_slug,window_start,attempts)
 values(p_user,p_slug,now(),1)
 on conflict(user_id,module_slug) do update set
 attempts=case when a.window_start<now()-interval '10 minutes' then 1 else a.attempts+1 end,
 window_start=case when a.window_start<now()-interval '10 minutes' then now() else a.window_start end
 returning attempts into n;
 return n<=12;
end $$;
revoke all on function public.consume_review_module_attempt(uuid,text) from public,anon,authenticated;
grant execute on function public.consume_review_module_attempt(uuid,text) to service_role;

create function public.unlock_review_module(p_user uuid,p_slug text,p_version integer)
returns void language sql security invoker set search_path=public as $$
 insert into review_module_work(user_id,module_slug,unlocked_version)
 select p_user,p_slug,p_version from review_module_assignments where slug=p_slug and code_version=p_version
 on conflict(module_slug,user_id) do update set unlocked_version=excluded.unlocked_version;
$$;
revoke all on function public.unlock_review_module(uuid,text,integer) from public,anon,authenticated;
grant execute on function public.unlock_review_module(uuid,text,integer) to service_role;

alter table public.student_learning_plans drop constraint student_learning_plans_assignment_key_check;
alter table public.student_learning_plans add constraint student_learning_plans_assignment_key_check check (
 assignment_key ~ '^(video|reading|quiz|vocabulary):[0-9a-fA-F-]{36}$' or assignment_key ~ '^review:unit-1(-honors)?$'
);

insert into public.review_module_assignments(slug,title,course_ids,owner_email,code_salt,code_hash) values('unit-1','Unit 1 Review · CPA Physics',ARRAY['c7453cf7-42d3-4a73-a32d-26ff24d46465'::uuid,'63c25672-5bb3-41c7-ad4b-2e6c15a67ebd'::uuid],'antoccic@fitchburg.k12.ma.us','3fc232e58eb224d99a0a697a00063882','1b41fd7e53cd4440dbb47b80f405604da655de049b9d0b7a436a7b637acbe479');

insert into public.review_module_assignments(slug,title,course_ids,owner_email,code_salt,code_hash) values('unit-1-honors','Unit 1 Review · Honors Physics',ARRAY['990c215f-6dfd-47c1-97be-85d286e8574c'::uuid],'antoccic@fitchburg.k12.ma.us','499c8cd4845fcb5ac243c4098d2143f0','afea32517209c7bac3e297da5e2c2a582ac65af65992ac9b9b75a4b4d4e4e3ed');
