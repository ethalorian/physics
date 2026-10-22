import { calendarAssigned, CALENDAR_ASSIGNMENT_MESSAGE } from './calendar-assignment'
import { validateReleaseWindow, type ReleaseWindow } from './lesson-release'
import { validateWorkDue } from './class-work'
import { sameQuizDueDate } from './quizzes/due-date'

export function sameLessonSchedule(a: ReleaseWindow | null, b: ReleaseWindow | null) {
  if (!a || !b) return a === b
  return sameQuizDueDate(a.open_at,b.open_at) && sameQuizDueDate(a.close_at,b.close_at) && sameQuizDueDate(a.due_at??null,b.due_at??null)
}
export function lessonWorkSchedule(body: Record<string,unknown>, existing: ReleaseWindow|null, now = new Date().toISOString()) {
  const due_at = 'due_at' in body ? validateWorkDue(body.due_at) : existing?.due_at??null
  // Calendar moves change the deadline without closing an existing assignment.
  const dueOnly = 'due_at' in body && !('open_at' in body) && !('close_at' in body) && !('access' in body)
  if (dueOnly && !existing) throw Error('Open or schedule this assignment before setting its due date.')
  const open_at = dueOnly ? existing!.open_at : body.open_at??null, close_at = dueOnly ? existing!.close_at : body.close_at??null
  const invalid = validateReleaseWindow(open_at,close_at)
  if (invalid) throw Error(invalid)
  const closing = body.access === 'closed' || (!dueOnly&&!open_at&&!close_at)
  if (body.access !== undefined && !['open','scheduled','closed'].includes(String(body.access))) throw Error('Choose a valid access setting.')
  if (closing || dueOnly && due_at===null) return {open_at:null,close_at:now,due_at:null}
  if(!calendarAssigned(true,due_at))throw Error(CALENDAR_ASSIGNMENT_MESSAGE)
  if (due_at && open_at && Date.parse(String(open_at))>Date.parse(now) && Date.parse(due_at)<Date.parse(String(open_at))) throw Error('The due date must be on or after the opening time.')
  if (due_at && close_at && Date.parse(due_at)>Date.parse(String(close_at))) throw Error('Close access at or after the due date, or leave it open for late work.')
  return {open_at:open_at as string|null,close_at:close_at as string|null,due_at}
}
