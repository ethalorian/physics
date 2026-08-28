-- Fix /api/student-activity 500s (APPLIED live 2026-08-28, as two migrations:
-- record_lesson_view_session_duration_overload + record_lesson_view_uuid_casts).
--
-- Cause: the deployed route calls record_lesson_view with
--   (p_user_id, p_user_email, p_user_name, p_lesson_id, p_session_duration)
-- but only a (..., p_lesson_slug) signature existed. PostgREST matches RPCs by
-- named arguments, so every call returned not-found and the route 500'd.
-- The old signature also had a latent type bug: lesson_progress.user_id is
-- UUID while the function inserted TEXT — it would have failed at runtime too.
--
-- This overload matches the code as deployed, casts to uuid explicitly, upserts
-- lesson_progress (never downgrading status), and logs the student_activity row
-- the old RPC path silently dropped. The p_lesson_slug version is left in place;
-- callers must always pass p_session_duration (even null) so the overload
-- resolves unambiguously — the deployed route always does.

CREATE OR REPLACE FUNCTION public.record_lesson_view(
  p_user_id TEXT,
  p_user_email TEXT,
  p_user_name TEXT,
  p_lesson_id UUID,
  p_session_duration INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  progress_id UUID;
BEGIN
  INSERT INTO public.lesson_progress (
    user_id, user_email, lesson_id, status, started_at, last_accessed_at, updated_at
  ) VALUES (
    p_user_id::uuid, p_user_email, p_lesson_id, 'in_progress', NOW(), NOW(), NOW()
  )
  ON CONFLICT (user_id, lesson_id)
  DO UPDATE SET
    last_accessed_at = NOW(),
    updated_at = NOW(),
    status = CASE
      WHEN public.lesson_progress.status = 'not_started' THEN 'in_progress'
      ELSE public.lesson_progress.status
    END
  RETURNING id INTO progress_id;

  INSERT INTO public.student_activity (
    user_id, user_email, user_name, activity_type, lesson_id, session_duration, page_views
  ) VALUES (
    p_user_id::uuid, p_user_email, p_user_name, 'lesson_view', p_lesson_id, p_session_duration, 1
  );

  RETURN progress_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_lesson_view(TEXT, TEXT, TEXT, UUID, INTEGER) FROM PUBLIC, anon, authenticated;
COMMENT ON FUNCTION public.record_lesson_view(TEXT, TEXT, TEXT, UUID, INTEGER) IS
  'Lesson-view recording matching /api/student-activity''s call shape: upserts lesson_progress (never downgrades status) and logs the student_activity row.';
