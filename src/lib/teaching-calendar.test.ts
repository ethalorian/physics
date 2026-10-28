import assert from 'node:assert/strict'
import test from 'node:test'
import { teachingWeek, teachingWeeks, unassignCalendarAssignment } from './teaching-calendar'

test('a complete teaching week includes weekends across month, year and daylight-saving boundaries', () => {
  for (const [day, start, end] of [
    ['2026-10-27', '2026-10-26', '2026-11-01'],
    ['2026-11-01', '2026-10-26', '2026-11-01'],
    ['2027-01-01', '2026-12-28', '2027-01-03'],
    ['2026-03-08', '2026-03-02', '2026-03-08'],
  ]) {
    const days = teachingWeek(day)
    assert.equal(days.length, 7)
    assert.equal(new Set(days).size, 7)
    assert.equal(days[0], start)
    assert.equal(days[6], end)
  }
})

const assignment = Object.freeze({ id: 'assignment-1', course_id: 'mvp-class', slug: 'day-5-foundation-prediction', due_on: '2026-10-27' })
test('deadline removal targets the exact class and uses the existing non-deleting calendar action', async () => {
  const fetcher: typeof fetch = async (url, init) => {
    assert.equal(url, '/api/interactive-assignments')
    assert.equal(init?.method, 'POST')
    assert.deepEqual(JSON.parse(String(init?.body)), { action: 'calendar', course_id: assignment.course_id, slug: assignment.slug, due_on: null })
    return Response.json({ ok: true, assignment: { ...assignment, due_on: null } })
  }
  await unassignCalendarAssignment(assignment, fetcher)
  assert.equal(assignment.due_on, '2026-10-27')
})
test('failed or unconfirmed removals cannot be reported as success', async () => {
  for (const response of [
    () => Response.json({ error: 'Class unavailable.' }, { status: 403 }),
    () => Response.json({ ok: true, assignment }),
    () => Response.json({ ok: true, assignment: { ...assignment, course_id: 'another-class', due_on: null } }),
    () => Response.json({ ok: true, assignment: { ...assignment, id: 'another-assignment', due_on: null } }),
  ]) await assert.rejects(unassignCalendarAssignment(assignment, async () => response()))
})


test('two-week ranges have aligned weekdays and every date exactly once across calendar boundaries', () => {
  for (const [day, start, end] of [
    ['2026-10-27', '2026-10-26', '2026-11-08'],
    ['2026-12-31', '2026-12-28', '2027-01-10'],
    ['2028-02-27', '2028-02-21', '2028-03-05'],
    ['2026-03-08', '2026-03-02', '2026-03-15'],
  ]) {
    const weeks = teachingWeeks(day), days = weeks.flat()
    assert.deepEqual(teachingWeeks(day, 1), [teachingWeek(day)])
    assert.equal(weeks.length, 2)
    assert.equal(days.length, 14)
    assert.equal(new Set(days).size, 14)
    assert.equal(days[0], start)
    assert.equal(days[13], end)
    for (let i = 1; i < days.length; i++) assert.equal(Date.parse(days[i]) - Date.parse(days[i - 1]), 86_400_000)
    for (const week of weeks) {
      assert.equal(new Date(week[0]).getUTCDay(), 1)
      assert.equal(new Date(week[6]).getUTCDay(), 0)
    }
  }
})
