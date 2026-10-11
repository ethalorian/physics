const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),os=require('node:os');
const root=path.resolve(__dirname,'..'),out=fs.mkdtempSync(path.join(os.tmpdir(),'video-xp-api-')),esbuild=require('esbuild');
let state;const reset=()=>{state={calls:[],open:true,block:{id:'video',type:'instruction_video'},visible:true,rpcError:null}};
global.__videoXp={get state(){return state}};
const mocks={
 'next/server':`export const NextResponse={json:(v,o)=>new Response(JSON.stringify(v),{status:o?.status??200,headers:o?.headers})}`,
 '@/lib/api-auth':`export const withEnrolledStudent=f=>f`,
 '@/lib/lesson-access':`export const authorizeLesson=async()=>global.__videoXp.state.open?{ok:true,viewer:{role:'student',track:'cpa'},document:{blocks:global.__videoXp.state.block?[global.__videoXp.state.block]:[]}}:{ok:false,response:new Response('{}',{status:403})}`,
 '@/lib/track-visibility':`export const isBlockVisible=()=>global.__videoXp.state.visible`,
 '@/lib/supabase':`export const supabaseAdmin={rpc:async(name,args)=>{global.__videoXp.state.calls.push({name,args});return {data:{earned:5,xpAwarded:5,lessonXp:15},error:global.__videoXp.state.rpcError}}}`,
};
const student={userId:'student',email:'student@example.test',realRole:'student'};
const body={lesson_id:'lesson',block_id:'video',expected_user_id:'student',session_id:'30000000-0000-4000-8000-000000000001',position:5,playing:true};
const post=b=>new Request('http://test/api/lessons/video-progress',{method:'POST',body:JSON.stringify(b)});
let passed=0;async function check(name,fn){reset();await fn();passed++;console.log('PASS '+name)}
(async()=>{
 const outfile=out+'/route.cjs';await esbuild.build({entryPoints:[root+'/src/app/api/lessons/video-progress/route.ts'],outfile,bundle:true,platform:'node',format:'cjs',plugins:[{name:'boundaries',setup(b){b.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'mock'}:undefined);b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:mocks[a.path],loader:'js'}))}}]});const api=require(outfile);
 await check('preview cannot read or award XP',async()=>{for(const role of ['teacher','admin']){const ctx={...student,realRole:role};assert.equal((await api.POST(post(body),ctx)).status,403);assert.equal((await api.GET(new Request('http://test/?lesson_id=lesson&block_id=video&expected_user_id=student'),ctx)).status,403)}assert.equal(state.calls.length,0)});
 await check('account switch fails before persistence',async()=>{assert.equal((await api.POST(post({...body,expected_user_id:'other'}),student)).status,409);assert.equal(state.calls.length,0)});
 await check('closed lesson cannot award',async()=>{state.open=false;assert.equal((await api.POST(post(body),student)).status,403);assert.equal(state.calls.length,0)});
 await check('removed, nonvideo and wrong-track blocks fail closed',async()=>{for(const block of [null,{id:'video',type:'question'}]){state.block=block;assert.equal((await api.POST(post(body),student)).status,404)}state.block={id:'video',type:'instruction_video'};state.visible=false;assert.equal((await api.POST(post(body),student)).status,404);assert.equal(state.calls.length,0)});
 await check('invalid timestamps and sessions cannot reach database',async()=>{for(const patch of [{position:-1},{position:Infinity},{position:14401},{position:'5'},{session_id:'bad'},{playing:'true'},{expected_user_id:null}])assert.equal((await api.POST(post({...body,...patch}),student)).status,400);assert.equal(state.calls.length,0)});
 await check('only server identity and allowed playback telemetry reach award RPC',async()=>{const response=await api.POST(post({...body,user_id:'other',reward:999,duration:1,watched:999}),student);assert.equal(response.status,200);assert.deepEqual(state.calls[0],{name:'record_lesson_video_watch',args:{p_user:'student',p_email:'student@example.test',p_lesson:'lesson',p_block:'video',p_session:body.session_id,p_position:5,p_playing:true}});assert.equal(response.headers.get('cache-control'),'no-store')});
 await check('status read does not write watch progress',async()=>{await api.GET(new Request('http://test/?lesson_id=lesson&block_id=video&expected_user_id=student'),student);assert.deepEqual(state.calls.map(c=>c.name),['lesson_video_xp_status'])});
 await check('database errors cannot masquerade as paid XP',async()=>{state.rpcError=new Error('unavailable');await assert.rejects(()=>api.POST(post(body),student))});
 console.log(`${passed} video XP API boundary checks passed`);
})().catch(e=>{console.error(e);process.exitCode=1});
