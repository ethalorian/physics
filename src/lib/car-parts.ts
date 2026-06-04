import { supabaseAdmin } from '@/lib/supabase'

/**
 * Unit-8 car-part grants. Each car part (a row in `rewards` with `grant_lesson_id`
 * set) is awarded automatically the first time the student PASSES its tied build
 * lesson at or above the part's `grant_min_score` percent (default 60).
 *
 * Lesson grades live in `gradebook_entries` (item_type='lesson', item_id=lesson_id,
 * percentage / score / max_score), written by the control room when a teacher grades
 * a day. The grant is a free `reward_redemption` (cost 0) created as PENDING — the
 * part is earned, but the teacher physically releases it by hitting Fulfill in the
 * admin store queue. The XP for the work flows through the normal economy.
 *
 * Reconcile model: idempotent, safe to call on every store load. It never grants the
 * same part twice (checks existing redemptions), and it reads the student's BEST
 * graded percent per lesson — so failing first and passing on a retry still unlocks.
 */
export async function grantEarnedCarParts(userId: string): Promise<void> {
  const { data: parts } = await supabaseAdmin
    .from('rewards')
    .select('id, name, grant_lesson_id, grant_min_score')
    .eq('active', true)
    .not('grant_lesson_id', 'is', null)
  if (!parts || parts.length === 0) return

  // Best graded percent per lesson, straight from the control-room gradebook.
  const { data: grades } = await supabaseAdmin
    .from('gradebook_entries')
    .select('item_id, score, max_score, percentage')
    .eq('user_id', userId)
    .eq('item_type', 'lesson')
    .eq('status', 'graded')

  const bestPctByLesson = new Map<string, number>()
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

  const { data: stud } = await supabaseAdmin.from('students').select('email').eq('google_user_id', userId).maybeSingle()
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
