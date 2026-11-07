export const MASTERY_WORK_XP = 10
export type MasteryXpReport = {
  enabled?: boolean
  items: { key: string; unitId: string; title: string; href: string; submitted: boolean; credited: boolean }[]
  posted: { unitId: string; termId: string; assigned: number; completed: number }[]
}
export type CalendarXpStatus = 'available' | 'pending' | 'earned'

/** The calendar includes all of a student's classes; only enabled floor reports offer XP. */
export function calendarXpBadges(reports: (MasteryXpReport | null)[]): Record<string, CalendarXpStatus> {
  const badges: Record<string, CalendarXpStatus> = {}
  for (const report of reports) {
    if (!report?.enabled) continue
    for (const item of report.items) {
      badges[item.key] = item.credited ? 'earned' : item.submitted ? 'pending' : 'available'
    }
  }
  return badges
}

export function unitFloor(completed: number, assigned: number) {
  const needed = Math.ceil(assigned * 4 / 5)
  return { needed, remaining: Math.max(0, needed - completed), met: assigned > 0 && completed >= needed }
}
export function postedFloorAverage(report: MasteryXpReport | undefined, termId: string) {
  const units = report?.posted.filter(p => p.assigned > 0 && (termId === 'all' || termId === p.termId)) ?? []
  return units.length ? 100 * units.filter(p => unitFloor(p.completed, p.assigned).met).length / units.length : null
}
export type FloorPreviewRow = { user_id: string; name: string; assigned: number; completed: number }
