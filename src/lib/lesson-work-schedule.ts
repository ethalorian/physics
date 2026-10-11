import { validateReleaseWindow, type ReleaseWindow } from './lesson-release'
import { validateWorkDue } from './class-work'
import { sameQuizDueDate } from './quizzes/due-date'

export function sameLessonSchedule(a: ReleaseWindow | null, b: ReleaseWindow | null) {
  if (!a || !b) return a === b
  return sameQuizDueDate(a.open_at,b.open_at) && sameQuizDueDate(a.close_at,b.close_at) && sameQuizDueDate(a.due_at??null,b.due_at??null)
}
export function lessonWorkSchedule(body: Record<string,unknown>, existing: ReleaseWindow|null, now = new Date().toISOString()) {
  const due_at = 'due_at' in body ? validateWorkDue(body.due_at) : existing?.due_at??null
  const open_at = body.open_at??null, close_at = body.close_at??null
  const invalid = validateReleaseWindow(open_at,close_at)
  if (invalid) throw Error(invalid)
  const closing = body.access === 'closed' || (!open_at&&!close_at)
  if (body.access !== undefined && !['open','scheduled','closed'].includes(String(body.access))) throw Error('Choose a valid access setting.')
  if (closing) return {open_at:null,close_at:now,due_at}
  if (due_at && open_at && Date.parse(String(open_at))>Date.parse(now) && Date.parse(due_at)<Date.parse(String(open_at))) throw Error('The due date must be on or after the opening time.')
  if (due_at && close_at && Date.parse(due_at)>Date.parse(String(close_at))) throw Error('Close access at or after the due date, or leave it open for late work.')
  return {open_at:open_at as string|null,close_at:close_at as string|null,due_at}
}
