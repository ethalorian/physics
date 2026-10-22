import { test } from 'node:test'
import assert from 'node:assert/strict'
import { moveDeadline, quizScheduleError } from './quiz-schedule'
import { weekDates } from './learning-week'

test('regular and vocabulary quizzes use complementary school weekdays', () => {
  for (const [i, day] of weekDates('2026-10-19').entries()) {
    assert.equal(quizScheduleError(day, 'regular') === null, [0, 2, 4].includes(i), day)
    assert.equal(quizScheduleError(day, 'vocabulary') === null, [1, 3].includes(i), day)
  }
  assert.equal(quizScheduleError(null, 'regular'), null)
  assert.match(quizScheduleError('2026-02-30', 'regular')!, /valid/)
  assert.match(quizScheduleError('nonsense', 'vocabulary')!, /valid/)
})
test('quiz validation uses Eastern day, not UTC day or the computer time zone', () => {
  assert.equal(quizScheduleError('2026-10-20T03:59:00.000Z', 'regular'), null) // Monday
  assert.ok(quizScheduleError('2026-10-20T03:59:00.000Z', 'vocabulary'))
  assert.equal(quizScheduleError('2026-12-02T04:59:00.000Z', 'vocabulary'), null) // Tuesday
})
test('calendar moves preserve Eastern due time across DST and allow assignment weekends', () => {
  assert.equal(moveDeadline('2026-10-24T03:59:00.000Z', '2026-11-08'), '2026-11-09T04:59:00.000Z')
  assert.equal(moveDeadline('2026-03-07T04:59:00.000Z', '2026-03-08'), '2026-03-09T03:59:00.000Z')
  assert.equal(moveDeadline(null, '2026-10-24'), '2026-10-25T03:59:00.000Z')
  assert.equal(moveDeadline('2026-10-22', '2026-10-25', true), '2026-10-25')
  assert.throws(() => moveDeadline(null, '2026-02-30'), /valid/)
})
