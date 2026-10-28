import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pendingSubmissionTargets, type LessonMasteryReview } from './lesson-submission-review'

const sub = { id: 'current', user_id: 'student', lesson_id: 'chapter' }
const review: LessonMasteryReview = { user_id: 'student', lesson_id: 'chapter', target_id: 't1', evidence: [{ submissionId: 'current' }] }

test('released mastery clears only the targets assessed on this submission', () => {
  assert.deepEqual(pendingSubmissionTargets(sub, ['t1', 't2'], [review]), ['t2'])
  assert.deepEqual(pendingSubmissionTargets(sub, ['t1', 't2'], [review, { ...review, target_id: 't2' }]), [])
})
test('older attempts, other students and shared targets in another lesson remain pending', () => {
  for (const other of [
    { ...review, evidence: [{ submissionId: 'old' }] },
    { ...review, user_id: 'other' },
    { ...review, lesson_id: 'other' },
    { ...review, target_id: 'other' },
    { ...review, evidence: [{ blockId: 'saved-answer' }] },
  ]) assert.deepEqual(pendingSubmissionTargets(sub, ['t1'], [other]), ['t1'])
})
test('no review or malformed evidence cannot imply a returned assignment', () => {
  for (const evidence of [null, {}, [], [null, 'invalid']]) {
    assert.deepEqual(pendingSubmissionTargets(sub, ['t1'], [{ ...review, evidence }]), ['t1'])
  }
  assert.deepEqual(pendingSubmissionTargets(sub, ['t1'], []), ['t1'])
})
test('matching evidence anywhere in the saved review is recognized once', () => {
  assert.deepEqual(pendingSubmissionTargets(sub, ['t1', 't1'], [{ ...review, evidence: [null, { submissionId: 'current' }] }]), [])
})
