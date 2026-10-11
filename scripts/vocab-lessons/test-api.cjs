const assert=require('node:assert/strict'),{createFixture,id}=require('./fixture.cjs');
(async()=>{const f=await createFixture('/private/tmp/vocab-lesson-api-test'),{fx}=f;let checks=0;
async function call(name,method='GET',body={},query='',status=200){const r=await f.call(name,method,body,id(10),query),d=await r.json();assert.equal(r.status,status,JSON.stringify(d));checks++;return d}
f.role('teacher');let d=await call('vocabulary','GET',{},'?class='+id(1));assert.equal(d.sets.length,1);assert.equal(d.sets[0].lesson_title,'Position & displacement');assert.deepEqual(d.sets[0].target_ids,[id(3)]);assert.equal(d.words.length,4);
d=await call('vocabulary','GET',{},'?class='+id(7));assert.equal(d.words.length,1);assert.equal(d.words[0].id,id(86));assert.equal(d.sets[0].lesson_id,null);
await call('vocabulary','GET',{},'?class='+id(6),403);d=await call('vocabulary','GET',{},'?class='+id(8));assert.equal(d.sets.length,0);
d=await call('vocabCatalog');assert(d.sets.find(s=>s.id===id(73)).course_ids.every(c=>c===id(8)));assert.deepEqual(d.sets.find(s=>s.id===id(72)).access[id(7)],[id(86)]);
f.role('student');d=await call('sources');assert.equal(d.lessons.length,1);d=await call('play','GET',{},'?set_id='+id(71));assert.equal(d.terms.length,0);await call('sets','GET',{},'?setId='+id(71),403);d=await call('play','GET',{},'?set_id='+id(72));assert.deepEqual(d.terms.map(t=>t.id),[id(86)]);
f.role('student',id(4));d=await call('play','GET',{},'?set_id='+id(72));assert.equal(d.terms.length,0);
await call('results','GET',{},'',403);await call('reuse','POST',{id:id(400),source_id:id(10),course_id:id(7)},'',403);
f.role('teacher');d=await call('reuse','POST',{id:id(400),source_id:id(10),course_id:id(7)},'',201);assert.equal(d.quiz.status,'draft');assert.equal(d.quiz.student_ids,null);assert.equal(d.quiz.due_at,null);assert.equal(d.quiz.source_quiz_id,null);assert.deepEqual(d.quiz.questions,f.questions);
await call('reuse','POST',{id:id(400),source_id:id(10),course_id:id(7)},'',201);assert.equal(fx.rows.quiz_assignments.filter(q=>q.id===id(400)).length,1);
await call('reuse','POST',{id:id(401),source_id:id(11),course_id:id(7)},'',403);await call('reuse','POST',{id:id(401),source_id:id(10),course_id:id(8)},'',400);
fx.context.viewingAsTeacher=true;await call('reuse','POST',{id:id(401),source_id:id(10),course_id:id(7)},'',403);fx.context.viewingAsTeacher=false;
d=await call('results');assert.equal(d.assessments.length,1);const a=d.assessments[0];assert.equal(a.classes.length,2);assert.equal(a.students.length,4);assert.equal(a.classes.find(c=>c.id===id(1)).mean,70);assert.equal(a.classes.find(c=>c.id===id(7)).mean,100);assert.equal(a.students.find(s=>s.course_id===id(7)&&s.student_id===id(4)).percent,null);assert(!JSON.stringify(d).includes('teacher_email'));assert(!JSON.stringify(d).includes('Other teacher quiz'));
console.log(JSON.stringify({pass:true,routeChecks:checks,flows:['class vocabulary','student access and individual subsets','reusable draft and retry','ownership restrictions','graded class comparisons']}));})().catch(e=>{console.error(e);process.exitCode=1});
