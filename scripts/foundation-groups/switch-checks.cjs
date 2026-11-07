// Fictional students exercise the actual route, classroom authorization and submission trigger.
const assert=require('node:assert/strict'),{randomUUID}=require('node:crypto')
module.exports=async({api,sql,q,rows,call,student,teacher,foundationLesson,room,ok})=>{
 const r=await room(0),[a,b,c,d,e]=r.users
 async function post(body,status=200){const res=await call('partnerPost',r.assignment,body);assert.equal(res.status,status,await res.clone().text());return res.json()}
 async function act(user,action,text='',checkpoint,status=200,code){student(user);return post({action,text,checkpoint,code},status)}
 async function decide(user,req,action='approveSwitch',status=200){teacher();return post({action,userId:user,requestId:req},status)}
 await act(a,'create');const old=(await r.view(a)).code
 await act(b,'join',old);await act(a,'start')
 await act(c,'create');const dest=(await r.view(c)).code
 await act(d,'join',dest);await act(c,'start')
 const drafts=rows('interactive_assignment_work').filter(w=>w.assignment_id===r.assignment)
 await act(a,'requestSwitch',old,undefined,422,old)
 await act(a,'requestSwitch','0000000000',undefined,422,old)
 const other=await room(0);await other.action(other.users[0],'create')
 await act(a,'requestSwitch',(await other.view(other.users[0])).code,undefined,422,old)
 await act(a,'requestSwitch',dest,undefined,200,old)
 const canceled=(await r.view(a)).tableSwitch.id
 student(a);await post({action:'approveSwitch',userId:a,requestId:canceled},403)
 await act(b,'cancelSwitch',canceled,undefined,422)
 await act(a,'cancelSwitch',canceled)
 await act(a,'requestSwitch',dest,undefined,200,old)
 const declined=(await r.view(a)).tableSwitch.id
 await decide(a,canceled,'approveSwitch',422);await decide(a,declined,'declineSwitch')
 assert.equal((await r.view(a)).code,old)
 await act(a,'requestSwitch',dest,undefined,200,old)
 const req=(await r.view(a)).tableSwitch.id
 teacher();global.dayOneContext.scopeEmail='other@example.test';await post({action:'approveSwitch',userId:a,requestId:req},404);global.dayOneContext.scopeEmail='teacher@example.test'
 teacher();global.dayOneContext.viewingAsTeacher=true;await post({action:'approveSwitch',userId:a,requestId:req},403);global.dayOneContext.viewingAsTeacher=false
 ok('Switch requests are scoped to one class, student and teacher; cancel, denial and stale decisions do not move anyone')
 const idea='My original measured position at the first table.'
 await act(a,'share',idea,'evidence')
 await act(b,'share','My classmate measured a different position.','evidence')
 const key=(await r.view(a)).checkpoints[0].peers[0].ideaKey
 await act(a,'compare',key,'evidence');await act(a,'reply','The two readings were taken at different times.','evidence')
 await act(e,'join',dest)
 assert.equal((await decide(a,req)).status,'reserved')
 assert.equal((await r.view(a)).code,old);assert.equal((await r.view(a)).tableSwitch.status,'reserved')
 assert.equal((await decide(a,req)).status,'reserved')
 // The fourth seat is held, even if a different student tries to join in the meantime.
 sql('insert into course_students(course_id,student_id,enrollment_state) values('+q(r.c)+','+q(other.users[0])+",'ACTIVE')")
 await act(other.users[0],'join',dest,undefined,422)
 await act(a,'reflect','PRIVATE original table reflection uses both readings.','evidence',200,old)
 const moved=await r.view(a);assert.equal(moved.code,dest);assert.equal(moved.tableSwitch.status,'moved');assert.equal(moved.checkpoints[0].previousTable,true)
 assert.equal(moved.checkpoints[0].own.contribution,idea);assert(moved.checkpoints[1].available)
 assert.deepEqual(rows('interactive_assignment_work').filter(w=>w.assignment_id===r.assignment),drafts)
 assert.equal((await decide(a,req)).status,'moved')
 assert(!(await r.view(b)).members.some(m=>m.name==='Student 1'))
 assert(!(JSON.stringify(await r.view(b))).includes('PRIVATE'))
 assert(!(JSON.stringify(await r.view(c))).includes(idea))
 await act(c,'share','A different table shared a different observation.','evidence')
 assert(!(JSON.stringify(await r.view(c))).includes(idea))
 await act(b,'compare',(await r.view(b)).checkpoints[0].peers.find(p=>p.contribution===idea).ideaKey,'evidence')
 await act(a,'share','Do not misfile this stale draft.','model',422,old)
 await act(a,'share','Do not redo an earlier stop.','evidence',422,dest)
 ok('Approval reserves the last seat; saving a reflection moves the student, preserves individual drafts and keeps both tables’ evidence separate')
 for(const step of ['model','questions']){
  await act(a,'share','My own new-table claim at '+step+'.',step,200,dest)
  sql("update foundation_checkpoint_responses set contributed_at=now()-interval '2 minutes' where assignment_id="+q(r.assignment)+" and user_id="+q(a)+" and checkpoint="+q(step))
  await act(a,'compare','example',step,200,dest)
  await act(a,'reply','The provided example misses a measurement.',step,200,dest)
  await act(a,'reflect','My private reflection uses that measurement.',step,200,dest)
 }
 student(a);const res=await call('lessonSave',r.assignment,{version:r.work.version,state:r.draft,submitId:randomUUID()})
 assert.equal(res.status,200,await res.clone().text())
 const snapshot=rows('interactive_assignment_submissions').find(s=>s.user_id===a&&s.assignment_id===r.assignment)
 assert(snapshot);const stops=snapshot.state.partner_exchange.checkpoints
 assert.equal(stops.length,3);assert.notEqual(stops[0].source_pair_id,stops[1].source_pair_id)
 assert.equal(stops[0].own.contribution,idea);assert.equal(stops[0].peers[0].contribution,'My classmate measured a different position.')
 assert(!('reflection' in stops[0].peers[0]));assert.equal(stops[0].peers[0].slot,2)
 assert.equal(api.foundationExchangeEvidence(snapshot.state).checkpoints[0].previousTable,true)
 ok('A student can submit all three stops across two tables; the submission keeps the original peer source and only the author’s private reflections')
 // A fresh student at a started table moves immediately before posting anything.
 await act(b,'requestSwitch',dest,undefined,422,old) // Full, including the mover.
 await act(e,'requestSwitch',old,undefined,200,dest)
 const fresh=(await r.view(e)).tableSwitch.id;assert.equal((await decide(e,fresh)).status,'moved')
 assert.equal((await r.view(e)).code,old);assert.equal((await r.view(e)).slot,1)
 await act(e,'share','The replacement seat writes a different idea.','evidence',200,old)
 const bstop=(await r.view(b)).checkpoints[0]
 assert.equal(bstop.peers.filter(p=>p.slot===1).length,2)
 assert.equal(bstop.peers.find(p=>p.ideaKey===bstop.chosenIdeaKey).contribution,idea)
 await act(b,'compare','1','evidence',422,old) // An older browser cannot mistake a reused slot for a person.
 assert.equal(sql("select has_table_privilege('authenticated','foundation_table_switches','SELECT') or has_function_privilege('anon','foundation_table_switch_action(uuid,uuid,text,text,uuid,text,text)','EXECUTE')"),'f')
 ok('A switch before the first idea is immediate; a replacement in the same seat cannot change whose idea a classmate chose')
 // A table with one student may still be forming. A student who completed a
 // stop elsewhere may not abandon that history through the setup-only exit.
 const t=await room(0),[x,y,z]=t.users
 await t.action(x,'create');const from=(await t.view(x)).code
 await t.action(y,'join',from);await t.action(x,'start');await t.action(z,'create');const to=(await t.view(z)).code
 for(const u of [x,y])await t.action(u,'share','We measured two different positions.','evidence')
 await t.action(x,'compare','2','evidence');await t.action(x,'reply','The second reading supports a change in position.','evidence')
 await t.action(x,'reflect','I kept my original account of the measurements.','evidence')
 async function move(fromCode,toCode){
  student(x);let res=await call('partnerPost',t.assignment,{action:'requestSwitch',code:fromCode,text:toCode});assert.equal(res.status,200,await res.clone().text())
  const id=(await t.view(x)).tableSwitch.id;teacher();res=await call('partnerPost',t.assignment,{action:'approveSwitch',userId:x,requestId:id});assert.equal(res.status,200,await res.clone().text())
 }
 await move(from,to);assert.equal((await t.view(x)).started,false)
 assert.equal((await t.action(x,'leave',to)).status,422)
 await move(to,from);assert((await t.view(x)).checkpoints[0].complete)
 ok('A student joining a forming table keeps finished work and can request another approved move without losing it')

}
