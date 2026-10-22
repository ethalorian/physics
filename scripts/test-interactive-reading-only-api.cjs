// Actual assignment, syllabus, and planning code with an in-memory transport.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), out = '/private/tmp/interactive-reading-only-api.cjs';
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const course = { id: id(1), name: 'Physics', program: 'physics', track: 'cpa', teacher_email: 'teacher@example.test' };
const good = { id: id(2), course_id: course.id, title: 'Acceleration', chapter: 4, section_ids: ['4.4'], passage: null, honors_reading: null, reading: 'Section 4.4', instructions: '', due_at: '2026-11-06T22:00:00Z', questions: [{ id: id(3), target_id: id(4), reference: 'Section 4.4', prompt: 'Explain the change in velocity.' }], status: 'published', version: 1 };
const basic = { ...good, id: id(5), passage: 'Plain course text without an interactive reader.' };
const f = global.interactiveReadingFixture = { ctx: { role: 'teacher', realRole: 'teacher', userId: id(9), email: course.teacher_email, scopeEmail: course.teacher_email, viewingAsTeacher: false }, course, assignment: good, calls: [], rows: {
  textbook_assignments: [good, basic], reading_syllabus_bundles: [{ course_id: course.id, step_id: 'textbook-hewitt-4-4', reading_id: good.id, reading_quiz_id: id(6) }],
  quiz_assignments: [{ id: id(6), course_id: course.id, title: 'Attached quiz', status: 'published', deleted_at: null, student_ids: null, questions: [] }], learning_targets: [],
} };
global.interactiveReadingDB = { from(table) { const filters = []; let single = false, update;
  const q = { select: () => q, order: () => q, range: () => q, eq(k,v) { filters.push(r => r[k] === v); return q; }, neq(k,v) { filters.push(r => r[k] !== v); return q; }, in(k,v) { filters.push(r => v.includes(r[k])); return q; }, is(k,v) { filters.push(r => (r[k] ?? null) === v); return q; }, update(v) { update=v; return q; }, maybeSingle() { single=true; return q; }, then(resolve,reject) { const rows=(f.rows[table]??[]).filter(r=>filters.every(test=>test(r))).map(r=>({...r,...update})); return Promise.resolve({data:single?rows[0]??null:rows,error:null}).then(resolve,reject); } }; return q;
}, rpc: async (name,args) => { f.calls.push({name,args}); return {data:{id:good.id,ok:true},error:null}; } };
(async () => {
  const mocks = {
    'server-only': '',
    '@/lib/api-auth': `export const withAuth=fn=>req=>fn(req,{...global.interactiveReadingFixture.ctx,params:Promise.resolve({id:global.interactiveReadingFixture.assignment.id})});export const withRole=(_roles,fn)=>withAuth(fn);`,
    '@/lib/supabase': `export const supabaseAdmin=global.interactiveReadingDB;`,
    '@/lib/textbook-assignments-server': `export const readingCourses=async()=>[global.interactiveReadingFixture.course];export const readingStaff=c=>c.role==='teacher';export const accessReading=async()=>({assignment:global.interactiveReadingFixture.assignment,course:global.interactiveReadingFixture.course});export const readingRows=async fn=>(await fn(0,499)).data;export const readingJson=(d,status=200)=>Response.json(d,{status});export const readingRpcError=e=>Response.json({error:e.message},{status:409});`,
    '@/lib/reading-exemptions-server': `export const readingExemptions=async()=>[];`,
    '@/lib/reading-xp-server': `export const readingXpStatus=async()=>null;`,
    '@/lib/reading-quiz-access': `export const readingQuizForStudent=async()=>null;`,
    '@/lib/reading-syllabus-server': `export const syllabusBundles=async()=>[];`,
    '@/lib/vocab-scope-server': `export const vocabularyFor=async()=>({sets:[],words:[],targets:[]});`,
    '@/lib/lesson-release-server': `export const releaseLessons=async()=>[];`,
  };
  await require(root+'/node_modules/esbuild').build({stdin:{contents:`export {POST as create} from './src/app/api/readings/route';export {POST as change} from './src/app/api/readings/[id]/route';export {GET as syllabus,POST as release} from './src/app/api/reading-syllabus/route';export {choiceCatalog} from './src/lib/choice-calendar-server';export {planCatalog} from './src/lib/teaching-plans/server';export {isInteractiveSyllabusStep} from './src/lib/reading-availability';`,resolveDir:root},bundle:true,platform:'node',format:'cjs',outfile:out,plugins:[{name:'fixture',setup(b){b.onResolve({filter:/.*/},a=>Object.hasOwn(mocks,a.path)?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js'}));}}]});
  const api=require(out), req=b=>new Request('http://localhost/api/readings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});
  for (const status of ['draft','published']) { const before=f.calls.length; assert.equal((await api.create(req({...basic,status}))).status,409); assert.equal(f.calls.length,before); }
  assert.equal((await api.create(req({...good,version:0}))).status,201); assert.equal(f.calls.at(-1).name,'save_textbook_assignment');
  f.assignment=basic;
  for (const action of ['schedule','restore-schedule','reopen','undo-sequence-assignment','restore-student']) { const before=f.calls.length; assert.equal((await api.change(req({action,version:1,day:'2026-11-06'}))).status,409); assert.equal(f.calls.length,before); }
  assert.equal((await api.change(req({action:'archive',version:1}))).status,200,'old work can still be unassigned');
  f.ctx.role=f.ctx.realRole='student'; assert.equal((await api.change(req({action:'save',version:0,request_id:id(10),answers:{[id(3)]:'Existing work'}}))).status,200,'existing student work remains usable'); assert.equal(f.calls.at(-1).name,'textbook_student_action'); f.ctx.role=f.ctx.realRole='teacher';
  f.assignment=good; assert.equal((await api.change(req({action:'schedule',version:1,day:'2026-11-06'}))).status,200); assert.equal(f.calls.at(-1).name,'assign_reading_sequence','linked quizzes keep the original assignment transaction');
  assert.equal((await api.release(req({action:'prepare',course_id:course.id,step_id:'quantities'}))).status,409);
  const release={action:'release',course_id:course.id,step_id:'textbook-hewitt-4-4',version:1,due_at:good.due_at};
  assert.equal((await api.release(req(release))).status,200); assert.equal(f.calls.at(-1).name,'release_reading_syllabus_step');
  f.rows.textbook_assignments[0]={...good,passage:'Edited into a basic reading'}; const before=f.calls.length; assert.equal((await api.release(req(release))).status,409); assert.equal(f.calls.length,before); f.rows.textbook_assignments[0]=good;
  const syllabus=await(await api.syllabus(new Request('http://localhost/api/reading-syllabus'))).json(); assert([...syllabus.steps,...syllabus.textbookSteps].every(s=>api.isInteractiveSyllabusStep(s,'cpa')));
  const choices=await api.choiceCatalog(f.ctx,course.id); assert(choices.steps.some(s=>s.kind==='reading'&&s.sourceId===good.id)); assert(!choices.steps.some(s=>s.kind==='reading'&&s.sourceId===basic.id)); assert(!choices.setupActivities.some(s=>s.key==='reading:'+basic.id)); assert(choices.links.some(l=>l.reading==='reading:'+good.id&&l.quiz==='quiz:'+id(6))); assert(choices.readingTemplates.every(s=>s.format==='interactive-reading'));
  const plan=await api.planCatalog(f.ctx,{course,courses:[course],unit:{id:'unit-1',name:'Motion',program:'physics'}}); assert(plan.catalog.some(s=>s.key==='reading:'+good.id)); assert(!plan.catalog.some(s=>s.key==='reading:'+basic.id)); assert(plan.catalog.filter(s=>s.kind==='reading').every(s=>s.format==='interactive-reading'));
  console.log('PASS: general and choice catalogs, syllabus filtering, create/reassign/calendar guards, actual saved-source release checks, linked quiz transaction, and preserved legacy student work.');
})().catch(e=>{console.error(e);process.exitCode=1;});
