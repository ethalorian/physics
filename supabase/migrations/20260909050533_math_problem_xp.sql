-- Each issued problem earns XP once in the existing shared economy.
ALTER TABLE public.math_spine_point_grants DROP CONSTRAINT IF EXISTS math_spine_point_grants_milestone_check;
ALTER TABLE public.math_spine_point_grants ADD CONSTRAINT math_spine_point_grants_milestone_check CHECK (milestone IN ('levelup-almost','competency-fluent','strand-complete','spotlight','practice-rep','warmup-completion'));
CREATE TABLE public.math_practice_instances (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id text NOT NULL,
 item jsonb NOT NULL, checking jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.math_practice_instances(user_id);
ALTER TABLE public.math_practice_instances ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.math_practice_instances FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.math_practice_instances TO service_role;
CREATE OR REPLACE FUNCTION public.submit_math_warmup(p_instance uuid, p_user text, p_email text, p_response jsonb, p_summary text, p_check text, p_tag text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE inst math_warmup_instances; existing math_warmup_submissions; saved math_warmup_submissions;
  submission_user public.math_warmup_submissions.user_id%TYPE := p_user; grant_user public.math_spine_point_grants.user_id%TYPE := p_user; awarded integer;
BEGIN
  SELECT * INTO STRICT inst FROM math_warmup_instances WHERE id=p_instance AND user_id=p_user FOR UPDATE;
  -- All original submissions for the issued school day share this lock.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user || ':' || inst.school_day::text, 0));
  SELECT * INTO existing FROM math_warmup_submissions
    WHERE user_id=submission_user AND (instance_id=p_instance OR (submitted_at AT TIME ZONE 'America/New_York')::date=inst.school_day)
    ORDER BY submitted_at LIMIT 1;
  IF FOUND THEN RETURN to_jsonb(existing) || jsonb_build_object('xpAwarded',0,'xpEarned',COALESCE((SELECT points FROM math_spine_point_grants WHERE dedupe_key='warmup-xp:'||existing.id::text),0)); END IF;
  INSERT INTO math_warmup_submissions(user_id,user_email,competency_id,spiral_item_id,prompt,response,response_json,status,tested_competency_ids,rated_competency_ids,self_check,misconception_tag,instance_id)
    VALUES(submission_user,p_email,(inst.item->>'competencyId')::uuid,(inst.item->>'spiralItemId')::uuid,inst.item->>'prompt',p_summary,p_response,'pending',ARRAY[(inst.item->>'competencyId')::uuid],ARRAY[]::uuid[],p_check,p_tag,p_instance)
    RETURNING * INTO saved;
  INSERT INTO math_spine_point_grants(user_id,user_email,milestone,competency_id,points,note,dedupe_key)
    VALUES(grant_user,p_email,'warmup-completion',saved.competency_id,1,'Daily math problem completed','warmup-xp:'||saved.id::text) RETURNING points INTO awarded;
  RETURN to_jsonb(saved) || jsonb_build_object('xpAwarded',awarded,'xpEarned',awarded);
END $$;


CREATE OR REPLACE FUNCTION public.award_math_practice_xp(p_instance uuid,p_user text,p_email text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE inst math_practice_instances; awarded integer := 0; earned integer; grant_user public.math_spine_point_grants.user_id%TYPE := p_user;
BEGIN
 SELECT * INTO STRICT inst FROM math_practice_instances WHERE id=p_instance AND user_id=p_user FOR UPDATE;
 INSERT INTO math_spine_point_grants(user_id,user_email,milestone,competency_id,points,note,dedupe_key)
 VALUES(grant_user,p_email,'practice-rep',(inst.item->>'competencyId')::uuid,1,'Math practice problem solved','practice-xp:'||inst.id::text)
 ON CONFLICT(dedupe_key) DO NOTHING RETURNING points INTO awarded;
 SELECT points INTO earned FROM math_spine_point_grants WHERE dedupe_key='practice-xp:'||inst.id::text;
 RETURN jsonb_build_object('xpAwarded',COALESCE(awarded,0),'xpEarned',earned);
END $$;
REVOKE ALL ON FUNCTION public.award_math_practice_xp(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.award_math_practice_xp(uuid,text,text) TO service_role;
REVOKE ALL ON FUNCTION public.submit_math_warmup(uuid,text,text,jsonb,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_math_warmup(uuid,text,text,jsonb,text,text,text) TO service_role;
