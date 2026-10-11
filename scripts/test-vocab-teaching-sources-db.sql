\set ON_ERROR_STOP on
begin;
do $$ begin
 if not exists(select 1 from pg_roles where rolname='anon') then create role anon;end if;
 if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated;end if;
 if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role;end if;
end $$;
create table public.vocabulary_sets(id uuid primary key,name text,description text,unit_id text,lesson_id text,published boolean,created_at timestamptz,created_by text,updated_at timestamptz);
alter table public.vocabulary_sets enable row level security;
create table public.vocabulary_terms(id uuid primary key,vocabulary_set_id uuid references public.vocabulary_sets(id),term text);
create table public.word_progress(term_id uuid references public.vocabulary_terms(id),checks integer);
create function public.save_vocab_terms(uuid,jsonb) returns void language plpgsql as $$begin raise exception 'Metadata reconnect attempted to rewrite words';end$$;
insert into public.vocabulary_sets values ('00000000-0000-0000-0000-000000000001','Motion','Existing words','unit-1','canonical-lesson',true,now(),'teacher','2026-10-01');
insert into public.vocabulary_terms values ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','position');
insert into public.word_progress values ('00000000-0000-0000-0000-000000000002',5);
\ir ../supabase/migrations/20261002152902_vocabulary_teaching_sources.sql
do $$ declare s public.vocabulary_sets;v jsonb;begin
 select * into s from public.vocabulary_sets limit 1;
 if s.teaching_source is not null then raise exception 'Legacy connection changed';end if;
 foreach v in array array['{"kind":"deck","unit_id":"unit-1","day":13,"track":"cpa"}'::jsonb,'{"kind":"deck","unit_id":"unit-1","day":21,"track":"honors"}'::jsonb,'{"kind":"video","lesson_id":"00000000-0000-0000-0000-000000000003"}'::jsonb,'{"kind":"none"}'::jsonb] loop
  perform public.update_vocabulary_set(s.id,s.updated_at,jsonb_build_object('teaching_source',v));
  begin perform public.update_vocabulary_set(s.id,s.updated_at,'{}');raise exception 'Stale edit accepted';exception when serialization_failure then null;end;
  select * into s from public.vocabulary_sets limit 1;
  if s.teaching_source<>v or s.lesson_id<>'canonical-lesson' or s.name<>'Motion' or not s.published then raise exception 'Connection changed content';end if;
 end loop;
 foreach v in array array['{}'::jsonb,'[]'::jsonb,'{"kind":"deck","unit_id":"unit-1","day":0,"track":"cpa"}'::jsonb,'{"kind":"deck","unit_id":"unit-1","day":1.5,"track":"cpa"}'::jsonb,'{"kind":"deck","unit_id":"unit-1","day":1,"track":null}'::jsonb,'{"kind":"video"}'::jsonb,'{"kind":"none","extra":true}'::jsonb] loop
  begin update public.vocabulary_sets set teaching_source=v;raise exception 'Invalid source accepted: %',v;exception when check_violation then null;end;
 end loop;
 if (select checks from public.word_progress)<>5 or (select count(*) from public.vocabulary_terms)<>1 then raise exception 'Word evidence changed';end if;
 if not (select relrowsecurity from pg_class where oid='public.vocabulary_sets'::regclass) then raise exception 'RLS lost';end if;
 if has_function_privilege('authenticated','public.update_vocabulary_set(uuid,timestamptz,jsonb,jsonb)','execute') or has_function_privilege('anon','public.update_vocabulary_set(uuid,timestamptz,jsonb,jsonb)','execute') then raise exception 'Public write access widened';end if;
end $$;
select 'PASS legacy rows, CPA/Honors/video/unit-only connections, preserved words/progress, stale edits, invalid JSON, RLS and RPC grants' as result;
rollback;
