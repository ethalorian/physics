\set ON_ERROR_STOP on
do $$ begin
 if not exists(select 1 from pg_roles where rolname='anon') then create role anon; end if;
 if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
 if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role; end if;
end $$;
create table public.courses (
 id uuid primary key default gen_random_uuid(), google_course_id text unique not null, name text not null,
 teacher_email text, section text, description text, room text, track text, program text default 'physics',
 student_count integer default 0, last_synced_at timestamptz default now(), updated_at timestamptz default now()
);
create table public.students (
 id uuid primary key default gen_random_uuid(), email text unique not null, name text not null,
 first_name text, last_name text, last_synced_at timestamptz, alias text, photo_url text
);
create table public.student_identities (
 student_id uuid references public.students(id), provider text, provider_sub text, email_at_link text,
 first_seen timestamptz default now(), last_seen timestamptz default now(), unique(provider, provider_sub)
);
create table public.course_students (
 id uuid primary key default gen_random_uuid(), course_id uuid references public.courses(id) on delete cascade,
 student_id uuid references public.students(id) on delete cascade, enrollment_state text default 'ACTIVE',
 enrolled_via text default 'import', unique(course_id, student_id)
);
create table public.test_saved_work (student_id uuid references public.students(id), answer text, grade integer);
