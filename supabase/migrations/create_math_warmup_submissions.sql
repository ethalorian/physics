-- ============================================================================
-- MATH-LITERACY SPINE — WARM-UP SUBMISSIONS (warm-up as evidence)
-- ============================================================================
-- Additive migration. Graduates the daily warm-up from low-stakes practice into
-- the EVIDENCE the teacher rates: a student submits an answer, it lands in the
-- control-room review queue, and the teacher reads it and assigns a Marzano
-- fluency level from the rating drawer. Rating the submission writes a normal
-- math_competency_record (evidence_source = 'warm-up') and resolves the row.
--
-- SAFE BY DESIGN: additive only; mirrors the RLS pattern of the other spine
-- migrations. Students may submit and read their own; staff manage all.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.math_warmup_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_email TEXT,
  competency_id UUID NOT NULL REFERENCES public.math_competencies(id) ON DELETE CASCADE,
  spiral_item_id UUID REFERENCES public.math_spiral_items(id) ON DELETE SET NULL,
  prompt TEXT,                                -- snapshot of the prompt shown
  response TEXT NOT NULL,                     -- the student's answer (the evidence)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','dismissed')),
  resulting_level SMALLINT CHECK (resulting_level IN (1,2,3)), -- the rating the teacher gave
  reviewed_by TEXT,                           -- staff email who rated it
  reviewed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_math_warmup_user ON public.math_warmup_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_math_warmup_competency ON public.math_warmup_submissions(competency_id);
CREATE INDEX IF NOT EXISTS idx_math_warmup_status ON public.math_warmup_submissions(status);
CREATE INDEX IF NOT EXISTS idx_math_warmup_submitted ON public.math_warmup_submissions(submitted_at);

ALTER TABLE public.math_warmup_submissions ENABLE ROW LEVEL SECURITY;

-- Students may submit and read their OWN work; staff manage all.
DROP POLICY IF EXISTS "Students insert own warmups" ON public.math_warmup_submissions;
CREATE POLICY "Students insert own warmups"
  ON public.math_warmup_submissions FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Students view own warmups" ON public.math_warmup_submissions;
CREATE POLICY "Students view own warmups"
  ON public.math_warmup_submissions FOR SELECT
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Staff manage all warmups" ON public.math_warmup_submissions;
CREATE POLICY "Staff manage all warmups"
  ON public.math_warmup_submissions FOR ALL
  USING (auth.jwt() ->> 'email' IN (
    SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
    UNION SELECT unnest(string_to_array(current_setting('app.teacher_emails', true), ','))
  ));

COMMENT ON TABLE public.math_warmup_submissions IS 'Student-submitted daily warm-up answers — the evidence a teacher rates in the control-room drawer. Rating one writes a math_competency_record (evidence_source=warm-up) and sets status=reviewed.';
