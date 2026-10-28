import { test } from 'node:test'
import assert from 'node:assert/strict'
import { LAB_DIMENSIONS, labDimensionGrade, validLabDimensions, FOUR_DIMENSION_LAB_VERSION } from './lab-rubric'
import { studentLabEntries, studentLabTotal, type StudentLabEntry } from '../student-gradebook'
import type { ResultActivity } from '../assessment-results/types'
import { emptyGradingSettings } from '../grading-terms'
const scores = (lowest = 4) => LAB_DIMENSIONS.map((d,i) => ({id:d.id,earned:i===3?lowest:4,possible:4 as const,feedback:'Evidence'}))
test('syllabus conversion uses the lowest dimension, including a real zero', () => {
  for (const [lowest,percent,letter] of [[0,50,'Not Yet'],[1,75,'C'],[2,85,'B'],[3,89,'B+'],[4,96,'A']] as const) assert.deepEqual(labDimensionGrade(scores(lowest)),{lowest,percent,letter})
  assert.equal(labDimensionGrade(scores(2))?.percent,85,'4–4–4–2 follows the explicit table, not the conflicting prose example')
})
test('reject incomplete, duplicate, out of range, fractional and coerced rubric scores', () => {
  for (const bad of [null, [], scores().slice(1), [...scores(),scores()[0]], [scores()[0],scores()[0],...scores().slice(2)], ...[-1,5,.5,NaN,'4',null].map(earned=>scores().map((s,i)=>i? s:{...s,earned})), scores().map(s=>({...s,possible:100})), scores().map(s=>({...s,feedback:'x'.repeat(1201)}))]) assert.equal(validLabDimensions(bad),false)
})
const entry = (id:string, lowest:number, termId:string|null='fall'):StudentLabEntry => ({submissionId:id,rubricVersion:FOUR_DIMENSION_LAB_VERSION,items:scores(lowest),percent:labDimensionGrade(scores(lowest))!.percent,letter:'B',feedback:'Released feedback',releasedAt:'2026-10-23',submittedAt:id==='original'?'2026-10-20':'2026-10-22',assignmentKey:'interactive:lab',title:'Investigation',href:'/interactive-assignments/lab',termId,attempt:1})
test('lab average retains original plus revision, counts each submission once, respects terms and legacy records', () => {
  const original=entry('original',2),revision=entry('revision',4),legacy={...entry('old',1),rubricVersion:'lab-response-v1'},winter=entry('winter',0,'winter')
  const result=studentLabTotal([original,revision,revision,legacy,winter],'fall')
  assert.equal(result.percent,90.5);assert.equal(result.counted.length,2);assert.equal(result.legacyCount,1)
  assert.equal(studentLabTotal([original,winter],'winter').percent,50)
  assert.equal(studentLabTotal([legacy],'all').percent,null)
  assert.equal(studentLabTotal([entry('unplaced',3,null)],'unassigned').percent,89)
  assert.equal(studentLabTotal([{...original,percent:99}],'all').percent,null,'malformed released rubric cannot silently enter average')
})
test('released lab history survives a reopened assignment and choice composition without exposing private review data', () => {
  const settings=emptyGradingSettings(); settings.terms=[{id:'fall',name:'Fall',start:'2026-09-01',end:'2026-11-01'}]
  const activity:ResultActivity={key:'interactive:lab',sourceId:'simulation-race-track',title:'Investigation',kind:'simulation',unitIds:['unit-1'],dueAt:null,archived:true,cells:{student:{state:'draft',label:'Revision',needsReview:false,labGrades:[{...entry('original',2),private:'SECRET'} as StudentLabEntry]},other:{state:'reviewed',label:'Private',needsReview:false,labGrades:[entry('other',4)]}}}
  const choice:ResultActivity={...activity,key:'choice:x',kind:'choice',dueAt:'2026-10-20',cells:{student:{state:'completed',label:'Completed',needsReview:false}},evidenceActivities:[activity]}
  const entries=studentLabEntries([choice], 'student', settings)
  assert.equal(entries.length,1);assert.equal(entries[0].termId,'fall');assert.equal(entries[0].href,'/interactive-assignments/lab');assert(!JSON.stringify(entries).includes('SECRET'))
  choice.cells.student.state='excused';assert.equal(studentLabEntries([choice],'student',settings).length,0)
})
