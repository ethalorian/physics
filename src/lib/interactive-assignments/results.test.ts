import {test} from 'node:test'
import assert from 'node:assert/strict'
import {simulationResults} from './results'
import {assignmentBySlug} from './catalog'
import {emptyVelocityState} from './velocity'
import type {Assignment, Work, Submission, Review} from './server'
import type {AiReview, Assessment} from './analytics'
const lesson = assignmentBySlug('simulation-race-track')!
const vectorQuestion = lesson.questions.find(q=>q.id.endsWith('3b'))!.id
const assignment: Assignment = {id: 'a', course_id: 'c', slug: lesson.slug, target_id: 'target', created_at: '', due_on: null}
const students = ['current', 'returned', 'new', 'pending'].map(id => ({id, name: id}))
const state = () => {const s = emptyVelocityState(); for (const q of lesson.questions) s.answers[q.id] = q.answer !== undefined ? String(q.answer) : q.options ? String(q.correct) : 'Reasoning'; return s}
const work: Work[] = ['current', 'returned', 'pending'].map(id => ({assignment_id: 'a', user_id: id, version: id === 'returned' ? 2 : 1, status: id === 'returned' ? 'draft' : 'submitted', state: state(), updated_at: ''}))
const submissions: Submission[] = ['current', 'returned', 'pending'].map(id => ({id: id + '-sub', assignment_id: 'a', user_id: id, version: 1, state: state(), submitted_at: ''}))
const result: Assessment = {level: 3, confidence: 'high', rationale: 'Suggested only', feedback: 'Check evidence', explanation: {status: 'complete', reason: 'Supported'}, items: lesson.questions.filter(q => q.answer === undefined && !q.options && !q.reflection).map(q => ({id: q.id, status: q.id === vectorQuestion ? 'partial' : 'complete', reason: 'Compare components'})), ratings: [{target_slug: lesson.targets[0], level: 3, confidence: 'high', rationale: 'Suggested only', feedback: 'Compare'}], weakpoints: []}
const ai: AiReview[] = ['current', 'returned'].map(id => ({submission_id: id + '-sub', status: 'ready', result, model: 'sample', error: null, locked_until: null, updated_at: ''}))
const reviews: Review[] = [{id: 'r', submission_id: 'returned-sub', target_id: 'target', level: 3, feedback: '', created_at: ''}]
test('simulation overview uses current submitted snapshots; AI never becomes teacher mastery', () => {
  const summary = simulationResults({assignments: [assignment], students, work, submissions, reviews, ai})
  const activity = summary.activities[0]
  assert.equal(activity.submitted, 2); assert.equal(activity.drafts, 1); assert.equal(activity.rated, 0)
  assert.equal(activity.awaiting, 2); assert.equal(activity.aiReady, 1)
  assert.deepEqual(activity.teacherLevels, [0, 0, 0])
  assert.equal(summary.rows.find(r => r.studentId === 'returned')?.analysis, 'none')
  assert.equal(summary.rows.find(r => r.studentId === 'returned')?.ratedTargets, 0)
  assert.equal(summary.rows.find(r => r.studentId === 'new')?.status, 'not-started')
  assert.equal(activity.questions.find(q => q.id === vectorQuestion)?.needsReview, 1)
  assert.equal(activity.questions.find(q => q.id === vectorQuestion)?.pending, 1)
  assert(!activity.questions.some(q => lesson.questions.find(item=>item.id===q.id)?.reflection))
})
test('only explicit teacher ratings count; missing notebooks are evidence flags, not ratings', () => {
  const review: Review = {...reviews[0], submission_id: 'current-sub', level: 2}
  const summary = simulationResults({assignments: [assignment], students, work, submissions, reviews: [review, review], ai})
  assert.deepEqual(summary.activities[0].teacherLevels, [0, 1, 0])
  assert.equal(summary.activities[0].rated, 0)
  assert.equal(summary.rows.find(r=>r.studentId==='current')?.status,'review')
  assert.equal(summary.activities[0].noTrials, 2)
  assert.equal(summary.rows.find(r => r.studentId === 'current')?.ratedTargets, 1)
})
test('no current version means no inherited pattern; non-simulation activities are excluded', () => {
  const changed = work.map(w => ({...w, version: 3}))
  const summary = simulationResults({assignments: [assignment, {...assignment, id: 'other', slug: 'day-3-velocity'}], students, work: changed, submissions, reviews, ai})
  assert.equal(summary.activities.length, 1)
  assert.equal(summary.activities[0].submitted, 0)
  assert(summary.activities[0].questions.every(q => q.assessed === 0 && q.needsReview === 0))
})

test('grade release completes review independently of mastery, while old grades never follow returned work',()=>{
 const summary=simulationResults({assignments:[assignment],students,work,submissions,reviews,ai,grades:[{submission_id:'current-sub',earned:0,possible:37},{submission_id:'returned-sub',earned:30,possible:37}]})
 assert.equal(summary.activities[0].rated,1)
 assert.equal(summary.activities[0].submitted,2)
 assert.equal(summary.activities[0].awaiting,1)
 assert.equal(summary.rows.find(r=>r.studentId==='current')?.grade?.earned,0)
 assert.equal(summary.rows.find(r=>r.studentId==='current')?.ratedTargets,0)
 assert.equal(summary.rows.find(r=>r.studentId==='returned')?.grade,undefined)
})
