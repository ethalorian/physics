import type { SyllabusCatalog, SyllabusResource, SyllabusStep } from './reading-syllabus'
import type { ReadingList } from './textbook-assignments'
import type { QuizList } from './quizzes/types'

export type ReadingDashboardView = 'overview' | 'syllabus' | 'map' | 'assignments' | 'review' | 'textbooks'
export type ReadingResourceKind = 'reading' | 'practice' | 'readingQuiz' | 'vocabularyQuiz'
export interface ReadingDashboardResource extends SyllabusResource {
  kind: ReadingResourceKind
  label: string
  pending: number | null
}
export interface ReadingDashboardGroup {
  id: string
  courseId: string
  title: string
  step?: SyllabusStep
  source: string
  resources: ReadingDashboardResource[]
}
export function readingDashboardHref({ view = 'overview', courseId, stepId, resource, id, create }: {
  view?: ReadingDashboardView; courseId?: string | null; stepId?: string; resource?: ReadingResourceKind; id?: string; create?: boolean
} = {}) {
  const params = new URLSearchParams({ view })
  if (courseId && courseId !== 'all') params.set('course_id', courseId)
  if (stepId) params.set('step_id', stepId)
  if (resource) params.set('resource', resource)
  if (id) params.set(resource === 'practice' ? 'task_id' : 'id', id)
  if (create) params.set('create', '1')
  return `/admin/readings?${params}`
}

/** Join existing teacher-scoped APIs. Counts represent work awaiting review, never mastery. */
export function readingDashboardGroups(syllabus: SyllabusCatalog | null, readings: ReadingList | null, quizzes: QuizList | null): ReadingDashboardGroup[] {
  const readingMap = new Map(readings?.assignments.map(a => [a.id, a]))
  const quizMap = new Map(quizzes?.quizzes.map(q => [q.id, q]))
  const linked = new Set(syllabus?.bundles.map(b => b.reading_id))
  const groups: ReadingDashboardGroup[] = (syllabus?.bundles ?? []).map(bundle => {
    const step = syllabus?.steps.find(s => s.id === bundle.step_id)
    const assignment = readingMap.get(bundle.reading_id)
    const resource = (kind: ReadingResourceKind, label: string, value: SyllabusResource): ReadingDashboardResource => ({
      ...value, status: value.id ? value.status : 'unavailable', kind, label,
      pending: kind === 'practice' ? null : kind === 'reading' ? readings ? readings.review_counts?.[value.id] ?? 0 : null : quizzes ? quizzes.pending[value.id] ?? 0 : null,
    })
    return {
      id: `${bundle.course_id}:${bundle.step_id}`, courseId: bundle.course_id, title: step?.title ?? bundle.reading.title, step,
      source: assignment?.reading ?? (syllabus?.courses.find(c => c.id === bundle.course_id)?.track === 'honors' ? 'OpenStax AP Physics 2e' : 'Hewitt & course readings'),
      resources: [resource('reading', 'Reading', assignment ?? bundle.reading), resource('practice', 'Vocabulary practice', bundle.practice),
        resource('readingQuiz', 'Reading quiz', quizMap.get(bundle.reading_quiz_id) ?? bundle.readingQuiz),
        resource('vocabularyQuiz', 'Vocabulary quiz', quizMap.get(bundle.vocabulary_quiz_id) ?? bundle.vocabularyQuiz)],
    }
  })
  for (const assignment of readings?.assignments ?? []) {
    if (linked.has(assignment.id)) continue
    groups.push({ id: assignment.id, courseId: assignment.course_id, title: assignment.title, source: assignment.reading,
      resources: [{ ...assignment, kind: 'reading', label: 'Reading', pending: readings?.review_counts?.[assignment.id] ?? 0 }] })
  }
  const order = new Map(syllabus?.steps.map((step, index) => [step.id, index]))
  return groups.sort((a, b) => (order.get(a.step?.id ?? '') ?? Infinity) - (order.get(b.step?.id ?? '') ?? Infinity))
}

export function readingResourceStatus(resource: Pick<ReadingDashboardResource, 'status' | 'kind'>) {
  if (resource.status === 'draft') return 'Draft'
  if (resource.status === 'published') return resource.kind === 'readingQuiz' ? 'Unlocks after reading' : 'Assigned'
  if (resource.status === 'archived') return 'Archived'
  return 'Unavailable'
}
