-- Google Classroom is authoritative for class membership, not student records.
-- All pages are fetched by the server before this transaction is called.
create or replace function public.sync_classroom_roster(
  p_course jsonb,
  p_students jsonb,
  p_teacher_email text,
  p_owner_emails text[],
  p_is_admin boolean,
  p_snapshot_started_at timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_course public.courses%rowtype;
  v_student jsonb;
  v_id uuid;
  v_candidates uuid[];
  v_ids uuid[] := '{}'::uuid[];
  v_google_ids text[] := '{}'::text[];
  v_google_id text;
  v_email text;
  v_name text;
  v_added integer := 0;
  v_removed integer := 0;
  v_count integer;
  v_now timestamptz := clock_timestamp();
begin
  if jsonb_typeof(p_course) is distinct from 'object'
     or coalesce(btrim(p_course->>'id'), '') = ''
     or coalesce(btrim(p_course->>'name'), '') = ''
     or jsonb_typeof(p_students) is distinct from 'array'
     or coalesce(btrim(p_teacher_email), '') = ''
     or p_snapshot_started_at is null then
    raise exception 'ROSTER_INVALID';
  end if;

  -- Serialize even the first import, when no course row exists yet. A late
  -- response from an older refresh cannot replace a newer committed roster.
  perform pg_advisory_xact_lock(hashtextextended('classroom-roster:' || (p_course->>'id'), 0));
  select * into v_course from public.courses
    where google_course_id = p_course->>'id' for update;
  if found then
    if not coalesce(p_is_admin, false)
       and not coalesce(lower(btrim(v_course.teacher_email)) = any(p_owner_emails), false) then
      raise exception 'ROSTER_FORBIDDEN';
    end if;
    if v_course.last_synced_at > p_snapshot_started_at then
      raise exception 'ROSTER_STALE';
    end if;
  else
    insert into public.courses (google_course_id, name, teacher_email)
      values (p_course->>'id', p_course->>'name', lower(btrim(p_teacher_email)))
      returning * into v_course;
  end if;

  for v_student in select value from jsonb_array_elements(p_students) order by value->>'google_id'
  loop
    v_id := null;
    v_google_id := v_student->>'google_id';
    v_name := btrim(v_student->>'name');
    if jsonb_typeof(v_student) is distinct from 'object'
       or coalesce(v_google_id, '') !~ '^[A-Za-z0-9_-]+$'
       or coalesce(v_name, '') = '' then
      raise exception 'ROSTER_INVALID';
    end if;
    if v_google_id = any(v_google_ids) then raise exception 'ROSTER_AMBIGUOUS'; end if;
    v_google_ids := array_append(v_google_ids, v_google_id);

    -- Login identity survives a student's name/email changes and protects work
    -- already attached to their canonical account.
    select student_id into v_id from public.student_identities
      where provider = 'google' and provider_sub = v_google_id;
    if v_id is null then
      v_email := coalesce(nullif(lower(btrim(v_student->>'email')), ''), v_google_id || '@classroom.local');
      select array_agg(id) into v_candidates from public.students where lower(email) = v_email;
      if cardinality(v_candidates) > 1 then raise exception 'ROSTER_AMBIGUOUS'; end if;
      v_id := v_candidates[1];
      if v_id is null and v_email <> v_google_id || '@classroom.local' then
        select id into v_id from public.students where email = v_google_id || '@classroom.local';
      end if;
      if v_id is null then
        -- Preserve the existing first-import match for students who signed in
        -- before Classroom was connected. Never guess between duplicate names.
        select array_agg(id) into v_candidates from public.students
          where lower(btrim(name)) = lower(v_name) and email not like '%@classroom.local';
        if cardinality(v_candidates) > 1 then raise exception 'ROSTER_AMBIGUOUS'; end if;
        v_id := v_candidates[1];
      end if;
      if v_id is not null and exists (
        select 1 from public.student_identities
        where student_id = v_id and provider = 'google' and provider_sub <> v_google_id
      ) then raise exception 'ROSTER_AMBIGUOUS'; end if;
      if v_id is null then
        insert into public.students (email, name, first_name, last_name, last_synced_at)
          values (v_email, v_name, v_student->>'first_name', v_student->>'last_name', v_now)
          on conflict (email) do update set name = excluded.name,
            first_name = excluded.first_name, last_name = excluded.last_name, last_synced_at = excluded.last_synced_at
          returning id into v_id;
      end if;
    end if;
    if v_id = any(v_ids) then raise exception 'ROSTER_AMBIGUOUS'; end if;
    v_ids := array_append(v_ids, v_id);

    update public.students set name = v_name, first_name = v_student->>'first_name',
      last_name = v_student->>'last_name', last_synced_at = v_now
      where id = v_id;
    insert into public.course_students (course_id, student_id, enrollment_state, enrolled_via)
      values (v_course.id, v_id, 'ACTIVE', 'import') on conflict (course_id, student_id) do nothing;
    get diagnostics v_count = row_count;
    v_added := v_added + v_count;
    update public.course_students set enrollment_state = 'ACTIVE'
      where course_id = v_course.id and student_id = v_id and enrollment_state is distinct from 'ACTIVE';
  end loop;

  -- Only remove membership links. Student accounts, submissions, grades and
  -- memberships in other classes remain untouched. An empty roster is valid.
  delete from public.course_students where course_id = v_course.id and not (student_id = any(v_ids));
  get diagnostics v_removed = row_count;
  update public.courses set name = p_course->>'name', section = p_course->>'section',
    description = p_course->>'description', room = p_course->>'room',
    track = coalesce(p_course->>'track', track), program = coalesce(p_course->>'program', program),
    student_count = cardinality(v_ids), last_synced_at = clock_timestamp(), updated_at = clock_timestamp()
    where id = v_course.id;

  return jsonb_build_object('courseId', v_course.id, 'studentsTotal', cardinality(v_ids),
    'studentsSynced', cardinality(v_ids), 'studentsAdded', v_added, 'studentsRemoved', v_removed);
end;
$$;

revoke all on function public.sync_classroom_roster(jsonb, jsonb, text, text[], boolean, timestamptz) from public, anon, authenticated;
grant execute on function public.sync_classroom_roster(jsonb, jsonb, text, text[], boolean, timestamptz) to service_role;
comment on function public.sync_classroom_roster(jsonb, jsonb, text, text[], boolean, timestamptz)
  is 'Server-only atomic reconciliation of a complete Google Classroom roster. Removes membership links only; retains accounts and saved work.';
