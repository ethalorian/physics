import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applySuggestionStatuses, submissionReviewQueue } from './model'
import type { ResultActivity } from './types'

const students = [{ id: 'student', name: 'Fictional Student' }]
function warmups(): ResultActivity {
  return { key: 'math:c1', kind: 'math', sourceId: 'c1', title: 'Math practice', unitIds: [], crossUnit: true, dueAt: null, archived: false, cells: {
    student: { state: 'submitted', label: 'Submitted', needsReview: true, submissionId: 'first', reviewItems: ['first', 'second', 'third'].map((id, i) => ({ id: 'math:' + id, submittedAt: '2026-10-' + (10 + i) })) },
  } }
}
test('each pending warm-up retains its own status and remains awaiting a teacher decision', () => {
  const activity = warmups()
  applySuggestionStatuses([activity], [
    { source: 'math', source_id: 'first', version: 'v1', status: 'ready' },
    { source: 'math', source_id: 'second', version: 'v2', status: 'error' },
    { source: 'math', source_id: 'third', version: 'v3', status: 'processing' },
  ])
  const queue = submissionReviewQueue([activity], students)
  assert.deepEqual(queue.map(row => [row.cell.submissionId, row.cell.assessment]), [['first', 'ready'], ['second', 'error'], ['third', 'processing']])
  assert.equal(queue.length, 3)
  assert(queue.every(row => row.cell.needsReview && !row.cell.grade && !row.cell.feedback && !row.cell.releasedAt))
})
test('missing suggestions do not inherit another submission or source status', () => {
  const activity = warmups()
  applySuggestionStatuses([activity], [
    { source: 'math', source_id: 'first', version: 'v1', status: 'ready' },
    { source: 'lesson', source_id: 'second', version: 'v2', status: 'ready' },
  ])
  assert.deepEqual(submissionReviewQueue([activity], students).map(row => row.cell.assessment), ['ready', undefined, undefined])
})
test('multiple competencies still list each submission once with its own latest suggestion', () => {
  const first = warmups(), second = { ...warmups(), key: 'math:c2', sourceId: 'c2' }
  applySuggestionStatuses([first, second], [
    { source: 'math', source_id: 'second', version: 'old', status: 'error' },
    { source: 'math', source_id: 'second', version: 'revision', status: 'ready' },
  ])
  const queue = submissionReviewQueue([first, second], students)
  assert.equal(queue.length, 3)
  assert.equal(queue.find(row => row.cell.submissionId === 'second')?.cell.assessment, 'ready')
})
test('versioned non-math suggestions retain the current-version guard', () => {
  const activity = warmups()
  activity.kind = 'vocabulary'
  activity.cells.student = { state: 'submitted', label: 'Submitted', needsReview: true, submissionId: 'check', assessmentSource: 'checkpoint', assessmentVersion: 'current' }
  applySuggestionStatuses([activity], [
    { source: 'checkpoint', source_id: 'check', version: 'current', status: 'queued' },
    { source: 'checkpoint', source_id: 'check', version: 'old', status: 'ready' },
  ])
  assert.equal(submissionReviewQueue([activity], students)[0].cell.assessment, 'queued')
})
