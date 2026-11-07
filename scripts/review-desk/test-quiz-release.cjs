const assert = require('node:assert/strict')
const {fixture,uuid}=require('./fixture.cjs')
const {reviewActions}=require('../../src/lib/review-desk/action-plan.ts')
const {validateReview,quizScore}=require('../../src/lib/quizzes/validation.ts')

;(async()=>{
 const f=await fixture('/private/tmp/review-desk-quiz-recovery')
 const doc=f.document, key=doc.activity.key
 const six=Array.from({length:6},(_,i)=>({id:'q'+(i+1),kind:'choice',target_id:'target',prompt:'Choose',options:['Yes','No'],correct_index:0,points:1}))
 const answers=Object.fromEntries(six.map((q,i)=>[q.id,i===0?'1':'0']))
 const quiz={grade_mode:'numeric',questions:six}
 doc.scoreItems=six.map(q=>({id:q.id,label:q.prompt,possible:q.points,step:.5,automatic:answers[q.id]==='0'?1:0}))
 doc.evidence=six.map(q=>({id:q.id,prompt:q.prompt,response:'Choice',targetIds:['target']}))
 const payload={scores:{q2:1},ratings:{target:3},evidenceRatings:Object.fromEntries(six.map((q,i)=>[q.id,i===0?1:3])),note:'Saved overall feedback.',feedback:{q1:'Saved feedback.'},gradeValue:null}
 const row={id:uuid(55),source_key:key,source_version:doc.version,course_id:f.course,reviewer_email:f.context().scopeEmail,user_id:f.user,version:2,request_id:uuid(70),state:'releasing',review_snapshot:structuredClone(doc),payload:structuredClone(payload),completed_actions:[],lease_until:null}
 const action=reviewActions({doc,native:{kind:'quiz',sub:{quiz_id:doc.activity.sourceId}}},payload,row.request_id)[0]
 const broken={...action,body:{...action.body,scores:payload.scores}}
 assert.throws(()=>validateReview(broken.body,quiz),/Score written work/)
 assert.deepEqual(validateReview(action.body,quiz).scores,{})
 assert.deepEqual(quizScore(six,answers,action.body.scores),{earned:5,possible:6,pending:0,percent:83})
 row.release_plan=[broken];f.rows.review_desk_drafts.push(row)
 const post=(action,version=2)=>f.call('desk','POST',{action,id:row.id,version})
 const get=async()=> (await(await f.call('desk','GET',{},'?'+new URLSearchParams({class:f.course,assignment:key,student:f.user}))).json()).document.draft
 assert.equal((await get()).canReopenQuiz,true)
 assert.equal((await post('release')).status,409); assert.equal(row.state,'releasing')
 row.completed_actions=[0];assert.equal((await post('reopen_quiz')).status,409);row.completed_actions=[]
 row.lease_until=new Date(Date.now()+120000).toISOString();assert.equal((await post('reopen_quiz')).status,409);row.lease_until=null
 doc.state='released';assert.equal((await post('reopen_quiz')).status,409);doc.state='submitted'
 f.role('student');assert.equal((await post('reopen_quiz')).status,403);f.role('teacher')
 const recovered=await post('reopen_quiz');assert.equal(recovered.status,200)
 const draft=(await recovered.json()).draft;assert.equal(draft.state,'draft');assert.equal(draft.version,3)
 assert.deepEqual(draft.payload,{...payload,scores:{}});assert.equal(row.release_plan,null);assert.equal(f.calls.length,0)
 assert.equal((await post('reopen_quiz')).status,409)
 const corrected={...draft.payload,feedback:{...draft.payload.feedback,q1:'Right magnitude; acceleration is positive.'}}
 const saved=await f.call('desk','POST',{action:'save',classId:f.course,assignment:key,student:f.user,submissionId:doc.submissionId,sourceVersion:doc.version,reviewVersion:doc.reviewVersion,version:3,payload:corrected,ready:true})
 assert.equal(saved.status,200);assert.equal(row.state,'ready');assert.equal(f.calls.length,0)
 const clean=reviewActions({doc,native:{kind:'quiz',sub:{quiz_id:doc.activity.sourceId}}},row.payload,row.request_id)[0]
 assert.deepEqual(validateReview(clean.body,quiz).question_notes,corrected.feedback)
 const mixed={...quiz,questions:[...six,{id:'written',kind:'written',points:4,target_id:'target'},{id:'problem',kind:'problem',points:2,target_id:'target'}]}
 const mixedDoc={...doc,scoreItems:[...doc.scoreItems,{id:'written',possible:4,step:.5},{id:'problem',possible:2,step:.5}]}
 const mixedBody=reviewActions({doc:mixedDoc,native:{kind:'quiz',sub:{quiz_id:doc.activity.sourceId}}},{...corrected,scores:{q1:0,q2:1,written:3.5,problem:0}},row.request_id)[0].body
 assert.deepEqual(validateReview(mixedBody,mixed).scores,{written:3.5,problem:0})
 assert.throws(()=>validateReview({...mixedBody,scores:{written:3.25,problem:0}},mixed),/half-point/)
 console.log('PASS: interrupted six-choice quiz reproduced; safe private recovery; edited feedback, mastery, manual half-points and zero preserved; native release validation passed.')
})().catch(e=>{console.error(e);process.exitCode=1})
