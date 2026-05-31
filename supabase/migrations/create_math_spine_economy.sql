-- ============================================================================
-- MATH-LITERACY SPINE — ECONOMY HOOK
-- ============================================================================
-- Additive migration. Lets math-literacy MILESTONES award points into the SAME
-- economy the rest of the app already runs on. There is no separate currency:
-- a grant here is summed into lifetime-earned by src/lib/points.ts, exactly like
-- game scores, lesson engagement, and graded submissions — so it flows straight
-- into the existing balance, leaderboard, and rewards store.
--
-- Append-only and idempotent: every grant carries a dedupe_key so a milestone
-- (e.g. "reached Fluent on QE1") can only ever be awarded once, even though the
-- underlying math_competency_records are re-observed over time.
--
-- SAFE BY DESIGN: additive only; touches no existing table. Mirrors the RLS
-- pattern of create_mastery_tracking_system.sql / create_math_spine_system.sql.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.math_spine_point_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_email TEXT,
  milestone TEXT NOT NULL CHECK (milestone IN (
    'levelup-almost',      -- competency value crossed into "Almost" (>= 1.5)
    'competency-fluent',   -- competency value crossed into "Got it / Fluent" (>= 2.5)
    'strand-complete',     -- every active competency in a strand is Fluent
    'spotlight'            -- teacher-awarded recognition ("assigning competence")
  )),
  competency_id UUID REFERENCES public.math_competencies(id) ON DELETE CASCADE,
  strand TEXT,                               -- set for strand-complete grants
  points INTEGER NOT NULL CHECK (points >= 0),
  note TEXT,                                  -- e.g. teacher's spotlight reason
  awarded_by TEXT,                            -- staff email for spotlight/manual grants
  dedupe_key TEXT UNIQUE NOT NULL,            -- e.g. 'user123:competency-fluent:m.qe.sci-notation'
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_math_grants_user ON public.math_spine_point_grants(user_id);
CREATE INDEX IF NOT EXISTS idx_math_grants_competency ON public.math_spine_point_grants(competency_id);
CREATE INDEX IF NOT EXISTS idx_math_grants_awarded ON public.math_spine_point_grants(awarded_at);

ALTER TABLE public.math_spine_point_grants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students view own math grants" ON public.math_spine_point_grants;
CREATE POLICY "Students view own math grants"
  ON public.math_spine_point_grants FOR SELECT
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Staff manage all math grants" ON public.math_spine_point_grants;
CREATE POLICY "Staff manage all math grants"
  ON public.math_spine_point_grants FOR ALL
  USING (auth.jwt() ->> 'email' IN (
    SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
    UNION SELECT unnest(string_to_array(current_setting('app.teacher_emails', true), ','))
  ));

COMMENT ON TABLE public.math_spine_point_grants IS 'Idempotent point awards for math-literacy milestones. Summed into lifetime-earned by src/lib/points.ts so it feeds the existing balance/leaderboard/rewards economy. dedupe_key guarantees a milestone is awarded at most once.';
