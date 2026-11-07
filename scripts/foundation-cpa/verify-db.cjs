// Disposable PostgreSQL + actual route/reader verification. No production credentials or AI.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{execFileSync}=require('child_process'),{randomUUID}=require('crypto');
const root=process.cwd(),pkg=n=>require(root+'/node_modules/'+n),out=process.env.DAY_ONE_OUTPUT||'/private/tmp/day-one-verification';fs.mkdirSync(out,{recursive:true});
const ninth=process.env.FOUNDATION_DAY==='9',eighth=process.env.FOUNDATION_DAY==='8',seventh=process.env.FOUNDATION_DAY==='7',sixth=process.env.FOUNDATION_DAY==='6',fifth=process.env.FOUNDATION_DAY==='5',fourth=process.env.FOUNDATION_DAY==='4',third=process.env.FOUNDATION_DAY==='3',second=process.env.FOUNDATION_DAY==='2',foundationSlug=ninth?'day-9-foundation-inertia':eighth?'day-8-foundation-kinematics':seventh?'day-7-foundation-acceleration':sixth?'day-6-foundation-vector-tools':fifth?'day-5-foundation-prediction':fourth?'day-4-foundation-vectors':third?'day-3-foundation-velocity':second?'day-2-foundation-motion':'day-1-foundation-briefing',reviewSlug=ninth?'day-9-inertia':eighth?'day-8-kinematics-problems':seventh?'day-7-acceleration':sixth?'day-6-vectors':fifth?'day-5-predicting-position':fourth?'day-4-velocity-time-vectors':third?'day-3-velocity':second?'day-2-motion-language':'day-1-the-briefing',foundationKey=ninth?'day-nine':eighth?'day-eight':seventh?'day-seven':sixth?'day-six':fifth?'day-five':fourth?'day-four':third?'day-three':second?'day-two':'day-one',targetSlug=ninth?'u1.newtons-first-law-inertia':eighth?'u1.pick-equation-of-motion':seventh?'u1.acceleration-rate-of-change':sixth?'u1.vectors-tip-to-tail':fifth?'u1.predict-position-uncertainty':fourth?'u1.read-vt-graph-components':third?'u1.capture-pt-graph':second?'u1.vocab-position-distance-displacement':'u1.anchor-know-unknow';
const database='foundation_cpa_'+process.pid,pg=['-h','/private/tmp','-p','55439','-U','postgres','-v','ON_ERROR_STOP=1','-qAt'];
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
 if(columns!=='*'&&!columns.includes('('))data=data.map(r=>Object.fromEntries(columns.split(',').map(k=>[k,r[k]])));
 return Promise.resolve({data:single?data[0]??null:data,error:null}).then(resolve,reject);
 }catch(e){return Promise.resolve({data:null,error:{code:'P0001',message:String(e.stderr||e).split('\n')[0].replace(/^ERROR: */,'')}}).then(resolve,reject)}}};return query;},
 async rpc(name,p){try{const args=Object.entries(p).map(([k,v])=>`${k} => ${Array.isArray(v)&&!['p_items','p_mastery'].includes(k)?`array[${v.map(q)}]::uuid[]`:typeof v==='object'&&v!==null?json(v):q(v)}`);return {data:JSON.parse(sql(`set role service_role;select ${name}(${args})`)),error:null}}catch(e){return {data:null,error:{code:'P0001',message:String(e.stderr||e).split('\n')[0].replace(/^ERROR: */,'')}}}}
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
 sql("alter table rotation_calendar add anchor_date text default '2026-10-19',add anchor_p1_block text default 'A',add cycle_offset integer default 0,add alt_week_anchor text;grant select on lessons,lesson_class_windows,textbook_assignments,reading_syllabus_bundles,choice_sections,section_schedules to service_role;");
 sql(fs.readFileSync(root+'/scripts/teaching-unit-plans.sql','utf8'));
 const teachingCalendar=fs.readFileSync(root+'/supabase/migrations/20261026130823_worksheet_calendar_assignment.sql','utf8');sql(teachingCalendar.slice(teachingCalendar.indexOf('create or replace function public.schedule_teaching_activity')));
 sql('grant select,insert,update on units,courses,students,course_students,learning_targets,mastery_records to service_role');
 if(process.env.FOUNDATION_ADVISORS_ONLY==='1'){
  const cli='/Users/craigantocci/.npm/_npx/aa8e5c70f9d8d161/node_modules/@supabase/cli-darwin-arm64/bin/supabase';
  const report=execFileSync(cli,['db','advisors','--db-url','postgresql://postgres@127.0.0.1:55439/'+database+'?sslmode=disable','--type','security','--fail-on','none','--output-format','json'],{encoding:'utf8',env:{...process.env,DO_NOT_TRACK:'1'}});
  fs.writeFileSync(out+'/advisors.json',report);console.log('Local migrated schema advisor report saved.');return;
 }
 await pkg('esbuild').build({stdin:{contents:`export {GET as lessonGet,POST as lessonSave} from './src/app/api/interactive-assignments/[id]/route';export {POST as partnerPost} from './src/app/api/interactive-assignments/[id]/partner/route';export {assignmentBySlug} from './src/lib/interactive-assignments/catalog';export {foundationEdition} from './src/lib/interactive-assignments/foundations/core-questions';`,resolveDir:root,loader:'ts'},bundle:true,platform:'node',format:'cjs',outfile:out+'/api.cjs',logLevel:'silent',plugins:[plugin({
 'server-only':'','@/lib/supabase':'export const supabaseAdmin=global.dayOneDB;',
 '@/lib/api-auth':`export const withAuth=handler=>(request,options={})=>handler(request,{...global.dayOneContext,params:Promise.resolve(options.params??{})});`,
 '@/lib/review-desk/revision-server':`export const checkRevisionBeforeSubmit=async()=>null;export const recordRevisionSubmitted=async()=>{};`,
 '@/lib/interactive-assignments/grading-server':`export const processVelocitySubmission=async()=>({processed:false});`,
 'next/server':`export const NextResponse={json:(data,options)=>Response.json(data,options)};export const after=()=>{};`,
 })]});
 sql(fs.readFileSync(root+'/supabase/migrations/20261104135419_foundation_question_editions.sql','utf8'));
 const api=require(out+'/api.cjs'),base=api.assignmentBySlug(foundationSlug),cpa=api.foundationEdition(base,{foundationQuestionEdition:'cpa-v1'}),honors=api.foundationEdition(base);
 const call=(fn,key,body,url='http://fixture/api')=>api[fn](new Request(url,{method:body?'POST':'GET',...(body?{headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{})}),{params:{id:key}});
 sql(`insert into courses values(${q(course)},'CPA fixture','E','physics','cpa','teacher@example.test',null),(${q(otherCourse)},'Honors fixture','A','physics','honors','teacher@example.test',null);
 insert into students(id,name,email) values ${[alice,bob,eve,outsider].map((u,i)=>`(${q(u)},'Fixture ${i}',${q('fixture'+i+'@example.test')})`)};
 insert into course_students(course_id,student_id,enrollment_state) values ${[alice,bob,eve].map(u=>`(${q(course)},${q(u)},'ACTIVE')`)},(${q(otherCourse)},${q(outsider)},'ACTIVE');
 insert into units values('unit-1','Motion','physics');insert into learning_targets(id,slug,unit_id,statement,program) values(${q(target)},${q(targetSlug)},'unit-1','Fixture target','physics');`);
 const make=c=>JSON.parse(sql(`select public.set_interactive_assignment_date(${q(c)},${q(foundationSlug)},${q(target)},'2026-11-04','teacher@example.test')`)).id;
 const a=make(course),h=make(otherCourse);
 student();let r=await call('lessonGet',a,undefined,'http://fixture/api?edition=honors');assert.equal(r.status,200,await r.clone().text());assert.equal((await r.json()).questionEdition,'cpa-v1');
 student(outsider);r=await call('lessonGet',h,undefined,'http://fixture/api?edition=cpa');assert.equal((await r.json()).questionEdition,'honors-v1');
 r=await call('lessonGet',a);assert.equal(r.status,404);ok('Class track selects version; student URL overrides and cross-class access are rejected');
 teacher();r=await call('lessonGet',foundationSlug,undefined,'http://fixture/api?edition=cpa');assert.equal((await r.json()).questionEdition,'cpa-v1');
 r=await call('lessonSave',a,{version:0,state:{}});assert.equal(r.status,403);ok('Teacher can preview CPA but cannot save student work');
 const filled=(l,edition)=>({...(edition?{foundationQuestionEdition:edition}:{}),answers:Object.fromEntries(l.questions.map(q=>[q.id,q.diagram?'[{"label":"Earth","angle":270,"magnitude":10}]':q.options?'0':q.answer!==undefined?String(q.answer):'My own explanation with units and the requested evidence.'])),attempts:{}});
 student();r=await call('lessonSave',a,{version:0,state:filled(honors,'honors-v1')});assert.equal(r.status,409);assert.equal(rows('interactive_assignment_work').length,0);
 r=await call('lessonSave',a,{version:0,state:filled(cpa,'cpa-v1')});assert.equal(r.status,200,await r.clone().text());let w=rows('interactive_assignment_work')[0];assert.equal(w.state.foundationQuestionEdition,'cpa-v1');assert.equal(w.version,1);
 sql(`update courses set track='honors' where id=${q(course)}`);r=await call('lessonGet',a);assert.equal((await r.json()).questionEdition,'cpa-v1');sql(`update courses set track='cpa' where id=${q(course)}`);ok('Saved CPA edition is pinned; forged editions rejected before any write');
 const legacy=filled(base);sql(`insert into interactive_assignment_work(assignment_id,user_id,state,version) values(${q(a)},${q(bob)},${json(legacy)},1)`);
 student(bob);r=await call('lessonGet',a);const old=await r.json();assert.equal(old.questionEdition,undefined);assert.deepEqual(old.work.state,legacy);
 r=await call('lessonSave',a,{version:1,state:legacy});assert.equal(r.status,200);assert.deepEqual(rows('interactive_assignment_work').find(w=>w.user_id===bob).state.answers,legacy.answers);ok('Existing full Honors draft in CPA class retains all question keys and answers');
 student(outsider);r=await call('lessonSave',h,{version:0,state:filled(honors,'honors-v1')});assert.equal(r.status,200);assert.equal(rows('interactive_assignment_work').find(w=>w.user_id===outsider).state.foundationQuestionEdition,'honors-v1');ok('New Honors work keeps the original question set');
 student();const short=filled(cpa,'cpa-v1');short.answers[cpa.questions.at(-1).id]='';r=await call('lessonSave',a,{version:1,state:short,submitId:randomUUID()});assert.equal(r.status,422);assert.match((await r.json()).error,/Add a response/);assert.equal(rows('interactive_assignment_submissions').length,0);ok('Missing CPA answers block submission without changing saved work');
 r=await call('partnerPost',a,{action:'makeup',text:''});assert.equal(r.status,200,await r.clone().text());
 const submitId=randomUUID();r=await call('lessonSave',a,{version:1,state:filled(cpa,'cpa-v1'),submitId});assert.equal(r.status,409);assert.match((await r.json()).error,/approval/);
 r=await call('partnerPost',a,{action:'approveMakeup',userId:alice});assert.equal(r.status,403);
 teacher();r=await call('partnerPost',a,{action:'approveMakeup',userId:alice});assert.equal(r.status,200,await r.clone().text());
 student();for(const checkpoint of ['evidence','model','questions'])for(const action of ['share','reply','reflect']){r=await call('partnerPost',a,{action,checkpoint,text:'My individual explanation refers to the given evidence and checks the source.'});assert.equal(r.status,200,await r.clone().text())}
 r=await call('lessonSave',a,{version:1,state:filled(cpa,'cpa-v1'),submitId});assert.equal(r.status,200,await r.clone().text());const sub=rows('interactive_assignment_submissions')[0];assert.equal(sub.state.foundationQuestionEdition,'cpa-v1');assert.equal(sub.state.partner_exchange.mode,'independent');assert.deepEqual(api.foundationEdition(base,sub.state).questions,cpa.questions);ok('CPA submission requires teacher-approved solo work and freezes correct question version and individual discussion evidence');
 r=await call('lessonSave',a,{version:1,state:filled(cpa,'cpa-v1'),submitId});assert.equal(r.status,200);assert.equal(rows('interactive_assignment_submissions').length,1);ok('Retry is idempotent and does not duplicate student submissions');
 const seq=rows('daily_lesson_sequences').find(s=>s.foundation_id===a);assert.deepEqual(JSON.parse(sql(`select daily_review_missing(array[${q(seq.review_id)}::uuid],${q(alice)})`)),[]);assert(JSON.parse(sql(`select daily_review_missing(array[${q(seq.review_id)}::uuid],${q(bob)})`)).length);ok('Spaced review unlocks only for the student with a valid CPA submission');
 const originalIds=base.questions.map(q=>q.id),coreIds=cpa.questions.map(q=>q.id);
 assert.deepEqual(JSON.parse(sql(`select to_jsonb(foundation_required_question_ids(${q(base.slug)},${json({answers:legacy.answers})},array[${originalIds.map(q).join(',')}]::text[]))`)),originalIds);
 assert.deepEqual(JSON.parse(sql(`select to_jsonb(foundation_required_question_ids(${q(base.slug)},${json(filled(honors))},array[${originalIds.map(q).join(',')}]::text[]))`)),coreIds);
 assert.equal(sql("select has_function_privilege('anon','public.foundation_required_question_ids(text,jsonb,text[])','execute')"),'f');
 assert.equal(sql("select prosecdef from pg_proc where proname='foundation_required_question_ids'"),'f');
 ok('Database retains legacy requirements, recognizes prior shortened Honors work, and grants no anonymous helper access');
 fs.writeFileSync(out+'/results.json',JSON.stringify({checks,passed:checks.length,source:'Actual isolated PostgreSQL and API routes; no production writes or model calls'},null,2));
})().catch(e=>{console.error(e.stderr?.toString()||e);process.exitCode=1}).finally(()=>{if(created)sql('drop database '+database+' with(force)','postgres')});
