import type { GradingTerm } from './grading-terms'

export const ATTENDANCE_LABELS = {
  participated: 'Participated', present: 'Present without participation', absent: 'Absent', excused: 'Excused',
} as const
export type AttendanceStatus = keyof typeof ATTENDANCE_LABELS
export type DayMark = { meeting_day: string; mark: AttendanceStatus | 'no_credit'; made_up: boolean; revision: number; source?: string | null; at_time?: string | null }
export type AttendanceCounts = { earned: number; eligible: number }
export type AttendanceGrade = AttendanceCounts & { term_id: string; full_credit_at?: number; live?: boolean }
export type StudentAttendance = { marks: DayMark[]; meetings: string[]; posted: AttendanceGrade[]; scheduleConfigured: boolean; progressUnavailable?: boolean }
export type AttendanceRosterRow = {
  id: string; name: string; entered: string | null; marks: DayMark[]; posted: AttendanceGrade | null
}
export type AttendancePreview = {
  terms: GradingTerm[]; term: GradingTerm | null; meetings: string[]; day: string | null; today: string;
  roster: AttendanceRosterRow[];
  readOnly: boolean; scheduleConfigured: boolean; livePublished?: boolean
}
export type AttendanceEdit = { id: string; mark: AttendanceStatus; made_up: boolean; revision: number }

export function inAttendanceTerm(day: string, term: GradingTerm) {
  return day >= term.start && day <= term.end
}
export function attendanceCounts(marks: DayMark[]): AttendanceCounts {
  const eligible = marks.filter(m => m.mark !== 'excused')
  return { eligible: eligible.length, earned: eligible.filter(m => m.mark === 'participated' || m.made_up).length }
}
export function withoutAttendanceCredit(mark: DayMark) {
  return mark.mark !== 'excused' && mark.mark !== 'participated' && !mark.made_up
}
export function attendancePercent({ earned, eligible }: AttendanceCounts) {
  return eligible ? 100 * earned / eligible : null
}
export function attendanceGrade(counts: AttendanceCounts, fullCreditAt = 80) {
  const participation = attendancePercent(counts)
  return participation === null ? null : Math.min(100, participation * 100 / fullCreditAt)
}
export function postedAttendanceGrade(grade: AttendanceGrade) {
  return attendanceGrade(grade, grade.full_credit_at ?? 100)
}
export function liveAttendanceGrade(term: GradingTerm, marks: DayMark[], through: string): AttendanceGrade {
  const elapsed = marks.filter(mark => mark.meeting_day <= through && inAttendanceTerm(mark.meeting_day, term))
  return { term_id: term.id, ...attendanceCounts(elapsed), full_credit_at: 80, live: true }
}
// One posted grade per term. A confirmed zero is a grade, an empty term is not.
export function postedAttendancePercent(report: StudentAttendance | undefined, termId: string) {
  const scores = (report?.posted ?? []).filter(g => g.eligible > 0 && (termId === 'all' || g.term_id === termId))
  return scores.length ? scores.reduce((sum, grade) => sum + postedAttendanceGrade(grade)!, 0) / scores.length : null
}
export function termPreview(roster: AttendanceRosterRow[]) {
  return roster.map(row => ({ id: row.id, ...attendanceCounts(row.marks) })).sort((a,b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
}
