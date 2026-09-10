const assert=require('assert/strict'),path=require('path'),{randomUUID}=require('crypto');
(async()=>{const f=await require('./math-missions-fixture.cjs')(path.resolve(__dirname,'..'));const req=(body,user=f.user,role='student')=>new Request('http://fixture/api/math-missions',{method:'POST',headers:{'Content-Type':'application/json','x-test-user':user,'x-test-role':role},body:JSON.stringify(body)});
 let response=await f.route.POST(req({action:'start',id:randomUUID(),mission:'balance-bay',code:'NS1',mode:'practice'}));assert.equal(response.status,400);
 const id=randomUUID(),start={action:'start',id,mission:'balance-bay',code:'SM1',mode:'practice'};response=await f.route.POST(req(start));assert.equal(response.status,200);let data=await response.json();assert(!('expected' in data.session.task));assert.deepEqual(data.session.worked,[]);
 response=await f.route.POST(req(start));assert.equal((await response.json()).session.id,id);assert.equal(f.tables.math_mission_sessions.length,1);
 response=await f.route.POST(req({action:'answer',id,revision:0,answer:{formula:'(v-u)/a'}},f.other));assert.equal(response.status,404);
 response=await f.route.GET(new Request('http://fixture/api/math-missions?id='+id,{headers:{'x-test-user':f.other}}));assert.equal(response.status,404);
 response=await f.route.POST(req({action:'start',id:randomUUID(),mission:'balance-bay',code:'SM1',mode:'retention'}));assert.equal(response.status,409);
 for(let i=0;i<6;i++){let s=f.tables.math_mission_sessions[0],task=f.logic.currentTask(s);response=await f.route.POST(req({action:'answer',id,revision:s.revision,answer:task.expected,score:999999,xp:999999}));assert.equal(response.status,200);s=f.tables.math_mission_sessions[0];if(i===5){f.fail();response=await f.route.POST(req({action:'next',id,revision:s.revision}));assert.equal(response.status,503);assert.equal(s.status,'active');}
 const revision=s.revision;response=await f.route.POST(req({action:'next',id,revision}));assert.equal(response.status,200);const saved=(await response.json()).session;response=await f.route.POST(req({action:'next',id,revision}));assert.deepEqual((await response.json()).session,saved);
 }
 assert.equal(f.grants.length,1);assert.equal(f.grants[0].points,3);
 const c={action:'start',id:randomUUID(),mission:'ratio-reactor',code:'PR1',mode:'challenge'};response=await f.route.POST(req(c));data=await response.json();assert(data.session.ranked);const s=f.tables.math_mission_sessions.at(-1);s.status='completed';response=await f.route.POST(req({...c,id:randomUUID()}));assert.equal((await response.json()).session.ranked,false);
 response=await f.teacher.GET(new Request('http://fixture/api/math-missions/teacher'));assert.equal(response.status,403);
 response=await f.teacher.GET(new Request('http://fixture/api/math-missions/teacher?user_id='+f.other,{headers:{'x-test-role':'teacher'}}));assert.equal(response.status,403);
 response=await f.teacher.POST(req({action:'assign',userId:f.other,mission:'balance-bay',code:'SM1'},f.user,'teacher'));assert.equal(response.status,403);
 response=await f.teacher.POST(req({action:'assign',userId:f.user,mission:'balance-bay',code:'SM1'},f.user,'teacher'));assert.equal(response.status,200);const a=(await response.json()).assignment;
 response=await f.route.POST(req({action:'start',id:randomUUID(),mission:'balance-bay',code:'SM1',mode:'practice',assignmentId:a.id},f.other));assert.equal(response.status,403);
 response=await f.teacher.POST(req({action:'review',id,note:'Your rearrangement is secure. Next, check negative substitution.'},f.user,'teacher'));assert.equal(response.status,200);assert(f.tables.math_mission_sessions[0].review_note);
 console.log('PASS actual routes: invalid skills, no answer-key leak, idempotent start/save, ownership, delayed-check gate, server reward, failed-save retry, daily eligibility, teacher roster scope, assignments and feedback');
})().catch(e=>{console.error(e);process.exitCode=1});
