// Disposable PostgreSQL only. Real submission, queue, claim and release functions; fictional records.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{execFileSync}=require('child_process');
const root=path.resolve(__dirname,'../..'),db='transfer_brief_'+process.pid,pg=['-h','/private/tmp','-p','55439','-U','postgres','-qAt','-v','ON_ERROR_STOP=1'];
const sql=(s,name=db)=>execFileSync('/opt/homebrew/bin/psql',[...pg,'-d',name],{input:s,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0'),q=v=>"'"+String(v).replaceAll("'","''")+"'",j=v=>q(JSON.stringify(v))+'::jsonb';
let created=false,checks=0;const ok=label=>{checks++;console.log('PASS '+label)};
try{
 sql('create database '+db,'postgres');created=true;
 sql(`create table courses(id uuid primary key,teacher_email text,archived_at timestamptz,program text);create table students(id uuid primary key,email text,is_active boolean);create table course_students(course_id uuid,student_id uuid,enrollment_state text);create table learning_targets(id uuid primary key,slug text,unit_id text,statement text);create table mastery_records(id uuid primary key default gen_random_uuid(),user_id uuid,target_id uuid,level smallint,rated_by text,evidence_source text);grant select,insert on courses,students,course_students,learning_targets,mastery_records to service_role;`);
 for(const file of ['scripts/interactive-assignments.sql','scripts/interactive-assignment-dashboard.sql','scripts/interactive-assignment-unit1.sql'])sql(fs.readFileSync(root+'/'+file,'utf8'));
 sql(`alter table interactive_assignment_templates add column is_lab boolean default false;create table simulation_lab_grades(submission_id uuid,rubric_version text);create table daily_lesson_templates(foundation_slug text);grant select on simulation_lab_grades,daily_lesson_templates to service_role;
 create function public.automatic_grading_candidates() returns table(submission_id uuid) language sql stable as $$ select s.id from interactive_assignment_submissions s where not exists(select 1 from public.simulation_lab_grades g where g.submission_id=s.id) $$;`);
 sql(fs.readFileSync(root+'/supabase/migrations/20261027165835_transfer_brief_transfer_grades.sql','utf8'));
 sql("alter table learning_targets add column program text default 'physics';");
 const schedule=fs.readFileSync(root+'/supabase/migrations/20261026163644_foundation_spaced_practice.sql','utf8').match(/create function public\.set_interactive_assignment_date[\s\S]*?end \$\$;/)[0];sql(schedule);
 assert.equal(sql('select count(*) from transfer_task_grades'),'0');assert.equal(sql('select count(*) from interactive_assignments'),'0');ok('migration compiles, registers templates, and assigns no real class work');
 sql(`insert into courses values(${q(id(1))},'teacher@example.test',null,'physics');insert into students values(${q(id(2))},'student@example.test',true);insert into course_students values(${q(id(1))},${q(id(2))},'ACTIVE');insert into learning_targets(id,slug,unit_id,statement) values(${q(id(3))},'u1.pick-equation-of-motion','unit-1','Use motion equations');insert into interactive_assignments(id,course_id,slug,target_id,due_on)values(${q(id(4))},${q(id(1))},'transfer-brief-robot-stopping',${q(id(3))},'2026-10-28');`);
 sql(`select set_interactive_assignment_date(${q(id(1))},'transfer-brief-robot-stopping',${q(id(3))},'2026-11-02','teacher@example.test')`);assert.equal(sql('select due_on from interactive_assignments'),'2026-11-02');
 sql(`select set_interactive_assignment_date(${q(id(1))},'transfer-brief-robot-stopping',${q(id(3))},null,'teacher@example.test')`);assert.equal(sql('select due_on is null from interactive_assignments'),'t');assert.equal(sql('select count(*) from interactive_assignments'),'1');
 sql(`select set_interactive_assignment_date(${q(id(1))},'transfer-brief-robot-stopping',${q(id(3))},'2026-10-28','teacher@example.test')`);ok('existing calendar can move, unassign and reassign a brief without deleting its identity');
 const state={answers:{'brief-a':'3.75 m dry, 6 m wet','brief-b':'The wet condition needs a lower speed or earlier braking.','brief-c':'A longer response delay increases stopping distance.'}};
 sql(`set role service_role;select write_interactive_assignment(${q(id(4))},${q(id(2))},0,${j(state)},${q(id(5))});`);
 assert.equal(sql('select status from interactive_assignment_ai_reviews'),'queued');ok('native submission automatically queues private analysis');
 const claim=()=>JSON.parse(sql(`set role service_role;select claim_interactive_assignment_ai(${q(id(5))},true)` )||'null');
 let job=claim();assert.ok(job.lock_id);assert.equal(claim(),null);assert.equal(sql('select rubric_version from interactive_assignment_ai_reviews'),'transfer-brief-four-dimensions-v1');ok('claim uses transfer rubric and refuses concurrent duplicate jobs');
 sql(`select finish_interactive_assignment_ai(${q(id(5))},${q(job.lock_id)},null,'fictional',0,0,'fixture failure')`);job=claim();assert.ok(job.lock_id);ok('failed analysis can be retried by the existing recovery worker');
 const items=['science','reasoning','communication','transfer'].map(k=>({id:k,earned:3,possible:4,feedback:'Sample evidence.'}));
 sql(`select finish_interactive_assignment_ai(${q(id(5))},${q(job.lock_id)},${j({lab_dimensions:items,feedback:'Private suggestion'})},'fictional',0,0,null)`);
 assert.equal(sql('select count(*) from transfer_task_grades'),'0');assert.equal(sql('select count(*) from mastery_records'),'0');assert.equal(sql('select count(*) from interactive_assignment_reviews'),'0');ok('ready AI results publish no grade, feedback or mastery');
 const decisions=[{target_id:id(3),level:null,feedback:''}];
 const release=(opts={})=>{const o={reviewer:'teacher@example.test',revision:0,request:id(6),items,mastery:decisions,rubric:'transfer-brief-four-dimensions-v1',...opts};return sql(`set role service_role;select release_transfer_brief_grade(${q(id(5))},${q(o.request)},${o.revision},${q(o.reviewer)},false,${q(o.rubric)},${j(o.items)},${j(o.mastery)},'')`)};
 assert.throws(()=>release({reviewer:'other@example.test'}));assert.throws(()=>release({mastery:[]}));assert.throws(()=>release({items:items.slice(1)}));assert.throws(()=>release({rubric:'lab-four-dimensions-v1'}));ok('release validates owner, explicit mastery choices, dimensions and category');
 sql(`update interactive_assignment_work set version=2`);assert.throws(()=>release());sql('update interactive_assignment_work set version=1');ok('stale submission releases are blocked');
 const released=JSON.parse(release());assert.equal(released.earned,89);assert.equal(released.feedback,'');assert.equal(sql('select count(*) from mastery_records'),'0');assert.equal(sql('select count(*) from simulation_lab_grades'),'0');ok('explicit release can skip mastery and feedback while counting only in Transfer Task');
 release();assert.equal(sql('select count(*) from transfer_task_grades'),'1');assert.equal(claim(),null);assert.equal(sql('select count(*) from automatic_grading_candidates()'),'0');ok('repeat release is idempotent and released briefs leave the retry candidates');
 assert.throws(()=>release({request:id(7)}));const corrected=JSON.parse(release({request:id(7),revision:1,mastery:[{target_id:id(3),level:3,feedback:'Chosen by teacher.'}]}));assert.equal(corrected.revision,2);assert.equal(sql('select count(*) from mastery_records'),'1');assert.throws(()=>release({request:id(8),revision:2,mastery:[{target_id:id(3),level:2,feedback:'Overwrite'}]}));ok('correction checks revision and preserves previously recorded teacher mastery');
 for(const role of ['anon','authenticated']){
  assert.equal(sql(`select has_table_privilege('${role}','public.transfer_task_grades','select')`),'f');
  assert.equal(sql(`select has_function_privilege('${role}','public.release_transfer_brief_grade(uuid,uuid,integer,text,boolean,text,jsonb,jsonb,text)','execute')`),'f');
 }
 assert.equal(sql("select relrowsecurity from pg_class where oid='transfer_task_grades'::regclass"),'t');ok('RLS and service-only ACLs keep the release ledger inaccessible directly to clients');
 console.log(JSON.stringify({checks,realStudentWrites:0}));
}finally{if(created)sql('drop database '+db,'postgres')}
