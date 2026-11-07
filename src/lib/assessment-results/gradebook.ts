import type { ResultActivity, ResultCell, ResultStudent } from './types'

export type Grade = { earned: number; possible: number; percent: number; letter: string; version: string }
export const GRADE_SCALE = 'A+ 97–100 · A 93–96.9 · A− 90–92.9 · B+ 87–89.9 · B 83–86.9 · B− 80–82.9 · C+ 77–79.9 · C 73–76.9 · C− 70–72.9 · D+ 67–69.9 · D 63–66.9 · D− 60–62.9 · F below 60'
export function letterGrade(percent: number) {
  const rounded = Math.round(percent * 10) / 10
  return ([[97,'A+'],[93,'A'],[90,'A-'],[87,'B+'],[83,'B'],[80,'B-'],[77,'C+'],[73,'C'],[70,'C-'],[67,'D+'],[63,'D'],[60,'D-']] as const).find(([min]) => rounded >= min)?.[1] ?? 'F'
}
export function releasedGrade(cell?: ResultCell): Grade | null {
  const grade = cell?.grade
  if (!grade || cell?.state === 'excused' || !Number.isFinite(grade.earned) || !Number.isFinite(grade.possible) || grade.earned < 0 || grade.possible <= 0) return null
  const percent = 100 * grade.earned / grade.possible
  return { ...grade, percent, letter: grade.letter ?? letterGrade(percent) }
}
export function gradeBand(percent: number | null | undefined) { return percent == null || !Number.isFinite(percent) ? 'none' : percent >= 80 ? 'high' : percent >= 60 ? 'mid' : 'low' }
/** Returned is a teacher-completed review, never just a ready AI suggestion. */
export function gradebookStatus(cell?: ResultCell) {
  if (!cell) return 'Not assigned'
  if (cell.manualLetter && cell.state !== 'excused') return 'Reviewed · ' + cell.manualLetter
  if (cell.state === 'reviewed' && !cell.needsReview) return 'Returned'
  if (cell.state === 'returned' && !cell.needsReview) return 'Returned · revision requested'
  return cell.label
}
export function isComplete(cell?: ResultCell) { return !!cell && (['submitted','reviewed','completed','returned'].includes(cell.state) || !!cell.submittedAt) }
export function completion(activities: ResultActivity[], studentId?: string) {
  let completed = 0, assigned = 0
  for (const activity of activities) {
    if (activity.crossUnit || activity.archived) continue
    for (const [id, cell] of Object.entries(activity.cells)) {
      if (studentId && id !== studentId || cell.state === 'excused' || cell.label === 'Not chosen') continue
      assigned++; if (isComplete(cell)) completed++
    }
  }
  return { completed, assigned }
}
export function quizTotal(activities: ResultActivity[], studentId: string) {
  const grades = activities.filter(a => a.kind === 'quiz' && !a.archived).flatMap(a => { const grade = releasedGrade(a.cells[studentId]); return grade ? [grade] : [] })
  const earned = grades.reduce((n,g) => n + g.earned, 0), possible = grades.reduce((n,g) => n + g.possible, 0)
  return { earned, possible, percent: possible ? 100 * earned / possible : null, count: grades.length }
}
function isAssignedCell(cell?: ResultCell): cell is ResultCell {
  return !!cell && cell.state !== 'excused' && cell.label !== 'Not chosen'
}

/** A final result may be mastery-only or an earlier release still visible during a revision. */
export function assignmentRelease(activity: ResultActivity, studentId: string): { at: string | null } | null {
  if (!isAssignedCell(activity.cells[studentId])) return null
  let released = false
  let latest: string | null = null
  for (const source of [activity, ...(activity.evidenceActivities ?? [])]) {
    const cell = source.cells[studentId]
    if (!isAssignedCell(cell)) continue
    const final = !!releasedGrade(cell) || (cell.state === 'reviewed' && !cell.needsReview)
    if (final) released = true
    const dates = [cell.reviewReleasedAt, final ? cell.releasedAt : null]
    for (const attempt of cell.labGrades ?? cell.transferGrades ?? []) dates.push(attempt.releasedAt)
    for (const date of dates) {
      if (date && (!latest || Date.parse(date) > Date.parse(latest))) latest = date
    }
  }
  return released || latest ? { at: latest } : null
}

export function assignmentStats(activity: ResultActivity) {
  const students = Object.keys(activity.cells).filter(id => isAssignedCell(activity.cells[id]))
  const cells = students.map(id => activity.cells[id])
  const grades = cells.flatMap(cell => { const grade = releasedGrade(cell); return grade ? [grade] : [] })
  return {
    assigned: students.length,
    completed: cells.filter(isComplete).length,
    released: students.filter(id => assignmentRelease(activity, id)).length,
    scored: grades.length,
    pending: cells.filter(cell => cell.needsReview).length,
    average: grades.length ? grades.reduce((sum, grade) => sum + grade.percent, 0) / grades.length : null,
  }
}
export function sortRoster(students: ResultStudent[], order: 'last' | 'first') {
  const key = (student: ResultStudent) => order === 'first' ? (student.firstName?.trim() || student.name) + ' ' + (student.lastName ?? '') : (student.lastName?.trim() || student.name.trim().split(/\s+/).slice(-1)[0]) + ' ' + (student.firstName?.trim() || student.name)
  return [...students].sort((a,b) => key(a).localeCompare(key(b)) || a.id.localeCompare(b.id))
}
export type EntryFormat = 'points' | 'percent' | 'letter'
export type EntryMark = { version: string; earned: number; possible: number; format: EntryFormat; value: string }
export function entryValue(grade: Grade, format: EntryFormat) { return format === 'letter' ? grade.letter : format === 'percent' ? grade.percent.toFixed(1) : String(grade.earned) }
export function entrySnapshot(grade: Grade, format: EntryFormat): EntryMark { return { version: grade.version, earned: grade.earned, possible: grade.possible, format, value: entryValue(grade, format) } }
export function entryChanged(mark: EntryMark | undefined, grade: Grade | null, format?: EntryFormat) { return !!mark && (!grade || mark.version !== grade.version || mark.earned !== grade.earned || mark.possible !== grade.possible || !!format && (mark.format !== format || mark.value !== entryValue(grade, format))) }
