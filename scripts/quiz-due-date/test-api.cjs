const assert=require('node:assert/strict'),{createFixture,id}=require('./fixture.cjs');
(async()=>{
 const f=await createFixture('/private/tmp/quiz-due-work/api'),{fx,role,call,seed}=f;
 const change={due_at:'2026-09-29T17:30:00.000Z',version:1};
 role('anonymous');assert.equal((await call('dueDate','POST',change)).status,401);
 role('student');assert.equal((await call('dueDate','POST',change)).status,403);
 role('teacher');assert.equal((await call('dueDate','POST',change,id(11))).status,404);
 fx.context.viewingAsTeacher=true;assert.equal((await call('dueDate','POST',change)).status,403);fx.context.viewingAsTeacher=false;
 fx.session.experience={role:'teacher'};assert.equal((await call('dueDate','POST',change)).status,403);delete fx.session.experience;
 for(const patch of [{due_at:'bad'},{due_at:'2026-02-30T12:00:00.000Z'},{version:-1},{questions:[]},{status:'archived'}]) assert.equal((await call('dueDate','POST',{...change,...patch})).status,400);
 assert.equal((await call('dueDate','POST',change,id(12))).status,409);
 // A student's already-open page has only its own work version, not quiz.version.
 role('student');let r=await call('detail','POST',{action:'save',version:0,request_id:id(401),answers:{[id(20)]:'1'}});assert.equal(r.status,200);const studentVersion=(await r.json()).work.version;
 const workBefore=structuredClone(fx.rows.quiz_work),questionsBefore=structuredClone(seed.questions),historyBefore=structuredClone([fx.rows.quiz_submissions,fx.rows.quiz_reviews]);
 const quizBefore=structuredClone(seed);
 role('teacher');r=await call('dueDate','POST',change);assert.equal(r.status,200);assert.deepEqual(await r.json(),{due_at:change.due_at,version:2});
 assert.deepEqual(fx.rows.quiz_work,workBefore);assert.deepEqual([fx.rows.quiz_submissions,fx.rows.quiz_reviews],historyBefore);assert.deepEqual(seed.questions,questionsBefore);
 for(const key of Object.keys(quizBefore).filter(k=>!['due_at','version','updated_at'].includes(k)))assert.deepEqual(seed[key],quizBefore[key]);
 // Retrying a lost response is harmless. A conflicting teacher update is rejected.
 assert.equal((await call('dueDate','POST',change)).status,200);assert.equal(seed.version,2);
 assert.equal((await call('dueDate','POST',{...change,due_at:null})).status,409);assert.equal(seed.due_at,change.due_at);
 role('student');r=await call('detail','POST',{action:'save',version:studentVersion,request_id:id(402),answers:{[id(20)]:'1',[id(21)]:'Distance is 6 m; displacement is zero.'}});assert.equal(r.status,200);const nextVersion=(await r.json()).work.version;
 // Remove the date while that same page stays open, then submit with its work version.
 role('teacher');assert.equal((await call('dueDate','POST',{version:2,due_at:null})).status,200);assert.equal(seed.status,'published');assert.equal((await call('dueDate','POST',{version:3,due_at:'2026-09-28T12:00:00.000Z'})).status,200);
 role('student');const answers={[id(20)]:'1',[id(21)]:'Distance is 6 m; displacement is zero.',[id(22)]:{model:'Right is positive.',plan:'Final minus initial.',work:'-2 - 6 = -8 m.',answer:'8 m left, distance 8 m.'}};
 r=await call('detail','POST',{action:'submit',version:nextVersion,request_id:id(403),answers});assert.equal(r.status,200);assert.equal((await r.json()).work.state,'submitted');assert.deepEqual(fx.rows.quiz_submissions[0].answers,answers);
 const evidence=structuredClone([fx.rows.quiz_work,fx.rows.quiz_submissions,fx.rows.quiz_reviews]);
 role('teacher');assert.equal((await call('dueDate','POST',{version:4,due_at:null})).status,200);assert.deepEqual([fx.rows.quiz_work,fx.rows.quiz_submissions,fx.rows.quiz_reviews],evidence);
 // Simulate another tab changing the quiz after authorization but before the update.
 const db=global.quizFakeDB,from=db.from;db.from=table=>{const q=from(table);if(table==='quiz_assignments'){const update=q.update;q.update=patch=>{seed.version++;return update(patch)}}return q};
 assert.equal((await call('dueDate','POST',{version:5,due_at:change.due_at})).status,409);assert.equal(seed.due_at,null);db.from=from;
 seed.status='archived';assert.equal((await call('dueDate','POST',{version:seed.version,due_at:null})).status,409);
 console.log('PASS: teacher scope, preview protection, strict scheduling-only input, atomic conflict detection, retry recovery, set/clear due date, unchanged answers/history, and an already-open student session saving and submitting across date edits.');
})().catch(e=>{console.error(e);process.exitCode=1});
