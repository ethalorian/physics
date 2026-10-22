import type { ReadingAssignment } from './textbook-assignments'
import type { SyllabusCatalog, SyllabusStep } from './reading-syllabus'

export const READING_TIME_ZONE = 'America/New_York'
const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: READING_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })
export function plannerDay(value: string | Date) {
  const parts = dayFormat.formatToParts(new Date(value))
  return ['year', 'month', 'day'].map(type => parts.find(p => p.type === type)!.value).join('-')
}
export function shiftDay(day: string, amount: number) {
  const date = new Date(day + 'T12:00:00Z')
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}
/** Class dates use Eastern time, including when the teacher travels. */
export function readingWindow(day: string): { due_at: string; opens_at: string; weekend: boolean } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(Date.parse(day)) || new Date(day).toISOString().slice(0, 10) !== day || day < '2000-01-01' || day > '2100-12-30') throw Error('Choose a valid calendar day.')
  const at = new Date(day + 'T23:59:00Z').getTime()
  const format = new Intl.DateTimeFormat('en-US', { timeZone: READING_TIME_ZONE, timeZoneName: 'longOffset' })
  const offset = format.formatToParts(new Date(at)).find(p => p.type === 'timeZoneName')!.value
  const match = offset.match(/GMT([+-])(\d{2}):(\d{2})/)
  if (!match) throw Error('The class time zone is unavailable.')
  const due = at - (match[1] === '+' ? 1 : -1) * (Number(match[2]) * 60 + Number(match[3])) * 60000
  const weekend = new Date(day + 'T12:00:00Z').getUTCDay() === 6
  // Keep Friday's opening when a Saturday deadline moves to Sunday evening.
  return { due_at: weekend ? readingWindow(shiftDay(day, 1)).due_at : new Date(due).toISOString(), opens_at: new Date(due - 86400000).toISOString(), weekend }
}
export function calendarDays(month: string) {
  const first = month.slice(0, 7) + '-01'
  const weekday = new Date(first + 'T12:00:00Z').getUTCDay()
  const start = shiftDay(first, -((weekday + 6) % 7))
  return Array.from({ length: 42 }, (_, i) => shiftDay(start, i))
}
export function plannerDateLabel(value: string, withTime = false) {
  return new Date(value).toLocaleString('en-US', { timeZone: READING_TIME_ZONE, month: 'short', day: 'numeric', ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}) })
}
export type PlannerReading = { key: string; title: string; unit: string; step?: SyllabusStep; assignment?: ReadingAssignment }
export function plannerReadings(catalog: SyllabusCatalog, assignments: ReadingAssignment[], courseId: string): PlannerReading[] {
  const byId = new Map(assignments.filter(a => a.course_id === courseId).map(a => [a.id, a]))
  const bundles = new Map(catalog.bundles.filter(b => b.course_id === courseId).map(b => [b.step_id, b]))
  const used = new Set<string>()
  const readings = catalog.steps.map(step => {
    const id = bundles.get(step.id)?.reading_id
    if (id) used.add(id)
    return { key: 'step:' + step.id, title: step.title, unit: step.unit, step, assignment: id ? byId.get(id) : undefined }
  })
  return [...readings, ...[...byId.values()].filter(a => !used.has(a.id)).map(assignment => {
    const bundle = catalog.bundles.find(b => b.reading_id === assignment.id)
    const step = catalog.textbookSteps?.find(s => s.id === bundle?.step_id)
    return { key: 'reading:' + assignment.id, title: assignment.title, unit: step?.unit ?? '', step, assignment }
  })]
}
