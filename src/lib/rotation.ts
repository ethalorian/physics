// Rotating block schedule engine (pure). 6-day cycle of rotating blocks A–F with
// G locked at period 2 (never drops, never the long block). Each day 6 blocks meet
// (G + 5 rotating); the period-1 block drops the next day and returns the day after.
// Period 5 is the long block.
//
//  Cycle day | P1 P2 P3 P4 P5(long) P6 | drops
//      1     | A  G  B  C  D        E  | F
//      2     | B  G  C  D  E        F  | A
//      3     | C  G  D  E  F        A  | B
//      4     | D  G  E  F  A        B  | C
//      5     | E  G  F  A  B        C  | D
//      6     | F  G  A  B  C        D  | E
//
// cycleDay is 0-based here: 0 => P1=A. The cycle advances once per SCHOOL day
// (weekday not in no-school); weekends and no-school days don't advance it.

export const ROTATING_BLOCKS = ['A', 'B', 'C', 'D', 'E', 'F'] as const
export type Block = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

export interface RotationCalendar {
  anchor_date: string | null       // 'YYYY-MM-DD' — a known school day
  anchor_p1_block: string | null   // block in period 1 on anchor_date (A-F)
  no_school_dates: string[]
  cycle_offset: number             // manual nudge to shift the whole rotation +/- days
}

function utc(d: string): Date { return new Date(d + 'T00:00:00Z') }
function iso(d: Date): string { return d.toISOString().slice(0, 10) }

// Is `date` a school day (weekday, not a no-school date)? Weekends never are.
export function isSchoolDay(date: Date, noSchool: Set<string>): boolean {
  const dow = date.getUTCDay()
  if (dow === 0 || dow === 6) return false
  return !noSchool.has(iso(date))
}

// Count school days in (start, ...through end] inclusive of both ends when school days.
function schoolDaysBetween(start: Date, end: Date, noSchool: Set<string>): number {
  if (end < start) return 0
  let count = 0
  const d = new Date(start)
  while (d <= end) {
    if (isSchoolDay(d, noSchool)) count++
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return count
}

// 0-based cycle day for a given date. Returns null if calendar isn't set or the
// date is before the anchor / not yet placeable.
export function cycleDayForDate(cal: RotationCalendar, date: Date): number | null {
  if (!cal.anchor_date || !cal.anchor_p1_block) return null
  const anchorPos = ROTATING_BLOCKS.indexOf(cal.anchor_p1_block as typeof ROTATING_BLOCKS[number])
  if (anchorPos < 0) return null
  const anchor = utc(cal.anchor_date)
  const noSchool = new Set(cal.no_school_dates)
  if (date < anchor) return null
  // school days elapsed since anchor (anchor itself = index 0)
  const elapsed = schoolDaysBetween(anchor, date, noSchool) - 1
  if (elapsed < 0) return null
  const offset = cal.cycle_offset ?? 0
  return (((anchorPos + elapsed + offset) % 6) + 6) % 6
}

// Which rotating block drops on a given cycle day.
export function droppedBlock(cycleDay: number): Block {
  return ROTATING_BLOCKS[(cycleDay + 5) % 6]
}

// The long-block (period 5) rotating block for a given cycle day.
export function longBlockOf(cycleDay: number): Block {
  return ROTATING_BLOCKS[(cycleDay + 3) % 6]
}

// Does `block` meet on this cycle day? G always meets; a rotating block meets
// unless it's the one dropping.
export function blockMeetsOnCycleDay(block: Block, cycleDay: number): boolean {
  if (block === 'G') return true
  return droppedBlock(cycleDay) !== block
}

// Is this a long-block meeting for `block`? G is never a long block.
export function isLongBlock(block: Block, cycleDay: number): boolean {
  if (block === 'G') return false
  return longBlockOf(cycleDay) === block
}

// Does `block` actually meet on a real calendar date (school day + not dropped)?
export function blockMeetsOnDate(cal: RotationCalendar, block: Block, date: Date): { meets: boolean; long: boolean } {
  const noSchool = new Set(cal.no_school_dates)
  if (!isSchoolDay(date, noSchool)) return { meets: false, long: false }
  const cd = cycleDayForDate(cal, date)
  if (cd === null) return { meets: false, long: false }
  return { meets: blockMeetsOnCycleDay(block, cd), long: isLongBlock(block, cd) }
}

// Number of times `block` has met from start_date through `today` (inclusive).
export function blockMeetingsElapsed(cal: RotationCalendar, block: Block, startDate: string, today: Date): number {
  const start = utc(startDate)
  if (today < start) return 0
  const noSchool = new Set(cal.no_school_dates)
  let count = 0
  const d = new Date(start)
  while (d <= today) {
    if (isSchoolDay(d, noSchool)) {
      const cd = cycleDayForDate(cal, d)
      if (cd !== null && blockMeetsOnCycleDay(block, cd)) count++
    }
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return count
}

// Upcoming (and current) meeting dates for a block, from `fromDate`, up to `limit`
// meetings. Each entry flags whether it's a long block.
export function upcomingMeetings(cal: RotationCalendar, block: Block, fromDate: Date, limit: number): { date: string; long: boolean }[] {
  const out: { date: string; long: boolean }[] = []
  const noSchool = new Set(cal.no_school_dates)
  const d = new Date(fromDate)
  let guard = 0
  while (out.length < limit && guard < 400) {
    guard++
    if (isSchoolDay(d, noSchool)) {
      const cd = cycleDayForDate(cal, d)
      if (cd !== null && blockMeetsOnCycleDay(block, cd)) out.push({ date: iso(d), long: isLongBlock(block, cd) })
    }
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return out
}
