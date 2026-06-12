-- Midway machines #2 and #3: TIMBER and VORTEX complete the pure-fun row
-- (slots 12 and 13, alongside STACK at 11). Same economy as STACK:
-- 10 XP per coin, one coin = three attempts, best counts.
--
-- TIMBER — hop left/right, chop, dodge descending branches; every chop buys
-- daylight but the day drains faster as your count climbs. The sun on screen
-- IS the timer: death is literally SUNDOWN (or SQUASHED). Bot-verified:
-- smart play at superhuman speed dies to the sun at ~428 chops (4,280 pts,
-- under the 8,000 cap); mashers get squashed young; idlers cannot soft-lock.
--
-- VORTEX — orbit the core, thread the gap in collapsing hexagonal walls,
-- survive the ramp. Score = seconds × 100. Bot-verified: a patient
-- gap-seeker survives 52–81 s and ALWAYS dies to the ramp (≈8,100 max,
-- under the 15,000 cap); moving while a wall passes your radius is the
-- canonical death, for bots and humans alike.
--
-- Registered DISABLED per the deployment rule; enable from /admin/arcade
-- once each row shows "file deployed".
-- Applied to production 2026-06-12 via MCP (enabled=false).

INSERT INTO public.arcade_games (slug, name, blurb, src_path, cost_xp, unit, accent, max_plausible_score, sort_order, enabled)
VALUES
  ('timber', 'TIMBER',
   'Hop left, hop right, chop, DON''T look up. Branches descend, the sun is sinking, and every chop buys a sliver of daylight. One coin = three trees — your best one counts.',
   '/games/midway-timber.html', 10, 'Midway', '#34d399', 8000, 12, false),
  ('vortex', 'VORTEX',
   'Walls collapse inward; you orbit the core and thread the gap. The board spins, the speed ramps, the music pulses. Score is seconds survived. One coin = three runs — your best one counts.',
   '/games/midway-vortex.html', 10, 'Midway', '#a78bfa', 15000, 13, false)
ON CONFLICT (slug) DO NOTHING;
