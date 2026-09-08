-- File-first rollout: deploy /games/rotation-tether.html and /games/tether/*,
-- verify them, then enable TETHER in /admin/arcade. Existing enablement is kept.
INSERT INTO public.arcade_games
  (slug, name, blurb, src_path, cost_xp, unit, accent, max_plausible_score, enabled, sort_order)
VALUES
  ('tether', 'TETHER', 'Swing a rescue pod. Release along the tangent. Master radius, angular speed, inertia, and torque across nine rescues.',
   '/games/rotation-tether.html', 0, 'Rotational Motion', '#78ffcf', 25000, false, 12)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, blurb = EXCLUDED.blurb, src_path = EXCLUDED.src_path,
  unit = EXCLUDED.unit, accent = EXCLUDED.accent, max_plausible_score = EXCLUDED.max_plausible_score;
