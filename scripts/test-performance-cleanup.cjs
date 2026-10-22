const assert = require('node:assert/strict')
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), crypto = require('node:crypto')
const root = path.resolve(__dirname, '..'), out = fs.mkdtempSync(path.join(os.tmpdir(), 'physics-performance-'))
const { build } = require('esbuild')
let state, calls, failTable
const current = row => row.content_blocks?.presentation === 'physics-path' && row.content_blocks.learningPath || row.content_blocks?.reflection?.version === 1 && ['manga','story','graphic-novel'].includes(row.content_blocks.reflection.kind)
class Query {
  constructor(table) { this.table = table; this.filters = []; this.sorts = []; this.from = 0; this.to = Infinity }
  select() { return this }
  eq(k,v) { this.filters.push(r => r[k] === v); return this }
  is(k,v) { this.filters.push(r => (r[k] ?? null) === v); return this }
  in(k,v) { this.filters.push(r => v.includes(r[k])); return this }
  or() { this.filters.push(current); return this }
  order(k, options = {}) { this.sorts.push([k, options.ascending !== false]); return this }
  limit(n) { this.to = n - 1; return this }
  range(a,b) { this.from = a; this.to = b; return this }
  maybeSingle() { this.single = true; return this }
  then(resolve,reject) {
    let rows = (state[this.table] ?? []).filter(r => this.filters.every(f => f(r)))
    rows.sort((a,b) => { for (const [k,asc] of this.sorts) { const n = String(a[k]).localeCompare(String(b[k])); if (n) return asc ? n : -n } return 0 })
    rows = rows.slice(this.from, this.to + 1)
    calls.push({ table: this.table, rows: rows.length })
    return Promise.resolve({ data: this.single ? rows[0] ?? null : rows, error: this.table === failTable ? Error('fixture failure') : null }).then(resolve,reject)
  }
}
global.__cleanupDb = { from: t => new Query(t) }
global.__cleanupWindows = { open: { state: 'open', due_at: '2026-10-22T18:00:00Z' }, closed: { state: 'closed', due_at: '2026-10-21T18:00:00Z' }, retired: { state: 'open', due_at: '2026-10-22T18:00:00Z' } }
const mocks = {
  '@/lib/supabase': 'export const supabaseAdmin = global.__cleanupDb',
  '@/lib/api-auth': 'export const withAuth = f => f; export const withEnrolledStudent = f => f',
  '@/lib/student-enrollment': "export const getStudentTrack = async () => 'cpa'",
  '@/lib/program': "export const getStudentProgram = async () => 'physics'",
  '@/lib/points': 'export const getBalance = async () => ({lifetimeEarned:100,balance:80})',
  '@/lib/lesson-windows': "export const getStudentLessonWindowStatuses = async () => global.__cleanupWindows; export const getStudentLessonGate = async () => id => global.__cleanupWindows[id]?.state === 'open'",
  '@/lib/lesson-completion-server': "export const getLessonCompletions = async (_user,lessons) => Object.fromEntries(lessons.filter(l=>l.content_blocks?.presentation==='physics-path').map(l=>[l.id,{progress:50}]))",
  '@/lib/present-server': "export const classLesson = async id => ({slug:id,content_blocks:{blocks:[{id:'question',type:'question'}]}})",
  'next/server': 'export const NextResponse = {json:(value,options) => new Response(JSON.stringify(value),options)}',
}
async function bundle(dir, entry, name) {
  const file = path.join(out, name + '.cjs')
  await build({absWorkingDir:dir,entryPoints:[entry],outfile:file,bundle:true,platform:'node',format:'cjs',packages:'external',plugins:[{name:'fixture',setup(b){b.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js'}))}}],logLevel:'silent'})
  return require(file)
}
const ctx = {userId:'student',role:'student',realRole:'student',session:{user:{name:'Fixture'}}}
async function main() {
  const oldRoot = process.env.PERFORMANCE_BASELINE_ROOT ? path.resolve(process.env.PERFORMANCE_BASELINE_ROOT) : null
  const home = await bundle(root,'src/app/api/home/route.ts','home')
  const oldHome = oldRoot ? await bundle(oldRoot,'src/app/api/home/route.ts','home-before') : null
  const doc = {schemaVersion:1,presentation:'physics-path',learningPath:{version:1,kind:'lesson'},blocks:[]}
  state = { units:[{id:'unit-1',name:'Motion',program:'physics',order_index:1}],lessons:['open','closed','unassigned','retired'].map(id=>({id,slug:id,title:id,unit:'Motion',unit_id:'unit-1',published:true,lesson_number:1,content_blocks:id==='retired'?{blocks:[]}:doc})),lesson_progress:[{lesson_id:'open',status:'in_progress',progress_percentage:40}],learning_targets:[],student_activity:[],simulations:[] }
  let before, beforeRows
  if (oldHome) { calls=[]; before = await (await oldHome.GET(new Request('http://fixture/api/home'),ctx)).json(); beforeRows=calls.find(c=>c.table==='lessons').rows }
  calls=[]; const after = await (await home.GET(new Request('http://fixture/api/home'),ctx)).json()
  if (before) { delete before.sideQuest; assert.deepEqual(after,before,'home preserves assignments, progress, XP and mastery') }
  assert.equal(after.continue?.lesson.slug, 'open')
  assert.equal(calls.find(c=>c.table==='lessons').rows,1)
  if (oldHome) assert.equal(beforeRows,4)
  assert(!calls.some(c=>c.table==='simulations'),'unused side quest no longer queries simulations')
  global.__cleanupWindows={};calls=[];const empty=await (await home.GET(new Request('http://fixture/api/home'),ctx)).json()
  assert.equal(empty.continue,null);assert.deepEqual(empty.homework,[]);assert(!calls.some(c=>c.table==='lessons'),'no assigned lessons means no body query')
  console.log('PASS home: equivalent current data; retired/closed/unassigned bodies excluded; no empty catalog or unused simulation queries')

  const invites=await bundle(root,'src/app/api/present/invitations/route.ts','invitations')
  const oldInvites=oldRoot ? await bundle(oldRoot,'src/app/api/present/invitations/route.ts','invitations-before') : null
  state={course_students:[{student_id:'student',course_id:'class',enrollment_state:'ACTIVE'}],courses:[{id:'class',name:'Physics',archived_at:null}],present_sessions:[{id:'session',course_id:'class',lesson_id:'lesson',poll_block_id:'question',poll_run_id:'run',status:'live',created_at:'2026-10-21T12:00:00Z'}],present_pulses:[],lobby_sessions:[],present_ticket_responses:[],present_pulse_responses:[],lobby_members:[],block_responses:[]}
  for(let i=0;i<12;i++) {
    const id='pulse'+i, salt='salt'+i, ticket=i%2===0
    state.present_pulses.push({id,session_id:'session',kind:ticket?'exit_ticket':'poll',salt,anonymous:true,status:'open',locked:false,required:i===3,created_at:'2026-10-21T12:00:00Z',prompt:'Fixture',options:['A','B']})
    if(i%3===0) (ticket?state.present_ticket_responses:state.present_pulse_responses).push({id:'answer'+i,pulse_id:id,user_id:'student',respondent_key:crypto.createHash('md5').update(salt+'student').digest('hex'),choice:0})
    state.lobby_sessions.push({id:'lobby'+i,present_session_id:'session',status:'open',code:'X'+i,created_at:'2026-10-21T12:00:00Z'})
    if(i%2===0) state.lobby_members.push({session_id:'lobby'+i,user_id:'student'})
  }
  // Another student's work never suppresses this student's invitation.
  state.present_ticket_responses.push({id:'other',pulse_id:'pulse2',user_id:'someone-else'})
  state.present_pulse_responses.push({id:'other',pulse_id:'pulse1',respondent_key:'other',choice:1})
  let oldItems,oldCount
  if(oldInvites){calls=[];oldItems=await(await oldInvites.GET(null,ctx)).json();oldCount=calls.length}
  calls=[];const items=await(await invites.GET(null,ctx)).json();const count=calls.length
  if(oldItems) assert.deepEqual(items,oldItems)
  assert.equal(items.invitations.length,15)
  assert.equal(count,9);if(oldInvites)assert.equal(oldCount,30)
  assert(items.invitations.some(i=>i.id==='pulse:pulse2'))
  assert(!JSON.stringify(items).includes('salt'),'private respondent salts stay server-side')
  state.block_responses.push({id:'saved',present_session_id:'session',poll_run_id:'run',user_id:'student'})
  assert(!(await(await invites.GET(null,ctx)).json()).invitations.some(i=>i.kind==='lesson_poll'))
  failTable='lobby_members';await assert.rejects(()=>invites.GET(null,ctx));failTable=null
  console.log('PASS live invitations: identical responses and privacy; '+(oldCount ?? 'bounded')+' reads verified at '+count+'; read failures propagate')
}
main().catch(error=>{console.error(error);process.exitCode=1})
