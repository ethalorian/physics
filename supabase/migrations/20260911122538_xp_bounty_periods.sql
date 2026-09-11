-- Existing bounties retain daily behavior and their grant dedupe keys.
ALTER TABLE public.xp_challenges
  ADD COLUMN IF NOT EXISTS period text NOT NULL DEFAULT 'daily'
  CHECK (period IN ('daily', 'weekly', 'monthly', 'custom'));

COMMENT ON COLUMN public.xp_challenges.period IS
  'Eastern calendar day, Monday-based week, calendar month, or entire selected date range; one bonus per window.';
