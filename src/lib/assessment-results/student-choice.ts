import 'server-only'
import { read, byIds, type Scope } from './queries'
import type { ResultActivity, ResultCell } from './types'
import { choiceReviewLabel, type StudentChoiceAssignment, type StudentChoiceReview } from '../student-choice'
export async function studentChoiceResults(scope: Scope): Promise<ResultActivity[]> {
  if (scope.course.program !== 'physics') return []
  const assignments = (await read<StudentChoiceAssignment>('student_choice_assignments', '*', q => q.eq('course_id', scope.course.id), ['id'])).filter(a => scope.includes([a.unit_id]))
  const reviews = scope.students.length ? await byIds<StudentChoiceReview>('student_choice_reviews', 'assignment_id,user_id,state,letter_grade,feedback,version,recorded_at', 'assignment_id', assignments.map(a => a.id), ['assignment_id', 'user_id'], q => q.in('user_id', scope.students.map(s => s.id))) : []
  const index = new Map(reviews.map(r => [r.assignment_id + ':' + r.user_id, r]))
  return assignments.map(a => ({ key: 'student-choice:' + a.id, sourceId: a.id, kind: 'student_choice', title: a.title, unitIds: [a.unit_id], targetIds: [], dueAt: a.due_at, archived: a.status === 'archived', description: 'Notebook and one practice choice · Teacher-selected letter grade', cells: Object.fromEntries(scope.students.map(st => {
    const r = index.get(a.id + ':' + st.id)
    return [st.id, { state: r?.state === 'excused' ? 'excused' : r?.letter_grade ? 'reviewed' : r?.state === 'received' ? 'submitted' : 'not_started', label: choiceReviewLabel(r), needsReview: a.status === 'published' && r?.state === 'received' && !r.letter_grade, feedback: r?.feedback, submittedAt: r?.state === 'received' ? r.recorded_at : null, releasedAt: r?.letter_grade ? r.recorded_at : null, manualLetter: r?.letter_grade ?? undefined } satisfies ResultCell]
  })) }))
}
