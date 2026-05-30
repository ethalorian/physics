/**
 * Build the grouping roster for a course: each enrolled student plus a numeric
 * mastery "level" (Fork B2). When a learning target is given, level is that
 * target's mastery; otherwise it's the student's overall average. Students with
 * no observations get level = null (the grouping engine treats null neutrally).
 *
 * NOTE: this is a simple mean of observed Marzano levels, not the canonical
 * decaying weighted average. It's sufficient for *ordering* students into bands;
 * if you later want the grouping to match the gradebook exactly, swap this query
 * for the same rollup the mastery dashboard uses.
 */
import { supabaseAdmin } from '@/lib/supabase'
import { getCourseStudentGids } from '@/lib/teacher-scope'
import type { RosterStudent } from '@/lib/lobby/grouping'

export async function getCourseRoster(
  courseId: string,
  targetId?: string | null,
): Promise<RosterStudent[]> {
  const gids = await getCourseStudentGids(courseId)
  if (gids.length === 0) return []

  const { data: studentRows } = await supabaseAdmin
    .from('students')
    .select('google_user_id, name')
    .in('google_user_id', gids)

  const nameByGid = new Map<string, string>()
  for (const s of studentRows ?? []) {
    if (s.google_user_id) nameByGid.set(s.google_user_id, s.name ?? 'Student')
  }

  let masteryQuery = supabaseAdmin
    .from('mastery_records')
    .select('user_id, level, target_id')
    .in('user_id', gids)
  if (targetId) masteryQuery = masteryQuery.eq('target_id', targetId)

  const { data: masteryRows } = await masteryQuery

  const sums = new Map<string, { total: number; count: number }>()
  for (const r of masteryRows ?? []) {
    const uid = r.user_id as string
    const lvl = typeof r.level === 'number' ? r.level : null
    if (uid == null || lvl == null) continue
    const acc = sums.get(uid) ?? { total: 0, count: 0 }
    acc.total += lvl
    acc.count += 1
    sums.set(uid, acc)
  }

  return gids.map((gid) => {
    const acc = sums.get(gid)
    return {
      userId: gid,
      name: nameByGid.get(gid) ?? 'Student',
      level: acc && acc.count > 0 ? acc.total / acc.count : null,
    }
  })
}
