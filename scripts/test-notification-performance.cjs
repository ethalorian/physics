const assert = require('node:assert/strict')
const fs = require('node:fs'), path = require('node:path'), os = require('node:os')
const { build } = require('esbuild')
const root = path.resolve(__dirname, '..'), out = fs.mkdtempSync(path.join(os.tmpdir(), 'notification-api-'))
let state, calls, active, peak, rejectTable, errorTable
class Query {
  constructor(table) { this.table = table; this.filters = []; this.sorts = []; this.max = Infinity }
  select() { return this }
  eq(k,v) { this.filters.push(r=>r[k]===v); return this }
  neq(k,v) { this.filters.push(r=>r[k]!==v); return this }
  gt(k,v) { this.filters.push(r=>r[k]>v); return this }
  in(k,v) { this.filters.push(r=>v.includes(r[k])); return this }
  order(k,{ascending=true}={}) { this.sorts.push([k,ascending]); return this }
  limit(n) { this.max=n; return this }
  maybeSingle() { this.single=true; return this }
  then(resolve,reject) {
    calls.push(this.table); peak=Math.max(peak,++active)
    return new Promise((ok,fail)=>setTimeout(()=>{
      active--
      if(this.table===rejectTable)return fail(Error('network unavailable'))
      let rows=(state[this.table]??[]).filter(r=>this.filters.every(f=>f(r)))
      rows.sort((a,b)=>{for(const [k,asc] of this.sorts){const c=String(a[k]).localeCompare(String(b[k]));if(c)return asc?c:-c}return 0})
      rows=rows.slice(0,this.max)
      ok({data:this.table===errorTable?null:this.single?rows[0]??null:rows,error:this.table===errorTable?{message:'query unavailable'}:null})
    },10)).then(resolve,reject)
  }
}
global.__notificationDb={from:t=>new Query(t)}
async function bundle(dir,name) {
  const file=path.join(out,name+'.cjs'),mocks={
    '@/lib/supabase':'export const supabaseAdmin=global.__notificationDb',
    '@/lib/api-auth':'export const withAuth=f=>f',
    'next/server':'export const NextResponse={json:value=>new Response(JSON.stringify(value))}',
  }
  await build({absWorkingDir:dir,entryPoints:['src/app/api/notifications/route.ts'],outfile:file,bundle:true,platform:'node',packages:'external',plugins:[{name:'fixture',setup(b){b.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js'}))}}],logLevel:'silent'})
  return require(file)
}
async function run(api,role='student') {
  calls=[];active=0;peak=0;const start=performance.now()
  const data=await(await api.GET(null,{userId:'student',realRole:role})).json()
  return {data,calls:[...calls],peak,ms:Math.round(performance.now()-start)}
}
async function main() {
  const current=await bundle(root,'current'),baseline=process.env.NOTIFICATION_BASELINE_ROOT?await bundle(path.resolve(process.env.NOTIFICATION_BASELINE_ROOT),'baseline'):null
  const at='2026-10-21T14:00:00Z',old='2026-10-19T00:00:00Z',me={user_id:'student'}
  state={notification_reads:[{...me,seen_at:old}],mastery_records:[{...me,id:'m',level:3,observed_at:at}],math_warmup_revisions:[{...me,id:'r',status:'acknowledged',acknowledged_at:at,teacher_reply:'Good revision'}],teacher_feedback:[{...me,id:'f',message:'x'.repeat(150),created_at:at},{user_id:'someone-else',id:'private',message:'PRIVATE',created_at:at}],submissions:[{...me,id:'s',score:4,max_score:5,status:'graded',graded_at:at}],math_spine_point_grants:[{...me,id:'p',points:5,note:'Practice',awarded_at:at}],challenges:[{id:'c',opponent_user_id:'student',challenger_user_id:'challenger',status:'pending',created_at:at}],students:[{id:'challenger',alias:'Comet',name:'Fictional'}],reward_redemptions:[{...me,id:'part',reward_name:'Wheel',status:'fulfilled',created_at:at,reward:{category:'Car Part',grant_lesson_id:null}}],teacher_access_requests:[{email:'fictional@example.test',name:'Fixture teacher',status:'pending',created_at:at}]}
  for(const role of ['student','teacher','admin']) {
    const before=baseline?await run(baseline,role):null,after=await run(current,role)
    if(before) {assert.deepEqual(after.data,before.data);assert.deepEqual([...after.calls].sort(),[...before.calls].sort());assert.equal(before.peak,1)}
    assert.equal(after.peak,role==='admin'?9:8)
    assert.equal(after.data.items.some(i=>i.type==='access'),role==='admin')
    assert(!JSON.stringify(after.data).includes('PRIVATE'))
    assert.equal(after.data.items.find(i=>i.type==='duel').detail,'Comet challenged you')
    console.log('PASS',role,'identical ordered feed and query scope;',before?.ms??'baseline not supplied','→',after.ms,'ms with 10 ms simulated reads; concurrency',before?.peak??'-','→',after.peak)
  }
  for(const table of ['mastery_records','teacher_feedback','submissions','math_spine_point_grants','challenges','reward_redemptions','teacher_access_requests','students']) {
    rejectTable=table
    const before=baseline?await run(baseline,'admin'):null,after=await run(current,'admin')
    if(before)assert.deepEqual(after.data,before.data)
  }
  rejectTable=null;errorTable='teacher_feedback'
  if(baseline)assert.deepEqual((await run(current)).data,(await run(baseline)).data)
  errorTable=null
  for(const table of ['notification_reads','math_warmup_revisions']) {rejectTable=table;await assert.rejects(()=>run(current));await new Promise(r=>setTimeout(r,15));if(baseline)await assert.rejects(()=>run(baseline))}
  rejectTable=null;state={}
  assert.deepEqual((await run(current)).data,{items:[],unread:0})
  console.log('PASS optional query/network failures, required failures, empty feed, stable ties, user privacy and admin-only access requests')
}
main().catch(e=>{console.error(e);process.exitCode=1})
