import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getStaffPresence } from '@/lib/presence'

const ACTIVE_WINDOW = 3 * 60 * 1000 // "active now" = seen in the last 3 minutes

// GET /api/admin/oversight
// Owner's-eye view: pulse, TEACHER ENGAGEMENT (what each teacher is doing and how
// they use the app), student engagement, and what teacher tools are most used.
// Every query is wrapped so a missing/empty table degrades gracefully.

const DAY = 24 * 60 * 60 * 1000
const dayKey = (ms: number) => new Date(ms).toISOString().slice(0, 10)
const t = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() : 0)

export const GET = withRole('admin', async (_request, ctx) => {
    const now = Date.now()
    const safe = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => { try { return await fn() } catch { return fallback } }

    // ---- roster + teacher↔student attribution (courses → enrollments) --------
    const courses = await safe(async () => (await supabaseAdmin.from('courses').select('id, teacher_email')).data ?? [], [] as { id: string; teacher_email: string | null }[])
    const teacherByCourse = new Map<string, string>()
    const courseIdsByTeacher = new Map<string, Set<string>>()
    for (const c of courses) if (c.teacher_email) { teacherByCourse.set(c.id, c.teacher_email); (courseIdsByTeacher.get(c.teacher_email) ?? courseIdsByTeacher.set(c.teacher_email, new Set()).get(c.teacher_email)!).add(c.id) }

    const enrollments = await safe(async () => (await supabaseAdmin.from('course_students').select('course_id, student_id')).data ?? [], [] as { course_id: string; student_id: string }[])
    const studentsByTeacher = new Map<string, Set<string>>()   // teacher → distinct student uuids
    const teachersByStudentUuid = new Map<string, Set<string>>()
    for (const e of enrollments) {
      const te = teacherByCourse.get(e.course_id)
      if (!te) continue
      ;(studentsByTeacher.get(te) ?? studentsByTeacher.set(te, new Set()).get(te)!).add(e.student_id)
      ;(teachersByStudentUuid.get(e.student_id) ?? teachersByStudentUuid.set(e.student_id, new Set()).get(e.student_id)!).add(te)
    }

    const students = await safe(async () => (await supabaseAdmin.from('students').select('id, google_user_id')).data ?? [], [] as { id: string; google_user_id: string | null }[])
    const teachersByGid = new Map<string, Set<string>>()       // student gid → their teacher emails (mastery attribution)
    const studentIds: string[] = []
    for (const s of students) {
      if (s.google_user_id) studentIds.push(s.google_user_id)
      const tes = teachersByStudentUuid.get(s.id)
      if (s.google_user_id && tes) teachersByGid.set(s.google_user_id, tes)
    }

    // ---- per-teacher aggregate ----------------------------------------------
    interface Agg { email: string; role: string; classes: number; students: number; lessonsGraded: number; masteryRatings: number; rewardsFulfilled: number; assignments: number; mathReviews: number; storeItems: number; lastActiveAt: number }
    const agg = new Map<string, Agg>()
    const ensure = (email: string): Agg => {
      let a = agg.get(email)
      if (!a) { a = { email, role: 'teacher', classes: 0, students: 0, lessonsGraded: 0, masteryRatings: 0, rewardsFulfilled: 0, assignments: 0, mathReviews: 0, storeItems: 0, lastActiveAt: 0 }; agg.set(email, a) }
      return a
    }
    const bump = (email: string | null | undefined, key: keyof Agg, ts?: number) => {
      if (!email) return
      const a = ensure(email)
      ;(a[key] as number)++
      if (ts && ts > a.lastActiveAt) a.lastActiveAt = ts
    }

    // seed every known teacher: course owners + DB role grants (so a freshly
    // onboarded teacher appears even before they do anything).
    for (const email of courseIdsByTeacher.keys()) { const a = ensure(email); a.classes = courseIdsByTeacher.get(email)!.size; a.students = studentsByTeacher.get(email)?.size ?? 0 }
    const grants = await safe(async () => (await supabaseAdmin.from('user_roles').select('email, role')).data ?? [], [] as { email: string; role: string }[])
    for (const g of grants) { const a = ensure(g.email); if (g.role) a.role = g.role }

    // lessons graded (gradebook entries are keyed by the graded STUDENT, not course
    // — the control room leaves course_id null — so attribute via the roster)
    const gb = await safe(async () => (await supabaseAdmin.from('gradebook_entries').select('user_id, graded_at, status').eq('status', 'graded').limit(50000)).data ?? [], [] as { user_id: string | null; graded_at: string | null; status: string | null }[])
    for (const r of gb) { const tes = r.user_id ? teachersByGid.get(r.user_id) : undefined; if (!tes) continue; for (const te of tes) bump(te, 'lessonsGraded', t(r.graded_at)) }

    // mastery ratings (attributed to the rated student's teacher(s))
    const mastery = await safe(async () => (await supabaseAdmin.from('mastery_records').select('user_id, observed_at').limit(50000)).data ?? [], [] as { user_id: string | null; observed_at: string | null }[])
    for (const m of mastery) { const tes = m.user_id ? teachersByGid.get(m.user_id) : undefined; if (!tes) continue; for (const te of tes) bump(te, 'masteryRatings', t(m.observed_at)) }

    // rewards fulfilled
    const fulfilled = await safe(async () => (await supabaseAdmin.from('reward_redemptions').select('fulfilled_by, fulfilled_at').eq('status', 'fulfilled').limit(50000)).data ?? [], [] as { fulfilled_by: string | null; fulfilled_at: string | null }[])
    for (const r of fulfilled) bump(r.fulfilled_by, 'rewardsFulfilled', t(r.fulfilled_at))

    // assignments created
    const ua = await safe(async () => (await supabaseAdmin.from('unified_assignments').select('assigned_by, created_at').limit(50000)).data ?? [], [] as { assigned_by: string | null; created_at: string | null }[])
    for (const r of ua) bump(r.assigned_by, 'assignments', t(r.created_at))

    // math reviews + spotlights
    const warm = await safe(async () => (await supabaseAdmin.from('math_warmup_submissions').select('reviewed_by, reviewed_at').not('reviewed_by', 'is', null).limit(50000)).data ?? [], [] as { reviewed_by: string | null; reviewed_at: string | null }[])
    for (const r of warm) bump(r.reviewed_by, 'mathReviews', t(r.reviewed_at))
    const spot = await safe(async () => (await supabaseAdmin.from('math_spine_point_grants').select('awarded_by, awarded_at').not('awarded_by', 'is', null).limit(50000)).data ?? [], [] as { awarded_by: string | null; awarded_at: string | null }[])
    for (const r of spot) bump(r.awarded_by, 'mathReviews', t(r.awarded_at))

    // store building (own rewards created + placements)
    const ownRewards = await safe(async () => (await supabaseAdmin.from('rewards').select('owner_email, updated_at').not('owner_email', 'is', null).limit(50000)).data ?? [], [] as { owner_email: string | null; updated_at: string | null }[])
    for (const r of ownRewards) bump(r.owner_email, 'storeItems', t(r.updated_at))
    const placements = await safe(async () => (await supabaseAdmin.from('store_reward_placements').select('added_by, added_at').limit(50000)).data ?? [], [] as { added_by: string | null; added_at: string | null }[])
    for (const r of placements) bump(r.added_by, 'storeItems', t(r.added_at))

    // presence (last login + live "active now")
    const presenceRows = await safe(() => getStaffPresence(), [] as Awaited<ReturnType<typeof getStaffPresence>>)
    const presenceByEmail = new Map<string, { last_login: string | null; last_seen: string | null }>()
    for (const p of presenceRows) presenceByEmail.set(p.email.toLowerCase(), { last_login: p.last_login, last_seen: p.last_seen })

    const teacherEngagement = Array.from(agg.values())
      .map((a) => {
        const pres = presenceByEmail.get(a.email.toLowerCase())
        const lastSeen = t(pres?.last_seen)
        return {
          ...a,
          lastActiveAt: a.lastActiveAt ? new Date(a.lastActiveAt).toISOString() : null,
          lastLoginAt: pres?.last_login ?? null,
          activeNow: !!lastSeen && now - lastSeen < ACTIVE_WINDOW,
          actions: a.lessonsGraded + a.masteryRatings + a.rewardsFulfilled + a.assignments + a.mathReviews + a.storeItems,
          status: a.lastActiveAt && now - a.lastActiveAt < 7 * DAY ? 'active'
            : a.lastActiveAt && now - a.lastActiveAt < 30 * DAY ? 'ramping'
            : 'dormant',
        }
      })
      .sort((x, y) => Number(y.activeNow) - Number(x.activeNow) || y.actions - x.actions || y.students - x.students)

    // ---- "what teachers use most" — raw totals (no double-count) -------------
    const teacherTools = [
      { key: 'graded', label: 'Lessons graded', count: gb.length },
      { key: 'mastery', label: 'Mastery ratings', count: mastery.length },
      { key: 'assignments', label: 'Assignments created', count: ua.length },
      { key: 'rewards', label: 'Rewards fulfilled', count: fulfilled.length },
      { key: 'math', label: 'Math reviews', count: warm.length + spot.length },
      { key: 'store', label: 'Store items placed', count: ownRewards.length + placements.length },
    ].sort((a, b) => b.count - a.count)

    // ---- student activity / engagement (unchanged) --------------------------
    const activity = await safe(async () => (await supabaseAdmin.from('student_activity').select('user_id, created_at').gte('created_at', new Date(now - 30 * DAY).toISOString()).limit(20000)).data ?? [], [] as { user_id: string | null; created_at: string }[])
    const lastActiveByUser = new Map<string, number>()
    for (const a of activity) { if (!a.user_id) continue; const ts = t(a.created_at); if (ts > (lastActiveByUser.get(a.user_id) ?? 0)) lastActiveByUser.set(a.user_id, ts) }
    const trendDays: string[] = []
    for (let i = 9; i >= 0; i--) trendDays.push(dayKey(now - i * DAY))
    const usersPerDay = new Map<string, Set<string>>(trendDays.map((d): [string, Set<string>] => [d, new Set()]))
    for (const a of activity) { if (!a.user_id) continue; usersPerDay.get(dayKey(t(a.created_at)))?.add(a.user_id) }
    const loginsTrend = trendDays.map((d) => usersPerDay.get(d)?.size ?? 0)

    let active7d = 0, idle = 0, atRisk = 0
    for (const id of studentIds) { const last = lastActiveByUser.get(id); if (last && now - last < 7 * DAY) active7d++; else if (last && now - last < 30 * DAY) idle++; else atRisk++ }

    // ---- student-side feature adoption + pulse extras -----------------------
    const countAll = (table: string): Promise<number> =>
      safe(async () => { const { count } = await supabaseAdmin.from(table).select('*', { count: 'exact', head: true }); return count ?? 0 }, 0)
    const [lessonsCount, gamesCount, rewardsCount, publishedLessons, pendingRewards] = await Promise.all([
      countAll('lesson_progress'),
      countAll('vocabulary_game_scores'),
      countAll('reward_redemptions'),
      safe(async () => { const { count } = await supabaseAdmin.from('lessons').select('*', { count: 'exact', head: true }).eq('published', true); return count ?? 0 }, 0),
      safe(async () => { const { count } = await supabaseAdmin.from('reward_redemptions').select('*', { count: 'exact', head: true }).in('status', ['pending', 'approved']); return count ?? 0 }, 0),
    ])
    const features = [
      { key: 'lessons', label: 'Lessons engaged', count: lessonsCount },
      { key: 'mastery', label: 'Mastery ratings', count: mastery.length },
      { key: 'games', label: 'Vocabulary games', count: gamesCount },
      { key: 'rewards', label: 'Rewards redeemed', count: rewardsCount },
    ]

    return NextResponse.json({
      pulse: {
        students: students.length,
        colleagues: teacherEngagement.length,
        activeStudents7d: active7d,
        masteryRatings: mastery.length,
        publishedLessons,
        pendingRewards,
        loginsTrend,
      },
      teacherEngagement,
      teacherTools,
      engagement: { active7d, idle, atRisk, total: studentIds.length },
      features,
      you: ctx.email,
    })
})
