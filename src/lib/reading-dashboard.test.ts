import test from 'node:test'
import assert from 'node:assert/strict'
import { filterReadingAssignments, readingDashboardGroups, readingDashboardHref, readingResourceStatus } from './reading-dashboard'
import type { ReadingAssignment, ReadingList } from './textbook-assignments'
import type { SyllabusCatalog, SyllabusBundleView } from './reading-syllabus'
import type { QuizList } from './quizzes/types'

const reading = (id: string, course_id: string): ReadingAssignment => ({ id, course_id, chapter: 4, title: 'Measurement', reading: 'Hewitt 4.1', section_ids: [], questions: [], instructions: '', due_at: null, status: 'published', version: 1, created_at: '2026-10-07' })
const bundle = (course_id: string, reading_id: string): SyllabusBundleView => ({ course_id, step_id: 'measurement', reading_id, practice_id: `${reading_id}-practice`, reading_quiz_id: `${reading_id}-quiz`, vocabulary_quiz_id: `${reading_id}-vocab`, created_at: '2026-10-07',
  reading: { id: reading_id, title: 'Measurement', status: 'draft' }, practice: { id: `${reading_id}-practice`, title: 'Practice', status: 'published', due_on: '2026-11-01' },
  readingQuiz: { id: `${reading_id}-quiz`, title: 'Reading quiz', status: 'published' }, vocabularyQuiz: { id: `${reading_id}-vocab`, title: 'Vocabulary quiz', status: 'draft' } })
const syllabus: SyllabusCatalog = { courses: [], steps: [], bundles: [bundle('cpa', 'a'), bundle('honors', 'b')], targets: [], readOnly: false }
const readings: ReadingList = { staff: true, courses: [], work: [], assignments: [reading('a', 'cpa'), reading('b', 'honors'), reading('standalone', 'cpa')], review_counts: { a: 2, b: 5, standalone: 1 } }
const quizzes: QuizList = { staff: true, readOnly: false, courses: [], quizzes: [], reviews: [], work: [], pending: { 'a-quiz': 3, 'b-vocab': 4, unrelated: 99 } }

test('joins four resources by class and step without duplicating readings or counting unrelated quizzes', () => {
  const groups = readingDashboardGroups(syllabus, readings, quizzes)
  assert.equal(groups.length, 3)
  assert.deepEqual(groups.map(group => group.courseId), ['cpa', 'honors', 'cpa'])
  assert.equal(groups[0].resources.length, 4)
  assert.equal(groups[0].resources[0].status, 'published', 'reading list has the current assignment state')
  assert.equal(groups[0].resources[1].due_on, '2026-11-01')
  assert.equal(groups.filter(group => group.courseId === 'cpa').flatMap(group => group.resources).reduce((sum, resource) => sum + (resource.pending ?? 0), 0), 6)
})

test('failed services produce unknown counts, while independent reading data stays usable', () => {
  const groups = readingDashboardGroups(syllabus, readings, null)
  assert.equal(groups[0].resources[0].pending, 2)
  assert.equal(groups[0].resources[2].pending, null)
  assert.equal(readingDashboardGroups(null, readings, quizzes).length, 3)
})

test('deleted or missing resources are unavailable instead of appearing as actionable drafts', () => {
  const saved = bundle('cpa', 'a')
  saved.vocabularyQuiz = { id: '', title: 'Not assigned yet', status: 'draft' }
  const group = readingDashboardGroups({ ...syllabus, bundles: [saved] }, readings, quizzes)[0]
  assert.equal(group.resources[3].status, 'unavailable')
  assert.equal(readingResourceStatus(group.resources[3]), 'Unavailable')
  assert.equal(readingResourceStatus(group.resources[2]), 'Assigned')
})

test('assigned view hides drafts and retains assigned quizzes when their reading is unassigned', () => {
  const groups = readingDashboardGroups(syllabus, { ...readings, assignments: readings.assignments.map(a => a.id === 'a' ? { ...a, status: 'archived' } : a) }, quizzes)
  const assigned = filterReadingAssignments(groups, 'published')
  assert.deepEqual(assigned[0].resources.map(r => r.kind), ['practice', 'readingQuiz'])
  assert(assigned.flatMap(g => g.resources).every(r => r.status === 'published'))
  assert.deepEqual(filterReadingAssignments(groups, 'archived').flatMap(g => g.resources).map(r => r.id), ['a'])
  assert(filterReadingAssignments(groups, 'draft').flatMap(g => g.resources).every(r => r.kind === 'vocabularyQuiz'))
})

test('search and type filters apply within the selected status and class scope', () => {
  const groups = readingDashboardGroups(syllabus, readings, quizzes).filter(g => g.courseId === 'cpa')
  assert.equal(filterReadingAssignments(groups, 'published', '  hewitt  ', 'reading').length, 2)
  assert.equal(filterReadingAssignments(groups, 'draft', 'hewitt', 'reading').length, 0)
  assert.equal(filterReadingAssignments(groups, 'all', 'unknown').length, 0)
  assert.equal(filterReadingAssignments(groups, 'published', 'reading quiz').flatMap(g => g.resources).length, 1)
})

test('resource links retain class and syllabus context and use the existing editor id conventions', () => {
  const practice = new URL(readingDashboardHref({ view: 'assignments', courseId: 'honors', stepId: 'units & scale', resource: 'practice', id: 'practice-id' }), 'https://local')
  assert.equal(practice.searchParams.get('course_id'), 'honors')
  assert.equal(practice.searchParams.get('step_id'), 'units & scale')
  assert.equal(practice.searchParams.get('task_id'), 'practice-id')
  assert.equal(practice.searchParams.has('id'), false)
  assert.equal(new URL(readingDashboardHref({ resource: 'readingQuiz', id: 'quiz-id' }), 'https://local').searchParams.get('id'), 'quiz-id')
})
