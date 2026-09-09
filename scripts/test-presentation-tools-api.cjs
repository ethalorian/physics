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
let savedSei;global.db=table=>{assert.equal(table,'present_session_tools');return {upsert:async(value,options)=>{savedSei=value;assert.equal(options.onConflict,'session_id');return {error:null}}}};
let result;
for(const enabled of [true,false]){result=await tools.POST(request({action:'sei_supports',enabled}),ctx);assert.equal(result.status,200);assert.equal(savedSei.sei_enabled,enabled);assert.deepEqual(Object.keys(savedSei).sort(),['sei_enabled','session_id','updated_at']);}
for(const enabled of ['false',null,1]){result=await tools.POST(request({action:'sei_supports',enabled}),ctx);assert.equal(result.status,400);}
global.allowed=false;result=await tools.POST(request({action:'sei_supports',enabled:true}),ctx);assert.equal(result.status,403);global.allowed=true;
session.status='ended';result=await tools.POST(request({action:'sei_supports',enabled:true}),ctx);assert.equal(result.status,409);session.status='live';
console.log('PASS SEI setting on/off, strict validation, presentation ownership and ended-session checks.');
result=await tools.POST(request({action:'bookmark',student_id:'other',note:'private'}),ctx);assert.equal(result.status,403);
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
const sessionRoute=await build('src/app/api/present/sessions/[id]/route.ts','session-route.cjs',{'@/lib/present-server':`export const classLesson=async()=>({content_blocks:{blocks:[{id:'graph',type:'graph',series:[]},{id:'text',type:'prose',markdown:'One paragraph.'}]}});`});
let savedUpdate;
global.db=table=>{let update;const chain=new Proxy({}, {get:(_,key)=>key==='then'?(resolve,reject)=>Promise.resolve({data:update?{...session,...update}:session}).then(resolve,reject):(...args)=>{if(key==='update'){update=args[0];savedUpdate=update}return chain}});return chain};
result=await sessionRoute.PATCH(request({projected_block_id:'graph'}),ctx);assert.equal(result.status,200);assert.equal(savedUpdate.projected_block_id,'graph');assert.equal(savedUpdate.projected_block_page,0);assert.ok(savedUpdate.current_anchor);assert.equal('current_slide' in savedUpdate,false,'Projecting a block preserves the deck position');
result=await sessionRoute.PATCH(request({projected_block_id:'hidden'}),ctx);assert.equal(result.status,400);
result=await sessionRoute.PATCH(request({projected_block_id:'graph',projected_block_page:1}),ctx);assert.equal(result.status,400,'Graphs cannot be split into another screen');
result=await sessionRoute.PATCH(request({projected_block_id:null}),ctx);assert.equal(result.status,200);assert.equal(savedUpdate.projected_block_id,null);
const unavailable=await build('src/app/api/present/sessions/[id]/route.ts','unavailable-session.cjs',{'@/lib/present-server':`export const classLesson=async()=>{globalThis.lessonChecks++;return null};`});
global.lessonChecks=0;let writes=[],failPulse=false;
global.db=table=>{let update;const chain=new Proxy({}, {get:(_,key)=>key==='then'?(resolve,reject)=>Promise.resolve({data:update?{...session,...update}:session,error:table==='present_pulses'&&failPulse?{message:'unavailable'}:null}).then(resolve,reject):(...args)=>{if(key==='update'){update=args[0];writes.push({table,update})}return chain}});return chain};
result=await unavailable.PATCH(request({status:'ended'}),{...ctx,userId:'other'});assert.equal(result.status,403);assert.equal(writes.length,0,'Foreign owners cannot end or close pulses');
for(const course of ['c',null]){session.course_id=course;result=await unavailable.PATCH(request({status:'ended',current_slide:999}),ctx);assert.equal(result.status,200);assert.equal(result.body.session.status,'ended');assert.equal(result.body.session.blackout,true);assert.equal(result.body.session.poll_block_id,null);assert.equal(result.body.session.timer_ends_at,null);assert.equal(result.body.session.projected_block_id,null);assert.equal(result.body.session.current_slide,1,'Ending preserves deck position');}
assert.equal(global.lessonChecks,0,'Ending bypasses unavailable class/lesson lookup');
assert.ok(writes.some(w=>w.table==='present_pulses'&&w.update.status==='closed'));
session.course_id='c';writes=[];result=await unavailable.PATCH(request({current_slide:2}),ctx);assert.equal(result.status,403);assert.equal(writes.length,0,'Regular controls still require class access');
failPulse=true;result=await unavailable.PATCH(request({status:'ended'}),ctx);assert.equal(result.status,503,'Failed cleanup gives retryable error, never false success');
failPulse=false;writes=[];let tables=[];
const previousDb=global.db;global.db=table=>{tables.push(table);return previousDb(table)};
result=await unavailable.GET(new Request('http://test/api/present/sessions/s?state_only=1'),ctx);assert.equal(result.status,200);assert.deepEqual(tables,['present_sessions'],'Notification read skips roster, lobby and answer aggregation');
result=await unavailable.GET(new Request('http://test/api/present/sessions/s?state_only=1'),{...ctx,userId:'other'});assert.equal(result.status,403,'Notification does not authorize access');
const realtimeRoute=await build('src/app/api/present/sessions/[id]/realtime/route.ts','realtime-route.cjs');
result=await realtimeRoute.GET(new Request('http://test/realtime'),{...ctx,userId:'other'});assert.equal(result.status,403);
process.env.NEXT_PUBLIC_SUPABASE_URL='https://fixture.supabase.co';process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='public-fixture';
result=await realtimeRoute.GET(new Request('http://test/realtime'),ctx);assert.equal(result.status,200);assert.equal(result.body.realtime.topic,'present:s');assert.equal('token' in result.body.realtime,false,'No signing secret or user JWT is distributed');
console.log('PASS notification read authorization, one-query read, notification setup authorization.');
console.log('PASS stale-session ending, null class, repeated end, foreign-owner rejection, activity cleanup, class checks retained, cleanup failure.');
console.log('PASS actual server/API modules: anonymous aggregate-only queue, named help/missing queue, display privacy, foreign-session/student rejection, invalid pulse kinds, identity from authentication, late response rejection.');
})().catch(e=>{console.error(e);process.exitCode=1});
