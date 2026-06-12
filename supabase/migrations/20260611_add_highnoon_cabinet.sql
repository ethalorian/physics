-- Tenth cabinet, take two: REDLINE replaces HIGH NOON.
--
-- HIGH NOON (lead-calculator western) was registered disabled on 2026-06-11
-- and retired the same day before ever being enabled — the sprites decorated
-- the physics instead of embodying it. REDLINE is the rebuild: a dusk-minimal
-- Excitebike-blooded motocross where the throttle IS acceleration (overheat
-- makes `a` a budgeted resource), GRAPH GATES only open if you ride a posted
-- v–t shape (cruise bands, accel zones, stop boxes, speed traps), and every
-- gap jump is a projectile with the minimum takeoff speed computable from
-- the posted gap. Every sprite means something: the temp gauge is
-- acceleration, the speedometer is the protagonist, the track is the x-axis.
--
-- Registered DISABLED per the deployment rule; enable from /admin/arcade
-- once its row shows "file deployed".
-- Applied to production 2026-06-11 via MCP (highnoon row deleted, redline
-- inserted enabled=false).

DELETE FROM public.arcade_games WHERE slug = 'highnoon';

INSERT INTO public.arcade_games (slug, name, blurb, src_path, cost_xp, unit, accent, max_plausible_score, sort_order, enabled)
VALUES (
  'redline',
  'REDLINE',
  'A dusk-lit motocross where the throttle IS acceleration. Ride v–t graph gates, manage the overheat budget, and clear gaps where takeoff speed is a calculation, not a hope.',
  '/games/kinematics-redline.html',
  25,
  'Kinematics',
  '#ffd166',
  250000,
  10,
  false
)
ON CONFLICT (slug) DO NOTHING;
