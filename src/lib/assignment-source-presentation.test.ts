import assert from 'node:assert/strict'
import test from 'node:test'
import { assignmentPresentation } from './assignment-presentation'
import { ASSIGNMENT_METADATA } from './interactive-assignments/metadata'
import { matchesSourceType, sourcePresentation, sourceTitle, sourceTypeOptions } from './assignment-source-presentation'

test('all registered lessons keep identical student, teacher, and saved-sequence labels', () => {
  for (const lesson of ASSIGNMENT_METADATA) {
    const student = assignmentPresentation({ id: 'interactive:assignment-id', kind: 'review', title: lesson.title, activityType: lesson.activityType, topicTitle: lesson.topicTitle, courseDay: lesson.day, focusQuestion: lesson.focusQuestion, status: 'To do', complete: false })
    const teacher = sourcePresentation({ kind: 'interactive', sourceId: lesson.slug, title: lesson.title })
    const savedStep = sourcePresentation({ kind: 'interactive', activityKey: 'interactive:' + lesson.slug, title: lesson.title })
    assert.deepEqual(teacher, student, lesson.slug)
    assert.deepEqual(savedStep, student, lesson.slug)
  }
})
test('quiz sources agree across calendar, sequence and review while keeping their identities', () => {
  const cases = [
    { title: 'Day 7 · Quiz: Acceleration', quizSchedule: 'daily' as const, type: 'lesson-quiz' },
    { title: 'Acceleration · Vocabulary check', quizSchedule: 'vocabulary' as const, type: 'vocabulary-quiz' },
    { title: 'Acceleration · Reading check', quizSchedule: 'regular' as const, type: 'reading-check' },
    { title: 'Renamed worksheet checkpoint', pairedKey: 'worksheet:paper-id', activityType: 'worksheet-quiz' as const, type: 'worksheet-quiz' },
  ]
  for (const value of cases) {
    const source = Object.freeze({ kind: 'quiz', key: 'quiz:original-id', sourceId: 'original-id', ...value })
    const p = sourcePresentation(source)
    const student = assignmentPresentation({ ...source, kind: 'quiz', id: source.key, status: 'To do', complete: false })
    assert.equal(p.type, value.type)
    assert.equal(p.label, student.label)
    assert.equal(p.title, student.title)
    assert.equal(source.key, 'quiz:original-id')
  }
})
test('new precise type filters retain old broad links and distinct source routes', () => {
  const foundation = {kind:'interactive',sourceId:'day-3-foundation-velocity',title:'Day 3 · Foundation lab: Velocity'}
  const simulation = {kind:'simulation',sourceId:'simulation-race-track',title:'Race Track'}
  assert.equal(matchesSourceType(foundation,'type:foundation-lab'),true)
  assert.equal(matchesSourceType(foundation,'type:simulation-lab'),false)
  assert.equal(matchesSourceType(foundation,'interactive'),true)
  assert.equal(matchesSourceType(simulation,'interactive'),false)
  assert.equal(matchesSourceType(simulation,'type:simulation-lab'),true)
  assert.deepEqual(sourceTypeOptions([foundation,foundation,simulation]).map(p=>p[1]),['Foundation lab','Simulation lab'])
})
test('generic quizzes mentioning labs or partners are not relabeled', () => {
  assert.equal(sourcePresentation({kind:'quiz',title:'Plan a paired investigation'}).type,'quiz')
  assert.equal(sourcePresentation({kind:'quiz',title:'Foundation ideas'}).type,'quiz')
  assert.equal(sourcePresentation({kind:'quiz',title:'Day 7 · Changing velocity · Paired quiz'}).type,'worksheet-quiz')
})
test('display labels leave persisted sequence notes and dates untouched', () => {
  const step=Object.freeze({activityKey:'interactive:day-7-foundation-acceleration',kind:'interactive',title:'Saved title',purpose:'My classroom goal',notes:'My teaching notes',dueAt:'2026-10-27'})
  const before=JSON.stringify(step)
  assert.equal(sourceTitle(step),'In-class discussion · Course day 7 · Acceleration')
  assert.equal(JSON.stringify(step),before)
})
test('teacher evidence sources do not falsely become scheduled math warm-ups', () => {
  assert.equal(sourcePresentation({kind:'math',title:'Algebra competency'}).label,'Math practice')
  assert.equal(sourcePresentation({kind:'lesson',format:'graphic-novel',title:'Graphic novel · Chapter 4'}).label,'Chapter response')
  assert.equal(sourcePresentation({kind:'reflection',title:'Graphic novel · Chapter 4'}).label,'Chapter response')
  assert.equal(sourcePresentation({kind:'reading',title:'Newton’s laws'}).label,'Reading & response')
  assert.equal(sourcePresentation({kind:'homework',title:'Motion film'}).label,'Video lesson')
})
