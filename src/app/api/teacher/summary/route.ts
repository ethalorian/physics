import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'
import { getTeacherStudentGids } from '@/lib/teacher-scope'

// GET /api/teacher/summary
// A teacher's personal "what's on my plate" snapshot for the account slide-over.
// Scoped to the teacher's own students (admins see everyone). Deliberately lighter
// than /admin/home — this is YOUR footprint, not the app-wide command center.

const HOUR = 60 * 60 * 1000
const WEEK = 7 * 24 * HOUR
const AGED = 48 * HOUR

type GidRow = { google_user_id: string | null }
type BrRow = { user_id: string; created_at: string }
type MrRow = { user_id: string; observed_at: string }

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const role = getUserRole(session.user.email)
    if (role !== 'admin' && role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // students in scope (keyed by google_user_id — see teacher-scope.ts)
    let studentIds: string[] = []
    if (role === 'teacher') {
      studentIds = await getTeacherStudentGids(session.user.email)
    } else {
      const { data } = await supabaseAdmin.from('students').select('google_user_id')
      studentIds = [...new Set(((data ?? []) as GidRow[]).map((s) => s.google_user_id).filter((g): g is string => Boolean(g)))]
    }

    // classes (teacher: owned; admin: all)
    let cQuery = supabaseAdmin.from('courses').select('*', { count: 'exact', head: true })
    if (role === 'teacher') cQuery = cQuery.eq('teacher_email', session.user.email)
    const { count: classCount } = await cQuery

    let ratingsThisWeek = 0
    let needsGrading = 0
    let aged = 0

    if (studentIds.length > 0) {
      // ratings logged for your students in the last 7 days
      const weekAgo = new Date(Date.now() - WEEK).toISOString()
      const { count } = await supabaseAdmin
        .from('mastery_records')
        .select('*', { count: 'exact', head: true })
        .in('user_id', studentIds)
        .gte('observed_at', weekAgo)
      ratingsThisWeek = count ?? 0

      // needs grading: students with block work submitted AFTER their latest rating
      const { data: brData } = await supabaseAdmin
        .from('block_responses')
        .select('user_id, created_at')
        .in('user_id', studentIds)
      const { data: mrData } = await supabaseAdmin
        .from('mastery_records')
        .select('user_id, observed_at')
        .in('user_id', studentIds)

      const lastRated = new Map<string, number>()
      for (const r of (mrData ?? []) as MrRow[]) {
        const t = new Date(r.observed_at).getTime()
        if (t > (lastRated.get(r.user_id) ?? 0)) lastRated.set(r.user_id, t)
      }
      const oldestUngraded = new Map<string, number>()
      for (const b of (brData ?? []) as BrRow[]) {
        const submitted = new Date(b.created_at).getTime()
        if (submitted <= (lastRated.get(b.user_id) ?? 0)) continue // already graded after this
        const cur = oldestUngraded.get(b.user_id)
        if (cur == null || submitted < cur) oldestUngraded.set(b.user_id, submitted)
      }
      needsGrading = oldestUngraded.size
      const now = Date.now()
      for (const [, oldest] of oldestUngraded) if (now - oldest >= AGED) aged++
    }

    return NextResponse.json({
      classes: classCount ?? 0,
      students: studentIds.length,
      needsGrading,
      aged,
      ratingsThisWeek,
    })
  } catch (error) {
    console.error('Error in GET /api/teacher/summary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
