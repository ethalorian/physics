import { test } from 'node:test'
import assert from 'node:assert/strict'
import { gradebookStatus } from './gradebook'
import type { ResultCell } from './types'

const reviewed: ResultCell = { state: 'reviewed', label: 'Teacher reviewed', needsReview: false }
test('teacher-reviewed mastery and point grades both display Returned', () => {
  assert.equal(gradebookStatus(reviewed), 'Returned')
  assert.equal(gradebookStatus({ ...reviewed, grade: { earned: 0, possible: 10, version: 'released' } }), 'Returned')
})
test('a private suggestion, partial review or new attempt does not display Returned', () => {
  assert.equal(gradebookStatus({ state: 'submitted', label: 'Submitted', needsReview: true, assessment: 'ready' }), 'Submitted')
  assert.equal(gradebookStatus({ ...reviewed, label: 'Needs review', needsReview: true }), 'Needs review')
  assert.equal(gradebookStatus({ state: 'draft', label: 'In progress', needsReview: false }), 'In progress')
})
test('revision requests remain distinguishable and missing cells remain unassigned', () => {
  assert.equal(gradebookStatus({ state: 'returned', label: 'Revise', needsReview: false }), 'Returned · revision requested')
  assert.equal(gradebookStatus(undefined), 'Not assigned')
})
