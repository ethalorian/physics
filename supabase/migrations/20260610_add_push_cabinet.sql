-- Second arcade cabinet: PUSH (dynamics — Newton's laws, friction, inclines).
-- Companion to DESCENT (kinematics). Same economy: 25 XP coin, pure sink,
-- weekly board + Hall of Fame. Applied to production 2026-06-10 via MCP;
-- kept here so the repo migration history matches the live schema.

INSERT INTO public.arcade_games (slug, name, blurb, src_path, cost_xp, unit, accent, max_plausible_score, sort_order)
VALUES (
  'push',
  'PUSH',
  'Nothing moves until something pushes. Impulse shuffleboard, static-friction breakaways, and ramps where gravity never sleeps. Three acts of dynamics with a live free-body diagram.',
  '/games/dynamics-push.html',
  25,
  'Dynamics',
  '#fb923c',
  250000,
  2
)
ON CONFLICT (slug) DO NOTHING;
