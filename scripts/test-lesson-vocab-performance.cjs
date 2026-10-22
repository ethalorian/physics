// Fictional data only. Compare contracts, scope, pagination and query scheduling.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os')
const root=path.resolve(__dirname,'..'),out=fs.mkdtempSync(path.join(os.tmpdir(),'lesson-vocab-test-'))
let tables,calls,active,peak,errorTable,choices={exemptions:{},available:{}}
class Query{
 constructor(table){this.table=table;this.filters=[];this.sorts=[];this.start=0;this.end=Infinity}
 select(fields){this.fields=fields;return this}
 eq(k,v){this.filters.push(r=>r[k]===v);return this}
 is(k,v){this.filters.push(r=>(r[k]??null)===v);return this}
 in(k,v){this.filters.push(r=>v.includes(r[k]));return this}
 contains(k,v){this.filters.push(r=>v.every(x=>r[k]?.includes(x)));return this}
 gte(k,v){this.filters.push(r=>r[k]>=v);return this}
 order(k,{ascending=true}={}){this.sorts.push([k,ascending]);return this}
 range(a,b){this.start=a;this.end=b;return this}
 then(resolve,reject){
  peak=Math.max(peak,++active)
  return new Promise(ok=>setTimeout(()=>{
   active--;let data=(tables[this.table]??[]).filter(r=>this.filters.every(f=>f(r)))
   data.sort((a,b)=>{for(const[k,asc]of this.sorts){const c=String(a[k]).localeCompare(String(b[k]));if(c)return asc?c:-c}return 0})
   data=data.slice(this.start,this.end+1)
   calls.push({table:this.table,rows:data.length,start:this.start,fields:this.fields,ids:data.map(r=>r.id)})
   if(this.table==='lessons')data=data.map(r=>Object.fromEntries(this.fields.split(',').map(field=>{
    if(field==='presentation:content_blocks->>presentation')return ['presentation',r.content_blocks?.presentation]
    if(field==='learning_path:content_blocks->learningPath')return ['learning_path',r.content_blocks?.learningPath]
    if(field==='reflection_assignment:content_blocks->reflection')return ['reflection_assignment',r.content_blocks?.reflection]
    return [field,r[field]]
   })))
   ok({data:this.table===errorTable?null:data,error:this.table===errorTable?Error('unavailable'):null})
  },5)).then(resolve,reject)
 }
}
global.performanceFixture={from:t=>new Query(t)}
async function bundle(name,baseline){
 const mocks={'server-only':'export {};','@/lib/supabase':'export const supabaseAdmin=global.performanceFixture','@/lib/api-auth':'export const withAuth=f=>f;export const withRole=(roles,f)=>f','next/server':'export const NextResponse={json:(v,o)=>Response.json(v,o)}','@/lib/choice-calendar-server':'export const choiceSourceDispositions=async()=>global.performanceChoices'}
 const file=path.join(out,name+'.cjs')
 await require('esbuild').build({absWorkingDir:root,stdin:{contents:"export {GET} from './src/app/api/vocab/tasks/route'; export {releaseLessons} from './src/lib/lesson-release-server'",resolveDir:root},outfile:file,bundle:true,platform:'node',packages:'external',plugins:[{name:'fixture',setup(b){
  b.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'mock'}:undefined)
  b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:mocks[a.path],loader:'js'}))
  if(baseline)b.onLoad({filter:/(app\/api\/vocab\/tasks\/route|lib\/lesson-release-server)\.ts$/},a=>({contents:fs.readFileSync(path.join(baseline,path.relative(root,a.path)),'utf8'),loader:'ts',resolveDir:path.dirname(a.path)}))
 }}],logLevel:'silent'})
 return require(file)
}
function fixture(){
 const task={id:'t',course_id:'c',student_ids:['s','removed'],term_ids:['w'],words:[{id:'w',term:'Velocity',definition:'Speed with direction',tier:3}],target_id:'target',created_at:'2026-01-01',due_on:'2026-10-22',active:true,task_kind:'practice',min_checks:2,threshold:80}
 tables={courses:[{id:'c',teacher_email:'teacher@example.test',archived_at:null},{id:'archived',teacher_email:'teacher@example.test',archived_at:'2026-01-01'},{id:'foreign',teacher_email:'other@example.test',archived_at:null}],course_students:[{id:'e',course_id:'c',student_id:'s',enrollment_state:'ACTIVE'},{id:'e2',course_id:'c',student_id:'removed',enrollment_state:'REMOVED'}],vocab_tasks:[task,{...task,id:'quiz',task_kind:'quiz',quiz_format:'checkpoint'},{...task,id:'archived-task',course_id:'archived'},{...task,id:'private-task',course_id:'foreign'}],vocab_checks:Array.from({length:1001},(_,i)=>({id:'check'+String(i).padStart(4,'0'),task_id:i%2?'quiz':'t',user_id:'s',created_at:'2026-09-01',completed_at:'2026-09-01',review_version:0,result:[{term_id:'w',correct:i%3!==0,response:'Velocity'}]})),vocab_attempts:Array.from({length:501},(_,i)=>({id:'a'+i,user_id:'s',term_id:'w',game:'matching',correct:true,created_at:'2026-09-01'})),vocab_checkpoint_attempts:[{id:'a1',task_id:'quiz',user_id:'s',number:1,submitted_at:'2026-09-01',released_at:'2026-09-02'},{id:'a2',task_id:'quiz',user_id:'s',number:2,submitted_at:'2026-09-03',released_at:null}],vocab_mastery_reviews:[{id:'r2',task_id:'t',user_id:'s',target_id:'target',level:2,created_at:'2026-09-03'},{id:'r1',task_id:'t',user_id:'s',target_id:'target',level:1,created_at:'2026-09-02'}],students:[{id:'s',name:'Fictional learner'},{id:'removed',name:'Removed learner'}],mastery_records:[{user_id:'s',target_id:'target',level:3,observed_at:'2026-09-02'},{user_id:'s',target_id:'target',level:1,observed_at:'2026-09-01'}]}
 tables.vocab_checks.push({id:'private-check',task_id:'t',user_id:'other',completed_at:'2026-09-01',result:[]})
 tables.units=[{id:'unit-1',name:'Motion',program:'physics',order_index:1},{id:'trades-new',name:'Trades',program:'trades',order_index:2},{id:'proj-1',program:'projects'},{id:'future-physics',program:'physics'}]
 const lesson={title:'Lesson',published:true,unit_id:'unit-1',lesson_number:1,content_blocks:{blocks:[{type:'exit_ticket',prompt:'Explain',targets:['target']}],presentation:'physics-path',learningPath:{kind:'lesson',targetSlugs:['motion']}}}
 tables.lessons=[{...lesson,id:'current'}, {...lesson,id:'legacy',content_blocks:{blocks:[{type:'paragraph',body:'Old body'.repeat(1000)}]}},{...lesson,id:'trades',unit_id:'trades-new',content_blocks:{blocks:[]}},{...lesson,id:'reflection',content_blocks:{blocks:[],reflection:{version:1,kind:'graphic-novel',chapter:4}}},{...lesson,id:'draft',published:false},{...lesson,id:'retired',unit_id:'proj-1'},{...lesson,id:'future-legacy',unit_id:'future-physics',content_blocks:{blocks:[]}},{...lesson,id:'missing-unit',unit_id:null}]
 choices={exemptions:{},available:{}};global.performanceChoices=choices
}
async function run(api,role='teacher',route='vocab',query=''){
 calls=[];active=0;peak=0;const at=performance.now()
 const data=route==='lessons'?await api.releaseLessons():await(await api.GET(new Request('https://fixture.test/api/vocab/tasks'+query),{role,realRole:role,scopeEmail:'teacher@example.test',userId:'s'})).json()
 return {data,calls:[...calls],peak,ms:Math.round(performance.now()-at)}
}
async function main(){
 const current=await bundle('current'),baseline=process.env.PERFORMANCE_BASELINE_ROOT?await bundle('baseline',path.resolve(process.env.PERFORMANCE_BASELINE_ROOT)):null
 fixture()
 for(const role of ['teacher','admin','student']){
  const before=baseline?await run(baseline,role):null,after=await run(current,role)
  if(before)assert.deepEqual(after.data,before.data)
  assert.equal(after.data.tasks.length,2);assert(!JSON.stringify(after.data).includes('Removed learner'))
  assert.equal(after.data.tasks.find(t=>t.id==='t').progress[0].masteryRating.level,2)
  assert.equal(after.data.tasks.find(t=>t.id==='quiz').progress[0].quiz.needsReview,true)
  if(role==='student'){assert.equal(after.data.tasks.find(t=>t.id==='quiz').words.length,0);assert(after.data.tasks.every(t=>t.student_ids.length===1))}
  else {assert(after.peak>=5);assert(after.calls.some(c=>c.table==='vocab_checks'&&c.start===1000));assert(after.calls.some(c=>c.table==='vocab_attempts'&&c.start===500))}
  console.log('PASS',role,'identical response, roster/scope, latest evidence, pagination;',before?.ms,'→',after.ms,'ms; concurrent reads',before?.peak,'→',after.peak)
  const summary=await run(current,role,'vocab','?view=summary')
  const projected=JSON.parse(JSON.stringify({tasks:after.data.tasks.map(t=>({id:t.id,title:t.title,created_at:t.created_at,due_on:t.due_on,task_kind:t.task_kind,progress:t.progress.map(p=>({complete:p.complete,quiz:p.quiz}))}))}))
  assert.deepEqual(summary.data,projected)
  assert(!summary.calls.some(c=>['vocab_attempts','students','mastery_records','vocab_mastery_reviews'].includes(c.table)))
  console.log('PASS',role,'Home summary matches full response completion/quiz status and skips unused evidence')
 }
 choices.exemptions.t=['s'];choices.available.quiz=['s'];assert.deepEqual((await run(current,'student')).data,{tasks:[]})
 const before=baseline?await run(baseline,'teacher','lessons'):null,after=await run(current,'teacher','lessons')
 if(before)assert.deepEqual(after.data,before.data)
 const bodyRead=after.calls.find(c=>c.table==='lessons'&&c.fields.includes(', content_blocks'))
 assert.deepEqual([...bodyRead.ids].sort(),['current','trades','reflection','missing-unit'].sort())
 console.log('PASS lesson catalog is identical; historical bodies excluded before transport')
 for(const table of ['vocab_checks','vocab_attempts','vocab_mastery_reviews','students','mastery_records']){errorTable=table;await assert.rejects(()=>run(current));await new Promise(r=>setTimeout(r,30))}
 errorTable=null;tables.vocab_tasks=[];assert.deepEqual((await run(current)).data,{tasks:[]});assert(!calls.some(c=>c.table==='vocab_checks'))
 tables.lessons=[];assert.deepEqual((await run(current,'teacher','lessons')).data,[])
 console.log('PASS required errors fail closed and empty results avoid evidence/body reads')
}
main().catch(e=>{console.error(e);process.exitCode=1})
