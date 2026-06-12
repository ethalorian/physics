-- Eleventh cabinet: STACK — first machine of the MIDWAY, the pure-fun row.
-- No questions, no telemetry, no acts: a flappy-class compulsion loop that
-- exists to be the arcade's quarter-eater. One tap drops a sliding block on
-- the tower; overhang slices off; PERFECT drops chime a semitone higher per
-- streak and regrow the footprint; height 150 = THE SKY.
--
-- Economy: 10 XP per coin (cheaper than the physics cabinets — runs are
-- ~20 s), one coin = THREE towers, best tower is the score. Verified by
-- bot: perfect play caps at the sky (≈20k, under the 30k cap), sloppy play
-- dies fast, no soft-locks.
--
-- Registered DISABLED per the deployment rule; enable from /admin/arcade
-- once its row shows "file deployed".
-- Applied to production 2026-06-12 via MCP (enabled=false).

INSERT INTO public.arcade_games (slug, name, blurb, src_path, cost_xp, unit, accent, max_plausible_score, sort_order, enabled)
VALUES (
  'stack',
  'STACK',
  'One tap. The block slides, you drop it, the overhang slices away. Perfect drops chime, streak, and grow your block back. One coin = three towers — your best one counts.',
  '/games/midway-stack.html',
  10,
  'Midway',
  '#f472b6',
  30000,
  11,
  false
)
ON CONFLICT (slug) DO NOTHING;
