-- MATHLE — eighth Math Spine free cabinet: daily equation puzzle (Nerdle-style).
-- Hidden 8-char equation, 6 guesses, every guess must be a true equation under
-- PEMDAS. Puzzle #1 of each run is THE DAILY (deterministic from the date, same
-- for the whole class — habit hook alongside the spin wheel); bonus rounds keep
-- the run alive until one stumps the player. Share-grid button for class chat.
-- Same free-cabinet economy via /api/arcade/payout (shared 75/day cap).
INSERT INTO public.arcade_games
  (slug, name, blurb, src_path, cost_xp, unit, accent, max_plausible_score, enabled, sort_order)
VALUES
  ('mathle', 'MATHLE',
   'Crack the hidden 8-character equation in six guesses — every guess must be a TRUE equation, and PEMDAS is watching. One shared daily for the whole class, then bonus rounds until you''re stumped. Free to play; accuracy banks XP.',
   '/games/daily-mathle.html', 0, 'Math Spine', '#facc15', 250000, true, 15)
ON CONFLICT (slug) DO NOTHING;
