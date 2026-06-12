-- INVERSE BLITZ — first FREE cabinet (cost_xp = 0): algebra inverse-operations
-- game with a physics formula-rearranging mode. Free coins, ranked runs,
-- mastery-weighted XP payout via /api/arcade/payout (see docs/ARCADE_PATTERN.md
-- "Free cabinets"). Registered disabled; enable after the game file deploys:
--   UPDATE public.arcade_games SET enabled = true WHERE slug = 'inverse-blitz';
INSERT INTO public.arcade_games
  (slug, name, blurb, src_path, cost_xp, unit, accent, max_plausible_score, enabled, sort_order)
VALUES
  ('inverse-blitz', 'INVERSE BLITZ',
   'Equations fall — fire inverse operations to strip them to x = ? before the stack buries you. Physics mode: rearrange the real formulas. Free to play; accuracy banks XP.',
   '/games/algebra-inverse-blitz.html', 0, 'Math Spine', '#a78bfa', 250000, false, 8)
ON CONFLICT (slug) DO NOTHING;
