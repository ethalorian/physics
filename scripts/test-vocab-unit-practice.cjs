const assert=require('node:assert/strict'),{createFixture,id,root}=require('./quiz-grading/fixture.cjs');
(async()=>{
 const out='/private/tmp/vocab-unit-practice-api',f=await createFixture(out),{fx}=f;
 fx.rows.units.push({id:'etf-unit-1',name:'Engineering',program:'trades'});
 fx.rows.lessons=[{id:id(60),title:'Position',slug:'position',unit_id:'unit-1',published:true,presentation:'physics-path',learning_path:{targetSlugs:[]}},{id:id(61),title:'Closed lesson',unit_id:'unit-1',published:true,presentation:'physics-path',learning_path:{targetSlugs:[]}}];
 fx.rows.vocabulary_sets=[{id:id(70),name:'Position words',unit_id:'unit-1',lesson_id:id(60),published:true,archived:false},{id:id(71),name:'Closed lesson',unit_id:'unit-1',lesson_id:id(61),published:true,archived:false},{id:id(72),name:'Prior words',unit_id:'unit-1',lesson_id:null,published:true,archived:false},{id:id(73),name:'Engineering',unit_id:'etf-unit-1',lesson_id:null,published:true,archived:false}];
 fx.rows.vocabulary_terms=[{id:id(80),term:'Position',definition:'A location.',vocabulary_set_id:id(70),archived:false},{id:id(85),term:'Acceleration',definition:'Change in velocity.',vocabulary_set_id:id(71),archived:false},{id:id(86),term:'Model',definition:'A representation.',vocabulary_set_id:id(72),archived:false},{id:id(88),term:'Tolerance',definition:'An allowed variation.',vocabulary_set_id:id(73),archived:false}];
 fx.rows.vocab_tasks=[{id:id(95),title:'Practice model',course_id:id(1),task_kind:'practice',active:true,student_ids:[id(2)],term_ids:[id(86)],words:[fx.rows.vocabulary_terms[2]]}];fx.rows.vocab_assignments=[];fx.rows.lesson_class_windows=[];
 const from=global.quizFakeDB.from;global.quizFakeDB.from=table=>{const q=from(table);q.contains=(key,values)=>q.in('id',(fx.rows[table]??[]).filter(r=>values.every(v=>r[key]?.includes(v))).map(r=>r.id));return q};
 const mocks={'server-only':'','next/server':`export const NextResponse={json:(d,o)=>Response.json(d,o)};`,'@/lib/auth':`export const auth=async()=>global.quizFixture.session;`,'@/lib/effective-context':`export const getEffectiveContext=async()=>global.quizFixture.context;`,'@/lib/student-enrollment':`export const requireEnrolledStudent=async()=>null;`,'@/lib/content-access':`export const canEditArea=async()=>false;`,'@/lib/supabase':`export const supabaseAdmin=global.quizFakeDB;`};
 const handlers={};for(const name of ['play','tasks']){await require(root+'/node_modules/esbuild').build({entryPoints:[root+'/src/app/api/vocab/'+name+'/route.ts'],outfile:out+'/'+name+'.cjs',bundle:true,platform:'node',format:'cjs',plugins:[{name:'fixtures',setup(b){b.onResolve({filter:/.*/},a=>a.path in mocks?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js'}))}}]});handlers[name]=require(out+'/'+name+'.cjs')}
 f.call=(name,method,body={},unused,query='')=>handlers[name][method]({url:'http://local/api/vocab/'+name+query,nextUrl:new URL('http://local/api/vocab/'+name+query),method,json:async()=>body});
 f.role('student');
 const response=await f.call('play','GET',{},undefined,'?unit_id=unit-1&practice=unit'),pool=await response.json();
 assert.equal(response.status,200);assert(pool.terms.some(t=>t.id===id(85)),'closed lesson words included for unit practice');assert(pool.terms.some(t=>t.id===id(86)),'full unit includes previously partial set');assert(!pool.terms.some(t=>t.id===id(88)),'other program excluded');assert.equal(pool.unitId,'unit-1');
 const taskPool=await(await f.call('play','GET',{},undefined,'?task_id='+id(95)+'&practice=unit')).json();assert(taskPool.terms.length>1,'one-word assignment expands to its whole unit');
 const lessonPool=await(await f.call('play','GET',{},undefined,'?lesson_id='+id(60)+'&practice=unit')).json();assert.deepEqual(lessonPool.terms.map(t=>t.id).sort(),pool.terms.map(t=>t.id).sort());
 const unauthorized=await(await f.call('play','GET',{},undefined,'?unit_id=etf-unit-1&practice=unit')).json();assert.equal(unauthorized.terms.length,0);
 fx.rows.vocabulary_sets.find(s=>s.id===id(71)).published=false;
 assert(!(await(await f.call('play','GET',{},undefined,'?unit_id=unit-1&practice=unit')).json()).terms.some(t=>t.id===id(85)),'unpublished sets excluded');
 fx.rows.vocab_tasks.push({...fx.rows.vocab_tasks[0],id:id(96),task_kind:'quiz'});
 assert.equal((await f.call('play','GET',{},undefined,'?task_id='+id(96)+'&practice=unit')).status,403,'quiz payload cannot become a practice source');
 f.role('student',id(999));assert.equal((await(await f.call('play','GET',{},undefined,'?unit_id=unit-1&practice=unit')).json()).terms.length,0,'enrollment required');
 // Actual task route must reject duplicate-system quiz creation even from old UI tabs.
 const tasks=handlers.tasks;f.role('teacher');const denied=await tasks.POST({method:'POST',json:async()=>({task_kind:'quiz'}),nextUrl:new URL('http://local/api/vocab/tasks')});assert.equal(denied.status,400);assert.match((await denied.json()).error,/quiz system/);
 console.log('PASS: full unit game pools from unit, lesson and practice-task entry; closed lessons and full sets included; other programs, unpublished content, quizzes and unenrolled users excluded; new vocabulary quizzes require main quiz system.');
})().catch(e=>{console.error(e);process.exitCode=1});
