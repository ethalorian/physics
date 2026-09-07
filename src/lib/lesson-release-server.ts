import { supabaseAdmin } from '@/lib/supabase'
import type { ReleaseClass, ReleaseLesson } from '@/lib/lesson-release'

export async function releaseClasses(
  scopeEmail: string,
  admin: boolean,
): Promise<ReleaseClass[]> {
  const fields =
    'id, name, section, track, program, lesson_experience, gate_checkpoints'
  const owned = await supabaseAdmin
    .from('courses')
    .select(fields)
    .eq('teacher_email', scopeEmail)
    .order('section')
  if (owned.error) throw owned.error
  if (owned.data?.length || !admin) return owned.data ?? []
  const all = await supabaseAdmin
    .from('courses')
    .select(fields)
    .order('section')
  if (all.error) throw all.error
  return all.data ?? []
}
export async function releaseLessons(): Promise<ReleaseLesson[]> {
  const [lessons, units] = await Promise.all([
    supabaseAdmin
      .from('lessons')
      .select(
        'id, title, slug, unit, unit_id, lesson_number, published, visibility_track',
      )
      .eq('published', true),
    supabaseAdmin
      .from('units')
      .select('id, name, program, order_index')
      .order('order_index'),
  ])
  if (lessons.error) throw lessons.error
  if (units.error) throw units.error
  const byId = new Map((units.data ?? []).map((u) => [u.id, u]))
  return (lessons.data ?? [])
    .map((l) => {
      const u = byId.get(l.unit_id)
      return {
        ...l,
        unit: u?.name ?? l.unit,
        program: u ? (u.program ?? 'physics') : null,
        unit_order: u?.order_index ?? Number.MAX_SAFE_INTEGER,
      }
    })
    .sort(
      (a, b) =>
        (a.program ?? '').localeCompare(b.program ?? '') ||
        a.unit_order - b.unit_order ||
        (a.unit_id ?? '').localeCompare(b.unit_id ?? '') ||
        (a.lesson_number ?? 0) - (b.lesson_number ?? 0) ||
        a.title.localeCompare(b.title),
    )
}
