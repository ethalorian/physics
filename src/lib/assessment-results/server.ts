import 'server-only'
import { calendarAssigned } from '@/lib/calendar-assignment'
import { composeChoiceResults } from './choice-composition'
import { choiceResults } from './choices'
import { vocabularyResults, mathResults, videoResults, reflectionResults } from './supporting'
import { read, byIds, type Scope } from './queries'
import type { AuthContext } from '@/lib/api-auth'
import { assignmentBySlug } from '@/lib/interactive-assignments/catalog'
import type { Assignment, Review, Work, Submission } from '@/lib/interactive-assignments/server'
import { assessmentResults } from '@/lib/quizzes/comparison'
import type { Quiz, QuizWork, QuizSubmission, QuizReview } from '@/lib/quizzes/types'
import type { ReadingAssignment, ReadingWork, ReadingReview } from '@/lib/textbook-assignments'
import { canAccessReview, REVIEW_SLUGS, type ReviewAssignment } from '@/lib/review-modules/server'
import type { ReviewWork, ReviewScore } from '@/lib/review-modules/analytics'
import { notStarted, quizCells, resultUnitIds, reviewCell, retainArchivedEvidence } from './model'
import type { ResultActivity, ResultCell, ResultsData } from './types'


async function interactive(scope: Scope): Promise<ResultActivity[]> {
  if (scope.course.program !== 'physics') return []
  const assignments = (await read<Assignment>('interactive_assignments', 'id,course_id,slug,target_id,created_at,due_on', q => q.eq('course_id', scope.course.id), ['id']))
    .filter(a => { const lesson = assignmentBySlug(a.slug); return lesson && scope.includes([lesson.unit]) })
  const ids = assignments.map(a => a.id), users = scope.students.map(s => s.id)
  if (!ids.length) return []
  const [work, submissions] = users.length ? await Promise.all([
    byIds<Omit<Work, 'state'>>('interactive_assignment_work', 'assignment_id,user_id,version,status,updated_at', 'assignment_id', ids, ['assignment_id', 'user_id'], q => q.in('user_id', users)),
    byIds<Omit<Submission, 'state'>>('interactive_assignment_submissions', 'id,assignment_id,user_id,version,submitted_at', 'assignment_id', ids, ['id'], q => q.in('user_id', users)),
  ]) : [[], []]
  const workByKey = new Map(work.map(w => [w.assignment_id + ':' + w.user_id, w]))
  const current = submissions.filter(sub => { const w = workByKey.get(sub.assignment_id + ':' + sub.user_id); return w?.status === 'submitted' && sub.version === w.version })
  const subByKey = new Map(current.map(sub => [sub.assignment_id + ':' + sub.user_id, sub]))
  const currentIds = current.map(sub => sub.id)
  const [reviews, ai] = await Promise.all([
    byIds<Pick<Review, 'submission_id' | 'target_id'>>('interactive_assignment_reviews', 'submission_id,target_id', 'submission_id', currentIds, ['id']),
    byIds<{ submission_id: string; status: ResultCell['assessment'] }>('interactive_assignment_ai_reviews', 'submission_id,status', 'submission_id', currentIds, ['submission_id']),
  ])
  const aiById = new Map(ai.map(item => [item.submission_id, item.status]))
  const ratedById = new Map<string, Set<string>>()
  for (const r of reviews) { if (!ratedById.has(r.submission_id)) ratedById.set(r.submission_id, new Set()); ratedById.get(r.submission_id)!.add(r.target_id) }
  return assignments.map(a => {
    const lesson = assignmentBySlug(a.slug)!
    const targets = lesson.targets.map(slug => scope.targetIdsBySlug.get(slug))
    const cells = Object.fromEntries(scope.students.map(student => {
      const key = a.id + ':' + student.id, w = workByKey.get(key), sub = subByKey.get(key)
      if (!sub) return [student.id, w ? { state: 'draft', label: 'In progress / revision', needsReview: false } satisfies ResultCell : notStarted()]
      const rated = ratedById.get(sub.id) ?? new Set(), count = targets.filter(id => id && rated.has(id)).length
      const complete = targets.length > 0 && count === targets.length
      return [student.id, { state: complete ? 'reviewed' : 'submitted', label: complete ? 'Teacher reviewed' : 'Needs review', detail: `${count} / ${targets.length} targets rated`, needsReview: !complete, assessment: aiById.get(sub.id) ?? 'none', submittedAt: sub.submitted_at } satisfies ResultCell]
    }))
    return { key: 'interactive:' + a.id, sourceId: a.slug, title: lesson.title, kind: lesson.simulation ? 'simulation' : 'interactive', unitIds: [lesson.unit], targetIds: targets.filter((id): id is string => !!id), dueAt: a.due_on, dateOnly: true, archived: !calendarAssigned(true, a.due_on), cells }
  })
}

