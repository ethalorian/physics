-- Math Spine fluency series — four more FREE cabinets (cost_xp = 0), one per
-- strand of the quantitative spine (see math_competencies):
--   MAGNITUDE      number-sense            NS1 NS2
--   SCALE STORM    proportional-reasoning  PR1 PR2
--   POWERS OF TEN  quantities-estimation   QE1 QE2 QE3 QE4
--   SLOPE SNIPER   graphs-vectors          GV1 GV2 GV3
-- (symbolic-manipulation SM1/SM2 is covered by INVERSE BLITZ, sort_order 8.)
-- Same free-cabinet rules as INVERSE BLITZ: ranked runs, mastery-weighted XP
-- via /api/arcade/payout, daily cap shared across all free cabinets.
-- Registered disabled; enable after the game files deploy:
--   UPDATE public.arcade_games SET enabled = true
--    WHERE slug IN ('magnitude','scale-storm','powers-of-ten','slope-sniper');
INSERT INTO public.arcade_games
  (slug, name, blurb, src_path, cost_xp, unit, accent, max_plausible_score, enabled, sort_order)
VALUES
  ('magnitude', 'MAGNITUDE',
   'Four numbers fall — crown the biggest before the block lands. Decimals lie, fractions disguise themselves, exponents bluff. Free to play; accuracy banks XP.',
   '/games/numbersense-magnitude.html', 0, 'Math Spine', '#38bdf8', 250000, false, 9),
  ('scale-storm', 'SCALE STORM',
   'Ratios, doublings, squares, and inverse-squares — predict how quantities change before the stack wins. Free to play; accuracy banks XP.',
   '/games/proportion-scale-storm.html', 0, 'Math Spine', '#fbbf24', 250000, false, 10),
  ('powers-of-ten', 'POWERS OF TEN',
   'Scientific notation, unit conversions, sig figs, and Fermi estimates at arcade speed. The exponent always wins. Free to play; accuracy banks XP.',
   '/games/quantities-powers-of-ten.html', 0, 'Math Spine', '#f472b6', 250000, false, 11),
  ('slope-sniper', 'SLOPE SNIPER',
   'Graphs fall — read the slope, the area, the meaning. Break vectors into components. The graph IS the physics. Free to play; accuracy banks XP.',
   '/games/graphs-slope-sniper.html', 0, 'Math Spine', '#4ade80', 250000, false, 12)
ON CONFLICT (slug) DO NOTHING;
