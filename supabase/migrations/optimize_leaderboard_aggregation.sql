-- Leaderboard scaling fix
-- ------------------------------------------------------------------
-- Problem: /api/leaderboard previously fetched the ENTIRE
-- vocabulary_game_scores, lesson_progress, and submissions tables on
-- every request and aggregated them in JS (O(total platform rows) per
-- page load). The `submissions` table also had no indexes.
--
-- Fix: push the aggregation into Postgres via an RPC that returns only
-- the top-N users, and add the supporting indexes. The point formula
-- below MUST stay in sync with src/lib/points.ts (getLifetimeEarned):
--   games        = Σ score
--   lessons      = Σ (progress_percentage + 5 * video_questions_correct)
--   assignments  = Σ score WHERE status = 'graded'
-- ------------------------------------------------------------------

-- Indexes (idempotent) ---------------------------------------------
CREATE INDEX IF NOT EXISTS idx_submissions_user_id
  ON submissions (user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status_graded_at
  ON submissions (status, graded_at);
CREATE INDEX IF NOT EXISTS idx_vocab_game_scores_user_completed
  ON vocabulary_game_scores (user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_completed
  ON lesson_progress (user_id, completed_at);

-- Aggregation RPC --------------------------------------------------
-- p_since: NULL for all-time, or a timestamptz cutoff for week/month.
-- p_limit: number of leaderboard rows to return.
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
  assignments integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH game AS (
    SELECT g.user_id,
           MAX(g.user_email)      AS user_email,
           SUM(COALESCE(g.score, 0))::numeric AS pts,
           COUNT(*)::int          AS cnt
    FROM vocabulary_game_scores g
    WHERE p_since IS NULL OR g.completed_at >= p_since
    GROUP BY g.user_id
  ),
  lesson AS (
    SELECT l.user_id,
           MAX(l.user_email) AS user_email,
           SUM(COALESCE(l.progress_percentage, 0)
               + 5 * COALESCE(l.video_questions_correct, 0))::numeric AS pts,
           COUNT(*)::int     AS cnt
    FROM lesson_progress l
    WHERE p_since IS NULL OR l.completed_at >= p_since
    GROUP BY l.user_id
  ),
  sub AS (
    SELECT s.user_id,
           SUM(COALESCE(s.score, 0))::numeric AS pts,
           COUNT(*)::int      AS cnt
    FROM submissions s
    WHERE s.status = 'graded'
      AND (p_since IS NULL OR s.graded_at >= p_since)
    GROUP BY s.user_id
  ),
  ids AS (
    SELECT user_id FROM game
    UNION SELECT user_id FROM lesson
    UNION SELECT user_id FROM sub
  )
  SELECT
    ids.user_id,
    COALESCE(game.user_email, lesson.user_email, '') AS user_email,
    ROUND(COALESCE(game.pts, 0) + COALESCE(lesson.pts, 0) + COALESCE(sub.pts, 0)) AS total_points,
    COALESCE(game.cnt, 0)   AS games,
    COALESCE(lesson.cnt, 0) AS lessons,
    COALESCE(sub.cnt, 0)    AS assignments
  FROM ids
  LEFT JOIN game   ON game.user_id   = ids.user_id
  LEFT JOIN lesson ON lesson.user_id = ids.user_id
  LEFT JOIN sub    ON sub.user_id    = ids.user_id
  ORDER BY total_points DESC
  LIMIT p_limit;
$$;

-- Only the server (service role) needs this; revoke from client roles.
REVOKE ALL ON FUNCTION get_leaderboard(timestamptz, integer) FROM PUBLIC, anon, authenticated;
