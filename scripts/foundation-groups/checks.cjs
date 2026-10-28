// Actual API handlers + disposable PostgreSQL. No production writes or model calls.
const assert=require('node:assert/strict'),{randomUUID}=require('crypto'),{spawn}=require('child_process');
module.exports=async({api,sql,q,json,id,rows,call,student,teacher,course,foundationLesson,reviewLesson,answers,ok,out,root})=>{
 const db=sql('select current_database()');
 const protectedBefore=JSON.stringify(rows('interactive_assignment_submissions'));
 const gradesBefore=JSON.stringify([rows('interactive_assignment_reviews'),rows('mastery_records'),rows('simulation_lab_grades'),rows('quiz_reviews')]);
 let fixtureNumber=200;const completed=[];
 async function room(size){
  const c=id(fixtureNumber++),users=Array.from({length:5},()=>id(fixtureNumber++)),target=id(fixtureNumber++);
  sql(`insert into courses values(${q(c)},'Group fixture','CPA','physics','cpa','teacher@example.test',null);
   insert into students(id,name,email) values ${users.map((u,i)=>`(${q(u)},'Student ${i+1}',${q('fixture-'+u+'@example.test')})`)};
   insert into course_students(course_id,student_id,enrollment_state) values ${users.map(u=>`(${q(c)},${q(u)},'ACTIVE')`)};
   insert into student_avatars values ${users.map((u,i)=>`(${q(u)},${json({hair_style:['short','curls','ponytail','fade','short'][i],skin:['light','brown','olive','deep','light'][i]})},'{}')`)};`);
  teacher();const scheduled=await api.schedule(new Request('http://fixture/api',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({slug:foundationLesson.slug,course_id:c,due_on:'2026-11-02',action:'calendar'})}));
  assert.equal(scheduled.status,200,await scheduled.clone().text());
  const sequence=rows('daily_lesson_sequences').find(s=>s.course_id===c),assignment=sequence.foundation_id;
  const action=(u,action,text='',checkpoint)=>{student(u);return call('partnerPost',assignment,{action,text,checkpoint})};
  const view=async u=>{student(u);const r=await call('partnerGet',assignment);assert.equal(r.status,200);return (await r.json()).pair};
  student(users[0]);const draft=answers(foundationLesson);draft.answers[foundationLesson.questions.find(q=>q.answer===undefined&&!q.options).id]='Existing individual reasoning before forming a group.';
  const draftSave=await call('lessonSave',assignment,{version:0,state:draft});assert.equal(draftSave.status,200,await draftSave.clone().text());
  const work=rows('interactive_assignment_work').find(w=>w.assignment_id===assignment&&w.user_id===users[0]);
  if(!size)return {c,users,sequence,assignment,action,view,work,draft};
  assert.equal((await action(users[0],'create')).status,200);assert.equal((await action(users[0],'create')).status,200);
  const code=(await view(users[0])).code;
  assert.equal((await action(users[0],'start')).status,422);
  for(let i=1;i<size;i++)assert.equal((await action(users[i],'join',code.toLowerCase())).status,200);
  assert.equal((await action(users[0],'share','Do not bypass starting the room.','evidence')).status,422);
  assert.equal((await action(users[0],'start')).status,200);assert.equal((await action(users[0],'start')).status,200);
  assert.equal((await action(users[size],'join',code)).status,422);
  assert.equal((await view(users[0])).members.length,size);
  assert.deepEqual(rows('interactive_assignment_work').find(w=>w.assignment_id===assignment&&w.user_id===users[0]),work);
  return {c,users,sequence,assignment,action,view,code,work,draft};
 }
 for(const size of [2,3,4]){
  const r=await room(size),members=r.users.slice(0,size);
  for(const [index,stop] of ['evidence','model','questions'].entries()){
   for(const [i,u] of members.entries()){
    const idea=`Student ${i+1} ${stop} original reasoning using the lesson's numerical evidence.`;
    assert.equal((await r.action(u,'share',idea,stop)).status,200);
    assert.equal((await r.action(u,'share',idea,stop)).status,200);
    if(i<size-1){const hidden=await r.view(u);assert.deepEqual(hidden.checkpoints[index].peers,[]);assert.equal((await r.action(u,'reply','A premature response should not reveal peers.',stop)).status,422);}
   }
   for(const [i,u] of members.entries()){
    const visible=await r.view(u);assert.equal(visible.checkpoints[index].peers.length,size-1);
    assert.equal(visible.checkpoints[index].replyToSlot,(i+1)%size+1);
    assert.equal((await r.action(u,'reply',`Student ${i+1} response to their designated classmate, with specific evidence.`,stop)).status,200);
    if(i<size-1)assert.equal((await r.action(u,'reflect','This reflection is too early for the discussion.',stop)).status,422);
   }
   for(const [i,u] of members.entries()){
    const reflection=`PRIVATE student ${i+1} ${stop} revised reasoning after discussing evidence.`;
    assert.equal((await r.action(u,'reflect',reflection,stop)).status,200);
    assert.equal((await r.action(u,'reflect','Cannot overwrite the saved reflection.',stop)).status,422);
    const another=await r.view(members[(i+1)%size]);assert(!JSON.stringify(another).includes(reflection));assert(!JSON.stringify(another.checkpoints[index].peers).includes('reflection'));
   }
  }
  const forged={...r.draft,partner_exchange:{mode:'group',peers:[{contribution:'FORGED'}]}};
  student(members[0]);const submitId=randomUUID();
  const response=await call('lessonSave',r.assignment,{version:1,state:forged,submitId});assert.equal(response.status,200,await response.clone().text());
  assert.equal((await call('lessonSave',r.assignment,{version:1,state:forged,submitId})).status,200);
  const saved=rows('interactive_assignment_submissions').find(s=>s.id===submitId),snapshot=JSON.stringify(saved);
  assert.equal(saved.state.answers[foundationLesson.questions.find(q=>q.answer===undefined&&!q.options).id],r.draft.answers[foundationLesson.questions.find(q=>q.answer===undefined&&!q.options).id]);
  assert.equal(saved.state.partner_exchange.version,3);assert.equal(saved.state.partner_exchange.checkpoints.length,3);
  assert(!snapshot.includes('FORGED'));assert(!snapshot.includes('PRIVATE student 2'));
  const evidence=api.foundationExchangeEvidence(saved.state,foundationLesson.foundation);assert.equal(evidence.mode,'group');assert.equal(evidence.checkpoints[0].peers.length,size-1);
  assert(!JSON.stringify(evidence).includes(members[0]));assert(!JSON.stringify(evidence).includes(members[1]));
  assert.equal(evidence.checkpoints[0].replyToSlot,2);
  const individualProgress=await(await api.progress(new Request('http://fixture/api/student-progress?class='+r.c))).json();
  assert(individualProgress.rows.some(row=>row.href==='/interactive-assignments/'+r.assignment));
  assert.equal((await call('lessonGet',r.sequence.review_id)).status,200);
  student(members[1]);assert.equal((await call('lessonGet',r.sequence.review_id)).status,403);
  assert.equal((await call('quizGet',r.sequence.quiz_id)).status,404);
  assert.equal(rows('interactive_assignment_submissions').filter(s=>s.assignment_id===r.assignment).length,1);
  assert.equal(JSON.stringify(rows('interactive_assignment_submissions').find(s=>s.id===submitId)),snapshot);
  completed.push({...r,submissionId:submitId,snapshot});
  ok(`${size}-student group completes ordered blind discussions with individual drafts, immutable snapshots, private reflections and student-specific review/quiz access`);
 }
 const r=await room(3),[a,b,c]=r.users;
 assert.equal((await r.action(c,'share','Saved third-student idea before requesting independent work.','evidence')).status,200);
 const oldWriting=rows('foundation_checkpoint_responses').find(w=>w.assignment_id===r.assignment&&w.user_id===c);
 assert.equal((await r.action(c,'makeup')).status,200);assert.equal((await r.view(c)).approved,false);
 assert.equal((await r.action(c,'share','Independent activities must wait for approval.','evidence')).status,422);
 student(c);assert.equal((await call('partnerPost',r.assignment,{action:'approveMakeup',userId:c})).status,403);
 teacher();assert.equal((await call('partnerPost',r.assignment,{action:'approveMakeup',userId:c})).status,200);
 assert.equal((await r.view(c)).approved,true);
 assert.deepEqual(rows('foundation_checkpoint_responses').find(w=>w.assignment_id===r.assignment&&w.user_id===c),oldWriting);
 for(const u of [a,b])assert.equal((await r.action(u,'share','Remaining group member provides their own numerical explanation.','evidence')).status,200);
 for(const u of [a,b])assert.equal((await r.action(u,'reply','Remaining group member responds with evidence to the other.','evidence')).status,200);
 assert.equal((await r.action(a,'reflect','My own private reflection after the remaining two-person discussion.','evidence')).status,200);
 ok('Only a requested solo alternative needs teacher approval; earlier group writing is retained and two remaining members can continue');
 assert.equal(JSON.stringify([rows('interactive_assignment_reviews'),rows('mastery_records'),rows('simulation_lab_grades'),rows('quiz_reviews')]),gradesBefore);
 const oldIds=JSON.parse(protectedBefore).map(r=>r.id);assert.equal(JSON.stringify(rows('interactive_assignment_submissions').filter(r=>oldIds.includes(r.id))),protectedBefore);
 const notices=rows('realtime.notifications');assert(notices.length);assert(notices.every(n=>JSON.stringify(n.payload)==='{}'&&n.event==='change'&&/^foundation:[a-f0-9-]{36}$/.test(n.topic)));
 for(const fn of ['foundation_partner_action(uuid,uuid,text,text)','foundation_checkpoint_action(uuid,uuid,text,text,text)','foundation_checkpoint_action_legacy(uuid,uuid,text,text,text)','capture_foundation_exchange()','foundation_notify_change()']){
  assert.equal(sql(`select has_function_privilege('authenticated',${q(fn)},'EXECUTE')`),'f');
  assert.equal(sql(`select has_function_privilege('anon',${q(fn)},'EXECUTE')`),'f');
 }
 ok('Older submissions, reviews, lab grades and mastery stay byte-for-byte unchanged; notifications carry no student data and all database entry points stay service-only');
 const graded=completed[0],target=rows('interactive_assignments').find(a=>a.id===graded.assignment).target_id;
 teacher();
 const body=foundationLesson.lab?{action:'release',submissionId:graded.submissionId,requestId:randomUUID(),revision:0,items:['science','reasoning','communication','transfer'].map((id,i)=>({id,earned:i===3?2:4,possible:4,feedback:'Individual explanation and recorded evidence.'})),mastery:[{target_id:target,level:null,feedback:'Mastery remains a separate judgment.'}],feedback:'Strengthen your transfer explanation.'}:{submissionId:graded.submissionId,requestId:randomUUID(),targetId:target,level:2,feedback:'Your individual reasoning supports this target.'};
 const send=()=>new Request('http://fixture/review',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
 const released=await (foundationLesson.lab?api.labRelease:api.foundationReview)(send());assert.equal(released.status,201,await released.clone().text());
 assert.equal((await (foundationLesson.lab?api.labRelease:api.foundationReview)(send())).status,201);
 student(graded.users[0]);const progress=await(await api.progress(new Request('http://fixture/api/student-progress?class='+graded.c))).json();
 if(foundationLesson.lab){assert.equal(api.studentLabTotal(progress.labEntries,'all').percent,85);assert.equal(progress.labEntries.length,1)}
 else assert.equal(progress.targets.find(t=>t.id===target).observations.length,1);
 student(graded.users[1]);const peerProgress=await(await api.progress(new Request('http://fixture/api/student-progress?class='+graded.c))).json();assert.equal(peerProgress.labEntries.length,0);assert.equal(peerProgress.targets.find(t=>t.id===target).observations.length,0);
 assert.equal(JSON.stringify(rows('interactive_assignment_submissions').find(s=>s.id===graded.submissionId)),graded.snapshot);
 ok('A new group submission passes the existing teacher release into only its author’s mastery/gradebook and lab average; retries keep one result and the snapshot stays immutable');
 // Real competing PostgreSQL connections prove the cap is atomic, unlike a serial route mock.
 const creator=r.users[4],assignment=r.assignment;
 assert.equal((await r.action(creator,'create')).status,200);const code=(await r.view(creator)).code;
 const racers=Array.from({length:4},()=>id(fixtureNumber++));
 sql(`insert into students(id,name) values ${racers.map(u=>`(${q(u)},'Race fixture')`)};insert into course_students(course_id,student_id,enrollment_state) values ${racers.map(u=>`(${q(r.c)},${q(u)},'ACTIVE')`)};`);
 const join=u=>new Promise(resolve=>{const child=spawn('/opt/homebrew/bin/psql',['-h','/private/tmp','-p','55439','-U','postgres','-d',db,'-v','ON_ERROR_STOP=1','-qAt']);let err='';child.stderr.on('data',d=>err+=d);child.on('close',code=>resolve({code,err}));child.stdin.end(`set role service_role;select foundation_partner_action(${q(assignment)},${q(u)},'join',${q(code)})`)});
 const results=await Promise.all(racers.map(join));assert.equal(results.filter(r=>r.code===0).length,3);assert.equal(results.filter(r=>r.err.includes('full')).length,1);
 assert.equal((await r.view(creator)).members.length,4);
 ok('Four simultaneous join attempts admit exactly three classmates alongside the creator');
 if(process.env.FOUNDATION_GROUPS_PREVIEW==='1')await require('./preview.cjs')({api,sql,q,json,id,rows,request:undefined,call,student,teacher,root,out,room});
};
