// Actual worksheet preparation and native quiz validation; fictional read-only DB.
const assert = require('node:assert/strict')
const fs = require('node:fs'), path = require('node:path'), os = require('node:os')
const root = path.resolve(__dirname, '../..'), out = fs.mkdtempSync(path.join(os.tmpdir(), 'worksheet-readiness-'))
const targets = require('../../resources/worksheet-quizzes/targets.json')
let copies = [], reads = 0
const course = { id: '00000000-0000-4000-8000-000000000001', program: 'physics', track: 'cpa' }
global.fetch = () => { throw Error('Network is forbidden in this fixture') }
global.worksheetReadinessDB = { from(table) {
  assert.equal(table, 'worksheet_assignments'); reads++
  const filters = {}, q = { select: () => q, eq: (k,v) => { filters[k]=v; return q }, order: () => q,
    then: resolve => { assert.equal(filters.course_id,course.id); return Promise.resolve({data:copies.filter(a=>Object.entries(filters).every(([k,v])=>a[k]===v)),error:null}).then(resolve) } }
  return q
} }
global.worksheetReadinessTargets = targets
;(async () => {
  await require('esbuild').build({ entryPoints: [path.join(root, 'src/lib/teaching-plans/worksheets-server.ts')], outfile: out+'/prepare.cjs', bundle:true, platform:'node', format:'cjs', logLevel:'error', plugins:[{name:'read-only-fixture',setup(b){
    const mocks = {
      'server-only':'',
      '@/lib/supabase':'export const supabaseAdmin=global.worksheetReadinessDB;',
      '@/lib/quizzes/server':'export const quizRows=async()=>global.worksheetReadinessTargets;export const quizCourses=async()=>{throw Error("Unexpected course read")};export const quizStaff=()=>true;',
    }
    b.onResolve({filter:/.*/},a=>{const key=Object.keys(mocks).find(k=>k===a.path||k.startsWith('@/')&&path.resolve(root,'src',k.slice(2))===path.resolve(a.resolveDir,a.path));return key?{path:key,namespace:'fixture'}:undefined})
    b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js'}))
  }}] })
  const {worksheetTeachingAssignment:prepare}=require(out+'/prepare.cjs')
  const day7='worksheet-template:unit-1:7:cpa-sei'
  const draft=await prepare(course,day7)
  assert.equal(draft.worksheetDraft.day,7);assert.equal(draft.worksheetDraft.edition,'cpa-sei')
  assert.equal(draft.worksheetDraft.quiz.questions.length,6);assert.equal(draft.worksheetDraft.quiz.sei_supports,true)
  assert.equal(draft.worksheetDraft.quiz.course_id,course.id);assert.equal(draft.worksheetDraft.quiz.due_at,null)
  assert.deepEqual(await prepare(course,day7),draft,'retry keeps worksheet and question identities')
  let count=0
  for(const w of require('../../resources/worksheet-decks/source.json'))for(const edition of ['cpa','cpa-sei','honors','honors-sei']) {
    const result=await prepare(course,`worksheet-template:unit-${w.unit}:${w.day}:${edition}`)
    assert.equal(result.worksheetDraft.quiz.questions.length,6);count++
  }
  copies=[{id:'saved-pair',course_id:course.id,unit_id:'unit-1',day:7,edition:'cpa-sei',plan_key:day7,version:12,status:'published',student_ids:null}]
  const before=JSON.stringify(copies)
  assert.deepEqual(await prepare(course,day7),{worksheetId:'saved-pair',worksheetVersion:12})
  assert.equal(JSON.stringify(copies),before,'existing pair is reused without writes or regenerated questions')
  assert.equal(count,524)
  console.log(`PASS: Day 7 CPA + SEI calendar preparation, stable retry identities, ${count} editions, existing pair reuse; ${reads} read-only fictional queries, no network or writes.`)
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>fs.rmSync(out,{recursive:true,force:true}))
