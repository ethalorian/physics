// Pacing math, shared by the section + overview APIs. Pure functions: they take
// already-fetched rows and a "today", and never touch the DB.
//
// The plan is an ordered sequence of items. Where a unit has authored lessons,
// each lesson is an item carrying its planned day-span; where a unit has no
// lessons yet, the unit itself is a single placeholder item carrying its allotted
// days. Cumulative day-spans map plan position to a section's real calendar.

export interface UnitRow { order_index: number; name: string; allotted_days: number | null }
export interface LessonRow { id: string; title: string; unit: string; lesson_number: number | null; planned_days: number | null }

export interface PlanItem {
  kind: 'lesson' | 'unit'
  unitOrder: number
  unitName: string
  lessonId: string | null
  title: string
  lessonNumber: number | null
  plannedDays: number
  index: number     // 0-based position in the sequence
  cumStart: number  // cumulative plan-days before this item
}

export interface Schedule {
  start_date: string | null
  meeting_days: number[]    // 0=Sun .. 6=Sat
  no_school_dates: string[] // 'YYYY-MM-DD'
}

export type PacingStatus = 'on' | 'ahead' | 'behind' | 'unknown'

export interface PacingResult {
  notStarted: boolean
  elapsed: number
  totalDays: number
  plannedIndex: number | null
  plannedTitle: string | null
  actualIndex: number | null
  actualTitle: string | null
  actualSource: 'auto' | 'confirmed' | 'none'
  deltaDays: number     // + ahead, - behind (in plan-days, to 0.1)
  status: PacingStatus
}

const ON_PACE_TOLERANCE = 1.5 // days within which a section is "on pace"

export function buildPlan(units: UnitRow[], lessons: LessonRow[]): PlanItem[] {
  const byUnit = new Map<string, LessonRow[]>()
  for (const l of lessons) {
    const arr = byUnit.get(l.unit) ?? []
    arr.push(l)
    byUnit.set(l.unit, arr)
  }
  const items: PlanItem[] = []
  let cum = 0
  let idx = 0
  for (const u of [...units].sort((a, b) => a.order_index - b.order_index)) {
    const ls = (byUnit.get(u.name) ?? []).sort((a, b) => (a.lesson_number ?? 0) - (b.lesson_number ?? 0))
    if (ls.length > 0) {
      for (const l of ls) {
        const pd = Number(l.planned_days ?? 1) || 1
        items.push({ kind: 'lesson', unitOrder: u.order_index, unitName: u.name, lessonId: l.id, title: l.title, lessonNumber: l.lesson_number, plannedDays: pd, index: idx, cumStart: cum })
        cum += pd; idx++
      }
    } else {
      const pd = Number(u.allotted_days ?? 0) || 0
      items.push({ kind: 'unit', unitOrder: u.order_index, unitName: u.name, lessonId: null, title: u.name, lessonNumber: null, plannedDays: pd, index: idx, cumStart: cum })
      cum += pd; idx++
    }
  }
  return items
}

export function totalPlanDays(items: PlanItem[]): number {
  return items.reduce((s, i) => s + i.plannedDays, 0)
}

// Re-scope the plan to a single unit: keep only that unit's items and rebase
// their cumStart/index so the unit's first item starts at day 0. The same pacing
// math then compares against the UNIT's length instead of the whole course.
export function unitItems(items: PlanItem[], unitOrder: number): PlanItem[] {
  const inUnit = items.filter((i) => i.unitOrder === unitOrder)
  if (inUnit.length === 0) return []
  const base = inUnit[0].cumStart
  return inUnit.map((i, k) => ({ ...i, cumStart: i.cumStart - base, index: k }))
}

// UTC throughout to stay deterministic on the server.
function utc(dateStr: string): Date { return new Date(dateStr + 'T00:00:00Z') }

// Instructional days that have occurred from start_date through `today` (today
// counts if it's a meeting day). Excludes non-meeting weekdays and no-school dates.
export function elapsedInstructionalDays(sch: Schedule, today: Date): number {
  if (!sch.start_date) return 0
  const start = utc(sch.start_date)
  if (today < start) return 0
  const noSchool = new Set(sch.no_school_dates)
  const meet = new Set(sch.meeting_days)
  let count = 0
  const d = new Date(start)
  while (d <= today) {
    const iso = d.toISOString().slice(0, 10)
    if (meet.has(d.getUTCDay()) && !noSchool.has(iso)) count++
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return count
}

// The item the plan says a section should be on after `elapsed` instruction days.
export function plannedItem(items: PlanItem[], elapsed: number): PlanItem | null {
  if (items.length === 0) return null
  if (elapsed <= 0) return items[0]
  const dayIdx = elapsed - 1
  for (const it of items) {
    if (dayIdx < it.cumStart + it.plannedDays) return it
  }
  return items[items.length - 1]
}

// Core: given how many instruction/meeting days have elapsed, place the section
// against the plan. `started=false` means the section hasn't begun (no start date
// or today is before it). Both the weekday and rotating-block paths feed this.
export function computeFromElapsed(
  items: PlanItem[],
  elapsed: number,
  started: boolean,
  actual: { item: PlanItem | null; source: 'auto' | 'confirmed' | 'none' },
): PacingResult {
  const total = totalPlanDays(items)
  const base: PacingResult = {
    notStarted: !started, elapsed: started ? elapsed : 0, totalDays: total,
    plannedIndex: null, plannedTitle: null,
    actualIndex: actual.item?.index ?? null, actualTitle: actual.item?.title ?? null,
    actualSource: actual.source, deltaDays: 0, status: 'unknown',
  }
  if (!started) return base
  const planned = plannedItem(items, elapsed)
  let deltaDays = 0
  let status: PacingStatus = 'unknown'
  if (actual.item && planned) {
    deltaDays = Math.round((actual.item.cumStart - (elapsed - 1)) * 10) / 10
    status = Math.abs(deltaDays) <= ON_PACE_TOLERANCE ? 'on' : deltaDays < 0 ? 'behind' : 'ahead'
  }
  return {
    notStarted: false, elapsed, totalDays: total,
    plannedIndex: planned?.index ?? null, plannedTitle: planned?.title ?? null,
    actualIndex: actual.item?.index ?? null, actualTitle: actual.item?.title ?? null,
    actualSource: actual.source, deltaDays, status,
  }
}

// Weekday path (fallback when no rotation block is tagged).
export function computePacing(
  items: PlanItem[],
  sch: Schedule | null,
  today: Date,
  actual: { item: PlanItem | null; source: 'auto' | 'confirmed' | 'none' },
): PacingResult {
  if (!sch?.start_date || today < utc(sch.start_date)) return computeFromElapsed(items, 0, false, actual)
  return computeFromElapsed(items, elapsedInstructionalDays(sch, today), true, actual)
}
