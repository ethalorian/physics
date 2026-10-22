import type { AssessmentComparison } from '@/lib/quizzes/comparison'
import { resultGrade } from '@/lib/quizzes/insights'
import type { ReviewScore, ReviewWork } from '@/lib/review-modules/analytics'
import { effectiveItems, scoreIsCurrent, scorePercent } from '@/lib/review-modules/analytics'
import type { ResultActivity, ResultCell, ResultStudent } from './types'

export const notStarted = (): ResultCell => ({ state: 'not_started', label: 'Not started', needsReview: false })

/** Withdrawn work keeps its evidence, but creates no obligation for an unattempted student.
 * Choice requirements (including missing-choice zeroes) remain owned by the menu. */
export function retainArchivedEvidence(activity: ResultActivity): ResultActivity {
  if (!activity.archived || activity.kind === 'choice') return activity
  return { ...activity, cells: Object.fromEntries(Object.entries(activity.cells).filter(([, cell]) => cell.state !== 'not_started')) }
}

/** Source-native grades remain separate from canonical learning-target ratings. */
export function quizCells(assessment: AssessmentComparison): Record<string, ResultCell> {
  return Object.fromEntries(assessment.students.map(row => {
    const reviewed = row.state === 'graded' && row.percent !== null && (row.gradeMode === 'numeric' || !!row.gradeValue)
    const needsReview = row.state === 'submitted' || row.state === 'graded' && !reviewed
    const state = reviewed ? 'reviewed' : needsReview ? 'submitted' : row.state === 'returned' ? 'returned' : row.state === 'in_progress' ? 'draft' : 'not_started'
    return [row.student_id, { state, needsReview,
      label: reviewed ? resultGrade(row) : needsReview ? 'Needs review' : state === 'returned' ? 'Revise' : state === 'draft' ? 'In progress' : 'Not started',
      detail: reviewed ? `${row.earned} / ${row.possible} points · Teacher graded` : undefined,
      submittedAt: row.submittedAt,
    } satisfies ResultCell]
  }))
}

export function reviewCell(work?: ReviewWork, score?: ReviewScore): ResultCell {
  if (!work) return notStarted()
  // A reopened draft must not inherit the previous submitted grade or AI status.
  const current = scoreIsCurrent(score, work)
  const assessment = current ? score?.status === 'running' ? 'processing' : score?.status : 'none'
  const submitted = work.status === 'submitted'
  const percent = current && score?.status === 'ready' ? scorePercent(effectiveItems(score)) : null
  const uncertain = !!score?.result?.items.some(item => item.confidence === 'low' && !score.overrides?.[item.id])
  return {
    state: submitted ? percent === null ? 'submitted' : 'reviewed' : 'draft',
    label: submitted ? percent === null ? 'Awaiting assessment' : `${percent}%` : 'In progress',
    detail: submitted ? percent === null ? 'No current submitted score' : 'Auto-scored · Written responses' : 'Draft estimates are not submitted grades',
    needsReview: submitted && (percent === null || uncertain), assessment: assessment ?? 'none', submittedAt: work.submitted_at,
  }
}

export function filterResults(activities: ResultActivity[], students: ResultStudent[], options: { kind?: string; needsReview?: boolean; query?: string; student?: string; archived?: boolean }) {
  const query = options.query?.trim().toLocaleLowerCase() ?? ''
  const columns = activities.filter(a => (options.archived || !a.archived) && (!options.kind || options.kind === 'all' || a.kind === options.kind))
  const roster = students.filter(student => (!options.student || student.id === options.student) && (!query || student.name.toLocaleLowerCase().includes(query)))
  const shown = options.needsReview ? columns.filter(a => roster.some(student => a.cells[student.id]?.needsReview)) : columns
  const rows = options.needsReview ? roster.filter(student => shown.some(a => a.cells[student.id]?.needsReview)) : roster
  // One submission is counted once, even if several targets still need a decision.
  const pendingIds = new Set<string>()
  for (const activity of columns) for (const student of roster) {
    const cell = activity.cells[student.id]
    if (cell?.needsReview) for (const id of cell.reviewIds?.length ? cell.reviewIds : [activity.key]) pendingIds.add(student.id + ':' + id)
  }
  const pending = pendingIds.size
  return { activities: shown, students: rows, pending }
}

export function resultUnitIds(targetIds: string[], targets: Map<string, string>): string[] {
  return [...new Set(targetIds.flatMap(id => targets.has(id) ? [targets.get(id)!] : []))]
}