async function quizzes(scope: Scope): Promise<ResultActivity[]> {
  const quizzes = (await read<Quiz>('quiz_assignments', '*', q => q.eq('course_id', scope.course.id).is('deleted_at', null).neq('status', 'draft'), ['id']))
    .filter(a => scope.includes(resultUnitIds(a.questions.map(q => q.target_id), scope.targets)))
  const ids = quizzes.map(q => q.id), users = scope.students.map(s => s.id)
  const work = users.length ? await byIds<QuizWork>('quiz_work', '*', 'quiz_id', ids, ['quiz_id', 'user_id'], q => q.in('user_id', users)) : []
  const subIds = work.flatMap(w => w.submission_id ? [w.submission_id] : [])
  const [submissions, reviews] = await Promise.all([
    byIds<QuizSubmission>('quiz_submissions', '*', 'id', subIds, ['id']),
    byIds<QuizReview>('quiz_reviews', '*', 'submission_id', subIds, ['id']),
  ])
  const courses = [{ ...scope.course, section: scope.course.section ?? '' }]
  const comparisons = assessmentResults({ quizzes, courses, work, submissions, reviews, enrollments: scope.students.map(s => ({ course_id: scope.course.id, student_id: s.id, name: s.name })), groupCopies: false })
  return comparisons.map(a => ({ key: 'quiz:' + a.id, sourceId: a.id, title: a.title, kind: 'quiz', unitIds: resultUnitIds(a.questions.map(q => q.target_id), scope.targets), targetIds: [...new Set(a.questions.map(q => q.target_id))], dueAt: a.due_at, archived: a.copies.every(c => c.status === 'archived'), cells: quizCells(a) }))
}

async function readings(scope: Scope): Promise<ResultActivity[]> {
  const assignments = (await read<ReadingAssignment>('textbook_assignments', '*', q => q.eq('course_id', scope.course.id).neq('status', 'draft'), ['id']))
    .filter(a => scope.includes(resultUnitIds(a.questions.map(q => q.target_id), scope.targets)))
  const ids = assignments.map(a => a.id), users = scope.students.map(s => s.id)
  const [work, exemptions] = users.length ? await Promise.all([
    byIds<Omit<ReadingWork, 'answers'>>('textbook_work', 'assignment_id,user_id,version,state,submission_id,updated_at', 'assignment_id', ids, ['assignment_id', 'user_id'], q => q.in('user_id', users)),
    byIds<{ assignment_id: string; user_id: string }>('textbook_reading_exemptions', 'assignment_id,user_id', 'assignment_id', ids, ['assignment_id', 'user_id'], q => q.in('user_id', users)),
  ]) : [[], []]
  const reviews = await byIds<Pick<ReadingReview, 'submission_id' | 'decision'>>('textbook_reviews', 'submission_id,decision', 'submission_id', work.flatMap(w => w.submission_id ? [w.submission_id] : []), ['reviewed_at', 'id'])
  const reviewById = new Map(reviews.map(r => [r.submission_id, r]))
  const byKey = new Map(work.map(w => [w.assignment_id + ':' + w.user_id, w]))
  const excused = new Set(exemptions.map(e => e.assignment_id + ':' + e.user_id))
  return assignments.map(a => ({ key: 'reading:' + a.id, sourceId: a.id, kind: 'reading', title: a.title, dueAt: a.due_at, unitIds: resultUnitIds(a.questions.map(q => q.target_id), scope.targets), targetIds: [...new Set(a.questions.map(q => q.target_id))], archived: a.status === 'archived', cells: Object.fromEntries(scope.students.map(student => {
    const key = a.id + ':' + student.id, w = byKey.get(key)
    if (excused.has(key)) return [student.id, { state: 'excused', label: 'Excused', needsReview: false } satisfies ResultCell]
    if (!w) return [student.id, notStarted()]
    const rated = w.state === 'rated' && !!w.submission_id && reviewById.get(w.submission_id)?.decision === 'rated'
    const pending = w.state === 'submitted' || w.state === 'rated' && !rated
    return [student.id, { state: rated ? 'reviewed' : pending ? 'submitted' : w.state === 'returned' ? 'returned' : 'draft', label: rated ? 'Teacher reviewed' : pending ? 'Needs review' : w.state === 'returned' ? 'Revise' : 'In progress', needsReview: pending } satisfies ResultCell]
  })) }))
}

