const assert=require('node:assert/strict'),{createFixture,id}=require('./fixture.cjs');
(async()=>{
 const {fx,seed,role,call}=await createFixture('/private/tmp/quiz-delete-work/api');
 const request={id:id(300),course_id:id(1),lesson_id:id(200),target_ids:[id(3)],count:3,format:'choice',emphasis:'',language_level:'cpa',sei_supports:true};
 role('teacher');let r=await call('generate','POST',request);assert.equal(r.status,201);const draft=(await r.json()).quiz;
 const del={action:'delete',version:draft.version};
 role('anonymous');assert.equal((await call('draft','POST',del,draft.id)).status,401);
 role('student');assert.equal((await call('draft','POST',del,draft.id)).status,403);
 role('teacher');fx.context.viewingAsTeacher=true;assert.equal((await call('draft','POST',del,draft.id)).status,403);fx.context.viewingAsTeacher=false;
 fx.session.experience={role:'teacher'};assert.equal((await call('draft','POST',del,draft.id)).status,403);delete fx.session.experience;
 assert.equal((await call('draft','POST',del,id(11))).status,404);
 for(const patch of [{version:0},{version:'1'},{action:'publish'},{questions:[]}])assert.equal((await call('draft','POST',{...del,...patch},draft.id)).status,400);
 assert.equal((await call('draft','POST',del,seed.id)).status,409);
 // An assigned copy and student evidence remain unchanged when removing its source draft.
 seed.source_quiz_id=draft.id;role('student');assert.equal((await call('detail','POST',{action:'save',version:0,request_id:id(500),answers:{[id(20)]:'1'}})).status,200);
 const published=structuredClone(seed),evidence=structuredClone([fx.rows.quiz_work,fx.rows.quiz_submissions,fx.rows.quiz_reviews]);
 role('teacher');r=await call('draft','POST',del,draft.id);assert.equal(r.status,200);const deleted=await r.json();assert.equal(deleted.deleted,true);assert.equal(deleted.version,draft.version+1);
 assert.equal((await call('draft','POST',del,draft.id)).status,200);
 assert.deepEqual(seed,published);assert.deepEqual([fx.rows.quiz_work,fx.rows.quiz_submissions,fx.rows.quiz_reviews],evidence);
 assert(!(await(await call('list','GET')).json()).quizzes.some(q=>q.id===draft.id));
 assert.equal((await call('detail','GET',{},draft.id)).status,404);
 const results=await(await call('results','GET')).json();assert(!results.assessments.some(a=>a.copies.some(c=>c.id===draft.id)));assert(results.assessments.some(a=>a.copies.some(c=>c.id===seed.id)));
 const calls=fx.aiCalls;assert.equal((await call('generate','GET',{},undefined,'?id='+draft.id)).status,410);assert.equal((await call('generate','POST',request)).status,410);assert.equal(fx.aiCalls,calls);
 r=await call('draft','POST',{action:'restore',version:deleted.version},draft.id);assert.equal(r.status,200);assert.equal((await r.json()).deleted,false);
 assert((await(await call('list','GET')).json()).quizzes.some(q=>q.id===draft.id));assert.equal((await call('detail','GET',{},draft.id)).status,200);
 assert.equal((await call('draft','POST',del,draft.id)).status,409);
 // Refuse a draft with any student work, even inconsistent legacy data.
 fx.rows.quiz_work.push({quiz_id:id(12),user_id:id(2)});assert.equal((await call('draft','POST',del,id(12))).status,409);
 // A concurrent publish wins safely; delete cannot overwrite it.
 const db=global.quizFakeDB,from=db.from,current=fx.rows.quiz_assignments.find(q=>q.id===draft.id);db.from=table=>{const q=from(table);if(table==='quiz_assignments'){const update=q.update;q.update=patch=>{current.status='published';current.version++;return update(patch)}}return q};
 assert.equal((await call('draft','POST',{action:'delete',version:current.version},draft.id)).status,409);assert.equal(current.deleted_at,null);assert.equal(current.status,'published');db.from=from;
 console.log('PASS: draft deletion and Undo, owner/role/preview protection, published quiz and evidence protection, conflict detection, hidden library/detail/comparisons, no generation resurrection or extra Claude request, and preserved assigned copies.');
})().catch(e=>{console.error(e);process.exitCode=1});
