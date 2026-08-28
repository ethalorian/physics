-- Leaderboard: XP by source  (APPLIED to the live PhysicsAPP project 2026-08-27)
-- ------------------------------------------------------------------
-- The leaderboard row used to show "N games · N lessons · N assignments"
-- while the total also included math-spine grants and economy grants
-- (arcade payouts, daily spins, escape room, duels, review bonuses). The
-- result: a student with 170 XP from the math-gym arcade read as
-- "0 games · 0 lessons · 0 assignments — 170 XP". This version returns
-- the XP contributed by EACH source (plus the activity counts) so the UI
-- can say where the points actually came from. The formula still mirrors
-- src/lib/points.ts (getLifetimeEarned):
--   games   = Σ_day min(50, Σ_play min(25, round(score/10)))
--   lessons = Σ (round(progress_percentage/4) + 5·video_questions_correct)
--   graded  = Σ min(40, score) WHERE status = 'graded'
--   math    = Σ math_spine_point_grants.points
--   economy = Σ economy_point_grants.points, split by source
-- ------------------------------------------------------------------

DROP FUNCTION IF EXISTS get_leaderboard(timestamptz, integer);

CREATE OR REPLACE FUNCTION get_leaderboard(
  p_since timestamptz DEFAULT NULL,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  user_id text,
  user_email text,
  total_points numeric,
  games integer,
  lessons integer,
  assignments integer,
  games_pts numeric,
  lessons_pts numeric,
  graded_pts numeric,
  math_pts numeric,
  arcade_pts numeric,
  spin_pts numeric,
  other_pts numeric,
  arcade_runs integer,
  spins integer,
  math_grants integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH game_days AS (
    SELECT user_id, completed_at::date AS d,
      LEAST(50, SUM(LEAST(25, round(COALESCE(score,0)/10.0))))::numeric AS day_pts,
      COUNT(*)::int AS plays, MAX(user_email) AS user_email
    FROM vocabulary_game_scores
    WHERE p_since IS NULL OR completed_at >= p_since
    GROUP BY user_id, completed_at::date
  ),
  game AS (SELECT user_id, SUM(day_pts) AS pts, SUM(plays)::int AS cnt, MAX(user_email) AS user_email FROM game_days GROUP BY user_id),
  lesson AS (
    SELECT user_id, MAX(user_email) AS user_email,
      SUM(round(COALESCE(progress_percentage,0)/4.0) + 5*COALESCE(video_questions_correct,0))::numeric AS pts,
      COUNT(*)::int AS cnt
    FROM lesson_progress WHERE p_since IS NULL OR completed_at >= p_since GROUP BY user_id
  ),
  sub AS (
    SELECT user_id, SUM(LEAST(40, COALESCE(score,0)))::numeric AS pts, COUNT(*)::int AS cnt
    FROM submissions WHERE status='graded' AND (p_since IS NULL OR graded_at >= p_since) GROUP BY user_id
  ),
  mathg AS (
    SELECT user_id, SUM(COALESCE(points,0))::numeric AS pts, COUNT(*)::int AS cnt
    FROM math_spine_point_grants WHERE p_since IS NULL OR awarded_at >= p_since GROUP BY user_id
  ),
  econ AS (
    SELECT user_id,
      SUM(CASE WHEN source = 'arcade-payout' THEN COALESCE(points,0) ELSE 0 END)::numeric AS arcade_pts,
      SUM(CASE WHEN source = 'daily-spin'    THEN COALESCE(points,0) ELSE 0 END)::numeric AS spin_pts,
      SUM(CASE WHEN source NOT IN ('arcade-payout','daily-spin') THEN COALESCE(points,0) ELSE 0 END)::numeric AS other_pts,
      COUNT(*) FILTER (WHERE source = 'arcade-payout')::int AS arcade_runs,
      COUNT(*) FILTER (WHERE source = 'daily-spin')::int AS spins
    FROM economy_point_grants WHERE p_since IS NULL OR awarded_at >= p_since GROUP BY user_id
  ),
  ids AS (
    SELECT user_id FROM game UNION SELECT user_id FROM lesson UNION SELECT user_id FROM sub
    UNION SELECT user_id FROM mathg UNION SELECT user_id FROM econ
  )
  SELECT ids.user_id,
    COALESCE(game.user_email, lesson.user_email, '') AS user_email,
    ROUND(COALESCE(game.pts,0)+COALESCE(lesson.pts,0)+COALESCE(sub.pts,0)+COALESCE(mathg.pts,0)
          +COALESCE(econ.arcade_pts,0)+COALESCE(econ.spin_pts,0)+COALESCE(econ.other_pts,0)) AS total_points,
    COALESCE(game.cnt,0)   AS games,
    COALESCE(lesson.cnt,0) AS lessons,
    COALESCE(sub.cnt,0)    AS assignments,
    ROUND(COALESCE(game.pts,0))        AS games_pts,
    ROUND(COALESCE(lesson.pts,0))      AS lessons_pts,
    ROUND(COALESCE(sub.pts,0))         AS graded_pts,
    ROUND(COALESCE(mathg.pts,0))       AS math_pts,
    ROUND(COALESCE(econ.arcade_pts,0)) AS arcade_pts,
    ROUND(COALESCE(econ.spin_pts,0))   AS spin_pts,
    ROUND(COALESCE(econ.other_pts,0))  AS other_pts,
    COALESCE(econ.arcade_runs,0)       AS arcade_runs,
    COALESCE(econ.spins,0)             AS spins,
    COALESCE(mathg.cnt,0)              AS math_grants
  FROM ids
  LEFT JOIN game   ON game.user_id   = ids.user_id
  LEFT JOIN lesson ON lesson.user_id = ids.user_id
  LEFT JOIN sub    ON sub.user_id    = ids.user_id
  LEFT JOIN mathg  ON mathg.user_id  = ids.user_id
  LEFT JOIN econ   ON econ.user_id   = ids.user_id
  ORDER BY total_points DESC LIMIT p_limit;
$$;

REVOKE ALL ON FUNCTION get_leaderboard(timestamptz, integer) FROM PUBLIC, anon, authenticated;
