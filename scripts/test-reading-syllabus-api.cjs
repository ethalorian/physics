// Actual handlers and auth wrapper; transport-only synthetic database.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out='/private/tmp/reading-syllabus-api';fs.mkdirSync(out,{recursive:true});
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
(async()=>{
 const targets=require('./fixtures/reading-syllabus-targets.json');
 const f=global.syllabusApi={session:null,context:{role:'student',realRole:'student',scopeEmail:'student@test',viewingAsTeacher:false},calls:[],rows:{
  courses:[{id:id(1),name:'CPA',teacher_email:'teacher@test',program:'physics',track:'cpa',archived_at:null},{id:id(2),name:'Honors',teacher_email:'teacher@test',program:'physics',track:'honors',archived_at:null},{id:id(3),name:'Other',teacher_email:'other@test',program:'physics',archived_at:null}],
  course_students:[{id:id(4),course_id:id(1),student_id:id(10),enrollment_state:'ACTIVE'}],learning_targets:targets.map(t=>({...t,exclude_from_growth:false})),
  reading_syllabus_bundles:[{course_id:id(1),step_id:'quantities',reading_id:id(20),practice_id:id(21),reading_quiz_id:id(22),vocabulary_quiz_id:id(23)},{course_id:id(1),step_id:'rates',reading_id:id(30),practice_id:id(31),reading_quiz_id:id(32),vocabulary_quiz_id:id(33)},{course_id:id(3),step_id:'quantities',reading_id:id(40)}],
  textbook_assignments:[{id:id(20),title:'Units',status:'published',version:2},{id:id(30),status:'draft'},{id:id(40),status:'published'}],
  vocab_tasks:[{id:id(21),title:'Units words',active:true,syllabus_draft:false,due_on:'2026-11-01',student_ids:[id(10),id(11)]}],
  quiz_assignments:[{id:id(22),title:'SECRET DRAFT TITLE',status:'draft',questions:[{guide:'SECRET KEY'}],deleted_at:null,student_ids:null},{id:id(23),title:'Vocabulary quiz',status:'published',questions:[{guide:'SECRET KEY'}],deleted_at:null,student_ids:[id(11)]}],
  textbook_work:[{assignment_id:id(20),user_id:id(10),state:'submitted'},{assignment_id:id(20),user_id:id(11),state:'rated'}],quiz_work:[]
 }};
 global.syllabusDB={from:table=>{let filters=[],fields='*',start=0,end=499;const q={select(s){fields=s;return q},eq(k,v){filters.push(r=>r[k]===v);return q},neq(k,v){filters.push(r=>r[k]!==v);return q},in(k,v){filters.push(r=>v.includes(r[k]));return q},is(k,v){filters.push(r=>r[k]===v);return q},order(){return q},maybeSingle(){q.single=true;return q},range(a,b){start=a;end=b;return q},then(resolve,reject){const rows=(f.rows[table]||[]).filter(r=>filters.every(fn=>fn(r))).slice(start,end+1).map(r=>fields==='*'?r:Object.fromEntries(fields.split(',').map(k=>[k,r[k]])));return Promise.resolve({data:q.single?rows[0]??null:rows,error:null}).then(resolve,reject)}};return q},rpc:async(name,args)=>{f.calls.push({name,args});return{data:{course_id:id(1),step_id:'quantities'},error:null}}};
 const mocks={'server-only':'','next/server':`export const NextResponse={json:(d,o)=>Response.json(d,o)};`,'@/lib/auth':`export const auth=async()=>global.syllabusApi.session;`,'@/lib/effective-context':`export const getEffectiveContext=async()=>global.syllabusApi.context;`,'@/lib/student-enrollment':`export const requireEnrolledStudent=async()=>null;`,'@/lib/content-access':`export const canEditArea=async()=>false;`,'@/lib/supabase':`export const supabaseAdmin=global.syllabusDB;`,'@/lib/vocab-scope-server':`export const vocabularyFor=async()=>({sets:[],words:[],targets:global.syllabusApi.rows.learning_targets});`};
 await require('esbuild').build({entryPoints:[root+'/src/app/api/reading-syllabus/route.ts'],outfile:out+'/api.cjs',bundle:true,platform:'node',format:'cjs',plugins:[{name:'fixture',setup(b){b.onResolve({filter:/.*/},a=>Object.hasOwn(mocks,a.path)?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js'}))}}]});
 await require('esbuild').build({stdin:{contents:"export {accessQuiz} from './src/lib/quizzes/server';export {readingQuizForStudent} from './src/lib/reading-quiz-access';",loader:'ts',resolveDir:root},outfile:out+'/quiz-access.cjs',bundle:true,platform:'node',format:'cjs',plugins:[{name:'fixture',setup(b){b.onResolve({filter:/.*/},a=>Object.hasOwn(mocks,a.path)?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js'}))}}]});
 await require('esbuild').build({entryPoints:[root+'/src/app/api/quizzes/route.ts'],outfile:out+'/quiz-list.cjs',bundle:true,platform:'node',format:'cjs',plugins:[{name:'fixture',setup(b){b.onResolve({filter:/.*/},a=>Object.hasOwn(mocks,a.path)?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js'}))}}]});
 const listQuizzes=()=>require(out+'/quiz-list.cjs').GET({url:'http://local/api/quizzes',method:'GET'});
 const {accessQuiz,readingQuizForStudent}=require(out+'/quiz-access.cjs');
 const api=require(out+'/api.cjs'),get=(suffix='')=>api.GET({url:'http://local/api/reading-syllabus'+suffix,method:'GET'}),post=b=>api.POST({url:'http://local/api/reading-syllabus',method:'POST',json:async()=>b});
 assert.equal((await get()).status,401);f.session={user:{id:id(10),email:'student@test'}};
 let response=await get(),data=await response.json();assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(data.bundles.length,1);assert.equal(data.bundles[0].reading.state,'submitted');assert.equal(data.bundles[0].reading_quiz_id,'');assert.equal(data.bundles[0].vocabulary_quiz_id,'');assert(!JSON.stringify(data).includes('SECRET'));assert(!JSON.stringify(data).includes('guide'));assert(!JSON.stringify(data).includes(id(11)));assert.equal(data.targets.length,0);
 f.rows.quiz_assignments[0].status='published';f.rows.quiz_assignments[0].course_id=id(1);
 const ctx={...f.context,userId:id(10),email:'student@test'};assert.equal(await accessQuiz(id(22),ctx),null);
 data=await(await get()).json();assert.equal(data.bundles[0].readingQuiz.status,'locked');
 Object.assign(f.rows.textbook_assignments[0],{course_id:id(1)});
 Object.assign(f.rows.quiz_assignments[0],{title:'Reading check',due_at:'2026-10-09T03:59:00Z',created_at:'2026-10-08T12:00:00Z',questions:[{id:id(200),points:2,target_id:id(201),guide:'SECRET KEY'}]});
 let calendar=await(await listQuizzes()).json();assert.equal(calendar.quizzes.length,0);assert.equal(calendar.locked.length,1);assert.equal(calendar.locked[0].reading_id,id(20));assert.equal(calendar.locked[0].due_at,'2026-10-09T03:59:00Z');assert.deepEqual(Object.keys(calendar.locked[0]).sort(),['course_id','created_at','due_at','id','reading_id','reading_title','title']);assert(!JSON.stringify(calendar).includes('SECRET KEY'));
 f.rows.quiz_assignments[0].student_ids=[id(11)];assert.equal((await(await listQuizzes()).json()).locked.length,0);f.rows.quiz_assignments[0].student_ids=null;
 f.rows.textbook_assignments[0].status='draft';assert.equal((await(await listQuizzes()).json()).locked.length,0);f.rows.textbook_assignments[0].status='published';

 f.rows.textbook_submissions=[{id:id(100),assignment_id:id(20),user_id:id(10)}];
 calendar=await(await listQuizzes()).json();assert.equal(calendar.locked.length,0);assert.equal(calendar.quizzes.length,1);assert.equal(calendar.quizzes[0].id,id(22));assert(!JSON.stringify(calendar).includes('SECRET KEY'));
 assert(await accessQuiz(id(22),ctx));f.rows.course_students.push({id:id(5),course_id:id(1),student_id:id(11),enrollment_state:'ACTIVE'});assert.equal(await accessQuiz(id(22),{...ctx,userId:id(11)}),null);
 data=await(await get()).json();assert.equal(data.bundles[0].reading_quiz_id,id(22));
 assert.equal((await readingQuizForStudent(id(20),id(10))).needsCompletion,true);
 f.rows.quiz_work=[{quiz_id:id(22),user_id:id(10),state:'in_progress'}];assert.equal((await readingQuizForStudent(id(20),id(10))).needsCompletion,true);
 f.rows.quiz_work[0].state='submitted';assert.equal((await readingQuizForStudent(id(20),id(10))).needsCompletion,false);
 f.rows.quiz_work[0].state='returned';assert.equal((await readingQuizForStudent(id(20),id(10))).needsCompletion,true);
 f.rows.quiz_work[0].state='graded';assert.equal((await readingQuizForStudent(id(20),id(10))).needsCompletion,false);f.rows.quiz_work=[];
 f.rows.quiz_assignments[0].status='draft';
 assert.equal((await get('?course_id='+id(3))).status,403);assert.equal((await post({action:'prepare',course_id:id(1),step_id:'quantities'})).status,403);
 f.rows.quiz_assignments[1].student_ids=null;data=await(await get()).json();assert.equal(data.bundles[0].vocabulary_quiz_id,id(23));f.rows.quiz_assignments[1].deleted_at=new Date().toISOString();data=await(await get()).json();assert.equal(data.bundles[0].vocabulary_quiz_id,'');
 f.rows.course_students[0].enrollment_state='INACTIVE';data=await(await get()).json();assert.equal(data.bundles.length,0);f.rows.course_students[0].enrollment_state='ACTIVE';
 f.session={user:{id:id(90),email:'teacher@test'}};f.context={role:'teacher',realRole:'teacher',scopeEmail:'teacher@test',viewingAsTeacher:false};
 data=await(await get()).json();assert.equal(data.courses.length,2);assert(data.steps[0].quizCheck.guide);assert.equal(data.bundles.length,2);assert.equal(data.bundles[0].practice.due_on,'2026-11-01');f.rows.vocab_tasks[0].active=false;data=await(await get()).json();assert.equal(data.bundles[0].practice.status,'archived');f.rows.vocab_tasks[0].syllabus_draft=true;data=await(await get()).json();assert.equal(data.bundles[0].practice.status,'draft');f.rows.vocab_tasks[0].active=true;f.rows.vocab_tasks[0].syllabus_draft=false;
 assert.equal((await post({action:'prepare',course_id:id(3),step_id:'quantities'})).status,403);
 assert.equal((await post({action:'prepare',course_id:id(1),step_id:'quantities'})).status,201);let args=f.calls.at(-1).args;assert.equal(args.p_payload.reading.honors_reading,null);assert.equal(args.p_owner,'teacher@test');assert.equal(args.p_payload.readingQuiz.status,'draft');
 assert.equal((await post({action:'prepare',course_id:id(2),step_id:'quantities'})).status,201);assert.equal(f.calls.at(-1).args.p_payload.reading.honors_reading.from,20);
 assert.equal((await post({action:'release',course_id:id(1),step_id:'quantities',version:1,due_at:'bad'})).status,400);
 assert.equal((await post({action:'release',course_id:id(1),step_id:'quantities',version:1,due_at:null})).status,200);assert.equal(f.calls.at(-1).name,'release_reading_syllabus_step');
 f.context.viewingAsTeacher=true;const before=f.calls.length;assert.equal((await post({action:'prepare',course_id:id(1),step_id:'quantities'})).status,403);assert.equal(f.calls.length,before);
 console.log('PASS: authenticated handlers; own-course and active-enrollment boundaries; hidden draft IDs, quiz keys and roster; individual quiz audiences; submission-gated quiz links and direct access; CPA/Honors generation; validation; read-only preview.');
})().catch(e=>{console.error(e);process.exitCode=1});
