import { supabaseAdmin } from '@/lib/supabase'
import { buildPlan, PlanItem, UnitRow, LessonRow } from '@/lib/pacing'

// Server-side data loaders for pacing. Kept out of pacing.ts so that module stays
// pure/testable.

export async function loadPlanItems(): Promise<PlanItem[]> {
  const [uRes, lRes] = await Promise.all([
    supabaseAdmin.from('units').select('order_index, name, allotted_days'),
    supabaseAdmin.from('lessons').select('id, title, unit, lesson_number, planned_days'),
  ])
  return buildPlan((uRes.data ?? []) as UnitRow[], (lRes.data ?? []) as LessonRow[])
}

export async function getCourseStudentGids(courseId: string): Promise<string[]> {
  const { data: cs } = await supabaseAdmin.from('course_students').select('student_id').eq('course_id', courseId)
  const uuids = [...new Set(((cs ?? []) as { student_id: string }[]).map((r) => r.student_id))]
  if (uuids.length === 0) return []
  const { data: s } = await supabaseAdmin.from('students').select('google_user_id').in('id', uuids)
  return [...new Set(((s ?? []) as { google_user_id: string | null }[]).map((x) => x.google_user_id).filter((g): g is string => Boolean(g)))]
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
