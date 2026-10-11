const assert=require('node:assert/strict'),{createFixture,id}=require('../quiz-draft-delete/fixture.cjs');
(async()=>{
 const f=await createFixture('/private/tmp/quiz-workspace-api'),{fx,seed}=f;
 f.role('anonymous');assert.equal((await f.call('results','GET')).status,401);
 f.role('student');assert.equal((await f.call('results','GET')).status,403);assert.equal((await f.call('detail','POST',{action:'reopen',version:1})).status,403);
 f.role('teacher');assert.equal((await f.call('detail','POST',{action:'archive',version:1},id(11))).status,404);
 fx.context.viewingAsTeacher=true;assert.equal((await f.call('detail','POST',{action:'archive',version:1})).status,403);fx.context.viewingAsTeacher=false;
 fx.rows.quiz_work.push({quiz_id:seed.id,user_id:id(2),state:'graded',version:2,submission_id:id(400),answers:{}});
 fx.rows.quiz_submissions.push({id:id(400),quiz_id:seed.id,user_id:id(2),snapshot:structuredClone(seed),answers:{[id(20)]:'1'},submitted_at:'2026-10-01T12:00:00Z'});
 fx.rows.quiz_reviews.push({id:id(401),submission_id:id(400),decision:'graded',scores:{[id(21)]:2,[id(22)]:2},ratings:{[id(3)]:2,[id(5)]:2},grade_mode:'numeric',grade_value:null,reviewed_at:'2026-10-01T13:00:00Z'});
 const evidence=JSON.stringify([fx.rows.quiz_work,fx.rows.quiz_submissions,fx.rows.quiz_reviews,fx.mastery]);
 const initial=await(await f.call('results','GET')).json();assert.equal(initial.assignments.length,2);assert.equal(initial.assessments.length,1);assert.equal(initial.assignments.find(a=>a.id===seed.id).students.length,2);
 assert(!JSON.stringify(initial).includes('Other teacher quiz'));assert(!JSON.stringify(initial).includes('teacher_email'));
 for(const body of [{action:'archive',version:0},{action:'archive',version:2147483647},{action:'archive',version:1,questions:[]}])assert.equal((await f.call('detail','POST',body)).status,400);
 assert.equal((await f.call('detail','POST',{action:'archive',version:1},id(12))).status,409);
 assert.equal((await f.call('detail','POST',{action:'archive',version:1})).status,200);assert.equal(seed.status,'archived');assert.equal(seed.version,2);
 assert.equal((await f.call('detail','POST',{action:'archive',version:1})).status,200);assert.equal(seed.version,2);
 assert.equal((await f.call('detail','POST',{action:'reopen',version:1})).status,409);
 const archived=await(await f.call('results','GET')).json();assert.deepEqual(archived.assignments.find(a=>a.id===seed.id).students,initial.assignments.find(a=>a.id===seed.id).students);
 f.role('student');assert.equal((await f.call('detail','GET')).status,200); // feedback remains accessible
 f.role('teacher');assert.equal((await f.call('detail','POST',{action:'reopen',version:2})).status,200);assert.equal(seed.status,'published');assert.equal(seed.version,3);
 assert.equal(JSON.stringify([fx.rows.quiz_work,fx.rows.quiz_submissions,fx.rows.quiz_reviews,fx.mastery]),evidence);
 // Race with a second teacher window must not overwrite that window's version.
 const db=global.quizFakeDB,from=db.from;db.from=table=>{const q=from(table);if(table==='quiz_assignments'){const update=q.update;q.update=patch=>{seed.version++;return update(patch)}}return q};
 assert.equal((await f.call('detail','POST',{action:'archive',version:3})).status,409);assert.equal(seed.status,'published');db.from=from;
 console.log('PASS: authenticated results; teacher/course scope; preview protection; strict input; archive/restore; safe retries and concurrent conflicts; preserved grades, responses, mastery and student feedback.');
})().catch(e=>{console.error(e);process.exitCode=1});
