-- Course decisions are separate from submission, score, and feedback records.
create table public.classroom_homework_waivers (
  course_id uuid not null references public.courses(id) on delete cascade,
  work_key text not null check (work_key ~ '^(interactive|lesson|reading|vocabulary|worksheet):[0-9a-f-]{36}$'),
  recorded_by text not null check (btrim(recorded_by) <> ''),
  recorded_at timestamptz not null default now(),
  primary key (course_id, work_key)
);
alter table public.classroom_homework_waivers enable row level security;
revoke all on public.classroom_homework_waivers from public, anon, authenticated, service_role;
grant select on public.classroom_homework_waivers to service_role;

CREATE OR REPLACE FUNCTION public.daily_lesson_missing(p_quizzes uuid[], p_user uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select coalesce(jsonb_agg(jsonb_build_object(
    'quiz_id', sequence.quiz_id, 'id', assignment.id, 'title', template.title, 'role', step.role
  ) order by sequence.quiz_id, step.role), '[]'::jsonb)
  from daily_lesson_sequences sequence
  join daily_lesson_templates lesson on lesson.key = sequence.sequence_key
  cross join lateral (values
    (sequence.foundation_id, lesson.foundation_questions, 'foundation'),
    (sequence.review_id, lesson.review_questions, 'review')
  ) step(id, questions, role)
  join interactive_assignments assignment on assignment.id = step.id and assignment.course_id = sequence.course_id
  join interactive_assignment_templates template on template.slug = assignment.slug
  where sequence.quiz_id = any(p_quizzes)
    and not exists (select from public.classroom_homework_waivers w
      join public.course_students cs on cs.course_id=w.course_id and cs.student_id=p_user and cs.enrollment_state='ACTIVE'
      where w.course_id=sequence.course_id and w.work_key='interactive:'||assignment.id)
    and not exists (
      select 1
      from interactive_assignment_submissions submission
      where submission.assignment_id = assignment.id and submission.user_id = p_user
        and (
          exists (
            select 1 from daily_lesson_teacher_completions credit
            where credit.submission_id = submission.id
          )
          or (
            jsonb_typeof(submission.state->'answers') = 'object'
            and cardinality(step.questions) > 0
            and not exists (
              select 1 from unnest(case when step.role = 'foundation'
                then public.foundation_required_question_ids(assignment.slug, submission.state, step.questions)
                else step.questions end) as required(question_id)
              where jsonb_typeof(submission.state->'answers'->required.question_id) is distinct from 'string'
                 or coalesce(btrim(submission.state->'answers'->>required.question_id), '') = ''
            )
          )
        )
    );
$function$;

CREATE OR REPLACE FUNCTION public.mastery_xp_work(p_course uuid, p_user uuid)
 RETURNS TABLE(work_key text, unit_id text, title text, href text, submitted_at timestamp with time zone)
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
 with roster as (
 select c.track,cs.enrolled_at from public.course_students cs join public.courses c on c.id=cs.course_id join public.students st on st.id=cs.student_id
 where c.id=p_course and cs.student_id=p_user and cs.enrollment_state='ACTIVE' and st.is_active is not false and c.archived_at is null and c.program='physics'
 ), items as (
 select 'interactive:'||a.id work_key,cat.unit_id,cat.title,'/interactive-assignments/'||a.id href,
 (select min(s.submitted_at) from public.interactive_assignment_submissions s where s.assignment_id=a.id and s.user_id=p_user) submitted_at
 from public.interactive_assignments a join public.mastery_xp_interactive_catalog cat on cat.slug=a.slug
 where a.course_id=p_course and a.due_on is not null
 union all
 select 'reading:'||a.id,t.unit_id,a.title,'/readings/'||a.id,
 (select min(s.submitted_at) from public.textbook_submissions s where s.assignment_id=a.id and s.user_id=p_user)
 from public.textbook_assignments a cross join lateral (
 select t.unit_id from jsonb_array_elements(a.questions) with ordinality q(question,seq) join public.learning_targets t on t.id::text=q.question->>'target_id' where t.program='physics' and t.unit_id is not null order by q.seq limit 1
 ) t where a.course_id=p_course and a.status='published' and a.due_at is not null and (a.opens_at is null or a.opens_at<=now())
 and not exists(select from public.textbook_reading_exemptions e where e.assignment_id=a.id and e.user_id=p_user)
 union all
 select 'vocabulary:'||v.id,t.unit_id,v.title,'/vocabulary/work?task_id='||v.id,
 (select min(s.completed_at) from public.vocab_checks s where s.task_id=v.id and s.user_id=p_user and s.completed_at is not null
 and case when jsonb_typeof(s.result)='array' and jsonb_typeof(s.items)='array' then jsonb_array_length(s.result)>0 and jsonb_array_length(s.result)=jsonb_array_length(s.items) else false end)
 from public.vocab_tasks v join public.learning_targets t on t.id=v.target_id where v.course_id=p_course and p_user=any(v.student_ids)
 and v.active and not coalesce(v.syllabus_draft,false) and v.due_on is not null and v.task_kind='practice' and v.quiz_format is distinct from 'checkpoint'
 union all
 select 'lesson:'||l.id,l.unit_id,l.title,'/lessons/'||l.slug,
 (select min(s.submitted_at) from public.lesson_submissions s where s.lesson_id=l.id and s.user_id=p_user and s.submitted_at>=greatest(coalesce(w.open_at,'-infinity'::timestamptz),coalesce(r.enrolled_at,'-infinity'::timestamptz)))
 from public.lessons l join public.lesson_class_windows w on w.lesson_id=l.id::text and w.course_id=p_course::text cross join roster r
 where w.due_at is not null and (w.open_at is null or w.open_at<=now()) and l.published and not public.mastery_xp_graded_lesson(l) and l.unit_id ~ '^unit-[1-8]$'
 and (nullif(l.visibility_track,'') is null or l.visibility_track=coalesce(r.track,'cpa'))
 and (l.content_blocks#>>'{reflection,kind}' in ('manga','story','graphic-novel') or
 (l.content_blocks->>'presentation'='physics-path' and l.content_blocks#>>'{learningPath,kind}' in ('lesson','review','practice')))
 -- Unscoped lesson submissions must not fund two classes.
 and not exists(select from public.lesson_class_windows w2 join public.course_students cs on cs.course_id::text=w2.course_id and cs.student_id=p_user and cs.enrollment_state='ACTIVE' where w2.lesson_id=w.lesson_id and w2.course_id<>w.course_id and w2.due_at is not null)
 union all
 select 'presentation:'||p.id,t.unit_id,coalesce(nullif(p.prompt,''),'Classroom response'),'/home?view=week',
 (select min(s.created_at) from public.present_ticket_responses s where s.pulse_id=p.id and s.user_id=p_user and nullif(trim(s.response),'') is not null)
 from public.present_pulses p join public.present_sessions session on session.id=p.session_id join public.learning_targets t on t.id=p.target_id cross join roster r
 where session.course_id=p_course and not exists(select from public.lessons l where l.id=session.lesson_id and public.mastery_xp_graded_lesson(l)) and p.required and not p.anonymous and p.kind in ('warmup','solo','exit_ticket') and (r.enrolled_at is null or p.created_at>=r.enrolled_at)
 union all
 select 'mission:'||a.id,a.xp_unit_id,a.title,'/arcade/missions',
 (select min(s.completed_at) from public.math_mission_sessions s where s.assignment_id=a.id and s.user_id=p_user and s.status='completed' and not s.staff)
 from public.math_mission_assignments a where a.xp_course_id=p_course and a.user_id=p_user and a.cancelled_at is null and a.due_at is not null
 ), graded_choice_steps as (
 select step->>'kind'||':'||(step->>'sourceId') k from public.choice_sections sec cross join lateral jsonb_array_elements(sec.options) opt cross join lateral jsonb_array_elements(opt->'steps') step
 where sec.course_id=p_course and sec.published and sec.points_per_choice>0 and not coalesce((step->>'followUp')::boolean,false)
 )
 select i.* from items i where exists(select from roster) and i.unit_id is not null
 and (i.submitted_at is not null or not exists (select from public.classroom_homework_waivers w where w.course_id=p_course and w.work_key=i.work_key)) and not exists(select from graded_choice_steps g where g.k=i.work_key)
$function$;

CREATE OR REPLACE FUNCTION public.guard_reading_quiz_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
 if exists(select 1 from public.reading_syllabus_bundles b join public.textbook_assignments a on a.id=b.reading_id
   where b.reading_quiz_id=new.quiz_id and a.status<>'archived'
   and not exists(select from public.classroom_homework_waivers w where w.course_id=a.course_id and w.work_key='reading:'||a.id)
   and not exists(select 1 from public.textbook_reading_exemptions e where e.assignment_id=b.reading_id and e.user_id=new.user_id)
   and not exists(select 1 from public.textbook_submissions s where s.assignment_id=b.reading_id and s.user_id=new.user_id)) then
   raise exception 'Complete and submit the reading assignment before starting its quiz.';
 end if;
 return new;
end $function$;
