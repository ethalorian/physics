-- Song/level is fixed atomically when a Pulse credit is purchased, not supplied
-- with the score. Existing untagged plays remain Neon Current / Arcade.
CREATE OR REPLACE FUNCTION public.purchase_pulse_play(p_user_id uuid, p_email text, p_chart_id text, p_staff boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE receipt jsonb;
BEGIN
  IF p_chart_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM unnest(ARRAY['neon-current','chrome-circuit','midnight-drive','solar-flare','terminal-velocity']) s
    CROSS JOIN unnest(ARRAY['easy','arcade','expert','master','overdrive']) d
    WHERE s || '-' || d = p_chart_id
  ) THEN RAISE EXCEPTION 'INVALID_PULSE_CHART'; END IF;
  receipt := public.purchase_arcade_play(p_user_id,p_email,'pulse',p_staff);
  UPDATE public.arcade_plays SET meta = COALESCE(meta,'{}'::jsonb) || jsonb_build_object('pulseChart',p_chart_id)
  WHERE id = (receipt->>'playId')::uuid;
  IF NOT FOUND THEN RAISE EXCEPTION 'PULSE_PLAY_NOT_CREATED'; END IF;
  RETURN receipt || jsonb_build_object('chartId',p_chart_id);
END;
$$;

CREATE INDEX IF NOT EXISTS arcade_plays_pulse_chart_idx
ON public.arcade_plays ((COALESCE(meta->>'pulseChart','neon-current-arcade')), user_id, score DESC)
WHERE game_slug='pulse' AND score>0 AND COALESCE(meta->>'staff','false')<>'true';

CREATE OR REPLACE FUNCTION public.pulse_chart_leaderboard(p_chart_id text,p_user_id uuid,p_week_start timestamptz)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  WITH plays AS MATERIALIZED (
    SELECT user_id,score,created_at FROM public.arcade_plays
    WHERE game_slug='pulse' AND score>0 AND COALESCE(meta->>'staff','false')<>'true'
      AND COALESCE(meta->>'pulseChart','neon-current-arcade')=p_chart_id
  ), weekly AS (
    SELECT user_id,max(score) AS score,row_number() OVER (ORDER BY max(score) DESC,user_id) AS rank
    FROM plays WHERE created_at>=p_week_start GROUP BY user_id
  ), all_time AS (
    SELECT user_id,max(score) AS score,row_number() OVER (ORDER BY max(score) DESC,user_id) AS rank
    FROM plays GROUP BY user_id
  ) SELECT jsonb_build_object(
    'weekly',COALESCE((SELECT jsonb_agg(to_jsonb(w) ORDER BY rank) FROM weekly w WHERE rank<=10),'[]'::jsonb),
    'hallOfFame',COALESCE((SELECT jsonb_agg(to_jsonb(a) ORDER BY rank) FROM all_time a WHERE rank<=5),'[]'::jsonb),
    'myWeeklyRank',(SELECT rank FROM weekly WHERE user_id=p_user_id)
  );
$$;
REVOKE ALL ON FUNCTION public.purchase_pulse_play(uuid,text,text,boolean), public.pulse_chart_leaderboard(text,uuid,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_pulse_play(uuid,text,text,boolean), public.pulse_chart_leaderboard(text,uuid,timestamptz) TO service_role;
