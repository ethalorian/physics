const fs=require('fs'),{execFileSync}=require('child_process');
const source=fs.readFileSync('scripts/test-unit-xp-db.cjs','utf8');
const fixture=source.match(/const fixture=`([\s\S]*?)`;/)[1].replace("SELECT '10000000-0000-0000-0000-'||right(id::text,12),id","SELECT ('10000000-0000-0000-0000-'||right(id::text,12))::uuid,id");
const old=source.match(/const oldTotals=String.raw`([\s\S]*?)`;/)[1];
const sql=fixture+old+fs.readFileSync('supabase/migrations/20260909051454_unit_xp_economy.sql','utf8').replaceAll('public.','xp_economy_test.')+fs.readFileSync('supabase/migrations/20260910005836_math_missions.sql','utf8').replaceAll('public.','xp_economy_test.')+`
DO $$ DECLARE u uuid:='00000000-0000-0000-0000-000000000001';h uuid:='00000000-0000-0000-0000-000000000002';s uuid;a uuid;receipt jsonb;replay jsonb;n integer;state jsonb:='{"index":6,"evidence":[{},{},{},{},{},{}]}'; BEGIN
 INSERT INTO xp_economy_test.math_mission_assignments(teacher_email,user_id,mission,code,title) VALUES('teacher',u,'balance-bay','SM1','Test') RETURNING id INTO a;
 FOR n IN 1..5 LOOP
 INSERT INTO xp_economy_test.math_mission_sessions(user_id,mission,code,mode,seed,version,state,assignment_id) VALUES(u,'balance-bay','SM1','practice',n,1,'{}',a) RETURNING id INTO s;
 receipt:=xp_economy_test.save_math_mission(u,s,0,state,true,false,400,3);
 replay:=xp_economy_test.save_math_mission(u,s,0,'{}',true,false,600,3);
 IF receipt<>replay THEN RAISE EXCEPTION 'Completed replay changed saved evidence'; END IF;
 END LOOP;
 IF (SELECT sum(points) FROM xp_economy_test.economy_point_grants WHERE user_id=u AND source='arcade-payout')<>10 THEN RAISE EXCEPTION 'Shared allowance failed'; END IF;
 IF (SELECT count(*) FROM xp_economy_test.economy_point_grants WHERE user_id=u AND source='arcade-payout')<>5 THEN RAISE EXCEPTION 'Duplicate receipt'; END IF;
 IF (SELECT completed_at FROM xp_economy_test.math_mission_assignments WHERE id=a) IS NULL THEN RAISE EXCEPTION 'Assignment not completed'; END IF;
 BEGIN PERFORM xp_economy_test.save_math_mission(h,s,0,state,true,false,400,3); RAISE EXCEPTION 'Ownership failed'; EXCEPTION WHEN no_data_found THEN NULL; END;
 INSERT INTO xp_economy_test.math_mission_sessions(user_id,mission,code,mode,seed,version,state,ranked,challenge_day) VALUES(h,'balance-bay','SM1','challenge',1,1,'{}',true,current_date) RETURNING id INTO s;
 receipt:=xp_economy_test.save_math_mission(h,s,0,'{"draft":{"formula":"(v-u)/a"}}',false,true,0,3);
 replay:=xp_economy_test.save_math_mission(h,s,0,'{"draft":{}}',false,true,0,3);
 IF receipt<>replay OR receipt->'state'->'draft'->>'formula'<>'(v-u)/a' THEN RAISE EXCEPTION 'Stale tab overwrote state'; END IF;
 receipt:=xp_economy_test.save_math_mission(h,s,1,state,true,true,500,3);
 IF (receipt->>'xp')::integer<>3 THEN RAISE EXCEPTION 'Honors reward missing'; END IF;
 BEGIN INSERT INTO xp_economy_test.math_mission_sessions(user_id,mission,code,mode,seed,version,state,ranked,challenge_day) VALUES(h,'balance-bay','SM2','challenge',1,1,'{}',true,current_date); RAISE EXCEPTION 'Duplicate ranked daily allowed'; EXCEPTION WHEN unique_violation THEN NULL; END;
 IF (SELECT count(*) FROM xp_economy_test.math_mission_leaders(h) WHERE user_id=h)<>2 THEN RAISE EXCEPTION 'Weekly / all-time rankings missing'; END IF;
 IF EXISTS(SELECT 1 FROM xp_economy_test.math_mission_leaders(h) WHERE user_id=u) THEN RAISE EXCEPTION 'Practice leaked into leaderboard'; END IF;
 IF has_function_privilege('authenticated','xp_economy_test.save_math_mission(uuid,uuid,integer,jsonb,boolean,boolean,integer,integer)','EXECUTE') OR has_table_privilege('authenticated','xp_economy_test.math_mission_sessions','SELECT') OR has_table_privilege('anon','xp_economy_test.math_mission_assignments','SELECT') THEN RAISE EXCEPTION 'Direct evidence / payout exposure'; END IF;
 IF EXISTS(SELECT 1 FROM pg_class WHERE relnamespace='xp_economy_test'::regnamespace AND relname IN ('math_mission_assignments','math_mission_sessions') AND NOT relrowsecurity) THEN RAISE EXCEPTION 'RLS missing'; END IF;
 RAISE NOTICE 'PASS ownership, immutable completion, shared XP cap, assignment completion, stale-tab protection, daily ranking uniqueness, private practice, RLS and privileges';
END $$;
CREATE FUNCTION xp_economy_test.reject_mission_xp() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected failure'; END $$;
CREATE TRIGGER reject_mission_xp BEFORE INSERT ON xp_economy_test.economy_point_grants FOR EACH ROW EXECUTE FUNCTION xp_economy_test.reject_mission_xp();
DO $$ DECLARE s uuid;u uuid:='00000000-0000-0000-0000-000000000002'; BEGIN
 INSERT INTO xp_economy_test.math_mission_sessions(user_id,mission,code,mode,seed,version,state) VALUES(u,'vector-rescue','GV3','practice',1,1,'{}') RETURNING id INTO s;
 BEGIN PERFORM xp_economy_test.save_math_mission(u,s,0,'{"index":6,"evidence":[{},{},{},{},{},{}]}',true,false,400,3);EXCEPTION WHEN OTHERS THEN NULL;END;
 IF (SELECT status FROM xp_economy_test.math_mission_sessions WHERE id=s)<>'active' OR (SELECT revision FROM xp_economy_test.math_mission_sessions WHERE id=s)<>0 THEN RAISE EXCEPTION 'Partial save after payout failure';END IF;
 RAISE NOTICE 'PASS payout failure rolls back completion';
END $$;
CREATE FUNCTION xp_economy_test.purchase_arcade_play(uuid,text,text,boolean) RETURNS jsonb LANGUAGE plpgsql AS $$ BEGIN IF $2='fail' THEN RAISE EXCEPTION 'injected purchase failure'; END IF; RETURN jsonb_build_object('playId',gen_random_uuid()); END $$;
DO $$ DECLARE u uuid:='00000000-0000-0000-0000-000000000001';h uuid:='00000000-0000-0000-0000-000000000002'; BEGIN
 PERFORM xp_economy_test.purchase_mathle_daily(u,'ok',false);
 BEGIN PERFORM xp_economy_test.purchase_mathle_daily(u,'ok',false);RAISE EXCEPTION 'Repeat daily allowed';EXCEPTION WHEN unique_violation THEN NULL;END;
 BEGIN PERFORM xp_economy_test.purchase_mathle_daily(h,'fail',false);EXCEPTION WHEN OTHERS THEN NULL;END;
 IF EXISTS(SELECT 1 FROM xp_economy_test.mathle_daily_claims WHERE user_id=h) THEN RAISE EXCEPTION 'Failed purchase consumed daily';END IF;
 PERFORM xp_economy_test.purchase_mathle_daily(h,'ok',true);PERFORM xp_economy_test.purchase_mathle_daily(h,'ok',true);
 IF EXISTS(SELECT 1 FROM xp_economy_test.mathle_daily_claims WHERE user_id=h) THEN RAISE EXCEPTION 'Staff consumed daily';END IF;
 IF has_function_privilege('authenticated','xp_economy_test.purchase_mathle_daily(uuid,text,boolean)','EXECUTE') THEN RAISE EXCEPTION 'Daily claim exposed';END IF;
 RAISE NOTICE 'PASS atomic Mathle daily claim, repeat rejection, failed-purchase rollback and staff preview';
END $$;
ROLLBACK;`;
execFileSync('/opt/homebrew/opt/postgresql@14/bin/psql',['postgresql://craigantocci@127.0.0.1:55439/postgres','-X','-v','ON_ERROR_STOP=1'],{input:sql,stdio:['pipe','inherit','inherit']});
