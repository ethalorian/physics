import {sourcePresentation} from './assignment-source-presentation'
import {TRANSFER_BRIEF_RUBRIC_VERSION} from './interactive-assignments/graded-assignment'
import type { ResultActivity, ResultCell, ResultKind, ResultsData } from './assessment-results/types'
import { releasedGrade, type Grade } from './assessment-results/gradebook'
import { assignedGradingTerm, assignmentTermDay, type GradingSettings } from './grading-terms'
import { schoolDayKey } from './school-day'
import { FOUR_DIMENSION_LAB_VERSION, labDimensionGrade, type ReleasedLabEntry } from './interactive-assignments/lab-rubric'

export type StudentLabEntry = ReleasedLabEntry & { assignmentKey: string; title: string; href: string; termId: string | null; attempt: number }

export type StudentWorkStatus = 'missing' | 'pending' | 'revise' | 'graded' | 'completed' | 'in_progress' | 'upcoming' | 'excused'
export const STUDENT_STATUS_LABELS: Record<StudentWorkStatus, string> = { missing: 'Missing', pending: 'Awaiting feedback', revise: 'Revise', graded: 'Graded', completed: 'Completed', in_progress: 'In progress', upcoming: 'To do', excused: 'Excused' }
export type StudentGradebookRow = { key: string; title: string; assignmentLabel?: string; kind: ResultKind; unitIds: string[]; dueAt: string | null; archived: boolean; termId: string | null; manualTerm: boolean; pairedKey?: string; prerequisites?: { id: string; title: string }[]; href: string; status: StudentWorkStatus; statusLabel: string; grade: Omit<Grade, 'version'> | null; feedback: string | null; releasedAt: string | null; submittedAt: string | null }
export type StudentLearningTarget = { id: string; statement: string; unitId: string; value: number | null; observations: { id: string; level: number; at: string; source: string }[] }
export type StudentProgressData = {
  staff: boolean; courseId: string | null; student: { id: string; name: string } | null
  courses: { id: string; name: string; section: string | null }[]; roster: { id: string; name: string }[]
  settings: GradingSettings; rows: StudentGradebookRow[]; units: ResultsData['units']; targets: StudentLearningTarget[]
  labEntries?: StudentLabEntry[]
  transferEntries?: StudentLabEntry[]
  syllabusCategories?: boolean
  feedback: { id: string; message: string; at: string; targetId: string | null }[]
  warnings: { source: string; message: string }[]; generatedAt: string
}
export function studentAssignmentPastDue(dueAt: string | null, now = new Date()): boolean {
  return !!dueAt && (/^\d{4}-\d{2}-\d{2}$/.test(dueAt) ? dueAt < schoolDayKey(now) : Date.parse(dueAt) < now.getTime())
}
export function studentWorkStatus(activity: Pick<ResultActivity, 'dueAt' | 'archived'>, cell: ResultCell, now = new Date()): StudentWorkStatus {
  if (cell.state === 'excused') return 'excused'
  if (cell.state === 'returned') return 'revise'
  if (releasedGrade(cell)) return 'graded'
  if (cell.state === 'submitted') return 'pending'
  if (cell.state === 'reviewed' || cell.state === 'completed') return 'completed'
  // A reopened submission is a revision, not work that was never handed in.
  if (cell.submittedAt) return 'revise'
  if (studentAssignmentPastDue(activity.dueAt, now) && !activity.archived) return 'missing'
  return cell.state === 'draft' ? 'in_progress' : 'upcoming'
}
export function studentActivityHref(activity: ResultActivity, lessonSlugs: Map<string, string>): string {
  const id = encodeURIComponent(activity.sourceId)
  if (activity.kind === 'quiz') return '/quizzes/' + id
  if (activity.kind === 'worksheet') return '/worksheet-assignments/' + id
  if (activity.kind === 'reading') return '/readings/' + id
  if (activity.kind === 'interactive' || activity.kind === 'simulation') return '/interactive-assignments/' + encodeURIComponent(activity.key.replace(/^interactive:/, ''))
  if (activity.kind === 'review') return '/review/' + id
  if (activity.kind === 'vocabulary') return '/vocabulary/work?task_id=' + id
  if (['lesson', 'video', 'reflection'].includes(activity.kind)) return lessonSlugs.has(activity.sourceId) ? '/lessons/' + encodeURIComponent(lessonSlugs.get(activity.sourceId)!) : '/home?view=week'
  return '/home?view=week'
}
/** Explicit projection: never send teacher cells, review IDs, private suggestions or answer keys. */
export function studentGradebookRows(activities: ResultActivity[], studentId: string, settings: GradingSettings, lessonSlugs = new Map<string, string>(), now = new Date()): StudentGradebookRow[] {
  return activities.flatMap(activity => {
    const cell = activity.cells[studentId]
    if (!cell || activity.crossUnit || cell.label === 'Not chosen') return []
    const hasEvidence = cell.state !== 'not_started' || !!cell.grade || !!cell.submittedAt
    if ((!activity.dueAt || activity.archived) && !hasEvidence) return []
    // Unused optional choices do not become assignments on the student's ledger.
    if (activity.kind === 'choice' && cell.state === 'excused') return []
    const status = studentWorkStatus(activity, cell, now), released = releasedGrade(cell)
    const grade = released ? { earned: released.earned, possible: released.possible, percent: released.percent, letter: released.letter } : null
    return [{ key: activity.key, title: activity.title, assignmentLabel:sourcePresentation(activity).label, kind: activity.kind, unitIds: [...activity.unitIds], dueAt: activity.dueAt, archived: activity.archived, pairedKey: activity.pairedKey, termId: assignedGradingTerm(activity, settings)?.id ?? null, manualTerm: !!settings.placements[activity.key], href: studentActivityHref(activity, lessonSlugs), status, statusLabel: activity.kind === 'worksheet' && status === 'completed' ? 'Handed in' : STUDENT_STATUS_LABELS[status], grade, feedback: cell.feedback?.trim() || null, releasedAt: cell.releasedAt ?? null, submittedAt: cell.submittedAt ?? null }]
  })
}
export function isStudentHomework(row: StudentGradebookRow, now = new Date()): boolean {
  return isAssignedStudentWork(row) && !studentWorkComplete(row) && studentAssignmentPastDue(row.dueAt, now)
}
export function isAssignedStudentWork(row: StudentGradebookRow): boolean {
  return !row.archived && row.status !== 'excused' && !!row.dueAt && assignmentTermDay(row.dueAt) !== null
}
export function studentWorkComplete(row: StudentGradebookRow): boolean {
  return ['pending', 'graded', 'completed'].includes(row.status)
}
/** Deadline changes are reflected while the page stays open, without changing saved work. */
export function currentStudentRows(rows: StudentGradebookRow[], now = new Date()): StudentGradebookRow[] {
  return rows.map(row => ['upcoming', 'in_progress'].includes(row.status) && isStudentHomework(row, now)
    ? { ...row, status: 'missing', statusLabel: row.prerequisites?.length ? row.statusLabel : STUDENT_STATUS_LABELS.missing } : row)
}
export function studentCompletionTotal(rows: StudentGradebookRow[], termId: string) {
  const counted = rows.filter(row => isAssignedStudentWork(row) && studentRowInTerm(row, termId))
  const completed = counted.filter(studentWorkComplete).length
  return { completed, assigned: counted.length, notCompleted: counted.length - completed, percent: counted.length ? completed / counted.length * 100 : null, counted }
}
function studentRowInTerm(row: { termId: string | null }, termId: string) {
  return termId === 'all' || (termId === 'unassigned' ? !row.termId : row.termId === termId)
}
/** Choice-owned lab evidence retains its own grade, with the visible assignment's term. */
export function studentLabEntries(activities: ResultActivity[], studentId: string, settings: GradingSettings): StudentLabEntry[] { return studentDimensionEntries(activities,studentId,settings,'labGrades') }
export function studentTransferEntries(activities: ResultActivity[], studentId: string, settings: GradingSettings): StudentLabEntry[] { return studentDimensionEntries(activities,studentId,settings,'transferGrades') }
function studentDimensionEntries(activities: ResultActivity[], studentId: string, settings: GradingSettings, field:'labGrades'|'transferGrades'): StudentLabEntry[] {
  const entries = new Map<string, StudentLabEntry>()
  function collect(activity: ResultActivity, owner = activity) {
    const cell = activity.cells[studentId], ownerCell = owner.cells[studentId]
    if (!cell || cell.state === 'excused' || cell.label === 'Not chosen' || ownerCell?.state === 'excused' || ownerCell?.label === 'Not chosen') return
    const history = [...(cell[field] ?? [])].sort((a,b) => a.submittedAt.localeCompare(b.submittedAt) || a.submissionId.localeCompare(b.submissionId))
    history.forEach((g, index) => entries.set(g.submissionId, {
      submissionId: g.submissionId, rubricVersion: g.rubricVersion, items: g.items.map(i => ({id:i.id,earned:i.earned,possible:i.possible,feedback:i.feedback})), percent: g.percent, letter: g.letter, feedback: g.feedback, releasedAt: g.releasedAt, submittedAt: g.submittedAt,
      assignmentKey: activity.key, title: activity.title, href: studentActivityHref(activity, new Map()), termId: assignedGradingTerm(owner, settings)?.id ?? null, attempt: index + 1,
    }))
    for (const evidence of activity.evidenceActivities ?? []) collect(evidence, owner)
  }
  activities.forEach(a => collect(a))
  return [...entries.values()].sort((a,b) => b.submittedAt.localeCompare(a.submittedAt))
}
export function studentLabTotal(entries: StudentLabEntry[], termId: string) { return studentDimensionTotal(entries,termId,FOUR_DIMENSION_LAB_VERSION) }
/** A revision replaces this brief's contribution; previous releases remain in history. */
export function studentTransferTotal(entries: StudentLabEntry[], termId: string) {
  const result=studentDimensionTotal(entries,termId,TRANSFER_BRIEF_RUBRIC_VERSION)
  const latest=new Map<string,StudentLabEntry>()
  for(const entry of result.counted){
    const prior=latest.get(entry.assignmentKey)
    if(!prior || entry.submittedAt>prior.submittedAt || (entry.submittedAt===prior.submittedAt && entry.releasedAt>prior.releasedAt))latest.set(entry.assignmentKey,entry)
  }
  const counted=[...latest.values()]
  return {...result,counted,percent:counted.length?counted.reduce((sum,e)=>sum+e.percent,0)/counted.length:null}
}
function studentDimensionTotal(entries: StudentLabEntry[], termId: string, version:string) {
  const inTerm = entries.filter(e => studentRowInTerm(e, termId))
  const counted = [...new Map(inTerm.filter(e => e.rubricVersion === version && labDimensionGrade(e.items)?.percent === e.percent).map(e => [e.submissionId,e])).values()]
  return { percent: counted.length ? counted.reduce((sum,e) => sum + e.percent, 0) / counted.length : null, counted, legacyCount: inTerm.filter(e => e.rubricVersion !== version).length }
}
export function studentQuizTotal(rows: StudentGradebookRow[], termId: string) {
  const counted = rows.filter(row => row.kind === 'quiz' && row.grade && row.status !== 'excused' && studentRowInTerm(row, termId))
  const earned = counted.reduce((sum, row) => sum + row.grade!.earned, 0), possible = counted.reduce((sum, row) => sum + row.grade!.possible, 0)
  return { earned, possible, percent: possible ? 100 * earned / possible : null, counted }
}
export function studentRowOrder(a: StudentGradebookRow, b: StudentGradebookRow) {
  const missing = Number(b.status === 'missing') - Number(a.status === 'missing')
  const aDay = assignmentTermDay(a.dueAt) ?? '', bDay = assignmentTermDay(b.dueAt) ?? ''
  return missing || (a.status === 'missing' ? aDay.localeCompare(bDay) : bDay.localeCompare(aDay)) || a.title.localeCompare(b.title)
}
export function studentDueLabel(dueAt: string | null) {
  const day = assignmentTermDay(dueAt)
  return day ? new Date(day + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' }) : 'No due date'
}
