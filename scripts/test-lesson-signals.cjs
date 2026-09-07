const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), assert = require('node:assert/strict');
const root = process.env.LESSON_TEST_ROOT || path.resolve(__dirname, '..');
const esbuild = require(path.join(root, 'node_modules/esbuild'));
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'lesson-signals-test-'));
function bundle(entry, name, plugins = []) {
  const outfile = path.join(temp, name + '.cjs');
  esbuild.buildSync({entryPoints:[path.join(root, entry)],bundle:true,platform:'node',format:'cjs',outfile});
  return require(outfile);
}
const lib = bundle('src/lib/lesson-signals.ts','helper');
const target = {id:'t',slug:'target',statement:'Explain',unit_id:'u'};
const row = (overrides={}) => ({id:'r',user_id:'s',lesson_id:'l',block_id:'b',session_id:null,present_session_id:null,poll_run_id:null,target_id:'t',evidence_source:'lesson_checkpoint',confidence:'sure',scaffolds_used:['level:bare','mode:text'],response:{autoCheck:'mismatch'},created_at:'2026-09-06T10:00:00Z',...overrides});
const record = {user_id:'s',target_id:'t',level:3,observed_at:'2026-09-06T11:00:00Z'};
for(const token of ['frame:1','frame:2','frame:3','word_bank','l1','visual','talk_first','given_hint','equation_hint']) assert.equal(lib.isActualSupport(token),true,token);
for(const token of ['level:bare','level:full','mode:text','mode:sketch','unknown']) assert.equal(lib.isActualSupport(token),false,token);
assert.equal(lib.hasSupportLog(null),false); assert.equal(lib.hasSupportLog([]),false); assert.equal(lib.hasSupportLog(['legacy-unknown']),false); assert.equal(lib.hasSupportLog(['level:partial']),true);
const current = row({id:'new',created_at:'2026-09-06T12:00:00Z',response:{autoCheck:'match'}});
assert.deepEqual(lib.latestEvidence([current,row()]),[current]);
assert.equal(lib.latestEvidence([row(),row({id:'lobby',evidence_source:'lobby'}),row({id:'p1',evidence_source:'live_poll',poll_run_id:'round1'}),row({id:'p2',evidence_source:'live_poll',poll_run_id:'round2'})]).length,4);
assert.equal(lib.buildLessonSignals([target],[row(),row({id:'new-target',target_id:'other',created_at:'2026-09-06T13:00:00Z'})],[record],[]).coverage.responses,0,'deduplicate before scope to avoid resurrecting an older target');
const sig = lib.buildLessonSignals([target],[row(),current,row({id:'legacy',user_id:'legacy',scaffolds_used:null}),row({id:'help',user_id:'help',scaffolds_used:['word_bank']}),row({id:'outside',target_id:'other'})],[record,{...record,user_id:'legacy',level:1},{...record,user_id:'help',level:2}],[]);
assert.equal(sig.misconception[0].students,2); assert.equal(sig.coverage.responses,3); assert.equal(sig.coverage.supersededResponses,1); assert.equal(sig.coverage.missingLogs,1); assert.equal(sig.scaffold.heavyPairs,1); assert.equal(sig.scaffold.lightPairs,1); assert.equal(sig.scaffold.heavyMean,2); assert.equal(sig.scaffold.lightMean,3);
assert.equal(lib.buildLessonSignals([target],[row()],[record,{...record,level:1,observed_at:'2026-09-05'}],[]).scaffold.lightMean,3);

let tables,fail,calls;
class Query {
 constructor(table){this.table=table;this.filters=[];this.sort=[];this.from=0;this.to=Infinity;}
 select(){return this} eq(k,v){this.filters.push(r=>r[k]===v);return this} in(k,v){this.filters.push(r=>v.includes(r[k]));return this}
 lte(k,v){this.filters.push(r=>r[k]<=v);return this} not(k,_op,v){this.filters.push(r=>r[k]!==v);return this} order(k){this.sort.push(k);return this} range(f,t){this.from=f;this.to=t;return this}
 then(resolve,reject){calls.push({table:this.table,from:this.from,to:this.to});let data=(tables[this.table]||[]).filter(r=>this.filters.every(f=>f(r)));data.sort((a,b)=>{for(const k of this.sort){const c=String(a[k]).localeCompare(String(b[k]));if(c)return c}return 0});return Promise.resolve({data:fail===this.table?null:data.slice(this.from,this.to+1),error:fail===this.table?new Error('simulated failure'):null}).then(resolve,reject)}
}
global.__signalsQuery={from:t=>new Query(t)};
(async()=>{
 const outfile=path.join(temp,'route.cjs');
 await esbuild.build({entryPoints:[path.join(root,'src/app/api/analytics/signals/route.ts')],bundle:true,platform:'node',format:'cjs',outfile,plugins:[{name:'mocks',setup(build){
  const mocks={'@/lib/supabase':`export const supabaseAdmin={from:t=>global.__signalsQuery.from(t)}`,'@/lib/api-auth':`export const withAuth=f=>f`,'next/server':`export const NextResponse={json:(data,opts)=>new Response(JSON.stringify(data),{status:opts?.status??200})}`};
  build.onResolve({filter:/.*/},args=>mocks[args.path]?{path:args.path,namespace:'mock'}:undefined);build.onLoad({filter:/.*/,namespace:'mock'},args=>({contents:mocks[args.path],loader:'js'}));
 }}]});
 const {GET}=require(outfile);
 tables={learning_targets:[target,{...target,id:'other',unit_id:'other-unit'}],block_responses:Array.from({length:1005},(_,i)=>row({id:String(i).padStart(4,'0'),block_id:String(i),target_id:i===1004?null:'other'})),mastery_records:[record],mastery_calibration:[],lesson_evidence_links:[{response_id:'1004',lesson_id:'l',target_id:'t'}]};calls=[];
 let response=await GET(new Request('http://localhost/api/analytics/signals?unit=u'),{role:'observer'});assert.equal(response.status,200);let result=await response.json();assert.equal(result.coverage.responses,1,'repaired historical target is included in unit');assert.equal(result.readOnly,true);assert.equal(calls.filter(c=>c.table==='block_responses').length,3,'all evidence pages read');
 calls=[];response=await GET(new Request('http://localhost/api/analytics/signals'),{role:'student'});assert.equal(response.status,403);assert.equal(calls.length,0);
 for(const table of ['learning_targets','block_responses','lesson_evidence_links','mastery_records','mastery_calibration']){fail=table;response=await GET(new Request('http://localhost/api/analytics/signals?unit=u'),{role:'admin'});assert.equal(response.status,500,table)}
 console.log('Lesson signals: support classification, unknown coverage, latest evidence, independent poll rounds, unit scoping, repair overlay, 1005-row pagination, access and query failure tests passed.');
})().catch(error=>{console.error(error);process.exitCode=1});
