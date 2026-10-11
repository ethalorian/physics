-- Published YouTube lengths checked on 2026-09-27; never accept a learner's duration or reward amount.
CREATE TABLE public.lesson_video_catalog (
 youtube_id text PRIMARY KEY CHECK(youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
 duration_seconds integer NOT NULL CHECK(duration_seconds BETWEEN 15 AND 14400)
);
INSERT INTO public.lesson_video_catalog VALUES
 ('Z1qFlfqlS_E',260),('vf7X7mmJfsE',211),('u0V8uJ5KTvo',160),('djR8sAAi740',157),
 ('FshpPgPAeWM',160),('maoz-9mGWyk',104),('YViTBR_aygk',160),('hj8usnvYrRo',160);
ALTER TABLE public.lesson_video_catalog ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lesson_video_catalog FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.lesson_video_catalog TO service_role;

CREATE TABLE public.lesson_video_progress (
 user_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
 lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
 youtube_id text NOT NULL,
 duration_seconds integer NOT NULL,
 start_seconds integer NOT NULL,
 watched_seconds integer[] NOT NULL DEFAULT '{}',
 session_id uuid NOT NULL,
 last_position numeric NOT NULL,
 last_playing boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(user_id,lesson_id,youtube_id)
);
CREATE INDEX lesson_video_progress_lesson_idx ON public.lesson_video_progress(lesson_id);
ALTER TABLE public.lesson_video_progress ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lesson_video_progress FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.lesson_video_progress TO service_role;

CREATE FUNCTION public.lesson_video_spec(p_lesson uuid,p_block text) RETURNS jsonb
LANGUAGE sql STABLE SET search_path='' AS $$
 WITH video AS (
 SELECT b,c.duration_seconds verified_duration FROM public.lessons l
 CROSS JOIN LATERAL jsonb_array_elements(l.content_blocks->'blocks') b
 LEFT JOIN public.lesson_video_catalog c ON c.youtube_id=b->>'youtubeId'
 WHERE l.id=p_lesson AND b->>'id'=p_block AND b->>'type'='instruction_video'
 ), metadata AS (
 SELECT b,coalesce(verified_duration,CASE WHEN b->>'durationSeconds' ~ '^\d{1,5}$' THEN (b->>'durationSeconds')::integer END) duration,
 CASE WHEN b->>'startSeconds' ~ '^\d+(\.\d+)?$' THEN floor((b->>'startSeconds')::numeric)::integer ELSE 0 END start FROM video
 ) SELECT jsonb_build_object('youtubeId',b->>'youtubeId','duration',duration,'start',start,'reward',5)
 FROM metadata WHERE b->>'youtubeId' ~ '^[A-Za-z0-9_-]{11}$' AND duration BETWEEN 15 AND 14400 AND start>=0 AND start<duration;
$$;

CREATE FUNCTION public.lesson_video_xp_status(p_user uuid,p_lesson uuid,p_block text) RETURNS jsonb
LANGUAGE sql STABLE SET search_path='' AS $$
 WITH spec AS (SELECT public.lesson_video_spec(p_lesson,p_block) s)
 SELECT s || jsonb_build_object('watched',coalesce(cardinality(p.watched_seconds),0),
 'required',ceil(((s->>'duration')::integer-(s->>'start')::integer)*0.9),
 'earned',coalesce(g.points,0),'xpAwarded',0,'lessonXp',public.lesson_xp_earned(p_user,p_lesson))
 FROM spec LEFT JOIN public.lesson_video_progress p ON p.user_id=p_user AND p.lesson_id=p_lesson AND p.youtube_id=s->>'youtubeId'
 AND p.duration_seconds=(s->>'duration')::integer AND p.start_seconds=(s->>'start')::integer
 LEFT JOIN public.economy_point_grants g ON g.dedupe_key='video-xp:'||p_lesson::text||':'||(s->>'youtubeId')||':'||p_user::text
 WHERE s IS NOT NULL;
$$;

CREATE FUNCTION public.record_lesson_video_watch(p_user uuid,p_email text,p_lesson uuid,p_block text,p_session uuid,p_position numeric,p_playing boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE spec jsonb; prior public.lesson_video_progress%ROWTYPE; stamp timestamptz:=clock_timestamp();
 duration integer; start_at integer; watched integer[]; elapsed numeric; granted integer:=0; unit_key text;
BEGIN
 spec:=public.lesson_video_spec(p_lesson,p_block);
 IF spec IS NULL OR p_session IS NULL OR p_playing IS NULL OR p_position IS NULL OR p_position::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Invalid video progress'; END IF;
 duration:=(spec->>'duration')::integer; start_at:=(spec->>'start')::integer;
 IF p_position<0 OR p_position>duration+1 THEN RAISE EXCEPTION 'Video position outside duration'; END IF;
 p_position:=least(duration,greatest(start_at,p_position));
 -- The server route authorizes enrollment, lesson window and track; video participation never edits submitted answers.
 -- This service-only transaction rechecks the published block and track before issuing credit.
 SELECT l.unit_id INTO unit_key FROM public.lessons l CROSS JOIN LATERAL jsonb_array_elements(l.content_blocks->'blocks') b
 WHERE l.id=p_lesson AND l.published AND b->>'id'=p_block
 AND (nullif(l.visibility_track,'') IS NULL OR l.visibility_track=public.student_xp_track(p_user))
 AND (nullif(b->>'visibilityTrack','') IS NULL OR b->>'visibilityTrack'=public.student_xp_track(p_user));
 IF NOT FOUND THEN RAISE EXCEPTION 'Video unavailable'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('video-xp:'||p_user::text||':'||p_lesson::text||':'||(spec->>'youtubeId'),0));
 SELECT * INTO prior FROM public.lesson_video_progress WHERE user_id=p_user AND lesson_id=p_lesson AND youtube_id=spec->>'youtubeId' FOR UPDATE;
 watched:=coalesce(prior.watched_seconds,'{}');
 IF prior.duration_seconds IS DISTINCT FROM duration OR prior.start_seconds IS DISTINCT FROM start_at THEN watched:='{}'; END IF;
 elapsed:=extract(epoch FROM stamp-prior.updated_at);
 -- Only bounded, forward playback between recent heartbeats earns covered seconds.
 -- Pauses, seeks, repeated segments, stale tabs and concurrent sessions cannot multiply credit.
 IF prior.duration_seconds=duration AND prior.start_seconds=start_at
 AND prior.session_id=p_session AND prior.last_playing AND elapsed BETWEEN 0.5 AND 20
 AND p_position>prior.last_position AND p_position-prior.last_position<=elapsed*2.5 THEN
   SELECT coalesce(array_agg(DISTINCT sec ORDER BY sec),'{}') INTO watched FROM (
     SELECT unnest(watched) sec UNION ALL
     SELECT generate_series(greatest(start_at,floor(prior.last_position)::integer),least(duration-1,floor(p_position)::integer-1))
   ) seconds;
 END IF;
 INSERT INTO public.lesson_video_progress(user_id,lesson_id,youtube_id,duration_seconds,start_seconds,watched_seconds,session_id,last_position,last_playing,updated_at)
 VALUES(p_user,p_lesson,spec->>'youtubeId',duration,start_at,watched,p_session,p_position,p_playing,stamp)
 ON CONFLICT(user_id,lesson_id,youtube_id) DO UPDATE SET duration_seconds=excluded.duration_seconds,start_seconds=excluded.start_seconds,
 watched_seconds=excluded.watched_seconds,session_id=excluded.session_id,last_position=excluded.last_position,last_playing=excluded.last_playing,updated_at=excluded.updated_at;
 IF cardinality(watched)>=ceil((duration-start_at)*0.9) THEN
   INSERT INTO public.economy_point_grants(user_id,user_email,source,reference,points,note,dedupe_key,unit_id)
   VALUES(p_user,p_email,'lesson-block',p_lesson::text||':video:'||(spec->>'youtubeId'),5,
     'Watched lesson video · participation XP', 'video-xp:'||p_lesson::text||':'||(spec->>'youtubeId')||':'||p_user::text,unit_key)
   ON CONFLICT(dedupe_key) DO NOTHING RETURNING points INTO granted;
 END IF;
 RETURN public.lesson_video_xp_status(p_user,p_lesson,p_block)||jsonb_build_object('xpAwarded',coalesce(granted,0));
END;
$$;

-- Existing question rewards stay unchanged; verified video participation adds five XP.
CREATE OR REPLACE FUNCTION public.lesson_reward_map(p_lesson uuid,p_track text) RETURNS jsonb LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT coalesce((SELECT jsonb_object_agg(s.block_id,s.xp) FROM public.lessons l CROSS JOIN LATERAL public.lesson_reward_schedule(l.unit_id,p_track) s WHERE l.id=p_lesson AND s.lesson_id=l.id),'{}'::jsonb)
 || coalesce((SELECT jsonb_object_agg(b->>'id',5) FROM public.lessons l CROSS JOIN LATERAL jsonb_array_elements(l.content_blocks->'blocks') b
 WHERE l.id=p_lesson AND (nullif(l.visibility_track,'') IS NULL OR l.visibility_track=p_track)
 AND (nullif(b->>'visibilityTrack','') IS NULL OR b->>'visibilityTrack'=p_track) AND public.lesson_video_spec(l.id,b->>'id') IS NOT NULL),'{}'::jsonb);
$$;

REVOKE ALL ON FUNCTION public.lesson_video_spec(uuid,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.lesson_video_xp_status(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.record_lesson_video_watch(uuid,text,uuid,text,uuid,numeric,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.lesson_video_spec(uuid,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.lesson_video_xp_status(uuid,uuid,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_lesson_video_watch(uuid,text,uuid,text,uuid,numeric,boolean) TO service_role;

-- Include video opportunities in unit availability; existing unit targets and past grants are unchanged.
CREATE OR REPLACE FUNCTION public.unit_xp_report(p_user uuid) RETURNS jsonb LANGUAGE sql STABLE SET search_path='' AS $$
 WITH policy AS(SELECT * FROM public.unit_xp_policy WHERE track=public.student_xp_track(p_user)), units AS(
 SELECT u.id,u.name,u.order_index,p.lesson_target,p.math_target,
 (SELECT count(*) FROM public.lesson_reward_schedule(u.id,p.track)) evidence_count,
 (SELECT coalesce(sum(xp),0) FROM public.lesson_reward_schedule(u.id,p.track)) + (SELECT 5*count(DISTINCT l.id::text||':'||(b->>'youtubeId')) FROM public.lessons l CROSS JOIN LATERAL jsonb_array_elements(l.content_blocks->'blocks') b WHERE l.unit_id=u.id AND l.published AND (nullif(l.visibility_track,'') IS NULL OR l.visibility_track=p.track) AND (nullif(b->>'visibilityTrack','') IS NULL OR b->>'visibilityTrack'=p.track) AND public.lesson_video_spec(l.id,b->>'id') IS NOT NULL) lesson_available,
 (SELECT coalesce(sum(points),0) FROM public.economy_point_grants WHERE user_id=p_user AND unit_id=u.id AND source='lesson-block') lesson_earned,
 (SELECT coalesce(sum(points),0) FROM public.economy_earning_events() WHERE user_id=p_user AND unit_id=u.id AND source IN ('arcade-payout','math-spine')) math_earned
 FROM public.units u CROSS JOIN policy p WHERE u.program=public.student_xp_program(p_user))
 SELECT jsonb_build_object('track',p.track,'lessonTarget',p.lesson_target,'mathTarget',p.math_target,'unitTarget',p.lesson_target+p.math_target,'mathDailyCap',p.math_daily_cap,'currentUnitId',public.student_current_xp_unit(p_user),'effectiveAt',p.effective_at,'units',coalesce((SELECT jsonb_agg(to_jsonb(u) ORDER BY u.order_index,u.id) FROM units u),'[]'::jsonb)) FROM policy p;
$$;
