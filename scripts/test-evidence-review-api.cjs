const assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
(async()=>{
 global.reviewApiFixture={allowed:true,prior:null,calls:[],work:{work:[{evidenceKey:'a',blockId:'q',submissionId:'00000000-0000-0000-0000-000000000005',lessonId:'lesson',blockType:'question',prompt:'Why?',response:{text:'Because'},createdAt:'2026-09-09',targetLinked:true},{evidenceKey:'b',blockId:'exit',submissionId:'00000000-0000-0000-0000-000000000005',lessonId:'lesson',blockType:'exit_ticket',prompt:'Explain',response:{text:'Evidence'},createdAt:'2026-09-09',targetLinked:true}],targets:[{id:'target'}]}};
 const mocks={
  'next/server':`export class NextRequest extends Request{};export const NextResponse={json:(d,o)=>Response.json(d,o)};`,
  '@/lib/api-auth':`export const withAuth=h=>h;`,
  '@/lib/teacher-scope':`export const teacherCanAccessStudent=async()=>global.reviewApiFixture.allowed;`,
  '@/lib/mastery-student-work':`export const getMasteryStudentWork=async()=>Response.json(global.reviewApiFixture.work);`,
  '@/lib/lesson-targets':`export const targetIdsForLesson=async()=>['target'];`,
  '@/lib/supabase':`export const supabaseAdmin={from:()=>({select(){return this},eq(){return this},async maybeSingle(){return {data:global.reviewApiFixture.prior,error:null}}}),rpc:async(name,args)=>{global.reviewApiFixture.calls.push({name,args});return {data:{id:args.p_id,level:3,mean:2.5},error:null}}};`,
 };
 await require(root+'/node_modules/esbuild').build({entryPoints:[root+'/src/app/api/mastery/evidence-review/route.ts'],outfile:'/private/tmp/evidence-review-api-test.cjs',bundle:true,platform:'node',format:'cjs',plugins:[{name:'api-fixture',setup(b){b.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js'}))}}]});
 const {POST}=require('/private/tmp/evidence-review-api-test.cjs'),fixture=global.reviewApiFixture;
 const body={userId:'student',unitId:'unit',targetId:'target',lessonId:'lesson',requestId:'00000000-0000-0000-0000-000000000010',message:'Explain the diagram.',decisions:[{key:'a',level:2},{key:'b',level:3}],level:1};
 const call=(value=body,role='teacher')=>POST({url:'http://local/api/mastery/evidence-review',json:async()=>value},{role,userId:'teacher',scopeEmail:'teacher@test'});
 assert.equal((await call(body,'student')).status,403);fixture.allowed=false;assert.equal((await call()).status,403);fixture.allowed=true;
 assert.equal((await call({...body,decisions:[{key:'a',level:3}]})).status,422);
 assert.equal((await call({...body,decisions:[{key:'a',level:3},{key:'a',level:3}]})).status,422);
 assert.equal((await call({...body,decisions:[{key:'a',level:3},{key:'stale',level:3}]})).status,422);
 assert.equal(fixture.calls.length,0);
 assert.equal((await call()).status,201);assert.equal(fixture.calls.length,1);assert.match(fixture.calls[0].args.p_message,/Overall rating: 3/);assert.match(fixture.calls[0].args.p_message,/2.50/);assert.equal(fixture.calls[0].args.p_evidence[0].prompt,'Why?');assert.equal(fixture.calls[0].args.p_reviewer,'teacher@test');
 fixture.prior={id:body.requestId,user_id:'student',target_id:'target',lesson_id:'lesson',reviewer_email:'teacher@test',overall_level:3,mean:2.5};assert.equal((await call()).status,200);assert.equal(fixture.calls.length,1);
 fixture.prior.user_id='other';assert.equal((await call()).status,409);
 console.log('PASS: role + roster authorization, complete evidence validation, stale/duplicate rejection, server calculation, authored snapshot, and scoped retry');
})().catch(e=>{console.error(e);process.exitCode=1});