async function reviews(scope: Scope, ctx: AuthContext): Promise<ResultActivity[]> {
  if (scope.course.program !== 'physics') return []
  const available = await read<ReviewAssignment>('review_module_assignments', '*', q => q.contains('course_ids', [scope.course.id]), ['slug'])
  const allowed: ReviewAssignment[] = []
  for (const a of available) if ((REVIEW_SLUGS as readonly string[]).includes(a.slug) && scope.includes(['unit-1']) && await canAccessReview(ctx, a)) allowed.push(a)
  const slugs = allowed.map(a => a.slug), users = scope.students.map(s => s.id)
  const [work, scores] = users.length ? await Promise.all([
    byIds<ReviewWork>('review_module_work', 'module_slug,user_id,state,status,version,submitted_at,updated_at', 'module_slug', slugs, ['module_slug', 'user_id'], q => q.in('user_id', users)),
    byIds<ReviewScore>('review_module_scores', 'module_slug,user_id,work_version,work_status,response_snapshot,status,result,overrides', 'module_slug', slugs, ['module_slug', 'user_id'], q => q.in('user_id', users)),
  ]) : [[], []]
  const byKey = new Map(work.map(w => [w.module_slug + ':' + w.user_id, w])), scoreByKey = new Map(scores.map(s => [s.module_slug + ':' + s.user_id, s]))
  return allowed.map(a => ({ key: 'review:' + a.slug, sourceId: a.slug, kind: 'review', title: a.title, unitIds: ['unit-1'], dueAt: null, archived: false, cells: Object.fromEntries(scope.students.map(s => [s.id, reviewCell(byKey.get(a.slug + ':' + s.id), scoreByKey.get(a.slug + ':' + s.id))])) }))
}

/** Read-only composition. Grading and mastery writes stay in their original providers. */
export async function loadAssessmentResults(ctx: AuthContext, course: Scope['course'], unitId: string): Promise<ResultsData> {
  const [roster, targets, units] = await Promise.all([
    read<{ student_id: string; students: { name: string; is_active?: boolean } | { name: string; is_active?: boolean }[] | null }>('course_students', 'student_id,students(name,is_active)', q => q.eq('course_id', course.id).eq('enrollment_state', 'ACTIVE'), ['student_id']),
    read<{ id: string; slug: string; unit_id: string; statement: string; lesson_id: string | null }>('learning_targets', 'id,slug,unit_id,statement,lesson_id', q => q.eq('program', course.program), ['id']),
    read<{ id: string; name: string; program: string | null }>('units', 'id,name,program', q => q, ['id']),
  ])
  const students = [...new Map(roster.flatMap(r => { const student = Array.isArray(r.students) ? r.students[0] : r.students; return student && student.is_active !== false ? [[r.student_id, { id: r.student_id, name: student.name }] as const] : [] })).values()].sort((a, b) => a.name.localeCompare(b.name))
  // Filter only after composition so missing unit mappings can be reported, not silently omitted.
  const scope: Scope = { course, students, targetRows: targets, targets: new Map(targets.map(t => [t.id, t.unit_id])), targetIdsBySlug: new Map(targets.map(t => [t.slug, t.id])), includes: () => true }
  const sources = [{ name: 'Interactive lessons and simulations', load: () => interactive(scope) }, { name: 'Quizzes', load: () => quizzes(scope) }, { name: 'Readings', load: () => readings(scope) }, { name: 'Reviews', load: () => reviews(scope, ctx) }, { name: 'Vocabulary', load: () => vocabularyResults(scope) }, { name: 'Math', load: () => mathResults(scope) }, { name: 'Videos', load: () => videoResults(scope) }, { name: 'Reflections and chapter responses', load: () => reflectionResults(scope) }, { name: 'Student choices', load: () => choiceResults(scope) }]
  const results = await Promise.allSettled(sources.map(source => source.load()))
  const activities: ResultActivity[] = [], warnings: ResultsData['warnings'] = []
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') activities.push(...result.value)
    else { console.error('[assessment-results]', sources[i].name, result.reason); warnings.push({ source: sources[i].name, message: 'Could not load this source. Review counts are incomplete until it refreshes.' }) }
  })
  const composed=composeChoiceResults(activities).map(retainArchivedEvidence)
  return { courseId: course.id, unitId, students, targets: targets.map(t => ({ id: t.id, statement: t.statement, unitId: t.unit_id })), units: units.filter(unit => (unit.program ?? 'physics') === course.program).map(({ id, name }) => ({ id, name })), warnings, unmapped: composed.filter(a => !a.unitIds.length && !a.crossUnit).length,
    activities: composed.filter(a => unitId === 'all' || (unitId === 'unmapped' ? !a.unitIds.length && !a.crossUnit : a.crossUnit || a.unitIds.includes(unitId))).sort((a, b) => (a.dueAt ?? '9999').localeCompare(b.dueAt ?? '9999') || a.title.localeCompare(b.title) || a.key.localeCompare(b.key)) }
}
