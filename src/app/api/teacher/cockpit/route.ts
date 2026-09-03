import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getTeacherStudentGids } from '@/lib/teacher-scope'
import { loadRotationCalendar } from '@/lib/pacing-server'

// GET /api/teacher/cockpit — everything the Class Cockpit landing needs in one
// call, scoped to the signed-in teacher (admin sees their own classes here too;
// the cockpit is a TEACHING surface, not an admin one).
//
// Shape follows the Teacher Experience Rework design (screen 2a): greeting
// stats, the cross-class worklist, and one card per class.

const TZ = 'America/New_York'
const todayLocal = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())

/** School days elapsed from start (inclusive) to today, skipping weekends and
 *  the rotation calendar's no-school list. Light approximation for the card —
 *  the Pacing page stays the precise source. */
function schoolDaysSince(startStr: string, todayStr: string, noSchool: Set<string>): number {
  let n = 0
  const d = new Date(`${startStr}T12:00:00Z`)
  const end = new Date(`${todayStr}T12:00:00Z`)
  while (d <= end && n < 400) {
    const iso = d.toISOString().slice(0, 10)
    const dow = d.getUTCDay()
    if (dow !== 0 && dow !== 6 && !noSchool.has(iso)) n++
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return Math.max(1, n)
}

export const GET = withAuth(async (_req, ctx) => {
  if (ctx.role !== 'admin' && ctx.role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const email = ctx.scopeEmail
  const today = todayLocal()
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

  const [{ data: courses }, own, cal] = await Promise.all([
    supabaseAdmin.from('courses').select('id, name, section, track, program').eq('teacher_email', email).is('archived_at', null).order('name'),
    getTeacherStudentGids(email),
    loadRotationCalendar().catch(() => ({ no_school_dates: [] as string[] })),
  ])
  const courseIds = (courses ?? []).map((c) => c.id)
  const noSchool = new Set(cal.no_school_dates ?? [])

  // enrollment map (per-class student sets)
  const { data: enrolls } = courseIds.length
    ? await supabaseAdmin.from('course_students').select('course_id, student_id').in('course_id', courseIds).eq('enrollment_state', 'ACTIVE')
    : { data: [] as { course_id: string; student_id: string }[] }
  const studentsByCourse = new Map<string, Set<string>>()
  for (const e of enrolls ?? []) {
    ;(studentsByCourse.get(e.course_id) ?? studentsByCourse.set(e.course_id, new Set()).get(e.course_id)!).add(e.student_id)
  }

  const [pendingRes, redemptRes, chalRes, activityRes, masteryRes, pacingRes, unitsRes, unassignedRes] = await Promise.all([
    // warm-ups waiting for review, per student (the concrete "to rate" queue)
    own.length
      ? supabaseAdmin.from('math_warmup_submissions').select('user_id').eq('status', 'pending').in('user_id', own)
      : Promise.resolve({ data: [] as { user_id: string }[] }),
    // redemptions to fulfil for my students
    own.length
      ? supabaseAdmin.from('reward_redemptions').select('id, user_id, status').in('status', ['pending', 'approved']).in('user_id', own)
      : Promise.resolve({ data: [] as { id: string; user_id: string; status: string }[] }),
    supabaseAdmin.from('xp_challenges').select('id, ends_on, active').eq('teacher_email', email).eq('active', true).lte('starts_on', today).gte('ends_on', today),
    own.length
      ? supabaseAdmin.from('student_activity').select('user_id').gte('created_at', weekAgo).in('user_id', own)
      : Promise.resolve({ data: [] as { user_id: string }[] }),
    supabaseAdmin.from('mastery_records').select('id', { count: 'exact', head: true }).eq('rated_by', email),
    courseIds.length
      ? supabaseAdmin.from('section_pacing').select('course_id, current_unit_id, unit_start_date').in('course_id', courseIds)
      : Promise.resolve({ data: [] as { course_id: string; current_unit_id: string | null; unit_start_date: string | null }[] }),
    supabaseAdmin.from('units').select('id, name, allotted_days'),
    // students with no active enrollment anywhere (admin view only)
    ctx.role === 'admin'
      ? Promise.all([
          supabaseAdmin.from('students').select('id'),
          supabaseAdmin.from('course_students').select('student_id').eq('enrollment_state', 'ACTIVE'),
        ]).then(([all, en]) => {
          const enrolled = new Set(((en.data ?? []) as { student_id: string }[]).map((r) => r.student_id))
          return { data: ((all.data ?? []) as { id: string }[]).filter((s) => !enrolled.has(s.id)).length }
        })
      : Promise.resolve({ data: null }),
  ])

  const pendingByStudent = new Map<string, number>()
  for (const p of (pendingRes.data ?? []) as { user_id: string }[]) {
    pendingByStudent.set(p.user_id, (pendingByStudent.get(p.user_id) ?? 0) + 1)
  }
  const activeSet = new Set(((activityRes.data ?? []) as { user_id: string }[]).map((a) => a.user_id))
  const unitBy = new Map(((unitsRes.data ?? []) as { id: string; name: string; allotted_days: number | null }[]).map((u) => [u.id, u]))
  const pacingBy = new Map(((pacingRes.data ?? []) as { course_id: string; current_unit_id: string | null; unit_start_date: string | null }[]).map((p) => [p.course_id, p]))
  const redemptions = (redemptRes.data ?? []) as { id: string; user_id: string; status: string }[]

  const classCards = (courses ?? []).map((c) => {
    const kids = studentsByCourse.get(c.id) ?? new Set<string>()
    let toRate = 0
    for (const k of kids) toRate += pendingByStudent.get(k) ?? 0
    const redForClass = redemptions.filter((r) => kids.has(r.user_id)).length
    const pace = pacingBy.get(c.id)
    const unit = pace?.current_unit_id ? unitBy.get(pace.current_unit_id) : null
    const dayM = unit?.allotted_days ?? null
    const dayN = pace?.unit_start_date && dayM ? Math.min(schoolDaysSince(pace.unit_start_date, today, noSchool), dayM + 9) : null
    return {
      id: c.id,
      label: [c.name, c.section].filter(Boolean).join(' · '),
      track: c.track ?? null,
      program: c.program ?? null,
      students: kids.size,
      toRate,
      redemptions: redForClass,
      unitName: unit?.name ?? null,
      dayN, dayM,
      onPace: dayN !== null && dayM !== null ? dayN <= dayM : null,
    }
  })

  const challenges = (chalRes.data ?? []) as { id: string; ends_on: string }[]
  return NextResponse.json({
    today,
    stats: {
      students: own.length,
      activeThisWeek: activeSet.size,
      masteryRatings: masteryRes.count ?? 0,
    },
    worklist: {
      toRate: [...pendingByStudent.values()].reduce((a, b) => a + b, 0),
      rewardsToFulfil: redemptions.length,
      challengesEndingToday: challenges.filter((c) => c.ends_on === today).length,
      challengesLive: challenges.length,
      unenrolledStudents: (unassignedRes.data as number | null) ?? null,
    },
    classes: classCards,
  })
})
