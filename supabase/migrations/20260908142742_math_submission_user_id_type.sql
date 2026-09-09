-- Support production UUID IDs and legacy text IDs without changing ownership or retry semantics.
CREATE OR REPLACE FUNCTION public.submit_math_warmup(p_instance uuid, p_user text, p_email text, p_response jsonb, p_summary text, p_check text, p_tag text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE inst math_warmup_instances; existing math_warmup_submissions; saved math_warmup_submissions;
  submission_user public.math_warmup_submissions.user_id%TYPE := p_user;
BEGIN
  SELECT * INTO STRICT inst FROM math_warmup_instances WHERE id=p_instance AND user_id=p_user FOR UPDATE;
  -- All original submissions for the issued school day share this lock.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user || ':' || inst.school_day::text, 0));
  SELECT * INTO existing FROM math_warmup_submissions
    WHERE user_id=submission_user AND (instance_id=p_instance OR (submitted_at AT TIME ZONE 'America/New_York')::date=inst.school_day)
    ORDER BY submitted_at LIMIT 1;
  IF FOUND THEN RETURN to_jsonb(existing); END IF;
  INSERT INTO math_warmup_submissions(user_id,user_email,competency_id,spiral_item_id,prompt,response,response_json,status,tested_competency_ids,rated_competency_ids,self_check,misconception_tag,instance_id)
    VALUES(submission_user,p_email,(inst.item->>'competencyId')::uuid,(inst.item->>'spiralItemId')::uuid,inst.item->>'prompt',p_summary,p_response,'pending',ARRAY[(inst.item->>'competencyId')::uuid],ARRAY[]::uuid[],p_check,p_tag,p_instance)
    RETURNING * INTO saved;
  RETURN to_jsonb(saved);
END $$;

