import { supabaseAdmin } from '@/lib/supabase'
import { buildPlan, PlanItem, UnitRow, LessonRow } from '@/lib/pacing'
import { RotationCalendar } from '@/lib/rotation'

export async function loadRotationCalendar(): Promise<RotationCalendar> {
  const { data } = await supabaseAdmin
    .from('rotation_calendar')
    .select('anchor_date, anchor_p1_block, no_school_dates, cycle_offset')
    .eq('id', 'default')
    .maybeSingle()
  const row = data as { anchor_date: string | null; anchor_p1_block: string | null; no_school_dates: string[] | null; cycle_offset: number | null } | null
  return {
    anchor_date: row?.anchor_date ?? null,
    anchor_p1_block: row?.anchor_p1_block ?? null,
    no_school_dates: row?.no_school_dates ?? [],
    cycle_offset: row?.cycle_offset ?? 0,
  }
}

export function isRotationConfigured(cal: RotationCalendar): boolean {
  return Boolean(cal.anchor_date && cal.anchor_p1_block)
}

// Server-side data loaders for pacing. Kept out of pacing.ts so that module stays
// pure/testable.

export type Program = 'physics' | 'trades'
export const PROGRAMS: Program[] = ['physics', 'trades']
export function asProgram(p: string | null | undefined): Program { return p === 'trades' ? 'trades' : 'physics' }

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
    .select('id, title, unit_id, lesson_number, planned_days')
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
