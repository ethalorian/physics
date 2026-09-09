-- Keep accounting inputs stable while freezing the previous economy.
LOCK TABLE public.lesson_progress,public.economy_point_grants,public.math_spine_point_grants,public.vocabulary_game_scores,public.submissions,public.reward_redemptions IN SHARE ROW EXCLUSIVE MODE;
CREATE TEMP TABLE xp_balances_before ON COMMIT DROP AS SELECT id,public.economy_totals(id) totals FROM public.students;
-- Unit XP v2. Preserve earned balances; replace future progress stipends with evidence.
CREATE TABLE public.unit_xp_policy (
 track text PRIMARY KEY CHECK(track IN ('cpa','honors')),
 lesson_target integer NOT NULL CHECK(lesson_target>0),
 math_target integer NOT NULL CHECK(math_target>0),
 math_daily_cap integer NOT NULL CHECK(math_daily_cap>0),
 effective_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.unit_xp_policy(track,lesson_target,math_target,math_daily_cap) VALUES ('cpa',500,200,10),('honors',650,250,15);
ALTER TABLE public.unit_xp_policy ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.unit_xp_policy FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.unit_xp_policy TO service_role;
ALTER TABLE public.economy_point_grants ADD COLUMN unit_id text;
ALTER TABLE public.math_spine_point_grants ADD COLUMN unit_id text;
CREATE INDEX economy_unit_rewards ON public.economy_point_grants(user_id,unit_id,source);
CREATE INDEX math_unit_rewards ON public.math_spine_point_grants(user_id,unit_id);
CREATE FUNCTION public.lesson_xp_capture(b jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT coalesce(b->>'type' IN ('exit_ticket','transfer_prompt','sketch','lab_notebook','observation','marzano','self_assessment','equation_sandbox','gewa','data_table','concept_exercise','question') OR (b->>'type'='sentence_frame' AND b->'capture'='true'::jsonb),false);
$$;
CREATE FUNCTION public.lesson_xp_amount(b jsonb) RETURNS integer
LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
BEGIN
 IF NOT public.lesson_xp_capture(b) THEN RETURN 0; END IF;
 IF jsonb_typeof(b->'xp')='number' AND (b->>'xp')::numeric>=1 AND (b->>'xp')::numeric<=2147483647 THEN RETURN round((b->>'xp')::numeric)::integer; END IF;
 RETURN 5;
END $$;
CREATE FUNCTION public.lesson_xp_array(v jsonb) RETURNS jsonb
LANGUAGE sql IMMUTABLE SET search_path='' AS $$ SELECT CASE WHEN jsonb_typeof(v)='array' THEN v ELSE '[]'::jsonb END $$;
CREATE FUNCTION public.lesson_xp_object(v jsonb) RETURNS jsonb
LANGUAGE sql IMMUTABLE SET search_path='' AS $$ SELECT CASE WHEN jsonb_typeof(v)='object' THEN v ELSE '{}'::jsonb END $$;
CREATE FUNCTION public.lesson_xp_text(v jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path='' AS $$ SELECT coalesce(jsonb_typeof(v)='string' AND length(btrim(v#>>'{}'))>0,false) $$;
CREATE FUNCTION public.lesson_xp_rating(v jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
BEGIN
 IF jsonb_typeof(v)<>'number' OR v IS NULL THEN RETURN false; END IF;
 RETURN (v#>>'{}')::numeric BETWEEN 0 AND 3 AND trunc((v#>>'{}')::numeric)=(v#>>'{}')::numeric;
END $$;
CREATE FUNCTION public.lesson_xp_drawing(v jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM jsonb_array_elements(public.lesson_xp_array(v)) stroke WHERE jsonb_array_length(public.lesson_xp_array(stroke->'points'))>0);
$$;
CREATE FUNCTION public.lesson_xp_substantive(v jsonb,b jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
DECLARE answer text;
BEGIN
 IF v->>'mode'='sketch' THEN RETURN public.lesson_xp_drawing(v->'strokes'); END IF;
 IF jsonb_typeof(v)='string' THEN answer:=btrim(v#>>'{}'); ELSE
   IF NOT public.lesson_xp_text(v->'text') THEN RETURN false; END IF;
   answer:=btrim(v->>'text');
 END IF;
 IF answer IS NULL OR answer='' OR answer ~ '_{2,}' OR answer=btrim(b->>'frame') THEN RETURN false; END IF;
 RETURN NOT EXISTS(SELECT 1 FROM jsonb_array_elements(public.lesson_xp_array(b#>'{sei,frames}')) f WHERE btrim(f->>'text')=answer);
END $$;
-- Mirrors RESPONSE_RULES in block-registry.ts; tested against the same response fixtures.
CREATE FUNCTION public.lesson_xp_complete(b jsonb,r jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
DECLARE t text:=b->>'type'; q jsonb:=b->'question'; ids jsonb; row_value jsonb;
  cols integer; required_rows integer; valid_rows integer:=0; xi integer; yi integer; numeric_rows boolean; choice boolean;
BEGIN
 IF NOT public.lesson_xp_capture(b) THEN RETURN false; END IF;
 CASE t
 WHEN 'exit_ticket','transfer_prompt','sentence_frame' THEN RETURN public.lesson_xp_substantive(r,b);
 WHEN 'sketch' THEN RETURN public.lesson_xp_drawing(r->'strokes') OR public.lesson_xp_text(r->'text');
 WHEN 'lab_notebook' THEN
   IF b->'requireAllFields'='true'::jsonb THEN
     ids:=public.lesson_xp_array(b->'fields'); IF jsonb_array_length(ids)=0 THEN ids:='["What I did","What I observed","What it means"]'; END IF;
     RETURN NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(ids) field WHERE NOT public.lesson_xp_text(r->'fields'->field));
   END IF;
   RETURN public.lesson_xp_drawing(r->'strokes') OR EXISTS(SELECT 1 FROM jsonb_each(public.lesson_xp_object(r->'fields')) f WHERE public.lesson_xp_text(f.value));
 WHEN 'observation' THEN RETURN public.lesson_xp_substantive(jsonb_build_object('text',r->'pattern'),b) AND public.lesson_xp_substantive(jsonb_build_object('text',r->'interpret'),b);
 WHEN 'marzano' THEN RETURN public.lesson_xp_rating(r);
 WHEN 'self_assessment' THEN
   ids:=public.lesson_xp_array(b->'targetIds');
   RETURN jsonb_array_length(ids)>0 AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(ids) id WHERE NOT public.lesson_xp_rating(r->id));
 WHEN 'equation_sandbox' THEN RETURN EXISTS(SELECT 1 FROM jsonb_array_elements(public.lesson_xp_array(r->'lines')) v WHERE public.lesson_xp_text(v));
 WHEN 'gewa' THEN
   IF NOT public.lesson_xp_text(r->'answer') OR NOT (public.lesson_xp_text(r->'equationId') OR public.lesson_xp_text(r->'equation')) THEN RETURN false; END IF;
   IF b->'requireCompleteWork'='true'::jsonb THEN RETURN public.lesson_xp_text(r->'given') AND regexp_replace(r->>'answer','[eE][+-]?\d+','','g') ~ '[a-zA-Z°%]' AND (public.lesson_xp_text(r->'work') OR public.lesson_xp_object(r->'substitutions')<>'{}'::jsonb); END IF;
   RETURN true;
 WHEN 'data_table' THEN
   cols:=jsonb_array_length(public.lesson_xp_array(b->'columns')); required_rows:=coalesce((b->>'minRows')::integer,1); xi:=coalesce((b->>'xCol')::integer,0); yi:=coalesce((b->>'yCol')::integer,1); numeric_rows:=coalesce((b->>'plot')::boolean,cols>=2);
   FOR row_value IN SELECT value FROM jsonb_array_elements(public.lesson_xp_array(r->'rows')) LOOP
     IF jsonb_typeof(row_value)='array' AND jsonb_array_length(row_value)>=cols AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(row_value) cell WHERE NOT public.lesson_xp_text(cell)) THEN
       IF NOT numeric_rows OR (btrim(row_value->>xi) ~ '^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)([eE][+-]?[0-9]+)?$' AND btrim(row_value->>yi) ~ '^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)([eE][+-]?[0-9]+)?$') THEN
         IF NOT numeric_rows OR (abs((row_value->>xi)::numeric)<=1.7976931348623157e308 AND abs((row_value->>yi)::numeric)<=1.7976931348623157e308) THEN valid_rows:=valid_rows+1; END IF;
       END IF;
     END IF;
   END LOOP;
   RETURN valid_rows>=required_rows AND public.lesson_xp_text(r->'pattern') AND public.lesson_xp_text(r->'interpret');
 WHEN 'concept_exercise' THEN RETURN coalesce(r->'submitted'='true'::jsonb AND (r#>>'{summary,itemCount}')::numeric>0 AND r#>'{summary,answeredCount}'=r#>'{summary,itemCount}',false);
 WHEN 'question' THEN
   choice:=jsonb_array_length(public.lesson_xp_array(q->'options'))>0 OR r->>'mode'='choice' OR public.lesson_xp_text(r->'optionId');
   IF choice THEN
     IF NOT public.lesson_xp_text(r->'optionId') THEN RETURN false; END IF;
     IF jsonb_array_length(public.lesson_xp_array(q->'options'))>0 AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(q->'options') o WHERE o->'id'=r->'optionId') THEN RETURN false; END IF;
     RETURN NOT public.lesson_xp_text(q->'explain') OR public.lesson_xp_substantive(jsonb_build_object('text',r->'explain'),b);
   END IF;
   RETURN public.lesson_xp_substantive(jsonb_build_object('text',r->'explain'),b);
 ELSE RETURN false;
 END CASE;
EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN RETURN false;
END $$;


CREATE FUNCTION public.student_xp_track(p_user uuid) RETURNS text LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT CASE WHEN EXISTS(SELECT 1 FROM public.course_students cs JOIN public.courses c ON c.id=cs.course_id WHERE cs.student_id=p_user AND c.track='honors') THEN 'honors' ELSE 'cpa' END;
$$;
CREATE FUNCTION public.student_xp_program(p_user uuid) RETURNS text LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT CASE WHEN bool_or(c.program='trades') THEN 'trades' WHEN bool_or(c.program='projects') THEN 'projects' ELSE 'physics' END FROM public.course_students cs JOIN public.courses c ON c.id=cs.course_id WHERE cs.student_id=p_user;
$$;
-- Divide the published assigned evidence pool into positive whole-number rewards.
-- Stable ordering gives the remainder to the first blocks; CPA and Honors have separate pools.
CREATE FUNCTION public.lesson_reward_schedule(p_unit text,p_track text) RETURNS TABLE(lesson_id uuid,block_id text,xp integer)
LANGUAGE sql STABLE SET search_path='' AS $$
 WITH evidence AS (
 SELECT l.id lesson_id,b->>'id' block_id,row_number() OVER(ORDER BY l.lesson_number NULLS LAST,l.slug,l.id,ordinality) n,count(*) OVER() total
 FROM public.lessons l CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(l.content_blocks->'blocks')='array' THEN l.content_blocks->'blocks' ELSE '[]'::jsonb END) WITH ORDINALITY blocks(b,ordinality)
 WHERE l.unit_id=p_unit AND l.published AND (nullif(l.visibility_track,'') IS NULL OR l.visibility_track=p_track)
 AND (nullif(b->>'visibilityTrack','') IS NULL OR b->>'visibilityTrack'=p_track) AND public.lesson_xp_capture(b)
 ), budget AS (SELECT lesson_target FROM public.unit_xp_policy WHERE track=CASE WHEN p_track='honors' THEN 'honors' ELSE 'cpa' END)
 SELECT e.lesson_id,e.block_id,greatest(1,(budget.lesson_target/e.total)::integer+CASE WHEN e.n<=budget.lesson_target%e.total THEN 1 ELSE 0 END) FROM evidence e CROSS JOIN budget;
$$;
CREATE FUNCTION public.lesson_reward_map(p_lesson uuid,p_track text) RETURNS jsonb LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT coalesce(jsonb_object_agg(s.block_id,s.xp),'{}'::jsonb) FROM public.lessons l CROSS JOIN LATERAL public.lesson_reward_schedule(l.unit_id,p_track) s WHERE l.id=p_lesson AND s.lesson_id=l.id;
$$;
CREATE FUNCTION public.student_current_xp_unit(p_user uuid) RETURNS text LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT u.id FROM public.units u
 LEFT JOIN (SELECT l.unit_id,max(p.last_accessed_at) visited FROM public.lesson_progress p JOIN public.lessons l ON l.id=p.lesson_id WHERE p.user_id=p_user GROUP BY l.unit_id) recent ON recent.unit_id=u.id
 WHERE u.program=public.student_xp_program(p_user) AND EXISTS(SELECT 1 FROM public.lessons l WHERE l.unit_id=u.id AND l.published AND (nullif(l.visibility_track,'') IS NULL OR l.visibility_track=public.student_xp_track(p_user)))
 ORDER BY recent.visited DESC NULLS LAST,u.order_index,u.id LIMIT 1;
$$;
-- Existing evidence grants retain their value and gain attribution for transparent progress.
UPDATE public.economy_point_grants g SET unit_id=l.unit_id FROM public.lessons l WHERE g.source='lesson-block' AND split_part(g.reference,':',1)=l.id::text;
-- Freeze the old progress/video component into immutable grants at its original earning date.
INSERT INTO public.economy_point_grants(user_id,user_email,source,reference,points,note,dedupe_key,awarded_at,unit_id)
 SELECT p.user_id,p.user_email,'legacy-lesson-progress',p.lesson_id::text,
 round(coalesce(p.progress_percentage,0)::numeric/4)+5*coalesce(p.video_questions_correct,0),
 'Previously earned lesson progress XP retained at economy change','legacy-progress-v2:'||p.id::text,
 coalesce(p.completed_at,p.last_accessed_at,p.created_at,now()),l.unit_id
 FROM public.lesson_progress p LEFT JOIN public.lessons l ON l.id=p.lesson_id
 WHERE round(coalesce(p.progress_percentage,0)::numeric/4)+5*coalesce(p.video_questions_correct,0)>0
 ON CONFLICT(dedupe_key) DO NOTHING;

ALTER TABLE public.block_responses ADD COLUMN xp_awarded integer NOT NULL DEFAULT 0 CHECK(xp_awarded>=0);
CREATE FUNCTION public.award_lesson_evidence_xp() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE b jsonb; reward integer; granted integer; unit_key text; block_key text:=new.block_id; block_type_key text:=new.block_type; track_key text;
BEGIN
 new.xp_awarded:=0;
 IF current_user IN ('anon','authenticated') OR new.lesson_id IS NULL THEN RETURN new; END IF;
 -- Shared lesson artifacts use the authored block's reward identity, avoiding a second payout.
 IF new.block_id LIKE 'lobby:%' AND new.evidence_source='lobby' THEN
   SELECT s.block_id INTO block_key FROM public.lobby_sessions s WHERE s.id=new.session_id AND s.lesson_id=new.lesson_id;
   block_type_key:=regexp_replace(new.block_type,'^lobby_','');
 END IF;
 SELECT value,l.unit_id INTO b,unit_key FROM public.lessons l CROSS JOIN LATERAL jsonb_array_elements(l.content_blocks->'blocks') WHERE l.id=new.lesson_id AND value->>'id'=block_key LIMIT 1;
 IF b IS NULL OR b->>'type' IS DISTINCT FROM block_type_key OR NOT public.lesson_xp_complete(b,new.response) THEN RETURN new; END IF;
 track_key:=public.student_xp_track(new.user_id);
 SELECT s.xp INTO reward FROM public.lesson_reward_schedule(unit_key,track_key) s WHERE s.lesson_id=new.lesson_id AND s.block_id=block_key;
 IF reward IS NULL THEN RETURN new; END IF;
 INSERT INTO public.economy_point_grants(user_id,user_email,source,reference,points,note,dedupe_key,unit_id)
 VALUES(new.user_id,new.user_email,'lesson-block',new.lesson_id::text||':'||block_key,reward,'Completed lesson evidence · '||block_type_key,'block-xp:'||new.lesson_id::text||':'||block_key||':'||new.user_id::text,unit_key)
 ON CONFLICT(dedupe_key) DO NOTHING RETURNING points INTO granted;
 new.xp_awarded:=coalesce(granted,0);
 RETURN new;
END $$;
CREATE TRIGGER reward_lesson_evidence_xp BEFORE INSERT OR UPDATE OF response ON public.block_responses FOR EACH ROW EXECUTE FUNCTION public.award_lesson_evidence_xp();

-- Both math-game and per-problem grants share a locked daily allowance.
CREATE FUNCTION public.guard_unit_math_xp() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE cap integer; earned integer; midnight timestamptz:=date_trunc('day',now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
BEGIN
 IF (tg_table_name='economy_point_grants' AND to_jsonb(new)->>'source'<>'arcade-payout') OR (tg_table_name='math_spine_point_grants' AND to_jsonb(new)->>'milestone' NOT IN ('practice-rep','warmup-completion')) THEN RETURN new; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('math-xp:'||new.user_id::text||':'||midnight::text,0));
 SELECT math_daily_cap INTO cap FROM public.unit_xp_policy WHERE track=public.student_xp_track(new.user_id::uuid);
 SELECT coalesce((SELECT sum(points) FROM public.economy_point_grants WHERE user_id=new.user_id::uuid AND source='arcade-payout' AND awarded_at>=midnight),0)+coalesce((SELECT sum(points) FROM public.math_spine_point_grants WHERE user_id::text=new.user_id::text AND milestone IN ('practice-rep','warmup-completion') AND awarded_at>=midnight),0) INTO earned;
 new.points:=greatest(0,least(new.points,cap-earned));
 new.unit_id:=public.student_current_xp_unit(new.user_id::uuid);
 RETURN new;
END $$;
CREATE TRIGGER unit_math_xp BEFORE INSERT ON public.economy_point_grants FOR EACH ROW EXECUTE FUNCTION public.guard_unit_math_xp();
CREATE TRIGGER unit_math_xp BEFORE INSERT ON public.math_spine_point_grants FOR EACH ROW EXECUTE FUNCTION public.guard_unit_math_xp();

-- One earning calculation serves balances, period rankings and goals.
CREATE FUNCTION public.economy_earning_events() RETURNS TABLE(user_id uuid,user_email text,source text,points numeric,earned_at timestamptz,unit_id text)
LANGUAGE sql STABLE SET search_path='' AS $$
 WITH cutoff AS(SELECT min(effective_at) at FROM public.unit_xp_policy), game_days AS(
 SELECT g.user_id,max(g.user_email) email,(g.created_at AT TIME ZONE 'UTC')::date d,
 sum(least(25,floor(coalesce(g.score,0)::numeric/10+.5))) FILTER(WHERE g.created_at<cutoff.at) old_points,
 sum(least(25,floor(coalesce(g.score,0)::numeric/10+.5))) FILTER(WHERE g.created_at>=cutoff.at) new_points
 FROM public.vocabulary_game_scores g CROSS JOIN cutoff GROUP BY g.user_id,(g.created_at AT TIME ZONE 'UTC')::date)
 SELECT g.user_id,g.email,'vocabulary',least(25,coalesce(g.old_points,0))+least(greatest(0,5-least(25,coalesce(g.old_points,0))),coalesce(g.new_points,0)),g.d::timestamp AT TIME ZONE 'UTC',NULL::text FROM game_days g
 UNION ALL SELECT s.user_id,st.email,'graded-assignment',least(40,coalesce(s.score,0))::numeric,s.graded_at,NULL::text FROM public.submissions s LEFT JOIN public.students st ON st.id=s.user_id WHERE s.status='graded'
 UNION ALL SELECT m.user_id::uuid,m.user_email,'math-spine',m.points::numeric,m.awarded_at,m.unit_id FROM public.math_spine_point_grants m
 UNION ALL SELECT e.user_id,e.user_email,e.source,e.points::numeric,e.awarded_at,e.unit_id FROM public.economy_point_grants e;
$$;
CREATE OR REPLACE FUNCTION public.economy_totals(p_user_id uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 WITH earned AS(SELECT floor(coalesce(sum(points),0)+.5) n FROM public.economy_earning_events() WHERE user_id=p_user_id), spent AS(SELECT coalesce(sum(cost_points),0) n FROM public.reward_redemptions WHERE user_id=p_user_id AND status IS DISTINCT FROM 'denied')
 SELECT jsonb_build_object('lifetimeEarned',earned.n,'spent',spent.n,'balance',earned.n-spent.n) FROM earned,spent;
$$;
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_since timestamptz DEFAULT NULL,p_limit integer DEFAULT 50)
RETURNS TABLE(user_id text,user_email text,total_points numeric,games integer,lessons integer,assignments integer,games_pts numeric,lessons_pts numeric,graded_pts numeric,math_pts numeric,arcade_pts numeric,spin_pts numeric,other_pts numeric,arcade_runs integer,spins integer,math_grants integer)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT e.user_id::text,max(e.user_email),floor(sum(e.points)+.5),
 (SELECT count(*)::integer FROM public.vocabulary_game_scores g WHERE g.user_id=e.user_id AND (p_since IS NULL OR g.created_at>=p_since)),(SELECT count(DISTINCT split_part(g.reference,':',1))::integer FROM public.economy_point_grants g WHERE g.user_id=e.user_id AND g.source IN ('lesson-block','legacy-lesson-progress') AND (p_since IS NULL OR g.awarded_at>=p_since)),count(*) FILTER(WHERE source='graded-assignment')::integer,
 coalesce(sum(points) FILTER(WHERE source='vocabulary'),0),coalesce(sum(points) FILTER(WHERE source IN ('lesson-block','legacy-lesson-progress')),0),coalesce(sum(points) FILTER(WHERE source='graded-assignment'),0),coalesce(sum(points) FILTER(WHERE source='math-spine'),0),coalesce(sum(points) FILTER(WHERE source='arcade-payout'),0),coalesce(sum(points) FILTER(WHERE source='daily-spin'),0),coalesce(sum(points) FILTER(WHERE source NOT IN ('vocabulary','lesson-block','legacy-lesson-progress','graded-assignment','math-spine','arcade-payout','daily-spin')),0),
 count(*) FILTER(WHERE source='arcade-payout')::integer,count(*) FILTER(WHERE source='daily-spin')::integer,count(*) FILTER(WHERE source='math-spine')::integer
 FROM public.economy_earning_events() e WHERE (p_since IS NULL OR earned_at>=p_since) AND points>0 GROUP BY e.user_id ORDER BY sum(e.points) DESC,e.user_id LIMIT greatest(1,least(p_limit,10000));
$$;
CREATE FUNCTION public.earned_xp_since(p_user uuid,p_since timestamptz) RETURNS numeric LANGUAGE sql STABLE SET search_path='' AS $$ SELECT coalesce(sum(points),0) FROM public.economy_earning_events() WHERE user_id=p_user AND earned_at>=p_since $$;
CREATE FUNCTION public.unit_xp_report(p_user uuid) RETURNS jsonb LANGUAGE sql STABLE SET search_path='' AS $$
 WITH policy AS(SELECT * FROM public.unit_xp_policy WHERE track=public.student_xp_track(p_user)), units AS(
 SELECT u.id,u.name,u.order_index,p.lesson_target,p.math_target,
 (SELECT count(*) FROM public.lesson_reward_schedule(u.id,p.track)) evidence_count,
 (SELECT coalesce(sum(xp),0) FROM public.lesson_reward_schedule(u.id,p.track)) lesson_available,
 (SELECT coalesce(sum(points),0) FROM public.economy_point_grants WHERE user_id=p_user AND unit_id=u.id AND source='lesson-block') lesson_earned,
 (SELECT coalesce(sum(points),0) FROM public.economy_earning_events() WHERE user_id=p_user AND unit_id=u.id AND source IN ('arcade-payout','math-spine')) math_earned
 FROM public.units u CROSS JOIN policy p WHERE u.program=public.student_xp_program(p_user))
 SELECT jsonb_build_object('track',p.track,'lessonTarget',p.lesson_target,'mathTarget',p.math_target,'unitTarget',p.lesson_target+p.math_target,'mathDailyCap',p.math_daily_cap,'currentUnitId',public.student_current_xp_unit(p_user),'effectiveAt',p.effective_at,'units',coalesce((SELECT jsonb_agg(to_jsonb(u) ORDER BY u.order_index,u.id) FROM units u),'[]'::jsonb)) FROM policy p;
$$;
REVOKE ALL ON FUNCTION public.lesson_xp_capture(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lesson_xp_capture(jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.lesson_xp_amount(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lesson_xp_amount(jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.lesson_xp_array(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lesson_xp_array(jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.lesson_xp_object(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lesson_xp_object(jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.lesson_xp_text(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lesson_xp_text(jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.lesson_xp_rating(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lesson_xp_rating(jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.lesson_xp_drawing(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lesson_xp_drawing(jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.lesson_xp_substantive(jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lesson_xp_substantive(jsonb,jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.lesson_xp_complete(jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lesson_xp_complete(jsonb,jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.student_xp_track(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.student_xp_track(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.student_xp_program(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.student_xp_program(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.lesson_reward_schedule(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lesson_reward_schedule(text,text) TO service_role;
REVOKE ALL ON FUNCTION public.lesson_reward_map(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lesson_reward_map(uuid,text) TO service_role;
REVOKE ALL ON FUNCTION public.student_current_xp_unit(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.student_current_xp_unit(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.award_lesson_evidence_xp() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.award_lesson_evidence_xp() TO service_role;
REVOKE ALL ON FUNCTION public.guard_unit_math_xp() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.guard_unit_math_xp() TO service_role;
REVOKE ALL ON FUNCTION public.economy_earning_events() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.economy_earning_events() TO service_role;
REVOKE ALL ON FUNCTION public.economy_totals(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.economy_totals(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.get_leaderboard(timestamptz,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(timestamptz,integer) TO service_role;
REVOKE ALL ON FUNCTION public.earned_xp_since(uuid,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.earned_xp_since(uuid,timestamptz) TO service_role;
REVOKE ALL ON FUNCTION public.unit_xp_report(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.unit_xp_report(uuid) TO service_role;
CREATE FUNCTION public.lesson_xp_earned(p_user uuid,p_lesson uuid) RETURNS numeric LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT coalesce(sum(points),0) FROM public.economy_point_grants WHERE user_id=p_user AND source='lesson-block' AND split_part(reference,':',1)=p_lesson::text;
$$;
REVOKE ALL ON FUNCTION public.lesson_xp_earned(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lesson_xp_earned(uuid,uuid) TO service_role;
CREATE TABLE public.course_xp_terms (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),course_id uuid NOT NULL REFERENCES public.courses(id),
 label text NOT NULL,starts_at timestamptz NOT NULL,ends_at timestamptz NOT NULL CHECK(ends_at>starts_at),
 minimum_xp integer NOT NULL CHECK(minimum_xp>0),grade_points numeric NOT NULL CHECK(grade_points>=0 AND grade_points<=100),
 UNIQUE(course_id,starts_at)
);
ALTER TABLE public.course_xp_terms ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.course_xp_terms FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.course_xp_terms TO service_role;
CREATE FUNCTION public.student_term_xp(p_user uuid) RETURNS jsonb LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT to_jsonb(t)||jsonb_build_object('earned',floor(coalesce((SELECT sum(e.points) FROM public.economy_earning_events() e WHERE e.user_id=p_user AND e.earned_at>=t.starts_at AND e.earned_at<t.ends_at),0)+.5))
 FROM public.course_xp_terms t JOIN public.course_students cs ON cs.course_id=t.course_id
 WHERE cs.student_id=p_user AND now()>=t.starts_at AND now()<t.ends_at ORDER BY t.minimum_xp DESC,t.starts_at DESC,t.id LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.student_term_xp(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.student_term_xp(uuid) TO service_role;

-- Starting calendar, editable by the course owner. End dates are exclusive.
INSERT INTO public.course_xp_terms(course_id,label,starts_at,ends_at,minimum_xp,grade_points)
SELECT c.id,t.label,t.start_day::timestamp AT TIME ZONE 'America/New_York',t.end_day::timestamp AT TIME ZONE 'America/New_York',CASE WHEN c.track='honors' THEN 1800 ELSE 1400 END,5
FROM public.courses c CROSS JOIN (VALUES
 ('Term 1 · 2026–27','2026-08-31','2026-11-07'),
 ('Term 2 · 2026–27','2026-11-07','2027-01-23'),
 ('Term 3 · 2026–27','2027-01-23','2027-04-03'),
 ('Term 4 · 2026–27','2027-04-03','2027-06-19')) t(label,start_day,end_day)
WHERE c.archived_at IS NULL AND coalesce(c.course_state,'ACTIVE')='ACTIVE';
CREATE FUNCTION public.guard_xp_term_overlap() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('xp-term:'||NEW.course_id::text,0));
 IF EXISTS(SELECT 1 FROM public.course_xp_terms t WHERE t.course_id=NEW.course_id AND t.id<>NEW.id AND t.starts_at<NEW.ends_at AND t.ends_at>NEW.starts_at) THEN
 RAISE EXCEPTION 'Term dates overlap another term'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER guard_xp_term_overlap BEFORE INSERT OR UPDATE ON public.course_xp_terms FOR EACH ROW EXECUTE FUNCTION public.guard_xp_term_overlap();
REVOKE ALL ON FUNCTION public.guard_xp_term_overlap() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.guard_xp_term_overlap() TO service_role;

DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM xp_balances_before b WHERE b.totals IS DISTINCT FROM public.economy_totals(b.id)) THEN
   RAISE EXCEPTION 'XP migration halted: existing student balance would change';
 END IF;
END $$;
