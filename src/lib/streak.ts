import { supabaseAdmin } from '@/lib/supabase'

/**
 * Streak = consecutive days of activity ending today (or yesterday, so a streak
 * doesn't break until a full day is missed). Computed from `student_activity`.
 * This is the batch version used by the leaderboard; the home route computes the
 * same thing for a single user.
 */
export async function getStreaksForUsers(userIds: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  if (userIds.length === 0) return out

  const { data } = await supabaseAdmin
    .from('student_activity')
    .select('user_id, created_at')
    .in('user_id', userIds)
    .order('created_at', { ascending: false })
    .limit(5000)

  const iso = (dt: Date) => dt.toISOString().slice(0, 10)
  const daysByUser = new Map<string, Set<string>>()
  for (const a of (data ?? []) as { user_id: string; created_at: string }[]) {
    let set = daysByUser.get(a.user_id)
    if (!set) { set = new Set(); daysByUser.set(a.user_id, set) }
    set.add(iso(new Date(a.created_at)))
  }

  for (const uid of userIds) {
    const days = daysByUser.get(uid) ?? new Set<string>()
    let streak = 0
    const cursor = new Date()
    if (!days.has(iso(cursor))) cursor.setDate(cursor.getDate() - 1) // today not required if yesterday active
    while (days.has(iso(cursor))) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    }
    out.set(uid, streak)
  }
  return out
}
