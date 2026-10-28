import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assignedGradingTerm, gradingSettingsError, termQuizTotal, type GradingSettings } from './grading-terms'
import type { ResultActivity } from './assessment-results/types'

const settings: GradingSettings = { terms: [{ id: 't1', name: 'Term 1', start: '2026-09-01', end: '2026-11-06' }, { id: 't2', name: 'Term 2', start: '2026-11-07', end: '2027-01-22' }], placements: {}, revision: 0 }
const activity = (key: string, earned?: number, possible = 10): ResultActivity => ({ key, kind: 'quiz', sourceId: key, title: key, unitIds: [], dueAt: '2026-11-06T23:00:00-05:00', archived: false, cells: { me: { state: earned == null ? 'submitted' : 'reviewed', needsReview: earned == null, label: '', submittedAt: '2026-12-01', ...(earned == null ? {} : { grade: { earned, possible, version: '1' } }) } } })
test('term boundaries use Eastern due date, inclusive, regardless of submission date', () => {
  assert.equal(assignedGradingTerm(activity('quiz:a'), settings)?.id, 't1')
  assert.equal(assignedGradingTerm({ key: 'quiz:a', dueAt: '2026-11-07T04:59:59Z' }, settings)?.id, 't1')
  assert.equal(assignedGradingTerm({ key: 'quiz:a', dueAt: '2026-11-07T05:00:00Z' }, settings)?.id, 't2')
  assert.equal(assignedGradingTerm({ key: 'quiz:a', dueAt: '2026-11-06' }, settings)?.id, 't1')
  assert.equal(assignedGradingTerm({ key: 'quiz:a', dueAt: null }, settings), null)
})
test('explicit placement overrides due date and automatic placement can be restored', () => {
  const row = activity('quiz:a'), moved = { ...settings, placements: { 'quiz:a': 't2' } }
  assert.equal(assignedGradingTerm(row, moved)?.id, 't2')
  assert.equal(row.dueAt, '2026-11-06T23:00:00-05:00')
  assert.equal(assignedGradingTerm(row, settings)?.id, 't1')
})
test('quiz total weights points, includes archived released work, omits ungraded and excused work', () => {
  const rows = [activity('quiz:a', 8), { ...activity('quiz:b', 1, 2), archived: true }, activity('quiz:pending'), { ...activity('lab:a', 0), kind: 'simulation' as const }, activity('quiz:excused', 0)]
  rows[4].cells.me.state = 'excused'
  const total = termQuizTotal(rows, 'me', settings, 't1')
  assert.deepEqual([total.earned, total.possible, total.percent, total.count], [9, 12, 75, 2])
  assert.equal(termQuizTotal(rows, 'me', settings, 't2').percent, null)
  assert.equal(termQuizTotal(rows, 'another-student', settings, 't1').count, 0)
})
test('invalid, ambiguous and dangling term configurations are rejected', () => {
  assert.equal(gradingSettingsError(settings), null)
  assert.match(gradingSettingsError({ ...settings, terms: [{ ...settings.terms[0], end: '2026-11-07' }, settings.terms[1]] })!, /overlap/)
  assert.match(gradingSettingsError({ ...settings, terms: [{ ...settings.terms[0], start: '2026-02-30' }] })!, /valid/)
  assert.match(gradingSettingsError({ ...settings, terms: [{ ...settings.terms[0], end: '2026-08-30' }] })!, /end date/)
  assert.match(gradingSettingsError({ ...settings, placements: { 'quiz:a': 'deleted-term' } })!, /existing term/)
  assert.match(gradingSettingsError({ ...settings, terms: [settings.terms[0], { ...settings.terms[1], name: ' TERM 1 ' }] })!, /different name/)
})
