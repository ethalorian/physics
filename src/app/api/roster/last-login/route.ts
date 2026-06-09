import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { resolveRosterScope } from '@/lib/teacher-scope'

// GET /api/roster/last-login?class=<courseId>
// Per-student "last signed in" for the caller's roster (or one class), so the
// control room can show when each student was last active. lastSeen = the more
// recent of the recorded login and their latest activity.
export const GET = withRole(['teacher', 'admin'], async (request, ctx) => {
  const classId = new URL(request.url).searchParams.get('class')
  const scope = await resolveRosterScope({ classId, role: ctx.role as 'admin' | 'teacher', scopeEmail: ctx.scopeEmail })

  let q = supabaseAdmin.from('students').select('google_user_id, last_login')
  if (scope.gids) q = q.in('google_user_id', scope.gids.length ? scope.gids : ['__none__'])
  const { data: studs } = await q
  const rows = ((studs ?? []) as { google_user_id: string | null; last_login: string | null }[]).filter((s) => s.google_user_id)
  const gids = rows.map((s) => s.google_user_id as string)

  const lastActByGid = new Map<string, number>()
  if (gids.length > 0) {
    const { data: act } = await supabaseAdmin
      .from('student_activity').select('user_id, created_at').in('user_id', gids)
      .order('created_at', { ascending: false }).limit(8000)
    for (const a of (act ?? []) as { user_id: string | null; created_at: string }[]) {
      if (!a.user_id) continue
      const ts = new Date(a.created_at).getTime()
      if (ts > (lastActByGid.get(a.user_id) ?? 0)) lastActByGid.set(a.user_id, ts)
    }
  }

  const presence = rows.map((s) => {
    const gid = s.google_user_id as string
    const login = s.last_login ? new Date(s.last_login).getTime() : 0
    const seen = Math.max(login, lastActByGid.get(gid) ?? 0)
    return { gid, lastLoginAt: s.last_login ?? null, lastSeenAt: seen ? new Date(seen).toISOString() : null }
  })
  return NextResponse.json({ presence })
})
