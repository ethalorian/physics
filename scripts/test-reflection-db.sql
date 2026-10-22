\set ON_ERROR_STOP on
-- Run after test-choice-calendar-db.cjs, in that same disposable cluster only.
do $$ begin
  if current_setting('data_directory') <> '/private/tmp/choice-calendar-postgres' then raise exception 'Not the disposable test database'; end if;
end $$;
drop table if exists public.lesson_artifacts;
create table if not exists public.lessons(id uuid primary key);
create schema if not exists storage;
create table if not exists storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
delete from storage.buckets where id='student-reflections';
\ir ../supabase/migrations/20261021015805_reflection_artifacts.sql
do $$ begin
  if has_table_privilege('anon','lesson_artifacts','SELECT') or has_table_privilege('authenticated','lesson_artifacts','INSERT') then raise exception 'Client grants must be absent'; end if;
  if not (select relrowsecurity from pg_class where oid='lesson_artifacts'::regclass) then raise exception 'RLS missing'; end if;
  if (select public from storage.buckets where id='student-reflections') then raise exception 'Bucket must be private'; end if;
  if not has_table_privilege('service_role','lesson_artifacts','INSERT') then raise exception 'Service route cannot upload'; end if;
end $$;
insert into lessons values('66666666-6666-4666-8666-666666666666') on conflict do nothing;
insert into lesson_artifacts(id,user_id,lesson_id,block_id,path,name,content_type,size)
values('77777777-7777-4777-8777-777777777777','44444444-4444-4444-8444-000000000001','66666666-6666-4666-8666-666666666666','product','test/page.pdf','Manga.pdf','application/pdf',123);
do $$ begin
  if not choice_option_attempted('{"steps":[{"kind":"lesson","sourceId":"66666666-6666-4666-8666-666666666666"}]}','44444444-4444-4444-8444-000000000001') then raise exception 'Uploading a product must count as attempted work'; end if;
end $$;
select 'PASS: private artifact migration, service-only access, and upload attempt protection';
