import test from 'node:test'
import assert from 'node:assert/strict'
import { calendarDays, plannerDay, plannerReadings, readingWindow } from './reading-planner'
import type { SyllabusCatalog } from './reading-syllabus'
import type { ReadingAssignment } from './textbook-assignments'

test('weekday deadlines are 11:59 PM Eastern with exactly 24 hours to read', () => {
  for (const day of ['2026-10-14', '2026-01-12', '2026-03-08', '2026-11-01']) {
    const window = readingWindow(day)
    assert.equal(plannerDay(window.due_at), day)
    assert.equal(Date.parse(window.due_at) - Date.parse(window.opens_at), 86400000)
    assert.match(new Date(window.due_at).toLocaleTimeString('en-US', { timeZone: 'America/New_York' }), /^11:59:00 PM$/)
  }
})
test('Saturday becomes Sunday while keeping the Friday opening, including DST weekends', () => {
  for (const day of ['2026-10-17', '2026-03-07', '2026-10-31']) {
    const window = readingWindow(day)
    assert.equal(new Date(plannerDay(window.due_at) + 'T12:00Z').getUTCDay(), 0)
    assert.equal(new Date(plannerDay(window.opens_at) + 'T12:00Z').getUTCDay(), 5)
    assert.equal(window.weekend, true)
  }
  assert.deepEqual(readingWindow('2026-10-17'), { due_at: '2026-10-19T03:59:00.000Z', opens_at: '2026-10-17T03:59:00.000Z', weekend: true })
})
test('invalid dates fail; month grids include adjacent days with stable calendar keys', () => {
  for (const day of ['', '2026-02-30', '2026-13-01', '1999-12-31', '2026-1-2', 'garbage']) assert.throws(() => readingWindow(day))
  const days = calendarDays('2026-10-01')
  assert.equal(days[0], '2026-09-28'); assert.equal(days.length, 42); assert.equal(new Set(days).size, 42)
})
test('library merges the course sequence and existing readings without duplicates or cross-class assignments', () => {
  const catalog = { steps: [{ id: 'motion', title: 'Motion', unit: 'unit-1' }, { id: 'force', title: 'Force', unit: 'unit-1' }], bundles: [{ course_id: 'a', step_id: 'motion', reading_id: 'r' }] } as SyllabusCatalog
  const readings = [{ id: 'r', course_id: 'a', status: 'published' }, { id: 'standalone', course_id: 'a', title: 'Extra' }, { id: 'private', course_id: 'b' }] as unknown as ReadingAssignment[]
  const result = plannerReadings(catalog, readings, 'a')
  assert.equal(result.length, 3); assert.equal(result[0].assignment?.id, 'r'); assert.equal(result[1].assignment, undefined); assert.equal(result[2].assignment?.id, 'standalone')
})
