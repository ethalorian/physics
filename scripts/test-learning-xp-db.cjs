const fs=require('fs'),{execFileSync}=require('child_process'),assert=require('assert/strict');
const url=process.env.TEST_DATABASE_URL;assert(url && /^postgresql:\/\/[^/]*@(127\.0\.0\.1|localhost):/.test(url),'Set TEST_DATABASE_URL to an isolated local test database');
const sql=fs.readFileSync('supabase/migrations/20260928230535_learning_xp_receipts.sql','utf8');
const fixture=`BEGIN;
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
CREATE TABLE students(id uuid PRIMARY KEY,email text);
CREATE TABLE economy_point_grants(id uuid DEFAULT gen_random_uuid(),user_id uuid REFERENCES students, user_email text,source text,reference text,points integer CHECK(points>=0),note text,dedupe_key text UNIQUE,awarded_at timestamptz DEFAULT now());
CREATE TABLE math_spine_point_grants(user_id uuid,milestone text,points integer,awarded_at timestamptz DEFAULT now());
CREATE TABLE unit_xp_policy(track text,math_daily_cap integer);
INSERT INTO unit_xp_policy VALUES('cpa',10),('honors',15);
CREATE FUNCTION student_xp_track(uuid) RETURNS text LANGUAGE sql AS $$ SELECT CASE WHEN right($1::text,1)='2' THEN 'honors' ELSE 'cpa' END $$;
CREATE TABLE vocab_checks(id uuid DEFAULT gen_random_uuid(),task_id uuid,user_id uuid,items jsonb,result jsonb,completed_at timestamptz);
CREATE TABLE vocab_checkpoint_attempts(id uuid DEFAULT gen_random_uuid(),task_id uuid,user_id uuid,submitted_at timestamptz);
INSERT INTO students VALUES('00000000-0000-0000-0000-000000000001','one@example.invalid'),('00000000-0000-0000-0000-000000000002','two@example.invalid');
INSERT INTO vocab_checks(task_id,user_id,items,result,completed_at) VALUES
('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','[{},{}]','[{"correct":false},{"correct":true}]',now()-interval '3 days'),
('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','[{},{}]','[{"correct":true},{"correct":true}]',now()-interval '2 days'),
('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','[{},{}]',null,null);
`;
const tests=`
DO $$ DECLARE v jsonb;BEGIN
 IF (SELECT sum(points) FROM economy_point_grants)<>5 OR (SELECT count(*) FROM economy_point_grants)<>1 THEN RAISE EXCEPTION 'Backfill double awards'; END IF;
 IF (SELECT awarded_at FROM economy_point_grants)<>now()-interval '3 days' THEN RAISE EXCEPTION 'Backfill moved term date'; END IF;
 UPDATE vocab_checks SET result='[{"correct":false},{"correct":false}]',completed_at=now() WHERE task_id='10000000-0000-0000-0000-000000000002';
 IF (SELECT sum(points) FROM economy_point_grants)<>10 THEN RAISE EXCEPTION 'Submission did not earn independently of correctness'; END IF;
 UPDATE vocab_checks SET completed_at=now() WHERE task_id='10000000-0000-0000-0000-000000000002';
 INSERT INTO vocab_checkpoint_attempts(task_id,user_id,submitted_at) VALUES('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001',now());
 IF (SELECT sum(points) FROM economy_point_grants)<>10 THEN RAISE EXCEPTION 'Retry or retake awarded twice'; END IF;
 INSERT INTO vocab_checkpoint_attempts(task_id,user_id) VALUES('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001');
 IF (SELECT sum(points) FROM economy_point_grants)<>10 THEN RAISE EXCEPTION 'Draft awarded'; END IF;
 UPDATE vocab_checkpoint_attempts SET submitted_at=now() WHERE task_id='10000000-0000-0000-0000-000000000003';
 IF (SELECT sum(points) FROM economy_point_grants)<>15 THEN RAISE EXCEPTION 'Checkpoint did not earn'; END IF;
 INSERT INTO vocab_checks(task_id,user_id,items,result,completed_at) VALUES('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','[{}]','[{"correct":null}]',now());
 IF (SELECT sum(points) FROM economy_point_grants)<>20 THEN RAISE EXCEPTION 'Separate student/written answers did not earn'; END IF;
 INSERT INTO economy_point_grants(user_id,source,points,dedupe_key) VALUES('00000000-0000-0000-0000-000000000001','arcade-payout',9,'arcade');
 INSERT INTO math_spine_point_grants(user_id,milestone,points) VALUES('00000000-0000-0000-0000-000000000001','warmup-completion',1),('00000000-0000-0000-0000-000000000001','competency-fluent',20);
 INSERT INTO math_spine_point_grants VALUES('00000000-0000-0000-0000-000000000001','practice-rep',4,now()-interval '2 days');
 v:=math_daily_xp_status('00000000-0000-0000-0000-000000000001');
 IF (v->>'dailyEarned')::int<>10 OR (v->>'remaining')::int<>0 OR (v->>'dailyCap')::int<>10 THEN RAISE EXCEPTION 'CPA status wrong %',v; END IF;
 v:=math_daily_xp_status('00000000-0000-0000-0000-000000000002');
 IF (v->>'dailyEarned')::int<>0 OR (v->>'remaining')::int<>15 THEN RAISE EXCEPTION 'Honors status wrong %',v; END IF;
 IF has_function_privilege('authenticated','math_daily_xp_status(uuid)','EXECUTE') OR has_function_privilege('anon','award_vocab_assignment_xp()','EXECUTE') THEN RAISE EXCEPTION 'Public award/read access'; END IF;
END $$;
CREATE FUNCTION fail_award() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.reference='10000000-0000-0000-0000-000000000004' THEN RAISE EXCEPTION 'injected failure'; END IF;RETURN NEW;END $$;
CREATE TRIGGER fail_award BEFORE INSERT ON economy_point_grants FOR EACH ROW EXECUTE FUNCTION fail_award();
DO $$ BEGIN
 BEGIN INSERT INTO vocab_checks(task_id,user_id,items,result,completed_at) VALUES('10000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','[{}]','[{}]',now());EXCEPTION WHEN OTHERS THEN NULL;END;
 IF EXISTS(SELECT 1 FROM vocab_checks WHERE task_id='10000000-0000-0000-0000-000000000004') THEN RAISE EXCEPTION 'Submission saved without XP'; END IF;
END $$;
ROLLBACK;
`;
execFileSync('/opt/homebrew/opt/postgresql@14/bin/psql',[url,'-X','-v','ON_ERROR_STOP=1'],{input:fixture+sql+tests,stdio:['pipe','pipe','pipe']});
console.log('PASS backfill, original term date, one award per assignment/student, incorrect and teacher-scored work, drafts, retries/retakes, atomic rollback, shared daily allowance, milestones excluded, privilege isolation');
