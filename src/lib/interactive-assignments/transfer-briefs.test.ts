import {existsSync,readFileSync} from 'node:fs'
import {TRANSFER_BRIEF_SCENES} from './transfer-brief-scenes'
import {test} from 'node:test'
import assert from 'node:assert/strict'
import {TRANSFER_BRIEFS} from './transfer-briefs'
import {assignmentBySlug,isLabAssignment} from './catalog'
import {sourcePresentation} from '../assignment-source-presentation'
import {TRANSFER_BRIEF_RUBRIC_VERSION,gradeTable,gradeEndpoint,transferDimensionGrade} from './graded-assignment'
import {LAB_DIMENSIONS,FOUR_DIMENSION_LAB_VERSION} from './lab-rubric'
import {emptyVelocityState,validateVelocityState,missingVelocityAnswers} from './velocity'
import {studentTransferEntries,studentLabEntries,studentTransferTotal,studentLabTotal,studentGradebookRows,type StudentLabEntry} from '../student-gradebook'
import {emptyGradingSettings} from '../grading-terms'
import type {ResultActivity} from '../assessment-results/types'

const dimensions=(score:number)=>LAB_DIMENSIONS.map(d=>({id:d.id,earned:score,possible:4 as const,feedback:'Evidence supports this dimension.'}))
const entry=(id:string,score:number,at:string):StudentLabEntry=>({submissionId:id,assignmentKey:'interactive:brief',title:'Fictional brief',href:'/',termId:'term-1',attempt:1,rubricVersion:TRANSFER_BRIEF_RUBRIC_VERSION,items:dimensions(score),percent:[50,75,85,89,96][score],letter:'',feedback:'Released feedback',releasedAt:at,submittedAt:at})
test('briefs have consistent identity and distinct grading without replacing the final task',()=>{
  for(const brief of TRANSFER_BRIEFS){
    assert.equal(assignmentBySlug(brief.slug),brief)
    assert.equal(isLabAssignment(brief),false)
    assert.equal(sourcePresentation({kind:'interactive',sourceId:brief.slug,title:brief.title}).label,'Transfer Brief')
    assert.equal(gradeTable(brief),'transfer_task_grades')
    assert.equal(gradeEndpoint(brief),'/api/interactive-assignments/transfer-grade')
    assert.equal(brief.questions.length,3)
    assert.equal(new Set(brief.questions.map(q=>q.id)).size,3)
    assert.ok(brief.questions.every(q=>q.independent&&q.explanation&&q.targets?.every(t=>brief.targets.includes(t))))
    const state=emptyVelocityState();assert.equal(missingVelocityAnswers(state,brief.questions).length,3)
    for(const q of brief.questions)state.answers[q.id]='My calculation and explanation.'
    assert.equal(missingVelocityAnswers(validateVelocityState(state,brief.questions),brief.questions).length,0)
  }
  assert.ok(assignmentBySlug('day-21-transfer-plan'))
  assert.ok(assignmentBySlug('day-22-transfer-defend'))
  assert.equal(assignmentBySlug('day-21-transfer-plan')?.transferBrief,undefined)
})
test('rubric requires four unique valid dimensions and the transfer version',()=>{
  assert.equal(transferDimensionGrade(TRANSFER_BRIEF_RUBRIC_VERSION,dimensions(4))?.percent,96)
  assert.equal(transferDimensionGrade(FOUR_DIMENSION_LAB_VERSION,dimensions(4)),null)
  assert.equal(transferDimensionGrade(TRANSFER_BRIEF_RUBRIC_VERSION,dimensions(5)),null)
  assert.equal(transferDimensionGrade(TRANSFER_BRIEF_RUBRIC_VERSION,dimensions(3).slice(1)),null)
  assert.equal(transferDimensionGrade(TRANSFER_BRIEF_RUBRIC_VERSION,[...dimensions(3).slice(0,3),dimensions(3)[0]]),null)
  const mixed=dimensions(4);mixed[2].earned=1
  assert.equal(transferDimensionGrade(TRANSFER_BRIEF_RUBRIC_VERSION,mixed)?.percent,75)
})
test('transfer averages latest released attempt per assignment and respects terms/category isolation',()=>{
  const old=entry('old',1,'2026-10-01'),latest=entry('new',4,'2026-10-02'),other={...entry('other',2,'2026-10-03'),assignmentKey:'interactive:other'}
  const data=[latest,old,other,{...entry('lab',0,'2026-10-04'),rubricVersion:FOUR_DIMENSION_LAB_VERSION}, {...entry('wrong-term',0,'2026-10-05'),termId:'term-2'}, {...entry('invalid',4,'2026-10-06'),percent:100}]
  assert.equal(studentTransferTotal(data,'term-1').percent,90.5)
  assert.equal(studentTransferTotal(data,'term-1').counted.length,2)
  assert.equal(studentLabTotal(data,'term-1').percent,50)
  assert.equal(studentTransferTotal(data,'unassigned').percent,null)
})
test('student projection cannot turn a ready private assessment into released evidence',()=>{
  const activity:ResultActivity={key:'interactive:brief',sourceId:TRANSFER_BRIEFS[0].slug,kind:'interactive',title:'Brief',unitIds:['unit-1'],dueAt:'2026-10-28',archived:false,cells:{me:{state:'submitted',label:'Needs review',needsReview:true,assessment:'ready'}}}
  const settings=emptyGradingSettings()
  assert.deepEqual(studentTransferEntries([activity],'me',settings),[])
  assert.equal(studentGradebookRows([activity],'me',settings)[0].grade,null)
  activity.cells.me.transferGrades=[entry('released',3,'2026-10-27')]
  assert.equal(studentTransferEntries([activity],'me',settings).length,1)
  assert.deepEqual(studentLabEntries([activity],'me',settings),[])
  assert.equal('assessment' in studentGradebookRows([activity],'me',settings)[0],false)
})

