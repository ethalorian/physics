import assert from 'node:assert/strict'
import test from 'node:test'
import { dailyZenReflection, ZEN_REFLECTIONS } from './daily-zen'
import { homeDeadlineLabel, nextStudentHomeTask, STUDENT_HOME_THEMES } from './student-home-banner'
import { schoolDayKey } from './school-day'
import type { StudentAssignment } from './student-dashboard'
import type { LearningActivity } from './learning-week'

const today = '2026-10-22'
const assignment = (patch: Partial<StudentAssignment> = {}): StudentAssignment => ({ id: 'reading:r1', kind: 'reading', title: 'Investigating motion', href: '/readings/r1', due: '2026-10-25', complete: false, status: 'To do', action: 'Start reading', ...patch })
const math: LearningActivity = { id: 'math:today', kind: 'math', title: 'Slope as a rate of change', href: '/dashboard/math-spine/warmup', due: null, complete: false, status: 'Ready to start', action: 'Start math warm-up' }
const task = (items: StudentAssignment[], overrides: Partial<Parameters<typeof nextStudentHomeTask>[0]> = {}) => nextStudentHomeTask({ items, math, today, loading: false, incomplete: false, ...overrides })

test('the approved collection provides 365 short, distinct days with explicit provenance', () => {
  const days = Array.from({ length: 365 }, (_, i) => new Date(Date.UTC(2026, 0, 1) + i * 86400000).toISOString().slice(0, 10))
  assert.equal(new Set(days.map(day => dailyZenReflection(day).id)).size, 365)
  assert.equal(new Set(ZEN_REFLECTIONS.map(entry => entry.text)).size, 365)
  assert.equal(ZEN_REFLECTIONS.filter(entry => entry.treatment !== 'original').length, 25)
  for (const entry of ZEN_REFLECTIONS) {
    assert.ok(entry.text.split(/\s+/).length <= 20)
    if (entry.treatment === 'original') { assert.match(entry.credit, /^Original Zen-inspired/); assert.equal(entry.url, null) }
    else { assert.match(entry.url!, /^https:\/\//); assert.ok(entry.source) }
  }
  assert.equal(dailyZenReflection('2027-01-01').id, dailyZenReflection('2026-01-01').id)
})

test('the saying changes at Eastern midnight, not UTC midnight or a DST clock change', () => {
  const at = (stamp: string) => dailyZenReflection(schoolDayKey(new Date(stamp))).id
  assert.equal(at('2026-10-22T23:00:00Z'), at('2026-10-23T03:59:59Z'))
  assert.notEqual(at('2026-10-23T03:59:59Z'), at('2026-10-23T04:00:00Z'))
  assert.equal(at('2026-03-08T06:30:00Z'), at('2026-03-08T07:30:00Z'))
  assert.equal(at('2026-11-01T05:30:00Z'), at('2026-11-01T06:30:00Z'))
  assert.equal(new Set(['2028-02-28', '2028-02-29', '2028-03-01'].map(day => dailyZenReflection(day).id)).size, 3)
  assert.throws(() => dailyZenReflection('2026-02-30'), RangeError)
})

test('due work takes precedence over optional future work and the warm-up', () => {
  const overdue = assignment({ due: '2026-10-21T23:00:00Z' })
  assert.equal(task([overdue])?.href, '/readings/r1')
  const quiz = assignment({ id: 'quiz:q1', kind: 'quiz', quizSchedule: 'vocabulary', due: '2026-10-22', href: '/quizzes/q1', action: 'Start quiz' })
  assert.equal(task([quiz])?.kind, 'Vocabulary quiz')
  assert.equal(task([quiz])?.label, 'Start quiz')
  assert.equal(task([assignment({ due: '2026-10-25' })])?.kind, 'Math warm-up')
  assert.equal(task([assignment()], { math: null })?.kind, 'Assignment')
})

test('submitted, unavailable, and prerequisite-gated work keep their real actions', () => {
  assert.equal(task([assignment({ complete: true })])?.kind, 'Math warm-up')
  assert.equal(task([assignment()], { math: { ...math, complete: true } })?.href, '/readings/r1')
  assert.equal(task([assignment()], { math: { ...math, available: false } })?.href, '/readings/r1')
  const locked = assignment({ kind: 'quiz', status: 'Complete reading first', action: 'Open required reading', due: today })
  assert.equal(task([locked])?.href, '/readings/r1')
  assert.equal(task([locked])?.label, 'Open required reading')
})

test('completion is only claimed after assignment sources finish successfully', () => {
  assert.equal(task([], { loading: true }), null)
  assert.equal(task([], { math: null })?.href, '/lessons')
  assert.equal(task([], { math: null, incomplete: true })?.meta, 'Some assignments couldn’t load')
  assert.doesNotMatch(task([], { math: null, incomplete: true })!.meta, /caught up/)
})

test('deadline labels preserve school dates and the correct Eastern time', () => {
  assert.equal(homeDeadlineLabel('2026-10-22', today), 'Due today')
  assert.equal(homeDeadlineLabel('2026-10-24T03:59:00Z', today), 'Due tomorrow · 11:59 pm')
  assert.equal(homeDeadlineLabel('2026-11-02T04:30:00Z', '2026-11-01'), 'Due today · 11:30 pm')
  assert.match(homeDeadlineLabel('2026-10-21', today), /^Past due Oct 21/)
  assert.equal(homeDeadlineLabel(null, today), 'Ready to start')
})

test('each calendar month has a distinct seasonal palette', () => {
  assert.equal(STUDENT_HOME_THEMES.length, 12)
  assert.equal(new Set(STUDENT_HOME_THEMES.map(theme => theme.base)).size, 12)
  assert.equal(STUDENT_HOME_THEMES[9].name, 'Halloween season')
  assert.equal(STUDENT_HOME_THEMES[11].name, 'Christmas & holidays')
})

test('undated legacy assignments never become the next assignment', () => {
  const old = assignment({ id: 'interactive:old', title: 'Day 2 · How Do We Talk About Motion', due: null, href: '/interactive-assignments/old' })
  assert.equal(task([old], { math: null })?.title, 'No assignments on your calendar')
  const dated = assignment({ due: '2026-10-25', href: '/readings/scheduled' })
  assert.equal(task([old, dated], { math: null })?.href, '/readings/scheduled')
  assert.equal(task([{...old,due:'invalid'}], { math: null })?.kind, 'Keep exploring')
})
