const fs=require('fs'),{execFileSync}=require('child_process');
const source=fs.readFileSync('scripts/test-math-integrity.cjs','utf8');
let fixture=source.match(/const fixture = `([\s\S]*?)`;/)[1];
fixture=fixture.replace(/CREATE ROLE (anon|authenticated|service_role)( BYPASSRLS)?;/g,(_,role,extra)=>`DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='${role}') THEN CREATE ROLE ${role}${extra||''}; END IF; END $$;`);
const migrations=['20260907120000_math_feedback_integrity.sql','20260907120001_math_revision_outcomes.sql','20260909050533_math_problem_xp.sql'];
const grants=`CREATE TABLE math_spine_point_grants(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id text,user_email text,milestone text,competency_id uuid,points integer,note text,dedupe_key text UNIQUE);`;
const tests=`
INSERT INTO math_competencies VALUES('00000000-0000-0000-0000-000000000001');
INSERT INTO math_spiral_items(id,prompt) VALUES('00000000-0000-0000-0000-000000000002','Test');
INSERT INTO math_warmup_instances(id,user_id,school_day,item,checking) VALUES('00000000-0000-0000-0000-000000000003','student',current_date,'{"competencyId":"00000000-0000-0000-0000-000000000001","spiralItemId":"00000000-0000-0000-0000-000000000002","prompt":"Test"}','{}');
DO $$ DECLARE first jsonb; again jsonb; pid uuid; n integer; BEGIN
 first:=submit_math_warmup('00000000-0000-0000-0000-000000000003','student','student@example.invalid','{"answer":"3","work":"1+2"}','3','match',null);
 again:=submit_math_warmup('00000000-0000-0000-0000-000000000003','student','student@example.invalid','{"answer":"9","work":"changed"}','9','mismatch',null);
 IF (first->>'xpAwarded')::integer<>1 OR (again->>'xpAwarded')::integer<>0 OR (again->>'xpEarned')::integer<>1 OR first->>'id'<>again->>'id' OR again->'response_json'->>'answer'<>'3' THEN RAISE EXCEPTION 'Warmup reward/replay failed'; END IF;
 FOR n IN 1..5 LOOP
 INSERT INTO math_practice_instances(user_id,item,checking) VALUES('student','{"competencyId":"00000000-0000-0000-0000-000000000001"}','{}') RETURNING id INTO pid;
 first:=award_math_practice_xp(pid,'student','student@example.invalid');
 again:=award_math_practice_xp(pid,'student','student@example.invalid');
 IF (first->>'xpAwarded')::integer<>1 OR (again->>'xpAwarded')::integer<>0 OR (again->>'xpEarned')::integer<>1 THEN RAISE EXCEPTION 'Practice replay failed'; END IF;
 END LOOP;
 IF (SELECT sum(points) FROM math_spine_point_grants WHERE user_id='student')<>6 THEN RAISE EXCEPTION 'Cap remains or duplicate XP'; END IF;
 BEGIN PERFORM award_math_practice_xp(pid,'intruder','bad@example.invalid'); RAISE EXCEPTION 'Ownership failed'; EXCEPTION WHEN no_data_found THEN NULL; END;
 IF has_function_privilege('authenticated','award_math_practice_xp(uuid,text,text)','EXECUTE') OR has_table_privilege('authenticated','math_practice_instances','SELECT') THEN RAISE EXCEPTION 'Practice key/award privilege leak'; END IF;
 RAISE NOTICE 'PASS warmup XP, immutable retry, five practice awards, no replay awards, ownership, key isolation';
END $$;
CREATE FUNCTION reject_xp() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected XP failure'; END $$;
CREATE TRIGGER reject_xp BEFORE INSERT ON math_spine_point_grants FOR EACH ROW EXECUTE FUNCTION reject_xp();
INSERT INTO math_warmup_instances(id,user_id,school_day,item,checking) VALUES('00000000-0000-0000-0000-000000000004','failure',current_date,'{"competencyId":"00000000-0000-0000-0000-000000000001","spiralItemId":"00000000-0000-0000-0000-000000000002","prompt":"Test"}','{}');
DO $$ BEGIN
 BEGIN PERFORM submit_math_warmup('00000000-0000-0000-0000-000000000004','failure','failure@example.invalid','{"answer":"3","work":"1+2"}','3','match',null); EXCEPTION WHEN OTHERS THEN NULL; END;
 IF EXISTS(SELECT 1 FROM math_warmup_submissions WHERE user_id='failure') THEN RAISE EXCEPTION 'Partial submission saved'; END IF;
 RAISE NOTICE 'PASS XP failure rolls back submission';
END $$;
ROLLBACK;
`;
execFileSync('/opt/homebrew/opt/postgresql@14/bin/psql',['postgresql://craigantocci@127.0.0.1:55439/postgres','-X','-v','ON_ERROR_STOP=1'],{input:fixture+grants+migrations.map(p=>fs.readFileSync('supabase/migrations/'+p,'utf8')).join('\n')+tests,stdio:['pipe','inherit','inherit']});
