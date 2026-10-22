const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process')
const root = process.env.READING_ROOT || path.resolve(__dirname, '..')
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const json = x => `'${JSON.stringify(x).replaceAll("'", "''")}'::jsonb`
const assignment = { id: id(10), course_id: id(1), title: 'Reading motion', chapter: 4, reading: '4.2–4.3', section_ids: ['4.2','4.3'], instructions: 'Explain.', questions: [{id:id(20),reference:'Check Concepts #1',prompt:'Explain speed.',target_id:id(3)},{id:id(21),reference:'Check Concepts #2',prompt:'Explain velocity.',target_id:id(3)}], due_at:null,status:'published',version:0 }
const answers = { [id(20)]: 'Distance divided by elapsed time.', [id(21)]: 'Speed in a given direction.' }
const student = (action,ans,version,request) => `public.textbook_student_action('${id(10)}','${id(2)}','${action}',${json(ans)},${version},'${id(request)}')`
const review = (sub,request,decision,ratings,note,owner='teacher@test') => `public.review_textbook_submission('${id(sub)}','${id(request)}','teacher@test','${owner}','${decision}',${json(ratings)},'${note}')`
const expectError = (query, message) => `begin perform ${query}; raise exception 'TEST EXPECTED REJECTION'; exception when raise_exception then if sqlerrm='TEST EXPECTED REJECTION' or position('${message}' in sqlerrm)=0 then raise; end if; end;`
const sql = `begin;
create table public.courses(id uuid primary key,teacher_email text,program text,archived_at timestamptz);
create table public.students(id uuid primary key,email text,is_active boolean default true);
create table public.course_students(id uuid primary key default gen_random_uuid(),course_id uuid,student_id uuid,enrollment_state text);
create table public.learning_targets(id uuid primary key,program text,exclude_from_growth boolean default false);
create table public.economy_point_grants(id uuid primary key default gen_random_uuid(),user_id uuid references public.students(id),user_email text,source text,reference text,points int check(points>=0),note text,dedupe_key text unique not null,awarded_at timestamptz default now());
create table public.mastery_records(id uuid primary key default gen_random_uuid(),user_id uuid,user_email text,target_id uuid,level smallint check(level in(1,2,3)),rated_by text,evidence_source text);
do $$ begin if not exists(select 1 from pg_roles where rolname='anon') then create role anon;end if;if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated;end if;if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role;end if;end $$;
insert into public.courses values('${id(1)}','teacher@test','physics',null);
insert into public.students(id,email) values('${id(2)}','student@test'),('${id(4)}','other@test');
insert into public.course_students(course_id,student_id,enrollment_state) values('${id(1)}','${id(2)}','ACTIVE');
insert into public.learning_targets(id,program) values('${id(3)}','physics'),('${id(5)}','trades');
${fs.readFileSync(path.join(root,'supabase/migrations/20260918020727_textbook_reading_assignments.sql'),'utf8')}
${fs.readFileSync(path.join(root,'supabase/migrations/20261013024518_reading_assignment_xp.sql'),'utf8')}
do $$ declare r jsonb; begin
  ${expectError(`public.save_textbook_assignment(${json(assignment)},'other@test','other@test')`, 'class is unavailable')}
  ${expectError(`public.save_textbook_assignment(${json({...assignment, questions:[{...assignment.questions[0],target_id:id(5)}]})},'teacher@test','teacher@test')`, 'class curriculum')}
  perform public.save_textbook_assignment(${json(assignment)},'teacher@test','teacher@test');
  perform public.save_textbook_assignment(${json(assignment)},'teacher@test','teacher@test');
  if (select count(*) from textbook_assignments)<>1 then raise exception 'Duplicate assignment retry'; end if;
  ${expectError(`public.save_textbook_assignment(${json({...assignment,version:1,title:'Changed'})},'teacher@test','teacher@test')`, 'assignment changed')}
  ${expectError(`public.textbook_student_action('${id(10)}','${id(4)}','submit',${json(answers)},0,'${id(30)}')`, 'unavailable')}
  ${expectError(student('submit',{},0,30), 'Answer every question')}
  if exists(select 1 from textbook_work) then raise exception 'Invalid submission created progress'; end if;
  perform ${student('save',{[id(20)]:answers[id(20)]},0,30)};
  if exists(select 1 from economy_point_grants) then raise exception 'Draft earned XP';end if;
  ${expectError(student('save',answers,0,30), 'another window')}
  ${expectError(student('save',{x:'foreign'},1,30), 'do not match')}
  perform ${student('submit',answers,1,30)};
  perform ${student('submit',answers,1,30)};
  if (select sum(points) from economy_point_grants)<>5 or (select count(*) from economy_point_grants)<>1 then raise exception 'Missing or duplicated first XP reward';end if;
  if exists(select 1 from mastery_records) then raise exception 'Submission auto-rated mastery';end if;
  if (select count(*) from textbook_submissions)<>1 then raise exception 'Duplicate submission'; end if;
  ${expectError(student('save',answers,2,32), 'already been submitted')}
  ${expectError(review(30,40,'rated',{[id(3)]:3},'','other@test'), 'roster')}
  ${expectError(review(30,40,'rated',{},''), 'every assigned target')}
  ${expectError(review(30,40,'rated',{[id(5)]:3},''), 'only the assigned targets')}
  ${expectError(review(30,40,'returned',{},''), 'revision feedback')}
  perform ${review(30,40,'returned',{},'Explain the difference using an example.')};
  if exists(select 1 from mastery_records) then raise exception 'Revision created mastery'; end if;
  perform ${student('submit',{...answers,[id(21)]:'A car moving north at 5 m/s has northward velocity.'},3,31)};
  if (select answers->>'${id(21)}' from textbook_submissions where id='${id(30)}')<>'Speed in a given direction.' then raise exception 'Snapshot overwritten'; end if;
  ${expectError(review(30,41,'rated',{[id(3)]:1},''), 'already been reviewed')}
  perform ${review(31,41,'rated',{[id(3)]:3},'Clear explanation.')};
  perform ${review(31,41,'rated',{[id(3)]:3},'Clear explanation.')};
  if (select count(*) from mastery_records)<>1 then raise exception 'Mastery double counted per question or retry'; end if;
  if (select state from textbook_work)<>'rated' then raise exception 'Work not marked rated'; end if;
  if (select count(*) from textbook_submissions)<>2 or (select count(*) from textbook_reviews)<>2 then raise exception 'Missing history'; end if;
  ${expectError(review(31,42,'rated',{[id(3)]:2},''), 'already been reviewed')}
  update textbook_assignments set status='archived' where id='${id(10)}';
  ${expectError(student('submit',answers,5,32), 'unavailable')}
  update textbook_assignments set status='published' where id='${id(10)}';
  update course_students set enrollment_state='INACTIVE';
  ${expectError(student('submit',answers,5,32), 'unavailable')}
  if has_table_privilege('anon','textbook_work','SELECT') or has_table_privilege('authenticated','textbook_submissions','SELECT') or has_function_privilege('anon','public.textbook_student_action(uuid,uuid,text,jsonb,integer,uuid)','EXECUTE') or has_function_privilege('authenticated','public.review_textbook_submission(uuid,uuid,text,text,text,jsonb,text)','EXECUTE') then raise exception 'Privileged student data exposed'; end if;
  if (select sum(points) from economy_point_grants)<>5 or (select count(*) from economy_point_grants)<>1 then raise exception 'Resubmission or review paid twice';end if;
  if (select awarded_at from economy_point_grants)<>(select submitted_at from textbook_submissions where id='${id(30)}') then raise exception 'Receipt date changed';end if;
  if has_function_privilege('anon','public.award_reading_assignment_xp()','EXECUTE') or has_function_privilege('authenticated','public.award_reading_assignment_xp()','EXECUTE') then raise exception 'Award function exposed';end if;
end $$;
${fs.readFileSync(path.join(root,'supabase/migrations/20261013024518_reading_assignment_xp.sql'),'utf8').split('WITH first_submission AS (')[1] ? 'WITH first_submission AS ('+fs.readFileSync(path.join(root,'supabase/migrations/20261013024518_reading_assignment_xp.sql'),'utf8').split('WITH first_submission AS (')[1] : ''}
do $$ begin if (select sum(points) from economy_point_grants)<>5 then raise exception 'Backfill duplicated existing award';end if;end $$;
-- Repeat against an OpenStax snapshot and prove reward failure rolls back submission.
update course_students set enrollment_state='ACTIVE';
insert into textbook_assignments select (jsonb_populate_record(null::textbook_assignments,to_jsonb(a)||jsonb_build_object('id','${id(11)}','title','OpenStax section'))).* from textbook_assignments a where id='${id(10)}';
create function public.test_reject_xp() returns trigger language plpgsql as $$ begin raise exception 'Simulated ledger failure';end $$;
create trigger reject_xp before insert on economy_point_grants for each row execute function test_reject_xp();
do $$ begin
 begin perform public.textbook_student_action('${id(11)}','${id(2)}','submit',${json(answers)},0,'${id(90)}'); raise exception 'TEST EXPECTED REJECTION';exception when raise_exception then if sqlerrm<>'Simulated ledger failure' then raise;end if;end;
 if exists(select 1 from textbook_submissions where assignment_id='${id(11)}') or exists(select 1 from textbook_work where assignment_id='${id(11)}') then raise exception 'Submission partially committed';end if;
end $$;
drop trigger reject_xp on economy_point_grants;
select public.textbook_student_action('${id(11)}','${id(2)}','submit',${json(answers)},0,'${id(90)}');
do $$ begin if (select sum(points) from economy_point_grants)<>10 then raise exception 'Distinct reading did not earn';end if;end $$;
rollback;`
execFileSync('/opt/homebrew/opt/postgresql@14/bin/psql',[process.env.READING_TEST_DATABASE_URL || 'postgresql://craigantocci@127.0.0.1:55439/textbook_reading_test','-X','-v','ON_ERROR_STOP=1'],{input:sql,stdio:['pipe','inherit','inherit']})
console.log('PASS: reading XP — no draft reward; once per assignment across retries, revisions and reviews; original timestamp; repeat-safe backfill; separate readings; transaction rollback; server-only award; mastery unchanged.');
