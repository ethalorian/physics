const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const repo=process.cwd(),out=fs.mkdtempSync('/private/tmp/presentation-tools-api.');
const esbuild=require(path.join(repo,'node_modules/esbuild'));
(async()=>{
const mocks={
 'next/server':`export const NextResponse={json:(body,init)=>({body,status:init?.status??200})}`,
 '@/lib/api-auth':`export const withRole=(_roles,handler)=>handler;export const withEnrolledStudent=handler=>handler;`,
 '@/lib/supabase':`export const supabaseAdmin={from:(table)=>globalThis.db(table),rpc:(name,args)=>globalThis.rpc(name,args)}`,
};
const build=async(file,name,extra={})=>{const all={...mocks,...extra};await esbuild.build({entryPoints:[path.join(repo,file)],bundle:true,platform:'node',format:'cjs',outfile:path.join(out,name),packages:'external',plugins:[{name:'mocks',setup(b){b.onResolve({filter:/^(next\/server|@\/lib\/(api-auth|supabase|presentation-tools-server|present-server))$/},a=>a.path in all?{path:a.path,namespace:'mock'}:undefined);b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:all[a.path],loader:'js'}))}}]});return require(path.join(out,name))};
const server=await build('src/lib/presentation-tools-server.ts','server.cjs');
let anonymous=true,calls=[];
const pulse={id:'p',kind:'readiness',status:'open',created_at:''};
global.db=table=>{calls.push(table);let result;
if(table==='present_pulses')result={data:{...pulse,anonymous}};
else if(table==='present_pulse_responses')result={data:[{user_id:anonymous?null:'a',choice:0}]};
else if(table==='course_students')result={data:[{student_id:'a'},{student_id:'b'}]};
else if(table==='students')result={data:[{id:'a',name:'Alex'},{id:'b',name:'Blair'}]};
else if(table==='present_teacher_marks'||table==='present_help_requests')result={data:[]};
else result={data:null};
const chain=new Proxy({}, {get:(_,key)=>key==='then'?(resolve,reject)=>Promise.resolve(result).then(resolve,reject):()=>chain});return chain};
const session={id:'s',course_id:'c',lesson_id:'l',teacher_id:'teacher',status:'live',current_slide:1,poll_block_id:null};
let data=await server.teachingTools(session,false);assert.deepEqual(data.needs,[]);assert.equal(data.pulse.tally[0],1);assert.equal('salt'in data.pulse,false);
anonymous=false;data=await server.teachingTools(session,false);assert.equal(data.needs.find(s=>s.id==='a').reasons[0],'Needs help on pulse check');assert.equal(data.needs.find(s=>s.id==='b').reasons[0],'No pulse response yet');
calls=[];data=await server.teachingTools(session,true);assert.deepEqual(data.roster,[]);assert.deepEqual(data.marks,[]);assert.deepEqual(data.needs,[]);assert.equal(calls.includes('present_teacher_marks'),false);assert.equal(calls.includes('students'),false);
let allowed=true,rpcArgs;
const helper=`export const presentationForActor=async()=>globalThis.allowed?globalThis.session:null;export const teachingTools=async()=>({roster:[{id:'a',name:'Alex'}],marks:[]});export const presentationForStudent=async()=>globalThis.allowed?globalThis.session:null;`;
global.session=session;global.allowed=true;
const tools=await build('src/app/api/present/sessions/[id]/tools/route.ts','tools.cjs',{'@/lib/presentation-tools-server':helper});
const respond=await build('src/app/api/present/respond/route.ts','respond.cjs',{'@/lib/presentation-tools-server':helper});
const ctx={params:Promise.resolve({id:'s'}),role:'teacher',userId:'teacher'};
const request=body=>new Request('http://test/tools',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
let result=await tools.POST(request({action:'bookmark',student_id:'other',note:'private'}),ctx);assert.equal(result.status,403);
result=await tools.POST(request({action:'pulse',kind:'constructor',anonymous:true}),ctx);assert.equal(result.status,400);
global.allowed=false;result=await tools.GET(new Request('http://test/tools'),ctx);assert.equal(result.status,403);
result=await respond.POST(request({action:'pulse',session_id:'s',pulse_id:'p',choice:0}),{userId:'a'});assert.equal(result.status,403);
global.allowed=true;global.rpc=async(name,args)=>{rpcArgs=args;return {error:null}};
result=await respond.POST(request({action:'pulse',session_id:'s',pulse_id:'p',choice:0,user_id:'spoofed'}),{userId:'a'});assert.equal(result.status,200);assert.equal(rpcArgs.p_user,'a');
global.rpc=async()=>({error:{message:'closed'}});result=await respond.POST(request({action:'pulse',session_id:'s',pulse_id:'p',choice:0}),{userId:'a'});assert.equal(result.status,409);
const sessions=await build('src/app/api/present/sessions/route.ts','sessions.cjs',{'@/lib/present-server':'export const classLesson=async()=>null;export const resolveClassLesson=async()=>({ok:false});'});
let filters=[];
global.db=table=>{assert.equal(table,'present_sessions');const chain=new Proxy({}, {get:(_,key)=>key==='then'?(resolve,reject)=>Promise.resolve({data:[session]}).then(resolve,reject):(...args)=>{filters.push([key,...args]);return chain}});return chain};
result=await sessions.GET(new Request('http://test/api/present/sessions?active=1'),ctx);
assert.equal(result.status,200);assert.equal(result.body.sessions[0].id,'s');
assert.ok(filters.some(f=>f[0]==='eq'&&f[1]==='teacher_id'&&f[2]==='teacher'),'Active discovery stays scoped to the authenticated teacher');
assert.ok(filters.some(f=>f[0]==='eq'&&f[1]==='status'&&f[2]==='live'),'Ended sessions are excluded');
console.log('PASS actual server/API modules: anonymous aggregate-only queue, named help/missing queue, display privacy, foreign-session/student rejection, invalid pulse kinds, identity from authentication, late response rejection.');
})().catch(e=>{console.error(e);process.exitCode=1});
