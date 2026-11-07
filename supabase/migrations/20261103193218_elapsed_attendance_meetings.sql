-- Return one row per enrolled student and elapsed meeting. An unmarked day
-- is a virtual zero, so later work or an offline correction can replace it.
create function public.attendance_elapsed_marks(p_course uuid,p_days date[],p_from date,p_to date,p_user uuid default null)
returns table(user_id uuid,meeting_day date,mark text,made_up boolean,revision integer,source text,at_time timestamptz)
language sql stable security invoker set search_path='' as $$
  with candidates as (
    select unnest(p_days) as day
    union
    -- A teacher-confirmed meeting survives later edits to the rotation.
    select m.meeting_day from public.attendance_marks m
    where m.course_id=p_course and m.meeting_day between p_from and p_to
  ), days as materialized (
    select day from candidates where day between p_from and least(p_to,(now() at time zone 'America/New_York')::date)
  ), recorded as materialized (
    select * from public.attendance_effective_marks(p_course,array(select day from days),p_from,p_to,p_user)
  )
  select cs.student_id,d.day,coalesce(m.mark,'no_credit'),coalesce(m.made_up,false),
    coalesce(m.revision,0),m.source,m.at_time
  from public.course_students cs
    join public.students s on s.id=cs.student_id and s.is_active is not false
    cross join days d
    left join recorded m on m.user_id=cs.student_id and m.meeting_day=d.day
  where cs.course_id=p_course and cs.enrollment_state='ACTIVE'
    and (p_user is null or p_user=cs.student_id)
    and (cs.enrolled_at is null or (cs.enrolled_at at time zone 'America/New_York')::date<=d.day);
$$;
revoke all on function public.attendance_elapsed_marks(uuid,date[],date,date,uuid) from public,anon,authenticated;
grant execute on function public.attendance_elapsed_marks(uuid,date[],date,date,uuid) to service_role;

-- End-of-term snapshots validate the same totals as the live student grade.
create or replace function public.post_automatic_attendance_term(p_course uuid,p_term text,p_days date[],p_preview jsonb,p_actor text)
returns void language plpgsql security invoker set search_path='' as $$
declare t jsonb; calculated jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended('attendance:'||p_course,0));
  select term into t from public.course_grading_settings s cross join lateral jsonb_array_elements(s.terms) term
    where s.course_id=p_course and term->>'id'=p_term for share of s;
  if t is null or (t->>'end')::date >= (now() at time zone 'America/New_York')::date then raise exception 'Post attendance after the selected term ends.'; end if;
  select jsonb_agg(to_jsonb(roster) order by id) into calculated from (
    select cs.student_id id, count(m.mark) filter(where m.mark='participated' or m.made_up)::int earned,
      count(m.mark) filter(where m.mark<>'excused')::int eligible
    from public.course_students cs join public.students st on st.id=cs.student_id
    left join public.attendance_elapsed_marks(p_course,p_days,(t->>'start')::date,(t->>'end')::date) m on m.user_id=cs.student_id
    where cs.course_id=p_course and cs.enrollment_state='ACTIVE' and st.is_active is not false group by cs.student_id
  ) roster;
  if calculated is null or calculated is distinct from p_preview then raise exception 'Term results changed. Refresh the preview before posting.'; end if;
  if not exists(select from jsonb_array_elements(calculated) g where (g->>'eligible')::int>0)
     and not exists(select from public.attendance_term_grades where course_id=p_course and term_id=p_term and eligible>0)
  then raise exception 'There are no eligible meetings to post.'; end if;
  insert into public.attendance_term_grades(course_id,term_id,user_id,earned,eligible,posted_by,full_credit_at)
    select p_course,p_term,id,earned,eligible,p_actor,80 from jsonb_to_recordset(calculated) as g(id uuid,earned int,eligible int)
    on conflict(course_id,term_id,user_id) do update set earned=excluded.earned,eligible=excluded.eligible,posted_at=now(),posted_by=excluded.posted_by,full_credit_at=80
      where (attendance_term_grades.earned,attendance_term_grades.eligible,attendance_term_grades.full_credit_at) is distinct from (excluded.earned,excluded.eligible,80);
end $$;
