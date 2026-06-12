-- Eighth and final subject cabinet: FLUX (Unit 7 — Electricity & Magnetism).
-- The arcade now covers every unit of the course:
--   1 DESCENT (kinematics) · 2 PUSH (dynamics) · 3 ORBIT (gravitation)
--   4 IMPACT (momentum) · 5 CASCADE (energy) · 6 FURNACE (thermal)
--   7 RESONANCE (waves) · 8 FLUX (E&M)
-- Registered DISABLED per the deployment rule; enable from /admin/arcade
-- once its row shows "file deployed".
-- Applied to production 2026-06-11 via MCP (enabled=false).

INSERT INTO public.arcade_games (slug, name, blurb, src_path, cost_xp, unit, accent, max_plausible_score, sort_order, enabled)
VALUES (
  'flux',
  'FLUX',
  'The invisible half of physics. Fly a probe by flipping your own polarity, dispatch current through the grid against a fuse, and hand-crank Faraday’s law — only change makes current.',
  '/games/em-flux.html',
  25,
  'E&M',
  '#a3e635',
  250000,
  8,
  false
)
ON CONFLICT (slug) DO NOTHING;
