-- Formative mission evidence is separate from teacher-rated competency records.
CREATE TABLE public.math_mission_assignments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), teacher_email text NOT NULL,
 user_id uuid NOT NULL REFERENCES public.students(id), mission text NOT NULL, code text NOT NULL,
 title text NOT NULL, due_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
 cancelled_at timestamptz, completed_at timestamptz
);
CREATE INDEX math_mission_assignments_student ON public.math_mission_assignments(user_id,created_at DESC) WHERE cancelled_at IS NULL;
CREATE INDEX math_mission_assignments_teacher ON public.math_mission_assignments(teacher_email,created_at DESC);
CREATE TABLE public.math_mission_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, user_email text,
 mission text NOT NULL CHECK(mission IN ('numberline-navigator','ratio-reactor','unit-courier','precision-observatory','balance-bay','motion-mapper','vector-rescue')),
 code text NOT NULL CHECK(code IN ('NS1','NS2','PR1','PR2','QE1','QE2','QE3','QE4','SM1','SM2','GV1','GV2','GV3')),
 mode text NOT NULL CHECK(mode IN ('practice','challenge','retention')), seed integer NOT NULL,
 version integer NOT NULL, revision integer NOT NULL DEFAULT 0, state jsonb NOT NULL,
 status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed')),
 ranked boolean NOT NULL DEFAULT false, staff boolean NOT NULL DEFAULT false, challenge_day date,
 score integer NOT NULL DEFAULT 0 CHECK(score BETWEEN 0 AND 600), xp integer NOT NULL DEFAULT 0 CHECK(xp BETWEEN 0 AND 3),
 assignment_id uuid REFERENCES public.math_mission_assignments(id),
 created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz,
 review_note text, reviewed_at timestamptz, reviewed_by text,
 CHECK(NOT ranked OR (mode='challenge' AND NOT staff AND challenge_day IS NOT NULL))
);
CREATE UNIQUE INDEX math_mission_active ON public.math_mission_sessions(user_id,mission,code,mode) WHERE status='active';
CREATE UNIQUE INDEX math_mission_daily_ranked ON public.math_mission_sessions(user_id,mission,challenge_day) WHERE ranked;
CREATE INDEX math_mission_student_history ON public.math_mission_sessions(user_id,created_at DESC);
CREATE INDEX math_mission_leaderboard ON public.math_mission_sessions(mission,score DESC,completed_at) WHERE ranked AND status='completed' AND NOT staff;
CREATE INDEX math_mission_assignment_sessions ON public.math_mission_sessions(assignment_id) WHERE assignment_id IS NOT NULL;
ALTER TABLE public.math_mission_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.math_mission_assignments ENABLE ROW LEVEL SECURITY;
-- NextAuth identities are authorized in scoped API routes; no direct browser access.
REVOKE ALL ON public.math_mission_sessions,public.math_mission_assignments FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.math_mission_sessions,public.math_mission_assignments TO service_role;

CREATE FUNCTION public.save_math_mission(p_user uuid,p_session uuid,p_revision integer,p_state jsonb,p_complete boolean,p_ranked boolean,p_score integer,p_xp integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE s public.math_mission_sessions; award integer:=0;
BEGIN
 SELECT * INTO s FROM public.math_mission_sessions WHERE id=p_session AND user_id=p_user FOR UPDATE;
 IF NOT FOUND THEN RAISE no_data_found; END IF;
 IF s.status='completed' OR s.revision<>p_revision THEN RETURN to_jsonb(s); END IF;
 IF p_complete AND (jsonb_array_length(p_state->'evidence')<>6 OR (p_state->>'index')::integer<>6) THEN RAISE EXCEPTION 'Incomplete evidence'; END IF;
 IF p_complete AND NOT s.staff THEN
  INSERT INTO public.economy_point_grants(user_id,user_email,source,reference,points,note,dedupe_key)
  VALUES(s.user_id,s.user_email,'arcade-payout',s.mission,least(3,greatest(0,p_xp)),'Math mission completion — '||s.code,'math-mission:'||s.id::text)
  ON CONFLICT(dedupe_key) DO NOTHING RETURNING points INTO award;
  IF award IS NULL THEN SELECT points INTO award FROM public.economy_point_grants WHERE dedupe_key='math-mission:'||s.id::text; END IF;
 END IF;
 UPDATE public.math_mission_sessions SET state=p_state,revision=revision+1,
  ranked=s.ranked AND p_ranked,score=greatest(0,least(600,p_score)),xp=coalesce(award,0),
  status=CASE WHEN p_complete THEN 'completed' ELSE 'active' END,
  completed_at=CASE WHEN p_complete THEN now() ELSE NULL END
 WHERE id=s.id RETURNING * INTO s;
 IF p_complete AND s.assignment_id IS NOT NULL THEN UPDATE public.math_mission_assignments SET completed_at=coalesce(completed_at,now()) WHERE id=s.assignment_id AND user_id=s.user_id; END IF;
 RETURN to_jsonb(s);
END $$;
REVOKE ALL ON FUNCTION public.save_math_mission(uuid,uuid,integer,jsonb,boolean,boolean,integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_math_mission(uuid,uuid,integer,jsonb,boolean,boolean,integer,integer) TO service_role;

CREATE FUNCTION public.math_mission_leaders(p_user uuid)
RETURNS TABLE(mission text,user_id uuid,score integer,rank bigint,period text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 WITH best AS (
  SELECT s.mission,s.user_id,max(s.score)::integer AS score,p.period
  FROM public.math_mission_sessions s CROSS JOIN (VALUES('weekly'),('all-time')) p(period)
  WHERE s.ranked AND NOT s.staff AND s.status='completed' AND s.score>0
   AND (p.period='all-time' OR s.completed_at>=date_trunc('week',now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')
  GROUP BY s.mission,s.user_id,p.period
 ), ranked AS (SELECT b.*,rank() OVER(PARTITION BY b.mission,b.period ORDER BY b.score DESC) AS place FROM best b)
 SELECT r.mission,r.user_id,r.score,r.place,r.period FROM ranked r WHERE r.place<=5 OR r.user_id=p_user ORDER BY r.mission,r.period,r.place,r.user_id;
$$;
REVOKE ALL ON FUNCTION public.math_mission_leaders(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.math_mission_leaders(uuid) TO service_role;

-- One ranked Mathle run per UTC day; the cabinet's explicit practice mode remains unlimited.
CREATE TABLE public.mathle_daily_claims(user_id uuid NOT NULL REFERENCES public.students(id),day date NOT NULL,play_id uuid,PRIMARY KEY(user_id,day));
ALTER TABLE public.mathle_daily_claims ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mathle_daily_claims FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.mathle_daily_claims TO service_role;
CREATE FUNCTION public.purchase_mathle_daily(p_user_id uuid,p_email text,p_staff boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE receipt jsonb; today date:=(now() AT TIME ZONE 'UTC')::date;
BEGIN
 IF NOT p_staff THEN INSERT INTO public.mathle_daily_claims(user_id,day) VALUES(p_user_id,today); END IF;
 receipt:=public.purchase_arcade_play(p_user_id,p_email,'mathle',p_staff);
 IF NOT p_staff THEN UPDATE public.mathle_daily_claims SET play_id=(receipt->>'playId')::uuid WHERE user_id=p_user_id AND day=today; END IF;
 RETURN receipt;
END $$;
REVOKE ALL ON FUNCTION public.purchase_mathle_daily(uuid,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_mathle_daily(uuid,text,boolean) TO service_role;
