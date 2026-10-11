// Runs real score/payout handlers against an in-memory Supabase-shaped double. No live reads/writes.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict'),esbuild=require('esbuild');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'math-save-'));let state;
function reset(stats={solved:8,right:8,wrong:0,startLv:1,mode:'magnitude'}){state={play:{id:'play',user_id:'s',game_slug:'magnitude',status:'finished',score:100,created_at:new Date().toISOString(),meta:{stats}},grants:[],today:0,inserts:0,cap:10};}
class Query{
 constructor(table){this.table=table;this.filters=[]}select(){return this}eq(k,v){this.filters.push(r=>r[k]===v);return this}gte(){this.today=true;return this}single(){return this}maybeSingle(){this.one=true;return this}insert(row){this.row=row;return this}update(row){this.updateRow=row;return this}
 then(resolve,reject){try{
  let data=null,error=null;
  if(this.table==='arcade_plays'){
   const snapshot={...state.play,meta:structuredClone(state.play.meta)};
   if(this.updateRow){if(state.race){state.play.status='finished';state.play.meta.stats.wrong=99;}if(this.filters.every(f=>f(state.play))){Object.assign(state.play,this.updateRow);data={id:'play'}}}else data=snapshot;
  }else if(this.table==='arcade_games')data={slug:'magnitude',cost_xp:0,max_plausible_score:500};
  else if(this.table==='economy_point_grants'){
   if(this.row){state.inserts++;if(state.duplicate){state.grants.push({...this.row,points:3});state.duplicate=false;error={code:'23505'}}else{const row={...this.row,points:Math.max(0,Math.min(this.row.points,state.cap-state.today-(state.practiceToday||0)))};state.grants.push(row);data=row;}}
   else if(state.failReceipts&&this.one)error={message:'offline'};
   else if(this.today&&state.failTotals)error={message:'offline'};
   else if(this.today)data=[{points:state.today}];else data=state.grants.find(r=>this.filters.every(f=>f(r)))||null;
  }
  return Promise.resolve({data,error}).then(resolve,reject);
 }catch(e){return Promise.reject(e).then(resolve,reject)}}
}
global.__mathSave={from:t=>new Query(t)};
const mocks={'@/lib/supabase':'export const supabaseAdmin=global.__mathSave;', '@/lib/api-auth':'export const withAuth=f=>r=>f(r,{userId:"s",role:"student",email:"fixture@example.invalid"});','@/lib/student-enrollment':'export const getStudentTrack=async()=>"cpa";', '@/lib/points':'export const getBalance=async()=>({balance:100});','@/lib/arcade':'export const isStaff=()=>false;export const PLAY_MAX_AGE_MS=21600000;','next/server':'export const NextResponse={json:(d,o)=>Response.json(d,o)};'};
async function load(name){const outfile=path.join(dir,name+'.cjs');await esbuild.build({entryPoints:['src/app/api/arcade/'+name+'/route.ts'],outfile,bundle:true,platform:'node',plugins:[{name:'fixture',setup(b){b.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'f'}:undefined);b.onLoad({filter:/.*/,namespace:'f'},a=>({contents:mocks[a.path],loader:'js'}))}}]});return require(outfile).POST;}
const request=body=>new Request('http://fixture/api',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
(async()=>{try{
const score=await load('score'),payout=await load('payout');let n=0;async function test(name,fn){reset();await fn();console.log('PASS',name);n++;}
await test('accuracy weighting and repeated receipts',async()=>{state.play.meta.stats={solved:8,right:4,wrong:4,startLv:4,mode:'magnitude'};let r=await payout(request({playId:'play'}));assert.equal((await r.json()).xp,3);r=await payout(request({playId:'play'}));assert.equal((await r.json()).xp,3);assert.equal(state.inserts,1)});
await test('below threshold and empty attempts award zero',async()=>{for(const stats of [{solved:8,right:4,wrong:5},{solved:0,right:0,wrong:0}]){reset({...stats,startLv:1,mode:'magnitude'});assert.equal((await (await payout(request({playId:'play'}))).json()).xp,0);assert.equal(state.grants[0].points,0)}});
await test('capped zero receipt stays zero on next day retry',async()=>{state.today=10;let r=await payout(request({playId:'play'}));assert.deepEqual([(await r.json()).xp,state.grants[0].points],[0,0]);state.today=0;r=await payout(request({playId:'play'}));assert.equal((await r.json()).xp,0);assert.equal(state.inserts,1)});
await test('duplicate insert returns the original award, not zero',async()=>{state.duplicate=true;const r=await payout(request({playId:'play'}));assert.equal((await r.json()).xp,3)});
await test('unavailable receipt lookup fails without a grant',async()=>{state.failReceipts=true;assert.equal((await payout(request({playId:'play'}))).status,503);assert.equal(state.inserts,0)});
await test('unavailable daily totals fail without a grant',async()=>{state.failTotals=true;assert.equal((await payout(request({playId:'play'}))).status,503);assert.equal(state.inserts,0)});
await test('shared practice cap returns the database-clamped receipt',async()=>{state.practiceToday=8;const receipt=await(await payout(request({playId:'play'}))).json();assert.equal(receipt.xp,2);assert.equal(receipt.capped,true);assert.equal(state.grants[0].points,2)});
await test('ownership and cabinet identity prevent recovery of another run',async()=>{assert.equal((await score(request({playId:'play',slug:'fusion',score:100,final:true}))).status,403);state.play.user_id='other';assert.equal((await score(request({playId:'play',slug:'magnitude',score:100,final:true}))).status,404);assert.equal((await payout(request({playId:'play'}))).status,404)});
await test('final retry cannot replace stored score or stats',async()=>{assert.equal((await score(request({playId:'play',score:500,final:true,stats:{right:999}}))).status,200);assert.equal(state.play.score,100);assert.equal(state.play.meta.stats.right,8)});
await test('deployed rhythm cabinet final retries remain immutable',async()=>{for(const slug of ['pulse','mic-check']){state.play.game_slug=slug;const r=await score(request({playId:'play',slug,score:500,final:true}));assert.equal(r.status,200);assert.equal((await r.json()).alreadySaved,true);assert.equal(state.play.score,100)}});
await test('finite scores capped and stats sanitized',async()=>{state.play.status='active';const r=await score(request({playId:'play',slug:'magnitude',score:99999,final:true,stats:{solved:-2,right:10000,wrong:'bad',startLv:99,mode:'<script>'}}));assert.equal(r.status,200);assert.equal(state.play.score,500);assert.equal(state.play.meta.stats.solved,0);assert.equal(state.play.meta.stats.right,5000);assert.equal(state.play.meta.stats.startLv,10)});
await test('a late checkpoint cannot overwrite a concurrently finished run',async()=>{state.play.status='active';state.race=true;const r=await score(request({playId:'play',score:150,stats:{wrong:0}}));assert.equal(r.status,409);assert.equal(state.play.meta.stats.wrong,99);assert.equal(state.play.score,100)});
console.log(n+' actual math score/payout route checks passed');
}finally{fs.rmSync(dir,{recursive:true,force:true})}})().catch(e=>{console.error(e);process.exitCode=1});
