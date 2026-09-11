export const BOUNTY_PERIODS = ['daily', 'weekly', 'monthly', 'custom'] as const
export type BountyPeriod = typeof BOUNTY_PERIODS[number]
export const PERIOD_LABELS: Record<BountyPeriod, string> = {
  daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', custom: 'Selected period',
}
export const BOUNTY_TIME_ZONE = 'America/New_York'

export function bountyToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: BOUNTY_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

export function validBountyDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function addBountyDays(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

// Find the exact Eastern midnight, including 23/25-hour daylight-saving days.
export function bountyMidnight(date: string): string {
  const midnight = Date.parse(`${date}T00:00:00Z`)
  let low = midnight - 14 * 3600000, high = midnight + 14 * 3600000
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2)
    if (bountyToday(new Date(mid)) < date) low = mid
    else high = mid
  }
  return new Date(high).toISOString()
}

export interface BountySchedule { starts_on: string; ends_on: string; period: BountyPeriod }

export function bountyWindow(schedule: BountySchedule, today = bountyToday()) {
  const { starts_on, ends_on, period } = schedule
  // Management views use the first/last window for scheduled/ended bounties.
  const date = today < starts_on ? starts_on : today > ends_on ? ends_on : today
  let start = date, end = date
  if (period === 'weekly') {
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay()
    start = addBountyDays(date, -((weekday + 6) % 7))
    end = addBountyDays(start, 6)
  } else if (period === 'monthly') {
    start = `${date.slice(0, 7)}-01`
    const next = new Date(`${start}T12:00:00Z`)
    next.setUTCMonth(next.getUTCMonth() + 1)
    end = addBountyDays(next.toISOString().slice(0, 10), -1)
  } else if (period === 'custom') {
    start = starts_on; end = ends_on
  }
  start = start < starts_on ? starts_on : start
  end = end > ends_on ? ends_on : end
  return { key: start, start, end, startIso: bountyMidnight(start), endIso: bountyMidnight(addBountyDays(end, 1)) }
}
