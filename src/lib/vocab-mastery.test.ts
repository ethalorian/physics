import { test } from 'node:test'
import assert from 'node:assert/strict'
import { evidenceIdentity, vocabularyProgress, type VocabEvidenceCheck, type VocabMasteryReview } from './vocab-mastery'
import type { VocabTask } from './vocab-learning'

const task = { id: 'task', target_id: 'knowledge', term_ids: ['word'], threshold: 80, min_checks: 2, task_kind: 'practice' } as VocabTask
const check: VocabEvidenceCheck = { id: 'check', task_id: 'task', user_id: 'student', completed_at: '2026-09-16T12:00:00Z', review_version: 0, result: [{ term_id: 'word', correct: true, response: 'speed', supports: [] }] }
const review = { id: 'review', task_id: 'task', user_id: 'student', target_id: 'knowledge', level: 2, evidence_key: 'check:0', created_at: '2026-09-16T13:00:00Z' } as VocabMasteryReview
test('practice accuracy cannot create a mastery rating', () => {
  const s = vocabularyProgress(task, [check], [])
  assert.equal(s.accuracy, 100); assert.equal(s.status, 'pending'); assert.equal(s.review, null)
})
test('only completed checks count as evidence', () => {
  const s = vocabularyProgress(task, [{ ...check, completed_at: null }], [])
  assert.equal(s.status, 'no-evidence'); assert.equal(s.accuracy, null); assert.equal(s.evidenceKey, '')
})
test('new checks and reviewed quiz versions reopen review, unchanged evidence stays rated', () => {
  assert.equal(vocabularyProgress(task, [check], [review]).status, 'rated')
  assert.equal(vocabularyProgress(task, [{ ...check, review_version: 1 }], [review]).status, 'pending')
  assert.equal(vocabularyProgress(task, [check, { ...check, id: 'check2' }], [review]).status, 'pending')
  assert.equal(vocabularyProgress({ ...task, target_id: 'different' }, [check], [review]).review, null)
})
test('unreviewed writing is not incorrect and requires quiz review', () => {
  const s = vocabularyProgress({ ...task, task_kind: 'quiz' }, [{ ...check, result: [{ ...check.result![0], correct: null }] }], [])
  assert.equal(s.accuracy, null); assert.equal(s.status, 'quiz-review'); assert.equal(s.quiz?.score, null)
})
test('identity is stable across row order', () => {
  assert.equal(evidenceIdentity([check, { ...check, id: 'aaa', review_version: 2 }]), 'aaa:2,check:0')
})
