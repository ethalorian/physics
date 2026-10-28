// Disposable PostgreSQL + actual route/reader verification. No production credentials or AI.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{execFileSync}=require('child_process'),{randomUUID}=require('crypto');
const root=path.resolve(__dirname,'../..'),pkg=n=>require(root+'/node_modules/'+n),out=process.env.DAY_ONE_OUTPUT||'/private/tmp/foundation-groups-verification';fs.mkdirSync(out,{recursive:true});
const ninth=process.env.FOUNDATION_DAY==='9',eighth=process.env.FOUNDATION_DAY==='8',seventh=process.env.FOUNDATION_DAY==='7',sixth=process.env.FOUNDATION_DAY==='6',fifth=process.env.FOUNDATION_DAY==='5',fourth=process.env.FOUNDATION_DAY==='4',third=process.env.FOUNDATION_DAY==='3',second=process.env.FOUNDATION_DAY==='2',foundationSlug=ninth?'day-9-foundation-inertia':eighth?'day-8-foundation-kinematics':seventh?'day-7-foundation-acceleration':sixth?'day-6-foundation-vector-tools':fifth?'day-5-foundation-prediction':fourth?'day-4-foundation-vectors':third?'day-3-foundation-velocity':second?'day-2-foundation-motion':'day-1-foundation-briefing',reviewSlug=ninth?'day-9-inertia':eighth?'day-8-kinematics-problems':seventh?'day-7-acceleration':sixth?'day-6-vectors':fifth?'day-5-predicting-position':fourth?'day-4-velocity-time-vectors':third?'day-3-velocity':second?'day-2-motion-language':'day-1-the-briefing',foundationKey=ninth?'day-nine':eighth?'day-eight':seventh?'day-seven':sixth?'day-six':fifth?'day-five':fourth?'day-four':third?'day-three':second?'day-two':'day-one',targetSlug=ninth?'u1.newtons-first-law-inertia':eighth?'u1.pick-equation-of-motion':seventh?'u1.acceleration-rate-of-change':sixth?'u1.vectors-tip-to-tail':fifth?'u1.predict-position-uncertainty':fourth?'u1.read-vt-graph-components':third?'u1.capture-pt-graph':second?'u1.vocab-position-distance-displacement':'u1.anchor-know-unknow';
const database='foundation_groups_'+process.pid,pg=['-h','/private/tmp','-p','55439','-U','postgres','-v','ON_ERROR_STOP=1','-qAt'];
const sql=(s,db=database)=>execFileSync('/opt/homebrew/bin/psql',[...pg,'-d',db],{input:s,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
const q=v=>v==null?'null':"'"+String(v).replaceAll("'","''")+"'",json=v=>q(JSON.stringify(v))+'::jsonb',id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const course=id(1),otherCourse=id(2),alice=id(3),bob=id(4),eve=id(5),outsider=id(6),target=id(7),review=id(8);
const ctx=global.dayOneContext={role:'teacher',realRole:'teacher',userId:alice,scopeEmail:'teacher@example.test',email:'teacher@example.test',viewingAsTeacher:false};
let created=false;const checks=[];const ok=(label)=>{checks.push(label);console.log('PASS '+label)};
function rows(table){if(sql(`select to_regclass(${q(table)}) is not null`)!=='t')return [];const data=JSON.parse(sql(`select coalesce(json_agg(t),'[]') from ${table} t`));if(table==='course_students')for(const r of data)r.students=rows('students').find(s=>s.id===r.student_id);return data;}
const literal=v=>v===null?'null':typeof v==='object'?json(v):q(v);
global.dayOneDB={from(table){const filters=[],where=[],orders=[];let start=0,end=Infinity,single=false,operation=null,payload=null,columns='*';const query={
 select(v='*'){columns=v;return query},eq(k,v){filters.push(r=>r[k]===v);where.push(`${k}=${literal(v)}`);return query},neq(k,v){filters.push(r=>r[k]!==v);return query},in(k,v){filters.push(r=>v.includes(r[k]));return query},is(k,v){filters.push(r=>(r[k]??null)===v);return query},ilike(k,v){filters.push(r=>r[k]?.toLowerCase()===v.toLowerCase());return query},contains(k,v){filters.push(r=>v.every(x=>r[k]?.includes(x)));return query},or(expression){const parts=expression.split(',').map(x=>x.split('.'));filters.push(r=>parts.some(([k,op,v])=>op==='eq'&&r[k]===v));return query},order(k,o){orders.push([k,o?.ascending!==false]);return query},range(a,b){start=a;end=b;return query},limit(n){end=n-1;return query},maybeSingle(){single=true;return query},single(){single=true;return query},upsert(v){operation='upsert';payload=v;return query},update(v){operation='update';payload=v;return query},then(resolve,reject){try{
 if(operation==='upsert'){sql(`insert into ${table}(${Object.keys(payload)}) values(${Object.values(payload).map(literal)}) on conflict(course_id,slug) do update set due_on=excluded.due_on`);filters.push(r=>r.course_id===payload.course_id&&r.slug===payload.slug);}
 if(operation==='update')sql(`update ${table} set ${Object.entries(payload).map(([k,v])=>`${k}=${literal(v)}`)} where ${where.join(' and ')}`);
 let data=rows(table).filter(r=>filters.every(f=>f(r))).sort((a,b)=>{for(const[k,asc]of orders)if(a[k]!==b[k])return(a[k]<b[k]?-1:1)*(asc?1:-1);return 0}).slice(start,end+1);
 if(columns!=='*'&&!columns.includes('('))data=data.map(r=>Object.fromEntries(columns.split(',').map(k=>k.trim()).map(k=>[k,r[k]])));
 return Promise.resolve({data:single?data[0]??null:data,error:null}).then(resolve,reject);
 }catch(e){return Promise.resolve({data:null,error:{code:'P0001',message:String(e.stderr||e).split('\n')[0].replace(/^ERROR: */,'')}}).then(resolve,reject)}}};return query;},
 async rpc(name,p){try{const args=Object.entries(p).map(([k,v])=>`${k} => ${Array.isArray(v)&&!['p_items','p_mastery'].includes(k)?`array[${v.map(q)}]::uuid[]`:typeof v==='object'&&v!==null?json(v):q(v)}`);return {data:JSON.parse(sql(`set role service_role;select ${name}(${args})`)||'null'),error:null}}catch(e){return {data:null,error:{code:'P0001',message:String(e.stderr||e).split('\n')[0].replace(/^ERROR: */,'')}}}}
};
function plugin(mocks){return {name:'isolated-boundaries',setup(build){build.onResolve({filter:/.*/},args=>{const key=/(?:^|\/)supabase$/.test(args.path)?'@/lib/supabase':args.path;return Object.hasOwn(mocks,key)?{path:key,namespace:'fixture'}:undefined});build.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:mocks[args.path],loader:'tsx',resolveDir:root}))}}}
function student(user=alice){Object.assign(ctx,{role:'student',realRole:'student',userId:user})}function teacher(){Object.assign(ctx,{role:'teacher',realRole:'teacher',userId:alice})}
const request=body=>new Request('http://fixture/api',{method:body?'POST':'GET',...(body?{headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{})});
(async()=>{
 sql('create database '+database,'postgres');created=true;
 sql(`do $$begin if not exists(select 1 from pg_roles where rolname='anon') then create role anon;end if;if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated;end if;if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role bypassrls;end if;end$$;
 create table courses(id uuid primary key,name text,section text,program text,track text,teacher_email text,archived_at timestamptz);
 create table students(id uuid primary key,name text,email text,is_active boolean default true);
 create table course_students(id uuid default gen_random_uuid(),course_id uuid references courses,student_id uuid references students,enrollment_state text);
 create table units(id text primary key,name text,program text);
 create table learning_targets(id uuid primary key,slug text unique,unit_id text,statement text,program text,exclude_from_growth boolean default false,lesson_id uuid,domain text);
 create table mastery_records(id uuid primary key default gen_random_uuid(),user_id uuid,user_email text,target_id uuid,level smallint,rated_by text,evidence_source text,observed_at timestamptz default now());`);
 sql(fs.readFileSync(root+'/scripts/interactive-assignments.sql','utf8'));
 const unit=fs.readFileSync(root+'/scripts/interactive-assignment-unit1.sql','utf8');sql(unit.slice(0,unit.indexOf('alter table public.interactive_assignment_ai_reviews')));
 const dashboard=fs.readFileSync(root+'/scripts/interactive-assignment-dashboard.sql','utf8');sql(dashboard.slice(0,dashboard.indexOf('create function public.claim_interactive_assignment_ai')));
 sql(unit.slice(unit.indexOf('create function public.rate_interactive_assignment_target'),unit.indexOf('-- Keep older clients working')));
 sql(fs.readFileSync(root+'/supabase/migrations/20260926225821_quiz_grading.sql','utf8'));
 sql(fs.readFileSync(root+'/supabase/migrations/20260926230039_quiz_evidence_validation_fix.sql','utf8'));
 const drawn=fs.readFileSync(root+'/supabase/migrations/20260926232942_quiz_drawn_responses.sql','utf8');sql(drawn.slice(0,drawn.indexOf('CREATE OR REPLACE FUNCTION public.lesson_xp_complete')));
 sql('alter table quiz_assignments add column deleted_at timestamptz;');
 const weekdays=fs.readFileSync(root+'/supabase/migrations/20261017120000_quiz_weekday_schedule.sql','utf8');sql(weekdays.slice(0,weekdays.indexOf('-- Sequence scheduling'))+weekdays.slice(weekdays.indexOf('create function public.enforce_quiz_schedule()'),weekdays.indexOf('create function public.enforce_vocab_quiz_schedule()')));
 sql(fs.readFileSync(root+'/supabase/migrations/20261024160706_course_grading_terms.sql','utf8'));
 sql(fs.readFileSync(root+'/supabase/migrations/20261025210035_day_one_foundation_sequence.sql','utf8'));
 sql(fs.readFileSync(root+'/supabase/migrations/20261025214411_foundation_collaboration_checkpoints.sql','utf8'));
 sql(fs.readFileSync(root+'/supabase/migrations/20261025221740_day_two_foundation_sequence.sql','utf8'));
 sql(fs.readFileSync(root+'/supabase/migrations/20261023023704_simulation_lab_grades.sql','utf8'));
 sql(fs.readFileSync(root+'/supabase/migrations/20261025170102_four_dimension_lab_grades.sql','utf8'));
 sql(fs.readFileSync(root+'/supabase/migrations/20261025223031_day_three_foundation_lab_sequence.sql','utf8'));
 sql(fs.readFileSync(root+'/supabase/migrations/20261025224605_day_four_foundation_sequence.sql','utf8'));
 sql(fs.readFileSync(root+'/supabase/migrations/20261026020926_day_five_foundation_sequence.sql','utf8'));
 sql(fs.readFileSync(root+'/supabase/migrations/20261026024018_day_six_foundation_sequence.sql','utf8'));
 sql(fs.readFileSync(root+'/supabase/migrations/20261026025951_day_seven_foundation_sequence.sql','utf8'));
 sql(fs.readFileSync(root+'/supabase/migrations/20261026031258_day_eight_foundation_sequence.sql','utf8'));
 sql(fs.readFileSync(root+'/supabase/migrations/20261026155816_day_nine_foundation_sequence.sql','utf8'));
 sql("create table rotation_calendar(id text primary key,no_school_dates date[] default '{}');insert into rotation_calendar values('default','{}');grant select on rotation_calendar to service_role;");
 sql(fs.readFileSync(root+'/supabase/migrations/20261026163644_foundation_spaced_practice.sql','utf8'));
 const planningSchema=fs.readFileSync(root+'/scripts/worksheet-calendar/schema.sql','utf8').split('\n').filter(line=>!line.includes('interactive_assignments')&&!line.includes('rotation_calendar')&&!line.includes('daily_sequence_key')).join('\n');
 sql(planningSchema);
 sql(fs.readFileSync(root+'/supabase/migrations/20261027153146_confirmed_sequence_date_overrides.sql','utf8')); 
 sql("alter table rotation_calendar add anchor_date text default '2026-10-19',add anchor_p1_block text default 'A',add cycle_offset integer default 0,add alt_week_anchor text;grant select on lessons,lesson_class_windows,textbook_assignments,reading_syllabus_bundles,choice_sections,section_schedules to service_role;");
 sql(fs.readFileSync(root+'/scripts/teaching-unit-plans.sql','utf8'));
 const teachingCalendar=fs.readFileSync(root+'/supabase/migrations/20261026130823_worksheet_calendar_assignment.sql','utf8');sql(teachingCalendar.slice(teachingCalendar.indexOf('create or replace function public.schedule_teaching_activity')));
 sql('grant select,insert,update on units,courses,students,course_students,learning_targets,mastery_records to service_role');
 if(process.env.FOUNDATION_ADVISORS_ONLY==='1'){
  const cli='/Users/craigantocci/.npm/_npx/aa8e5c70f9d8d161/node_modules/@supabase/cli-darwin-arm64/bin/supabase';
  const report=execFileSync(cli,['db','advisors','--db-url','postgresql://postgres@127.0.0.1:55439/'+database+'?sslmode=disable','--type','security','--fail-on','none','--output-format','json'],{encoding:'utf8',env:{...process.env,DO_NOT_TRACK:'1'}});
  fs.writeFileSync(out+'/advisors.json',report);console.log('Local migrated schema advisor report saved.');return;
 }
 await pkg('esbuild').build({stdin:{contents:`export {POST as teachingPost,GET as teachingGet} from './src/app/api/teaching-plans/route';export {POST as foundationReview} from './src/app/api/interactive-assignments/review/route';export {POST as labRelease} from './src/app/api/interactive-assignments/lab-grade/route';export {studentLabTotal} from './src/lib/student-gradebook';export {GET as lessonGet,POST as lessonSave} from './src/app/api/interactive-assignments/[id]/route';export {GET as partnerGet,POST as partnerPost} from './src/app/api/interactive-assignments/[id]/partner/route';export {GET as sequence} from './src/app/api/interactive-assignments/[id]/sequence/route';export {POST as schedule,GET as assignmentList} from './src/app/api/interactive-assignments/route';export {GET as quizGet,POST as quizPost} from './src/app/api/quizzes/[id]/route';export {POST as dueDate} from './src/app/api/quizzes/[id]/due-date/route';export {GET as quizzes} from './src/app/api/quizzes/route';export {GET as progress} from './src/app/api/student-progress/route';export {assignmentBySlug} from './src/lib/interactive-assignments/catalog';export {foundationExchangeEvidence} from './src/lib/interactive-assignments/foundations/evidence';`,resolveDir:root,loader:'ts'},bundle:true,platform:'node',format:'cjs',outfile:out+'/api.cjs',logLevel:'silent',plugins:[plugin({
 '@/lib/lesson-release-server':'export const releaseLessons=async()=>[];', '@/lib/vocab-scope-server':'export const vocabularyFor=async()=>({sets:[],words:[],targets:[]});',
 'server-only':'','@/lib/supabase':'export const supabaseAdmin=global.dayOneDB;',
 '@/lib/api-auth':`export const withAuth=handler=>(request,options={})=>handler(request,{...global.dayOneContext,params:Promise.resolve(options.params??{})});export const withRole=(roles,handler)=>withAuth((r,c)=>roles.includes(c.role)?handler(r,c):Response.json({}, {status:403}));`,
 '@/lib/interactive-assignments/grading-server':`export const processVelocitySubmission=async()=>({processed:false});export const assignmentModel=()=>"fixture";`,
 '@/lib/quizzes/grading-server':`export const processQuizSubmission=async()=>({processed:false});export const quizGradingModel=()=>"fixture";`,
 'next/server':`export const NextResponse={json:(data,options)=>Response.json(data,options)};export const after=()=>{};`,
 })]});
 const built=require(out+'/api.cjs');
 // The fictional teacher explicitly chooses normal linked spacing in calendar checks.
 const confirmFixture=fn=>async(req,...args)=>{const body=await req.clone().json();const response=await fn(req,...args);if(response.status!==409)return response;const d=await response.clone().json();if(d.code!=='SEQUENCE_DATE_CONFIRMATION')return response;return fn(new Request(req.url,{method:req.method,headers:req.headers,body:JSON.stringify({...body,sequenceConfirmation:{mode:'linked',expected:d.confirmation.snapshot}})}),...args)};
 const api={...built,schedule:confirmFixture(built.schedule),teachingPost:confirmFixture(built.teachingPost)},foundationLesson=api.assignmentBySlug(foundationSlug),reviewLesson=api.assignmentBySlug(reviewSlug);
 const answers=lesson=>({answers:Object.fromEntries(lesson.questions.map(q=>[q.id,q.options?'1':q.answer!==undefined?'6':'An individual explanation with source evidence and an assumption.'])),attempts:{}});
 sql(`insert into courses values(${q(course)},'Physics pilot','CPA','physics','cpa','teacher@example.test',null),(${q(otherCourse)},'Other class','CPA','physics','cpa','other@example.test',null);
 insert into students(id,name,email) values ${[[alice,'Alex'],[bob,'Blair'],[eve,'Casey'],[outsider,'Other']].map(([i,n])=>`(${q(i)},${q(n)},${q(n+'@example.test')})`)};
 insert into course_students(course_id,student_id,enrollment_state) values ${[alice,bob,eve].map(s=>`(${q(course)},${q(s)},'ACTIVE')`)},(${q(otherCourse)},${q(outsider)},'ACTIVE');
 insert into units values('unit-1','Motion','physics');insert into learning_targets(id,slug,unit_id,statement,program) values(${q(target)},${q(targetSlug)},'unit-1','R1: Evidence, unknowns and prediction','physics');
 insert into interactive_assignments(id,course_id,slug,target_id) values(${q(review)},${q(course)},${q(reviewSlug)},${q(target)});`);
 assert.equal(rows('quiz_assignments').length,0);
 const call=(fn,id,body)=>api[fn](request(body),{params:{id}}),body={slug:reviewLesson.slug,course_id:course,due_on:'2026-10-27',action:'calendar'};
 if(process.env.SPACED_PRACTICE_PREVIEW==='1'){await require('../foundation-spaced-practice/preview.cjs')({api,sql,q,json,id,rows,request,call,student,teacher,course,alice,bob,foundationLesson,reviewLesson,answers,body,out,root});return;}
 assert.equal((await api.schedule(request(body))).status,200);const bundle=rows('daily_lesson_sequences')[0],foundation=bundle.foundation_id,quiz=bundle.quiz_id,questions=rows('quiz_assignments')[0].questions;
 assert.equal(rows('quiz_assignments')[0].due_at,'2026-10-27T23:59:00-04:00');assert.equal(rows('interactive_assignments').find(a=>a.id===foundation).due_on,'2026-10-22');
 assert.equal((await api.schedule(request(body))).status,200);assert.equal(rows('quiz_assignments').length,1);assert.deepEqual(rows('quiz_assignments')[0].questions,questions);ok('Review placement backdates its foundation three school days and keeps the Tuesday quiz; retry preserves question IDs');
 student();assert.equal((await call('quizGet',quiz)).status,404);assert.equal((await call('quizPost',quiz,{action:'save',version:0,answers:{},request_id:randomUUID()})).status,404);
 assert.throws(()=>sql(`insert into quiz_work(quiz_id,user_id) values(${q(quiz)},${q(alice)})`),/Submit both/);
 let list=await(await api.quizzes(request())).json();assert.equal(list.locked[0].prerequisites.length,2);assert(!JSON.stringify(list).includes('correct_index'));assert.equal(list.quizzes.length,0);ok('Locked quiz hides questions/keys and rejects direct API and database saves');

 const pairAction=(action,text='',checkpoint)=>call('partnerPost',foundation,{action,text,checkpoint});
 assert.equal((await call('partnerPost',foundation,{action:'create',text:12})).status,422);
 assert.equal((await(await call('partnerGet',foundation)).json()).pair,null);
 student(outsider);assert.equal((await pairAction('create')).status,404);
 teacher();assert.equal((await pairAction('create')).status,403);
 student();assert.equal((await pairAction('create')).status,200);assert.equal((await pairAction('create')).status,200);

 // Seed real legacy writing through the old RPC, then apply the additive migration.
 sql(`select foundation_checkpoint_action(${q(foundation)},${q(alice)},'evidence','share','My own evidence idea names a source detail and states what remains uncertain.');`);
 const protectedTables=['interactive_assignments','interactive_assignment_work','interactive_assignment_submissions','interactive_assignment_reviews','mastery_records','quiz_assignments','quiz_work','quiz_submissions','quiz_reviews','simulation_lab_grades','foundation_pair_members','foundation_checkpoint_responses','foundation_makeup_work'];
 sql(`insert into interactive_assignment_work(assignment_id,user_id,state,version) values(${q(foundation)},${q(alice)},${json(answers(foundationLesson))},0);`);
 const migrationSQL=fs.readFileSync(root+'/supabase/migrations/20261028004152_foundation_groups.sql','utf8');
 // Historical v1/v2 immutable snapshots are seeded only inside a rolled-back probe.
 // The migrated schema must leave their exact bytes, keys and dates untouched.
 sql(`begin;
 alter table interactive_assignment_submissions disable trigger capture_foundation_exchange;
 insert into interactive_assignment_submissions(id,assignment_id,user_id,state,version) values
 (gen_random_uuid(),${q(foundation)},${q(alice)},'{"answers":{"retained":"Earlier answer"},"partner_exchange":{"own":{"contribution":"Earlier own idea","reply":"Earlier reply"},"peer":{"contribution":"Earlier peer","reply":"Earlier peer reply"}}}'::jsonb,71),
 (gen_random_uuid(),${q(foundation)},${q(bob)},'{"answers":{"retained":"Later original answer"},"partner_exchange":{"version":2,"mode":"pair","checkpoints":[{"id":"model","own":{"contribution":"Saved idea","reply":"Saved reply","reflection":"Private reflection"},"peer":{"contribution":"Peer context","reply":"Peer reply"}}]}}'::jsonb,72);
 alter table interactive_assignment_submissions enable trigger capture_foundation_exchange;
 create temporary table preserved_snapshots as select id,md5(to_jsonb(s)::text) fingerprint from interactive_assignment_submissions s;
 ${migrationSQL}
 do $$begin if exists(select 1 from preserved_snapshots p full join interactive_assignment_submissions s using(id) where p.fingerprint is distinct from md5(to_jsonb(s)::text)) then raise exception 'Migration changed historical snapshots';end if;end$$;
 rollback;`);
 ok('Rolled-back migration probe preserves historical v1/v2 immutable submission bytes and identities');
 const protectedBefore=Object.fromEntries(protectedTables.map(t=>[t,rows(t)]));
 sql(`create schema realtime;create table realtime.notifications(payload jsonb,event text,topic text,private boolean);grant usage on schema realtime to service_role;grant insert on realtime.notifications to service_role;
 create function realtime.send(payload jsonb,event text,topic text,private boolean) returns void language sql as 'insert into realtime.notifications values($1,$2,$3,$4)';
 create table student_avatars(user_id uuid,traits jsonb,equipped jsonb);create table avatar_items(slug text);grant select on student_avatars,avatar_items to service_role;`);
 sql(fs.readFileSync(root+'/supabase/migrations/20261028004152_foundation_groups.sql','utf8'));
 for(const t of protectedTables){const after=rows(t).map(r=>{if(t==='foundation_checkpoint_responses'){const{reply_to_user_id,...old}=r;return old}return r});assert.deepEqual(after,protectedBefore[t],t+' changed during migration');}
 assert.equal(rows('foundation_pairs')[0].protocol_version,2);
 ok('Migration preserves all existing work, writing, assignments, submissions, grades and mastery; started legacy pairs retain their rules');
 const pair=await(await call('partnerGet',foundation)).json(),code=pair.pair.code;assert.equal(rows('foundation_pairs').length,1);
 student(bob);assert.equal((await pairAction('join','NOTTHECODE')).status,422);assert.equal((await(await call('partnerGet',foundation)).json()).pair,null);
 const joined=await pairAction('join',code);assert.equal(joined.status,200,await joined.clone().text());
 student(eve);assert.equal((await pairAction('join',code)).status,422);student();
 assert.equal((await(await call('partnerGet',foundation)).json()).pair.peerName,'Blair');
 assert.equal((await pairAction('share','No selected stop provided.')).status,422);
 assert.equal((await pairAction('share','Cannot jump to the final stop.','questions')).status,422);
 assert.throws(()=>sql(`set role service_role;select foundation_partner_action(${q(foundation)},${q(alice)},'share','Cannot use the retired exchange API');`),/Choose a group action/);
 ok('Pairing requires the chosen classmate’s code, shows their name, rejects random/third/cross-class access and old bypasses');
 const draft=answers(foundationLesson);assert.equal((await call('lessonSave',foundation,{version:0,state:draft})).status,200);
 const draftBefore=JSON.stringify(rows('interactive_assignment_work'));
 let save=await call('lessonSave',foundation,{version:1,state:draft,submitId:randomUUID()});assert.equal(save.status,409);assert.match((await save.json()).error,/all three partner stops/i);assert.equal(JSON.stringify(rows('interactive_assignment_work')),draftBefore);
 const privateText=(who,stop)=>who+' private reflection for '+stop+': the peer idea changed my reasoning because the evidence has limits.';
 for(const [index,stop] of ['evidence','model','questions'].entries()){
  student();assert.equal((await pairAction('reply','Premature response text',stop)).status,422);
  const idea='My own '+stop+' idea names a source detail and states what remains uncertain.';
  assert.equal((await pairAction('share',idea,stop)).status,200);assert.equal((await pairAction('share',idea,stop)).status,200);
  assert.equal((await pairAction('share','Cannot replace the first idea.',stop)).status,422);
  student(bob);let hidden=await(await call('partnerGet',foundation)).json();assert.equal(hidden.pair.checkpoints[index].peer,null);
  assert.equal((await pairAction('share','My partner idea for '+stop+' proposes a different measurement to check.',stop)).status,200);
  student();let visible=await(await call('partnerGet',foundation)).json();assert(visible.pair.checkpoints[index].peer.contribution);
  assert.equal((await pairAction('reply','Your specific proposed measurement needs a timed reading to distinguish the explanations.',stop)).status,200);
  assert.equal((await pairAction('reflect',privateText('Alex',stop),stop)).status,422);
  student(bob);assert.equal((await pairAction('reply','Your source detail supports the claim only if that model still applies.',stop)).status,200);
  student();assert.equal((await pairAction('reflect',privateText('Alex',stop),stop)).status,200);
  assert.equal((await pairAction('reflect','Cannot replace the recorded reflection.',stop)).status,422);
  student(bob);hidden=await(await call('partnerGet',foundation)).json();assert(!JSON.stringify(hidden).includes(privateText('Alex',stop)));assert(!('reflection' in hidden.pair.checkpoints[index].peer));
  if(index<2){
   assert.equal((await pairAction('reflect',privateText('Blair',stop),stop)).status,200);
   student();save=await call('lessonSave',foundation,{version:1,state:draft,submitId:randomUUID()});assert.equal(save.status,409);assert.equal(JSON.stringify(rows('interactive_assignment_work')),draftBefore);
  }
 }
 student();ok('Three ordered blind exchanges require both accounts; private reflections remain individual and incomplete turn-in preserves the draft');
 let payload={version:1,state:{...draft,partner_exchange:{peer:{contribution:'forged peer writing'}}},submitId:randomUUID()};
 assert.equal((await call('lessonSave',foundation,payload)).status,200);assert.equal((await call('lessonSave',foundation,payload)).status,200);
 let saved=rows('interactive_assignment_submissions')[0],snapshot=JSON.stringify(saved);
 assert.equal(saved.state.partner_exchange.checkpoints.length,3);assert.equal(saved.state.partner_exchange.own_user_id,alice);
 for(const checkpoint of saved.state.partner_exchange.checkpoints){assert(checkpoint.own.reflection);assert(checkpoint.peer.reply);assert(!('reflection' in checkpoint.peer));}
 assert(!snapshot.includes('forged'));assert(!snapshot.includes('Blair private'));
 const evidence=api.foundationExchangeEvidence(saved.state,foundationKey);assert.equal(evidence.checkpoints.length,3);assert.equal(evidence.checkpoints[0].title,ninth?'Explain motion after the push':eighth?'Defend your equation choice':seventh?'Compare velocity changes':sixth?'Check the route and resultant':fifth?'Check the start, change and axes':fourth?'Compare the graph stories':third?'Compare your motion predictions':second?'Compare the path and endpoints':'Compare the evidence');assert(!JSON.stringify(evidence).includes(alice));assert(!JSON.stringify(evidence).includes('pair_id'));
 assert.equal(api.foundationExchangeEvidence({partner_exchange:{own:{contribution:'Earlier own idea',reply:'Earlier own reply'},peer:{contribution:'Earlier peer idea',reply:'Earlier peer reply'}}}).checkpoints.length,1);
 assert.equal((await pairAction('reflect',privateText('Alex','questions'),'questions')).status,422);
 student(bob);assert.equal((await pairAction('reflect',privateText('Blair','questions'),'questions')).status,200);student();
 assert.equal(JSON.stringify(rows('interactive_assignment_submissions')[0]),snapshot);
 assert.equal(rows('mastery_records').length,0);assert.equal((await call('quizGet',quiz)).status,404);
 ok('Individual immutable snapshots contain three attributable stops, omit peer reflections, ignore forged evidence and support earlier submissions');
 assert.equal((await call('lessonGet',review)).status,200);student(bob);assert.equal((await call('lessonGet',review)).status,403);student();
 let sequence=await(await call('sequence',foundation)).json();assert.deepEqual(sequence.sequence.missing.map(x=>x.role),['review']);student(bob);sequence=await(await call('sequence',foundation)).json();assert.equal(sequence.sequence.missing.length,2);student();
 sql(`insert into interactive_assignment_submissions(id,assignment_id,user_id,state,version) values(${q(randomUUID())},${q(review)},${q(alice)},'{"answers":{"legacy":"partial"}}',99)`);assert.equal((await call('quizGet',quiz)).status,404);
 payload={version:0,state:answers(reviewLesson),submitId:randomUUID()};assert.equal((await call('lessonSave',review,payload)).status,200);let open=await call('quizGet',quiz);assert.equal(open.status,200);let data=await open.json();assert(!JSON.stringify(data).includes('correct_index'));assert.equal(data.quiz.questions.length,6);ok('Own valid submissions unlock access without grading; partner/legacy/partial evidence does not');
 teacher();assert.equal((await call('quizPost',quiz,{action:'archive',version:1})).status,409);
 const quizAnswers=Object.fromEntries(questions.map(q=>[q.id,q.kind==='choice'?String(q.correct_index):'The model may no longer apply, or a measurement needs checking. Repeat independently.']));student();const submission=randomUUID();const turnIn=await call('quizPost',quiz,{action:'submit',version:0,answers:quizAnswers,request_id:submission});assert.equal(turnIn.status,200,await turnIn.clone().text());assert.equal(rows('mastery_records').length,0);
 teacher();const written=Object.fromEntries(questions.filter(q=>q.kind==='written').map(q=>[q.id,2]));const released=await call('quizPost',quiz,{action:'review',decision:'graded',submission_id:submission,request_id:randomUUID(),scores:written,ratings:{[target]:2},note:'Explain why the check distinguishes the causes.',question_notes:{},grade_value:null,draft_version:0});assert.equal(released.status,200,await released.clone().text());assert.equal(rows('quiz_reviews')[0].earned,8);assert.equal(rows('mastery_records').length,1);ok('Existing teacher release produces 8/10 quiz grade and a separate explicit mastery decision');
 const priorReview=JSON.stringify(rows('quiz_reviews')),priorWork=JSON.stringify(rows('quiz_work')),priorSubmissions=JSON.stringify(rows('interactive_assignment_submissions'));
 for(const date of ['2026-11-07',null,'2026-11-08']){assert.equal((await api.schedule(request({...body,due_on:date}))).status,200);assert.equal(rows('quiz_assignments').length,1);assert.equal(rows('quiz_assignments')[0].status,date?'published':'archived');}
 assert.equal(rows('quiz_assignments')[0].due_at,'2026-11-08T23:59:00-05:00');assert.deepEqual(rows('quiz_assignments')[0].questions,questions);assert.equal(rows('interactive_assignments').find(a=>a.id===foundation).due_on,'2026-11-04');assert.equal(JSON.stringify(rows('quiz_reviews')),priorReview);assert.equal(JSON.stringify(rows('quiz_work')),priorWork);assert.equal(JSON.stringify(rows('interactive_assignment_submissions')),priorSubmissions);ok('Weekend/DST moves, unassign and reassign keep the quiz, grades, submissions and three-school-day foundation spacing');
 student();let progress=await(await api.progress(new Request('http://fixture/api/student-progress?class='+course))).json();assert.equal(progress.rows.length,3,JSON.stringify(progress.warnings));const quizRow=progress.rows.find(r=>r.kind==='quiz');assert.equal(quizRow.grade.percent,80);assert.equal(progress.rows.filter(r=>r.kind==='interactive').length,2);assert.equal(progress.labEntries.length,0);assert.equal(progress.targets[0].observations.length,1);
 student(bob);progress=await(await api.progress(new Request('http://fixture/api/student-progress?class='+course))).json();assert.match(progress.rows.find(r=>r.kind==='quiz').statusLabel,/Locked/);assert.equal(progress.rows.find(r=>r.kind==='quiz').href,'/interactive-assignments/'+foundation);assert(!JSON.stringify(progress).includes('correct_index'));ok('Student gradebook has three separate entries, correct released score, locked prerequisite link and no lab grade');

 student(eve);assert.equal((await pairAction('share','Cannot submit before flagging make-up work.','evidence')).status,422);
 assert.equal((await pairAction('makeup')).status,200);const flag=rows('foundation_makeup_work')[0];assert.equal(flag.user_id,eve);
 assert.equal((await pairAction('makeup')).status,200);assert.equal(rows('foundation_makeup_work').length,1);assert.equal(rows('foundation_makeup_work')[0].flagged_at,flag.flagged_at);
 let solo=await(await call('partnerGet',foundation)).json();assert.equal(solo.pair.makeup,true);assert.equal(solo.pair.approved,false);assert(solo.pair.checkpoints.every(c=>!c.available));assert.equal(solo.pair.peerName,null);assert.equal(solo.pair.complete,false);
 assert.equal((await call('lessonSave',foundation,{version:0,state:answers(foundationLesson),submitId:randomUUID()})).status,409);
 assert.equal((await call('quizGet',quiz)).status,404);assert.equal((await pairAction('join',code)).status,422);
 assert.equal((await pairAction('share','Cannot skip to the last independent stop.','questions')).status,422);
 teacher();let roster=await(await api.assignmentList(new Request('http://fixture/api/interactive-assignments?slug='+foundationLesson.slug+'&class='+course))).json();assert.equal(roster.makeup[0].user_id,eve);assert(!JSON.stringify(roster.makeup).includes('responses'));
 const ownEmail=ctx.scopeEmail;ctx.scopeEmail='unrelated@example.test';roster=await(await api.assignmentList(new Request('http://fixture/api/interactive-assignments?slug='+foundationLesson.slug+'&class='+course))).json();assert.equal(roster.assignments.length,0);ctx.scopeEmail=ownEmail;
 student();roster=await(await api.assignmentList(new Request('http://fixture/api/interactive-assignments?slug='+foundationLesson.slug+'&class='+course))).json();assert.deepEqual(roster.makeup,[]);
 student(eve);assert.equal((await pairAction('share','Blocked without teacher approval.','evidence')).status,422);
 assert.equal((await call('partnerPost',foundation,{action:'approveMakeup',userId:eve})).status,403);
 assert.throws(()=>sql(`set role service_role;select foundation_approve_makeup(${q(foundation)},${q(eve)},'unrelated@example.test',false);`),/Only this class/);
 teacher();ctx.viewingAsTeacher=true;assert.equal((await call('partnerPost',foundation,{action:'approveMakeup',userId:eve})).status,403);ctx.viewingAsTeacher=false;
 ctx.scopeEmail='unrelated@example.test';assert.equal((await call('partnerPost',foundation,{action:'approveMakeup',userId:eve})).status,404);ctx.scopeEmail=ownEmail;
 assert.equal((await call('partnerPost',foundation,{action:'approveMakeup',userId:eve})).status,200);
 const approval=rows('foundation_makeup_work')[0].approved_at;assert(approval);assert.equal(rows('foundation_makeup_work')[0].approved_by,ownEmail);
 assert.equal((await call('partnerPost',foundation,{action:'approveMakeup',userId:eve})).status,200);assert.equal(rows('foundation_makeup_work')[0].approved_at,approval);
 student(eve);solo=await(await call('partnerGet',foundation)).json();assert.equal(solo.pair.approved,true);assert.equal(solo.pair.checkpoints[0].available,true);
 for(const stop of ['evidence','model','questions']){
  assert.equal((await pairAction('reply','Cannot critique before my own idea.',stop)).status,422);
  assert.equal((await pairAction('share','My independent '+stop+' idea cites the source and explains an uncertainty.',stop)).status,200);
  assert.equal((await pairAction('reflect','Cannot reflect before the critique.',stop)).status,422);
  assert.equal((await pairAction('reply','The example goes beyond its evidence. A second timed measurement would help check the claim.',stop)).status,200);
  assert.equal((await pairAction('reflect','My revised '+stop+' reasoning now states its assumptions and a way to test them.',stop)).status,200);
 }
 solo=await(await call('partnerGet',foundation)).json();assert.equal(solo.pair.complete,true);assert(solo.pair.checkpoints.every(c=>c.peer===null));
 let soloPayload={version:0,state:answers(foundationLesson),submitId:randomUUID()};assert.equal((await call('lessonSave',foundation,soloPayload)).status,200);assert.equal((await call('lessonSave',foundation,soloPayload)).status,200);
 const soloSaved=rows('interactive_assignment_submissions').find(s=>s.user_id===eve&&s.assignment_id===foundation);assert.equal(soloSaved.state.partner_exchange.mode,'independent');assert.equal(soloSaved.state.partner_exchange.checkpoints.length,3);assert(!JSON.stringify(soloSaved.state.partner_exchange).includes('peer'));
 const soloEvidence=api.foundationExchangeEvidence(soloSaved.state,foundationKey);assert.equal(soloEvidence.mode,'independent');assert(soloEvidence.checkpoints.every(c=>c.peer===null&&c.example));
 assert.equal((await call('quizGet',quiz)).status,404);assert.equal((await call('lessonSave',review,{version:0,state:answers(reviewLesson),submitId:randomUUID()})).status,200);assert.equal((await call('quizGet',quiz)).status,200);
 progress=await(await api.progress(new Request('http://fixture/api/student-progress?class='+course))).json();assert.equal(progress.rows.length,3);assert.equal(progress.labEntries.length,0);assert.equal(rows('mastery_records').length,1);
 assert.equal(sql("select has_function_privilege('authenticated','foundation_approve_makeup(uuid,uuid,text,boolean)','EXECUTE')"),'f');assert.equal(sql("select has_function_privilege('authenticated','foundation_makeup_action(uuid,uuid,text,text,text)','EXECUTE')"),'f');assert.equal(sql("select has_table_privilege('anon','foundation_makeup_work','SELECT')"),'f');
 ok('Make-up requests stay locked until this class’s teacher approves; approved alternatives retain individual evidence, gradebook entries and quiz gates');
 assert.equal(sql("select has_function_privilege('authenticated','foundation_checkpoint_action(uuid,uuid,text,text,text)','EXECUTE')"),'f');assert.equal(sql("select has_table_privilege('authenticated','foundation_checkpoint_responses','SELECT')"),'f');assert.equal(sql("select has_function_privilege('authenticated','foundation_partner_action(uuid,uuid,text,text)','EXECUTE')"),'f');assert.equal(sql("select has_function_privilege('anon','daily_lesson_missing(uuid[],uuid)','EXECUTE')"),'f');assert.equal(sql("select has_table_privilege('authenticated','foundation_pair_members','SELECT')"),'f');assert.equal(sql("select count(*) from pg_class where relname in ('foundation_pairs','foundation_pair_members','daily_lesson_sequences','daily_lesson_templates','foundation_checkpoint_responses','foundation_makeup_work') and relrowsecurity"),'6');ok('Direct browser database roles cannot read or write pair/sequence records');
 if(second||third||fourth||fifth||sixth||seventh||eighth||ninth){
  teacher();const otherTarget=id(70);sql(`insert into learning_targets(id,slug,unit_id,statement,program) values(${q(otherTarget)},'u1.anchor-know-unknow','unit-1','R1: Evidence','physics')`);
  assert.equal((await api.schedule(request({slug:'day-1-the-briefing',course_id:course,due_on:'2026-11-09',action:'calendar'}))).status,200);
  const dayOneBundle=rows('daily_lesson_sequences').find(b=>b.sequence_key==='unit-1-day-1');student(bob);
  assert.equal((await call('partnerPost',dayOneBundle.foundation_id,{action:'join',text:code})).status,422);
  assert.equal((await(await call('partnerGet',dayOneBundle.foundation_id)).json()).pair,null);
  student(eve);assert.equal((await(await call('partnerGet',dayOneBundle.foundation_id)).json()).pair,null);assert.equal((await call('quizGet',dayOneBundle.quiz_id)).status,404);
  assert.equal(JSON.stringify(rows('interactive_assignment_submissions').find(s=>s.id===saved.id)),snapshot);
  ok('Registered foundations keep separate partners, make-up approvals, prerequisites and immutable work');
 }

 if(fourth||fifth||sixth||seventh||eighth||ninth){
  const reviewBody={submissionId:saved.id,requestId:randomUUID(),targetId:target,level:2,feedback:'Your graph reasoning is clear. Explain the model limits in your own words.'};
  student();assert.equal((await api.foundationReview(request(reviewBody))).status,403);
  teacher();ctx.viewingAsTeacher=true;assert.equal((await api.foundationReview(request(reviewBody))).status,403);ctx.viewingAsTeacher=false;
  const email=ctx.scopeEmail;ctx.scopeEmail='unrelated@example.test';assert.equal((await api.foundationReview(request(reviewBody))).status,403);ctx.scopeEmail=email;
  const rated=await api.foundationReview(request(reviewBody));assert.equal(rated.status,201,await rated.clone().text());
  assert.equal((await api.foundationReview(request(reviewBody))).status,201);assert.equal(rows('interactive_assignment_reviews').filter(r=>r.submission_id===saved.id).length,1);
  assert.equal(rows('mastery_records').length,2);assert.equal(rows('simulation_lab_grades').length,0);
  const invalidLab={submissionId:saved.id,requestId:randomUUID(),revision:0,items:['science','reasoning','communication','transfer'].map(id=>({id,earned:4,possible:4,feedback:'Test'})),mastery:[{target_id:target,level:null,feedback:'Separate judgment'}],feedback:'Test'};
  assert.equal((await api.labRelease(request(invalidLab))).status,404);
  student();const detail=await(await call('lessonGet',foundation)).json();assert.equal(detail.grade,null);assert.equal(detail.reviews[0].level,2);
  progress=await(await api.progress(new Request('http://fixture/api/student-progress?class='+course))).json();assert.equal(progress.labEntries.length,0);assert.equal(progress.targets.find(t=>t.id===target).observations.length,2);
  assert.equal(JSON.stringify(rows('interactive_assignment_submissions').find(s=>s.id===saved.id)),snapshot);
  ok('Ordinary foundation mastery is teacher-only and idempotent; feedback reaches the student without creating a lab grade or changing their work');
 }

 if(third){
  const items=['science','reasoning','communication','transfer'].map((id,i)=>({id,earned:i===3?2:4,possible:4,feedback:'Evidence from the individual trial log and explanation.'}));
  const releaseBody={action:'release',submissionId:saved.id,requestId:randomUUID(),revision:0,items,mastery:[{target_id:target,level:null,feedback:'Need a classroom detector observation before choosing mastery.'}],feedback:'Your calculations are clear; strengthen the transfer explanation.'};
  student();assert.equal((await api.labRelease(request(releaseBody))).status,403);
  teacher();ctx.viewingAsTeacher=true;assert.equal((await api.labRelease(request(releaseBody))).status,403);ctx.viewingAsTeacher=false;
  const priorEmail=ctx.scopeEmail;ctx.scopeEmail='unrelated@example.test';assert.equal((await api.labRelease(request(releaseBody))).status,404);ctx.scopeEmail=priorEmail;
  assert.equal((await api.labRelease(request({...releaseBody,items:items.slice(0,3)}))).status,422);
  assert.throws(()=>sql(`set role service_role;select release_simulation_lab_grade(${q(saved.id)},${q(releaseBody.requestId)},0,${q(priorEmail)},false,'lab-response-v1',${json(items)},${json(releaseBody.mastery)},'old rubric');`),/four-dimension/);
  const submittedWork=rows('interactive_assignment_work').find(w=>w.assignment_id===foundation&&w.user_id===alice);
  sql(`update interactive_assignment_work set state=jsonb_set(state,'{answers,f3-rate}','"changed answer"'::jsonb) where assignment_id=${q(foundation)} and user_id=${q(alice)}`);
  assert.equal((await api.labRelease(request(releaseBody))).status,409,'Different actual answers must still reject stale release');
  sql(`update interactive_assignment_work set state=${json(submittedWork.state)} where assignment_id=${q(foundation)} and user_id=${q(alice)}`);
  const releaseResult=await api.labRelease(request(releaseBody));assert.equal(releaseResult.status,201,await releaseResult.clone().text());
  const lab=await releaseResult.json();assert.equal(lab.grade.earned,85);assert.equal(lab.grade.possible,100);
  assert.equal((await api.labRelease(request(releaseBody))).status,201);assert.equal(rows('simulation_lab_grades').length,1);
  assert.equal((await api.labRelease(request({...releaseBody,requestId:randomUUID()}))).status,409);
  assert.equal(rows('mastery_records').length,1,'Lab grade alone must not generate mastery');
  student();const detail=await(await call('lessonGet',foundation)).json();assert.equal(detail.grade.earned,85);
  const withLab=await(await api.progress(new Request('http://fixture/api/student-progress?class='+course))).json();
  assert.equal(withLab.labEntries.length,1);assert.equal(withLab.labEntries[0].percent,85);assert.equal(withLab.rows.find(r=>r.href==='/interactive-assignments/'+foundation).grade.percent,85);
  const average=api.studentLabTotal(withLab.labEntries,'all');assert.equal(average.percent,85);assert.equal(average.counted.length,1);
  student(bob);const peerProgress=await(await api.progress(new Request('http://fixture/api/student-progress?class='+course))).json();assert.equal(peerProgress.labEntries.length,0);
  teacher();const reviewSub=rows('interactive_assignment_submissions').find(s=>s.assignment_id===review&&s.user_id===alice&&s.version!==99);
  assert.equal((await api.labRelease(request({...releaseBody,submissionId:reviewSub.id}))).status,404);
  assert.throws(()=>sql(`set role service_role;select release_simulation_lab_grade(${q(reviewSub.id)},${q(randomUUID())},0,${q(priorEmail)},false,'lab-four-dimensions-v1',${json(items)},${json(releaseBody.mastery)},'Not a lab');`),/Lab unavailable/);
  assert.equal(sql("select has_table_privilege('authenticated','simulation_lab_grades','SELECT')"),'f');
  assert.equal(sql("select has_function_privilege('authenticated','release_simulation_lab_grade(uuid,uuid,integer,text,boolean,text,jsonb,jsonb,text)','EXECUTE')"),'f');
  assert.equal(JSON.stringify(rows('interactive_assignment_submissions').find(s=>s.id===saved.id)),snapshot);
  ok('Designated foundation lab releases four dimensions through the existing gradebook and header average, separately from mastery; authorization, retry and privacy hold');
  const sim=api.assignmentBySlug('simulation-race-track'),simAssignment=id(81),simSubmission=id(82),simState=answers(sim);
  const simTargets=sim.targets.map((slug,i)=>({id:id(90+i),slug}));
  sql(`insert into interactive_assignment_templates(slug,day,title,target_slugs) values(${q(sim.slug)},3,${q(sim.title)},array[${sim.targets.map(q)}]);
  ${simTargets.map(t=>`insert into learning_targets(id,slug,unit_id,statement,program) values(${q(t.id)},${q(t.slug)},'unit-1','Simulation target','physics') on conflict(slug) do nothing`).join(';')};
  insert into interactive_assignments(id,course_id,slug,target_id,due_on) values(${q(simAssignment)},${q(course)},${q(sim.slug)},${q(simTargets[0].id)},'2026-11-09');
  insert into interactive_assignment_work(assignment_id,user_id,state,version,status) values(${q(simAssignment)},${q(alice)},${json(simState)},1,'submitted');
  insert into interactive_assignment_submissions(id,assignment_id,user_id,state,version) values(${q(simSubmission)},${q(simAssignment)},${q(alice)},${json(simState)},1);`);
  const simMastery=sim.targets.map(slug=>({target_id:rows('learning_targets').find(t=>t.slug===slug).id,level:null,feedback:'Review classroom evidence separately.'}));
  const existingRelease=await api.labRelease(request({...releaseBody,submissionId:simSubmission,requestId:randomUUID(),mastery:simMastery}));
  assert.equal(existingRelease.status,201,await existingRelease.clone().text());assert.equal((await existingRelease.json()).grade.earned,85);
  ok('Existing simulation labs still release through the same four-dimension workflow');
  if(process.env.FOUNDATION_ADVISORS==='1'){
   const cli='/Users/craigantocci/.npm/_npx/aa8e5c70f9d8d161/node_modules/@supabase/cli-darwin-arm64/bin/supabase';
   try { const report=execFileSync(cli,['db','advisors','--db-url','postgresql://postgres@127.0.0.1:55439/'+database+'?sslmode=disable','--type','security','--fail-on','none','--output-format','json'],{encoding:'utf8',env:{...process.env,DO_NOT_TRACK:'1'}});
   fs.writeFileSync(out+'/advisors.json',report);
   } catch(error) { fs.writeFileSync(out+'/advisors.json',JSON.stringify({status:'unavailable',stdout:String(error.stdout||''),stderr:String(error.stderr||'')},null,2)); }
  }

 }
 await require('./checks.cjs')({api,sql,q,json,id,rows,request,call,student,teacher,course,otherCourse,alice,bob,eve,outsider,foundation,foundationLesson,reviewLesson,answers,ok,out,root});
 fs.writeFileSync(out+'/results.json',JSON.stringify({checks,passed:checks.length,source:'Actual local SQL + routes + gradebook reader; fictional students only'},null,2));console.log('Verified '+checks.length+' scenarios.');
})().catch(e=>{console.error(e.stderr?.toString()||e);process.exitCode=1}).finally(()=>{if(created)sql('drop database '+database+' with(force)','postgres')});
