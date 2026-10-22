import { deadlineDay } from './learning-week'

/** Publication alone never assigns work. A teacher must also set its calendar date. */
export function calendarAssigned(status: string | boolean, due: string | null | undefined): boolean {
  return (status === 'published' || status === true) && deadlineDay(due ?? null) !== null
}
export const CALENDAR_ASSIGNMENT_MESSAGE = 'Choose a date on the class calendar before assigning this work.'
