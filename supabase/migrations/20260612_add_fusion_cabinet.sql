-- FUSION — seventh Math Spine free cabinet: 2048-style equivalence merger.
-- Tiles merge by VALUE across representations (1/2 ↔ 0.5 ↔ 50%; 25 cm ↔ 0.25 m;
-- 2×10⁻² ↔ 0.02 ↔ 2%). Targets NS2 (forms), QE1 (sci notation), QE2 (units).
-- Periodic MERGE AUDIT questions feed the accuracy stat (wrong → junk tile);
-- same free-cabinet economy via /api/arcade/payout (shared 75/day cap).
INSERT INTO public.arcade_games
  (slug, name, blurb, src_path, cost_xp, unit, accent, max_plausible_score, enabled, sort_order)
VALUES
  ('fusion', 'FUSION',
   '2048 with a twist: tiles merge only when their VALUES match — but 1/2 wears a 50% costume and 25 cm hides inside 0.25 m. See through the disguise or overload. Free to play; accuracy banks XP.',
   '/games/equivalence-fusion.html', 0, 'Math Spine', '#2dd4bf', 250000, true, 14)
ON CONFLICT (slug) DO NOTHING;
