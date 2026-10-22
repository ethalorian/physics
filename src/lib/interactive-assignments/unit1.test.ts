import {test} from 'node:test'
import assert from 'node:assert/strict'
import {UNIT1_ASSIGNMENTS,assignmentByDay,objectiveQuestion} from './catalog'
import {classDayTool} from '../class-day-tools'
import {correctAnswer,emptyVelocityState,validateVelocityState,missingVelocityAnswers} from './velocity'
import {evidenceStatus,validAssessment} from './analytics'
test('each teaching-tool day has mapped targets, unique questions and independent evidence',()=>{
 assert.deepEqual(UNIT1_ASSIGNMENTS.map(a=>a.day),Array.from({length:22},(_,i)=>i+1))
 for(const a of UNIT1_ASSIGNMENTS){if(a.day<=20){assert(classDayTool(a.unit,a.day));assert(a.toolHref.includes(encodeURIComponent(classDayTool(a.unit,a.day)!.file)))}else assert(a.toolHref.includes('Transfer%20Task'));assert(a.questions.some(q=>q.independent));assert.equal(new Set(a.questions.map(q=>q.id)).size,a.questions.length);for(const q of a.questions){assert(q.explanation);assert(q.targets?.every(t=>a.targets.includes(t))??true);if(objectiveQuestion(q))assert(correctAnswer(q,q.options?String(q.correct):String(q.answer)))}}
 assert.equal(assignmentByDay(23),null)
})
test('per-lesson validation preserves diagrams and recomputes practice evidence',()=>{
 const lesson=assignmentByDay(15)!,state=emptyVelocityState(),arrows=JSON.stringify([{label:'Earth gravity',angle:270,magnitude:19.6},{label:'Table normal',angle:90,magnitude:19.6}]);state.answers['r2-1a']=arrows;state.answers['r2-2b']='1';state.attempts['r2-2b']=[{answer:'0',correct:true},{answer:'1',correct:false}];state.answers['r2-4b']='Net right';state.attempts['r2-4b']=[{answer:'Net right',correct:true}]
 const saved=validateVelocityState(state,lesson.questions);assert.equal(saved.answers['r2-1a'],arrows);assert.deepEqual(saved.attempts['r2-2b'].map(t=>t.correct),[false,true]);assert.deepEqual(saved.attempts['r2-4b'],[]);assert(missingVelocityAnswers(saved,lesson.questions).includes('r2-1b'));assert.equal(evidenceStatus(lesson.questions[0],saved),'pending');state.answers['r2-1a']='not a diagram';assert.throws(()=>validateVelocityState(state,lesson.questions));
})
test('a self-rating remains reflection rather than a wrong answer',()=>{const lesson=assignmentByDay(19)!,q=lesson.questions.find(q=>q.id==='r2-1b')!,state=emptyVelocityState();state.answers[q.id]='2';assert(!objectiveQuestion(q));assert.equal(evidenceStatus(q,state),'reflection')})
test('assessment validation requires one result per written item and per relevant target',()=>{
 const lesson=assignmentByDay(20)!,rating={level:2,confidence:'medium',rationale:'Reasoning supports routine performance.',feedback:'Explain a new case.'},explanation={status:'partial',reason:'Model limitations need more explanation.'},items=lesson.questions.filter(q=>!objectiveQuestion(q)&&!q.reflection).map(q=>({id:q.id,...explanation})),ratings=lesson.targets.map(target_slug=>({target_slug,...rating})),result={...rating,explanation,items,ratings,weakpoints:[]};assert(validAssessment(result,lesson));assert(!validAssessment({...result,ratings:ratings.slice(0,1)},lesson));assert(!validAssessment({...result,items:items.slice(0,1)},lesson));assert(!validAssessment({...result,ratings:ratings.map(r=>({...r,target_slug:'unrelated'}))},lesson));
})

test('rebuilt question IDs sever old submissions without hiding current revision feedback',async()=>{
 const {submissionMatchesAssignment}=await import('./catalog'),lesson=assignmentByDay(3)!
 assert.equal(submissionMatchesAssignment({answers:{'1a':'8'}},lesson),false)
 assert.equal(submissionMatchesAssignment({answers:{[lesson.questions[0].id]:'8'}},lesson),true)
 assert.equal(submissionMatchesAssignment(null,lesson),false)
 const old=emptyVelocityState();old.answers['1a']='8';assert(Object.values(validateVelocityState(old,lesson.questions).answers).every(value=>value===''));assert(!Object.hasOwn(validateVelocityState(old,lesson.questions).answers,'1a'))
 assert.equal(missingVelocityAnswers(validateVelocityState(old,lesson.questions),lesson.questions).length,lesson.questions.length)
})

test('transfer days preserve independent written evidence and never grade completion as mastery',()=>{
 for(const day of [21,22]){const lesson=assignmentByDay(day)!;assert.equal(lesson.questions.length,2);assert(lesson.questions.every(q=>q.independent&&!objectiveQuestion(q)&&!q.reflection&&q.demand?.dok===3));assert(lesson.sections[0].learn.includes('packet'));assert(lesson.questions.every(q=>q.targets?.length&&q.targets.every(t=>lesson.targets.includes(t))))}
})
