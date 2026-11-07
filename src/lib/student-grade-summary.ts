import { postedFloorAverage } from './assigned-mastery-xp'
import { postedAttendancePercent } from './meaningful-attendance'
import { studentCompletionTotal, studentHomeworkTotal, studentLabTotal, studentTransferTotal, studentQuizTotal, type StudentProgressData } from './student-gradebook'

export const STUDENT_GRADE_CATEGORIES = [
  { id: 'transfer', label: 'Transfer Task', weight: 40, description: 'Released Transfer Brief grades' },
  { id: 'labs', label: 'Labs', weight: 20, description: 'Released four-dimension lab grades' },
  { id: 'quizzes', label: 'Quizzes and skill checks', weight: 20, description: 'Released quizzes only' },
  { id: 'homework', label: 'Homework', weight: 10, description: 'Completed ÷ activities past their deadlines' },
  { id: 'xp', label: 'Unit XP floor', weight: 5, description: 'Credit for meeting each unit’s floor' },
  { id: 'attendance', label: 'Meaningful attendance', weight: 5, description: 'Posted term attendance' },
] as const

type CategoryId = typeof STUDENT_GRADE_CATEGORIES[number]['id']
type CategoryStatus = 'graded' | 'empty' | 'unavailable'
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

export function studentGradeSummary(data: StudentProgressData | null, termId: string, now = new Date()) {
  const quizzes = studentQuizTotal(data?.rows ?? [], termId)
  const transfer = studentTransferTotal(data?.transferEntries ?? [], termId)
  const labs = studentLabTotal(data?.labEntries ?? [], termId)
  const work = studentCompletionTotal(data?.rows ?? [], termId)
  const homework = studentHomeworkTotal(data?.rows ?? [], termId, now)
  const syllabus = data?.syllabusCategories === true
  const warnings = new Set(data?.warnings.map(warning => warning.source))
  const scopeUnavailable = !data?.student || warnings.has('Grading terms')
  const quizUnavailable = scopeUnavailable || warnings.has('Quizzes')
  const labUnavailable = scopeUnavailable || !data?.labEntries || warnings.has('Interactive lessons and simulations') || warnings.has('Student choices')
  const workUnavailable = scopeUnavailable || [...warnings].some(source => !['Learning history', 'Assignment links', 'Claude suggestions', 'Unit XP floor', 'Meaningful attendance'].includes(source))
  const categories: StudentGradeCategory[] = (syllabus ? STUDENT_GRADE_CATEGORIES : STUDENT_GRADE_CATEGORIES.filter(category => category.id === 'quizzes')).map(category => {
    if (category.id === 'attendance') {
      const unavailable = scopeUnavailable || warnings.has('Meaningful attendance')
      const percent = unavailable ? null : postedAttendancePercent(data?.attendance, termId)
      return {...category, percent, status: unavailable ? 'unavailable' : percent === null ? 'empty' : 'graded'}
    }
    const unavailable = category.id === 'xp' ? scopeUnavailable || warnings.has('Unit XP floor') : category.id === 'transfer' ? scopeUnavailable || !data?.transferEntries || warnings.has('Interactive lessons and simulations') || warnings.has('Student choices') : category.id === 'homework' ? workUnavailable : category.id === 'labs' ? labUnavailable : quizUnavailable
    const percent = unavailable ? null : category.id === 'xp' ? postedFloorAverage(data?.masteryXp, termId) : category.id === 'transfer' ? transfer.percent : category.id === 'homework' ? homework.percent : category.id === 'labs' ? labs.percent : quizzes.percent
    return {
      ...category,
      label: syllabus ? category.label : 'Quiz score', weight: syllabus ? category.weight : 100,
      percent, status: unavailable ? 'unavailable' : percent === null ? 'empty' : 'graded',
    }
  })
  const unavailable = categories.some(category => category.status === 'unavailable')
  const average = weightedStudentAverage(categories)
  // A failed source must not silently change which weights contribute to the grade.
  return { categories, quizzes, labs, transfer, work, homework, workUnavailable, syllabus, unavailable, average: { ...average, percent: unavailable ? null : average.percent } }
}
