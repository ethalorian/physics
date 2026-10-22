import { calendarAssigned } from '../calendar-assignment'
export function reviewWindowActive(assignment: {due_on?:string|null;closes_at?:string|null}, now=Date.now()) {
  const closes=assignment.closes_at ? Date.parse(assignment.closes_at) : null
  if(closes!==null && (!Number.isFinite(closes)||now>=closes))return false
  return calendarAssigned(true,assignment.due_on) || closes!==null
}
