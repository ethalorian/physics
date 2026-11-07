-- Keep just the date and source of a substantive save. A draft may be edited on
-- several days, or deleted on submission, without losing earlier participation.
create table public.attendance_work_days (
  course_id uuid not null references public.courses(id),
  user_id uuid not null references public.students(id),
  meeting_day date not null, at_time timestamptz not null, source text not null,
  primary key (course_id, meeting_day, user_id)
);
alter table public.attendance_work_days enable row level security;
revoke all on public.attendance_work_days from public, anon, authenticated;
grant select, insert on public.attendance_work_days to service_role;

-- Only learner-entered fields pass this projection. Empty strings, panels,
-- drawing modes, answer checks and default slider positions carry no credit.
create function public.attendance_clean_answer(v jsonb) returns jsonb
language plpgsql immutable strict security invoker set search_path='' as $$
declare result jsonb;
begin
  case jsonb_typeof(v)
    when 'object' then
      with fields as materialized (
        select key,case when key in ('strokes','modelStrokes') and jsonb_typeof(value)='array' then
          (select jsonb_agg(stroke order by n) from jsonb_array_elements(value) with ordinality s(stroke,n)
           where stroke->'points'->0->'x' is not null or stroke->>'text' ~ '[^[:space:]]')
          else public.attendance_clean_answer(value) end clean from jsonb_each(v)
        where key not in ('mode','format','version','autoCheck','checks','correct')
      ) select jsonb_object_agg(key,clean) into result from fields where clean is not null;
    when 'array' then
      with items as materialized (
        select n,public.attendance_clean_answer(value) clean from jsonb_array_elements(v) with ordinality elt(value,n)
      ) select jsonb_agg(clean order by n) into result from items where clean is not null;
    when 'string' then
      if (v #>> '{}') ~ '[^[:space:]]' then result:=to_jsonb(regexp_replace(v #>> '{}','^[[:space:]]+|[[:space:]]+$','','g')); end if;
    when 'number' then result:=v;
    when 'boolean' then result:=v;
    else result:=null;
  end case;
  return result;
end $$;

create function public.attendance_draft_answer(kind text,r jsonb) returns jsonb
language plpgsql immutable security invoker set search_path='' as $$
declare payload jsonb; state jsonb:=r->'state'; response jsonb:=r->'response';
begin
  if kind in ('quiz_work','textbook_work','vocab_checkpoint_attempts') then payload:=r->'answers';
  elsif kind='review_module_work' then
    payload:=jsonb_build_array(state->'responses',state->'num',state->'ans');
  elsif kind='interactive_assignment_work' then
    payload:=jsonb_build_array(state->'answers',state->'attempts',
      (select jsonb_object_agg(key,value) from jsonb_each(coalesce(nullif(state->'explorers','null'), '{}')) where key like 'observations-%'));
  elsif kind in ('block_drafts','block_responses') then
    if jsonb_typeof(response) <> 'object' or r->>'block_type'='self_assessment' then payload:=response;
    else
      select jsonb_object_agg(key,value) into payload from jsonb_each(response) where key in (
        'text','optionId','explain','responses','answers','pattern','interpret','strokes','attachmentId','fields','rows','lines',
        'given','equation','work','answer','modelStrokes','reading','fix','prediction','reasoning','rating','level','notes');
    end if;
  end if;
  return public.attendance_clean_answer(payload);
end $$;

-- A legacy lesson or review module can belong to more than one section.
-- Only accept these sources when they identify one enrolled course.
create function public.attendance_draft_course(kind text,r jsonb,stamp timestamptz) returns uuid
language sql stable security invoker set search_path='' as $$
  with candidates as (
    select course_id from public.quiz_assignments where kind='quiz_work' and id=(r->>'quiz_id')::uuid
    union all select course_id from public.textbook_assignments where kind='textbook_work' and id=(r->>'assignment_id')::uuid
    union all select course_id from public.interactive_assignments where kind='interactive_assignment_work' and id=(r->>'assignment_id')::uuid
    union all select course_id from public.vocab_tasks where kind='vocab_checkpoint_attempts' and id=(r->>'task_id')::uuid
    union all select unnest(course_ids) from public.review_module_assignments where kind='review_module_work' and slug=r->>'module_slug'
    union all select c.id from public.lesson_class_windows w join public.courses c on c.id::text=w.course_id
      where kind in ('block_drafts','block_responses') and lesson_id=r->>'lesson_id'
        and (open_at is null or open_at<=stamp) and (close_at is null or close_at>=stamp)
        and r->>'present_session_id' is null
    union all select course_id from public.present_sessions where kind='block_responses' and id=(r->>'present_session_id')::uuid
  )
  select (array_agg(distinct c.course_id))[1] from candidates c join public.course_students cs on cs.course_id=c.course_id
    and cs.student_id=(r->>'user_id')::uuid and cs.enrollment_state='ACTIVE'
    and (cs.enrolled_at is null or (cs.enrolled_at at time zone 'America/New_York')::date <= (stamp at time zone 'America/New_York')::date)
  having count(distinct c.course_id)=1;
$$;

create function public.remember_attendance_work(kind text,r jsonb,previous jsonb,stamp timestamptz) returns void
language plpgsql security invoker set search_path='' as $$
declare answer jsonb; course uuid; source text;
begin
  if stamp is null then return; end if;
  course:=public.attendance_draft_course(kind,r,stamp);
  if course is null or not exists(select from public.courses where id=course and program='physics') then return; end if;
  if exists(select from public.attendance_work_days where course_id=course and user_id=(r->>'user_id')::uuid
    and meeting_day=(stamp at time zone 'America/New_York')::date) then return; end if;
  answer:=public.attendance_draft_answer(kind,r);
  if answer is null or answer is not distinct from public.attendance_draft_answer(kind,previous) then return; end if;
  source:=case kind when 'quiz_work' then 'Saved quiz response' when 'textbook_work' then 'Saved reading response'
    when 'interactive_assignment_work' then 'Saved activity response' when 'block_drafts' then 'Saved lesson draft'
    when 'block_responses' then 'Saved lesson response' when 'review_module_work' then 'Saved review response'
    when 'vocab_checkpoint_attempts' then 'Saved vocabulary response' end;
  insert into public.attendance_work_days(course_id,user_id,meeting_day,at_time,source)
  values(course,(r->>'user_id')::uuid,(stamp at time zone 'America/New_York')::date,stamp,source)
  on conflict (course_id,meeting_day,user_id) do nothing;
end $$;

create function public.capture_attendance_work() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  -- Browser-direct legacy lesson writes must not gain access to the private
  -- credit ledger. The authenticated lesson editor saves via the server.
  if current_user in ('anon','authenticated') then return new; end if;
  perform public.remember_attendance_work(tg_table_name,to_jsonb(new),
    case when tg_op='UPDATE' and not (
      tg_table_name in ('review_module_work','vocab_checkpoint_attempts') and to_jsonb(new)->>'submitted_at' is not null
      and (to_jsonb(new)->>'submitted_at') is distinct from (to_jsonb(old)->>'submitted_at')
    ) then to_jsonb(old) end,statement_timestamp());
  return new;
end $$;

-- For old mutable work, only use timestamps still attributable to student saves.
-- Teacher grading/returning work can update a row's timestamp without a new answer.
do $$
declare spec record; r record;
begin
  for spec in select * from (values
    ('quiz_work','answers','updated_at','state=''in_progress'' and submission_id is null'),
    ('textbook_work','answers','updated_at','state=''in_progress'' and submission_id is null'),
    ('interactive_assignment_work','state','updated_at','status=''draft'' and not exists(select from public.interactive_assignment_submissions s where s.assignment_id=w.assignment_id and s.user_id=w.user_id)'),
    ('review_module_work','state','coalesce(submitted_at,updated_at)','true'),
    ('block_drafts','response','updated_at','true'),
    ('block_responses','response','created_at','true'),
    ('vocab_checkpoint_attempts','answers','submitted_at','submitted_at is not null')
  ) s(name,col,stamp,eligible) loop
    execute format('create trigger attendance_capture after insert or update of %I on public.%I for each row execute function public.capture_attendance_work()',spec.col,spec.name);
    for r in execute format('select to_jsonb(w) as work, %s as stamp from public.%I w where %s',spec.stamp,spec.name,spec.eligible) loop
      perform public.remember_attendance_work(spec.name,r.work,null,r.stamp);
    end loop;
  end loop;
end $$;

-- All consumers use the same effective marks. Explicit teacher marks win,
-- including absences and excusals. A derived mark has revision 0 so a teacher
-- can replace it using the existing optimistic save path.
create function public.attendance_effective_marks(p_course uuid,p_days date[],p_from date,p_to date,p_user uuid default null)
returns table(user_id uuid,meeting_day date,mark text,made_up boolean,revision integer,source text,at_time timestamptz)
language sql stable security invoker set search_path='' as $$
  with days as materialized (
    select distinct d from unnest(p_days) as days(d) where d between p_from and least(p_to,(now() at time zone 'America/New_York')::date)
  ), bounds as (
    select min(d)::timestamp at time zone 'America/New_York' lo,
           (max(d)+1)::timestamp at time zone 'America/New_York' hi from days
  ), submissions as (
    select r.user_id,r.created_at stamp,'Live classroom response' source
    from public.present_ticket_responses r join public.present_pulses p on p.id=r.pulse_id
    join public.present_sessions s on s.id=p.session_id, bounds
    where s.course_id=p_course and not p.anonymous and r.created_at>=lo and r.created_at<hi and r.response ~ '[^[:space:]]'
    union all select s.user_id,s.submitted_at,'Submitted activity · '||replace(a.slug,'-',' ')
    from public.interactive_assignment_submissions s join public.interactive_assignments a on a.id=s.assignment_id, bounds
    where a.course_id=p_course and s.submitted_at>=lo and s.submitted_at<hi
      and public.attendance_draft_answer('interactive_assignment_work',jsonb_build_object('state',s.state)) is not null
    union all select s.user_id,s.submitted_at,'Submitted quiz'
    from public.quiz_submissions s join public.quiz_assignments a on a.id=s.quiz_id, bounds
    where a.course_id=p_course and s.submitted_at>=lo and s.submitted_at<hi and public.attendance_clean_answer(s.answers) is not null
    union all select s.user_id,s.submitted_at,'Submitted reading'
    from public.textbook_submissions s join public.textbook_assignments a on a.id=s.assignment_id, bounds
    where a.course_id=p_course and s.submitted_at>=lo and s.submitted_at<hi and public.attendance_clean_answer(s.answers) is not null
    union all select s.user_id,s.completed_at,'Completed math mission'
    from public.math_mission_sessions s join public.math_mission_assignments a on a.id=s.assignment_id, bounds
    where a.xp_course_id=p_course and a.user_id=s.user_id and s.status='completed' and not s.staff and s.completed_at>=lo and s.completed_at<hi
    union all select s.user_id,s.submitted_at,'Submitted lesson'
    from public.lesson_submissions s, bounds
    where s.submitted_at>=lo and s.submitted_at<hi
      and public.attendance_draft_course('block_drafts',jsonb_build_object('user_id',s.user_id,'lesson_id',s.lesson_id),s.submitted_at)=p_course
      and exists(select from jsonb_array_elements(case when jsonb_typeof(s.response_snapshot)='array' then s.response_snapshot else '[]' end) answer
        where public.attendance_draft_answer('block_responses',answer) is not null)
  ), work as (
    select s.user_id,d.d as day,s.source,s.stamp as at_time from submissions s join days d on d.d=(s.stamp at time zone 'America/New_York')::date
    union all select w.user_id,w.meeting_day,w.source,w.at_time from public.attendance_work_days w join days d on d.d=w.meeting_day where w.course_id=p_course
    union all select f.user_id,(x.at_time at time zone 'America/New_York')::date,'Foundation discussion',x.at_time
      from public.foundation_checkpoint_responses f join public.interactive_assignments a on a.id=f.assignment_id
      cross join lateral (values (f.contributed_at,f.contribution),(f.replied_at,f.reply),(f.reflected_at,f.reflection)) x(at_time,answer)
      join days d on d.d=(x.at_time at time zone 'America/New_York')::date
      where a.course_id=p_course and x.answer ~ '[^[:space:]]'
    union all select v.user_id,d.d,'Vocabulary practice',v.completed_at from public.vocab_checks v
      join public.vocab_tasks t on t.id=v.task_id join days d on d.d=(v.completed_at at time zone 'America/New_York')::date where t.course_id=p_course
  ), picked as (
    select distinct on (w.user_id,w.day) w.user_id,w.day,w.source,w.at_time
    from work w join public.course_students cs on cs.course_id=p_course and cs.student_id=w.user_id and cs.enrollment_state='ACTIVE'
    where (p_user is null or w.user_id=p_user) and (cs.enrolled_at is null or (cs.enrolled_at at time zone 'America/New_York')::date<=w.day)
    order by w.user_id,w.day,w.at_time,w.source
  ), manual as (
    select * from public.attendance_marks m where m.course_id=p_course and m.meeting_day between p_from and p_to and (p_user is null or m.user_id=p_user)
  )
  select m.user_id,m.meeting_day,m.mark,m.made_up,m.revision,p.source,p.at_time from manual m left join picked p on p.user_id=m.user_id and p.day=m.meeting_day
  union all select p.user_id,p.day,'participated',false,0,p.source,p.at_time from picked p where not exists (
    select from manual m where m.user_id=p.user_id and m.meeting_day=p.day);
$$;

-- Keep the grading rule that was actually posted. Old snapshots use 100%.
alter table public.attendance_term_grades add column full_credit_at integer not null default 100 check(full_credit_at in(80,100));
create function public.post_automatic_attendance_term(p_course uuid,p_term text,p_days date[],p_preview jsonb,p_actor text)
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
    left join public.attendance_effective_marks(p_course,p_days,(t->>'start')::date,(t->>'end')::date) m on m.user_id=cs.student_id
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
revoke all on function public.attendance_clean_answer(jsonb),public.attendance_draft_answer(text,jsonb),public.attendance_draft_course(text,jsonb,timestamptz),
 public.remember_attendance_work(text,jsonb,jsonb,timestamptz),public.capture_attendance_work(),public.attendance_effective_marks(uuid,date[],date,date,uuid),
 public.post_automatic_attendance_term(uuid,text,date[],jsonb,text) from public,anon,authenticated;
grant execute on function public.attendance_clean_answer(jsonb),public.attendance_draft_answer(text,jsonb),public.attendance_draft_course(text,jsonb,timestamptz),
 public.remember_attendance_work(text,jsonb,jsonb,timestamptz),public.capture_attendance_work(),public.attendance_effective_marks(uuid,date[],date,date,uuid),
 public.post_automatic_attendance_term(uuid,text,date[],jsonb,text) to service_role;
