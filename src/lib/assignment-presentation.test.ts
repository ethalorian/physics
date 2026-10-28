import test from 'node:test'
import assert from 'node:assert/strict'
import { assignmentPresentation, assignmentStatus } from './assignment-presentation'
import { assignmentMetadata } from './interactive-assignments/metadata'
import { ALL_ASSIGNMENTS, isLabAssignment } from './interactive-assignments/catalog'
import type { LearningActivity } from './learning-week'

const item = (patch: Partial<LearningActivity> = {}): LearningActivity => ({ id:'interactive:example',kind:'review',title:'Day 7 · Acceleration',href:'/interactive-assignments/example',due:'2026-10-30',complete:false,status:'To do',action:'Open assignment',...patch })

test('every foundation uses the authored lab designation, title and course day', () => {
  for (const lesson of ALL_ASSIGNMENTS.filter(a=>a.foundation)) {
    const metadata = assignmentMetadata(lesson.slug)!
    const presentation = assignmentPresentation(item({title:metadata.title,activityType:metadata.activityType,topicTitle:metadata.topicTitle,focusQuestion:metadata.focusQuestion,courseDay:metadata.day}))
    assert.equal(presentation.type,isLabAssignment(lesson)?'foundation-lab':'foundation')
    assert.equal(presentation.day,lesson.day)
    assert.equal(presentation.lane,isLabAssignment(lesson)?'investigate':'learn')
    assert.equal(presentation.title,lesson.title.replace(/^Day \d+ · Foundation(?: lab)?: /,''))
  }
})
test('simulation investigations retain their scientific question separately from the short name', () => {
  const metadata=assignmentMetadata('simulation-uniformly-accelerated-motion')!
  const result=assignmentPresentation(item({title:metadata.title,activityType:metadata.activityType,topicTitle:metadata.topicTitle,focusQuestion:metadata.focusQuestion,courseDay:metadata.day}))
  assert.equal(result.type,'simulation-lab')
  assert.equal(result.title,'Acceleration Studio')
  assert.match(result.question!,/positive velocity.*negative acceleration/)
  assert.equal(result.lane,'investigate')
})
test('worksheet-linked, lesson, reading and vocabulary quizzes stay distinguishable', () => {
  const cases = [
    { title:'Day 7 · Changing velocity · Paired quiz',activityType:'worksheet-quiz' as const,label:'Worksheet quiz',short:'Changing velocity' },
    { title:'Day 7 · Quiz: Acceleration',quizSchedule:'daily' as const,label:'Lesson quiz',short:'Acceleration' },
    { title:'Acceleration · Reading check',label:'Reading check',short:'Acceleration' },
    { title:'Acceleration · Vocabulary check',quizSchedule:'vocabulary' as const,label:'Vocabulary quiz',short:'Acceleration' },
  ]
  for (const scenario of cases) {const result=assignmentPresentation(item({kind:'quiz',...scenario}));assert.equal(result.label,scenario.label);assert.equal(result.title,scenario.short);assert.equal(result.lane,'quizzes')}
})
test('display formatting preserves source identity, date, full name and completion', () => {
  const source=item({title:'Day 7 · Quiz: Acceleration',kind:'quiz',quizSchedule:'daily',complete:true})
  const before=structuredClone(source)
  assignmentPresentation(source);assignmentStatus(source)
  assert.deepEqual(source,before)
})
test('locks remain explicit even for a submitted review and paper is a hand-in', () => {
  assert.equal(assignmentStatus(item({complete:true,status:'Submitted',prerequisiteText:'Submit the foundation first.'})),'Locked · finish required work')
  assert.equal(assignmentStatus(item({kind:'worksheet',status:'Awaiting paper'})),'Hand in to your teacher')
  assert.equal(assignmentStatus(item({status:'Paper received',complete:true})),'Paper received')
})
test('ordinary titles stay intact and practice is distinct from assessment', () => {
  assert.equal(assignmentPresentation(item({title:'Why is velocity not speed?'})).title,'Why is velocity not speed?')
  assert.equal(assignmentPresentation(item()).type,'daily-review')
  assert.equal(assignmentPresentation(item({id:'review:unit-1'})).type,'unit-review')
  assert.equal(assignmentPresentation(item({kind:'vocabulary'})).type,'vocabulary')
  assert.equal(assignmentPresentation(item({kind:'lesson',title:'Graphic novel · Chapter 1: Before the Bell'})).type,'chapter-response')
})
