export type AssignmentKind = 'worksheet' | 'video' | 'lesson' | 'reading' | 'quiz' | 'vocabulary' | 'review'
export type AssignmentView = 'todo' | 'overdue' | 'upcoming' | 'submitted'
export interface StudentAssignment {
  id: string
  kind: AssignmentKind
  title: string
  href: string
  due: string | null
  closesAt?: string | null
  complete: boolean
  status: string
  action: string
  returned?: boolean
  assignedAt?: string
  context?: string
  quizSchedule?: import('./quiz-schedule').QuizSchedule
  activityType?: import('./assignment-presentation').ActivityType
  topicTitle?: string
  courseDay?: number
  focusQuestion?: string
  prerequisiteText?: string
}
export const ASSIGNMENT_LABELS: Record<AssignmentKind, string> = { worksheet: 'Worksheet · Paper', review: 'Review', video: 'Video', lesson: 'Assignment', reading: 'Reading', quiz: 'Quiz', vocabulary: 'Vocabulary' }

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
export function prioritizeAssignments<T extends StudentAssignment>(items: T[], now: number) {
  return [...items].sort((a, b) => {
    const aDue = assignmentDeadline(a.due), bDue = assignmentDeadline(b.due)
    const overdue = (due: number) => Number(Number.isFinite(due) && due < now)
    return overdue(bDue) - overdue(aDue) || Number(!!b.returned) - Number(!!a.returned)
      || (Number.isFinite(aDue) ? aDue : Infinity) - (Number.isFinite(bDue) ? bDue : Infinity) || 0
  })
}

/** A closing window belongs on its last available calendar day; it is not a due date. */
export function assignmentCalendarDate(item: Pick<StudentAssignment,'due'|'closesAt'>) {
  if(item.due)return item.due
  const end=item.closesAt?Date.parse(item.closesAt):NaN
  return Number.isFinite(end)?new Date(end-1).toISOString():null
}
export function assignmentTimingLabel(item: Pick<StudentAssignment,'due'|'closesAt'>) {
  if(item.due||!item.closesAt)return assignmentDueLabel(item.due)
  const end=Date.parse(item.closesAt)
  if(!Number.isFinite(end))return 'No due date set'
  const date=new Date(end),zone='America/New_York'
  const time=date.toLocaleTimeString('en-US',{timeZone:zone,hour:'numeric',minute:'2-digit'})
  const midnight=time==='12:00 AM', day=new Date(end-(midnight?1:0)).toLocaleDateString('en-US',{timeZone:zone,weekday:'short',month:'short',day:'numeric'})
  return 'No due date · Closes '+day+' at '+(midnight?'midnight':time)+' Eastern'
}
