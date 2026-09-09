// Isolated PostgreSQL transaction tests; all fixtures and DDL roll back.
const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const url=process.env.MATH_TEST_DATABASE_URL;
if(!url || !/^postgresql:\/\/[^/]*127\.0\.0\.1:55439\//.test(url)) throw new Error('Use the isolated local PostgreSQL instance on port 55439');
const fixture = `
BEGIN;
CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE ROLE service_role BYPASSRLS;
CREATE TABLE math_competencies(id uuid PRIMARY KEY);
CREATE TABLE math_spiral_items(id uuid PRIMARY KEY, prompt text, translations jsonb, template jsonb);
CREATE TABLE math_warmup_submissions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id text, user_email text, competency_id uuid REFERENCES math_competencies, spiral_item_id uuid REFERENCES math_spiral_items, prompt text,response text,response_json jsonb,status text DEFAULT 'pending',tested_competency_ids uuid[],rated_competency_ids uuid[],self_check text,misconception_tag text,resulting_level smallint,reviewed_by text,reviewed_at timestamptz,submitted_at timestamptz DEFAULT now());
CREATE TABLE math_competency_records(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id text,user_email text,competency_id uuid,level smallint,observed_at timestamptz,evidence_source text);
CREATE TABLE teacher_feedback(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id text,teacher_email text,competency_id uuid,message text,created_at timestamptz DEFAULT now());
`;
const migration=fs.readFileSync('supabase/migrations/20260907120000_math_feedback_integrity.sql','utf8') + fs.readFileSync('supabase/migrations/20260907120001_math_revision_outcomes.sql','utf8');
const submissionFix=fs.readFileSync('supabase/migrations/20260908142742_math_submission_user_id_type.sql','utf8');
const tests=`
INSERT INTO math_competencies VALUES('00000000-0000-0000-0000-000000000001');
INSERT INTO math_spiral_items(id,prompt) VALUES('00000000-0000-0000-0000-000000000002','Test question');
INSERT INTO math_warmup_instances(id,user_id,school_day,item,checking) VALUES('00000000-0000-0000-0000-000000000003','student',current_date,'{"competencyId":"00000000-0000-0000-0000-000000000001","spiralItemId":"00000000-0000-0000-0000-000000000002","prompt":"Original issued question"}','{}');
DO $$ DECLARE first jsonb; again jsonb; sid uuid; BEGIN
 first := submit_math_warmup('00000000-0000-0000-0000-000000000003','student','test@example.invalid','{"answer":"3"}','3','match',null);
 again := submit_math_warmup('00000000-0000-0000-0000-000000000003','student','test@example.invalid','{"answer":"9"}','9','mismatch',null);
 IF first->>'id' <> again->>'id' OR again->'response_json'->>'answer' <> '3' THEN RAISE EXCEPTION 'Submission retry overwrote evidence'; END IF;
 sid := (first->>'id')::uuid;
 IF first->>'prompt' <> 'Original issued question' THEN RAISE EXCEPTION 'Lost issued prompt'; END IF;
 UPDATE math_warmup_submissions SET submitted_at='2026-08-01T12:00:00Z' WHERE id=sid;
 PERFORM review_math_warmup(sid,'teacher',2::smallint,'Explain the unit conversion',true);
 PERFORM review_math_warmup(sid,'teacher',3::smallint,'Duplicate',false);
 IF (SELECT count(*) FROM math_competency_records WHERE submission_id=sid)<>1 THEN RAISE EXCEPTION 'Review duplicated observation'; END IF;
 IF (SELECT level FROM math_competency_records WHERE submission_id=sid)<>2 THEN RAISE EXCEPTION 'Retry changed rating'; END IF;
 IF (SELECT observed_at FROM math_competency_records WHERE submission_id=sid)<>'2026-08-01T12:00:00Z'::timestamptz THEN RAISE EXCEPTION 'Review used grading date'; END IF;
 IF (SELECT count(*) FROM teacher_feedback WHERE submission_id=sid)<>1 THEN RAISE EXCEPTION 'Feedback duplicated'; END IF;
 IF NOT (SELECT revision_requested FROM math_warmup_submissions WHERE id=sid) THEN RAISE EXCEPTION 'Lost next action'; END IF;
 INSERT INTO math_warmup_revisions(submission_id,user_id,response_json,message) VALUES(sid,'student','{"answer":"3 m"}','I added units');
 UPDATE math_warmup_revisions SET status='acknowledged',teacher_reply='Now try independently tomorrow' WHERE submission_id=sid;
 IF (SELECT count(*) FROM math_competency_records)<>1 THEN RAISE EXCEPTION 'Coached revision rated automatically'; END IF;
 RAISE NOTICE 'PASS: submission replay, immutable prompt, atomic review, review replay, performance date, feedback link, revision without mastery';
END $$;
CREATE FUNCTION reject_feedback() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected failure'; END $$;
CREATE TRIGGER fail_feedback BEFORE INSERT ON teacher_feedback FOR EACH ROW EXECUTE FUNCTION reject_feedback();
DO $$ DECLARE sid uuid; BEGIN
 INSERT INTO math_warmup_submissions(user_id,competency_id,response,status) VALUES('failure','00000000-0000-0000-0000-000000000001','answer','pending') RETURNING id INTO sid;
 BEGIN PERFORM review_math_warmup(sid,'teacher',3::smallint,'will fail',true); EXCEPTION WHEN OTHERS THEN NULL; END;
 IF EXISTS(SELECT 1 FROM math_competency_records WHERE submission_id=sid) OR (SELECT status FROM math_warmup_submissions WHERE id=sid)<>'pending' THEN RAISE EXCEPTION 'Partial review committed'; END IF;
 RAISE NOTICE 'PASS: injected failure rolls back the whole review';
END $$;
DROP TRIGGER fail_feedback ON teacher_feedback;
DO $$ DECLARE sid uuid; BEGIN
 INSERT INTO math_warmup_submissions(user_id,competency_id,response,status) VALUES('uncertain','00000000-0000-0000-0000-000000000001','answer','pending') RETURNING id INTO sid;
 PERFORM review_math_warmup(sid,'teacher',null,'Explain your method',true);
 IF EXISTS(SELECT 1 FROM math_competency_records WHERE submission_id=sid) THEN RAISE EXCEPTION 'Insufficient evidence produced a low score'; END IF;
 IF has_function_privilege('authenticated','review_math_warmup(uuid,text,smallint,text,boolean)','EXECUTE') THEN RAISE EXCEPTION 'Student can execute privileged RPC'; END IF;
 IF has_table_privilege('authenticated','math_warmup_instances','SELECT') THEN RAISE EXCEPTION 'Student can read checking keys'; END IF;
 RAISE NOTICE 'PASS: no-rating review and RPC/key isolation';
END $$;
DO $$ DECLARE before_count bigint; BEGIN
 SELECT count(*) INTO before_count FROM math_competency_records;
 UPDATE math_warmup_revisions SET next_step='fresh-check',status='acknowledged',teacher_reply='Try a new task';
 IF NOT EXISTS(SELECT 1 FROM math_warmup_revisions WHERE next_step='fresh-check') THEN RAISE EXCEPTION 'Outcome was not stored'; END IF;
 IF (SELECT count(*) FROM math_competency_records) <> before_count THEN RAISE EXCEPTION 'Outcome added a rating'; END IF;
 BEGIN
   UPDATE math_warmup_revisions SET next_step='mastered';
   RAISE EXCEPTION 'Invalid outcome accepted';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
 IF has_table_privilege('authenticated','math_warmup_revisions','UPDATE') THEN RAISE EXCEPTION 'Student can bypass teacher outcome route'; END IF;
 RAISE NOTICE 'PASS: additive outcome, invalid outcome rejected, no rating, student privilege isolation';
END $$;
ROLLBACK;
`;
execFileSync('/opt/homebrew/opt/postgresql@14/bin/psql',[url,'-X','-v','ON_ERROR_STOP=1'],{input:fixture+migration+submissionFix+tests,stdio:['pipe','inherit','inherit']});

// Repeat against production UUID user columns.
const uuidFixture=fixture.replaceAll("user_id text", "user_id uuid");
const uuidTests=tests.replaceAll("'uncertain'", "'00000000-0000-0000-0000-000000000013'").replaceAll("'student'", "'00000000-0000-0000-0000-000000000011'").replaceAll("'failure'", "'00000000-0000-0000-0000-000000000012'");
execFileSync('/opt/homebrew/opt/postgresql@14/bin/psql',[url,'-X','-v','ON_ERROR_STOP=1'],{input:uuidFixture+migration+submissionFix+uuidTests,stdio:['pipe','inherit','inherit']});
