-- Atomic reward redemption (fixes double-spend race)
-- ------------------------------------------------------------------
-- Problem: /api/rewards/redeem read the balance with getBalance() and
-- then INSERTed a redemption in two separate steps. Two concurrent
-- requests (double-click / two devices) could both pass the balance
-- check and both insert, letting a student spend points they don't
-- have.
--
-- Fix: do the balance check + insert inside one transaction, serialized
-- per-user with a transaction-scoped advisory lock so concurrent
-- redemptions for the same user run one-at-a-time.
--
-- The balance formula MUST stay in sync with src/lib/points.ts:
--   lifetimeEarned = Σ game scores
--                  + Σ (progress_percentage + 5 * video_questions_correct)
--                  + Σ graded submission scores
--   balance        = lifetimeEarned − Σ redemptions WHERE status <> 'denied'
-- ------------------------------------------------------------------

CREATE OR REPLACE FUNCTION redeem_reward(
  p_user_id    text,
  p_user_email text,
  p_reward_id  text
)
RETURNS SETOF reward_redemptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reward         rewards%ROWTYPE;
  v_lifetime       numeric;
  v_spent          numeric;
  v_balance        numeric;
BEGIN
  -- Serialize concurrent redemptions for this user within the transaction.
  PERFORM pg_advisory_xact_lock(hashtext('redeem:' || p_user_id));

  SELECT * INTO v_reward FROM rewards WHERE id::text = p_reward_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'REWARD_NOT_FOUND';
  END IF;

  IF NOT v_reward.active THEN
    RAISE EXCEPTION 'REWARD_INACTIVE';
  END IF;

  -- lifetimeEarned
  v_lifetime :=
      COALESCE((SELECT SUM(COALESCE(score, 0)) FROM vocabulary_game_scores WHERE user_id = p_user_id), 0)
    + COALESCE((SELECT SUM(COALESCE(progress_percentage, 0) + 5 * COALESCE(video_questions_correct, 0))
                FROM lesson_progress WHERE user_id = p_user_id), 0)
    + COALESCE((SELECT SUM(COALESCE(score, 0)) FROM submissions
                WHERE user_id = p_user_id AND status = 'graded'), 0);
  v_lifetime := ROUND(v_lifetime);

  -- committed spend (everything not denied counts against balance)
  v_spent := COALESCE((SELECT SUM(COALESCE(cost_points, 0)) FROM reward_redemptions
                       WHERE user_id = p_user_id AND status <> 'denied'), 0);

  v_balance := v_lifetime - v_spent;

  IF v_balance < v_reward.cost_points THEN
    RAISE EXCEPTION 'INSUFFICIENT_FUNDS:%:%', v_balance, v_reward.cost_points;
  END IF;

  RETURN QUERY
  INSERT INTO reward_redemptions (user_id, user_email, reward_id, reward_name, cost_points, status)
  VALUES (p_user_id, p_user_email, v_reward.id, v_reward.name, v_reward.cost_points, 'pending')
  RETURNING *;
END;
$$;

REVOKE ALL ON FUNCTION redeem_reward(text, text, text) FROM PUBLIC, anon, authenticated;
