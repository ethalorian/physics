/* Full assignment → student evidence → teacher review → canonical Knowledge rating.
 * Real application handlers + real PostgreSQL migrations. Authentication alone is
 * synthetic; a unique LOCAL database is created, never production/student data.
 * --serve keeps that disposable database for a browser walkthrough on port 4326.
 */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),assert=require('node:assert/strict'),crypto=require('node:crypto'),http=require('node:http');
const {build}=require('esbuild');const root=path.resolve(__dirname,'..');
const db=`vocab_flow_${process.pid}`,base='postgresql://craigantocci@127.0.0.1:55439/',psql='/opt/homebrew/opt/postgresql@14/bin/psql',tmp=fs.mkdtempSync(path.join(os.tmpdir(),'vocab-integrity-'));
const sql=(q,d=db)=>{const r=cp.spawnSync(psql,[base+d,'-XAt','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose','-c',q],{encoding:'utf8'});if(r.status)throw Object.assign(new Error(r.stderr),{code:r.stderr.match(/ERROR:\s+(\w{5}):/)?.[1]});return r.stdout.trim()};
const lit=v=>v==null?'null':`'${String(typeof v==='object'?JSON.stringify(v):v).replaceAll("'","''")}'`;
const col=k=>{assert.match(k,/^[a-z_]+$/);return `"${k}"`};
const json=q=>JSON.parse(sql(`select coalesce(jsonb_agg(to_jsonb(q)),'[]') from (${q})q`));
class Query{
 constructor(table){this.table=col(table);this.filters=[];this.sorts=[];this.columns='*';this.offset=0;this.count=null;this.action='read'}
 select(s='*'){this.columns=s;return this}eq(k,v){this.filters.push(`${col(k)}=${lit(v)}`);return this}in(k,v){this.filters.push(v.length?`${col(k)} in (${v.map(lit)})`:'false');return this}is(k,v){assert.equal(v,null);this.filters.push(`${col(k)} is null`);return this}not(k,op,v){assert.equal(op,'is');assert.equal(v,null);this.filters.push(`${col(k)} is not null`);return this}contains(k,v){this.filters.push(`${col(k)} @> array[${v.map(lit)}]::uuid[]`);return this}gte(k,v){this.filters.push(`${col(k)}>=${lit(v)}`);return this}
 order(k,o={}){this.sorts.push(`${col(k)} ${o.ascending===false?'desc':'asc'}`);return this}range(a,b){this.offset=a;this.count=b-a+1;return this}limit(n){this.count=n;return this}single(){this.one=true;return this}maybeSingle(){this.one=true;return this}
 insert(rows){this.action='insert';this.rows=Array.isArray(rows)?rows:[rows];return this}upsert(rows){this.insert(rows);this.conflict=true;return this}update(row){this.action='update';this.row=row;return this}
 async then(resolve,reject){try{
 let q,where=this.filters.length?' where '+this.filters.join(' and '):'';
 if(this.action==='insert'){const keys=[...new Set(this.rows.flatMap(Object.keys))];q=`insert into ${this.table} (${keys.map(col)}) select ${keys.map(col)} from jsonb_populate_recordset(null::${this.table},${lit(this.rows)}::jsonb) ${this.conflict?'on conflict(user_id,event_id) do nothing':''} returning *`}
 else if(this.action==='update'){q=`update ${this.table} set ${Object.keys(this.row).map(k=>`${col(k)}=(jsonb_populate_record(null::${this.table},${lit(this.row)}::jsonb)).${col(k)}`)}${where} returning *`}
 else {let selection=this.columns;if(selection.includes('students('))selection=selection.replace('students(id,name)',`(select jsonb_build_object('id',s.id,'name',s.name) from students s where s.id=student_id) students`);q=`select ${selection} from ${this.table}${where}${this.sorts.length?' order by '+this.sorts.join(','):''}${this.count!==null?' limit '+this.count:''} offset ${this.offset}`}
 const rows=this.action==='read'?json(q):JSON.parse(sql(`with changed as (${q}) select coalesce(jsonb_agg(to_jsonb(changed)),'[]') from changed`));
 if(this.one&&rows.length>1)throw Error('Expected at most one row');return resolve({data:this.one?rows[0]??null:rows,error:null});
 }catch(e){return resolve({data:null,error:{code:e.code,message:e.message}})}}
}
const id=n=>`20000000-0000-4000-8000-${String(n).padStart(12,'0')}`,teacher=id(1),student=id(2),second=id(3),course=id(4),target=id(5),set=id(6);
const words=[{id:id(7),term:'position',definition:'Where an object is',tier:3,vocabulary_set_id:set},{id:id(8),term:'displacement',definition:'Change in position',tier:3,vocabulary_set_id:set}];
const auth=`const ctx=r=>{const role=r.headers.get('x-test-role')||'teacher';return {userId:role==='student'?(r.headers.get('x-test-student')||'${student}'):'${teacher}',role,realRole:role,email:'teacher@test',scopeEmail:r.headers.get('x-test-email')||'teacher@test',params:Promise.resolve({})}};export const withAuth=f=>r=>f(r,ctx(r));export const withRole=(roles,f)=>withAuth((r,c)=>roles.includes(c.role)?f(r,c):new Response('{}',{status:403}));export const withContentEditor=(_area,f)=>withRole(['teacher','admin'],f);`;
let created=false;
async function main(){
 sql(`create database ${db}`,'postgres');created=true;
 sql(`create table students(id uuid primary key,name text,email text);create table courses(id uuid primary key,name text,section text,program text,teacher_email text,archived_at timestamptz);create table course_students(id uuid primary key default gen_random_uuid(),course_id uuid,student_id uuid,enrollment_state text);create table learning_targets(id uuid primary key,statement text,slug text,domain text,program text,unit_id text,lesson_id uuid,order_index int);create table vocabulary_sets(id uuid primary key,name text,lesson_id uuid,unit_id text,published bool,archived bool default false);create table vocabulary_terms(id uuid primary key,vocabulary_set_id uuid,term text,definition text,tier int,icon text,cognate text,definition_es text,translations jsonb default '{}',example text,archived bool default false);create table vocab_attempts(id uuid primary key default gen_random_uuid(),user_id uuid,term_id uuid,set_id uuid,game text,correct bool,response_ms int,event_id text,occurred_at timestamptz,supports text[],created_at timestamptz default now());create unique index vocab_attempt_event on vocab_attempts(user_id,event_id);create table mastery_records(id uuid primary key default gen_random_uuid(),user_id uuid,target_id uuid,level smallint,rated_by text,evidence_source text,observed_at timestamptz default now());`);
 const read=f=>fs.readFileSync(path.join(root,'supabase/migrations',f),'utf8');
 const learning=read('20260907012349_vocabulary_learning.sql');sql(learning.slice(learning.indexOf('create table public.vocab_target_terms'),learning.indexOf('create or replace function public.save_vocab_terms')));
 for(const f of ['20260911121453_vocab_task_duplicate_guard.sql','20260911130619_vocab_assessments_and_teacher_reviews.sql','20260917021723_vocab_mastery_control_room.sql','20260917023834_vocab_assignment_to_rating_integrity.sql','20260917035533_vocabulary_checkpoints.sql','20260917041108_checkpoint_server_write_grants.sql'])sql(read(f));
 global.__integrityDb={from:t=>new Query(t),rpc:async(name,p)=>{try{assert.ok(['submit_vocab_mastery_review','create_vocab_checkpoint','mutate_vocab_checkpoint'].includes(name));const q=`select public.${name}(${Object.entries(p).map(([k,v])=>`${col(k)}=>${lit(v)}${k==='p_level'?'::smallint':''}`).join(',')})`;return {data:JSON.parse(sql(q)),error:null}}catch(e){return {data:null,error:{code:e.code,message:e.message}}}}};
 async function insert(t,rows){const r=await new Query(t).insert(rows);if(r.error)throw Error(r.error.message);return r.data}
 await insert('students',[{id:student,name:'Test learner',email:'learner@test'},{id:second,name:'Second learner',email:'second@test'}]);
 await insert('courses',[{id:course,name:'Motion class',section:'A',program:'physics',teacher_email:'teacher@test'},{id:id(40),name:'Other class',program:'physics',teacher_email:'other@test'}]);
 await insert('course_students',[{course_id:course,student_id:student,enrollment_state:'ACTIVE'},{course_id:course,student_id:second,enrollment_state:'ACTIVE'}]);
 await insert('learning_targets',[{id:target,statement:'Use precise vocabulary to describe motion.',domain:'knowledge',program:'physics',unit_id:'unit-1',order_index:1},{id:id(50),statement:'Make a graph',domain:'process',program:'physics',unit_id:'unit-1',order_index:2},{id:id(51),statement:'Trades terms',domain:'knowledge',program:'trades',unit_id:'trades-1',order_index:1}]);
 await insert('vocabulary_sets',[{id:set,name:'Motion words',unit_id:'unit-1',published:true}]);await insert('vocabulary_terms',words);
 const routes=await build({stdin:{contents:`export * as checkpoints from './src/app/api/vocab/checkpoints/route';export { CHECKPOINT_QUESTIONS } from './src/lib/vocab-checkpoint-content';export { checkpointScore } from './src/lib/vocab-checkpoint';export * as tasks from './src/app/api/vocab/tasks/route';export * as checks from './src/app/api/vocab/checks/route';export * as catalog from './src/app/api/vocab/catalog/route';export * as play from './src/app/api/vocab/play/route';export * as mastery from './src/app/api/vocab/mastery/route';export * as records from './src/app/api/mastery/records/route';export { targetValue } from './src/data/curriculum-types';`,resolveDir:root},bundle:true,write:false,platform:'node',format:'cjs',plugins:[{name:'fixture-auth-and-transport',setup(b){b.onResolve({filter:/^server-only$/},()=>({path:'server-only',namespace:'stub'}));b.onResolve({filter:/^@\/lib\/(api-auth|supabase)$/},a=>({path:a.path,namespace:'stub'}));b.onLoad({filter:/.*/,namespace:'stub'},a=>({contents:a.path==='server-only'?'':a.path.endsWith('api-auth')?auth:'export const supabaseAdmin=globalThis.__integrityDb;',loader:'js'}));b.onResolve({filter:/^next\/server$/},()=>({path:require.resolve('next/server'),external:true}))}}]});
 fs.writeFileSync(path.join(tmp,'routes.cjs'),routes.outputFiles[0].text);const api=require(path.join(tmp,'routes.cjs'));
 async function req(route,method='GET',body=null,role='teacher',query='',who=student,email='teacher@test'){const r=await api[route][method](new Request(`http://test/api/${route}${query}`,{method,headers:{'Content-Type':'application/json','x-test-role':role,'x-test-student':who,'x-test-email':email},...(body?{body:JSON.stringify(body)}:{})}));return {status:r.status,data:await r.json()}}
 const expect=async(p,status=200)=>{const r=await p;assert.equal(r.status,status,JSON.stringify(r.data));return r.data};
 const payload={course_ids:[course],term_ids:words.map(w=>w.id),target_id:target,title:'Motion practice',threshold:80,min_checks:1,check_mode:'recognition'};
 await expect(req('tasks','POST',{...payload,target_id:null}),400);await expect(req('tasks','POST',{...payload,target_id:id(50)}),400);await expect(req('tasks','POST',{...payload,target_id:id(51)}),400);await expect(req('tasks','POST',payload,'student'),403);await expect(req('tasks','POST',{...payload,course_ids:[id(40)]}),403);
 const task=(await expect(req('tasks','POST',payload))).task_ids[0];assert.ok(task);
 await expect(req('tasks','POST',{...payload,term_ids:[...payload.term_ids].reverse()}),409);
 const individual=(await expect(req('tasks','POST',{...payload,student_ids:[second]}))).task_ids[0];assert.ok(individual,'individual review allowed on same words');
 assert.equal((await expect(req('tasks','GET',null,'student'))).tasks.length,1,'only own assigned work');
 const play=await expect(req('play','GET',null,'student','?task_id='+task));assert.equal(play.terms.length,2,'game receives assignment words');
 await expect(req('checks','POST',{task_id:individual},'student'),403);
 const start=await expect(req('checks','POST',{task_id:task},'student'));assert.equal((await expect(req('checks','POST',{task_id:task},'student'))).check_id,start.check_id);
 const duplicateCheck=await new Query('vocab_checks').insert({task_id:task,user_id:student,items:[]});assert.equal(duplicateCheck.error.code,'23505','database rejects concurrent unfinished check');
 await expect(req('checks','POST',{task_id:task,check_id:start.check_id,responses:start.items.map(i=>({id:i.id,response:'made-up-option',supports:[]}))},'student'),400);
 const submitted=await expect(req('checks','POST',{task_id:task,check_id:start.check_id,responses:start.items.map(i=>({id:i.id,response:words.find(w=>w.definition===i.prompt).id,supports:['translation']}))},'student'));assert.ok(submitted.result.every(r=>r.correct));
 assert.equal(json('select * from mastery_records').length,0,'practice never auto-grades Knowledge');
 let evidence=(await expect(req('mastery'))).tasks.find(t=>t.id===task).progress.find(p=>p.studentId===student);assert.equal(evidence.status,'pending');
 const rating={user_id:student,target_id:target,level:2,vocabulary:{task_id:task,request_id:crypto.randomUUID(),evidence_key:evidence.evidenceKey,previous_review_id:null,note:'Private teacher note'}};
 await expect(req('records','POST',rating,'student'),403);await expect(req('records','POST',rating,'teacher','',student,'other@test'),403);
 const saved=await expect(req('records','POST',rating),201);await expect(req('records','POST',rating),201);assert.equal(json('select * from mastery_records').length,1,'lost-response retry writes one canonical grade');
 let card=(await expect(req('tasks','GET',null,'student'))).tasks.find(t=>t.id===task);assert.equal(card.progress[0].masteryRating.level,2);assert.ok(!JSON.stringify(card).includes('Private teacher note'));
 let detail=await expect(req('checks','GET',null,'student','?task_id='+task));assert.equal(detail.rating.level,2);assert.ok(!JSON.stringify(detail.rating).includes('note'));
 const canonical=json('select * from mastery_records order by observed_at');assert.equal(api.targetValue(canonical.map(r=>({level:r.level,observedAt:r.observed_at}))),2,'canonical Knowledge rollup reads vocabulary evidence');
 await expect(req('records','POST',{...rating,vocabulary:{...rating.vocabulary,request_id:crypto.randomUUID()}}),409);
 const rerate={...rating,level:3,vocabulary:{...rating.vocabulary,request_id:crypto.randomUUID(),previous_review_id:saved.id}};await expect(req('records','POST',rerate),201);
 assert.ok(Math.abs(api.targetValue(json('select * from mastery_records order by observed_at').map(r=>({level:r.level,observedAt:r.observed_at})))-2.6)<1e-10,'existing 0.60 decay preserved');
 for(const format of ['multiple_choice','matching','recall','definition','sentence','quiz_game']){
 const quiz=(await expect(req('tasks','POST',{...payload,task_kind:'quiz',quiz_format:format,title:`Motion ${format}`}))).task_ids[0];
 const q=await expect(req('checks','POST',{task_id:quiz},'student'));const manual=['definition','sentence'].includes(format);const rows=json(`select items from vocab_checks where id=${lit(q.check_id)}`)[0].items;
 await expect(req('checks','POST',{task_id:quiz,check_id:q.check_id,responses:rows.map(i=>({id:i.id,response:manual?`My explanation of ${i.word.term}`:format==='recall'?i.word.term:i.word.id,supports:[]}))},'student'));
 let e=(await expect(req('mastery'))).tasks.find(t=>t.id===quiz).progress.find(p=>p.studentId===student);assert.equal(e.status,manual?'quiz-review':'pending');
 const body={user_id:student,target_id:target,level:3,vocabulary:{task_id:quiz,request_id:crypto.randomUUID(),evidence_key:e.evidenceKey,previous_review_id:null,note:''}};
 if(manual){await expect(req('records','POST',body),409);const grades=rows.map(i=>({term_id:i.word.id,correct:true,feedback:'Precise use.'}));await expect(req('checks','PATCH',{task_id:quiz,check_id:q.check_id,review_version:0,grades}));await expect(req('checks','PATCH',{task_id:quiz,check_id:q.check_id,review_version:0,grades}),409);await expect(req('records','POST',body),409);e=(await expect(req('mastery'))).tasks.find(t=>t.id===quiz).progress.find(p=>p.studentId===student);body.vocabulary.evidence_key=e.evidenceKey;}
 await expect(req('records','POST',body),201);assert.equal((await expect(req('checks','POST',{task_id:quiz},'student'))).completed,true);
 }
 sql(`update course_students set enrollment_state='REMOVED' where student_id=${lit(student)}`);assert.equal((await expect(req('tasks','GET',null,'student'))).tasks.length,0);await expect(req('records','POST',rating),409);assert.ok((await expect(req('tasks'))).tasks.every(t=>t.progress.every(p=>p.studentId!==student)));sql(`update course_students set enrollment_state='ACTIVE'`);
 sql(`update courses set archived_at=now() where id=${lit(course)}`);await expect(req('checks','GET',null,'student','?task_id='+task),403);assert.equal((await expect(req('tasks','GET',null,'student'))).tasks.length,0);sql(`update courses set archived_at=null`);
 console.log('PASS: real routes + PostgreSQL: assignment validation, audience/format duplicates, assigned game words, check resume, option validation, all six quizzes, written review, canonical grades/decay, retries, stale evidence, student feedback/privacy, removed enrollment and archived class.');
 // Checkpoint contract: actual handlers, private snapshots, database locks and canonical evidence.
 const more=[{id:id(70),term:'distance',definition:'Total path length'},{id:id(71),term:'speed',definition:'How fast an object moves'},{id:id(72),term:'velocity',definition:'Speed with direction'},{id:id(73),term:'trajectory',definition:'The path through space'}].map(w=>({...w,tier:3,vocabulary_set_id:set}));
 await insert('vocabulary_terms',more);
 const checkpointWords=[...words,...more];
 await expect(req('checkpoints','PUT',{term_ids:checkpointWords.map(w=>w.id)},'student'),403);
 const questions=(await expect(req('checkpoints','PUT',{term_ids:checkpointWords.map(w=>w.id)}))).questions;
 assert.deepEqual(questions,api.CHECKPOINT_QUESTIONS);
 const checkpoint=(await expect(req('tasks','POST',{...payload,term_ids:checkpointWords.map(w=>w.id),task_kind:'quiz',quiz_format:'checkpoint',title:'Motion vocabulary checkpoint',questions}))).task_ids[0];
 await expect(req('tasks','POST',{...payload,student_ids:[second],term_ids:checkpointWords.map(w=>w.id),task_kind:'quiz',quiz_format:'checkpoint',title:'Invalid quiz',questions:questions.slice(1)}),400);
 assert.equal(json('select * from vocab_checkpoint_blueprints').length,1,'invalid blueprint creates no assignment');
 const cpReq=(action,extra={},role='student',who=student,email='teacher@test')=>req('checkpoints','POST',{task_id:checkpoint,action,attempt_id:action==='start'?undefined:a.id,...extra},role,'',who,email);
 await expect(req('checks','POST',{task_id:checkpoint},'student'),409);
 let a=(await expect(cpReq('start'))).attempt;
 assert.ok(a.id);assert.ok(a.questions.every(q=>!('answer' in q)&&!('explanation' in q)),'keys not in student start');
 assert.equal((await expect(cpReq('start'))).attempt.id,a.id,'start idempotent');
 await expect(cpReq('score',{student_id:student,version:0,question_id:'q9',points:4,note:''}),403);
 await expect(cpReq('submit',{version:a.version,answers:{q1:'1'}}),409);
 await expect(cpReq('save',{version:a.version,answers:{q1:'-1'}}),409);
 await expect(cpReq('save',{version:a.version,answers:{evil:'bad'}}),409);
 a=(await expect(cpReq('save',{version:a.version,answers:{q1:'1'}}))).attempt;
 await expect(cpReq('save',{version:0,answers:{q1:'0'}}),409);
 assert.equal((await expect(req('checkpoints','GET',null,'student','?task_id='+checkpoint))).attempts[0].answers.q1,'1','draft resumes across requests');
 const answers=Object.fromEntries(questions.map(q=>[q.id,q.part==='explain'?'A clear explanation connecting the terms to the situation.':String(q.answer)]));
 a=(await expect(cpReq('submit',{version:a.version,answers}))).attempt;
 assert.equal(a.submitted,true);assert.equal(Object.keys(a.scores).length,0);
 assert.equal((await expect(cpReq('submit',{version:1,answers}))).attempt.id,a.id,'final submit retry idempotent');
 await expect(cpReq('save',{version:a.version,answers:{}}),409);
 let progress=(await expect(req('mastery'))).tasks.find(t=>t.id===checkpoint).progress.find(p=>p.studentId===student);
 assert.equal(progress.status,'quiz-review');
 let ratingCp={user_id:student,target_id:target,level:3,vocabulary:{task_id:checkpoint,request_id:crypto.randomUUID(),evidence_key:progress.evidenceKey,previous_review_id:null,note:'Precise vocabulary.'}};
 await expect(req('records','POST',ratingCp),409);
 await expect(cpReq('release',{student_id:student,version:a.version},'teacher'),409);
 await expect(cpReq('score',{student_id:student,version:a.version,question_id:'q9',points:4,note:''},'teacher',student,'other@test'),403);
 const scoreCp=async(points)=>{for(const [i,q]of questions.filter(q=>q.part==='explain').entries())a=(await expect(cpReq('score',{student_id:student,version:a.version,question_id:q.id,points:points[i],note:'Specific feedback.'},'teacher'))).attempt};
 await scoreCp([4,2]);
 const hidden=(await expect(req('checkpoints','GET',null,'student','?task_id='+checkpoint))).attempts[0];
 assert.deepEqual(hidden.scores,{});assert.deepEqual(hidden.notes,{});assert.ok(hidden.questions.every(q=>!('answer'in q)&&!('explanation'in q)));
 assert.equal((await expect(req('tasks','GET',null,'student'))).tasks.find(t=>t.id===checkpoint).progress[0].quiz.score,null,'unreleased score remains pending');
 a=(await expect(cpReq('release',{student_id:student,version:a.version},'teacher'))).attempt;
 assert.equal(api.checkpointScore(a.questions,a).percent,90);
 const released=(await expect(req('checkpoints','GET',null,'student','?task_id='+checkpoint))).attempts[0];
 assert.equal(released.scores.q10,2);assert.equal(released.notes.q10,'Specific feedback.');assert.equal(released.questions[0].answer,1);
 assert.equal((await expect(req('tasks','GET',null,'student'))).tasks.find(t=>t.id===checkpoint).progress[0].quiz.score,90,'student Home uses weighted 20-point percentage');
 assert.equal((await expect(cpReq('release',{student_id:student,version:a.version-1},'teacher'))).attempt.id,a.id);
 await expect(cpReq('score',{student_id:student,version:a.version,question_id:'q10',points:4,note:''},'teacher'),409);
 progress=(await expect(req('mastery'))).tasks.find(t=>t.id===checkpoint).progress.find(p=>p.studentId===student);
 assert.equal(progress.status,'pending');assert.ok(progress.words.every(w=>w.attempts>0),'all assessed words receive evidence');ratingCp.vocabulary.evidence_key=progress.evidenceKey;
 await expect(req('records','POST',ratingCp),201);
 const beforeKey=progress.evidenceKey;
 await expect(cpReq('retake',{student_id:student,version:a.version,questions},'teacher'),400);
 for(const points of [[0,0],[4,4]]){
   const priorAttempt=a;
   const newQuestions=questions.map((q,i)=>({...q,prompt:i>=4?`New situation ${a.number+1}: ${q.prompt}`:q.prompt}));
   a=(await expect(cpReq('retake',{student_id:student,version:a.version,questions:newQuestions},'teacher'))).attempt;
   assert.equal(a.submitted,false);assert.deepEqual(a.answers,{});
   assert.equal((await expect(req('tasks','GET',null,'student'))).tasks.find(t=>t.id===checkpoint).progress[0].quiz.submitted,false,'reassessment returns to student To do');
   await expect(cpReq('submit',{attempt_id:priorAttempt.id,version:a.version,answers}),409);
   a=(await expect(cpReq('submit',{version:a.version,answers}))).attempt;await scoreCp(points);
   a=(await expect(cpReq('release',{student_id:student,version:a.version},'teacher'))).attempt;
   const expected=points[0]===0?90:100;
   assert.equal((await expect(req('tasks','GET',null,'student'))).tasks.find(t=>t.id===checkpoint).progress[0].quiz.score,expected,'higher released grade retained');
   const now=(await expect(req('mastery'))).tasks.find(t=>t.id===checkpoint).progress.find(p=>p.studentId===student);
   assert.equal(now.status,points[0]===0?'rated':'pending','only changed best evidence needs another mastery judgment');
   assert.equal(now.evidenceKey===beforeKey,points[0]===0);
 }
 assert.equal(json('select * from vocab_checkpoint_attempts').length,3,'history preserved');
 assert.equal(json("select * from vocab_checkpoint_events where action='release'").length,3,'retries do not duplicate release audit');
 assert.equal(json(`select * from vocab_checks where task_id=${lit(checkpoint)}`).length,1,'one canonical best evidence record');
 const secondView=await expect(req('checkpoints','GET',null,'student','?task_id='+checkpoint,second));assert.equal(secondView.attempts.length,0,'no other student answers');
 sql(`update course_students set enrollment_state='REMOVED' where student_id=${lit(student)}`);
 await expect(cpReq('start'),403);await expect(req('checkpoints','GET',null,'student','?task_id='+checkpoint),403);
 sql(`update course_students set enrollment_state='ACTIVE'`);
 assert.equal(json("select has_table_privilege('authenticated','vocab_checkpoint_attempts','select') allowed")[0].allowed,false);
 assert.equal(json("select has_function_privilege('anon','public.mutate_vocab_checkpoint(uuid,uuid,text,boolean,text,integer,jsonb,uuid)','execute') allowed")[0].allowed,false);
 console.log('PASS: checkpoints — assignment, private keys, resumable drafts, submit lock, concurrent version checks, partial credit, release/privacy, weighted grades, canonical mastery, fresh reassessments, best grade/history, own-roster scope and RLS grants.');

 // Editing a requirement recalculates readiness from existing evidence, without changing that evidence.
 await expect(req('tasks','PATCH',{id:task,min_checks:5}));
 const secondCheck=await expect(req('checks','POST',{task_id:task},'student'));
 await expect(req('checks','POST',{task_id:task,check_id:secondCheck.check_id,responses:secondCheck.items.map(i=>({id:i.id,response:words.find(w=>w.definition===i.prompt).id,supports:[]}))},'student'));
 const beforeChecks=json('select * from vocab_checks order by id'),beforeRatings=json('select * from mastery_records order by id'),beforeTask=json(`select * from vocab_tasks where id=${lit(task)}`)[0];
 assert.equal((await expect(req('tasks','GET',null,'student'))).tasks.find(t=>t.id===task).progress[0].complete,false);
 await expect(req('tasks','PATCH',{id:task,min_checks:2},'student'),403);
 await expect(req('tasks','PATCH',{id:task,min_checks:2},'teacher','',student,'other@test'),403);
 for(const min_checks of [0,6,1.5,'2',null])await expect(req('tasks','PATCH',{id:task,min_checks}),400);
 for(const patch of [{threshold:49},{threshold:100.5},{title:''},{note:'x'.repeat(2001)},{due_on:'2026-02-30'},{term_ids:[]},{}])await expect(req('tasks','PATCH',{id:task,...patch}),400);
 await expect(req('tasks','PATCH',{id:checkpoint,min_checks:2}),400);
 await expect(req('tasks','PATCH',{id:checkpoint,threshold:90}),400);
 await expect(req('tasks','PATCH',{id:task,min_checks:2,title:'Motion practice · revised',note:'Two checks per word.',due_on:'2026-09-30'}));
 const revised=(await expect(req('tasks','GET',null,'student'))).tasks.find(t=>t.id===task);
 assert.equal(revised.min_checks,2);assert.equal(revised.progress[0].complete,true,'student progress recalculates after lowering five checks to two');
 assert.equal((await expect(req('mastery'))).tasks.find(t=>t.id===task).progress.find(p=>p.studentId===student).ready,2,'Control Room recalculates the word goals');
 assert.deepEqual(json('select * from vocab_checks order by id'),beforeChecks,'no saved answers or history changed');
 assert.deepEqual(json('select * from mastery_records order by id'),beforeRatings,'no Knowledge ratings changed');
 const afterTask=json(`select * from vocab_tasks where id=${lit(task)}`)[0];
 for(const key of ['words','term_ids','student_ids','target_id','threshold','check_mode','created_at'])assert.deepEqual(afterTask[key],beforeTask[key],`preserves ${key}`);
 await expect(req('tasks','PATCH',{id:task,min_checks:5}));
 assert.equal((await expect(req('tasks','GET',null,'student'))).tasks.find(t=>t.id===task).progress[0].complete,false,'raising the requirement uses the same saved evidence');
 console.log('PASS: edit practice requirements 5 → 2 → 5, student and teacher readiness, saved evidence/ratings preserved, own-class access, invalid settings and quiz guards.');
 const catalogArg=process.argv.indexOf('--catalog');
 if(catalogArg>=0){
  const authoredSets=JSON.parse(fs.readFileSync(process.argv[catalogArg+1],'utf8')).filter(s=>s.unit_id==='unit-1'||['Week vocab · Read the track · Describing motion','Trades Unit 1 — Measurement and evidence'].includes(s.name));
  for(const set of authoredSets){
   await insert('vocabulary_sets',[{id:set.id,name:set.name,unit_id:set.unit_id,published:true}]);await insert('vocabulary_terms',set.words);
   const draft=await expect(req('checkpoints','PUT',{term_ids:set.words.map(w=>w.id)}));assert.equal(draft.questions.length,10);assert.ok(draft.questions.every(q=>q.prompt.trim()&&q.explanation.trim()));
   await expect(req('checkpoints','PUT',{term_ids:set.words.map(w=>w.id)},'student'),403);
  }
  assert.equal(authoredSets.length,9);console.log('PASS: teacher endpoint loads all nine complete authored quizzes; student authoring denied.');
 }
 if(!process.argv.includes('--serve'))return;
 // Keep fresh tasks for a manual browser walkthrough without resetting test records.
 await new Query('vocab_tasks').update({active:false});
 await new Query('vocab_tasks').update({active:true}).eq('id',task);
 if(process.argv.includes('--checkpoint')){
  const demo=(await expect(req('tasks','POST',{...payload,term_ids:checkpointWords.map(w=>w.id),task_kind:'quiz',quiz_format:'checkpoint',title:'Motion vocabulary checkpoint',questions}))).task_ids[0];
  const otherStart=await expect(req('checkpoints','POST',{task_id:demo,action:'start'},'student','',second));
  await expect(req('checkpoints','POST',{task_id:demo,action:'submit',attempt_id:otherStart.attempt.id,version:otherStart.attempt.version,answers},'student','',second));
 }
 if(process.argv.includes('--overview')){
   sql(`update students set name='Avery Morgan' where id=${lit(student)};update students set name='Blair Lewis' where id=${lit(second)}`);
   await insert('students',[{id:id(16),name:'Casey Rivera'},{id:id(17),name:'Devon Lee'},{id:id(18),name:'Emery Patel'},{id:id(19),name:'Finley Jordan'},{id:id(20),name:'Gale Chen'}]);
   await insert('course_students',[16,17,18,19,20].map(n=>({course_id:course,student_id:id(n),enrollment_state:'ACTIVE'})));
   const audience=[student,second,...[16,17,18,19].map(id)];
   const practice=(await expect(req('tasks','POST',{...payload,title:'Motion vocabulary',student_ids:audience}))).task_ids[0];
   for(const who of audience.slice(0,-1)){
     const start=await expect(req('checks','POST',{task_id:practice},'student','',who));
     await expect(req('checks','POST',{task_id:practice,check_id:start.check_id,responses:start.items.map(i=>({id:i.id,response:words.find(w=>who===id(16)?w.definition!==i.prompt:w.definition===i.prompt).id,supports:[]}))},'student','',who));
     if([student,second,id(16)].includes(who)){
       const e=(await expect(req('mastery'))).tasks.find(t=>t.id===practice).progress.find(p=>p.studentId===who);
       await expect(req('records','POST',{user_id:who,target_id:target,level:who===student?3:who===second?2:1,vocabulary:{task_id:practice,request_id:crypto.randomUUID(),evidence_key:e.evidenceKey,previous_review_id:null,note:''}}),201);
     }
   }
   const quiz=(await expect(req('tasks','POST',{...payload,title:'Explain motion',student_ids:[student,id(18)],task_kind:'quiz',quiz_format:'definition'}))).task_ids[0];
   const writing=await expect(req('checks','POST',{task_id:quiz},'student','',id(18)));
   await expect(req('checks','POST',{task_id:quiz,check_id:writing.check_id,responses:writing.items.map(i=>({id:i.id,response:'The displacement describes the change in position from start to finish.',supports:[]}))},'student','',id(18)));
 }
 const client=await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import Board from './src/components/vocabulary/VocabLearningBoard';import Work from './src/app/vocabulary/work/page';import Room from './src/components/admin/VocabControlRoom';const nativeFetch=window.fetch;window.fetch=(u,o={})=>nativeFetch(u,{...o,headers:{...o.headers,'x-test-role':location.pathname.startsWith('/vocabulary')||location.pathname==='/home'?'student':'teacher'}});const p=location.pathname;createRoot(document.getElementById('root')).render(<><nav><a href='/admin/vocabulary/assign'>Assign</a> · <a href='/home'>Student Home</a> · <a href='/admin/control-room'>Control Room</a></nav>{p==='/admin/control-room'?<Room classId='${course}' unitId='unit-1' teacher='' nameFilter='' onSaved={()=>{}}/>:p.startsWith('/admin')?<Board initialView='assign'/>:<Work/>}</>);`,resolveDir:root,loader:'tsx'},bundle:true,outdir:tmp,write:true,platform:'browser',format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'ui-stubs',setup(b){b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'stub'}));b.onResolve({filter:/LanguageProfileProvider$/},()=>({path:'language',namespace:'stub'}));b.onLoad({filter:/.*/,namespace:'stub'},a=>({contents:a.path==='link'?`import React from 'react';export default function Link(p){return React.createElement('a',p)}`:`import React from 'react';export const LanguageProfileProvider=({children})=>children;export const useLanguageProfile=()=>({profile:{homeLang:'Spanish'}});`,loader:'js',resolveDir:root}))}}]});
 const css=(await require('postcss')([require('@tailwindcss/postcss')({base:root})]).process(fs.readFileSync(path.join(root,'src/app/globals.css'),'utf8'),{from:path.join(root,'src/app/globals.css')})).css;
 const server=http.createServer(async(r,s)=>{try{const url=new URL(r.url,'http://127.0.0.1:4326');if(url.pathname==='/ui.js'){s.setHeader('Content-Type','text/javascript');s.end(fs.readFileSync(path.join(tmp,'stdin.js')));return}if(url.pathname==='/style.css'){s.setHeader('Content-Type','text/css');s.end(css+fs.readFileSync(path.join(tmp,'stdin.css'),'utf8'));return}if(url.pathname.startsWith('/api/')){const route=url.pathname==='/api/mastery/records'?'records':url.pathname.split('/')[3];if(!api[route]){s.writeHead(404);s.end('{}');return}let body='';for await(const c of r)body+=c;const result=await api[route][r.method](new Request(url,{method:r.method,headers:r.headers,...(body?{body}:{})}));s.writeHead(result.status,{'Content-Type':'application/json'});s.end(await result.text());return}s.setHeader('Content-Type','text/html');s.end('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body style="font-family:Arial,sans-serif;padding:24px"><div id="root"></div><script src="/ui.js"></script></body></html>')}catch(e){s.writeHead(500);s.end(JSON.stringify({error:e.message}));console.error(e)}});
 server.listen(4326,'127.0.0.1',()=>console.log(`Browser fixture http://127.0.0.1:4326/admin/vocabulary/assign · database ${db}`));await new Promise(()=>{});
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{if(created)sql(`drop database ${db}`,'postgres');fs.rmSync(tmp,{recursive:true,force:true})});
