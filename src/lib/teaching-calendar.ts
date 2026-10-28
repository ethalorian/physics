import { shiftDay } from './reading-planner'

/** A Monday–Sunday teaching week, using school date strings rather than local time. */
export function teachingWeek(day: string) {
  const weekday = new Date(day + 'T12:00:00Z').getUTCDay()
  const start = shiftDay(day, -((weekday + 6) % 7))
  return Array.from({ length: 7 }, (_, index) => shiftDay(start, index))
}

/** Consecutive complete weeks, sharing one date range with the meeting request. */
export function teachingWeeks(day: string, count: 1 | 2 = 2) {
  const first = teachingWeek(day)
  return count === 1 ? [first] : [first, teachingWeek(shiftDay(first[0], 7))]
}

export interface CalendarAssignment { id: string; course_id: string; slug: string; due_on: string | null }

/** Reuse the atomic assignment workflow so linked work and grading records are preserved. */
export async function unassignCalendarAssignment(assignment: CalendarAssignment, fetcher: typeof fetch = fetch) {
  const response = await fetcher('/api/interactive-assignments', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'calendar', course_id: assignment.course_id, slug: assignment.slug, due_on: null }),
  })
  const result = await response.json()
  if (!response.ok) throw Error(result.error || 'Could not remove this assignment. Please retry.')
  const saved = result.assignment
  if (!result.ok || saved?.id !== assignment.id || saved.course_id !== assignment.course_id || saved.slug !== assignment.slug || saved.due_on !== null) {
    throw Error('The removal could not be confirmed. Refresh the calendar before trying again.')
  }
}
