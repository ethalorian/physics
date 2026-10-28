import { schoolDayKey } from './school-day'
import type { ResultActivity } from './assessment-results/types'
import { releasedGrade } from './assessment-results/gradebook'

export type GradingTerm = { id: string; name: string; start: string; end: string }
export type GradingSettings = { terms: GradingTerm[]; placements: Record<string, string>; revision: number }
export const emptyGradingSettings = (): GradingSettings => ({ terms: [], placements: {}, revision: 0 })
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
export function validTermDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= '2000-01-01' && value <= '2199-12-31' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
}
export function gradingSettingsError(value: unknown): string | null {
  if (!object(value) || !Array.isArray(value.terms) || !object(value.placements) || !Number.isSafeInteger(value.revision) || Number(value.revision) < 0) return 'Invalid grading settings. Reload and try again.'
  if (value.terms.length > 40) return 'Use no more than 40 grading terms.'
  const ids = new Set<string>(), names = new Set<string>()
  for (const term of value.terms) {
    if (!object(term) || typeof term.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(term.id) || ['all', 'unassigned', 'auto'].includes(term.id) || ids.has(term.id)) return 'Each term needs a unique identifier.'
    if (typeof term.name !== 'string' || !term.name.trim() || term.name.trim().length > 60) return 'Give each term a name of 1–60 characters.'
    const name = term.name.trim().toLocaleLowerCase()
    if (names.has(name)) return 'Use a different name for each term.'
    if (!validTermDate(term.start) || !validTermDate(term.end)) return 'Choose a valid start and end date for each term.'
    if (term.start > term.end) return `${term.name}: the end date must be on or after the start date.`
    ids.add(term.id); names.add(name)
  }
  const sorted = [...value.terms as GradingTerm[]].sort((a, b) => a.start.localeCompare(b.start))
  if (sorted.some((term, i) => i > 0 && term.start <= sorted[i - 1].end)) return 'Term dates overlap. Start and end dates are both included.'
  if (Object.keys(value.placements).length > 5000) return 'Too many assignment placements.'
  for (const [key, id] of Object.entries(value.placements)) {
    if (!/^[a-z][a-z-]*:[a-zA-Z0-9:_-]{1,200}$/.test(key) || typeof id !== 'string' || !ids.has(id)) return 'Every assignment placement must use an existing term.'
  }
  return null
}
export function assignmentTermDay(due: string | null | undefined): string | null {
  if (!due) return null
  if (validTermDate(due)) return due
  const date = new Date(due)
  return Number.isFinite(date.getTime()) ? schoolDayKey(date) : null
}
export function assignedGradingTerm(activity: Pick<ResultActivity, 'key' | 'dueAt'>, settings: GradingSettings): GradingTerm | null {
  const explicit = settings.terms.find(term => term.id === settings.placements[activity.key])
  if (explicit) return explicit
  const day = assignmentTermDay(activity.dueAt)
  return day ? settings.terms.find(term => term.start <= day && term.end >= day) ?? null : null
}
export function currentGradingTerm(terms: GradingTerm[], day = schoolDayKey()): string {
  const sorted = [...terms].sort((a, b) => a.start.localeCompare(b.start))
  return sorted.find(term => term.start <= day && term.end >= day)?.id ?? sorted.filter(term => term.end < day).at(-1)?.id ?? sorted[0]?.id ?? 'all'
}
export function inGradingTerm(activity: Pick<ResultActivity, 'key' | 'dueAt'>, settings: GradingSettings, term: string): boolean {
  return term === 'all' || (term === 'unassigned' ? !assignedGradingTerm(activity, settings) : assignedGradingTerm(activity, settings)?.id === term)
}
/** The term score spans units and includes released historical evidence. Never average percentages. */
export function termQuizTotal(activities: ResultActivity[], studentId: string, settings: GradingSettings, term: string) {
  const counted = activities.filter(activity => activity.kind === 'quiz' && inGradingTerm(activity, settings, term) && releasedGrade(activity.cells[studentId]))
  const earned = counted.reduce((sum, activity) => sum + releasedGrade(activity.cells[studentId])!.earned, 0)
  const possible = counted.reduce((sum, activity) => sum + releasedGrade(activity.cells[studentId])!.possible, 0)
  return { earned, possible, count: counted.length, percent: possible ? 100 * earned / possible : null, counted }
}
export function termDateLabel(day: string): string {
  return validTermDate(day) ? new Date(day + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' }) : 'Choose date'
}
