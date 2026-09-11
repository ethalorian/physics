// Isolated integration tests: actual routes/UI, synthetic database and auth.
const assert = require('node:assert/strict');
const { build } = require('esbuild');
const Module = require('node:module');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const root = process.cwd();
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
let serial = 100, failTable = '';
const me = 'teacher@example.test', other = 'other@example.test', student = id(1), outsider = id(2), course = id(10), foreign = id(11);
const tables = { courses: [{id:course,name:'Physics',section:'A',teacher_email:me},{id:foreign,name:'Other class',teacher_email:other}],
 course_students:[{course_id:course,student_id:student,enrollment_state:'ACTIVE'},{course_id:foreign,student_id:outsider,enrollment_state:'ACTIVE'}],
 students:[{id:student,name:'Alex Student',email:'alex@example.test'},{id:outsider,name:'Other Student',email:'other-student@example.test'}],
 arcade_games:[{slug:'descent',name:'DESCENT',enabled:true},{slug:'push',name:'PUSH',enabled:true}],
 xp_challenges:[],xp_challenge_assignments:[],economy_point_grants:[],arcade_plays:[],vocabulary_game_scores:[],math_spine_point_grants:[] };
class Query {
 constructor(table){this.table=table;this.filters=[];this.operation='select';this.bounds=null;this.singleRow=false;this.orders=[]}
 select(){return this} eq(k,v){this.filters.push(r=>r[k]===v);return this} in(k,v){this.filters.push(r=>v.includes(r[k]));return this}
 gte(k,v){this.filters.push(r=>r[k]>=v);return this} lte(k,v){this.filters.push(r=>r[k]<=v);return this}
 order(k,{ascending=true}={}){this.orders.push([k,ascending]);return this} range(a,b){this.bounds=[a,b];return this}
 maybeSingle(){this.singleRow=true;return this} single(){this.singleRow=true;return this}
 insert(rows){this.operation='insert';this.rows=Array.isArray(rows)?rows:[rows];return this}
 update(patch){this.operation='update';this.patch=patch;return this} delete(){this.operation='delete';return this}
 then(resolve,reject){try{
  if(failTable===this.table){failTable='';return Promise.resolve({data:null,error:{message:'Injected failure'}}).then(resolve,reject)}
  let rows=tables[this.table].filter(r=>this.filters.every(f=>f(r)));
  if(this.operation==='insert'){
   if(this.table==='economy_point_grants'&&this.rows.some(r=>tables[this.table].some(old=>old.dedupe_key===r.dedupe_key)))return Promise.resolve({data:null,error:{code:'23505'}}).then(resolve,reject);
   rows=this.rows.map(r=>({id:id(serial++),created_at:new Date().toISOString(),awarded_at:new Date().toISOString(),period:'daily',...r}));tables[this.table].push(...rows);
  }else if(this.operation==='update')rows.forEach(r=>Object.assign(r,this.patch));
  else if(this.operation==='delete')tables[this.table]=tables[this.table].filter(r=>!rows.includes(r));
  rows=[...rows].sort((a,b)=>{for(const[k,asc]of this.orders){if(a[k]<b[k])return asc?-1:1;if(a[k]>b[k])return asc?1:-1}return 0});
  if(this.bounds)rows=rows.slice(this.bounds[0],this.bounds[1]+1);
  return Promise.resolve({data:this.singleRow?rows[0]??null:rows,error:null}).then(resolve,reject);
 }catch(e){return Promise.reject(e).then(resolve,reject)}}
}
global.__bountyDb={from:t=>new Query(t)};
async function main(){
 const auth=`export const withAuth=fn=>async(req)=>{try{const role=req.headers.get('x-test-role')||'teacher';return await fn(req,{role,realRole:role,email:'alex@example.test',userId:req.headers.get('x-test-user')||'${student}',scopeEmail:'${me}'})}catch{return new Response(JSON.stringify({error:'Request failed'}),{status:500})}}`;
 const bundle=await build({stdin:{contents:`export * as teacher from './src/app/api/teacher/challenges/route';export * as student from './src/app/api/xp-challenges/route';export * from './src/lib/xp-bounty-period';export * from './src/lib/xp-bounty-progress';`,resolveDir:root},bundle:true,write:false,platform:'node',format:'cjs',plugins:[{name:'test-boundaries',setup(b){b.onResolve({filter:/^@\/lib\/(api-auth|supabase)$/},a=>({path:a.path,namespace:'stub'}));b.onLoad({filter:/.*/,namespace:'stub'},a=>({contents:a.path.endsWith('api-auth')?auth:'export const supabaseAdmin=globalThis.__bountyDb;',loader:'js'}));b.onResolve({filter:/^next\/server$/},()=>({path:require.resolve('next/server'),external:true}))}}]});
 const mod=new Module(path.join(root,'test-bounties.cjs'));mod.filename=path.join(root,"test-bounties.cjs");mod.paths=module.paths;mod._compile(bundle.outputFiles[0].text,mod.filename);const api=mod.exports;
 const request=(route,method,body,role='teacher',user=student,url='http://test/api')=>api[route][method](new Request(url,{method,headers:{'Content-Type':'application/json','x-test-role':role,'x-test-user':user},...(body?{body:JSON.stringify(body)}:{})}));
 const today=api.bountyToday(); const starts=api.addBountyDays(today,-7), ends=api.addBountyDays(today,14);
 const payload={title:'Descent practice',kind:'arcade-game',game_slug:'descent',metric:'plays',target:2,bonus_xp:25,period:'weekly',starts_on:starts,ends_on:ends,course_ids:[course]};
 assert.equal(api.validBountyDate('2026-02-30'),false);assert.equal(api.validBountyDate('2028-02-29'),true);
 assert.equal(api.bountyMidnight('2026-03-08'),'2026-03-08T05:00:00.000Z');assert.equal(api.bountyMidnight('2026-03-09'),'2026-03-09T04:00:00.000Z');
 assert.equal(api.bountyMidnight('2026-11-01'),'2026-11-01T04:00:00.000Z');assert.equal(api.bountyMidnight('2026-11-02'),'2026-11-02T05:00:00.000Z');
 assert.equal(api.bountyWindow({period:'monthly',starts_on:'2028-01-15',ends_on:'2028-03-04'},'2028-02-15').end,'2028-02-29');
 const week={period:'weekly',starts_on:'2026-09-11',ends_on:'2026-09-23'};
 assert.equal(api.bountyWindow(week,'2026-09-12').key,'2026-09-11');assert.equal(api.bountyWindow(week,'2026-09-14').key,'2026-09-14');assert.equal(api.bountyWindow(week,'2026-09-25').end,'2026-09-23');
 assert.equal(api.bountyWindow({...week,period:'custom'},'2026-09-22').key,'2026-09-11');
 for(const role of ['teacher','admin']){
  assert.equal((await request('teacher','POST',{...payload,course_ids:[foreign]},role)).status,403);
  assert.equal((await request('teacher','POST',{...payload,is_global:true},role)).status,403);
  assert.equal((await request('teacher','POST',{...payload,course_ids:[],student_ids:[outsider]},role)).status,403);
 }
 assert.equal((await request('teacher','POST',payload,'student')).status,403);
 for(const patch of [{period:'yearly'},{starts_on:'2026-02-30'},{target:1.5},{game_slug:'missing'},{title:42},{student_ids:[42]}])assert.equal((await request('teacher','POST',{...payload,...patch})).status,400);
 assert.equal((await request('teacher','POST',payload)).status,201);const c=tables.xp_challenges[0];
 assert.equal(c.teacher_email,me);assert.equal(c.is_global,false);assert.equal(c.active,true);
 tables.xp_challenges.push({...c,id:id(900),teacher_email:other});
 assert.equal((await request('teacher','PUT',{id:id(900),active:false})).status,404);
 assert.equal((await request('teacher','DELETE',null,'teacher',student,`http://test/api?id=${id(900)}`)).status,404);
 const own=await(await request('teacher','GET')).json();assert.equal(own.challenges.length,1);assert.equal(own.students.length,1);
 assert.equal((await(await request('student','GET',null,'student',outsider)).json()).challenges.length,0);
 const window=api.bountyWindow(c);const stamp=new Date(Math.max(Date.parse(window.startIso),Date.now()-60000)).toISOString();
 tables.arcade_plays.push({id:id(200),user_id:student,game_slug:'descent',status:'active',created_at:stamp,finished_at:null,meta:null});
 let result=await(await request('student','GET',null,'student')).json();assert.equal(result.challenges[0].progress,0,'opening run does not count');
 for(let i=0;i<2;i++)tables.arcade_plays.push({id:id(201+i),user_id:student,game_slug:'descent',status:'finished',finished_at:stamp,meta:null});
 await Promise.all([request('student','GET',null,'student'),request('student','GET',null,'student')]);assert.equal(tables.economy_point_grants.length,1,'concurrent reward dedupe');
 await request('student','GET',null,'student');assert.equal(tables.economy_point_grants.length,1,'refresh dedupe');
 result=await(await request('teacher','GET')).json();assert.equal(result.challenges[0].completedPeriod,1);assert.equal(result.challenges[0].recipientCount,1);
 await request('teacher','PUT',{id:c.id,active:false});assert.equal((await(await request('student','GET',null,'student')).json()).challenges.length,0);c.active=true;
 assert.equal((await(await request('student','GET',null,'admin')).json()).challenges.length,0);
 assert.equal((await request('teacher','POST',{...payload,kind:'vocab-games',game_slug:'matching',metric:'xp',period:'monthly',student_ids:[student],course_ids:[]})).status,201);
 tables.vocabulary_game_scores.push({id:id(300),user_id:student,game_type:'hangman',score:200,completed_at:stamp},{id:id(301),user_id:student,game_type:'matching',score:100,completed_at:stamp});
 result=await(await request('student','GET',null,'student')).json();assert.equal(result.challenges.find(ch=>ch.kind==='vocab-games').progress,10);
 failTable='xp_challenge_assignments';assert.equal((await request('teacher','POST',payload)).status,500);assert.equal(tables.xp_challenges.filter(ch=>ch.teacher_email===me).length,2,'failed creation cleaned up');
 for(let i=0;i<1002;i++)tables.arcade_plays.push({id:id(10000+i),user_id:student,game_slug:'push',status:'finished',finished_at:stamp,meta:null});
 assert.equal((await request('teacher','POST',{...payload,game_slug:'push',target:1000,period:'custom'})).status,201);
 result=await(await request('student','GET',null,'student')).json();assert.equal(result.challenges.find(ch=>ch.gameSlug==='push').progress,1002,'pagination beyond Supabase row cap');
 tables.course_students.find(e=>e.student_id===student).enrollment_state='INACTIVE';assert.equal((await(await request('student','GET',null,'student')).json()).challenges.length,0);tables.course_students[0].enrollment_state='ACTIVE';
 console.log('PASS: calendar/DST, invalid payloads, teacher/admin isolation, individual assignments, completed runs, concurrent dedupe, period counts, pause, vocab filtering, failure cleanup, pagination, and inactive enrollment.');
 if(!process.argv.includes('--serve'))return;
 // Synthetic UI fixture, using the real page and API handlers.
 c.title='Three runs of Descent';tables.xp_challenges=tables.xp_challenges.filter(ch=>ch.teacher_email===me);
 const ui=await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import Page from './src/app/admin/challenges/page';import Card from './src/components/gamification/ChallengeCard';const native=window.fetch;window.fetch=(u,o={})=>native(u,{...o,headers:{...o.headers,'x-test-role':location.pathname==='/student'?'student':'teacher'}});createRoot(document.getElementById('root')).render(location.pathname==='/student'?<Card/>:<Page/>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,outdir:'/virtual',platform:'browser',format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'links',setup(b){b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'stub'}));b.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:`import React from 'react';export default function Link(p){return React.createElement('a',p)}`,loader:'js',resolveDir:root}))}}]});
 const js=ui.outputFiles.find(f=>f.path.endsWith('.js')).text, css=ui.outputFiles.find(f=>f.path.endsWith('.css')).text;
 const base=`:root{--background:#f8f8fc;--card:#fff;--foreground:#242435;--muted-foreground:#717182;--primary:#5850a4;--primary-foreground:white;--border:#dddce8;--secondary:#f0eff7;--success:#228268;--destructive:#b83040;--reward:#ba8221}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;background:var(--background)}input,button,select{font:inherit}input{height:44px;border:1px solid var(--border);border-radius:10px;padding:8px 12px;background:var(--background);width:100%}input[type=checkbox]{width:16px;height:16px}button[data-slot=button]{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1px solid var(--border);border-radius:10px;padding:11px 16px;background:var(--primary);color:white;cursor:pointer}button:disabled{opacity:.45}button svg{width:16px;height:16px}dd{margin:0}`;
 http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://127.0.0.1:3112');if(url.pathname==='/ui.js'){res.setHeader('Content-Type','text/javascript');res.end(js);return}if(url.pathname==='/style.css'){res.setHeader('Content-Type','text/css');res.end(base+css);return}if(url.pathname.startsWith('/api/')){let body='';for await(const chunk of req)body+=chunk;const route=url.pathname.includes('/teacher/')?'teacher':'student';const r=await api[route][req.method](new Request(url,{method:req.method,headers:req.headers,...(body?{body}:{})}));res.writeHead(r.status,{'Content-Type':'application/json'});res.end(await r.text());return}res.setHeader('Content-Type','text/html');res.end('<html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>XP Bounty Preview</title><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/ui.js"></script></body></html>')}catch(e){res.writeHead(500);res.end(e.message)}}).listen(3112,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:3112/teacher'));
}
main().catch(e=>{console.error(e);process.exitCode=1});
