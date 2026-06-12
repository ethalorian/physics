-- Seventh arcade cabinet: FURNACE (Unit 5 — Thermal Physics & the Second
-- Law), filling the reserved slot 6. The arcade row now mirrors the
-- curriculum end to end:
--   1 DESCENT · 2 PUSH · 3 ORBIT · 4 IMPACT · 5 CASCADE · 6 FURNACE · 7 RESONANCE
-- Registered DISABLED per the deployment rule (file ships with the next
-- deploy; enable from /admin/arcade once its row shows "file deployed").
-- Applied to production 2026-06-11 via MCP (enabled=false).

INSERT INTO public.arcade_games (slug, name, blurb, src_path, cost_xp, unit, accent, max_plausible_score, sort_order, enabled)
VALUES (
  'furnace',
  'FURNACE',
  'Heat is energy on the move — into metal (Q = mcΔT), between chambers (you are Maxwell’s demon), and through an engine that Carnot caps at 1 − Tc/Th. The waste heat is not optional.',
  '/games/thermal-furnace.html',
  25,
  'Thermal',
  '#ef4444',
  250000,
  6,
  false
)
ON CONFLICT (slug) DO NOTHING;
