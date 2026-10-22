-- Reading completion uses the existing economy, once per student/assignment.
-- This runs inside textbook_student_action's transaction: no award for a draft,
-- failed submission, local practice check, page view, retry, or resubmission.
CREATE OR REPLACE FUNCTION public.award_reading_assignment_xp()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
 INSERT INTO public.economy_point_grants(user_id,user_email,source,reference,points,note,dedupe_key,awarded_at)
 SELECT NEW.user_id,s.email,'reading-assignment',NEW.assignment_id::text,5,
   'Submitted assigned reading explanations',
   'reading-assignment:'||NEW.assignment_id::text||':'||NEW.user_id::text,NEW.submitted_at
 FROM public.students s WHERE s.id=NEW.user_id
 ON CONFLICT(dedupe_key) DO NOTHING;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.award_reading_assignment_xp() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.award_reading_assignment_xp() TO service_role;
CREATE TRIGGER award_reading_submission_xp AFTER INSERT ON public.textbook_submissions
 FOR EACH ROW EXECUTE FUNCTION public.award_reading_assignment_xp();

-- Credit prior completed work once at its original submission date, consistent
-- with vocabulary receipts. Existing mastery evidence is never modified.
WITH first_submission AS (
 SELECT assignment_id,user_id,min(submitted_at) earned_at
 FROM public.textbook_submissions GROUP BY assignment_id,user_id
)
INSERT INTO public.economy_point_grants(user_id,user_email,source,reference,points,note,dedupe_key,awarded_at)
SELECT c.user_id,s.email,'reading-assignment',c.assignment_id::text,5,
 'Submitted assigned reading explanations',
 'reading-assignment:'||c.assignment_id::text||':'||c.user_id::text,c.earned_at
FROM first_submission c JOIN public.students s ON s.id=c.user_id
ON CONFLICT(dedupe_key) DO NOTHING;
