import { deadlineDay, type LearningActivity } from './learning-week'
import { assignmentCalendarDate, assignmentTimingLabel, prioritizeAssignments, type StudentAssignment } from './student-dashboard'
import { SCHOOL_TZ } from './school-day'

export interface StudentHomeTask {
  kind: string
  title: string
  meta: string
  href: string
  label: string
}

export function homeDeadlineLabel(due: string | null, today: string): string {
  const day = deadlineDay(due)
  if (!day) return 'Ready to start'
  const tomorrow = new Date(Date.parse(`${today}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10)
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(due!)
  const date = new Date(dateOnly ? `${day}T12:00:00Z` : due!)
  const when = day === today ? 'today' : day === tomorrow ? 'tomorrow' : date.toLocaleDateString('en-US', { timeZone: SCHOOL_TZ, month: 'short', day: 'numeric' })
  const time = dateOnly ? '' : ` · ${date.toLocaleTimeString('en-US', { timeZone: SCHOOL_TZ, hour: 'numeric', minute: '2-digit' }).toLowerCase()}`
  return `${day < today ? 'Past due' : 'Due'} ${when}${time}`
}

/** Due work takes precedence; optional practice never claims completion after a failed load. */
export function nextStudentHomeTask({ items, math, today, loading, incomplete }: {
  items: StudentAssignment[]
  math: LearningActivity | null
  today: string
  loading: boolean
  incomplete: boolean
}): StudentHomeTask | null {
  if (loading) return null
  const scheduled = items.filter(item => deadlineDay(assignmentCalendarDate(item)) !== null)
  const pending = prioritizeAssignments(scheduled.filter(item => !item.complete), Date.parse(`${today}T12:00:00Z`))
  const urgent = pending.find(item => { const due = deadlineDay(assignmentCalendarDate(item)); return due !== null && due <= today })
  const next = urgent ?? (math && !math.complete && math.available !== false ? math : null) ?? pending[0]
  if (next) {
    const kind = next.kind === 'math' ? 'Math warm-up' : next.quizSchedule === 'vocabulary' ? 'Vocabulary quiz' : next.kind === 'quiz' ? 'Quiz' : next.kind === 'vocabulary' ? 'Vocabulary practice' : 'Assignment'
    return {
      kind, title: next.title, href: next.href, label: next.action,
      meta: next.kind === 'math' ? 'Ready to start' : next.status === 'Complete reading first' ? 'Complete the required reading first' : next.closesAt&&!next.due?assignmentTimingLabel(next):homeDeadlineLabel(next.due, today),
    }
  }
  return incomplete
    ? { kind: 'Keep learning', title: 'Explore your lessons', meta: 'Some assignments couldn’t load', href: '/lessons', label: 'Open lessons' }
    : { kind: 'Keep exploring', title: scheduled.length?'You’re caught up':'No assignments on your calendar', meta: scheduled.length?'The work on your calendar is submitted. Videos are available anytime.':'Your teacher will add assigned work here. Videos are available anytime.', href: '/lessons', label: 'Watch a video' }
}

export const STUDENT_HOME_THEMES = [
  { name: 'New Year', base: '#102d63', light: '#2e63a4', low: '#0b1634', accent: '#ffe2a2' },
  { name: 'Valentine’s season', base: '#751d46', light: '#b6375a', low: '#32122f', accent: '#ffcbda' },
  { name: 'St. Patrick’s season', base: '#065442', light: '#268056', low: '#092d2b', accent: '#f7df97' },
  { name: 'Easter & spring', base: '#584880', light: '#9a70a8', low: '#2b315a', accent: '#f7db9f' },
  { name: 'Spring in bloom', base: '#1d624e', light: '#518044', low: '#123d3f', accent: '#f4dfa5' },
  { name: 'Summer solstice', base: '#194f68', light: '#bf7855', low: '#143445', accent: '#ffdf9d' },
  { name: 'Independence Day', base: '#15356d', light: '#305799', low: '#0c1937', accent: '#f7dca9' },
  { name: 'Golden summer', base: '#755032', light: '#b88138', low: '#3b2d48', accent: '#ffe09e' },
  { name: 'Back to school', base: '#6b3843', light: '#a46637', low: '#342a4d', accent: '#f3dba5' },
  { name: 'Halloween season', base: '#47236f', light: '#8243a3', low: '#190f32', accent: '#ffcd84' },
  { name: 'Thanksgiving season', base: '#6c2f26', light: '#ab622e', low: '#382331', accent: '#ffe2ad' },
  { name: 'Christmas & holidays', base: '#134c3e', light: '#266c4f', low: '#0a2828', accent: '#ffe0a3' },
] as const
