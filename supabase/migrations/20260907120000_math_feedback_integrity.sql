-- Additive math evidence repairs. API routes authorize the actor; these RPCs
-- are executable by service_role only and run as invoker (never SECURITY DEFINER).
CREATE TABLE IF NOT EXISTS public.math_warmup_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  school_day date NOT NULL,
  item jsonb NOT NULL,
  checking jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, school_day)
);
ALTER TABLE public.math_warmup_instances ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.math_warmup_instances FROM anon, authenticated;
GRANT ALL ON public.math_warmup_instances TO service_role;

ALTER TABLE public.math_warmup_submissions
  ADD COLUMN IF NOT EXISTS instance_id uuid REFERENCES public.math_warmup_instances(id),
  ADD COLUMN IF NOT EXISTS revision_requested boolean NOT NULL DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS math_warmup_instance_once ON public.math_warmup_submissions(instance_id) WHERE instance_id IS NOT NULL;
ALTER TABLE public.math_competency_records
  ADD COLUMN IF NOT EXISTS submission_id uuid REFERENCES public.math_warmup_submissions(id);
CREATE UNIQUE INDEX IF NOT EXISTS math_observation_submission_once ON public.math_competency_records(submission_id) WHERE submission_id IS NOT NULL;
ALTER TABLE public.teacher_feedback
  ADD COLUMN IF NOT EXISTS submission_id uuid REFERENCES public.math_warmup_submissions(id);
CREATE UNIQUE INDEX IF NOT EXISTS math_feedback_submission_once ON public.teacher_feedback(submission_id) WHERE submission_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.math_warmup_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL UNIQUE REFERENCES public.math_warmup_submissions(id),
  user_id text NOT NULL,
  response_json jsonb NOT NULL,
  message text NOT NULL CHECK(char_length(message) BETWEEN 1 AND 2000),
  needs_help boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','acknowledged')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz,
  acknowledged_by text,
  teacher_reply text
);
ALTER TABLE public.math_warmup_revisions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.math_warmup_revisions FROM anon, authenticated;
GRANT ALL ON public.math_warmup_revisions TO service_role;
CREATE INDEX IF NOT EXISTS math_revision_queue ON public.math_warmup_revisions(user_id, status, submitted_at);

CREATE OR REPLACE FUNCTION public.submit_math_warmup(p_instance uuid, p_user text, p_email text, p_response jsonb, p_summary text, p_check text, p_tag text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE inst math_warmup_instances; existing math_warmup_submissions; saved math_warmup_submissions;
BEGIN
  SELECT * INTO STRICT inst FROM math_warmup_instances WHERE id=p_instance AND user_id=p_user FOR UPDATE;
  -- All original submissions for the issued school day share this lock.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user || ':' || inst.school_day::text, 0));
  SELECT * INTO existing FROM math_warmup_submissions
    WHERE user_id=p_user AND (instance_id=p_instance OR (submitted_at AT TIME ZONE 'America/New_York')::date=inst.school_day)
    ORDER BY submitted_at LIMIT 1;
  IF FOUND THEN RETURN to_jsonb(existing); END IF;
  INSERT INTO math_warmup_submissions(user_id,user_email,competency_id,spiral_item_id,prompt,response,response_json,status,tested_competency_ids,rated_competency_ids,self_check,misconception_tag,instance_id)
    VALUES(p_user,p_email,(inst.item->>'competencyId')::uuid,(inst.item->>'spiralItemId')::uuid,inst.item->>'prompt',p_summary,p_response,'pending',ARRAY[(inst.item->>'competencyId')::uuid],ARRAY[]::uuid[],p_check,p_tag,p_instance)
    RETURNING * INTO saved;
  RETURN to_jsonb(saved);
END $$;

CREATE OR REPLACE FUNCTION public.review_math_warmup(p_submission uuid, p_teacher text, p_level smallint, p_message text, p_revision boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE sub math_warmup_submissions;
BEGIN
  SELECT * INTO STRICT sub FROM math_warmup_submissions WHERE id=p_submission FOR UPDATE;
  IF sub.status <> 'pending' THEN RETURN jsonb_build_object('resolved',true,'replayed',true); END IF;
  IF p_level IS NOT NULL AND p_level NOT IN (1,2,3) THEN RAISE EXCEPTION 'Invalid rating'; END IF;
  IF p_level IS NULL AND NOT p_revision THEN RAISE EXCEPTION 'Select a rating or request more evidence'; END IF;
  IF p_revision AND length(trim(coalesce(p_message,'')))=0 THEN RAISE EXCEPTION 'A revision needs a next step'; END IF;
  IF length(coalesce(p_message,''))>2000 THEN RAISE EXCEPTION 'Feedback too long'; END IF;
  IF p_level IS NOT NULL THEN
    INSERT INTO math_competency_records(user_id,user_email,competency_id,level,observed_at,evidence_source,submission_id)
      VALUES(sub.user_id,sub.user_email,sub.competency_id,p_level,sub.submitted_at,'warm-up',sub.id);
  END IF;
  IF length(trim(coalesce(p_message,'')))>0 THEN
    INSERT INTO teacher_feedback(user_id,teacher_email,competency_id,message,submission_id)
      VALUES(sub.user_id,p_teacher,sub.competency_id,trim(p_message),sub.id);
  END IF;
  UPDATE math_warmup_submissions SET status='reviewed',resulting_level=p_level,
    rated_competency_ids=CASE WHEN p_level IS NULL THEN ARRAY[]::uuid[] ELSE ARRAY[sub.competency_id] END,
    reviewed_by=p_teacher,reviewed_at=now(),revision_requested=p_revision WHERE id=sub.id;
  RETURN jsonb_build_object('resolved',true,'replayed',false);
END $$;

REVOKE ALL ON FUNCTION public.submit_math_warmup(uuid,text,text,jsonb,text,text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.review_math_warmup(uuid,text,smallint,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_math_warmup(uuid,text,text,jsonb,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.review_math_warmup(uuid,text,smallint,text,boolean) TO service_role;

-- Repair only the exact repository-authored template; retain the item ID.
UPDATE public.math_spiral_items SET prompt='A movie is {a} minutes long. Express its duration in decimal hours.',
  translations='{}'::jsonb, template=jsonb_set(template,'{answerUnit}','"h"'::jsonb)
  WHERE prompt='A movie is {a} minutes long. Express that in hours and minutes.' AND template->>'answer'='a/60';

REVOKE INSERT, UPDATE, DELETE ON public.math_warmup_submissions, public.math_competency_records FROM anon, authenticated;
