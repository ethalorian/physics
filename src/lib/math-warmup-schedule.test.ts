import test from 'node:test'
import assert from 'node:assert/strict'
import { isMathWarmupDate, isMathWarmupDay, mathWarmupStreak } from './math-warmup-schedule'

test('warm-ups and planner dates are active only on Tuesday and Thursday', () => {
  for (let day = 11; day <= 17; day++) {
    const date = `2026-10-${day}`
    const expected = day === 13 || day === 15
    assert.equal(isMathWarmupDay(new Date(`${date}T16:00:00Z`)), expected, date)
    assert.equal(isMathWarmupDate(date), expected, date)
  }
})

test('availability changes at Eastern midnight in summer and winter, not UTC midnight', () => {
  for (const [instant, active] of [
    ['2026-10-13T03:59:59Z', false], ['2026-10-13T04:00:00Z', true],
    ['2026-10-14T03:59:59Z', true], ['2026-10-14T04:00:00Z', false],
    ['2026-10-16T03:59:59Z', true], ['2026-10-16T04:00:00Z', false],
    ['2026-12-08T04:59:59Z', false], ['2026-12-08T05:00:00Z', true],
    ['2026-12-09T04:59:59Z', true], ['2026-12-09T05:00:00Z', false],
  ] as const) assert.equal(isMathWarmupDay(new Date(instant)), active, instant)
})

test('streaks skip off days, tolerate an unfinished current task, and break on missed scheduled days', () => {
  const completed = ['2026-10-06T16:00:00Z', '2026-10-08T16:00:00Z', '2026-10-13T16:00:00Z']
  assert.equal(mathWarmupStreak(completed, new Date('2026-10-14T16:00:00Z')), 3)
  assert.equal(mathWarmupStreak(completed, new Date('2026-10-15T16:00:00Z')), 3)
  assert.equal(mathWarmupStreak(completed, new Date('2026-10-16T16:00:00Z')), 0)
  assert.equal(mathWarmupStreak([...completed, '2026-10-15T16:00:00Z'], new Date('2026-10-20T16:00:00Z')), 4)
  assert.equal(mathWarmupStreak([], new Date('2026-10-14T16:00:00Z')), 0)
})

test('streaks cross DST correctly and ignore historical off-day work', () => {
  const completed = ['2026-10-27T16:00:00Z', '2026-10-28T16:00:00Z', '2026-10-30T03:30:00Z', '2026-11-03T16:00:00Z']
  assert.equal(mathWarmupStreak(completed, new Date('2026-11-04T16:00:00Z')), 3)
})
