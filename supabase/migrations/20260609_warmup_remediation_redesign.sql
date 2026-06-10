-- ============================================================================
-- WARM-UP REMEDIATION REDESIGN (see Math Spine/warmup_remediation_redesign.md)
-- ============================================================================
-- Additive + idempotent, matching the conventions of the spine migrations.
-- Two changes:
--  1. math_warmup_submissions.self_check — the instant machine verdict on the
--     ANSWER ('match'/'mismatch'/'unknown'). The teacher still rates fluency;
--     this column just records what the student was told at submit time.
--  2. math_spine_point_grants.milestone gains 'practice-rep' — token points
--     (1 pt, capped 3/day via dedupe_key) for extra self-checked practice.
--     Practice reps NEVER write math_competency_records: motivation, not
--     evidence.
-- ============================================================================

ALTER TABLE public.math_warmup_submissions
  ADD COLUMN IF NOT EXISTS self_check TEXT
  CHECK (self_check IN ('match', 'mismatch', 'unknown'));

-- Recreate the milestone CHECK with the new value (default constraint name).
ALTER TABLE public.math_spine_point_grants
  DROP CONSTRAINT IF EXISTS math_spine_point_grants_milestone_check;
ALTER TABLE public.math_spine_point_grants
  ADD CONSTRAINT math_spine_point_grants_milestone_check CHECK (milestone IN (
    'levelup-almost',
    'competency-fluent',
    'strand-complete',
    'spotlight',
    'practice-rep'
  ));

COMMENT ON COLUMN public.math_warmup_submissions.self_check IS
  'Instant machine verdict on the answer only (match/mismatch/unknown). Fluency is still the teacher''s rating.';

--  3. math_spiral_items.template — "shared prompt, varied numbers" (decision
--     11): variable ranges + an answer expression. When set, the prompt's
--     {a}-slots are filled per student (seeded by user+item+day) and the
--     answer key is computed, so the class shares the problem structure while
--     answers don't transfer between neighbors. NULL = static item, unchanged.
ALTER TABLE public.math_spiral_items
  ADD COLUMN IF NOT EXISTS template JSONB;

COMMENT ON COLUMN public.math_spiral_items.template IS
  'Optional randomization: { vars: { a: {min,max,step?} }, answer: "expr", answerUnit?, sigFigs? }. See src/lib/math-item-template.ts.';
