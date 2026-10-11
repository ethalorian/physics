-- MIC CHECK: original 90-second physics call-and-response tracks. Every unit
-- uses the same scored chart; freestyle is unscored. No learning XP payout.
-- Deploy the game, vocals, avatar bundle, context API, preview and bridge first.
-- Enable only after production assets have been verified.
INSERT INTO public.arcade_games
  (slug, name, blurb, src_path, cost_xp, unit, accent, max_plausible_score, sort_order, enabled)
VALUES
  ('mic-check', 'MIC CHECK',
   'Your avatar. Your physics. Echo MC Vector’s rap with four keys, build your streak, then freestyle. Eight course-unit tracks inspired by the 2026-XJ video series. One credit plays a full 90-second set; practice is free.',
   '/games/midway-mic-check.html', 10, 'Midway', '#c5f45b', 1000000, 15, false)
ON CONFLICT (slug) DO NOTHING;
