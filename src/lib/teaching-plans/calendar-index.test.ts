import assert from 'node:assert/strict'
import test from 'node:test'
import { calendarIndex, emptyCalendarDay } from './calendar-index'
import { assignedActivity } from './model'
import { plannerDay } from '../reading-planner'
import type { ClassWorkItem } from '../class-work'
import type { PlanActivity, PlanStep, PlanningData, TeachingSlot } from './types'

const activity = (key: string): PlanActivity => ({ key, kind: 'lesson', sourceId: key.split(':')[1], title: key, unitIds: [], targetIds: [], description: '', prompts: [], minutes: null, href: '/', setupHref: '/', teach: [], scheduling: 'source', availability: '' })
const work = (id: string, patch: Partial<ClassWorkItem> = {}): ClassWorkItem => ({ id, sourceId: id, kind: 'lesson', title: id, context: '', audience: '', dueAt: '2026-11-02', dateOnly: true, access: 'open', href: '/', canEditDue: false, canToggle: false, ...patch })
const step = (key: string, id = key): PlanStep => ({ id, activityKey: key, kind: 'lesson', title: key, purpose: '', optional: false, notes: '' })

// Independent copy of the former render-time selection for response/ordering parity.
function previous(date: string, catalog: PlanActivity[], steps: PlanStep[], meetings: Record<string, TeachingSlot>, items: ClassWorkItem[], assignments: PlanningData['assignments'], courseId: string) {
  const planned = steps.filter(st => {
    if (!meetings[st.id]) return false
    const item = items.find(i => assignedActivity(i, catalog)?.key === st.activityKey)
    const due = item?.sequenceRole && item.dueAt && (item.access === 'open' || item.access === 'scheduled') ? item.dateOnly ? item.dueAt : plannerDay(item.dueAt) : meetings[st.id].date
    return due === date
  })
  const shown = new Set(planned.map(st => st.activityKey))
  return { planned, deadlines: assignments.filter(a => a.course_id === courseId && a.due_on === date && !shown.has('interactive:' + a.slug)), otherDeadlines: items.filter(item => item.kind !== 'interactive' && !shown.has(assignedActivity(item, catalog)?.key ?? '') && (item.access === 'open' || item.access === 'scheduled') && item.dueAt && (item.dateOnly ? item.dueAt : plannerDay(item.dueAt)) === date) }
}

test('indexed calendar preserves card identity, first-match ordering and linked deadline overrides', () => {
  const catalog = ['lesson:a', 'lesson:b', 'interactive:c', 'vocabulary:d', 'quiz:e', 'lesson:a'].map(activity)
  const steps = catalog.slice(0, 5).map(a => step(a.key))
  steps.push(step('missing:source'))
  const meetings = Object.fromEntries(steps.map(s => [s.id, { date: '2026-11-02', block: 'A' }]))
  const items = [work('a', { kind: 'homework', dueAt: '2026-11-03', sequenceRole: 'foundation' }), work('a', { id: 'duplicate', dueAt: '2026-11-06', sequenceRole: 'foundation' }), work('fallback', { planKey: 'lesson:b', dueAt: '2026-11-04T02:00:00Z', dateOnly: false, sequenceRole: 'review' }), work('c', { kind: 'interactive' }), work('d', { kind: 'vocabulary-set', access: 'closed', sequenceRole: 'review' }), work('e', { kind: 'quiz', access: 'scheduled' }), work('not-in-catalog'), work('no-date', { dueAt: null }), work('draft', { access: 'draft' })]
  const assignments = [{ id: 'c', course_id: 'class', slug: 'c', due_on: '2026-11-02' }, { id: 'direct', course_id: 'class', slug: 'direct', due_on: '2026-11-03' }, { id: 'other-class', course_id: 'other', slug: 'foreign', due_on: '2026-11-03' }, { id: 'off-calendar', course_id: 'class', slug: 'removed', due_on: null }]
  const before = JSON.stringify({ catalog, steps, meetings, items, assignments })
  const index = calendarIndex(catalog, steps, meetings, items, assignments, 'class')
  for (const date of ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-06']) assert.deepEqual(index.days.get(date) ?? emptyCalendarDay, previous(date, catalog, steps, meetings, items, assignments, 'class'))
  assert.equal(index.activities.get('lesson:a'), catalog[0])
  assert.equal(index.work.get('lesson:a'), items[0])
  assert.equal(JSON.stringify({ catalog, steps, meetings, items, assignments }), before)
})

test('mixed calendars retain former selection across statuses, aliases and daylight saving boundaries', () => {
  const catalog = Array.from({ length: 100 }, (_, i) => activity(`${['lesson', 'vocabulary', 'interactive', 'quiz'][i % 4]}:${i}`))
  const steps = catalog.map(a => step(a.key))
  const meetings = Object.fromEntries(steps.filter((_, i) => i % 7).map((s, i) => [s.id, { date: `2026-11-${String(i % 8 + 1).padStart(2, '0')}`, block: 'A' }]))
  const items = catalog.map((a, i) => work(String(i), { kind: (['homework', 'vocabulary-set', 'interactive', 'quiz'] as const)[i % 4], planKey: i % 9 === 0 ? 'lesson:0' : undefined, dueAt: i % 10 ? `2026-11-${String(i % 8 + 1).padStart(2, '0')}${i % 2 ? 'T03:30:00Z' : ''}` : null, dateOnly: i % 2 === 0, access: (['open', 'closed', 'scheduled', 'draft', 'unassigned'] as const)[i % 5], sequenceRole: i % 3 ? 'review' : undefined }))
  const assignments = catalog.map((a, i) => ({ id: a.key, course_id: i % 3 ? 'class' : 'other', slug: a.sourceId, due_on: `2026-11-${String(i % 8 + 1).padStart(2, '0')}` }))
  const index = calendarIndex(catalog, steps, meetings, items, assignments, 'class')
  for (let i = 1; i <= 10; i++) { const date = `2026-11-${String(i).padStart(2, '0')}`; assert.deepEqual(index.days.get(date) ?? emptyCalendarDay, previous(date, catalog, steps, meetings, items, assignments, 'class')) }
})

test('a refreshed date or class produces fresh data without altering the previous calendar', () => {
  const catalog = [activity('lesson:a')], steps = [step('lesson:a')], meetings = { 'lesson:a': { date: '2026-11-02', block: 'A' } }
  const first = calendarIndex(catalog, steps, meetings, [work('a', { sequenceRole: 'review' })], [], 'class')
  const next = calendarIndex(catalog, steps, meetings, [work('a', { sequenceRole: 'review', dueAt: '2026-11-05' })], [], 'class')
  assert.equal(first.days.get('2026-11-02')?.planned.length, 1)
  assert.equal(next.days.get('2026-11-05')?.planned.length, 1)
  assert.equal(next.days.has('2026-11-02'), false)
  assert.deepEqual(calendarIndex([], [], {}, [], [], 'another-class').days, new Map())
})
