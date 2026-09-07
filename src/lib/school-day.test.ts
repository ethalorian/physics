/**
 * Regression tests for the school-day boundary.
 * Run: npm run test:school-day   (tsx --test, Node's built-in runner — no framework dep)
 *
 * The contract under test (src/lib/school-day.ts):
 *  - a "day" is an America/New_York calendar day, not a UTC one
 *  - the day number advances exactly once per ET midnight, DST included
 *  - schoolDayStart is the real instant of ET midnight in both EST and EDT
 *
 * The bug that produced this file: the warm-up rolled over on the UTC day
 * boundary, i.e. 8:00pm Eastern. A student working at 8:30pm got tomorrow's
 * problem. The UTC-evening cases below are that bug, pinned.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  SCHOOL_TZ,
  schoolDayKey,
  schoolDayKeyFromNumber,
  schoolDayNumber,
  schoolDayStart,
  schoolDayWeekday,
} from './school-day'

const at = (iso: string) => new Date(iso)

test('the school timezone is Eastern', () => {
  assert.equal(SCHOOL_TZ, 'America/New_York')
})

test('the 8pm bug: a UTC-evening instant is still the PREVIOUS ET day', () => {
  // 2026-09-04 23:30 UTC = 7:30pm EDT on 2026-09-04. Under the old UTC-day
  // math this was already 2026-09-04 (UTC) too — the break is one hour later:
  assert.equal(schoolDayKey(at('2026-09-04T23:30:00Z')), '2026-09-04')
  // 8:30pm EDT = 00:30 UTC the NEXT day. This is the case that served
  // tomorrow's problem; it must still read as 2026-09-04.
  assert.equal(schoolDayKey(at('2026-09-05T00:30:00Z')), '2026-09-04')
  assert.equal(schoolDayNumber(at('2026-09-05T00:30:00Z')), schoolDayNumber(at('2026-09-04T14:00:00Z')))
  // 11:59:59pm EDT is still the 4th; one second later is the 5th.
  assert.equal(schoolDayKey(at('2026-09-05T03:59:59Z')), '2026-09-04')
  assert.equal(schoolDayKey(at('2026-09-05T04:00:00Z')), '2026-09-05')
})

test('the day number increments exactly once across ET midnight', () => {
  const before = schoolDayNumber(at('2026-09-05T03:59:59Z')) // 11:59:59pm EDT
  const after = schoolDayNumber(at('2026-09-05T04:00:00Z')) //  12:00:00am EDT
  assert.equal(after - before, 1)
  // ...and does not move again anywhere else inside that ET day.
  for (const iso of ['2026-09-05T04:00:01Z', '2026-09-05T12:00:00Z', '2026-09-06T03:59:59Z']) {
    assert.equal(schoolDayNumber(at(iso)), after, iso)
  }
})

test('day number is stable within a day and consecutive across days', () => {
  assert.equal(
    schoolDayNumber(at('2026-09-04T13:00:00Z')), // 9am EDT
    schoolDayNumber(at('2026-09-05T01:00:00Z')), // 9pm EDT, same ET day
  )
  assert.equal(
    schoolDayNumber(at('2026-09-06T12:00:00Z')) - schoolDayNumber(at('2026-09-05T12:00:00Z')),
    1,
  )
  // The number round-trips back to the key it was derived from.
  for (const iso of ['2026-01-15T20:00:00Z', '2026-07-04T18:00:00Z', '2026-09-05T00:30:00Z']) {
    assert.equal(schoolDayKeyFromNumber(schoolDayNumber(at(iso))), schoolDayKey(at(iso)), iso)
  }
})

test('EST and EDT dates both map correctly (no hardcoded offset)', () => {
  // January = EST (UTC-5). 2026-01-16 00:30 UTC = 7:30pm EST on the 15th.
  assert.equal(schoolDayKey(at('2026-01-16T00:30:00Z')), '2026-01-15')
  assert.equal(schoolDayKey(at('2026-01-16T04:59:59Z')), '2026-01-15') // 11:59:59pm EST
  assert.equal(schoolDayKey(at('2026-01-16T05:00:00Z')), '2026-01-16') // 12:00am EST
  // July = EDT (UTC-4).
  assert.equal(schoolDayKey(at('2026-07-05T03:59:59Z')), '2026-07-04') // 11:59:59pm EDT
  assert.equal(schoolDayKey(at('2026-07-05T04:00:00Z')), '2026-07-05') // 12:00am EDT
})

test('schoolDayStart lands on true ET midnight in EST and in EDT', () => {
  // EST: midnight ET = 05:00 UTC.
  assert.equal(schoolDayStart(at('2026-01-15T18:00:00Z')).toISOString(), '2026-01-15T05:00:00.000Z')
  // EDT: midnight ET = 04:00 UTC.
  assert.equal(schoolDayStart(at('2026-09-04T18:00:00Z')).toISOString(), '2026-09-04T04:00:00.000Z')
  // The 8:30pm-EDT instant must resolve to the START of the 4th, not the 5th.
  assert.equal(schoolDayStart(at('2026-09-05T00:30:00Z')).toISOString(), '2026-09-04T04:00:00.000Z')
  // schoolDayStart is always <= now, and never more than 25h before it.
  for (const iso of ['2026-03-08T12:00:00Z', '2026-11-01T12:00:00Z', '2026-09-05T00:30:00Z']) {
    const now = at(iso)
    const start = schoolDayStart(now)
    assert.ok(start.getTime() <= now.getTime(), `start<=now ${iso}`)
    assert.ok(now.getTime() - start.getTime() < 25 * 3_600_000, `<25h ${iso}`)
    assert.equal(schoolDayKey(start), schoolDayKey(now), `same day ${iso}`)
  }
})

test('DST changeover days: spring forward and fall back', () => {
  // 2026-03-08 is the spring-forward day (2am EST → 3am EDT). Its midnight is
  // still EST, so 05:00 UTC.
  assert.equal(schoolDayStart(at('2026-03-08T16:00:00Z')).toISOString(), '2026-03-08T05:00:00.000Z')
  assert.equal(schoolDayKey(at('2026-03-08T16:00:00Z')), '2026-03-08')
  // The 23-hour day still advances the number by exactly 1.
  assert.equal(
    schoolDayNumber(at('2026-03-09T12:00:00Z')) - schoolDayNumber(at('2026-03-08T12:00:00Z')),
    1,
  )
  // 2026-11-01 is the fall-back day (2am EDT → 1am EST). Its midnight is
  // still EDT, so 04:00 UTC.
  assert.equal(schoolDayStart(at('2026-11-01T16:00:00Z')).toISOString(), '2026-11-01T04:00:00.000Z')
  // The 25-hour day also advances the number by exactly 1 — and the repeated
  // 1am hour is the same ET day on both passes.
  assert.equal(schoolDayKey(at('2026-11-01T05:30:00Z')), '2026-11-01') // 1:30am EDT
  assert.equal(schoolDayKey(at('2026-11-01T06:30:00Z')), '2026-11-01') // 1:30am EST (again)
  assert.equal(
    schoolDayNumber(at('2026-11-02T12:00:00Z')) - schoolDayNumber(at('2026-11-01T12:00:00Z')),
    1,
  )
})

test('schoolDayWeekday reads the ET weekday, for the school-day streak walk', () => {
  // 2026-09-04 is a Friday; 09-05 Sat, 09-06 Sun, 09-07 Mon.
  const fri = schoolDayNumber(at('2026-09-04T18:00:00Z'))
  assert.equal(schoolDayWeekday(fri), 5)
  assert.equal(schoolDayWeekday(fri + 1), 6)
  assert.equal(schoolDayWeekday(fri + 2), 0)
  assert.equal(schoolDayWeekday(fri + 3), 1)
  // The 8:30pm-Friday instant is still a Friday, not a Saturday.
  assert.equal(schoolDayWeekday(schoolDayNumber(at('2026-09-05T00:30:00Z'))), 5)
})
