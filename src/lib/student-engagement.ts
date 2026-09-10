import { sectionMeetingsOnDate, type MeetingPattern, type RotationCalendar } from '@/lib/rotation'
import { schoolDayKey } from '@/lib/school-day'

export interface EngagementXpEvent { userId: string; at: string; points: number }
export interface EngagementEvent { userId: string; at: string; source: string }
export interface EngagementDay { date: string; kind: 'class' | 'off' | 'unknown' | 'excluded'; active: boolean; sources: string[] }
export interface EngagementStudent {
  id: string; name: string; eligibleFrom: string; classDays: number; activeClassDays: number; offDays: number; activeOffDays: number
  classPercent: number | null; lastActive: string | null; days: EngagementDay[]
  xp: { earned: number; days: number; averagePerDay: number | null }
}
export interface PracticeProgress { studentId: string; name: string; started: number; checks: number; activeDays: number; lastAt: string | null; ready: number; total: number; complete: boolean }
export interface EngagementPractice { id: string; title: string; dueOn: string | null; createdAt: string; students: PracticeProgress[] }
export interface EngagementReport {
  courses: { id: string; name: string }[]; courseId: string | null; from: string; to: string; latestCompleteDay: string
  scheduleReady: boolean; scheduleMessage: string | null; students: EngagementStudent[]; practice: EngagementPractice[]
}
export function validDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value
}
export function dayRange(from: string, to: string): string[] {
  if (!validDate(from) || !validDate(to) || from > to) return []
  const days: string[] = []
  for (let ms = Date.parse(`${from}T12:00:00Z`); ms <= Date.parse(`${to}T12:00:00Z`); ms += 86400000) days.push(new Date(ms).toISOString().slice(0, 10))
  return days
}
export function weightedEngagement(student: Pick<EngagementStudent, 'classDays' | 'activeClassDays' | 'activeOffDays' | 'classPercent'>, multiplier: number): number | null {
  if (student.classPercent === null || student.classDays === 0) return null
  return Math.round(1000 * (student.activeClassDays + student.activeOffDays * multiplier) / student.classDays) / 10
}
export function engagementForStudent(args: {
  id: string; name: string; enrolledAt: string | null; start: string; from: string; to: string
  calendar: RotationCalendar; pattern: MeetingPattern; scheduleReady: boolean; events: EngagementEvent[]; xpEvents?: EngagementXpEvent[]
}): EngagementStudent {
  const { id, name, calendar, pattern, scheduleReady } = args
  const enrolled = args.enrolledAt && Number.isFinite(Date.parse(args.enrolledAt)) ? schoolDayKey(new Date(args.enrolledAt)) : args.start
  const eligibleFrom = [args.start, args.from, enrolled].sort().at(-1)!
  const byDay = new Map<string, Set<string>>()
  let lastActive: string | null = null
  for (const event of args.events) {
    if (event.userId !== id || !Number.isFinite(Date.parse(event.at))) continue
    const day = schoolDayKey(new Date(event.at))
    if (day < eligibleFrom || day > args.to) continue
    if (!lastActive || event.at > lastActive) lastActive = event.at
    if (!byDay.has(day)) byDay.set(day, new Set())
    byDay.get(day)!.add(event.source)
  }
  const days: EngagementDay[] = dayRange(args.from, args.to).map(date => ({
    date, kind: date < eligibleFrom ? 'excluded' : !scheduleReady ? 'unknown' : sectionMeetingsOnDate(calendar, pattern, new Date(`${date}T12:00:00Z`)).length ? 'class' : 'off',
    active: byDay.has(date), sources: [...(byDay.get(date) ?? [])].sort(),
  }))
  const xpDays = days.filter(day => day.kind !== 'excluded').length
  const earned = Math.floor((args.xpEvents ?? []).reduce((sum, event) => {
    if (event.userId !== id || !Number.isFinite(Date.parse(event.at)) || !Number.isFinite(event.points)) return sum
    const date = schoolDayKey(new Date(event.at))
    return date >= eligibleFrom && date <= args.to ? sum + event.points : sum
  }, 0) + .5)
  const classDays = days.filter(day => day.kind === 'class').length
  const activeClassDays = days.filter(day => day.kind === 'class' && day.active).length
  return { id, name, eligibleFrom, xp: { earned, days: xpDays, averagePerDay: xpDays ? Math.round(earned / xpDays * 10) / 10 : null }, classDays, activeClassDays, offDays: days.filter(day => day.kind === 'off').length,
    activeOffDays: days.filter(day => day.kind === 'off' && day.active).length,
    classPercent: scheduleReady && classDays ? Math.round(1000 * activeClassDays / classDays) / 10 : null, lastActive, days }
}

/** Compare equal windows of actual class dates, never arbitrary calendar weeks. */
export function recentEngagement(student: Pick<EngagementStudent, 'days'>) {
  const dates = student.days.filter(day => day.kind === 'class')
  const recent = dates.slice(-5)
  const previous = dates.slice(-10, -5)
  const active = recent.filter(day => day.active).length
  const previousActive = previous.filter(day => day.active).length
  let consecutiveInactive = 0
  for (let index = dates.length - 1; index >= 0 && !dates[index].active; index--) consecutiveInactive++
  return { active, total: recent.length, consecutiveInactive,
    change: recent.length === 5 && previous.length === 5 ? (active - previousActive) * 20 : null }
}

export function practiceFollowUp(tasks: EngagementPractice[], latestCompleteDay: string) {
  return {
    notStarted: [...new Set(tasks.flatMap(task => task.students.filter(student => !student.started).map(student => student.studentId)))],
    overdue: [...new Set(tasks.filter(task => task.dueOn && task.dueOn <= latestCompleteDay).flatMap(task => task.students.filter(student => !student.complete).map(student => student.studentId)))],
  }
}
