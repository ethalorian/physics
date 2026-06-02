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

/** Full streak detail for one student: current run, longest-ever run, total active days. */
export async function getStreakDetail(userId: string): Promise<{ current: number; longest: number; total: number }> {
  const { data } = await supabaseAdmin
    .from('student_activity')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(3000)
  const iso = (dt: Date) => dt.toISOString().slice(0, 10)
  const days = new Set<string>(((data ?? []) as { created_at: string }[]).map((a) => iso(new Date(a.created_at))))
  const total = days.size

  let current = 0
  const cur = new Date()
  if (!days.has(iso(cur))) cur.setDate(cur.getDate() - 1)
  while (days.has(iso(cur))) { current++; cur.setDate(cur.getDate() - 1) }

  // longest consecutive run (day-number diff avoids DST issues)
  const nums = [...days].map((d) => Math.floor(Date.parse(d + 'T00:00:00Z') / 86400000)).sort((a, b) => a - b)
  let longest = 0, run = 0, prev: number | null = null
  for (const n of nums) { run = prev !== null && n - prev === 1 ? run + 1 : 1; longest = Math.max(longest, run); prev = n }

  return { current, longest, total }
}
