import { assignmentStats, completion, quizTotal } from './gradebook'
import type { ResultActivity, ResultsData, ResultStudent } from './types'

// Reuse the authoritative grade/completion helpers. Only their render lifetime
// changes; rounding, zero scores, excused work and term placement do not.
export function gradebookSummaries(activities: ResultActivity[], assignments: ResultActivity[], students: ResultStudent[], data: ResultsData | null | undefined) {
  const unavailableTerms = data?.warnings.some(w => w.source === 'Grading terms')
  return {
    activities: new Map(activities.map(activity => [activity.key, {
      ...assignmentStats(activity),
      due: activity.dueAt ? new Date(activity.dateOnly ? activity.dueAt + 'T12:00:00' : activity.dueAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—',
    }])),
    students: new Map(students.map(student => [student.id, {
      done: completion(assignments, student.id),
      total: data?.termQuizTotals?.[student.id] ?? (unavailableTerms ? { earned: 0, possible: 0, percent: null, count: 0 } : quizTotal(assignments, student.id)),
    }])),
  }
}

export type GradebookSummaries = ReturnType<typeof gradebookSummaries>
