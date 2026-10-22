import {test} from 'node:test'
import assert from 'node:assert/strict'
import {scheduledWeekDates,deadlineDay,validPlanDate} from '../learning-week'
import {emptyVelocityState,QUESTIONS} from './velocity'
import {evidenceStatus,validAssessment} from './analytics'
test('date-only assignment deadlines keep the school calendar day, including weekends',()=>{
 const items=[{id:'interactive:sample',due:'2026-10-18'}]
 assert.equal(deadlineDay(items[0].due),'2026-10-18')
 assert.equal(validPlanDate('2026-02-30'),false)
 assert.deepEqual(scheduledWeekDates('2026-10-14',0,items,{}),['2026-10-12','2026-10-13','2026-10-14','2026-10-15','2026-10-16','2026-10-18'])
 assert.equal(scheduledWeekDates('2026-10-14',0,[{...items[0],due:null}],{}).length,5)
 assert.equal(scheduledWeekDates('2026-10-14',0,items,{'interactive:sample':'2026-10-17'}).length,7)
})
test('pending explanations and missing responses are not counted as incorrect',()=>{
 const state=emptyVelocityState(),q=QUESTIONS.find(q=>q.id==='6b')!
 assert.equal(evidenceStatus(q,state),'missing');state.answers['6b']='Slope is velocity.';assert.equal(evidenceStatus(q,state),'pending')
 state.answers['1b']='15';assert.equal(evidenceStatus(QUESTIONS[1],state),'incorrect')
})
test('model output requires bounded evidence and known question references',()=>{
 const result={level:2,confidence:'medium',rationale:'4b is correct; 6b needs explanation.',feedback:'Explain how the slope stays constant.',explanation:{status:'partial',reason:'Velocity is named but constancy is not explained.'},weakpoints:[{question_ids:['6b'],concept:'Independent explanation',reason:'The explanation is incomplete.',next_step:'Compare equal time intervals.'}]}
 assert.equal(validAssessment(result),true)
 assert.equal(validAssessment({...result,level:4}),false)
 assert.equal(validAssessment({...result,feedback:'x'.repeat(1601)}),false)
 assert.equal(validAssessment({...result,weakpoints:[{...result.weakpoints[0],question_ids:['made-up']}]}),false)
})
