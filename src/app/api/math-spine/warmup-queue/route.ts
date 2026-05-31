import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { resolveRosterScope } from '@/lib/teacher-scope'

// GET /api/math-spine/warmup-queue[?class=<courseId>]
// The math review queue: every roster student with PENDING warm-up submissions,
// most urgent first (oldest waiting). Mirrors /api/mastery/queue's shape.
type StudentRow = { google_user_id: string | null; name: string | null }
const HOUR = 60 * 60 * 1000

export const GET = withAuth(async (request, ctx) => {
  const role = ctx.role
  if (role !== 'admin' && role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const classId = new URL(request.url).searchParams.get('class')

  let sQuery = supabaseAdmin.from('students').select('google_user_id, name').order('name', { ascending: true })
  const scope = await resolveRosterScope({ classId, role, scopeEmail: ctx.scopeEmail })
  if (scope.gids) sQuery = sQuery.in('google_user_id', scope.gids)
  const { data: sr } = await sQuery
  const students = ((sr ?? []) as StudentRow[]).filter((s) => s.google_user_id)
  const nameById = new Map<string, string>(students.map((s): [string, string] => [s.google_user_id as string, s.name ?? 'Student']))
  const studentIds = [...nameById.keys()]
  if (studentIds.length === 0) return NextResponse.json({ queue: [] })

  const { data: pend } = await supabaseAdmin
    .from('math_warmup_submissions')
    .select('user_id, submitted_at')
    .eq('status', 'pending')
    .in('user_id', studentIds)

  const byUser = new Map<string, { count: number; oldest: number }>()
  for (const p of pend ?? []) {
    const t = new Date(p.submitted_at).getTime()
    const cur = byUser.get(p.user_id) ?? { count: 0, oldest: t }
    cur.count++
    if (t < cur.oldest) cur.oldest = t
    byUser.set(p.user_id, cur)
  }

  const now = Date.now()
  const queue = [...byUser.entries()].map(([uid, v]) => {
    const ageHours = Math.round((now - v.oldest) / HOUR)
    return { studentId: uid, name: nameById.get(uid) ?? 'Student', count: v.count, oldestAgeHours: ageHours, aged: ageHours >= 48 }
  })
  queue.sort((a, b) => {
    if (a.aged !== b.aged) return a.aged ? -1 : 1
    return b.oldestAgeHours - a.oldestAgeHours
  })

  return NextResponse.json({ queue })
})
