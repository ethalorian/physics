import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validQuizAssessment, quizAssessmentDraft } from './grading'
import type { Quiz } from './types'
const quiz={questions:[{id:'choice',target_id:'t1',kind:'choice',correct_index:1,points:2},{id:'written',target_id:'t2',kind:'written',points:4}]} as Quiz
const answers={choice:'1',written:'Evidence'}
const result={items:[{id:'choice',score:2,feedback:'Correct.',confidence:'high' as const},{id:'written',score:2.5,feedback:'Explains speed but not direction.',confidence:'medium' as const}],summary:'Partial explanation.',next_step:'Label the direction before calculating.',mastery:[{target_id:'t1',level:3 as const,rationale:'Correctly distinguishes direction.'},{target_id:'t2',level:null,rationale:'Essential drawing needs teacher inspection.'}]}
test('Claude mastery uses exact independent targets and preserves an insufficient-evidence decision',()=>{
 assert.equal(validQuizAssessment(result,quiz,answers),true)
 assert.equal(validQuizAssessment({...result,mastery:[result.mastery[0],result.mastery[0]]},quiz,answers),false)
 assert.equal(validQuizAssessment({...result,mastery:[{...result.mastery[0],level:4},result.mastery[1]]},quiz,answers),false)
 assert.equal(validQuizAssessment({...result,items:[{...result.items[0],score:0},result.items[1]]},quiz,answers),false)
 const draft=quizAssessmentDraft(result,quiz)
 assert.deepEqual(draft.ratings,{t1:3,t2:null})
 assert.match(draft.note,/Next time:/)
 assert.deepEqual(draft.scores,{written:2.5})
})

test('automatic recovery is bounded and leaves ready or active assessments alone',async()=>{
 const {quizAiRecoverable}=await import('./grading')
 const now=Date.now(),base={submission_id:'s',status:'error' as const,attempts:1,result:null,error:'Claude could not finish grading.',model:'fixture',locked_until:null,updated_at:new Date(now-120000).toISOString()}
 assert.equal(quizAiRecoverable(base,now),true)
 assert.equal(quizAiRecoverable({...base,attempts:3},now),false)
 assert.equal(quizAiRecoverable({...base,updated_at:new Date(now).toISOString()},now),false)
 assert.equal(quizAiRecoverable({...base,error:'Claude rejected the grading configuration.'},now),false)
 assert.equal(quizAiRecoverable({...base,status:'ready'},now),false)
 assert.equal(quizAiRecoverable({...base,status:'processing',locked_until:new Date(now+1000).toISOString()},now),false)
 assert.equal(quizAiRecoverable({...base,status:'processing',locked_until:new Date(now-1000).toISOString()},now),true)
})

test('normalization accepts only casing changes and still rejects invalid or missing evidence',async()=>{
 const {normalizeQuizAssessment}=await import('./grading')
 const mixed={...result,items:result.items.map(i=>({...i,id:i.id.toUpperCase(),confidence:i.confidence.toUpperCase()})),mastery:result.mastery.map(r=>({...r,target_id:r.target_id.toUpperCase()}))}
 assert.equal(validQuizAssessment(normalizeQuizAssessment(mixed,quiz),quiz,answers),true)
 assert.equal(validQuizAssessment(normalizeQuizAssessment({...result,items:[{...result.items[0],score:'2'},result.items[1]]},quiz),quiz,answers),false)
 assert.equal(validQuizAssessment(normalizeQuizAssessment({...result,items:[{...result.items[0],confidence:'certain'},result.items[1]]},quiz),quiz,answers),false)
 assert.equal(validQuizAssessment(normalizeQuizAssessment({...result,items:[]},quiz),quiz,answers),false)
})
