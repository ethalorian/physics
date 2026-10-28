import { releaseStatus, type ReleaseWindow } from './lesson-release'

export type WorkKind = 'worksheet' | 'homework' | 'lesson' | 'quiz' | 'reading' | 'vocabulary' | 'vocabulary-set' | 'math' | 'simulation' | 'interactive' | 'review'
export type WorkAccess = 'open' | 'scheduled' | 'closed' | 'draft' | 'unassigned'
export interface ClassWorkItem {
  id: string; sourceId: string; kind: WorkKind; title: string; context: string; audience: string;
  dueAt: string | null; dateOnly?: boolean; access: WorkAccess; opensAt?: string | null; closesAt?: string | null;
  href: string; version?: number; window?: ReleaseWindow | null; canEditDue: boolean; canToggle: boolean;
  restriction?: string; planKey?: string; sequenceRole?: import('./sequence-date-change').SequenceRole;
  activityType?: import('./assignment-presentation').ActivityType;
  quizSchedule?: import('./quiz-schedule').QuizSchedule;
}
export interface ClassWorkData { courseId: string; items: ClassWorkItem[]; warnings: string[]; readOnly: boolean }
export type WorkFilter = 'assigned' | 'open' | 'due' | 'past' | 'scheduled' | 'closed' | 'unassigned'
export const workKinds: Record<WorkKind, string> = { worksheet:'Worksheet · Paper', homework: 'Video homework', lesson: 'Class lesson', quiz: 'Quiz', reading: 'Reading', vocabulary: 'Vocabulary', 'vocabulary-set': 'Vocabulary set', math: 'Math mission', simulation: 'Simulation', interactive: 'Interactive assignment / simulation', review: 'Review assignment' }
export const workAccessLabels: Record<WorkAccess, string> = { open: 'Open', scheduled: 'Scheduled', closed: 'Closed', draft: 'Draft', unassigned: 'Not assigned' }
export function workDueTime(item: Pick<ClassWorkItem, 'dueAt' | 'dateOnly'>) {
  return item.dueAt ? Date.parse(item.dateOnly ? item.dueAt + 'T23:59:59.999' : item.dueAt) : Infinity
}
export function workIsAssigned(item: ClassWorkItem) { return item.access !== 'draft' && item.access !== 'unassigned' }
export function workMatches(item: ClassWorkItem, filter: WorkFilter, now: number) {
  const active = item.access === 'open' || item.access === 'scheduled'
  if (filter === 'assigned') return workIsAssigned(item)
  if (filter === 'unassigned') return !workIsAssigned(item)
  if (filter === 'due') return active && workDueTime(item) >= now && workDueTime(item) <= now + 7 * 86400000
  if (filter === 'past') return active && workDueTime(item) < now
  return item.access === filter
}
export function lessonWorkAccess(window: ReleaseWindow | undefined, now=Date.now()): WorkAccess {
  if (!window) return 'unassigned'
  const status = releaseStatus(window,now)
  return status === 'ended' || status === 'closed' ? 'closed' : status
}
/** Exact instants stay UTC; date-only vocabulary deadlines retain their calendar day. */
export function validateWorkDue(value: unknown, dateOnly = false): string | null {
  if (value === null) return null
  if (typeof value !== 'string') throw Error('Enter a valid due date.')
  if (dateOnly) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw Error('Enter a valid due date.')
  } else if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) throw Error('Enter a valid due date and time.')
  return value
}

export function assignedWorkDetailHref(href:string,search:string) {
  const [path,query] = href.split('?'), params=new URLSearchParams(query), current=new URLSearchParams(search)
  for(const key of ['workStatus','workKind','workSearch'])if(current.has(key))params.set(key,current.get(key)!)
  if(path==='/admin/control-room')params.set('fromWork','1')
  return path+'?'+params.toString()
}
