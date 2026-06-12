-- Ninth and final cabinet: GARAGE (Unit 8 — The Car Project). The synthesis:
-- not a unit but a REHEARSAL of the real nine-day build. Act I wires the
-- actual circuit (cells series/parallel, switch in series, no shorts — with
-- a diagnose-the-fault level for Day 7 rescues). Act II is the Day 3 wheel
-- commit: gear ratio against a real DC motor curve, three events that want
-- three different cars, one setup that must satisfy all. Act III is Day 9:
-- race vs rival ghosts plus the judging-table mass-vs-style tradeoff.
-- The arcade is complete:
--   1 DESCENT · 2 PUSH · 3 ORBIT · 4 IMPACT · 5 CASCADE · 6 FURNACE
--   7 RESONANCE · 8 FLUX · 9 GARAGE
-- Registered DISABLED per the deployment rule; enable from /admin/arcade
-- once its row shows "file deployed".
-- Applied to production 2026-06-11 via MCP (enabled=false).

INSERT INTO public.arcade_games (slug, name, blurb, src_path, cost_xp, unit, accent, max_plausible_score, sort_order, enabled)
VALUES (
  'garage',
  'GARAGE',
  'The rehearsal for the real thing: wire the circuit (series or parallel, no shorts), commit a gear ratio against the motor curve, and take everything to race day. Every level mirrors a day of the actual build.',
  '/games/car-garage.html',
  25,
  'Car Project',
  '#e879f9',
  250000,
  9,
  false
)
ON CONFLICT (slug) DO NOTHING;
