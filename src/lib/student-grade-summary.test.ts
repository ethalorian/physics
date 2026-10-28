import { test } from 'node:test'
import assert from 'node:assert/strict'
import { STUDENT_GRADE_CATEGORIES, studentGradeSummary, weightedStudentAverage } from './student-grade-summary'
import type { StudentProgressData } from './student-gradebook'
import { FOUR_DIMENSION_LAB_VERSION, LAB_DIMENSIONS } from './interactive-assignments/lab-rubric'

function fixture(): StudentProgressData {
  return {
    staff: false, courseId: 'fictional', student: { id: 'example', name: 'Example Student' }, courses: [], roster: [],
    settings: { terms: [], placements: {}, revision: 0 }, units: [], targets: [], feedback: [], warnings: [], generatedAt: '', syllabusCategories: true,
    rows: [{ key: 'quiz:example', title: 'Quiz', kind: 'quiz', unitIds: [], dueAt: '2026-10-20', archived: false, termId: 'term-1', manualTerm: false, href: '/', status: 'graded', statusLabel: 'Graded', grade: { earned: 8, possible: 10, percent: 80, letter: 'B-' }, feedback: null, releasedAt: '2026-10-21', submittedAt: '2026-10-20' }],
    transferEntries: [],
    labEntries: [{ submissionId: 'lab-example', assignmentKey: 'lab:example', title: 'Lab', href: '/', termId: 'term-1', attempt: 1, rubricVersion: FOUR_DIMENSION_LAB_VERSION, items: LAB_DIMENSIONS.map(d => ({ id: d.id, earned: 3, possible: 4, feedback: '' })), percent: 89, letter: 'B+', feedback: '', releasedAt: '2026-10-21', submittedAt: '2026-10-20' }],
  }
}

test('all six syllabus weights contribute to a complete average', () => {
  const scores = [90, 80, 70, 100, 50, 100]
  const result = weightedStudentAverage(STUDENT_GRADE_CATEGORIES.map((category, index) => ({ ...category, percent: scores[index] })))
  assert.deepEqual(result, { percent: 83.5, weight: 100, count: 6, complete: true })
})
test('a running average renormalizes available weights and preserves a real zero', () => {
  assert.deepEqual(weightedStudentAverage([{ weight: 40, percent: 90 }, { weight: 20, percent: 60 }, { weight: 40, percent: null }]), { percent: 80, weight: 60, count: 2, complete: false })
  assert.equal(weightedStudentAverage([{ weight: 20, percent: 0 }, { weight: 20, percent: 80 }]).percent, 40)
  assert.equal(weightedStudentAverage([{ weight: 100, percent: null }]).percent, null)
})
test('Homework completion contributes its syllabus weight alongside released lab and quiz grades', () => {
  const result = studentGradeSummary(fixture(), 'term-1')
  assert.deepEqual(result.average, { percent: 87.6, weight: 50, count: 3, complete: false })
  assert.equal(result.categories.filter(c => c.status === 'not_connected').length, 2)
  assert.equal(result.categories.find(c => c.id === 'homework')?.percent, 100)
  assert.equal(result.work.completed, 1)
})
test('term changes remove out-of-term scores, and no-term work remains separate', () => {
  const data = fixture()
  assert.equal(studentGradeSummary(data, 'term-2').average.percent, null)
  assert.equal(studentGradeSummary(data, 'unassigned').average.percent, null)
  data.rows[0].termId = null
  assert.equal(studentGradeSummary(data, 'term-1').average.percent, 89)
  assert.equal(studentGradeSummary(data, 'unassigned').average.percent, 2600 / 30)
  assert.equal(studentGradeSummary(data, 'all').average.percent, 87.6)
})
test('failed grade sources suppress the total instead of silently dropping their weights', () => {
  for (const source of ['Quizzes', 'Grading terms', 'Interactive lessons and simulations', 'Student choices', 'Readings', 'Worksheets']) {
    const data = fixture(); data.warnings = [{ source, message: 'Fixture failure' }]
    assert.equal(studentGradeSummary(data, 'all').average.percent, null, source)
  }
  const data = fixture(); data.warnings = [{ source: 'Learning history', message: 'Fixture failure' }]
  assert.equal(studentGradeSummary(data, 'all').average.percent, 87.6)
  delete data.labEntries
  assert.equal(studentGradeSummary(data, 'all').average.percent, null)
})
test('empty records and no selected student never fabricate a grade', () => {
  assert.equal(studentGradeSummary(null, 'all').average.percent, null)
  const data = fixture(); data.student = null
  assert.equal(studentGradeSummary(data, 'all').average.percent, null)
  const empty = fixture(); empty.rows = []; empty.labEntries = []
  assert.equal(studentGradeSummary(empty, 'all').average.percent, null)
  assert.equal(studentGradeSummary(empty, 'all').categories.find(c => c.id === 'homework')?.status, 'empty')
})
test('Homework counts future assigned work immediately and submitted work before grading', () => {
  const data = fixture()
  const template = data.rows[0]
  data.labEntries = []
  data.rows = (['pending', 'completed', 'in_progress', 'upcoming', 'missing', 'revise'] as const).map((status, index) => ({
    ...template, key: `work:${index}`, kind: index % 2 ? 'worksheet' : 'quiz', status,
    dueAt: '2099-10-20', grade: null, releasedAt: null,
  }))
  const result = studentGradeSummary(data, 'term-1')
  assert.equal(result.work.assigned, 6)
  assert.equal(result.work.completed, 2)
  assert.equal(result.categories.find(c => c.id === 'homework')?.percent, 2 / 6 * 100)
  assert.deepEqual(result.average, { percent: 2 / 6 * 100, weight: 10, count: 1, complete: false })
  data.rows[2].status = 'pending'
  assert.equal(studentGradeSummary(data, 'term-1').average.percent, 50)
  data.rows[0].status = 'revise'
  assert.equal(studentGradeSummary(data, 'term-1').average.percent, 2 / 6 * 100)
})
test('new assigned work lowers Homework immediately, while excused, archived and unassigned work do not', () => {
  const data = fixture()
  const template = data.rows[0]
  data.rows.push({ ...template, key: 'future', status: 'upcoming', grade: null, releasedAt: null, dueAt: '2099-10-20' })
  data.rows.push({ ...template, key: 'excused', status: 'excused' }, { ...template, key: 'archived', archived: true }, { ...template, key: 'undated', dueAt: null })
  const result = studentGradeSummary(data, 'term-1')
  assert.equal(result.work.assigned, 2)
  assert.equal(result.work.completed, 1)
  assert.equal(result.categories.find(c => c.id === 'homework')?.percent, 50)
  assert.equal(result.average.percent, 77.6)
})
test('zero completed future assignments produce a real zero Homework grade', () => {
  const data = fixture()
  data.labEntries = []
  data.rows = [{ ...data.rows[0], status: 'upcoming', grade: null, releasedAt: null, dueAt: '2099-10-20' }]
  const result = studentGradeSummary(data, 'term-1')
  assert.equal(result.categories.find(c => c.id === 'homework')?.status, 'graded')
  assert.deepEqual(result.average, { percent: 0, weight: 10, count: 1, complete: false })
})
test('classes without the CPA/Honors categories keep their quiz-only score', () => {
  const data = fixture(); data.syllabusCategories = false
  const result = studentGradeSummary(data, 'all')
  assert.equal(result.categories.length, 1)
  assert.equal(result.categories[0].label, 'Quiz score')
  assert.equal(result.average.percent, 80)
})
