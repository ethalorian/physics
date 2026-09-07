-- A-2, M-1, SEI-9: additive vocabulary evidence; never writes physics mastery.
alter table public.vocabulary_terms add column if not exists archived boolean not null default false;
alter table public.vocabulary_terms add column if not exists translations jsonb not null default '{}';
alter table public.vocabulary_sets add column if not exists archived boolean not null default false;
alter table public.vocab_attempts add column if not exists event_id text;
alter table public.vocab_attempts add column if not exists occurred_at timestamptz;
alter table public.vocab_attempts add column if not exists supports text[];
create unique index if not exists vocab_attempt_event on public.vocab_attempts(user_id,event_id);

create table public.vocab_target_terms (
 target_id uuid not null references public.learning_targets(id),
 term_id uuid not null references public.vocabulary_terms(id),
 primary key(target_id,term_id)
);
create table public.vocab_tasks (
 id uuid primary key default gen_random_uuid(),
 course_id uuid not null references public.courses(id),
 target_id uuid references public.learning_targets(id),
 title text not null,
 assigned_by text not null,
 student_ids uuid[] not null,
 term_ids uuid[] not null,
 words jsonb not null,
 due_on date,
 note text not null default '',
 threshold integer not null default 80 check(threshold between 50 and 100),
 min_checks integer not null default 2 check(min_checks between 1 and 5),
 check_mode text not null default 'recognition' check(check_mode in ('recognition','recall')),
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create index vocab_tasks_course on public.vocab_tasks(course_id,created_at desc);
create table public.vocab_checks (
 id uuid primary key default gen_random_uuid(),
 task_id uuid not null references public.vocab_tasks(id),
 user_id uuid not null,
 items jsonb not null,
 result jsonb,
 created_at timestamptz not null default now(),
 completed_at timestamptz
);
create index vocab_checks_task_user on public.vocab_checks(task_id,user_id,created_at desc);
alter table public.vocab_target_terms enable row level security;
alter table public.vocab_tasks enable row level security;
alter table public.vocab_checks enable row level security;
-- NextAuth identities are authorized in server routes; no direct client table access.
revoke all on public.vocab_target_terms, public.vocab_tasks, public.vocab_checks from anon, authenticated;
grant all on public.vocab_target_terms, public.vocab_tasks, public.vocab_checks to service_role;

create or replace function public.save_vocab_terms(p_set uuid,p_terms jsonb) returns void
language plpgsql security invoker set search_path = public as $$
declare item jsonb; oldrow public.vocabulary_terms; termrow public.vocabulary_terms; keep uuid[] := '{}'; tid uuid;
begin
 perform 1 from public.vocabulary_sets where id=p_set for update;
 if not found then raise exception 'Unknown vocabulary set'; end if;
 if jsonb_typeof(p_terms) <> 'array' then raise exception 'Terms must be an array'; end if;
 for item in select value from jsonb_array_elements(p_terms) loop
  if nullif(trim(item->>'term'),'') is null then raise exception 'A word is required'; end if;
  tid := null;
  if (item->>'id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
   tid := (item->>'id')::uuid;
   select * into oldrow from public.vocabulary_terms where id=tid and vocabulary_set_id=p_set;
   if not found then raise exception 'Word does not belong to this set; reload before saving'; end if;
  else
   select * into oldrow from public.vocabulary_terms where vocabulary_set_id=p_set and lower(trim(term))=lower(trim(item->>'term')) order by archived,id limit 1;
   if found then tid:=oldrow.id; end if;
  end if;
  if tid=any(keep) then raise exception 'Duplicate word'; end if;
  if tid is null then
   insert into public.vocabulary_terms(vocabulary_set_id,term,definition) values(p_set,trim(item->>'term'),coalesce(item->>'definition','')) returning * into oldrow;
   tid:=oldrow.id;
  end if;
  select * into termrow from jsonb_populate_record(oldrow,item - 'id' - 'vocabulary_set_id' - 'created_at');
  update public.vocabulary_terms set term=trim(termrow.term),definition=termrow.definition,
   category=termrow.category,difficulty=termrow.difficulty,tier=termrow.tier,cognate=termrow.cognate,
   definition_es=termrow.definition_es,icon=termrow.icon,example=termrow.example,
   part_of_speech=termrow.part_of_speech,image_url=termrow.image_url,translations=termrow.translations,
   order_index=cardinality(keep),archived=false,updated_at=now() where id=tid;
  keep:=array_append(keep,tid);
 end loop;
 update public.vocabulary_terms set archived=true where vocabulary_set_id=p_set and not(id=any(keep));
end $$;
revoke all on function public.save_vocab_terms(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.save_vocab_terms(uuid,jsonb) to service_role;
create or replace function public.link_vocab_target(p_target uuid,p_terms uuid[]) returns void
language plpgsql security invoker set search_path=public as $$
begin
 perform 1 from public.learning_targets where id=p_target for update;
 if not found then raise exception 'Unknown target'; end if;
 if exists(select 1 from unnest(p_terms) t where not exists(select 1 from public.vocabulary_terms w where w.id=t and not w.archived)) then raise exception 'Unknown word'; end if;
 delete from public.vocab_target_terms where target_id=p_target;
 insert into public.vocab_target_terms(target_id,term_id) select p_target,t from unnest(p_terms)t on conflict do nothing;
end $$;
revoke all on function public.link_vocab_target(uuid,uuid[]) from public,anon,authenticated;
grant execute on function public.link_vocab_target(uuid,uuid[]) to service_role;
alter table public.vocab_assignments enable row level security;
alter table public.vocab_attempts enable row level security;
alter view public.vocab_competency set (security_invoker=true);
revoke all on public.vocab_assignments,public.vocab_attempts,public.vocab_competency from anon,authenticated;
grant all on public.vocab_assignments,public.vocab_attempts to service_role;
grant select on public.vocab_competency to service_role;
