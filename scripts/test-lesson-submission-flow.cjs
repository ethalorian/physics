const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), assert = require('node:assert/strict')
const root = process.env.LESSON_TEST_ROOT || path.resolve(__dirname, '..'), esbuild = require(path.join(root, 'node_modules/esbuild'))
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'lesson-submit-flow-'))
let tables = {}, failTable, calls = []
class Query {
  constructor(table) { this.table = table; this.filters = []; this.start = 0; this.end = Infinity }
  select() { return this } in(k, values) { this.filters.push(r => values.includes(r[k])); return this }
  eq(k, v) { this.filters.push(r => r[k] === v); return this } order() { return this }
  range(a, b) { this.start = a; this.end = b; return this }
  then(resolve, reject) { calls.push(this.table); return Promise.resolve({ data: (tables[this.table] || []).filter(r => this.filters.every(f => f(r))).slice(this.start, this.end + 1), error: this.table === failTable ? new Error('Read failed') : null }).then(resolve, reject) }
}
global.__submissionFlow = { from: table => new Query(table) }
const mocks = {
  '@/lib/supabase': 'export const supabaseAdmin=global.__submissionFlow;',
  '@/lib/api-auth': 'export const withAuth=fn=>fn;',
  'next/server': 'export const NextResponse={json:(d,o)=>Response.json(d,o)};',
  '@/lib/teacher-scope': 'export const resolveRosterScope=async()=>({gids:["s"]});export const getTeacherStudentGids=async()=>["s"];',
  '@/lib/pacing-server': 'export const currentUnitForCourse=async()=>({unitId:"u",program:"physics"});',
}
async function load(file, name) {
  const outfile = path.join(out, name + '.cjs')
  await esbuild.build({ absWorkingDir: root, entryPoints: [path.join(root, file)], outfile, bundle: true, platform: 'node', format: 'cjs', logLevel: 'silent', plugins: [{ name: 'fixture', setup(b) {
    b.onResolve({filter: /.*/}, a => mocks[a.path] ? {path:a.path,namespace:'fixture'} : undefined)
    b.onLoad({filter: /.*/,namespace:'fixture'}, a => ({contents:mocks[a.path],loader:'js'}))
  } }] })
  return require(outfile)
}
let n=0; async function check(name, fn) { await fn(); console.log('PASS ' + name); n++ }
;(async () => {
  const { pendingSavedTargets, getPendingSavedTargets } = await load('src/lib/pending-lesson-work.ts','pending')
  const { LessonResponseStore } = await load('src/lib/lesson-response-store.ts','store')
  const grid = await load('src/app/api/mastery/grid/route.ts','grid')
  const lessons = ['a','b'].map(id=>({id,unit_id:'u',content_blocks:{blocks:[{id:'exit',type:'exit_ticket',targetId:'motion'},{id:'self',type:'marzano',targetId:'motion'},{id:'other',type:'question',targetId:'other'}]}}))
  const targets = [{id:'t',slug:'motion',lesson_id:'a'},{id:'other',slug:'other',lesson_id:'a'}]
  const carriers = new Map([['t',['a','b']],['other',['a','b']]])
  const row = (patch={})=>({id:'r',user_id:'s',lesson_id:'a',block_id:'exit',block_type:'exit_ticket',target_id:'t',created_at:'2026-09-16T12:00:00Z',...patch})
  const review = (patch={})=>({id:'review',user_id:'s',lesson_id:'a',target_id:'t',evidence:[{blockId:'exit',createdAt:row().created_at}],...patch})
  await check('saved work appears before submission without writing a mastery rating',()=>assert.deepEqual(pendingSavedTargets([row()],[],[],lessons,targets,carriers),{s:{t:true}}))
  await check('review clears exact evidence only; another lesson sharing the target stays pending',()=>{
    assert.deepEqual(pendingSavedTargets([row()],[review()],[],lessons,targets,carriers),{})
    assert.deepEqual(pendingSavedTargets([row(),row({lesson_id:'b'})],[review()],[],lessons,targets,carriers),{s:{t:true}})
  })
  await check('a new saved version reopens mastery review',()=>assert.deepEqual(pendingSavedTargets([row(),row({created_at:'2026-09-16T13:00:00Z'})],[review()],[],lessons,targets,carriers),{s:{t:true}}))
  await check('self-ratings, legacy drafts, removed blocks and other targets do not become mastery evidence',()=>{
    const rows=[row({block_id:'self',block_type:'marzano'}),row({block_id:'retired'}),row({draft:'true'})]
    assert.deepEqual(pendingSavedTargets(rows,[],[],lessons,targets,carriers),{})
    assert.deepEqual(pendingSavedTargets([row({block_id:'other',target_id:'other'})],[],[],lessons,targets,carriers),{s:{other:true}})
  })
  await check('submitted work remains on its exact-submission review workflow',()=>assert.deepEqual(pendingSavedTargets([row()],[],[{user_id:'s',lesson_id:'a'}],lessons,targets,carriers),{}))
  await check('all metadata pages load, queries stay roster and unit scoped, errors fail closed',async()=>{
    tables={block_responses:Array.from({length:1005},(_,i)=>row({id:String(i)})),mastery_evidence_reviews:[]};calls=[]
    assert.deepEqual(await getPendingSavedTargets(['s'],lessons,targets,carriers,[]),{s:{t:true}})
    assert.equal(calls.filter(t=>t==='block_responses').length,3)
    assert.deepEqual(await getPendingSavedTargets(['other-student'],lessons,targets,carriers,[]),{})
    failTable='block_responses';await assert.rejects(()=>getPendingSavedTargets(['s'],lessons,targets,carriers,[]));failTable=null
  })
  await check('real grid route launches saved work and clears it only after teacher evidence review',async()=>{
    tables={students:[{id:'s',name:'Student',email:'s@fixture.test'}],units:[{id:'u',name:'Motion'}],lessons,learning_targets:targets.map(t=>({...t,unit_id:'u'})),block_responses:[row()],mastery_evidence_reviews:[],lesson_submissions:[],mastery_records:[]}
    const req=new Request('http://local/api/mastery/grid?unit_id=u'),ctx={role:'teacher',scopeEmail:'teacher@fixture.test'}
    let data=await(await grid.GET(req,ctx)).json();assert.equal(data.pending.s.t,true);assert.equal(data.cells.s.t.value,null)
    tables.mastery_evidence_reviews.push(review());data=await(await grid.GET(req,ctx)).json();assert.equal(data.pending.s,undefined)
    tables.block_responses.push(row({id:'new',created_at:'2026-09-16T13:00:00Z'}));data=await(await grid.GET(req,ctx)).json();assert.equal(data.pending.s.t,true)
    assert.equal((await grid.GET(req,{...ctx,role:'student'})).status,403)
  })
  const response=(d={},ok=true)=>({ok,json:async()=>d})
  function memory(){const map=new Map();return{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}}
  const loadResponse=url=>response(url.includes('/blocks?')?{responses:{}}:{drafts:{}})
  const blocks=[{id:'exit',type:'exit_ticket'},{id:'practice',type:'concept_exercise'}]
  await check('submit saves changed answers and unfinished optional practice through the existing save endpoint',async()=>{
    const writes=[],store=new LessonResponseStore('s','a',()=>true,async(url,opts)=>{if(!opts?.method)return loadResponse(url);const b=JSON.parse(opts.body);writes.push({url,b});return response({response:b.response})},memory)
    await store.load();store.draft('exit','exit_ticket',{text:'Constant slope.'});store.draft('practice','concept_exercise',{answers:{1:'partly done'},submitted:false})
    assert.equal(await store.savePending(blocks),true);assert.equal(writes.length,2);assert(writes.every(w=>w.url==='/api/lessons/blocks'));assert.equal(store.getSnapshot().responses.practice.draft,undefined);store.dispose()
  })
  await check('failed save keeps work and retry saves only remaining changes',async()=>{
    let fail=true;const writes=[],store=new LessonResponseStore('s','a',()=>true,async(url,opts)=>{if(!opts?.method)return loadResponse(url);const b=JSON.parse(opts.body);writes.push(b.block_id);return response({},!(fail&&b.block_id==='practice'))},memory)
    await store.load();store.draft('exit','exit_ticket',{text:'Saved'});store.draft('practice','concept_exercise',{answers:{1:'keep me'}})
    assert.equal(await store.savePending(blocks),false);assert.equal(store.getSnapshot().responses.practice.response.answers[1],'keep me');fail=false
    assert.equal(await store.savePending(blocks),true);assert.deepEqual(writes,['exit','practice','practice']);store.dispose()
  })
  await check('typing during a save and account changes cannot silently submit stale work',async()=>{
    let finish,actor='s';const store=new LessonResponseStore('s','a',()=>actor==='s',async(url,opts)=>opts?.method?new Promise(r=>finish=r):loadResponse(url),memory)
    await store.load();store.draft('exit','exit_ticket',{text:'old'});const saved=store.savePending(blocks);await new Promise(setImmediate);store.draft('exit','exit_ticket',{text:'new'});finish(response({}));assert.equal(await saved,false);assert.equal(store.getSnapshot().responses.exit.response.text,'new');actor='other';assert.equal(await store.savePending(blocks),false);store.dispose()
  })
  console.log(`${n} submission/mastery flow scenarios passed.`)
})().catch(e=>{console.error(e);process.exitCode=1})
