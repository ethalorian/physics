import { test } from 'node:test'
import assert from 'node:assert/strict'
import { vocabularyProgress, type VocabMasteryTask, type VocabMasteryReview, type VocabEvidenceCheck } from './vocab-mastery'
import { matchesVocabOverviewFilter, vocabularyAssignmentCell, vocabularyOverviewRows, vocabularyWordCell } from './vocab-overview'

const task: VocabMasteryTask = { id: 'task', course_id: 'course', target_id: 'target', title: 'Motion', note: '', due_on: null,
  created_at: new Date().toISOString(), active: true, term_ids: ['word'], words: [], student_ids: ['a', 'b'], threshold: 80,
  min_checks: 1, check_mode: 'recognition', courseLabel: 'Physics', program: 'physics', progress: [] }
const check: VocabEvidenceCheck = { id: 'check', task_id: 'task', user_id: 'a', completed_at: new Date().toISOString(),
  review_version: 0, result: [{ term_id: 'word', response: 'position', correct: true, supports: [] }] }
const review: VocabMasteryReview = { id: 'review', task_id: 'task', user_id: 'a', target_id: 'target', level: 3,
  evidence_key: 'check:0', created_at: new Date().toISOString(), reviewer_email: 'teacher', note: '' }
const progress = (checks: VocabEvidenceCheck[] = [], reviews: VocabMasteryReview[] = []) =>
  ({ studentId: 'a', name: 'Avery', ...vocabularyProgress(task, checks, reviews) })

test('full class includes unassigned students without inventing evidence or a grade', () => {
  const rows = vocabularyOverviewRows({ tasks: [{ ...task, progress: [progress([check])] }], targets: [],
    students: [{ studentId: 'a', name: 'Avery' }, { studentId: 'b', name: 'Blair' }] })
  assert.equal(rows[0].toReview, 1)
  assert.equal(rows[0].rated, 0)
  assert.equal(rows[1].assigned, 0)
  assert.equal(rows[1].noChecks, false)
  assert.equal(rows[1].cells[0].progress, undefined)
  assert.equal(matchesVocabOverviewFilter(rows[1], 'unassigned'), true)
})

test('fully rated means every assigned task has a current rating, not every class task', () => {
  const a = { ...task, progress: [progress([check], [review])] }
  const b = { ...task, id: 'task2', progress: [{ ...progress(), studentId: 'b', name: 'Blair' }] }
  const rows = vocabularyOverviewRows({ tasks: [a, b], targets: [] })
  assert.equal(rows.find(r => r.studentId === 'a')?.fullyRated, true)
  assert.equal(rows.find(r => r.studentId === 'b')?.fullyRated, false)
  assert.equal(rows.find(r => r.studentId === 'b')?.noChecks, true)
})

test('new evidence preserves the prior teacher rating while reopening review', () => {
  const s = progress([check, { ...check, id: 'new-check' }], [review])
  assert.deepEqual(vocabularyAssignmentCell(s), { label: '3 · Got it', detail: 'New evidence to rate', tone: 'review' })
  const row = vocabularyOverviewRows({ tasks: [{ ...task, progress: [s] }], targets: [] })[0]
  assert.equal(row.fullyRated, false)
  assert.equal(matchesVocabOverviewFilter(row, 'review'), true)
})

test('unscored writing is awaiting review, never zero accuracy or a practice failure', () => {
  const s = progress([{ ...check, result: [{ ...check.result![0], correct: null }] }])
  assert.equal(vocabularyWordCell(s, 'word').label, 'Review answer')
  const row = vocabularyOverviewRows({ tasks: [{ ...task, progress: [s] }], targets: [] })[0]
  assert.equal(row.toReview, 1)
  assert.equal(row.needPractice, 0)
})

test('word goals and teacher judgments are independently labeled', () => {
  const scored = progress([check])
  assert.equal(vocabularyWordCell(scored, 'word').label, '100%')
  assert.equal(vocabularyWordCell(scored, 'word').detail, 'Goal met')
  assert.equal(vocabularyAssignmentCell(scored).label, 'Ready to rate')
  assert.equal(vocabularyWordCell(progress(), 'word').detail, 'Not checked')
  const lowRating = progress([check], [{ ...review, level: 2 }])
  const row = vocabularyOverviewRows({ tasks: [{ ...task, progress: [lowRating] }], targets: [] })[0]
  assert.equal(row.needPractice, 1)
  assert.equal(row.fullyRated, true)
})
