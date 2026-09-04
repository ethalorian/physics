/**
 * Which learning targets does a lesson *use*?
 *
 * `learning_targets.lesson_id` is one-to-one, but a target is not: an MVP week's
 * target is captured on Day 1, Day 2 and Day 4 as three separate day lessons
 * (decision 2026-09-04, "MVP days are discrete lessons"). So anything that asks
 * "does this lesson have a target?" or "which lessons carry this target's work?"
 * reads the block document — every capture block names its target by slug —
 * and unions that with the owning `lesson_id`. Server-side only.
 */
import { supabaseAdmin } from '@/lib/supabase'

type Doc = { blocks?: unknown[] } | null | undefined

/** Target slugs referenced by capture / rating blocks (targetId, targetIds, targets). */
export function targetSlugsInBlocks(doc: Doc): string[] {
  const out = new Set<string>()
  const blocks = Array.isArray(doc?.blocks) ? doc!.blocks! : []
  for (const raw of blocks) {
    const b = raw as Record<string, unknown>
    if (typeof b.targetId === 'string' && b.targetId) out.add(b.targetId)
    for (const k of ['targetIds', 'targets']) {
      const v = b[k]
      if (Array.isArray(v)) for (const s of v) if (typeof s === 'string' && s) out.add(s)
    }
  }
  return [...out]
}

/** Target ids a lesson can be rated on: owned by `lesson_id` ∪ referenced in its blocks. */
export async function targetIdsForLesson(lessonId: string): Promise<string[]> {
  const [{ data: owned }, { data: row }] = await Promise.all([
    supabaseAdmin.from('learning_targets').select('id').eq('lesson_id', lessonId),
    supabaseAdmin.from('lessons').select('content_blocks').eq('id', lessonId).maybeSingle(),
  ])
  const ids = new Set((owned ?? []).map((t) => (t as { id: string }).id))
  const slugs = targetSlugsInBlocks((row as { content_blocks?: Doc } | null)?.content_blocks)
  if (slugs.length > 0) {
    const { data: ref } = await supabaseAdmin.from('learning_targets').select('id').in('slug', slugs)
    for (const t of ref ?? []) ids.add((t as { id: string }).id)
  }
  return [...ids]
}

/**
 * For a set of lessons (already loaded with their block docs), map each target id
 * to every lesson that carries its work — the owner plus every referencing lesson.
 */
export function lessonsByTarget(
  lessons: { id: string; content_blocks?: Doc }[],
  targets: { id: string; slug: string; lesson_id: string | null }[],
): Map<string, string[]> {
  const bySlug = new Map<string, Set<string>>()
  for (const l of lessons) for (const s of targetSlugsInBlocks(l.content_blocks)) (bySlug.get(s) ?? bySlug.set(s, new Set()).get(s)!).add(l.id)
  const out = new Map<string, string[]>()
  for (const t of targets) {
    const set = new Set<string>(bySlug.get(t.slug) ?? [])
    if (t.lesson_id) set.add(t.lesson_id)
    out.set(t.id, [...set])
  }
  return out
}
