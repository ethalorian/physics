/**
 * The school day, as this building actually lives it.
 *
 * Fitchburg is in America/New_York, so a "day" here is an EASTERN calendar
 * day: it begins at ET midnight and ends 24-ish hours later (23 or 25 across
 * the DST changeovers). Everything the math spine calls "today" — which
 * warm-up problem is served, what numbers it is seeded with, whether a rated
 * submission already exists, the practice-rep cap — must agree with that
 * boundary, because that is the boundary students and teachers experience.
 *
 * The bug this file exists to kill: the routes used to compute the day from
 * UTC (`Math.floor(Date.now() / 86_400_000)`, `toISOString().slice(0, 10)`),
 * and server-local midnight (`setHours(0, 0, 0, 0)`) which on a UTC-hosted
 * server is the same thing. UTC midnight is 8:00pm ET (7:00pm in winter), so
 * a student starting homework at 8:30pm got TOMORROW's problem and the day's
 * evidence landed on the wrong date.
 *
 * Implementation note: the ET calendar parts are read with Intl, never with a
 * hardcoded -5/-4 offset, so EST and EDT are both correct and the March and
 * November changeovers need no special case. No dependency — Intl is enough.
 *
 * Pure functions, no IO. Every function takes an optional `now` so tests can
 * pin an instant.
 */

export const SCHOOL_TZ = 'America/New_York'

const MS_PER_DAY = 86_400_000

/** Formats an instant into the ET calendar date's numeric parts. */
const partsFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: SCHOOL_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

type EtParts = { year: number; month: number; day: number; hour: number; minute: number; second: number }

function etParts(now: Date): EtParts {
  const out: Record<string, number> = {}
  for (const p of partsFmt.formatToParts(now)) {
    if (p.type !== 'literal') out[p.type] = Number(p.value)
  }
  return out as unknown as EtParts
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * The ET calendar date as `YYYY-MM-DD`. This is the key to store on and
 * group evidence by — 2026-09-04T23:30:00Z is still `2026-09-04` here.
 */
export function schoolDayKey(now: Date = new Date()): string {
  const { year, month, day } = etParts(now)
  return `${year}-${pad(month)}-${pad(day)}`
}

/**
 * A stable integer index for the ET calendar date: days since the epoch of
 * that Y-M-D read as a UTC date. Because it is derived from the calendar
 * date and not from an elapsed-milliseconds division, it increments exactly
 * once per ET midnight and is unaffected by DST (the 23- and 25-hour days
 * still advance it by exactly 1).
 *
 * Used as the item selector and as part of the per-student instantiation
 * seed, so it must be identical for every request inside one ET day.
 */
export function schoolDayNumber(now: Date = new Date()): number {
  const { year, month, day } = etParts(now)
  return Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY)
}

/** The `YYYY-MM-DD` key for a day number — the inverse of schoolDayNumber. */
export function schoolDayKeyFromNumber(dayNumber: number): string {
  const d = new Date(dayNumber * MS_PER_DAY)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

/**
 * Weekday of a school day number, 0 = Sunday … 6 = Saturday. Reading it off
 * the UTC-anchored day number is exact: the anchor carries the ET calendar
 * date, so its UTC weekday IS the ET weekday. Lets the streak walker step
 * whole days without ever touching a local-time Date.
 */
export function schoolDayWeekday(dayNumber: number): number {
  return new Date(dayNumber * MS_PER_DAY).getUTCDay()
}

/**
 * The UTC-minus-ET offset in force at a given instant, in ms: how far the ET
 * wall clock reads behind UTC (+5h in EST, +4h in EDT), signed so that
 * `instant + offset` is the wall clock read as if it were UTC.
 */
function etOffsetMs(at: Date): number {
  const { year, month, day, hour, minute, second } = etParts(at)
  const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute, second)
  return wallAsUtc - Math.floor(at.getTime() / 1000) * 1000
}

/**
 * The instant of ET midnight that BEGINS the current ET day, as a real Date.
 * Correct in both EST and EDT: the offset is looked up at the candidate
 * instant and then re-resolved once, which settles the case where the day
 * starts on one side of a changeover and `now` is on the other. Suitable as
 * a `>= submitted_at` bound in a query.
 */
export function schoolDayStart(now: Date = new Date()): Date {
  const { year, month, day } = etParts(now)
  // ET midnight expressed as if it were a UTC wall clock...
  const wallMidnight = Date.UTC(year, month - 1, day, 0, 0, 0)
  // ...then shifted back by the real offset. One refinement pass is enough:
  // the first guess is at most an hour off, never enough to cross a second
  // changeover. (ET midnight itself is never a skipped or repeated hour --
  // US DST shifts happen at 2am -- so this always resolves to one instant.)
  let ts = wallMidnight - etOffsetMs(new Date(wallMidnight))
  ts = wallMidnight - etOffsetMs(new Date(ts))
  return new Date(ts)
}
