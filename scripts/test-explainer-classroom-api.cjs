const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),esbuild=require('esbuild');
const repo=process.cwd(),out=fs.mkdtempSync('/private/tmp/explainer-api.');
(async()=>{
const mocks={
 'next/server':`export const NextResponse={json:(body,init)=>({body,status:init?.status??200})}`,
 'server-only':'',
 '@/lib/api-auth':`export const withRole=(_roles,handler)=>handler;export const withAuth=handler=>handler;`,
 '@/lib/supabase':`export const supabaseAdmin={from:(table)=>globalThis.db(table),rpc:(name,args)=>globalThis.rpc(name,args)}`,
 '@/lib/present-server':`export async function classLesson(id,course){return globalThis.allowed && id==='lesson' && course==='class'?globalThis.lesson:null}`,
 '@/lib/teacher-scope':`export async function getCourseOwnerEmail(){return 'teacher@example.test'}`,
 '@/lib/lesson-targets':`export async function targetIdsForLesson(){return ['lesson-target']}`,
};
async function build(file,name){await esbuild.build({entryPoints:[path.join(repo,file)],bundle:true,platform:'node',format:'cjs',outfile:path.join(out,name),packages:'external',plugins:[{name:'mocks',setup(b){b.onResolve({filter:/.*/},a=>a.path in mocks?{path:a.path,namespace:'mock'}:undefined);b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:mocks[a.path],loader:'js'}))}}]});return require(path.join(out,name))}
const source=await build('src/data/explainers/physics-explainers.ts','data.cjs');
global.lesson={id:'lesson',content_blocks:{schemaVersion:1,blocks:[...source.physicsExplainerBlocks(),{id:'read',type:'reading',chapter:4,sectionIds:['4.3']},{id:'ex',type:'concept_exercise',capture:true,chapter:4,sectionIds:['4.3']}]}};
global.allowed=true;let records=[],queries=[],calls=[],enrolled=true;
global.db=table=>{
 let filters={},inserted;const q={select(columns){assert.ok(!columns.includes('answer_key'));queries.push({table,columns});return q},eq(k,v){filters[k]=v;return q},in(){return q},order(){return q},limit(){return q},range(){return q},insert(v){inserted=v;records.push(v);return q},maybeSingle(){return Promise.resolve(result())},single(){return Promise.resolve(result())},then(ok,bad){return Promise.resolve(result()).then(ok,bad)}};
 function result(){if(inserted)return {data:{...inserted,id:'lobby',code:'TESTS'}};if(table==='concept_exercises')return {data:[{chapter:4,sections:[{id:'4.3',label:'Velocity',pageStart:50,pageEnd:50,items:[{n:1,type:'short_answer',prompt:'What direction is the velocity?'}]},{id:'4.4',items:[{n:1,type:'short_answer',prompt:'Unassigned section'}]}]}]};if(table==='textbook_assignments'){assert.equal(filters.course_id,'class');assert.equal(filters.status,'published');return {data:[{id:'assignment',title:'Reading',chapter:4,reading:'Chapter 4',questions:[{id:'question',reference:'Q1',prompt:'Explain the direction.',target_id:'assigned-target'}]}]}};if(table==='learning_targets')return {data:{id:'resolved-target'}};if(table==='lobby_sessions')return {data:{id:'lobby',status:'open',course_id:'class',lesson_id:'lesson',block_id:null,task_type:'short_response'}};if(table==='course_students')return {data:enrolled?{student_id:'student'}:null};throw new Error(table)}return q;
};
global.rpc=(name,args)=>{calls.push({name,args});return {data:{ok:true,members:4}}};
const catalog=await build('src/app/api/present/textbook-activities/route.ts','catalog.cjs'),create=await build('src/app/api/lobby/sessions/route.ts','create.cjs'),submit=await build('src/app/api/lobby/submit/route.ts','submit.cjs');
const ctx={role:'teacher',email:'teacher@example.test',userId:'teacher'},request=(body)=>new Request('http://test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
let r=await catalog.GET(new Request('http://test?course_id=class&lesson_id=lesson'),ctx);assert.equal(r.status,200);assert.equal(r.body.activities.length,3);assert.ok(!JSON.stringify(r.body).includes('Unassigned'));assert.ok(!JSON.stringify(r.body).includes('answer_key'));
global.allowed=false;queries=[];r=await catalog.GET(new Request('http://test?course_id=class&lesson_id=lesson'),ctx);assert.equal(r.status,403);assert.deepEqual(queries,[]);global.allowed=true;
const base={course_id:'class',lesson_id:'lesson',task_type:'short_response'};
r=await create.POST(request({...base,textbook_activity_id:'exercise:ex:4.3:1',prompt:'FORGED',block_id:'forged',target_id:'forged'}),ctx);assert.equal(r.status,201);let record=records.at(-1);assert.equal(record.block_id,null);assert.match(record.task_prompt,/What direction is the velocity/);assert.ok(!record.task_prompt.includes('FORGED'));assert.equal(record.debrief_meta.source_block_id,'ex');assert.equal(record.debrief_meta.prompt_source,'textbook');
r=await create.POST(request({...base,textbook_activity_id:'assignment:assignment:question',target_id:'forged'}),ctx);assert.equal(r.status,201);assert.equal(records.at(-1).target_id,'assigned-target');
r=await create.POST(request({...base,block_id:'explainer-vectors',explainer_frame:3,prompt:'FORGED'}),ctx);assert.equal(r.status,201);record=records.at(-1);assert.equal(record.block_id,null);assert.equal(record.debrief_meta.explainer_frame,3);assert.ok(record.task_prompt.startsWith(source.physicsExplainerBlocks()[1].teachingTool.frames[3].discussion.prompt));assert.ok(record.debrief_meta.debrief);
for(const invalid of [{textbook_activity_id:'missing'},{block_id:'explainer-vectors',explainer_frame:99},{block_id:'explainer-vectors'},{textbook_activity_id:'reading:read:4.3',explainer_frame:3}]){r=await create.POST(request({...base,...invalid}),ctx);assert.equal(r.status,400,JSON.stringify(invalid))}
r=await submit.POST(request({session_id:'lobby',response:{text:'Our group claims...',built_on:{who_alias:'Peer',note:'Their diagram helped.'}}}),{userId:'student'});assert.equal(r.status,200);assert.equal(calls.at(-1).name,'submit_lobby_group_artifact');assert.equal(calls.at(-1).args.p_block_type,'short_response');enrolled=false;r=await submit.POST(request({session_id:'lobby',response:{text:'No access'}}),{userId:'outsider'});assert.equal(r.status,403);assert.equal(calls.length,1);
console.log('PASS class-scoped textbook catalog, section restriction, no keys, verified question snapshots, correct targets, explainer frame validation, shared group submission and enrollment guard.');
})().catch(e=>{console.error(e);process.exitCode=1});
