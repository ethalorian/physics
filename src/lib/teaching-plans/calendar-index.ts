import { plannerDay } from '../reading-planner'
import { assignedActivity } from './model'
import type { ClassWorkItem } from '../class-work'
import type { PlanActivity, PlanStep, PlanningData, TeachingSlot } from './types'

export type CalendarDay = { planned: PlanStep[]; deadlines: PlanningData['assignments']; otherDeadlines: ClassWorkItem[] }
export const emptyCalendarDay: CalendarDay = { planned: [], deadlines: [], otherDeadlines: [] }

/** Preserve native identity, first-match ordering and linked-date overrides.
 * Build only when saved data changes, never for pointer coordinates/hover. */
export function calendarIndex(catalog: PlanActivity[], steps: PlanStep[], meetings: Record<string, TeachingSlot>, items: ClassWorkItem[], assignments: PlanningData['assignments'], courseId: string) {
  const activities = new Map<string, PlanActivity>(), work = new Map<string, ClassWorkItem>()
  const keys = new Map<ClassWorkItem, string>(), days = new Map<string, CalendarDay>()
  for (const activity of catalog) if (!activities.has(activity.key)) activities.set(activity.key, activity)
  for (const item of items) {
    const key = assignedActivity(item, catalog)?.key
    if (key) { keys.set(item, key); if (!work.has(key)) work.set(key, item) }
  }
  const day = (date: string) => {
    let result = days.get(date)
    if (!result) { result = { planned: [], deadlines: [], otherDeadlines: [] }; days.set(date, result) }
    return result
  }
  const shown = new Map<string, Set<string>>()
  for (const step of steps) {
    const meeting = meetings[step.id]
    if (!meeting) continue
    const item = work.get(step.activityKey)
    const date = item?.sequenceRole && item.dueAt && (item.access === 'open' || item.access === 'scheduled') ? item.dateOnly ? item.dueAt : plannerDay(item.dueAt) : meeting.date
    day(date).planned.push(step)
    if (!shown.has(date)) shown.set(date, new Set())
    shown.get(date)!.add(step.activityKey)
  }
  for (const assignment of assignments) {
    if (assignment.course_id === courseId && assignment.due_on && !shown.get(assignment.due_on)?.has('interactive:' + assignment.slug)) day(assignment.due_on).deadlines.push(assignment)
  }
  for (const item of items) {
    if (item.kind === 'interactive' || !item.dueAt || (item.access !== 'open' && item.access !== 'scheduled')) continue
    const date = item.dateOnly ? item.dueAt : plannerDay(item.dueAt)
    if (!shown.get(date)?.has(keys.get(item) ?? '')) day(date).otherDeadlines.push(item)
  }
  return { activities, work, days }
}
