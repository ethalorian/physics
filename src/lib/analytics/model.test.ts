import assert from 'node:assert/strict'
import test from 'node:test'
import { bloomSummaries, engagementSummary, feedbackFollowUps, focusStudents, questionSummary, scopeAnalytics, skillGrowth, studentSummaries, weeklyScores } from './model'
import { deviceCategory, normalizeQuestions } from './normalize'
import type { AnalyticsDataset, QuestionEvidence } from './types'
import type { QuizSubmission, QuizReview } from '@/lib/quizzes/types'

const at = (day: number) => `2026-10-${String(day).padStart(2, '0')}T16:00:00.000Z`
function question(overrides: Partial<QuestionEvidence> = {}): QuestionEvidence {
  return { id: 'q1', questionKey: 'same-question', questionId: 'item', assessmentId: 'quiz', assessment: 'Motion', classId: 'c1', studentId: 's1', targetId: 't1', kind: 'written', bloom: 'Apply', dok: 2, prompt: 'Find velocity.', answer: '1 m/s', at: at(2), score: 1, possible: 4, reviewedAt: null, feedback: '', ...overrides }
}
function dataset(): AnalyticsDataset {
  return { program: 'physics', from: at(1), asOf: at(17), readOnly: true,
    classes: [{ id: 'c1', name: 'Physics A', section: null, teacher: 'a@example.test', program: 'physics' }, { id: 'c2', name: 'Physics B', section: null, teacher: 'b@example.test', program: 'physics' }],
    students: [{ id: 's1', name: 'One', classIds: ['c1', 'c2'] }, { id: 's2', name: 'Two', classIds: ['c2'] }, { id: 's3', name: 'Three', classIds: ['c1'] }],
    targets: [{ id: 't1', slug: 'velocity', statement: 'Find velocity', unitId: 'u1', domain: 'skill' }, { id: 't2', slug: 'forces', statement: 'Model forces', unitId: 'u2', domain: 'reasoning' }], units: [{ id: 'u1', name: 'Motion' }, { id: 'u2', name: 'Forces' }],
    ratings: [{ id: 'r0', studentId: 's1', targetId: 't1', level: 3, at: '2026-09-01T16:00:00.000Z', teacher: 'a@example.test' }, { id: 'r1', studentId: 's1', targetId: 't1', level: 1, at: at(2), teacher: 'a@example.test' }, { id: 'r2', studentId: 's1', targetId: 't1', level: 3, at: at(12), teacher: 'a@example.test' }, { id: 'r3', studentId: 's1', targetId: 't2', level: 1, at: at(2), teacher: 'a@example.test' }, { id: 'r4', studentId: 's1', targetId: 't2', level: 2, at: at(12), teacher: 'a@example.test' }],
    questions: [question(), question({ id: 'q2', at: at(10), score: 3 }), question({ id: 'q3', studentId: 's2', classId: 'c2', questionKey: 'other-question', score: null, bloom: null })],
    assignments: [], practice: [], feedback: [], activity: [], coverage: { untaggedQuestions: 1, unscoredQuestions: 1, sources: [] } }
}

