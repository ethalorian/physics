-- Generic point grants into the existing spendable economy.
--
-- Some features earn XP that doesn't fit vocabulary_game_scores (whose game_type
-- is whitelisted and requires a vocabulary_set_id) or math_spine_point_grants
-- (whose milestone is whitelisted to math events). The Escape Room is the first:
-- a group activity that should credit every member on a successful escape.
--
-- This table is the general-purpose grant ledger. It is summed into
-- lifetimeEarned by src/lib/points.ts, so anything granted here feeds the same
-- balance / rewards-store / avatar economy as everything else. dedupe_key makes
-- each award idempotent (re-running an escape finish never double-credits).

CREATE TABLE IF NOT EXISTS public.economy_point_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_email TEXT,
  source TEXT NOT NULL,                       -- e.g. 'escape-room'
  reference TEXT,                             -- e.g. lobby session id / room id
  points INTEGER NOT NULL CHECK (points >= 0),
  note TEXT,                                  -- human-readable reason
  dedupe_key TEXT UNIQUE NOT NULL,            -- e.g. 'escape:<session>:<group>:<user>'
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_economy_grants_user ON public.economy_point_grants(user_id);
CREATE INDEX IF NOT EXISTS idx_economy_grants_source ON public.economy_point_grants(source);

ALTER TABLE public.economy_point_grants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students view own economy grants" ON public.economy_point_grants;
CREATE POLICY "Students view own economy grants"
  ON public.economy_point_grants FOR SELECT
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Staff manage all economy grants" ON public.economy_point_grants;
CREATE POLICY "Staff manage all economy grants"
  ON public.economy_point_grants FOR ALL
  USING (auth.jwt() ->> 'email' IN (
    SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
    UNION SELECT unnest(string_to_array(current_setting('app.teacher_emails', true), ','))
  ));

COMMENT ON TABLE public.economy_point_grants IS 'General-purpose idempotent point awards (e.g. Escape Room). Summed into lifetime-earned by src/lib/points.ts so it feeds the existing balance/rewards/avatar economy. dedupe_key guarantees an award lands at most once.';
