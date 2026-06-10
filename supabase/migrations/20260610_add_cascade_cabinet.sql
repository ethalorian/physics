-- Fourth arcade cabinet: CASCADE (energy — KE/PE, work, friction-as-heat,
-- conversion efficiency; the deliberate sequel to IMPACT's "where did the
-- speed go?"). Same economy: 25 XP coin, pure sink, weekly board + Hall of
-- Fame. Applied to production 2026-06-10 via MCP; kept here so the repo
-- migration history matches the live schema.

INSERT INTO public.arcade_games (slug, name, blurb, src_path, cost_xp, unit, accent, max_plausible_score, sort_order)
VALUES (
  'cascade',
  'CASCADE',
  'A gravity-powered mine cart and one unbreakable rule: you cannot create energy. Charge the spring, ride the hills, pay friction by the meter, and bank the descents — the stack tracks every joule.',
  '/games/energy-cascade.html',
  25,
  'Energy',
  '#34d399',
  250000,
  4
)
ON CONFLICT (slug) DO NOTHING;
