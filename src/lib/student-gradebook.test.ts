import { test } from 'node:test'
import assert from 'node:assert/strict'
import { currentStudentRows, isStudentHomework, studentCompletionTotal, studentGradebookRows, studentWorkStatus, studentQuizTotal, studentRowOrder } from './student-gradebook'
import { emptyGradingSettings } from './grading-terms'
import type { ResultActivity, ResultCell } from './assessment-results/types'

const cell: ResultCell = { state: 'not_started', label: 'Not started', needsReview: false }
const row = (key: string, changes: Partial<ResultActivity> = {}): ResultActivity => ({ key, title: key, kind: 'quiz', sourceId: key.split(':')[1], dueAt: '2026-10-12', archived: false, unitIds: ['unit-1'], cells: { me: cell }, ...changes })
test('missing work sorts by the displayed Eastern deadline across date-only and timestamp sources', () => {
  const rows = studentGradebookRows([
    row('quiz:later', { dueAt: '2026-10-23' }),
    row('quiz:earlier-timestamp', { dueAt: '2026-10-23T03:59:00+00:00' }),
    row('quiz:earliest-date', { dueAt: '2026-10-21' }),
  ], 'me', emptyGradingSettings(), new Map(), new Date('2026-10-26T12:00:00Z'))
  assert.deepEqual(rows.sort(studentRowOrder).map(r => r.key), ['quiz:earliest-date', 'quiz:earlier-timestamp', 'quiz:later'])
  assert.deepEqual(rows.map(r => ({ ...r, status: 'completed' as const })).sort(studentRowOrder).map(r => r.key), ['quiz:later', 'quiz:earlier-timestamp', 'quiz:earliest-date'])
})
test('missing requires a past deadline and no submission; revision and pending are separate', () => {
  const assignment = row('quiz:a'), now = new Date('2026-10-13T04:00:00Z')
  assert.equal(studentWorkStatus(assignment, cell, now), 'missing')
  assert.equal(studentWorkStatus(assignment, cell, new Date('2026-10-13T03:59:59Z')), 'upcoming')
  assert.equal(studentWorkStatus(assignment, { ...cell, state: 'submitted' }, now), 'pending')
  assert.equal(studentWorkStatus(assignment, { ...cell, state: 'returned' }, now), 'revise')
  assert.equal(studentWorkStatus(assignment, { ...cell, state: 'excused' }, now), 'excused')
  assert.equal(studentWorkStatus(assignment, { ...cell, state: 'completed' }, now), 'completed')
  assert.equal(studentWorkStatus(assignment, { ...cell, state: 'draft', submittedAt: '2026-10-10' }, now), 'revise')
  assert.equal(studentWorkStatus({ ...assignment, archived: true }, cell, now), 'upcoming')
})
test('student projection excludes private review state, other students, unassigned and unchosen work', () => {
  const result = studentGradebookRows([
    row('quiz:mine', { cells: { me: { ...cell, assessment: 'ready', pendingTargets: ['secret-target'], reviewIds: ['secret-review'], state: 'reviewed', feedback: 'Released feedback', grade: { earned: 8, possible: 10, version: 'released' } }, other: { ...cell, detail: 'Private other student' } } }),
    row('quiz:other', { cells: { other: cell } }), row('quiz:no-date', { dueAt: null }), row('quiz:archived', { archived: true }), row('quiz:unchosen', { cells: { me: { ...cell, label: 'Not chosen' } } }),
  ], 'me', emptyGradingSettings())
  assert.equal(result.length, 1)
  assert.equal(result[0].feedback, 'Released feedback')
  assert.equal(result[0].href, '/quizzes/mine')
  assert.equal('version' in result[0].grade!, false)
  assert.doesNotMatch(JSON.stringify(result), /secret|assessment|Private other student|reviewIds|pendingTargets/)
  assert.equal(studentQuizTotal(result, 'all').percent, 80)
})
test('paper completion stays separate from paired quiz score and links', () => {
  const result = studentGradebookRows([
    row('worksheet:paper', { kind: 'worksheet', pairedKey: 'quiz:paired', cells: { me: { ...cell, state: 'completed' } } }),
    row('quiz:paired', { pairedKey: 'worksheet:paper', cells: { me: { ...cell, state: 'reviewed', grade: { earned: 5, possible: 6, version: '1' } } } }),
  ], 'me', emptyGradingSettings())
  assert.equal(result[0].statusLabel, 'Handed in')
  assert.equal(result[0].grade, null)
  assert.equal(result[0].href, '/worksheet-assignments/paper')
  assert.equal(studentQuizTotal(result, 'all').earned, 5)
  assert.equal(studentQuizTotal(result, 'all').possible, 6)
})

