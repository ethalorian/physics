import { isCatalogLesson } from '@/lib/retired-curriculum'
import { supabaseAdmin } from '@/lib/supabase'
import type { ReleaseClass, ReleaseLesson } from '@/lib/lesson-release'
import { isCurrentLesson } from '@/lib/current-lesson-catalog'
import { PHYSICS_VIDEOS } from '@/data/physics-videos'
import type { BlockDocument } from '@/data/content-blocks'

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
    .is('archived_at', null)
    .order('section')
  if (owned.error) throw owned.error
  if (owned.data?.length || !admin) return owned.data ?? []
  const all = await supabaseAdmin
    .from('courses')
    .select(fields)
    .is('archived_at', null)
    .order('section')
  if (all.error) throw all.error
  return all.data ?? []
}
export async function releaseLessons(): Promise<ReleaseLesson[]> {
  const [lessons, units] = await Promise.all([
    supabaseAdmin
      .from('lessons')
      .select(
        'id, title, slug, unit, unit_id, lesson_number, published, visibility_track, content_blocks',
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
    .filter(isCatalogLesson)
    .map((row) => {
      const { content_blocks, ...l } = row
      const u = byId.get(l.unit_id)
      const doc = content_blocks as BlockDocument | null
      const video = PHYSICS_VIDEOS.find(v => doc?.blocks?.some(b => b.type === 'instruction_video' && b.youtubeId === v.youtubeId))
      return {
        ...l,
        unit: u?.name ?? l.unit,
        program: u ? (u.program ?? 'physics') : null,
        unit_order: u?.order_index ?? Number.MAX_SAFE_INTEGER,
        current: isCurrentLesson({ unit_id: l.unit_id, program: u?.program ?? 'physics', content_blocks: doc }),
        video_sequence: video?.sequence,
      }
    })
    .filter(l => l.current)
    .sort(
      (a, b) =>
        (a.program ?? '').localeCompare(b.program ?? '') ||
        a.unit_order - b.unit_order ||
        (a.video_sequence ?? Number.MAX_SAFE_INTEGER) - (b.video_sequence ?? Number.MAX_SAFE_INTEGER) ||
        (a.unit_id ?? '').localeCompare(b.unit_id ?? '') ||
        (a.lesson_number ?? 0) - (b.lesson_number ?? 0) ||
        a.title.localeCompare(b.title),
    )
}
