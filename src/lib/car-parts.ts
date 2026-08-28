import { supabaseAdmin } from '@/lib/supabase'

/**
 * Unit-8 car-part grants. Each car part (a row in `rewards` with `grant_lesson_id`
 * set) is awarded automatically the first time the student PASSES its tied build
 * lesson at or above the part's `grant_min_score` percent (default 60).
 *
 * The app asserts no grades — the pass signal is the teacher's MASTERY rating on
 * the build lesson's learning target(s): the student's best rating maps to a
 * percent (1 → 40, 2 → 70, 3 → 100) against `grant_min_score`, so the default 60
 * means "rated Almost (2) or better", and a part demanding ≥85 means "Got it (3)".
 * Legacy `gradebook_entries` lesson scores (from the retired grading flow) still
 * count, so parts earned under the old system stay earned. The grant is a free
 * `reward_redemption` (cost 0) created as PENDING — the part is earned, but the
 * teacher physically releases it by hitting Fulfill in the admin store queue.
 *
 * Reconcile model: idempotent, safe to call on every store load. It never grants
 * the same part twice, and it reads the student's BEST signal per lesson — so
 * failing first and passing on a retry still unlocks.
 */
const LEVEL_PCT: Record<number, number> = { 1: 40, 2: 70, 3: 100 }
export async function grantEarnedCarParts(userId: string): Promise<void> {
  const { data: parts } = await supabaseAdmin
    .from('rewards')
    .select('id, name, grant_lesson_id, grant_min_score')
    .eq('active', true)
    .not('grant_lesson_id', 'is', null)
  if (!parts || parts.length === 0) return

  const bestPctByLesson = new Map<string, number>()

  // Mastery ratings on the build lessons' targets — the live pass signal.
  const buildLessonIds = [...new Set(parts.map((p) => p.grant_lesson_id).filter((id): id is string => Boolean(id)))]
  const { data: targetRows } = await supabaseAdmin
    .from('learning_targets')
    .select('id, lesson_id')
    .in('lesson_id', buildLessonIds)
  const lessonByTarget = new Map((targetRows ?? []).map((t) => [t.id, t.lesson_id as string]))
  if (lessonByTarget.size > 0) {
    const { data: recs } = await supabaseAdmin
      .from('mastery_records')
      .select('target_id, level')
      .eq('user_id', userId)
      .in('target_id', [...lessonByTarget.keys()])
    for (const r of (recs ?? []) as { target_id: string; level: number }[]) {
      const lessonId = lessonByTarget.get(r.target_id)
      if (!lessonId) continue
      const pct = LEVEL_PCT[r.level] ?? 0
      bestPctByLesson.set(lessonId, Math.max(bestPctByLesson.get(lessonId) ?? 0, pct))
    }
  }

  // Legacy gradebook lesson scores (retired flow) — old earnings stay earned.
  const { data: grades } = await supabaseAdmin
    .from('gradebook_entries')
    .select('item_id, score, max_score, percentage')
    .eq('user_id', userId)
    .eq('item_type', 'lesson')
    .eq('status', 'graded')
  for (const g of (grades ?? []) as { item_id: string | null; score: number | null; max_score: number | null; percentage: number | null }[]) {
    if (!g.item_id) continue
    const pct = g.percentage != null ? g.percentage : g.max_score ? ((g.score ?? 0) / g.max_score) * 100 : (g.score ?? 0)
    bestPctByLesson.set(g.item_id, Math.max(bestPctByLesson.get(g.item_id) ?? 0, pct))
  }

  const { data: existing } = await supabaseAdmin.from('reward_redemptions').select('reward_id').eq('user_id', userId)
  const have = new Set((existing ?? []).map((r: { reward_id: string }) => r.reward_id))

  const toGrant = parts.filter((p: { id: string; grant_lesson_id: string | null; grant_min_score: number | null }) =>
    p.grant_lesson_id &&
    (bestPctByLesson.get(p.grant_lesson_id) ?? -1) >= (p.grant_min_score ?? 60) &&
    !have.has(p.id),
  )
  if (toGrant.length === 0) return

  const { data: stud } = await supabaseAdmin.from('students').select('email').eq('id', userId).maybeSingle()
  const rows = toGrant.map((p: { id: string; name: string }) => ({
    user_id: userId,
    user_email: stud?.email ?? null,
    reward_id: p.id,
    reward_name: p.name,
    cost_points: 0,
    status: 'pending',
    note: 'Earned by passing the build lesson — release to hand out the part',
  }))
  await supabaseAdmin.from('reward_redemptions').insert(rows)
}
