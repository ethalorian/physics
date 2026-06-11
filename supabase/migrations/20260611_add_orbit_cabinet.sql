-- Fifth arcade cabinet: ORBIT (Unit 2 — Gravitation & Fields), filling the
-- gap between PUSH (dynamics) and IMPACT (momentum). Resequences sort_order
-- so the cabinet row mirrors the curriculum:
--   1 DESCENT (kinematics) · 2 PUSH (dynamics) · 3 ORBIT (gravitation)
--   4 IMPACT (momentum) · 5 CASCADE (energy)
-- Act III pays off the Unit 1 narrative: asteroid 2026-XJ arrives, and the
-- player deflects it with a gravity tractor — F = Gm₁m₂/r² as a boss fight.
-- Applied to production 2026-06-11 via MCP; kept here so the repo migration
-- history matches the live schema.

UPDATE public.arcade_games SET sort_order = 5 WHERE slug = 'cascade';
UPDATE public.arcade_games SET sort_order = 4 WHERE slug = 'impact';

INSERT INTO public.arcade_games (slug, name, blurb, src_path, cost_xp, unit, accent, max_plausible_score, sort_order)
VALUES (
  'orbit',
  'ORBIT',
  'One planet, one law: F = Gm₁m₂/r². Hold the ring, chase beacons across transfer orbits, and deflect asteroid 2026-XJ with nothing but your own ship’s gravity.',
  '/games/gravitation-orbit.html',
  25,
  'Gravitation',
  '#818cf8',
  250000,
  3
)
ON CONFLICT (slug) DO NOTHING;
