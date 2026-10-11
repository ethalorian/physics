import manifest from '@/data/class-day-tools.json'

export const classDayTools = manifest.lessons
export type ClassDayTool = (typeof classDayTools)[number]

export function classDayTool(unit: string, day: number): ClassDayTool | null {
  return Number.isInteger(day)
    ? classDayTools.find(tool => tool.unit === unit && tool.day === day) ?? null
    : null
}

export function classDayToolHref(day: number, course = '', unit = 'unit-1'): string {
  const query = new URLSearchParams()
  if (unit !== 'unit-1') query.set('unit', unit)
  if (course) query.set('class', course)
  return `/admin/teacher/tools/${day}${query.size ? `?${query}` : ''}`
}

export function classDaySource(file: string): string {
  return `/explainers/claude/class-days/${encodeURIComponent(file)}`
}
