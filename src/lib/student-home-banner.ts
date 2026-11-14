import { deadlineDay, type LearningActivity } from './learning-week'
import { assignmentCalendarDate, assignmentTimingLabel } from './student-dashboard'
import { SCHOOL_TZ } from './school-day'
import { isAssignedStudentWork, isStudentHomework, studentWorkComplete, type StudentBannerCourse, type StudentBannerRow } from './student-gradebook'
import { homeworkKey } from './homework-waivers'

export interface BannerAssignment {
  id: string
  title: string
  day: string | null
  timing: string
  href: string
  label: string
  complete: boolean
  catchUp: boolean
}

export interface StudentHomeTask {
  title: string
  meta: string
  links?: { id: string; title: string; href: string }[]
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

export function calendarBannerAssignment(item: LearningActivity, today: string): BannerAssignment {
  const due = assignmentCalendarDate(item)
  const timing = item.prerequisiteText || (item.status === 'Complete reading first' ? 'Complete the required reading first' : '')
    || (item.closesAt && !item.due ? assignmentTimingLabel(item) : homeDeadlineLabel(item.due, today))
  return { id: item.id, title: item.title, day: item.kind === 'math' ? today : deadlineDay(due),
    timing: item.kind === 'math' ? 'Math warm-up' : timing, href: item.href, label: item.action, complete: item.complete, catchUp: false }
}

function gradebookBannerAssignment(row: StudentBannerRow, today: string, now: Date): BannerAssignment {
  return {
    id: row.key, title: row.title, day: deadlineDay(row.dueAt), complete: studentWorkComplete(row),
    catchUp: isStudentHomework(row, now), href: row.href, label: row.prerequisites?.length ? 'Open prerequisite' : 'Open assignment',
    timing: row.prerequisites?.length ? row.statusLabel : homeDeadlineLabel(row.dueAt, today),
  }
}

/** The calendar supplies today's activities. Only a student's course ledger can add catch-up work. */
export function studentBannerAssignments(calendar: LearningActivity[], courses: StudentBannerCourse[], today: string, now: Date) {
  function key(id: string, courseId?: string) {
    const work = homeworkKey(id)
    return work.startsWith('lesson:') ? (courseId ?? '') + '/' + work : work
  }
  const items = new Map(calendar.map(item => [key(item.id, item.courseId), calendarBannerAssignment(item, today)]))
  for (const { courseId, rows } of courses) {
    for (const row of rows) {
      const id = key(row.key, courseId)
      if (row.archived || row.homeworkWaived || row.status === 'excused') { items.delete(id); continue }
      if (!isAssignedStudentWork(row)) continue
      const recorded = { ...gradebookBannerAssignment(row, today, now), id }
      const live = items.get(id)
      // Keep today's action wording. For overdue work, use the verified due date and prerequisite.
      items.set(id, live && recorded.day === today && live.day === today && !row.prerequisites?.length
        ? { ...live, id, complete: recorded.complete } : recorded)
    }
  }
  return [...items.values()]
}

export function nextStudentHomeTask({ items, today, loading, incomplete }: {
  items: BannerAssignment[]
  today: string
  loading: boolean
  incomplete: boolean
}): StudentHomeTask | null {
  if (loading) return null
  const todays = items.filter(item => item.day === today)
  const remaining = todays.filter(item => !item.complete)
  if (remaining.length) {
    const [first, ...rest] = remaining
    return { title: first.title, meta: first.timing,
      links: [{ id: first.id, title: first.label, href: first.href }, ...rest.map(item => ({ id: item.id, title: item.title, href: item.href }))] }
  }
  if (incomplete) return { title: 'Some assignments couldn’t load', meta: 'Refresh the page to check your work.' }
  const earlier = items.filter(item => item.catchUp && !item.complete && item.day && item.day < today)
    .sort((a, b) => a.day!.localeCompare(b.day!) || a.title.localeCompare(b.title) || a.id.localeCompare(b.id))[0]
  if (earlier) {
    return { title: todays.length ? 'Today’s work is complete' : 'Nothing due today',
      meta: earlier.title, links: [{ id: earlier.id, title: 'Get Caught Up', href: earlier.href }] }
  }
  return { title: 'Congratulations! You’re all caught up.', meta: 'Thank you for staying diligent with your work.' }
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
