-- Confirmed meetings are evidence. A post copies the term counts into a separate
-- snapshot so subsequent meeting edits cannot change a published grade.
create table public.attendance_marks (
  course_id uuid not null references public.courses, user_id uuid not null references public.students,
  meeting_day date not null, mark text not null check (mark in ('participated','absent','present','excused')),
  made_up boolean not null default false check (not made_up or mark in ('absent','present')),
  revision integer not null default 1, confirmed_by text not null,
  primary key(course_id,user_id,meeting_day)
);
create table public.attendance_term_grades (
  course_id uuid not null references public.courses, term_id text not null, user_id uuid not null references public.students,
  earned integer not null, eligible integer not null check (eligible>=0 and earned between 0 and eligible),
  posted_at timestamptz not null default now(), posted_by text not null,
  primary key(course_id,term_id,user_id)
);
alter table public.attendance_marks enable row level security;
alter table public.attendance_term_grades enable row level security;
revoke all on public.attendance_marks, public.attendance_term_grades from public, anon, authenticated, service_role;
grant select, insert, update on public.attendance_marks, public.attendance_term_grades to service_role;

-- Same-day submissions suggest participation. The teacher verifies in-class presence.
create function public.attendance_evidence(p_course uuid,p_day date)
returns table(user_id uuid, source text, at_time timestamptz) language sql stable security invoker set search_path='' as $$
  with bounds as (select p_day::timestamp at time zone 'America/New_York' lo,
                         (p_day+1)::timestamp at time zone 'America/New_York' hi),
  events as (
    select r.user_id,'Live classroom response' as source,r.created_at as at_time
    from public.present_ticket_responses r join public.present_pulses p on p.id=r.pulse_id
    join public.present_sessions s on s.id=p.session_id, bounds
    where s.course_id=p_course and not p.anonymous and r.created_at>=lo and r.created_at<hi and trim(r.response)<>''
    union all
    select s.user_id,'Interactive assignment · '||replace(a.slug,'-',' '),s.submitted_at from public.interactive_assignment_submissions s
    join public.interactive_assignments a on a.id=s.assignment_id, bounds
    where a.course_id=p_course and s.submitted_at>=lo and s.submitted_at<hi
    union all
    select s.user_id,a.title,s.submitted_at from public.quiz_submissions s join public.quiz_assignments a on a.id=s.quiz_id, bounds
    where a.course_id=p_course and s.submitted_at>=lo and s.submitted_at<hi and s.answers<>'{}'::jsonb
    union all
    select s.user_id,a.title,s.submitted_at from public.textbook_submissions s join public.textbook_assignments a on a.id=s.assignment_id, bounds
    where a.course_id=p_course and s.submitted_at>=lo and s.submitted_at<hi and s.answers<>'{}'::jsonb
    union all
    select s.user_id,l.title,s.submitted_at from public.lesson_submissions s
    join public.lessons l on l.id=s.lesson_id join public.lesson_class_windows w on w.lesson_id=l.id::text, bounds
    where w.course_id=p_course::text and s.submitted_at>=lo and s.submitted_at<hi
      and (w.open_at is null or w.open_at<=s.submitted_at)
      and not exists(select from public.lesson_class_windows other join public.course_students cs
        on cs.course_id::text=other.course_id and cs.student_id=s.user_id and cs.enrollment_state='ACTIVE'
        where other.lesson_id=w.lesson_id and other.course_id<>w.course_id)
    union all
    select s.user_id,a.title,s.completed_at from public.math_mission_sessions s join public.math_mission_assignments a on a.id=s.assignment_id, bounds
    where a.xp_course_id=p_course and a.user_id=s.user_id and s.status='completed' and not s.staff and s.completed_at>=lo and s.completed_at<hi
  )
  select distinct on (e.user_id) e.user_id,e.source,e.at_time from events e
  join public.course_students cs on cs.course_id=p_course and cs.student_id=e.user_id and cs.enrollment_state='ACTIVE'
  order by e.user_id,e.at_time,e.source;
$$;

