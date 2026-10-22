// Actual upload/download handlers and ownership validator; no live data or storage.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out='/private/tmp/reflection-api.cjs';
const lesson='11111111-1111-4111-8111-111111111111',user='22222222-2222-4222-8222-222222222222';
const block={id:'product',type:'sketch',capture:true,submission:'upload'};
const f=global.reflectionFixture={ctx:{userId:user,role:'student',realRole:'student',email:'student@example.test'},files:[],stored:new Map(),allow:true,roster:true,locked:false,block};
(async()=>{
 const mocks={
  'server-only':'',
  '@/lib/api-auth':`export const withAuth=fn=>req=>fn(req,global.reflectionFixture.ctx);export const withEnrolledStudent=withAuth;`,
  '@/lib/lesson-access':`export const authorizeLesson=async(ctx,id,write)=>{const f=global.reflectionFixture;return !f.allow||write&&(f.locked||ctx.role!=='student')?{ok:false,response:Response.json({error:'Unavailable'},{status:403})}:{ok:true,viewer:{role:ctx.role==='student'?'student':'admin'},document:{blocks:[f.block]}}};`,
  '@/lib/teacher-scope':`export const resolveTargetStudent=async({role,selfId,requestedUserId})=>role==='student'?{ok:true,userId:selfId}:global.reflectionFixture.roster?{ok:true,userId:requestedUserId}:{ok:false};`,
  '@/lib/supabase':`export const supabaseAdmin={storage:{from:()=>({upload:async(path,bytes)=>{global.reflectionFixture.stored.set(path,bytes);return {error:null}},download:async path=>({data:new Blob([global.reflectionFixture.stored.get(path)]),error:null}),remove:async paths=>{paths.forEach(p=>global.reflectionFixture.stored.delete(p));return {error:null}}})},from:()=>{const where={};const q={select:()=>q,eq:(k,v)=>{where[k]=v;return q},match:v=>{Object.assign(where,v);return q},maybeSingle:async()=>({data:global.reflectionFixture.files.find(f=>Object.entries(where).every(([k,v])=>f[k]===v))??null,error:null}),insert:async value=>{global.reflectionFixture.files.push(value);return {error:null}}};return q}};`
 };
 await require(root+'/node_modules/esbuild').build({stdin:{contents:`export {GET,POST} from './src/app/api/lessons/artifacts/route';export {ownsLessonArtifact} from './src/lib/lesson-artifacts-server';`,resolveDir:root},bundle:true,platform:'node',format:'cjs',outfile:out,plugins:[{name:'fixtures',setup(b){b.onResolve({filter:/.*/},a=>Object.hasOwn(mocks,a.path)?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js'}))}}]});
 const api=require(out),post=(bytes=Buffer.from('%PDF-1.7\nfixture'),account=user)=>{const data=new FormData();data.set('lesson_id',lesson);data.set('block_id','product');data.set('expected_user_id',account);data.set('file',new File([bytes],'My manga.pdf',{type:'application/pdf'}));return api.POST(new Request('http://localhost/api/lessons/artifacts',{method:'POST',body:data}))};
 assert.equal((await post(Buffer.from('<html>disguised</html>'))).status,415);
 assert.equal((await post(Buffer.alloc(4000001))).status,413);
 assert.equal((await post(undefined,'other')).status,409);
 f.locked=true;assert.equal((await post()).status,403);f.locked=false;
 const uploaded=await post();assert.equal(uploaded.status,201);const receipt=await uploaded.json();assert.equal(f.files.length,1);assert(!Object.hasOwn(receipt,'path'));
 assert.equal(await api.ownsLessonArtifact(block,{attachmentId:receipt.id},lesson,user),true);
 assert.equal(await api.ownsLessonArtifact(block,{attachmentId:receipt.id},lesson,'other'),false);
 assert.equal(await api.ownsLessonArtifact({...block,id:'another'},{attachmentId:receipt.id},lesson,user),false);
 const get=()=>api.GET(new Request('http://localhost/api/lessons/artifacts?id='+receipt.id));
 let r=await get();assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'private, no-store');assert.match(r.headers.get('content-disposition'),/^attachment;/);assert.match(await r.text(),/%PDF/);
 f.ctx.userId='another-student';assert.equal((await get()).status,404);f.ctx.userId=user;
 f.ctx.role=f.ctx.realRole='teacher';f.roster=false;assert.equal((await get()).status,404);f.roster=true;assert.equal((await get()).status,200);assert.equal((await post()).status,403);
 f.allow=false;assert.equal((await get()).status,403);
 console.log('PASS: upload file checks, size/account limits, submission locks, private download, own-student/roster scope, and file ownership in responses.');
})().catch(e=>{console.error(e);process.exitCode=1});
