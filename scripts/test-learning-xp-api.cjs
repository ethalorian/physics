const fs=require('fs'),assert=require('assert/strict'),path=require('path'),os=require('os'),{build}=require('esbuild');
const root=path.resolve(__dirname,'..'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'learning-xp-api-'));
const student='00000000-0000-4000-8000-000000000001',task='10000000-0000-4000-8000-000000000001';
global.fixture={allowed:true,points:0,fail:false,filters:[]};
(async()=>{
 const mocks={
 'next/server':'export const NextResponse={json:(d,o)=>Response.json(d,o)}',
 '@/lib/api-auth':'export const withAuth=h=>h',
 '@/lib/vocab-access':'export const accessVocabTask=async()=>global.fixture.allowed?{}:null',
 '@/lib/supabase':`export const supabaseAdmin={from:()=>{const f=global.fixture;return{select(){return this},eq(k,v){f.filters.push([k,v]);return this},maybeSingle:async()=>({data:f.points?{points:f.points,awarded_at:'2026-09-28T12:00:00Z'}:null,error:f.fail?new Error('Fixture unavailable'):null})}}}`
 };
 const out=tmp+'/route.cjs';await build({entryPoints:[root+'/src/app/api/vocab/xp/route.ts'],outfile:out,bundle:true,platform:'node',format:'cjs',plugins:[{name:'fixture',setup(b){b.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js'}))}}]});
 const {GET}=require(out),ctx={userId:student,realRole:'student'};
 const get=(id=task,c=ctx)=>GET(new Request('http://fixture/api/vocab/xp?task_id='+id),c);
 assert.equal((await get('bad')).status,400);
 global.fixture.allowed=false;assert.equal((await get()).status,403);global.fixture.allowed=true;
 assert.deepEqual(await(await get()).json(),{earned:0,awardedAt:null,available:5});
 global.fixture.points=5;assert.equal((await(await get()).json()).earned,5);
 assert(global.fixture.filters.some(([k,v])=>k==='user_id'&&v===student));
 assert(global.fixture.filters.some(([k,v])=>k==='dedupe_key'&&v==='vocab-assignment:'+task+':'+student));
 assert.equal((await(await get(task,{...ctx,realRole:'admin'})).json()).preview,true);
 global.fixture.fail=true;await assert.rejects(()=>get(),/Fixture unavailable/);
 console.log('PASS assignment XP receipt: scoped owner/key, no completed work, confirmed award, staff preview, invalid/unassigned task and unavailable receipt');
})().catch(e=>{console.error(e);process.exitCode=1});
