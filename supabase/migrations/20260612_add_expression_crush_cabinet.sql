-- EXPRESSION CRUSH — sixth Math Spine free cabinet, first non-falling-block
-- mechanic: match-3 expression builder. Level arc: order-of-operations targets
-- (PEMDAS traps surfaced as feedback) → scenario-to-expression modeling with
-- glowing "given" tiles → physics formula assembly finale. Targets SM2 +
-- order-of-operations structure. Same free-cabinet economy: ranked runs,
-- mastery-weighted XP via /api/arcade/payout (shared 75/day cap).
INSERT INTO public.arcade_games
  (slug, name, blurb, src_path, cost_xp, unit, accent, max_plausible_score, enabled, sort_order)
VALUES
  ('expression-crush', 'EXPRESSION CRUSH',
   'Match-3 with consequences: swap tiles to build expressions that hit the target. PEMDAS is the law, scenarios become models, and the finale is assembling the physics formulas themselves. Free to play; accuracy banks XP.',
   '/games/logic-expression-crush.html', 0, 'Math Spine', '#e879f9', 250000, true, 13)
ON CONFLICT (slug) DO NOTHING;
