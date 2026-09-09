const fs=require('fs'),assert=require('assert/strict'),path=require('path');const root=path.resolve(__dirname,'..');
(async()=>{
 global.mathXpFixture={calls:[],issued:null,missing:false,fail:false,instance:{id:'00000000-0000-0000-0000-000000000003',item:{spiralItemId:'i',competencyId:'c',templateSeed:null},checking:{answer_key:'3',check_mode:'numeric',competency_id:'c',misconceptions:[]}}};
 const mocks={
 'next/server':`export const NextResponse={json:(d,o)=>Response.json(d,o)};`,
 '@/lib/api-auth':`export const withAuth=h=>h;`,
 '@/lib/supabase':`export const supabaseAdmin={from:(table)=>{const q={select(){return this},eq(k,v){if(table==='math_practice_instances'&&k==='user_id')global.mathXpFixture.owner=v;return this},order(){return this},in(){return this},neq(){return this},insert(v){global.mathXpFixture.issued=v;return this},single:async()=>({data:{id:global.mathXpFixture.instance.id}}),maybeSingle:async()=>({data:global.mathXpFixture.missing?null:global.mathXpFixture.instance}),then(resolve){return Promise.resolve({data:table==='math_competencies'?[{id:'c',code:'PR1',statement:'Scale quantities',order_index:1,sequence_order:1}]:table==='math_spiral_items'?[{id:'i',prompt:'1+2?',answer_key:'3',check_mode:'numeric'}]:[]}).then(resolve)}};return q},rpc:async(name,args)=>{global.mathXpFixture.calls.push({name,args});return global.mathXpFixture.fail?{error:{message:'failed'}}:{data:{xpAwarded:1,xpEarned:1}}}};`
 };
 await require(root+'/node_modules/esbuild').build({entryPoints:[root+'/src/app/api/math-spine/practice/route.ts'],outfile:'/private/tmp/math-xp-api.cjs',bundle:true,platform:'node',format:'cjs',plugins:[{name:'fixture',setup(b){b.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js'}))}}]});
 const {GET,POST}=require('/private/tmp/math-xp-api.cjs'),f=global.mathXpFixture,ctx={userId:'student',email:'test@example.invalid',role:'student'},body={instance_id:f.instance.id,answer:'3',template_seed:'tampered',spiral_item_id:'tampered'};
 const call=(b=body,c=ctx)=>POST({json:async()=>b},c);
 assert.equal((await call(body,{...ctx,role:'teacher'})).status,403);assert.equal((await call({answer:'3'})).status,400);f.missing=true;assert.equal((await call()).status,404);f.missing=false;
 const wrong=await (await call({...body,answer:'7'})).json();assert.equal(wrong.result,'mismatch');assert.equal(wrong.xpAwarded,0);assert.equal(f.calls.length,0);
 const correct=await (await call()).json();assert.equal(correct.result,'match');assert.equal(correct.xpEarned,1);assert.equal(f.owner,'student');assert.equal(f.calls[0].args.p_instance,f.instance.id);f.fail=true;assert.equal((await call()).status,503);f.fail=false;
 const issued=await (await GET({},ctx)).json();assert.equal(issued.item.instanceId,f.instance.id);assert.equal(issued.xpAvailable,1);assert(!JSON.stringify(issued).includes('answer_key'));assert.equal(f.issued.user_id,'student');assert.equal(f.issued.checking.answer_key,'3');
 console.log('PASS issued server snapshot, answer-key secrecy, student scoping, invalid/missing instance, no XP on incorrect answer, correct XP, failed award returns retry');
})().catch(e=>{console.error(e);process.exitCode=1});
