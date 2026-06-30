-- Per-section completion for the lesson reading screen.
--
-- The reader's section rail / segmented bar / "Got it" checkpoints persist which
-- sections a student has completed. This was client-only (localStorage); this
-- table makes it follow the student across devices. One row per (user, lesson)
-- holding the completed section indices as a JSONB array of integers.
--
-- Types + RLS mirror block_responses (user_id TEXT = google user id, lesson_id
-- UUID → lessons.id). Writes go through the service role (RLS bypassed); the
-- policies exist so any future direct client access stays correctly scoped.

CREATE TABLE IF NOT EXISTS public.lesson_section_progress (
  user_id TEXT NOT NULL,
  user_email TEXT,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_section_progress_user_lesson
  ON public.lesson_section_progress(user_id, lesson_id);

ALTER TABLE public.lesson_section_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students manage own section progress" ON public.lesson_section_progress;
CREATE POLICY "Students manage own section progress"
  ON public.lesson_section_progress FOR ALL
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Staff view all section progress" ON public.lesson_section_progress;
CREATE POLICY "Staff view all section progress"
  ON public.lesson_section_progress FOR SELECT
  USING (auth.jwt() ->> 'email' IN (
    SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
    UNION
    SELECT unnest(string_to_array(current_setting('app.teacher_emails', true), ','))
  ));

COMMENT ON TABLE public.lesson_section_progress IS 'Per-(user,lesson) completed section indices for the lesson reading rail / checkpoints.';
