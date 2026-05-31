-- ============================================================================
-- MATH WARM-UPS — MULTI-COMPETENCY TESTING
-- ============================================================================
-- A single warm-up can test more than one competency (e.g. an asteroid kinetic-
-- energy estimate tests BOTH order-of-magnitude estimation AND scientific
-- notation). This migration lets a warm-up item carry the set of competencies it
-- tests, captures that set on each submission, and tracks which have been rated
-- so the teacher rates ONLY the tested competencies — and the submission resolves
-- once they're all rated.
--
-- SAFE BY DESIGN: additive. The item's existing competency_id stays as the
-- "primary" (used to pick the daily warm-up for a student's weakest skill).
-- ============================================================================

-- Which competencies a warm-up item tests (primary + any extras).
CREATE TABLE IF NOT EXISTS public.math_spiral_item_competencies (
  spiral_item_id UUID NOT NULL REFERENCES public.math_spiral_items(id) ON DELETE CASCADE,
  competency_id UUID NOT NULL REFERENCES public.math_competencies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (spiral_item_id, competency_id)
);
CREATE INDEX IF NOT EXISTS idx_spiral_item_comp_competency ON public.math_spiral_item_competencies(competency_id);

ALTER TABLE public.math_spiral_item_competencies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view spiral item competencies" ON public.math_spiral_item_competencies;
CREATE POLICY "Anyone can view spiral item competencies"
  ON public.math_spiral_item_competencies FOR SELECT USING (true);
DROP POLICY IF EXISTS "Staff manage spiral item competencies" ON public.math_spiral_item_competencies;
CREATE POLICY "Staff manage spiral item competencies"
  ON public.math_spiral_item_competencies FOR ALL
  USING (auth.jwt() ->> 'email' IN (
    SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
    UNION SELECT unnest(string_to_array(current_setting('app.teacher_emails', true), ','))
  ));

-- A submission remembers which competencies it is evidence for, and which the
-- teacher has rated so far. status flips to 'reviewed' when rated ⊇ tested.
ALTER TABLE public.math_warmup_submissions
  ADD COLUMN IF NOT EXISTS tested_competency_ids UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rated_competency_ids UUID[] NOT NULL DEFAULT '{}';

-- Seed: every existing item tests at least its primary competency.
INSERT INTO public.math_spiral_item_competencies (spiral_item_id, competency_id)
SELECT id, competency_id FROM public.math_spiral_items
ON CONFLICT DO NOTHING;

-- Demonstrative multi-competency tags:
--   the KE estimate also tests scientific notation,
INSERT INTO public.math_spiral_item_competencies (spiral_item_id, competency_id)
SELECT si.id, c.id
FROM public.math_spiral_items si
JOIN public.math_competencies pc ON pc.id = si.competency_id AND pc.slug = 'm.qe.estimate'
JOIN public.math_competencies c ON c.slug = 'm.qe.sci-notation'
ON CONFLICT DO NOTHING;

--   the vector-components item also tests significant figures (rounding the components).
INSERT INTO public.math_spiral_item_competencies (spiral_item_id, competency_id)
SELECT si.id, c.id
FROM public.math_spiral_items si
JOIN public.math_competencies pc ON pc.id = si.competency_id AND pc.slug = 'm.gv.vectors'
JOIN public.math_competencies c ON c.slug = 'm.qe.sigfigs'
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.math_spiral_item_competencies IS 'The competencies a warm-up item tests (primary + extras). The review drawer rates exactly these.';
