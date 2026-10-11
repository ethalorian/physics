export type AssignmentKind = 'video' | 'reading' | 'quiz' | 'vocabulary'
export type AssignmentView = 'todo' | 'overdue' | 'upcoming' | 'submitted'
export interface StudentAssignment {
  id: string
  kind: AssignmentKind
  title: string
  href: string
  due: string | null
  complete: boolean
  status: string
  action: string
  returned?: boolean
  assignedAt?: string
  context?: string
}
export const ASSIGNMENT_LABELS: Record<AssignmentKind, string> = { video: 'Video', reading: 'Reading', quiz: 'Quiz', vocabulary: 'Vocabulary' }

// Vocabulary deadlines are dates, rather than instants: keep the entire local due day available.
export function assignmentDeadline(due: string | null) {
  return due ? Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(due) ? `${due}T23:59:59.999` : due) : NaN
}
export function assignmentDueLabel(due: string | null) {
  if (!due || !Number.isFinite(assignmentDeadline(due))) return 'No due date set'
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(due)
  return `Due ${new Date(assignmentDeadline(due)).toLocaleString(undefined, { month: 'short', day: 'numeric', ...(dateOnly ? {} : { hour: 'numeric', minute: '2-digit' }) })}`
}
export function assignmentInView(item: StudentAssignment, view: AssignmentView, now: number) {
  if (view === 'submitted') return item.complete
  if (item.complete) return false
  const due = assignmentDeadline(item.due)
  return view === 'todo' || (view === 'overdue' ? due < now : due >= now && due <= now + 7 * 86400000)
}
export function prioritizeAssignments(items: StudentAssignment[], now: number) {
  return [...items].sort((a, b) => {
    const aDue = assignmentDeadline(a.due), bDue = assignmentDeadline(b.due)
    const overdue = (due: number) => Number(Number.isFinite(due) && due < now)
    return overdue(bDue) - overdue(aDue) || Number(!!b.returned) - Number(!!a.returned)
      || (Number.isFinite(aDue) ? aDue : Infinity) - (Number.isFinite(bDue) ? bDue : Infinity) || 0
  })
}
