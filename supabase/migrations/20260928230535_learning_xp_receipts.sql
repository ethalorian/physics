-- Assigned vocabulary earns once per student/task, independently of arcade caps.
-- The award and completed answers commit together. Replays and retakes cannot pay twice.
CREATE OR REPLACE FUNCTION public.award_vocab_assignment_xp()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE completed timestamptz;
BEGIN
 IF TG_TABLE_NAME = 'vocab_checks' THEN
  IF NEW.completed_at IS NULL OR jsonb_typeof(NEW.result) IS DISTINCT FROM 'array'
    OR jsonb_array_length(NEW.result) = 0
    OR jsonb_array_length(NEW.result) <> jsonb_array_length(NEW.items) THEN RETURN NEW; END IF;
  completed := NEW.completed_at;
 ELSE
  IF NEW.submitted_at IS NULL THEN RETURN NEW; END IF;
  completed := NEW.submitted_at;
 END IF;
 INSERT INTO public.economy_point_grants(user_id,user_email,source,reference,points,note,dedupe_key,awarded_at)
 SELECT NEW.user_id,s.email,'vocab-assignment',NEW.task_id::text,5,
   'Completed assigned vocabulary work','vocab-assignment:'||NEW.task_id::text||':'||NEW.user_id::text,completed
 FROM public.students s WHERE s.id=NEW.user_id
 ON CONFLICT(dedupe_key) DO NOTHING;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.award_vocab_assignment_xp() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.award_vocab_assignment_xp() TO service_role;
CREATE TRIGGER award_vocab_check_xp AFTER INSERT OR UPDATE OF completed_at ON public.vocab_checks
 FOR EACH ROW EXECUTE FUNCTION public.award_vocab_assignment_xp();
CREATE TRIGGER award_vocab_checkpoint_xp AFTER INSERT OR UPDATE OF submitted_at ON public.vocab_checkpoint_attempts
 FOR EACH ROW EXECUTE FUNCTION public.award_vocab_assignment_xp();

-- Restore the same one-time award for existing completed assignments at their
-- original completion date, so term credit follows the work instead of the repair date.
WITH completed AS (
 SELECT task_id,user_id,completed_at AS earned_at FROM public.vocab_checks
 WHERE completed_at IS NOT NULL AND jsonb_typeof(result)='array'
   AND jsonb_array_length(result)>0 AND jsonb_array_length(result)=jsonb_array_length(items)
 UNION ALL SELECT task_id,user_id,submitted_at FROM public.vocab_checkpoint_attempts WHERE submitted_at IS NOT NULL
), first_completion AS (SELECT task_id,user_id,min(earned_at) earned_at FROM completed GROUP BY task_id,user_id)
INSERT INTO public.economy_point_grants(user_id,user_email,source,reference,points,note,dedupe_key,awarded_at)
SELECT c.user_id,s.email,'vocab-assignment',c.task_id::text,5,
 'Completed assigned vocabulary work','vocab-assignment:'||c.task_id::text||':'||c.user_id::text,c.earned_at
FROM first_completion c JOIN public.students s ON s.id=c.user_id
ON CONFLICT(dedupe_key) DO NOTHING;

-- Same daily allowance as guard_unit_math_xp; do not infer a receipt from a UI promise.
CREATE OR REPLACE FUNCTION public.math_daily_xp_status(p_user uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
 WITH bounds AS (SELECT date_trunc('day',now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' AS midnight),
 earned AS (SELECT coalesce(sum(points),0) points FROM (
  SELECT e.points FROM public.economy_point_grants e,bounds b
   WHERE e.user_id=p_user AND e.source='arcade-payout' AND e.awarded_at>=b.midnight
  UNION ALL SELECT m.points FROM public.math_spine_point_grants m,bounds b
   WHERE m.user_id::text=p_user::text AND m.milestone IN ('practice-rep','warmup-completion') AND m.awarded_at>=b.midnight
 ) grants), policy AS (SELECT math_daily_cap cap FROM public.unit_xp_policy WHERE track=public.student_xp_track(p_user))
 SELECT jsonb_build_object('dailyEarned',e.points,'dailyCap',p.cap,'remaining',greatest(0,p.cap-e.points),
  'resetsAt',b.midnight+interval '1 day') FROM earned e,policy p,bounds b;
$$;
REVOKE ALL ON FUNCTION public.math_daily_xp_status(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.math_daily_xp_status(uuid) TO service_role;