test('mastery retains full-history recency weighting while growth pairs only in-window observations', () => {
  const row = skillGrowth(dataset()).find(r => r.targetId === 't1')!
  assert.ok(Math.abs(row.current! - 2.52) < 1e-9)
  assert.equal(row.first, 1); assert.equal(row.latest, 3); assert.equal(row.delta, 2); assert.equal(row.observations, 2)
})
test('improvement and persistent struggle overlap without turning missing evidence into zero', () => {
  const data = dataset(), student = studentSummaries(data)[0]
  assert.equal(student.improving, true); assert.equal(student.attention, true)
  assert.equal(student.current === 0, false); assert.equal(studentSummaries(data)[2].current, null)
  assert.deepEqual(focusStudents(data, 'missing').map(s => s.id), ['s3', 's2'])
})
test('one rating or tied timestamps never establishes growth or persistence', () => {
  const data = dataset(); data.ratings = data.ratings.slice(1, 2)
  assert.equal(skillGrowth(data)[0].delta, null)
  data.ratings.push({ ...data.ratings[0], id: 'tie', level: 2 })
  assert.equal(skillGrowth(data)[0].delta, null); assert.equal(skillGrowth(data)[0].persistent, false)
})
test('class and unit filters scope questions by actual class and mastery by enrolled students', () => {
  const scoped = scopeAnalytics(dataset(), { classId: 'c1', unitId: 'u1' })
  assert.deepEqual(scoped.students.map(s => s.id), ['s1', 's3'])
  assert.ok(scoped.questions.every(q => q.classId === 'c1' && q.targetId === 't1'))
  assert.ok(scoped.ratings.every(r => r.targetId === 't1'))
  assert.equal(scopeAnalytics(dataset(), { teacher: 'unknown' }).students.length, 0)
})
test('a multiply enrolled student is counted once in the overall roster', () => {
  assert.equal(scopeAnalytics(dataset(), {}).students.length, 3)
  assert.equal(scopeAnalytics(dataset(), { classId: 'c2' }).students.length, 2)
})
test('question growth uses matched scored pairs and keeps unscored work out of means', () => {
  const result = questionSummary(dataset().questions)
  assert.equal(result.score, 75); assert.equal(result.first, 25); assert.equal(result.latest, 75)
  assert.equal(result.delta, 50); assert.equal(result.pairs, 1); assert.equal(result.students, 1); assert.equal(result.unscored, 1)
  assert.equal(questionSummary([question({ score: null })]).score, null)
  assert.equal(questionSummary([question({ score: 0 })]).score, 0)
})
test('all six Bloom processes exist and missing classifications do not become Remember', () => {
  const rows = bloomSummaries(dataset())
  assert.equal(rows.length, 6); assert.equal(rows[0].score, null); assert.equal(rows[2].score, 75)
  assert.equal(rows.reduce((n, r) => n + r.submissions, 0), 2)
})
test('feedback follow-up requires later submission, even when an earlier retry was scored later', () => {
  const data = dataset(); data.questions = [question({ feedback: 'Use displacement.', reviewedAt: at(7) }), question({ id: 'early', at: at(5), score: 4, reviewedAt: at(9) }), question({ id: 'after', at: at(8), score: 3 })]
  const row = feedbackFollowUps(data)[0]
  assert.equal(row.after?.id, 'after'); assert.equal(row.delta, 50)
})
test('the first later unscored retry is pending, not skipped in favor of a successful later one', () => {
  const data = dataset(); data.questions = [question({ feedback: 'Try again.', reviewedAt: at(3) }), question({ id: 'pending', at: at(4), score: null }), question({ id: 'success', at: at(5), score: 4 })]
  assert.equal(feedbackFollowUps(data)[0].after?.id, 'pending'); assert.equal(feedbackFollowUps(data)[0].delta, null)
})
test('different-question evidence must share student, skill, Bloom, and class', () => {
  const data = dataset(); data.questions = [question({ feedback: 'Try again.', reviewedAt: at(3) }), question({ id: 'wrong-class', questionId: 'two', questionKey: 'two', classId: 'c2', at: at(4) }), question({ id: 'correct', questionId: 'two', questionKey: 'two', at: at(5) })]
  assert.equal(feedbackFollowUps(data)[0].nextQuestion?.id, 'correct')
})
test('weekly gaps remain missing and a changed question mix is not treated as paired growth', () => {
  const data = dataset(); data.questions = [question(), question({ id: 'new', questionKey: 'new', at: at(10), score: 4 })]
  const rows = weeklyScores(data)
  assert.equal(rows.at(-1)?.score, null); assert.equal(questionSummary(data.questions).delta, null)
})
test('normalization preserves snapshot demand and separates changed rubrics, prompts, and score scales', () => {
  const snapshot = { id: 'quiz', course_id: 'c1', title: 'Quiz', questions: [{ id: 'item', kind: 'written', prompt: 'Explain velocity.', target_id: 't1', points: 4, demand: { blooms: 'Analyze', dok: 2, evidence: 'Use a graph.' } }] } as QuizSubmission['snapshot']
  const submissions: QuizSubmission[] = [{ id: 'sub1', quiz_id: 'quiz', user_id: 's1', answers: { item: 'Change over time.' }, snapshot, submitted_at: at(2) }, { id: 'sub2', quiz_id: 'quiz', user_id: 's1', answers: {}, snapshot: { ...snapshot, questions: [{ ...snapshot.questions[0], points: 5 }] }, submitted_at: at(4) }]
  const reviews: QuizReview[] = [{ id: 'review', submission_id: 'sub1', decision: 'graded', scores: { item: 0 }, reviewed_at: at(3), question_notes: { item: 'State the quantities.' }, ratings: {}, note: '', earned: 0, possible: 4, grade_mode: 'numeric', grade_value: null }]
  const rows = normalizeQuestions(submissions, reviews)
  assert.equal(rows[0].bloom, 'Analyze'); assert.equal(rows[0].score, 0); assert.equal(rows[1].score, null)
  assert.notEqual(rows[0].questionKey, rows[1].questionKey)
  assert.equal(questionSummary(rows).pairs, 0)
  assert.equal(normalizeQuestions([submissions[0]], [{ ...reviews[0], scores: { item: 9 } }])[0].score, null)
})
test('activity is counted in school timezone, without inferring geographic location', () => {
  const data = dataset(); data.activity = [{ studentId: 's1', at: '2026-10-05T02:00:00.000Z', source: 'lesson_view', device: 'Computer' }]
  const summary = engagementSummary(data)
  assert.equal(summary.cells.find(c => c.day === 'Sun' && c.hour === 22)?.students, 1)
  assert.equal(summary.active, 1)
  assert.equal(deviceCategory(null), 'Unknown'); assert.equal(deviceCategory('iPhone Mobile'), 'Mobile'); assert.equal(deviceCategory('CrOS'), 'Computer')
})

test('released choice scores use the saved answer key and revision requests remain unscored', () => {
  const snapshot: QuizSubmission['snapshot'] = { id: 'quiz', course_id: 'c1', title: 'Choice quiz', kind: 'mixed', instructions: '', grade_mode: 'numeric', due_at: null, status: 'published', version: 1, student_ids: null, source_quiz_id: null, questions: [{ id: 'item', kind: 'choice', prompt: 'Select a vector.', points: 2, target_id: 't1', options: ['Distance', 'Displacement'], correct_index: 1 }] }
  const submission: QuizSubmission = { id: 's', quiz_id: 'quiz', user_id: 's1', answers: { item: '1' }, snapshot, submitted_at: at(2) }
  const review: QuizReview = { id: 'r', submission_id: 's', decision: 'graded', scores: {}, ratings: {}, note: 'Explain the direction.', question_notes: {}, earned: 2, possible: 2, grade_mode: 'numeric', grade_value: null, reviewed_at: at(3) }
  assert.equal(normalizeQuestions([submission], [review])[0].score, 2)
  assert.equal(normalizeQuestions([submission], [review])[0].answer, 'Displacement')
  assert.equal(normalizeQuestions([{ ...submission, answers: { item: '0' } }], [review])[0].score, 0)
  assert.equal(normalizeQuestions([submission], [{ ...review, decision: 'returned' }])[0].score, null)
  assert.equal(normalizeQuestions([submission], [])[0].score, null)
})
