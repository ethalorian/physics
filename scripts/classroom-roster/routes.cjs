// Actual route and Google pagination with a database boundary double; no live data.
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), assert = require('node:assert/strict'), esbuild = require('esbuild')
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'roster-route-'))
const originalFetch = global.fetch
let calls = [], pages = [], failure = null, ctx, filters = [], existing = { id: 'db-course', teacher_email: 'teacher@example.test' }
const reset = () => { calls=[]; filters=[]; failure=null; ctx={email:'admin@example.test',scopeEmail:'teacher@example.test',role:'teacher'}; pages=[{id:'google-course',name:'Physics'},{students:[{userId:'a',profile:{name:{fullName:'Alex One'}}}],nextPageToken:'next'},{students:[{userId:'b',profile:{name:{fullName:'Blair Two'}}}]}] }
global.__rosterDB={rpc:async (name,args)=>{calls.push({name,args}); assert.equal(pages.length,0,'all Google pages must finish before database writes');return {data:{studentsAdded:1,studentsRemoved:2,studentsTotal:2},error:failure}},from:()=>({select(){return this},eq(){return this},in(k,v){filters.push([k,v]);return this},async single(){return {data:existing,error:null}}})}
const mocks={'@/lib/supabase':'export const supabaseAdmin=global.__rosterDB;', '@/lib/api-auth':'export const withRole=(_roles,fn)=>r=>fn(r,global.__rosterContext());', 'next/server':'export const NextResponse={json:(data,options)=>Response.json(data,options)};'}
global.__rosterContext=()=>ctx
const req = (body={courseId:'google-course',accessToken:'fictional'})=>new Request('http://fixture/api/roster/import',{method:'POST',body:JSON.stringify(body)})
;(async()=>{try{
 await esbuild.build({entryPoints:['src/app/api/roster/import/route.ts'],outfile:path.join(dir,'route.cjs'),bundle:true,platform:'node',plugins:[{name:'mocks',setup(build){build.onResolve({filter:/.*/},a=>mocks[a.path]?{path:a.path,namespace:'fixture'}:undefined);build.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:mocks[a.path],loader:'js'}))}}]})
 const {POST,GET}=require(path.join(dir,'route.cjs'));let count=0
 global.fetch=async()=>{const page=pages.shift(); if(page instanceof Error)throw page; return Response.json(page)}
 async function test(name,fn){reset();await fn();count++;console.log('PASS',name)}
 await test('complete download makes one atomic reconciliation and returns add/remove totals',async()=>{const response=await POST(req());assert.equal(response.status,200);const data=await response.json();assert.equal(data.studentsRemoved,2);assert.equal(data.studentsAdded,1);assert.equal(calls.length,1);assert.equal(calls[0].name,'sync_classroom_roster');assert.equal(calls[0].args.p_students.length,2);assert.equal(calls[0].args.p_teacher_email,'teacher@example.test');assert.equal(calls[0].args.p_is_admin,false)})
 await test('later-page failure never writes to the database',async()=>{pages[2]=new Error('Network');assert.equal((await POST(req())).status,502);assert.equal(calls.length,0)})
 await test('malformed Google page never writes',async()=>{pages[2]={students:null};assert.equal((await POST(req())).status,502);assert.equal(calls.length,0)})
 await test('empty complete roster is sent to reconciliation',async()=>{pages=[pages[0],{}];assert.equal((await POST(req())).status,200);assert.deepEqual(calls[0].args.p_students,[])})
 await test('invalid request never fetches or writes',async()=>{assert.equal((await POST(req({courseId:123}))).status,400);assert.equal(pages.length,3);assert.equal(calls.length,0)})
 await test('retired curriculum is rejected before fetch',async()=>{assert.equal((await POST(req({courseId:'c',accessToken:'t',program:'projects'}))).status,400);assert.equal(calls.length,0)})
 for(const [message,status] of [['ROSTER_FORBIDDEN',403],['ROSTER_STALE',409],['ROSTER_AMBIGUOUS',409],['database failure',500]]) await test(message+' is not reported as successful',async()=>{failure={message,code:'fixture'};const response=await POST(req());assert.equal(response.status,status);assert.equal((await response.json()).success,undefined)})
 await test('roster read uses the effective teacher scope',async()=>{pages=[];assert.equal((await GET(new Request('http://fixture/api/roster/import?course_id=google-course'))).status,200);assert.deepEqual(filters,[['teacher_email',['teacher@example.test']]])})
 console.log(`${count} route checks passed`)
 }finally{global.fetch=originalFetch;fs.rmSync(dir,{recursive:true,force:true})}
})().catch(error=>{console.error(error);process.exitCode=1})
