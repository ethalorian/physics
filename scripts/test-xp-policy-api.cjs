const assert=require('node:assert/strict'),path=require('node:path');const root=path.resolve(__dirname,'..');
(async()=>{
 global.xpPolicyTest={writes:[],owner:'teacher@test.invalid',fail:false,calls:[]};
 const mocks={
 'next/server':`export const NextResponse={json:(d,o)=>Response.json(d,o)};`,
 '@/lib/api-auth':`export const withAuth=h=>h;`,
 '@/lib/identity-aliases':`export const ownerEmailsFor=e=>[e];`,
 '@/lib/supabase':`export const supabaseAdmin={from(table){const f=global.xpPolicyTest;let write;return {select(){return this},eq(){return this},in(k,v){f.scope=v;return this},is(){return this},order(){return this},update(v){write=v;return this},maybeSingle:async()=>({data:table==='courses'?{teacher_email:f.owner}:{course_id:'course'}}),then(resolve){if(write)f.writes.push(write);return Promise.resolve({data:table==='courses'?[{id:'course'}]:[],error:f.fail?{message:'Term dates overlap another term'}:null}).then(resolve)}}},rpc:async(name,args)=>{global.xpPolicyTest.calls.push({name,args});return global.xpPolicyTest.fail?{error:{message:'failed'}}:{data:name==='unit_xp_report'?{track:'cpa',unitTarget:700,units:[]}:{minimum_xp:1400,earned:620}}}};`
 };
 const bundle=async(file,out)=>{await require('esbuild').build({entryPoints:[root+file],outfile:'/private/tmp/'+out,bundle:true,platform:'node',format:'cjs',plugins:[{name:'fixture',setup(b){b.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js'}))}}]});return require('/private/tmp/'+out)};
 const teacher=await bundle('/src/app/api/teacher/xp-terms/route.ts','xp-terms-api.cjs');const student=await bundle('/src/app/api/xp-policy/route.ts','xp-policy-api.cjs');
 const f=global.xpPolicyTest,ctx={userId:'student-id',scopeEmail:'teacher@test.invalid',role:'teacher'},body={id:'term',label:'Term 1',starts_at:'2026-08-31T04:00:00Z',ends_at:'2026-11-07T05:00:00Z',minimum_xp:1400,grade_points:5};
 const patch=(b=body,c=ctx)=>teacher.PATCH({json:async()=>b},c);
 assert.equal((await patch(body,{...ctx,role:'student'})).status,403);
 assert.equal((await patch({...body,minimum_xp:0})).status,400);
 assert.equal((await patch({...body,ends_at:body.starts_at})).status,400);
 f.owner='other@test.invalid';assert.equal((await patch()).status,403);assert.equal(f.writes.length,0);f.owner=ctx.scopeEmail;
 assert.equal((await patch()).status,200);assert.equal(f.writes.length,1);assert.equal(f.writes[0].minimum_xp,1400);
 f.fail=true;assert.equal((await patch()).status,409);f.fail=false;
 await teacher.GET({},ctx);assert.deepEqual(f.scope,['course']);
 const report=await student.GET({},ctx);assert.equal(report.status,200);assert(f.calls.every(c=>c.args.p_user==='student-id'));assert.equal((await report.json()).term.earned,620);
 f.fail=true;assert.equal((await student.GET({},ctx)).status,503);
 console.log('PASS course ownership, student write refusal, date/minimum validation, overlap feedback, publication, self-only XP reads, failed reads never report zero.');
})().catch(e=>{console.error(e);process.exitCode=1});
