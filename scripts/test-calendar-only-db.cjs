const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=process.env.READING_ROOT||path.resolve(__dirname,'..');
let fixture='';const run=cp.execFileSync;const log=console.log;
try {cp.execFileSync=(_cmd,_args,options)=>{fixture=options.input;return Buffer.from('')};console.log=()=>{};require('./test-reading-planner-db.cjs')} finally {cp.execFileSync=run;console.log=log}
if(!fixture.endsWith('rollback;'))throw Error('Missing fixture boundary');
const migration=fs.readFileSync(root+'/supabase/migrations/20261020150538_calendar_only_student_work.sql','utf8');
const closingMigration=fs.readFileSync(root+'/supabase/migrations/20261020153013_review_calendar_closing_window.sql','utf8');
const extra=`
-- Complete legacy regression fixtures before enabling the new calendar rules.
update quiz_assignments set status='archived',due_at=null;
update vocab_tasks set active=false,due_on=null;
update textbook_assignments set status='archived',due_at=null,opens_at=null;
delete from reading_planner_assignments;
delete from reading_planner_unassignments;
create table vocab_assignments(id uuid primary key default gen_random_uuid(),active boolean default true,due_on date);
create table math_mission_assignments(id uuid primary key default gen_random_uuid(),cancelled_at timestamptz,due_at timestamptz);
create table simulation_assignments(id uuid primary key default gen_random_uuid(),published boolean default true,is_active boolean default true,due_date timestamptz);
create table lesson_assignments(like simulation_assignments including all);
create table assignment_assignments(like simulation_assignments including all);
create table unified_assignments(id uuid primary key default gen_random_uuid(),published boolean default false,due_date timestamptz);
create table lesson_class_windows(id uuid primary key default gen_random_uuid(),close_at timestamptz,due_at timestamptz,updated_at timestamptz default now());
create table review_module_assignments(slug text primary key,course_ids uuid[] not null);
create table fixture_student_records(assignment_id uuid);
create function create_student_assignment_records() returns trigger language plpgsql as $$ begin insert into fixture_student_records values(new.id);return new;end $$;
${migration}
${closingMigration}
insert into vocab_assignments(active) values(false);
insert into math_mission_assignments(cancelled_at) values(now());
insert into simulation_assignments(published) values(false);
insert into lesson_assignments(published) values(false);
insert into assignment_assignments(published) values(false);
insert into unified_assignments(published) values(false);
insert into lesson_class_windows(close_at) values(now());
insert into review_module_assignments(slug,course_ids,due_on) values('review','{}',null);
set constraints all immediate;
set constraints all deferred;
create temp table evidence_before as
 select 'quiz' kind,to_jsonb(w) data from quiz_work w union all
 select 'reading',to_jsonb(w) from textbook_work w union all
 select 'mastery',to_jsonb(w) from mastery_records w union all
 select 'reading submissions',to_jsonb(w) from textbook_submissions w;
do $$ declare stmt text; a jsonb; v int; begin
 foreach stmt in array array[
  'update quiz_assignments set status=''published''',
  'update textbook_assignments set status=''published''',
  'update vocab_tasks set active=true',
  'update vocab_assignments set active=true',
  'update math_mission_assignments set cancelled_at=null',
  'update simulation_assignments set published=true',
  'update lesson_assignments set published=true',
  'update assignment_assignments set published=true',
  'update unified_assignments set published=true',
  'update lesson_class_windows set close_at=null',
  'update review_module_assignments set course_ids=array[''00000000-0000-4000-8000-000000000001'']::uuid[]'
 ] loop
  begin execute stmt;set constraints all immediate;raise exception 'FAILED allowed undated assignment: %',stmt;
  exception when check_violation then null;end;
 end loop;
 update review_module_assignments set course_ids=array['00000000-0000-4000-8000-000000000001']::uuid[],closes_at='2026-10-24 04:00Z';
 if exists(select 1 from review_module_assignments where due_on is not null) then raise exception 'Closing window created a due date';end if;
 if exists(select 1 from fixture_student_records) then raise exception 'Draft or failed publication created student tasks';end if;
 update unified_assignments set published=true,due_date='2026-10-27 23:59Z';
 set constraints all immediate;
 if (select count(*) from fixture_student_records)<>1 then raise exception 'Explicit dated publication failed';end if;
 set constraints all deferred;
 select version into v from textbook_assignments where id='00000000-0000-4000-8000-000000000010';
 a:=assign_reading_sequence('00000000-0000-4000-8000-000000000010','2099-10-19 03:59Z','2099-10-17 03:59Z',v,'teacher@test','teacher@test');
 set constraints all immediate;
 if a->>'status'<>'published' or exists(select 1 from quiz_assignments where id in ('00000000-0000-4000-8000-000000000030','00000000-0000-4000-8000-000000000031') and (status<>'published' or due_at is null)) or not(select active from vocab_tasks where id='00000000-0000-4000-8000-000000000040') then raise exception 'Calendar assignment failed';end if;
 set constraints all deferred;
 a:=undo_reading_sequence_assignment('00000000-0000-4000-8000-000000000010',(a->>'version')::int,'teacher@test','teacher@test');
 set constraints all immediate;
 if a->>'status'<>'archived' or exists(select 1 from quiz_assignments where status='published') or exists(select 1 from vocab_tasks where active) then raise exception 'Calendar Undo failed';end if;
 set constraints all deferred;
 a:=assign_reading_sequence('00000000-0000-4000-8000-000000000010','2099-10-19 03:59Z','2099-10-17 03:59Z',(a->>'version')::int,'teacher@test','teacher@test');
 set constraints all immediate;
 set constraints all deferred;
 a:=unassign_reading_sequence('00000000-0000-4000-8000-000000000010',(a->>'version')::int,'teacher@test','teacher@test');
 set constraints all immediate;
 if a->>'status'<>'archived' or exists(select 1 from quiz_assignments where status='published') or exists(select 1 from vocab_tasks where active) then raise exception 'Calendar removal failed';end if;
 if has_table_privilege('anon','calendar_warmups','SELECT') or has_table_privilege('authenticated','calendar_warmups','INSERT') or not has_table_privilege('service_role','calendar_warmups','INSERT') then raise exception 'Warmup permissions failed';end if;
 if exists(select 1 from calendar_warmups) then raise exception 'Automatic warmup seeded';end if;
 insert into calendar_warmups(course_id,day,assigned_by) values('00000000-0000-4000-8000-000000000001','2026-10-27','teacher@test');
 begin insert into calendar_warmups(course_id,day,assigned_by) values('00000000-0000-4000-8000-000000000001','2026-10-28','teacher@test');raise exception 'FAILED invalid warmup date';exception when check_violation then null;end;
 if (select count(*) from calendar_warmups)<>1 then raise exception 'Explicit warmup failed';end if;
end $$;
create temp table evidence_after as
 select 'quiz' kind,to_jsonb(w) data from quiz_work w union all
 select 'reading',to_jsonb(w) from textbook_work w union all
 select 'mastery',to_jsonb(w) from mastery_records w union all
 select 'reading submissions',to_jsonb(w) from textbook_submissions w;
do $$ begin
 if exists((select * from evidence_before except all select * from evidence_after) union all (select * from evidence_after except all select * from evidence_before)) then raise exception 'Saved student evidence changed';end if;
end $$;
set constraints all immediate;
rollback;
`;
run('/opt/homebrew/opt/postgresql@14/bin/psql',[process.env.READING_TEST_DATABASE_URL||'postgresql://craigantocci@127.0.0.1:55447/postgres','-X','-v','ON_ERROR_STOP=1'],{input:fixture.slice(0,-'rollback;'.length)+extra,stdio:['pipe','inherit','inherit']});
console.log('PASS: all 11 undated activation paths rejected; calendar sequence assignment, Undo and unassignment work; drafts create no student tasks; warmups require explicit dates; permissions and saved student evidence preserved.');