test('each brief has one coherent scenario, accessible evidence and canonical response IDs',()=>{
 for(const brief of TRANSFER_BRIEFS){
  assert.equal(brief.sections.length,1)
  assert.deepEqual(brief.questions.map(q=>q.id),['brief-a','brief-b','brief-c'])
  const scene=TRANSFER_BRIEF_SCENES[brief.transferBrief!.scene]
  assert.ok(scene.context&&scene.role&&scene.model)
  for(const condition of scene.conditions){
   assert.ok(condition.description.length>50)
   assert.ok(condition.facts.length >= 3 && condition.facts.length <= 4)
   assert.ok(existsSync('public'+condition.image))
   const svg=readFileSync('public'+condition.image,'utf8')
   assert.ok(svg.includes('viewBox="0 0 900 420"'))
   assert.doesNotMatch(svg,/<script|<foreignObject|https?:\/\/(?!www.w3.org)/)
  }
 }
})

test('shuttle uses one acceleration scenario and asks only for its three decision responses',()=>{
 const brief=assignmentBySlug('transfer-brief-shuttle-acceleration')!
 assert.deepEqual(brief.targets,['u1.pick-equation-of-motion'])
 const scene=TRANSFER_BRIEF_SCENES[brief.transferBrief!.scene]
 assert.equal(scene.conditions.length,1)
 assert.deepEqual(scene.conditions[0].facts.map(f=>f.value),['0 m/s','6.0 m/s','0.80 m/s²','18 m'])
 const time=(6-0)/0.8,distance=0.5*0.8*time**2
 assert.equal(time,7.5);assert.equal(distance,22.5);assert.equal(distance-18,4.5)
 assert.match(brief.questions[0].explanation,/7\.5 s/)
 assert.match(brief.questions[0].explanation,/22\.5 m/)
 assert.match(brief.questions[1].explanation,/4\.5 m/)
 assert.match(brief.questions[2].prompt,/one real condition/)
 assert.doesNotMatch(JSON.stringify(scene),/7\.5 s|22\.5 m|4\.5 m/)
 assert.match(brief.targetNote!,/One relevant condition/)
})
