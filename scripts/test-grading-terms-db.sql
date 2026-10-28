-- Run ONLY in a disposable local database. Fixtures and migration are rolled back.
-- Existing app tables intentionally cause an error instead of touching an app database.
\set ON_ERROR_STOP on
begin;
create table public.courses(id uuid primary key,teacher_email text,archived_at timestamptz);
do $$ begin
  if not exists(select from pg_roles where rolname='anon') then create role anon; end if;
  if not exists(select from pg_roles where rolname='authenticated') then create role authenticated; end if;
  if not exists(select from pg_roles where rolname='service_role') then create role service_role bypassrls; end if;
end $$;
grant select, update on public.courses to service_role;
insert into public.courses values('11111111-1111-4111-8111-111111111111','teacher@example.test',null);
\ir ../supabase/migrations/20261024160706_course_grading_terms.sql
-- Model Supabase's default service-role grants before applying the correction.
grant all on public.course_grading_settings, public.course_grading_settings_history to service_role;
\ir ../supabase/migrations/20261024160739_restrict_grading_term_service_grants.sql
create function pg_temp.rejects(statement text, code text default 'P0001') returns void language plpgsql as $$
begin
  begin execute statement;
  exception when others then if sqlstate = code then return; else raise; end if;
  end;
  raise exception 'Expected query to be rejected: %',statement;
end $$;
do $$
declare c uuid := '11111111-1111-4111-8111-111111111111'; terms jsonb := '[{"id":"t1","name":"Term 1","start":"2026-09-01","end":"2026-11-06"},{"id":"t2","name":"Term 2","start":"2026-11-07","end":"2027-01-22"}]'; result jsonb;
begin
  if has_table_privilege('anon','public.course_grading_settings','select') or has_table_privilege('authenticated','public.course_grading_settings','update') or has_function_privilege('authenticated','public.save_course_grading_settings(uuid,jsonb,jsonb,integer,text,text)','execute') then raise exception 'Public access must be denied'; end if;
  if not (select relrowsecurity from pg_class where oid='public.course_grading_settings'::regclass) then raise exception 'RLS is required'; end if;
  if has_table_privilege('service_role','public.course_grading_settings','delete') or has_table_privilege('service_role','public.course_grading_settings_history','update') or has_table_privilege('service_role','public.course_grading_settings_history','delete') then raise exception 'Service grants must preserve history'; end if;
  result := public.save_course_grading_settings(c,terms,'{}',0,'teacher@example.test','teacher@example.test');
  if result->>'revision' <> '1' then raise exception 'First save revision'; end if;
  result := public.save_course_grading_settings(c,terms,'{}',0,'teacher@example.test','teacher@example.test');
  if result->>'revision' <> '1' then raise exception 'Retry must be idempotent'; end if;
  result := public.save_course_grading_settings(c,terms,'{"quiz:a":"t2"}',1,'teacher@example.test','teacher@example.test');
  if result->>'revision' <> '2' or result->'placements'->>'quiz:a' <> 't2' then raise exception 'Placement save'; end if;
  perform pg_temp.rejects(format('select public.save_course_grading_settings(%L,%L,%L,1,%L,%L)',c,terms,'{}','teacher@example.test','teacher@example.test'),'40001');
  perform pg_temp.rejects(format('select public.save_course_grading_settings(%L,%L,%L,2,%L,%L)',c,terms,'{}','another@example.test','another@example.test'));
  perform pg_temp.rejects(format('select public.save_course_grading_settings(%L,%L,%L,2,%L,%L)',c,jsonb_set(terms,'{1,start}','"2026-11-06"'),'{}','teacher@example.test','teacher@example.test'));
  perform pg_temp.rejects(format('select public.save_course_grading_settings(%L,%L,%L,2,%L,%L)',c,terms,'{"quiz:a":"missing"}','teacher@example.test','teacher@example.test'));
  perform pg_temp.rejects(format('select public.save_course_grading_settings(%L,%L,%L,2,%L,%L)',c,jsonb_set(terms,'{1,name}','" TERM 1 "'),'{}','teacher@example.test','teacher@example.test'));
  if (select count(*) from public.course_grading_settings_history) <> 2 then raise exception 'Exactly one history entry per saved revision'; end if;
end $$;
set local role service_role;
select (public.save_course_grading_settings('11111111-1111-4111-8111-111111111111','[]','{}',2,'teacher@example.test','teacher@example.test')->>'revision')::integer = 3 as service_save_passed;
reset role;
rollback;
