DO $$
DECLARE u uuid:='00000000-0000-0000-0000-000000000001'; l uuid:='20000000-0000-0000-0000-000000000001';
 session uuid:='30000000-0000-4000-8000-000000000001'; other_session uuid:='30000000-0000-4000-8000-000000000002';
 result jsonb; before_xp numeric; before_map jsonb; i integer;
BEGIN
 before_xp:=xp_economy_test.lesson_xp_earned(u,l);
 before_map:=xp_economy_test.lesson_reward_map(l,'cpa');
 UPDATE xp_economy_test.lessons SET content_blocks=jsonb_set(content_blocks,'{blocks}',content_blocks->'blocks'||
 '[{"id":"video","type":"instruction_video","youtubeId":"abcDEF12345","durationSeconds":20},
 {"id":"duplicate-video","type":"instruction_video","youtubeId":"abcDEF12345","durationSeconds":20},
 {"id":"known","type":"instruction_video","youtubeId":"vf7X7mmJfsE","durationSeconds":15},
 {"id":"honors-video","type":"instruction_video","youtubeId":"honORS12345","durationSeconds":20,"visibilityTrack":"honors"}]'::jsonb) WHERE id=l;
 IF (xp_economy_test.lesson_video_spec(l,'known')->>'duration')::integer<>211 THEN RAISE EXCEPTION 'Trusted duration was overridden'; END IF;
 IF xp_economy_test.lesson_reward_map(l,'cpa')-ARRAY['video','duplicate-video','known'] IS DISTINCT FROM before_map THEN RAISE EXCEPTION 'Question rewards changed'; END IF;
 IF (xp_economy_test.lesson_reward_map(l,'cpa')->>'video')::integer<>5 THEN RAISE EXCEPTION 'Video reward missing'; END IF;
 IF (xp_economy_test.unit_xp_report(u)->'units'->0->>'lesson_available')::integer<>510 THEN RAISE EXCEPTION 'Unit availability did not deduplicate videos'; END IF;
 result:=xp_economy_test.record_lesson_video_watch(u,'standard@example.invalid',l,'video',session,18,true);
 IF (result->>'watched')::integer<>0 OR (result->>'xpAwarded')::integer<>0 THEN RAISE EXCEPTION 'Opening near end earned credit'; END IF;
 PERFORM xp_economy_test.record_lesson_video_watch(u,'standard@example.invalid',l,'video',session,0,true);
 UPDATE xp_economy_test.lesson_video_progress SET updated_at=clock_timestamp()-interval '5 seconds' WHERE user_id=u;
 result:=xp_economy_test.record_lesson_video_watch(u,'standard@example.invalid',l,'video',session,5,false);
 IF (result->>'watched')::integer<>5 THEN RAISE EXCEPTION 'Playback interval not saved: %',result; END IF;
 UPDATE xp_economy_test.lesson_video_progress SET updated_at=clock_timestamp()-interval '5 seconds' WHERE user_id=u;
 result:=xp_economy_test.record_lesson_video_watch(u,'standard@example.invalid',l,'video',session,10,true);
 IF (result->>'watched')::integer<>5 THEN RAISE EXCEPTION 'Paused interval earned credit'; END IF;
 result:=xp_economy_test.record_lesson_video_watch(u,'standard@example.invalid',l,'video',session,20,true);
 IF (result->>'watched')::integer<>5 THEN RAISE EXCEPTION 'Seek jump earned credit'; END IF;
 UPDATE xp_economy_test.lesson_video_progress SET last_position=5,updated_at=clock_timestamp()-interval '1 minute' WHERE user_id=u;
 result:=xp_economy_test.record_lesson_video_watch(u,'standard@example.invalid',l,'video',session,10,true);
 IF (result->>'watched')::integer<>5 THEN RAISE EXCEPTION 'Stale heartbeat earned credit'; END IF;
 UPDATE xp_economy_test.lesson_video_progress SET last_position=5,updated_at=clock_timestamp()-interval '5 seconds' WHERE user_id=u;
 result:=xp_economy_test.record_lesson_video_watch(u,'standard@example.invalid',l,'video',other_session,10,true);
 IF (result->>'watched')::integer<>5 THEN RAISE EXCEPTION 'New tab claimed prior interval'; END IF;
 PERFORM xp_economy_test.record_lesson_video_watch(u,'standard@example.invalid',l,'video',session,0,true);
 FOR i IN 1..4 LOOP
   UPDATE xp_economy_test.lesson_video_progress SET updated_at=clock_timestamp()-interval '5 seconds' WHERE user_id=u;
   result:=xp_economy_test.record_lesson_video_watch(u,'standard@example.invalid',l,'video',session,least(i*5,18),true);
   IF i<4 AND (result->>'xpAwarded')::integer<>0 THEN RAISE EXCEPTION 'Paid before 90 percent'; END IF;
 END LOOP;
 IF (result->>'xpAwarded')::integer<>5 OR (result->>'earned')::integer<>5 OR (result->>'lessonXp')::numeric<>before_xp+5 THEN RAISE EXCEPTION 'Watch completion reward failed: %',result; END IF;
 result:=xp_economy_test.record_lesson_video_watch(u,'standard@example.invalid',l,'duplicate-video',other_session,20,false);
 IF (result->>'xpAwarded')::integer<>0 OR xp_economy_test.lesson_xp_earned(u,l)<>before_xp+5 THEN RAISE EXCEPTION 'Duplicate video paid again'; END IF;
 BEGIN
   PERFORM xp_economy_test.record_lesson_video_watch(u,'standard@example.invalid',l,'honors-video',session,0,true);
   RAISE EXCEPTION 'Wrong track accepted';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'Video unavailable' THEN RAISE; END IF; END;
 BEGIN
   PERFORM xp_economy_test.record_lesson_video_watch(u,'standard@example.invalid',l,'video',session,'NaN',true);
   RAISE EXCEPTION 'NaN accepted';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM<>'Invalid video progress' THEN RAISE; END IF; END;
 IF has_function_privilege('authenticated','xp_economy_test.record_lesson_video_watch(uuid,text,uuid,text,uuid,numeric,boolean)','EXECUTE')
 OR has_table_privilege('authenticated','xp_economy_test.lesson_video_progress','INSERT') THEN RAISE EXCEPTION 'Reward store exposed to client'; END IF;
 RAISE NOTICE 'PASS video: verified duration, preserved answer rewards, preview availability, seeks, pauses, stale heartbeats, tab isolation, resume, 90 percent, deduplication, ledger totals, track and permissions';
END $$;
