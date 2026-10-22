import assert from 'node:assert/strict'
import test from 'node:test'
import { assignmentImpact, impactPairs, learningCorrelation, pearson, questionTypeImpact } from './impact'
import { scopeAnalytics } from './model'
import type { AnalyticsDataset, AssignmentExposure, QuestionEvidence, Rating } from './types'

const at = (day: number) => new Date(Date.UTC(2026, 8, day, 16)).toISOString()
const rating = (studentId: string, day: number, level: number, extra: Partial<Rating> = {}): Rating => ({ id: `${studentId}-${day}`, studentId, targetId: 't1', level, at: at(day), teacher: 'teacher', ...extra })
const exposure = (studentId: string, extra: Partial<AssignmentExposure> = {}): AssignmentExposure => ({ id: `submission-${studentId}`, assignmentId: 'quiz:one', title: 'Motion check', kind: 'quiz', studentId, classIds: ['c1'], targetIds: ['t1'], at: at(10), ...extra })
const question = (extra: Partial<QuestionEvidence> = {}): QuestionEvidence => ({ id: 'submission-s1:q1', questionId: 'q1', questionKey: 'saved-q1', assessmentId: 'one', assessment: 'Motion check', classId: 'c1', studentId: 's1', targetId: 't1', kind: 'written', bloom: 'Apply', dok: 2, prompt: 'Find a velocity.', answer: '1', at: at(10), score: 1, possible: 4, reviewedAt: at(11), feedback: '', ...extra })
function dataset(): AnalyticsDataset {
  return { program: 'physics', from: at(1), asOf: at(40), readOnly: true,
    students: Array.from({ length: 10 }, (_, i) => ({ id: `s${i + 1}`, name: `Student ${i + 1}`, classIds: ['c1'] })),
    classes: [{ id: 'c1', name: 'Physics', section: null, teacher: 'teacher', program: 'physics' }],
    targets: ['t1', 't2'].map(id => ({ id, slug: id, statement: id, unitId: id, domain: 'skill' })), units: [],
    ratings: [rating('s1', 5, 1), rating('s1', 15, 2), rating('s1', 20, 3)], assignments: [exposure('s1')],
    questions: [], practice: [], activity: [], feedback: [], coverage: { untaggedQuestions: 0, unscoredQuestions: 0, sources: [] } }
}

