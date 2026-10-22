-- Private student products. Existing block drafts/responses hold the receipt ID.
create table public.lesson_artifacts (
  id uuid primary key,
  user_id uuid not null references public.students(id),
  lesson_id uuid not null references public.lessons(id),
  block_id text not null,
  path text not null unique,
  name text not null,
  content_type text not null check (content_type in ('image/png','image/jpeg','image/webp','application/pdf')),
  size integer not null check (size > 0 and size <= 4000000),
  created_at timestamptz not null default now()
);
create index lesson_artifacts_owner on public.lesson_artifacts(user_id,lesson_id,block_id);
alter table public.lesson_artifacts enable row level security;
revoke all on public.lesson_artifacts from public, anon, authenticated;
grant all on public.lesson_artifacts to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('student-reflections','student-reflections',false,4000000,array['image/png','image/jpeg','image/webp','application/pdf']);
-- App routes authenticate the student/rostered teacher before service-role access.
-- No client role receives an object policy for this bucket.
