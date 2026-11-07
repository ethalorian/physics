import test from 'node:test'
import assert from 'node:assert/strict'
import { choiceDueAt, choiceReviewLabel, validateChoiceReview, validateChoiceSelection, choicePracticePrintPath, validateRequiredChoices, requiredChoiceCount, LETTER_GRADES, type BinderDay } from './student-choice'
import { schoolDayKey } from './school-day'
import { studentGradebookRows } from './student-gradebook'
import { quizTotal, releasedGrade } from './assessment-results/gradebook'
import { gradingSettingsError } from './grading-terms'
import type { ResultActivity } from './assessment-results/types'

test('paper receipt never selects a grade; only a valid explicit letter can be saved', () => {
  const blank = { state: 'received', letter_grade: null, feedback: '', version: 0 }
  assert.equal(validateChoiceReview(blank).letter_grade, null)
  assert.equal(choiceReviewLabel({ ...blank, assignment_id: 'a', user_id: 's', state: 'received', recorded_at: '' }), 'Awaiting teacher review')
  for (const letter of LETTER_GRADES) assert.equal(validateChoiceReview({ ...blank, letter_grade: letter }).letter_grade, letter)
  for (const invalid of [undefined, 90, '90%', 'Pass', 'A-', '']) assert.throws(() => validateChoiceReview({ ...blank, letter_grade: invalid }))
  for (const state of ['not_received', 'excused']) assert.throws(() => validateChoiceReview({ ...blank, state, letter_grade: 'A' }))
  for (const version of [-1, 0.5, '1', null]) assert.throws(() => validateChoiceReview({ ...blank, version }))
  assert.throws(() => validateChoiceReview({ ...blank, feedback: 'x'.repeat(3001) }))
})

test('calendar dates remain the same Eastern school day across DST and device timezones', () => {
  for (const day of ['2026-01-05', '2026-03-08', '2026-07-05', '2026-11-01', '2026-12-31']) {
    const due = choiceDueAt(day)
    assert.equal(schoolDayKey(new Date(due)), day)
    assert.equal(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hourCycle: 'h23', hour: '2-digit', minute: '2-digit' }).format(new Date(due)), '23:59')
  }
  assert.equal(choiceDueAt('2026-11-05'), '2026-11-06T04:59:00.000Z')
  assert.equal(choiceDueAt('2026-07-05'), '2026-07-06T03:59:00.000Z')
  for (const invalid of ['', '2026-02-30', '2026-13-01', '2026-1-1']) assert.throws(() => choiceDueAt(invalid))
})

test('teacher letter reaches student gradebook without points, quiz totals or prerequisite links', () => {
  const a: ResultActivity = { key: 'student-choice:a', sourceId: 'a', kind: 'student_choice', title: 'Day 8', unitIds: ['u1'], dueAt: choiceDueAt('2026-11-05'), archived: false, cells: { s: { state: 'reviewed', label: 'Reviewed · B+', needsReview: false, manualLetter: 'B+', feedback: 'Clear force diagrams.', releasedAt: '2026-11-05T18:00:00Z' } } }
  const settings = { terms: [{ id: 'q1', name: 'Quarter 1', start: '2026-09-01', end: '2026-11-10' }], placements: { [a.key]: 'q1' }, revision: 1 }
  assert.equal(gradingSettingsError(settings), null)
  let [row] = studentGradebookRows([a], 's', settings)
  assert.equal(row.manualLetter, 'B+'); assert.equal(row.grade, null); assert.equal(row.status, 'graded')
  assert.equal(row.href, '/student-choice/a'); assert.equal(row.hasReleasedResult, true)
  assert.equal(row.pairedKey, undefined); assert.equal(row.prerequisites, undefined)
  assert.equal(releasedGrade(a.cells.s), null)
  assert.deepEqual(quizTotal([a], 's'), { earned: 0, possible: 0, percent: null, count: 0 })
  a.cells.s = { state: 'submitted', label: 'Awaiting teacher review', needsReview: true }
  ;[row] = studentGradebookRows([a], 's', settings)
  assert.equal(row.status, 'pending'); assert.equal(row.manualLetter, undefined)
  a.cells.s = { state: 'excused', label: 'Excused', needsReview: false, manualLetter: 'B+' }
  ;[row] = studentGradebookRows([a], 's', settings)
  assert.equal(row.status, 'excused'); assert.equal(row.manualLetter, undefined)
})


test('students must save three distinct choices; printing always follows the sorted saved set', () => {
  assert.deepEqual(validateChoiceSelection({option_numbers: [6, 1, 3], version: 0}), {option_numbers: [1, 3, 6], version: 0})
  for (const options of [[], [1], [1, 2], [1, 2, 3, 4], [1, 1, 2], [0, 1, 2], [1, 2, 7], [1, 2, 2.5], [1, 2, '3'], [1, 2, null], [1, 2, NaN], null]) assert.throws(() => validateChoiceSelection({option_numbers: options, version: 0}))
  for (const version of [-1, 0.5, '1', null, undefined]) assert.throws(() => validateChoiceSelection({option_numbers: [1, 2, 3], version}))
  const packet = {key: 'unit1-day02', version: 'reviewed', day: 2} as BinderDay
  assert.equal(choicePracticePrintPath(packet, [6, 3, 1]), '/student-choice-print?packet=unit1-day02&edition=reviewed&options=1,3,6')
  assert.match(choicePracticePrintPath(packet, [1, 2]), /options=1,2$/)
  assert.throws(() => choicePracticePrintPath(packet, []))
})


test('required counts span 1–6, preserve the legacy default and reject incorrect selection sizes', () => {
  assert.equal(requiredChoiceCount({}), 3)
  for (const invalid of [0, 7, -1, 1.5, '2', null, undefined, NaN]) assert.throws(() => validateRequiredChoices(invalid))
  for (let count = 1; count <= 6; count++) {
    assert.equal(validateRequiredChoices(count), count)
    const options = Array.from({length: count}, (_, i) => 6-i)
    assert.equal(validateChoiceSelection({option_numbers: options, version: 2}, count).option_numbers.length, count)
    assert.throws(() => validateChoiceSelection({option_numbers: options.slice(1), version: 2}, count))
    assert.throws(() => validateChoiceSelection({option_numbers: [...options, 1], version: 2}, count))
  }
})
