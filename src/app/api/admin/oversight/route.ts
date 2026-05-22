import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'

// GET /api/admin/oversight
// Owner's-eye view: pulse, colleague adoption, student engagement, feature
// adoption. Every query is wrapped so a missing/empty table degrades gracefully
// rather than 500-ing the whole dashboard.

const DAY = 24 * 60 * 60 * 1000

// NOTE: students has no teacher_email column; teacher↔student attribution does not
// exist in the schema yet. Until it does, colleague-adoption rows stay empty and
// the pulse/engagement/feature panels (which don't need attribution) carry the view.
type StudentRow = { google_user_id: string | null; name: string | null; email: string | null; teacher_email?: string | null }
type ActivityRow = { user_id: string | null; created_at: string }
type MasteryRow = { user_id: string | null; observed_at: string }
type AssignmentRow = { created_by: string | null; created_at: string | null }

function dayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const role = getUserRole(session.user.email)
    if (role !== 'admin' && role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const now = Date.now()

    // --- students (roster, with teacher attribution) -----------------------
    let students: StudentRow[] = []
    try {
      const { data } = await supabaseAdmin.from('students').select('google_user_id, name, email')
      students = (data ?? []) as StudentRow[]
    } catch { students = [] }
    const studentIds = students.map((s) => s.google_user_id).filter((x): x is string => !!x)
    const teacherByStudent = new Map<string, string>()
    for (const s of students) if (s.google_user_id && s.teacher_email) teacherByStudent.set(s.google_user_id, s.teacher_email)

    // --- activity (last 30 days) -------------------------------------------
    let activity: ActivityRow[] = []
    try {
      const { data } = await supabaseAdmin
        .from('student_activity')
        .select('user_id, created_at')
        .gte('created_at', new Date(now - 30 * DAY).toISOString())
        .limit(20000)
      activity = (data ?? []) as ActivityRow[]
    } catch { activity = [] }

    const lastActiveByUser = new Map<string, number>()
    for (const a of activity) {
      if (!a.user_id) continue
      const t = new Date(a.created_at).getTime()
      const prev = lastActiveByUser.get(a.user_id) ?? 0
      if (t > prev) lastActiveByUser.set(a.user_id, t)
    }

    // logins trend: distinct active users per day, last 10 days (oldest -> newest)
    const trendDays: string[] = []
    for (let i = 9; i >= 0; i--) trendDays.push(dayKey(now - i * DAY))
    const usersPerDay = new Map<string, Set<string>>(trendDays.map((d): [string, Set<string>] => [d, new Set<string>()]))
    for (const a of activity) {
      if (!a.user_id) continue
      const d = dayKey(new Date(a.created_at).getTime())
      usersPerDay.get(d)?.add(a.user_id)
    }
    const loginsTrend = trendDays.map((d) => usersPerDay.get(d)?.size ?? 0)

    // --- mastery records (count + per-teacher attribution) -----------------
    let mastery: MasteryRow[] = []
    try {
      const { data } = await supabaseAdmin.from('mastery_records').select('user_id, observed_at').limit(50000)
      mastery = (data ?? []) as MasteryRow[]
    } catch { mastery = [] }

    // --- assignments (per-teacher) -----------------------------------------
    let assignments: AssignmentRow[] = []
    try {
      const { data } = await supabaseAdmin.from('assignments').select('created_by, created_at').limit(10000)
      assignments = (data ?? []) as AssignmentRow[]
    } catch { assignments = [] }

    // --- per-teacher rollup ------------------------------------------------
    interface TeacherAgg { email: string; students: number; masteryRatings: number; assignments: number; lastActiveAt: number }
    const teachers = new Map<string, TeacherAgg>()
    const ensure = (email: string): TeacherAgg => {
      let t = teachers.get(email)
      if (!t) { t = { email, students: 0, masteryRatings: 0, assignments: 0, lastActiveAt: 0 }; teachers.set(email, t) }
      return t
    }
    for (const s of students) if (s.teacher_email) ensure(s.teacher_email).students++
    for (const m of mastery) {
      const te = m.user_id ? teacherByStudent.get(m.user_id) : undefined
      if (!te) continue
      const t = ensure(te)
      t.masteryRatings++
      const ts = new Date(m.observed_at).getTime()
      if (ts > t.lastActiveAt) t.lastActiveAt = ts
    }
    for (const a of assignments) {
      if (!a.created_by) continue
      const t = ensure(a.created_by)
      t.assignments++
      const ts = a.created_at ? new Date(a.created_at).getTime() : 0
      if (ts > t.lastActiveAt) t.lastActiveAt = ts
    }
    const teacherList = Array.from(teachers.values())
      .map((t) => ({
        email: t.email,
        students: t.students,
        masteryRatings: t.masteryRatings,
        assignments: t.assignments,
        lastActiveAt: t.lastActiveAt ? new Date(t.lastActiveAt).toISOString() : null,
        status:
          t.lastActiveAt && now - t.lastActiveAt < 7 * DAY ? 'active'
          : t.lastActiveAt && now - t.lastActiveAt < 30 * DAY ? 'ramping'
          : (t.masteryRatings > 0 || t.assignments > 0) ? 'ramping'
          : 'dormant',
      }))
      .sort((a, b) => b.students - a.students)

    // --- student engagement ------------------------------------------------
    let active7d = 0, idle = 0, atRisk = 0
    for (const id of studentIds) {
      const last = lastActiveByUser.get(id)
      if (last && now - last < 7 * DAY) active7d++
      else if (last && now - last < 30 * DAY) idle++
      else atRisk++
    }

    // --- feature adoption (defensive counts) -------------------------------
    const countAll = async (table: string): Promise<number> => {
      try {
        const { count: c } = await supabaseAdmin.from(table).select('*', { count: 'exact', head: true })
        return c ?? 0
      } catch { return 0 }
    }
    const [lessonsCount, gamesCount, rewardsCount] = await Promise.all([
      countAll('lesson_progress'),
      countAll('vocabulary_game_scores'),
      countAll('reward_redemptions'),
    ])
    const features = [
      { key: 'lessons', label: 'Lessons engaged', count: lessonsCount },
      { key: 'mastery', label: 'Mastery ratings', count: mastery.length },
      { key: 'games', label: 'Vocabulary games', count: gamesCount },
      { key: 'rewards', label: 'Rewards redeemed', count: rewardsCount },
    ]

    // --- published lessons + pending rewards (pulse extras) ----------------
    let publishedLessons = 0
    try {
      const { count: c } = await supabaseAdmin.from('lessons').select('*', { count: 'exact', head: true }).eq('published', true)
      publishedLessons = c ?? 0
    } catch { publishedLessons = 0 }
    let pendingRewards = 0
    try {
      const { count: c } = await supabaseAdmin.from('reward_redemptions').select('*', { count: 'exact', head: true }).in('status', ['pending', 'approved'])
      pendingRewards = c ?? 0
    } catch { pendingRewards = 0 }

    return NextResponse.json({
      pulse: {
        students: students.length,
        colleagues: teacherList.length,
        activeStudents7d: active7d,
        masteryRatings: mastery.length,
        publishedLessons,
        pendingRewards,
        loginsTrend,
      },
      teachers: teacherList,
      engagement: { active7d, idle, atRisk, total: studentIds.length },
      features,
      you: session.user.email,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/oversight:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
