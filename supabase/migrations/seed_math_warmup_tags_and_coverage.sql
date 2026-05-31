-- ============================================================================
-- MATH WARM-UPS — INTENTIONAL TAGS + FULL COMPETENCY COVERAGE
-- ============================================================================
-- A deliberate pass over the warm-up bank so each item's rating load is honest:
--   * most warm-ups hinge on ONE competency  -> one rating per student;
--   * a warm-up gets a second tag only where the problem genuinely requires it.
-- Also fills coverage: the three competencies that had no warm-up (QE4 sig-figs,
-- SM2 substitute, GV2 linearize) now each have one, so the daily picker can serve
-- every skill. Idempotent (guards on existence / ON CONFLICT).
-- ============================================================================

-- 1) The one honest extra tag: the proportional-scaling warm-up
--    ("...1.2x10^8 km in 14 days...how far in 49 days?") also requires reading
--    and writing the distance in scientific notation. Estimate (QE3) already
--    tags QE1, and vectors (GV3) already tags QE4 — those stand. Every other
--    existing item intentionally tests exactly one competency.
INSERT INTO public.math_spiral_item_competencies (spiral_item_id, competency_id)
SELECT si.id, c.id
FROM public.math_spiral_items si
JOIN public.math_competencies pc ON pc.id = si.competency_id AND pc.slug = 'm.pr.ratio'
JOIN public.math_competencies c ON c.slug = 'm.qe.sci-notation'
ON CONFLICT DO NOTHING;

-- 2) Coverage: one warm-up each for the competencies that had none.
INSERT INTO public.math_spiral_items (competency_id, prompt, answer_key, first_unit_id, difficulty)
SELECT c.id,
  'A Vernier motion detector reports a cart''s speed as 1.4732 m/s, but it is only trustworthy to about 0.01 m/s. How should you report the speed, and how many significant figures is that?',
  '1.47 m/s — 3 significant figures (digits past the 0.01 the sensor can resolve are not trustworthy).',
  'unit-1', 'easy'
FROM public.math_competencies c
WHERE c.slug = 'm.qe.sigfigs'
  AND NOT EXISTS (SELECT 1 FROM public.math_spiral_items si WHERE si.competency_id = c.id);

INSERT INTO public.math_spiral_items (competency_id, prompt, answer_key, first_unit_id, difficulty)
SELECT c.id,
  'Use F = ma to find the net force on a 1,200 kg car accelerating at 3.5 m/s^2. Substitute the values with their units and evaluate.',
  'F = (1200 kg)(3.5 m/s^2) = 4,200 N.',
  'unit-1', 'easy'
FROM public.math_competencies c
WHERE c.slug = 'm.sm.substitute'
  AND NOT EXISTS (SELECT 1 FROM public.math_spiral_items si WHERE si.competency_id = c.id);

INSERT INTO public.math_spiral_items (competency_id, prompt, answer_key, first_unit_id, difficulty)
SELECT c.id,
  'In the cart lab, doubling the applied force doubled the acceleration. If you plot acceleration (y) against force (x), what shape is the graph, and what does its slope represent?',
  'A straight line through the origin; slope = 1/mass (since a = F/m, i.e. a = (1/m)·F).',
  'unit-1', 'medium'
FROM public.math_competencies c
WHERE c.slug = 'm.gv.linearize'
  AND NOT EXISTS (SELECT 1 FROM public.math_spiral_items si WHERE si.competency_id = c.id);

-- 3) Tag each new item with its (single) tested competency.
INSERT INTO public.math_spiral_item_competencies (spiral_item_id, competency_id)
SELECT si.id, si.competency_id
FROM public.math_spiral_items si
JOIN public.math_competencies c ON c.id = si.competency_id
WHERE c.slug IN ('m.qe.sigfigs', 'm.sm.substitute', 'm.gv.linearize')
ON CONFLICT DO NOTHING;
