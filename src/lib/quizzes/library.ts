import type { QuizCard, QuizCourse } from './types'

/** The selected section scopes assignments, not the teacher's reusable question library.
 * CPA and Honors share the physics program. Track is deliberately not a reuse gate.
 * Inputs must already be scoped to the teacher's courses by the API.
 */
export function quizLibrary(quizzes: QuizCard[], courses: QuizCourse[], courseId: string) {
  const course = courses.find(c => c.id === courseId)
  const compatible = new Set(courses.filter(c => c.program === course?.program).map(c => c.id))
  return {
    course,
    assignments: quizzes.filter(q => !q.deleted_at && (!courseId || q.course_id === courseId)),
    reusable: course ? quizzes.filter(q => !q.deleted_at && q.course_id !== courseId && compatible.has(q.course_id)) : [],
  }
}
