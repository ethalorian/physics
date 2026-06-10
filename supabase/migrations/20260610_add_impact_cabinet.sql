-- Third arcade cabinet: IMPACT (momentum & collisions — NO energy; energy
-- gets its own cabinet later). Companion to DESCENT (kinematics) and PUSH
-- (dynamics). Same economy: 25 XP coin, pure sink, weekly board + Hall of
-- Fame. Applied to production 2026-06-10 via MCP; kept here so the repo
-- migration history matches the live schema.

INSERT INTO public.arcade_games (slug, name, blurb, src_path, cost_xp, unit, accent, max_plausible_score, sort_order)
VALUES (
  'impact',
  'IMPACT',
  'Mass times velocity — the one thing the universe never loses track of. Couple trains through speed gates, pick your cue mass, and dock a pod by throwing cargo. The gold TOTAL bar never moves.',
  '/games/momentum-impact.html',
  25,
  'Momentum',
  '#fb7185',
  250000,
  3
)
ON CONFLICT (slug) DO NOTHING;
