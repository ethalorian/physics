import { SCHOOL_TZ, schoolDayKey, schoolDayStart } from './school-day'

export type QuizSchedule = 'regular' | 'vocabulary'
export const QUIZ_SCHEDULE_LABELS = {
  regular: 'Quizzes are scheduled on Mondays, Wednesdays, and Fridays.',
  vocabulary: 'Vocabulary quizzes are scheduled on Tuesdays and Thursdays.',
} as const

export function calendarDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
}

/** Use the school's day, including for UTC deadlines after midnight. */
export function quizScheduleError(due: string | null, schedule: QuizSchedule): string | null {
  if (due === null) return null
  const day = calendarDate(due) ? due : /^\d{4}-\d{2}-\d{2}T/.test(due) && Number.isFinite(Date.parse(due)) ? schoolDayKey(new Date(due)) : null
  if (!day) return 'Choose a valid due date.'
  const weekday = new Date(day + 'T12:00:00Z').getUTCDay()
  return (schedule === 'vocabulary' ? [2, 4] : [1, 3, 5]).includes(weekday) ? null : QUIZ_SCHEDULE_LABELS[schedule]
}

/** Moving a calendar card preserves its Eastern wall-clock time across DST. */
export function moveDeadline(due: string | null, day: string, dateOnly = false): string {
  if (!calendarDate(day)) throw Error('Choose a valid due date.')
  if (dateOnly) return day
  const time = due ? new Intl.DateTimeFormat('en-GB', { timeZone: SCHOOL_TZ, hourCycle: 'h23', hour: '2-digit', minute: '2-digit' }).format(new Date(due)) : '23:59'
  const [hour, minute] = time.split(':').map(Number)
  // Resolve the offset at the requested wall time, rather than carrying yesterday's offset.
  const wall = Date.parse(`${day}T${time}:00Z`)
  let instant = schoolDayStart(new Date(day + 'T12:00:00Z')).getTime() + (hour * 60 + minute) * 60000
  for (let i = 0; i < 2; i++) {
    const parts = new Intl.DateTimeFormat('sv-SE', { timeZone: SCHOOL_TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(new Date(instant))
    instant += wall - Date.parse(parts.replace(' ', 'T') + 'Z')
  }
  if (schoolDayKey(new Date(instant)) !== day || new Intl.DateTimeFormat('en-GB', { timeZone: SCHOOL_TZ, hourCycle: 'h23', hour: '2-digit', minute: '2-digit' }).format(new Date(instant)) !== time) throw Error('That time is unavailable because of daylight saving. Choose a date and time in the assignment editor.')
  return new Date(instant).toISOString()
}
