import { studentCompletionTotal, studentLabTotal, studentTransferTotal, studentQuizTotal, type StudentProgressData } from './student-gradebook'

export const STUDENT_GRADE_CATEGORIES = [
  { id: 'transfer', label: 'Transfer Task', weight: 40, description: 'Released Transfer Brief grades' },
  { id: 'labs', label: 'Labs', weight: 20, description: 'Released four-dimension lab grades' },
  { id: 'quizzes', label: 'Quizzes and skill checks', weight: 20, description: 'Released quizzes only' },
  { id: 'homework', label: 'Homework', weight: 10, description: 'Completed ÷ assigned work' },
  { id: 'xp', label: 'Unit XP floor', weight: 5, description: 'Credit for meeting each unit’s floor' },
  { id: 'attendance', label: 'Attendance', weight: 5, description: 'Recorded attendance and earned-back credit' },
] as const

type CategoryId = typeof STUDENT_GRADE_CATEGORIES[number]['id']
type CategoryStatus = 'graded' | 'empty' | 'unavailable' | 'not_connected'
export type StudentGradeCategory = {
  id: CategoryId; label: string; weight: number; description: string
  percent: number | null; status: CategoryStatus
}

/** Normalize only the weights with grades; an actual zero still contributes. */
export function weightedStudentAverage(categories: Pick<StudentGradeCategory, 'percent' | 'weight'>[]) {
  const counted = categories.filter(category => category.percent !== null && Number.isFinite(category.percent) && category.weight > 0)
  const weight = counted.reduce((sum, category) => sum + category.weight, 0)
  return {
    percent: weight ? counted.reduce((sum, category) => sum + category.percent! * category.weight, 0) / weight : null,
    weight, count: counted.length, complete: categories.length > 0 && counted.length === categories.length,
  }
}

export function studentGradeSummary(data: StudentProgressData | null, termId: string) {
  const quizzes = studentQuizTotal(data?.rows ?? [], termId)
  const transfer = studentTransferTotal(data?.transferEntries ?? [], termId)
  const labs = studentLabTotal(data?.labEntries ?? [], termId)
  const work = studentCompletionTotal(data?.rows ?? [], termId)
  const syllabus = data?.syllabusCategories === true
  const warnings = new Set(data?.warnings.map(warning => warning.source))
  const scopeUnavailable = !data?.student || warnings.has('Grading terms')
  const quizUnavailable = scopeUnavailable || warnings.has('Quizzes')
  const labUnavailable = scopeUnavailable || !data?.labEntries || warnings.has('Interactive lessons and simulations') || warnings.has('Student choices')
  const workUnavailable = scopeUnavailable || [...warnings].some(source => !['Learning history', 'Assignment links', 'Claude suggestions'].includes(source))
  const categories: StudentGradeCategory[] = (syllabus ? STUDENT_GRADE_CATEGORIES : STUDENT_GRADE_CATEGORIES.filter(category => category.id === 'quizzes')).map(category => {
    const connected = category.id === 'transfer' || category.id === 'labs' || category.id === 'quizzes' || category.id === 'homework'
    const unavailable = category.id === 'transfer' ? scopeUnavailable || !data?.transferEntries || warnings.has('Interactive lessons and simulations') || warnings.has('Student choices') : category.id === 'homework' ? workUnavailable : category.id === 'labs' ? labUnavailable : quizUnavailable
    const percent = !connected || unavailable ? null : category.id === 'transfer' ? transfer.percent : category.id === 'homework' ? work.percent : category.id === 'labs' ? labs.percent : quizzes.percent
    return {
      ...category,
      label: syllabus ? category.label : 'Quiz score', weight: syllabus ? category.weight : 100,
      percent, status: !connected ? 'not_connected' : unavailable ? 'unavailable' : percent === null ? 'empty' : 'graded',
    }
  })
  const unavailable = categories.some(category => category.status === 'unavailable')
  const average = weightedStudentAverage(categories)
  // A failed source must not silently change which weights contribute to the grade.
  return { categories, quizzes, labs, transfer, work, workUnavailable, syllabus, unavailable, average: { ...average, percent: unavailable ? null : average.percent } }
}
