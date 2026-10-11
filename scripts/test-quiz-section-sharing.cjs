const assert=require('node:assert/strict'),{createFixture,id}=require('./vocab-lessons/fixture.cjs');
(async()=>{
 const f=await createFixture('/private/tmp/quiz-section-sharing-api'),{fx}=f;
 Object.assign(fx.rows.courses.find(c=>c.id===id(1)),{name:'CPA Physics',section:'F',track:'cpa'});
 Object.assign(fx.rows.courses.find(c=>c.id===id(7)),{name:'Honors Physics',section:'A',track:'honors'});
 fx.rows.course_students=fx.rows.course_students.filter(e=>e.course_id===(e.student_id===id(2)?id(1):id(7)));
 Object.assign(fx.rows.quiz_assignments.find(q=>q.id===id(10)),{language_level:'cpa',sei_supports:true});Object.assign(fx.rows.quiz_assignments.find(q=>q.id===id(13)),{language_level:'honors',sei_supports:false});
 f.role('teacher');const list=await(await f.call('list','GET')).json();assert(list.quizzes.some(q=>q.id===id(10)));assert(list.quizzes.some(q=>q.id===id(13)));assert(!list.quizzes.some(q=>q.id===id(11)));
 const records=JSON.stringify([fx.rows.quiz_work,fx.rows.quiz_submissions,fx.rows.quiz_reviews]);
 for(const [source,destination,copyId] of [[10,7,400],[13,1,401]]){
  const sourceQuiz=structuredClone(fx.rows.quiz_assignments.find(q=>q.id===id(source)));
  const result=await f.call('reuse','POST',{id:id(copyId),source_id:id(source),course_id:id(destination)}),body=await result.json();assert.equal(result.status,201,JSON.stringify(body));
  assert.equal(body.quiz.course_id,id(destination));assert.equal(body.quiz.status,'draft');assert.equal(body.quiz.student_ids,null);assert.equal(body.quiz.due_at,null);assert.deepEqual(body.quiz.questions,sourceQuiz.questions);assert.equal(body.quiz.language_level,sourceQuiz.language_level);assert.equal(body.quiz.sei_supports,sourceQuiz.sei_supports);
  assert.deepEqual(fx.rows.quiz_assignments.find(q=>q.id===sourceQuiz.id),sourceQuiz);
 }
 assert.equal(JSON.stringify([fx.rows.quiz_work,fx.rows.quiz_submissions,fx.rows.quiz_reviews]),records);
 f.role('student',id(2));let student=await(await f.call('list','GET')).json();assert(student.quizzes.every(q=>q.course_id===id(1)));assert(!student.quizzes.some(q=>q.id===id(401)));assert.equal((await f.call('detail','GET',{},id(13))).status,404);
 f.role('student',id(4));student=await(await f.call('list','GET')).json();assert(student.quizzes.every(q=>q.course_id===id(7)));assert(!student.quizzes.some(q=>q.id===id(400)));
 console.log('PASS: CPA → Honors and Honors → CPA reuse; independent private drafts; source questions, student work and grades preserved; teacher ownership and student class access enforced.');
})().catch(e=>{console.error(e);process.exitCode=1});
