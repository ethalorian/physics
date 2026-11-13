-- Only an explicitly recorded teacher completion can satisfy an unanswered prerequisite.
create table public.daily_lesson_teacher_completions (
  submission_id uuid primary key references public.interactive_assignment_submissions(id) on delete cascade,
  recorded_by text not null check (btrim(recorded_by) <> ''),
  recorded_at timestamptz not null default now()
);

alter table public.daily_lesson_teacher_completions enable row level security;
revoke all on table public.daily_lesson_teacher_completions from public, anon, authenticated, service_role;
grant select on table public.daily_lesson_teacher_completions to service_role;

create or replace function public.daily_lesson_missing(p_quizzes uuid[], p_user uuid)
returns jsonb
language sql stable security invoker
set search_path = public, pg_temp
as $$
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
$$;
