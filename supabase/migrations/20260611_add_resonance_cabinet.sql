-- Sixth arcade cabinet: RESONANCE (Unit 6 — Waves, Sound & Light).
-- sort_order 7 leaves slot 6 reserved for a future Thermal cabinet (Unit 5).
-- Registered DISABLED per the (newly learned) deployment rule: the cabinet
-- row reaches the database instantly, but the game file ships with the next
-- deploy — enabling early serves students a 404 inside the player iframe.
-- After deploying, enable everything with:
--   UPDATE public.arcade_games SET enabled = true
--   WHERE slug IN ('push','impact','cascade','orbit','resonance');
-- Applied to production 2026-06-11 via MCP (enabled=false); kept here so the
-- repo migration history matches the live schema.

INSERT INTO public.arcade_games (slug, name, blurb, src_path, cost_xp, unit, accent, max_plausible_score, sort_order, enabled)
VALUES (
  'resonance',
  'RESONANCE',
  'The only cabinet that plays its own physics out loud. Tune crystals with real audible beats, shatter orbs with standing waves, and park bells on interference fringes.',
  '/games/waves-resonance.html',
  25,
  'Waves',
  '#22d3ee',
  250000,
  7,
  false
)
ON CONFLICT (slug) DO NOTHING;
