import { schoolDayKey, schoolDayKeyFromNumber, schoolDayNumber, schoolDayWeekday } from './school-day'
import type { StudentAssignment } from './student-dashboard'

export type LearningActivity = Omit<StudentAssignment, 'kind'> & { kind: StudentAssignment['kind'] | 'math'; day?: string; available?: boolean }
export type LearningPlans = Record<string, string | null>
export const LEARNING_LABELS = { video: 'Video', reading: 'Reading', quiz: 'Quiz', vocabulary: 'Vocabulary', math: 'Math spine' } as const
export const ENGAGEMENT_TARGET = 80
export const LEARNING_XP_SOURCES = ['lesson-block', 'lesson-video', 'legacy-lesson-progress', 'math-spine', 'vocabulary', 'vocab-assignment', 'review-complete']
export type LearningPace = {
  today: string; dates: string[]; activeDays: number; engagement: number | null; learningXp: number; xpRate: number | null
  ready: boolean; calendarReady: boolean; noSchoolDates: string[]
  historical: { dates: string[]; activeDays: number; engagement: number | null; learningXp: number; xpRate: number | null }
  warmups: { id: string; competency_id: string; submitted_at: string; status: string }[]
}
export function validPlanDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value
}
export function weekDates(today: string, offset = 0) {
  const n = Math.floor(Date.parse(`${today}T12:00:00Z`) / 86400000)
  const monday = n - ((schoolDayWeekday(n) + 6) % 7) + offset * 7
  return Array.from({ length: 5 }, (_, i) => schoolDayKeyFromNumber(monday + i))
}
export function deadlineDay(due: string | null) {
  if (!due) return null
  if (validPlanDate(due)) return due
  return Number.isFinite(Date.parse(due)) ? schoolDayKey(new Date(due)) : null
}
export function dateLabel(day: string, weekday = false) {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', ...(weekday ? { weekday: 'short' as const } : {}) })
}
/** Only completed school dates since enrollment; calendar holidays never count as misses. */
export function completedSchoolDates(today: string, eligibleFrom: string, excluded: string[]) {
  const result: string[] = [], noSchool = new Set(excluded)
  const end = schoolDayNumber(new Date(`${today}T12:00:00Z`))
  for (let n = schoolDayNumber(new Date(`${eligibleFrom}T12:00:00Z`)); n < end; n++) {
    const date = schoolDayKeyFromNumber(n)
    if (![0, 6].includes(schoolDayWeekday(n)) && !noSchool.has(date)) result.push(date)
  }
  return result
}
export function recentSchoolDates(today: string, eligibleFrom: string, excluded: string[], count = 5) {
  const result: string[] = [], noSchool = new Set(excluded)
  for (let n = schoolDayNumber(new Date(`${today}T12:00:00Z`)) - 1; result.length < count; n--) {
    const date = schoolDayKeyFromNumber(n)
    if (date < eligibleFrom) break
    if (![0, 6].includes(schoolDayWeekday(n)) && !noSchool.has(date)) result.unshift(date)
  }
  return result
}
export function summarizeLearningPace(dates: string[], activity: string[], xp: { source: string; points: number; earned_at: string }[]) {
  const days = new Set(dates), active = new Set(activity.filter(at => Number.isFinite(Date.parse(at))).map(at => schoolDayKey(new Date(at))).filter(day => days.has(day)))
  const earned = xp.reduce((total, event) => total + (LEARNING_XP_SOURCES.includes(event.source) && Number.isFinite(event.points) && event.points > 0 && Number.isFinite(Date.parse(event.earned_at)) && days.has(schoolDayKey(new Date(event.earned_at))) ? event.points : 0), 0)
  return { activeDays: active.size, engagement: dates.length ? Math.round(active.size / dates.length * 100) : null, learningXp: Math.round(earned), xpRate: dates.length ? Math.round(earned / dates.length * 10) / 10 : null, ready: dates.length === 5 }
}
