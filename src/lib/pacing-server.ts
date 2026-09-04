import { supabaseAdmin } from '@/lib/supabase'
import { buildPlan, PlanItem, UnitRow, LessonRow } from '@/lib/pacing'
import { RotationCalendar, isBlock, type MeetingPattern, type Block } from '@/lib/rotation'

export async function loadRotationCalendar(): Promise<RotationCalendar> {
  const { data } = await supabaseAdmin
    .from('rotation_calendar')
    .select('anchor_date, anchor_p1_block, no_school_dates, cycle_offset, alt_week_anchor')
    .eq('id', 'default')
    .maybeSingle()
  const row = data as { anchor_date: string | null; anchor_p1_block: string | null; no_school_dates: string[] | null; cycle_offset: number | null; alt_week_anchor: string | null } | null
  return {
    anchor_date: row?.anchor_date ?? null,
    anchor_p1_block: row?.anchor_p1_block ?? null,
    no_school_dates: row?.no_school_dates ?? [],
    cycle_offset: row?.cycle_offset ?? 0,
    alt_week_anchor: row?.alt_week_anchor ?? null,
  }
}

export function isRotationConfigured(cal: RotationCalendar): boolean {
  return Boolean(cal.anchor_date && cal.anchor_p1_block)
}

// Server-side data loaders for pacing. Kept out of pacing.ts so that module stays
// pure/testable.

import { asProgram, type Program } from '@/lib/program'
export { asProgram, PROGRAMS, type Program } from '@/lib/program'

export interface UnitMeta extends UnitRow { default_start_date: string | null }

// One program's units, in curriculum order.
export async function loadUnits(program: Program): Promise<UnitMeta[]> {
  const { data } = await supabaseAdmin
    .from('units')
    .select('id, order_index, name, allotted_days, default_start_date')
    .eq('program', program)
    .order('order_index', { ascending: true })
  return (data ?? []) as UnitMeta[]
}

// The plan for ONE program. Lessons are matched to units by unit_id.
export async function loadPlanItems(program: Program): Promise<PlanItem[]> {
  const units = await loadUnits(program)
  if (units.length === 0) return []
  const { data: lessons } = await supabaseAdmin
    .from('lessons')
    .select('id, title, unit_id, lesson_number, planned_days, transfer_core')
    .in('unit_id', units.map((u) => u.id))
  return buildPlan(units, (lessons ?? []) as LessonRow[])
}

// Which program a course follows (courses.program, default physics).
export async function loadCourseProgram(courseId: string): Promise<Program> {
  const { data } = await supabaseAdmin.from('courses').select('program').eq('id', courseId).maybeSingle()
  return asProgram((data as { program?: string | null } | null)?.program)
}

export async function getCourseStudentGids(courseId: string): Promise<string[]> {
  // course_students.student_id IS students.id, which is the work-table user_id.
  const { data: cs } = await supabaseAdmin.from('course_students').select('student_id').eq('course_id', courseId)
  return [...new Set(((cs ?? []) as { student_id: string | null }[]).map((r) => r.student_id).filter((g): g is string => Boolean(g)))]
}

// Furthest plan item (by sequence index) that has student block activity.
export function furthestActiveItem(items: PlanItem[], activeLessonIds: Set<string>): PlanItem | null {
  let best: PlanItem | null = null
  for (const it of items) {
    if (it.lessonId && activeLessonIds.has(it.lessonId) && (!best || it.index > best.index)) best = it
  }
  return best
}

export async function autoSuggestItem(items: PlanItem[], gids: string[]): Promise<PlanItem | null> {
  if (gids.length === 0) return null
  const { data: br } = await supabaseAdmin.from('block_responses').select('lesson_id').in('user_id', gids)
  const active = new Set(((br ?? []) as { lesson_id: string }[]).map((r) => r.lesson_id))
  return furthestActiveItem(items, active)
}

// A section's meeting pattern from its section_schedules row. `blocks` is the
// source of truth; the legacy single `block` column is honoured if blocks is empty.
// Trades units are written as sessions (one per school day); physics lessons
// are one per block-period. So the counting mode follows the program.
export function patternFromRow(
  row: { blocks?: string[] | null; block?: string | null; week_pattern?: string | null; on_week_anchor?: string | null; on_week_dates?: string[] | null } | null | undefined,
  program: Program = 'physics',
): MeetingPattern {
  const fromArray = (row?.blocks ?? []).filter(isBlock)
  const blocks: Block[] = fromArray.length > 0 ? fromArray : (isBlock(row?.block) ? [row!.block as Block] : [])
  return {
    blocks,
    weekPattern: row?.week_pattern === 'alternate' ? 'alternate' : 'every',
    onWeekAnchor: row?.on_week_anchor ?? null,
    onWeekDates: (row?.on_week_dates ?? []).map((d) => String(d).slice(0, 10)),
    countMode: program === 'trades' ? 'sessions' : 'meetings',
  }
}

// The unit a class is working in RIGHT NOW: the unit of the furthest plan item
// its students have touched, else the program's first unit. This is what every
// teacher surface should open on when a class is picked — a Trades or Project
// Physics class must never land on physics unit-1 (decision 2026-09-04).
export async function currentUnitForCourse(courseId: string): Promise<{ program: Program; unitId: string | null }> {
  const program = await loadCourseProgram(courseId)
  const [items, gids] = await Promise.all([loadPlanItems(program), getCourseStudentGids(courseId)])
  const hit = await autoSuggestItem(items, gids)
  const first = items.find((it) => it.kind === 'unit') ?? items[0] ?? null
  return { program, unitId: hit?.unitId ?? first?.unitId ?? null }
}
