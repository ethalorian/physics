import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAuth } from '@/lib/api-auth'
import { getTeacherStudentGids } from '@/lib/teacher-scope'

// GET /api/math-spine/teacher-daily
// The teacher's daily to-do signal: of the students on your roster, how many
// still need a fresh math-fluency rating, and which competency is least covered
// (the one to rate next). Scoped to the signed-in teacher's roster; admins see
// all students. Staff only.
const STALE_DAYS = 7

export const GET = withAuth(async (_request, ctx) => {
  const role = ctx.role
  if (role !== 'admin' && role !== 'teacher') {
    return NextResponse.json({ error: 'Only teachers can view this' }, { status: 403 })
  }

  // Roster gids: teachers are scoped to their courses; admins see everyone.
  let gids: string[]
  if (role === 'teacher') {
    gids = await getTeacherStudentGids(ctx.scopeEmail)
  } else {
    const { data: allStudents } = await supabaseAdmin
      .from('students')
      .select('google_user_id')
    gids = (allStudents ?? [])
      .map((s) => s.google_user_id)
      .filter((g): g is string => Boolean(g))
  }
  const rosterSize = gids.length

  // Active competencies (for least-covered).
  const { data: compRows } = await supabaseAdmin
    .from('math_competencies')
    .select('id, code, statement, order_index')
    .eq('is_active', true)
    .order('order_index', { ascending: true })
  const competencies = compRows ?? []

  if (rosterSize === 0 || competencies.length === 0) {
    return NextResponse.json({
      rosterSize,
      awaitingRating: 0,
      leastCovered: null,
    })
  }

  // All records for the roster (recent-first is unnecessary; we aggregate).
  const { data: recRows } = await supabaseAdmin
    .from('math_competency_records')
    .select('user_id, competency_id, observed_at')
    .in('user_id', gids)

  const cutoff = Date.now() - STALE_DAYS * 86_400_000
  const latestByStudent = new Map<string, number>()
  const studentsByCompetency = new Map<string, Set<string>>()
  for (const r of recRows ?? []) {
    const t = new Date(r.observed_at).getTime()
    latestByStudent.set(r.user_id, Math.max(latestByStudent.get(r.user_id) ?? 0, t))
    const set = studentsByCompetency.get(r.competency_id) ?? new Set<string>()
    set.add(r.user_id)
    studentsByCompetency.set(r.competency_id, set)
  }

  // Awaiting a fresh rating = no record at all, or none within STALE_DAYS.
  let awaitingRating = 0
  for (const gid of gids) {
    const latest = latestByStudent.get(gid)
    if (latest === undefined || latest < cutoff) awaitingRating++
  }

  // Least-covered competency = fewest distinct students rated.
  let leastCovered: { code: string; statement: string; ratedCount: number } | null = null
  for (const c of competencies) {
    const rated = studentsByCompetency.get(c.id)?.size ?? 0
    if (leastCovered === null || rated < leastCovered.ratedCount) {
      leastCovered = { code: c.code, statement: c.statement, ratedCount: rated }
    }
  }

  return NextResponse.json({ rosterSize, awaitingRating, leastCovered })
})
