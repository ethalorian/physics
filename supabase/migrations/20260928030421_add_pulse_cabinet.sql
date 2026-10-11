-- PULSE: one original 75-second rhythm track; a ranked credit always uses
-- the same Arcade chart. Easy and Expert are free local practice.
-- Deploy the HTML, pulse/* assets, preview, and protocol-2 changes before
-- enabling this cabinet in /admin/arcade. No learning XP is paid out.
INSERT INTO public.arcade_games
  (slug, name, blurb, src_path, cost_xp, unit, accent, max_plausible_score, sort_order, enabled)
VALUES
  ('pulse', 'PULSE',
   'Four keys. One frequency. Catch the beat, hold the long notes, and chase a perfect run through Neon Current. One credit plays the whole 75-second track. Free practice in three mixes.',
   '/games/midway-pulse.html', 10, 'Midway', '#bef264', 1000000, 14, false)
ON CONFLICT (slug) DO NOTHING;
