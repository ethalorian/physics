-- Structured content blocks on lessons + append-only student responses to capture blocks.
-- See src/data/content-blocks.ts (block type system) and the content-block architecture doc.

ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS content_blocks JSONB;

CREATE TABLE IF NOT EXISTS public.block_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_email TEXT,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  block_id TEXT NOT NULL,
  block_type TEXT,
  response JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_block_responses_user_lesson ON public.block_responses(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_block_responses_lesson_block ON public.block_responses(lesson_id, block_id);
CREATE INDEX IF NOT EXISTS idx_block_responses_created ON public.block_responses(created_at);

ALTER TABLE public.block_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students manage own block responses" ON public.block_responses;
CREATE POLICY "Students manage own block responses"
  ON public.block_responses FOR ALL
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Staff view all block responses" ON public.block_responses;
CREATE POLICY "Staff view all block responses"
  ON public.block_responses FOR SELECT
  USING (auth.jwt() ->> 'email' IN (
    SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
    UNION
    SELECT unnest(string_to_array(current_setting('app.teacher_emails', true), ','))
  ));

COMMENT ON COLUMN public.lessons.content_blocks IS 'Structured content-block document (BlockDocument). See src/data/content-blocks.ts.';
COMMENT ON TABLE public.block_responses IS 'Append-only student responses to capture blocks (gewa, exit_ticket, marzano, doodle, etc.).';
