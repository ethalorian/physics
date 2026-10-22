import { schoolDayNumber, schoolDayWeekday } from './school-day'

export const MATH_WARMUP_SCHEDULE_MESSAGE = 'No math warm-up is assigned today. Your teacher assigns warm-ups on the class calendar.'

function isScheduledDay(dayNumber: number): boolean {
  const weekday = schoolDayWeekday(dayNumber)
  return weekday === 2 || weekday === 4
}

/** Warm-up availability follows the school's Eastern calendar day. */
export function isMathWarmupDay(now: Date = new Date()): boolean {
  return isScheduledDay(schoolDayNumber(now))
}

/** A planner date is already a school-local YYYY-MM-DD, not an instant. */
export function isMathWarmupDate(dateKey: string): boolean {
  return isScheduledDay(Date.parse(`${dateKey}T00:00:00Z`) / 86_400_000)
}

/** Count consecutive scheduled days; today's task is allowed to be unfinished. */
export function mathWarmupStreak(submittedAt: string[], now: Date = new Date()): number {
  const days = new Set(submittedAt.map(value => schoolDayNumber(new Date(value))))
  let day = schoolDayNumber(now)
  if (!isScheduledDay(day) || !days.has(day)) day -= 1
  while (!isScheduledDay(day)) day -= 1
  let streak = 0
  while (days.has(day)) {
    streak += 1
    do { day -= 1 } while (!isScheduledDay(day))
  }
  return streak
}
