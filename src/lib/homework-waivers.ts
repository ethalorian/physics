import type { StudentGradebookRow } from './student-gradebook'

export function homeworkKey(key: string) {
  return key.replace(/^(video|reflection):/, 'lesson:')
}

export function calendarHomeworkRequired(item: { id: string; courseId?: string }, waiverCourses?: Record<string, string[]>) {
  const courses = waiverCourses?.[homeworkKey(item.id)]
  // Only lesson IDs can refer to assignments in more than one course.
  return !courses || (item.courseId ? !courses.includes(item.courseId) : homeworkKey(item.id).startsWith('lesson:'))
}

/** Keep submitted work and released feedback in the record. A returned assignment
 * may still show its feedback and status without requiring another submission. */
export function waivedHomeworkRow(row: StudentGradebookRow, keys: Set<string>): StudentGradebookRow {
  if (!keys.has(homeworkKey(row.key))) return row
  const unfinished = ['missing', 'in_progress', 'upcoming'].includes(row.status)
  if (row.status === 'revise' || (unfinished && row.submittedAt)) {
    return { ...row, status: 'revise', statusLabel: 'Homework credit earned · revision optional', homeworkWaived: true }
  }
  if (!unfinished) return row
  if (row.grade || row.hasReleasedResult || row.feedback) return { ...row, homeworkWaived: true }
  return { ...row, status: 'excused', statusLabel: 'Excused', homeworkWaived: true }
}