test('uses the closest prior rating and first later rating, not the highest later result', () => {
  const data = dataset(); data.ratings.push(rating('s1', 8, 2), rating('s1', 10, 3))
  const { pairs } = impactPairs(data, data.assignments, 14)
  assert.equal(pairs[0].before.at, at(8)); assert.equal(pairs[0].after.at, at(15)); assert.equal(pairs[0].delta, 0)
})
test('rejects immature windows and baselines older than 30 days', () => {
  const data = dataset(); data.asOf = at(20)
  assert.equal(impactPairs(data, data.assignments, 14).awaitingWindow, 1)
  data.asOf = at(40); data.ratings = [rating('s1', -21, 1), rating('s1', 15, 3)]
  assert.equal(impactPairs(data, data.assignments, 14).missingBaseline, 1)
})
test('excludes reviews of any submission to the assignment and conservative generic lesson reviews', () => {
  const data = dataset(); data.assignments.push(exposure('s1', { id: 'submission-retry', at: at(12) }))
  data.ratings[1].source = 'Quiz: Motion · submission submission-retry'
  assert.equal(impactPairs(data, data.assignments, 14).pairs[0].after.at, at(20))
  data.assignments = [exposure('s1', { kind: 'lesson' })]; data.ratings[1].source = 'Lesson evidence review'
  assert.equal(impactPairs(data, data.assignments, 14).pairs[0].after.at, at(20))
})
test('weights students equally rather than students with more skills or repeat submissions', () => {
  const data = dataset(); data.assignments = [exposure('s1', { targetIds: ['t1', 't2'] }), exposure('s1', { id: 'retry', at: at(16) }), exposure('s2')]
  data.ratings = [rating('s1', 5, 1), rating('s1', 15, 3), rating('s1', 5, 1, { targetId: 't2' }), rating('s1', 15, 3, { targetId: 't2' }), rating('s2', 5, 2), rating('s2', 15, 2)]
  const row = assignmentImpact(data, 14)[0]
  assert.equal(row.pairs.length, 3); assert.equal(row.pairedStudents, 2); assert.equal(row.gain, 1); assert.equal(row.eligible, false)
})
test('comparison requires same class, skill, exact baseline and at least five distinct students per group', () => {
  const data = dataset(); data.assignments = data.students.slice(0, 5).map(s => exposure(s.id))
  data.ratings = data.students.flatMap((s, i) => [rating(s.id, 5, 1), rating(s.id, 15, i < 5 ? 3 : 2)])
  let row = assignmentImpact(data, 14)[0]
  assert.equal(row.eligible, true); assert.equal(row.comparison.gap, 1); assert.equal(row.comparison.controls, 5)
  data.ratings.find(r => r.studentId === 's10' && r.at === at(5))!.level = 2
  row = assignmentImpact(data, 14)[0]; assert.equal(row.comparison.controls, 4); assert.equal(row.comparison.gap, null)
  data.students.find(s => s.id === 's9')!.classIds = ['different-class']
  assert.equal(assignmentImpact(data, 14)[0].comparison.controls, 3)
})
test('counts overlapping assignments and preserves unmapped coverage without treating filtered-out skills as missing mappings', () => {
  const data = dataset(); data.assignments.push(exposure('s1', { id: 'another', assignmentId: 'other', at: at(13) }), exposure('s2', { targetIds: ['t2'] }), exposure('s3', { targetIds: [] }))
  assert.equal(impactPairs(data, [data.assignments[0]], 14).pairs[0].otherAssignments, 1)
  assert.equal(impactPairs(data, data.assignments, 14).unmapped, 1)
  const scoped = scopeAnalytics(data, { targetId: 't1' })
  assert.equal(scoped.assignments.length, 2); assert.equal(impactPairs(scoped, scoped.assignments, 14).unmapped, 0)
})
test('question formats overlap while same-question and new-question outcomes remain separate', () => {
  const data = dataset(); data.questions = [question(), question({ id: 'submission-s1:q2', questionKey: 'q2', kind: 'choice' }), question({ id: 'retry:q1', at: at(15), score: 2 }), question({ id: 'new:q1', questionKey: 'novel', assessmentId: 'new', prompt: 'Interpret a different graph.', at: at(16), score: 3 })]
  const rows = questionTypeImpact(data, 14, 'format'), written = rows.find(r => r.title === 'Written reasoning')!
  assert.equal(written.pairedStudents, 1); assert.equal(rows.find(r => r.title === 'Multiple choice')!.pairedStudents, 1)
  assert.equal(written.repeat.gain, 25); assert.equal(written.newQuestion.gain, 50)
})
test('a pending first new response is not skipped; duplicate prompts and missing Bloom labels are not new-question matches', () => {
  const data = dataset(); data.questions = [question(), question({ id: 'new:q1', assessmentId: 'new', prompt: 'A different task', at: at(15), score: null }), question({ id: 'later:q1', assessmentId: 'newer', prompt: 'Another task', at: at(16), score: 4 })]
  assert.equal(questionTypeImpact(data, 14, 'format')[0].newQuestion.gain, null)
  data.questions = [question(), question({ id: 'duplicate:q1', assessmentId: 'new', at: at(15), score: 4 })]
  assert.equal(questionTypeImpact(data, 14, 'format')[0].newQuestion.students, 0)
  data.questions = [question({ bloom: null }), question({ id: 'new:q1', assessmentId: 'new', prompt: 'A different task', at: at(15), score: 4, bloom: null })]
  assert.equal(questionTypeImpact(data, 14, 'format')[0].newQuestion.students, 0)
  assert.equal(questionTypeImpact(data, 14, 'bloom')[0].title, 'Bloom’s not tagged')
})
test('Pearson requires a usable sample and variance; submitted retries count once in correlation', () => {
  assert.equal(pearson([{ x: 1, y: 1 }]), null)
  assert.equal(pearson(Array.from({ length: 5 }, (_, i) => ({ x: 1, y: i }))), null)
  assert.equal(pearson(Array.from({ length: 5 }, (_, i) => ({ x: i, y: i * 2 }))), 1)
  assert.equal(pearson(Array.from({ length: 5 }, (_, i) => ({ x: i, y: -i }))), -1)
  const data = dataset(); data.assignments.push(exposure('s1', { id: 'retry', at: at(16) }))
  assert.equal(learningCorrelation(data).points[0].x, 1)
})
