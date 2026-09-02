-- Fix "infinite recursion detected in policy" (42P17) family.
--
-- Root cause: app_uid() was NOT security definer, so its internal lookup on
-- public.students re-triggered students' own RLS policy (which calls
-- app_uid()) -> infinite self-recursion for every scoped query.
-- Additionally courses.rls2_read referenced course_students while
-- course_students.rls2_read referenced courses -> a second cycle.

create or replace function public.app_uid()
returns text
language sql stable security definer
set search_path = public
as $$
  select s.id::text from public.students s
  where lower(s.email) = lower(auth.jwt() ->> 'email')
  limit 1
$$;

revoke all on function public.app_uid() from public;
grant execute on function public.app_uid() to authenticated, anon, service_role;

create or replace function public.app_enrolled_in_course(cid uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from course_students cs
    where cs.course_id = cid and cs.student_id::text = app_uid()
  );
$$;

create or replace function public.app_teaches_course(cid uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from courses c
    where c.id = cid and c.teacher_email = app_email()
  );
$$;

revoke all on function public.app_enrolled_in_course(uuid) from public;
grant execute on function public.app_enrolled_in_course(uuid) to authenticated, anon, service_role;
revoke all on function public.app_teaches_course(uuid) from public;
grant execute on function public.app_teaches_course(uuid) to authenticated, anon, service_role;

drop policy if exists rls2_read on public.courses;
create policy rls2_read on public.courses
  for select using (
    app_is_admin()
    or teacher_email = app_email()
    or app_enrolled_in_course(id)
  );

drop policy if exists rls2_read on public.course_students;
create policy rls2_read on public.course_students
  for select using (
    app_is_admin()
    or student_id::text = app_uid()
    or app_teaches_course(course_id)
  );