create function public.save_attendance_meeting(p_course uuid,p_term text,p_day date,p_marks jsonb,p_actor text)
returns void language plpgsql security invoker set search_path='' as $$
declare r record; prior public.attendance_marks; settings jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended('attendance:'||p_course,0));
  select terms into settings from public.course_grading_settings where course_id=p_course for share;
  if p_day>(now() at time zone 'America/New_York')::date or not exists(
    select from jsonb_array_elements(settings) t where t->>'id'=p_term and p_day between (t->>'start')::date and (t->>'end')::date)
  then raise exception 'This date is outside the selected grading term.'; end if;
  for r in select * from jsonb_to_recordset(p_marks) as x(id uuid,mark text,made_up boolean,revision integer) loop
    if not exists (select from public.course_students cs join public.students st on st.id=cs.student_id
      where cs.course_id=p_course and cs.student_id=r.id and cs.enrollment_state='ACTIVE' and st.is_active is not false
      and (cs.enrolled_at is null or (cs.enrolled_at at time zone 'America/New_York')::date<=p_day))
    then raise exception 'The roster has changed. Refresh this meeting.'; end if;
    select * into prior from public.attendance_marks where course_id=p_course and user_id=r.id and meeting_day=p_day;
    if coalesce(prior.revision,0) is distinct from r.revision then
      if prior.mark=r.mark and prior.made_up=r.made_up then continue; end if;
      raise exception 'This meeting changed in another window. Refresh to review it.';
    end if;
    if r.made_up and (prior.mark is distinct from r.mark or r.mark not in ('absent','present'))
    then raise exception 'Confirm the original missed meeting before crediting a make-up.'; end if;
    insert into public.attendance_marks(course_id,user_id,meeting_day,mark,made_up,confirmed_by)
    values(p_course,r.id,p_day,r.mark,r.made_up,p_actor)
    on conflict(course_id,user_id,meeting_day) do update set mark=excluded.mark,made_up=excluded.made_up,
      confirmed_by=excluded.confirmed_by,revision=attendance_marks.revision+1;
  end loop;
end $$;

create function public.post_attendance_term(p_course uuid,p_term text,p_preview jsonb,p_actor text)
returns void language plpgsql security invoker set search_path='' as $$
declare t jsonb; calculated jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended('attendance:'||p_course,0));
  select term into t from public.course_grading_settings s cross join lateral jsonb_array_elements(s.terms) term
    where s.course_id=p_course and term->>'id'=p_term for share of s;
  if t is null or (t->>'end')::date >= (now() at time zone 'America/New_York')::date
  then raise exception 'Post attendance after the selected term ends.'; end if;
  select jsonb_agg(to_jsonb(roster) order by id) into calculated from (
    select cs.student_id id, count(m.mark) filter(where m.mark='participated' or m.made_up)::int earned,
      count(m.mark) filter(where m.mark<>'excused')::int eligible
    from public.course_students cs join public.students st on st.id=cs.student_id
    left join public.attendance_marks m on m.course_id=cs.course_id and m.user_id=cs.student_id
      and m.meeting_day between (t->>'start')::date and (t->>'end')::date
    where cs.course_id=p_course and cs.enrollment_state='ACTIVE' and st.is_active is not false group by cs.student_id
  ) roster;
  if calculated is null or calculated is distinct from p_preview then raise exception 'Term results changed. Refresh the preview before posting.'; end if;
  if not exists(select from jsonb_array_elements(calculated) g where (g->>'eligible')::int>0)
     and not exists(select from public.attendance_term_grades where course_id=p_course and term_id=p_term and eligible>0)
  then raise exception 'There are no eligible meetings to post.'; end if;
  insert into public.attendance_term_grades(course_id,term_id,user_id,earned,eligible,posted_by)
  select p_course,p_term,id,earned,eligible,p_actor from jsonb_to_recordset(calculated) as g(id uuid,earned int,eligible int)
  on conflict(course_id,term_id,user_id) do update set earned=excluded.earned,eligible=excluded.eligible,
    posted_at=now(),posted_by=excluded.posted_by where (attendance_term_grades.earned,attendance_term_grades.eligible) is distinct from (excluded.earned,excluded.eligible);
end $$;
revoke all on function public.attendance_evidence(uuid,date), public.save_attendance_meeting(uuid,text,date,jsonb,text),
  public.post_attendance_term(uuid,text,jsonb,text) from public, anon, authenticated;
grant execute on function public.attendance_evidence(uuid,date), public.save_attendance_meeting(uuid,text,date,jsonb,text),
  public.post_attendance_term(uuid,text,jsonb,text) to service_role;

-- A term ID owns its posted grades even if the teacher later renames the term.
create function public.keep_posted_attendance_terms() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if exists(select from public.attendance_term_grades g where g.course_id=new.course_id and g.eligible>0
    and not exists(select from jsonb_array_elements(new.terms) t where t->>'id'=g.term_id)) then
    raise exception 'A term with posted attendance grades cannot be removed.' using errcode='23503';
  end if;
  return new;
end $$;
revoke all on function public.keep_posted_attendance_terms() from public,anon,authenticated;
grant execute on function public.keep_posted_attendance_terms() to service_role;
create trigger preserve_attendance_term before update of terms on public.course_grading_settings
for each row when (old.terms is distinct from new.terms) execute function public.keep_posted_attendance_terms();
