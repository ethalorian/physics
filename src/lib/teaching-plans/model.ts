import { isBlock, sectionStepsOnDate, upcomingSectionMeetings, type RotationCalendar, type MeetingPattern } from '@/lib/rotation'
import type { PlanActivity, PlanStep, TeachingSlot } from './types'
import type { ClassWorkItem } from '@/lib/class-work'

export const validDay = (day: unknown): day is string => typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(Date.parse(day)) && new Date(day + 'T12:00:00Z').toISOString().slice(0, 10) === day
export function scheduleIssue(calendar: RotationCalendar, pattern: MeetingPattern) {
  if (!validDay(calendar.anchor_date) || !isBlock(calendar.anchor_p1_block) || calendar.anchor_p1_block === 'G') return 'Set the school rotation anchor before scheduling.'
  if (!pattern.blocks.length) return 'Set this class’s meeting blocks before scheduling.'
  if (pattern.weekPattern === 'alternate' && !validDay(pattern.onWeekAnchor ?? calendar.alt_week_anchor) && !pattern.onWeekDates?.some(validDay)) return 'Set this class’s alternating-week anchor or on-week dates.'
  return null
}
export function meetingOptions(calendar: RotationCalendar, pattern: MeetingPattern, from: string) {
  if (scheduleIssue(calendar, pattern)) return []
  return upcomingSectionMeetings(calendar, pattern, new Date(from + 'T00:00:00Z'), 120)
}
export function meetingsInRange(calendar: RotationCalendar, pattern: MeetingPattern, from: string, through: string) {
  if (!validDay(from) || !validDay(through) || through < from || Date.parse(through) - Date.parse(from) > 62 * 86400000) throw Error('Choose a calendar range of up to 63 days.')
  if (scheduleIssue(calendar, pattern)) return []
  const result: (TeachingSlot & { long: boolean })[] = []
  for (let stamp = Date.parse(from); stamp <= Date.parse(through); stamp += 86400000) {
    const date = new Date(stamp)
    result.push(...sectionStepsOnDate(calendar, pattern, date).map(slot => ({ ...slot, date: date.toISOString().slice(0, 10) })))
  }
  return result
}
/** Match native records by identity, never by a similar title. */
export function assignedActivity(item: ClassWorkItem, catalog: PlanActivity[]) {
  const kind = item.kind === 'homework' ? 'lesson' : item.kind === 'vocabulary-set' ? 'vocabulary' : item.kind
  return catalog.find(a => a.key === item.planKey) ?? catalog.find(a => a.key === `${kind}:${item.sourceId}`)
}
export function assignmentSettingsHref(activity: PlanActivity, courseId: string) {
  const [path, search] = activity.setupHref.split('?'), query = new URLSearchParams(search)
  if (query.has('course_id')) query.set('course_id', courseId)
  else query.set('class', courseId)
  // A quiz/reading ID belongs to its source class. Cross-class setup must open
  // the destination's tools, where native copy/bundle workflows are available.
  if (activity.courseId && activity.courseId !== courseId) query.delete('id')
  return path + '?' + query.toString()
}
export function validMeeting(slot: TeachingSlot, calendar: RotationCalendar, pattern: MeetingPattern) {
  if (!validDay(slot.date) || scheduleIssue(calendar, pattern)) return false
  return sectionStepsOnDate(calendar, pattern, new Date(slot.date + 'T00:00:00Z')).some(m => m.block === slot.block)
}
export function validateSteps(raw: unknown, catalog: PlanActivity[], previous: PlanStep[] = []): PlanStep[] {
  if (!Array.isArray(raw) || raw.length > 100) throw Error('Choose up to 100 activities for this unit.')
  const ids = new Set<string>(), keys = new Set<string>()
  return raw.map(value => {
    if (!value || typeof value !== 'object') throw Error('Check the sequence steps.')
    const s = value as PlanStep
    if (!/^[0-9a-f-]{36}$/i.test(s.id) || ids.has(s.id) || typeof s.activityKey !== 'string' || keys.has(s.activityKey)) throw Error('Each activity can appear once in this sequence.')
    ids.add(s.id); keys.add(s.activityKey)
    const activity = catalog.find(a => a.key === s.activityKey), old = previous.find(p => p.id === s.id && p.activityKey === s.activityKey)
    if (!activity && !old) throw Error('This activity is no longer available. Reload the library.')
    if (previous.some(p => p.id === s.id && p.activityKey !== s.activityKey)) throw Error('Add a new step when changing its activity.')
    if (typeof s.purpose !== 'string' || s.purpose.length > 300 || typeof s.notes !== 'string' || s.notes.length > 2000 || typeof s.optional !== 'boolean') throw Error('Keep the purpose under 300 characters and notes under 2,000.')
    return { id: s.id, activityKey: s.activityKey, title: activity?.title ?? old!.title, kind: activity?.kind ?? old!.kind, purpose: s.purpose.trim(), notes: s.notes.trim(), optional: s.optional }
  })
}
export const kindLabel: Record<PlanActivity['kind'], string> = { worksheet: 'Worksheet · Paper', simulation: 'Simulation', interactive: 'Interactive assignment', quiz: 'Quiz', reading: 'Reading', review: 'Review', vocabulary: 'Vocabulary', math: 'Math mission', video: 'Video', lesson: 'Lesson' }
export function planChanges(before: PlanStep[], after: PlanStep[]) {
  return { added: after.filter(s => !before.some(b => b.id === s.id)).length, removed: before.filter(s => !after.some(a => a.id === s.id)).length, reordered: before.filter(s => after.some(a => a.id === s.id)).map(s => s.id).join() !== after.filter(s => before.some(b => b.id === s.id)).map(s => s.id).join() }
}