test('completion measures completed versus all assigned work, including future assignments', () => {
  const activities = [
    row('quiz:graded', { cells: { me: { ...cell, state: 'reviewed', grade: { earned: 8, possible: 10, version: '1' } } } }),
    row('reading:submitted', { kind: 'reading', cells: { me: { ...cell, state: 'submitted' } } }),
    row('worksheet:received', { kind: 'worksheet', cells: { me: { ...cell, state: 'completed' } } }),
    row('quiz:missing'),
    row('reading:revise', { kind: 'reading', cells: { me: { ...cell, state: 'returned', submittedAt: '2026-10-10' } } }),
    row('quiz:future', { dueAt: '2026-12-01' }),
    row('quiz:draft', { cells: { me: { ...cell, state: 'draft' } } }),
    row('quiz:excused', { cells: { me: { ...cell, state: 'excused' } } }),
    row('quiz:archived', { archived: true, cells: { me: { ...cell, state: 'submitted' } } }),
    row('quiz:unassigned', { dueAt: null, cells: { me: { ...cell, state: 'submitted' } } }),
  ]
  const rows = studentGradebookRows(activities, 'me', emptyGradingSettings(), new Map(), new Date('2026-10-24T12:00:00Z'))
  const total = studentCompletionTotal(rows, 'all')
  assert.equal(total.assigned, 7)
  assert.equal(total.completed, 3)
  assert.equal(total.notCompleted, 4)
  assert.equal(total.percent, 3 / 7 * 100)
  assert.ok(total.counted.some(row => row.key === 'quiz:future'))
  assert.equal(studentCompletionTotal([], 'all').percent, null)
  assert.equal(studentCompletionTotal(rows.filter(row => row.key === 'quiz:missing'), 'all').percent, 0)
})

test('unfinished work becomes homework after its actual deadline and stops being homework when submitted', () => {
  const before = new Date('2026-10-13T03:59:59.999Z'), after = new Date('2026-10-13T04:00:00Z')
  const rows = studentGradebookRows([row('quiz:date'), row('reading:timed', { kind: 'reading', dueAt: '2026-10-13T04:00:00Z' })], 'me', emptyGradingSettings(), new Map(), before)
  assert.equal(isStudentHomework(rows[0], before), false)
  assert.equal(isStudentHomework(rows[0], after), true)
  assert.equal(isStudentHomework(rows[1], after), false)
  assert.equal(isStudentHomework(rows[1], new Date(after.getTime() + 1)), true)
  const updated = currentStudentRows(rows, new Date(after.getTime() + 1))
  assert.ok(updated.every(row => row.status === 'missing'))
  assert.ok(rows.every(row => row.status === 'upcoming'), 'saved source rows are unchanged')
  assert.equal(isStudentHomework({ ...updated[0], status: 'pending' }, after), false)
  assert.equal(isStudentHomework({ ...updated[0], status: 'revise' }, after), true)
  assert.equal(isStudentHomework({ ...updated[0], status: 'excused' }, after), false)
  assert.equal(isStudentHomework({ ...updated[0], archived: true }, after), false)
})

test('completion and quiz percentages use the same teacher-controlled term placement', () => {
  const settings = { terms: [{ id: 't1', name: 'Term 1', start: '2026-09-01', end: '2026-10-31' }, { id: 't2', name: 'Term 2', start: '2026-11-01', end: '2026-12-31' }], placements: { 'quiz:moved': 't2' }, revision: 1 }
  const rows = studentGradebookRows([
    row('quiz:moved', { cells: { me: { ...cell, state: 'reviewed', grade: { earned: 8, possible: 10, version: '1' } } } }),
    row('worksheet:due', { kind: 'worksheet' }),
  ], 'me', settings)
  assert.equal(studentCompletionTotal(rows, 't1').percent, 0)
  assert.equal(studentCompletionTotal(rows, 't2').percent, 100)
  assert.equal(studentQuizTotal(rows, 't2').percent, 80)
  assert.equal(studentQuizTotal(rows, 't1').percent, null)
  assert.equal(studentCompletionTotal(rows, 'unassigned').percent, null)
})
