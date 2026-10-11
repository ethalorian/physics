import test from 'node:test'
import assert from 'node:assert/strict'
import {quizDueDateChange, sameQuizDueDate, localQuizDueDate} from './due-date'

test('accepts a real UTC deadline or no deadline', () => {
  for (const due_at of [null, '2026-09-29T17:30:00.000Z']) assert.deepEqual(quizDueDateChange({due_at, version: 2}), {due_at, version: 2})
})
test('rejects impossible dates, missing time zones, stale-version shapes and non-scheduling fields', () => {
  for (const due_at of [undefined, '', 0, '2026-02-30T12:00:00.000Z', '2026-09-29T13:00', 'tomorrow']) assert.throws(() => quizDueDateChange({due_at, version: 2}))
  for (const version of [undefined, '2', -1, 0, 2.5, Infinity, 2147483647]) assert.throws(() => quizDueDateChange({due_at: null, version}))
  for (const field of ['questions', 'status', 'student_ids', 'answers']) assert.throws(() => quizDueDateChange({due_at: null, version: 2, [field]: []}))
})
test('compares database timestamp offsets as instants and presents local input time', () => {
  assert(sameQuizDueDate('2026-09-29T13:30:00+00:00', '2026-09-29T09:30:00-04:00'))
  assert(!sameQuizDueDate('2026-09-29T13:30:00+00:00', null))
  assert.equal(localQuizDueDate(null), '')
  const value = '2026-09-29T17:30:00.000Z'
  assert.equal(new Date(localQuizDueDate(value)).toISOString(), value)
})
