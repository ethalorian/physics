import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/xp-goal — the signed-in student's daily XP goal status.
// The goal is set by THEIR TEACHER (per-teacher config, never global):
// student → active course_students row → courses.teacher_email → teacher_xp_goals.
// Day kinds: school (progress ring only), weekend/special (hit the goal →
// one-time bonus XP, deduped by economy_point_grants.dedupe_key).

const TZ = 'America/New_York'

function localToday(): { dateStr: string; dayOfWeek: number; startIso: string } {
  const now = new Date()
  const fmt = (t: number) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(t))
  const dateStr = fmt(now.getTime()) // YYYY-MM-DD in the school's timezone
  const dayOfWeek = new Date(`${dateStr}T12:00:00Z`).getUTCDay() // stable midday probe
  // Find local midnight as a UTC instant: walk back until the local date flips.
  let probe = now.getTime()
  while (fmt(probe - 15 * 60000) === dateStr) probe -= 15 * 60000
  while (fmt(probe - 60000) === dateStr) probe -= 60000
  return { dateStr, dayOfWeek, startIso: new Date(probe).toISOString() }
}

export const GET = withAuth(async (_req, ctx) => {
  const uid = ctx.userId
  const { dateStr, dayOfWeek, startIso } = localToday()

  // Resolve the student's teacher of record (first active enrollment).
  const { data: enroll } = await supabaseAdmin
    .from('course_students')
    .select('course:courses(teacher_email)')
    .eq('student_id', uid)
    .eq('enrollment_state', 'ACTIVE')
    .limit(1)
    .maybeSingle()
  // PostgREST types the embed as object-or-array depending on FK inference.
  const courseRaw = enroll?.course as unknown
  const courseObj = Array.isArray(courseRaw) ? courseRaw[0] : courseRaw
  const teacherEmail = (courseObj as { teacher_email: string | null } | undefined)?.teacher_email
  if (!teacherEmail) return NextResponse.json({ configured: false })

  const { data: goals } = await supabaseAdmin
    .from('teacher_xp_goals')
    .select('school_day_goal, special_day_goal, special_day_bonus')
    .eq('teacher_email', teacherEmail)
    .maybeSingle()
  if (!goals) return NextResponse.json({ configured: false })

  // Day kind: teacher-entered ranges win, then weekends, else school day.
  const { data: special } = await supabaseAdmin
    .from('teacher_special_days')
    .select('label')
    .eq('teacher_email', teacherEmail)
    .lte('start_date', dateStr)
    .gte('end_date', dateStr)
    .limit(1)
    .maybeSingle()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const kind: 'school' | 'weekend' | 'special' = special ? 'special' : isWeekend ? 'weekend' : 'school'
  const goal = kind === 'school' ? goals.school_day_goal : goals.special_day_goal
  const bonus = kind === 'school' ? 0 : goals.special_day_bonus

  // XP earned since local midnight (same formula as the leaderboard).
  const { data: agg } = await supabaseAdmin.rpc('get_leaderboard', { p_since: startIso, p_limit: 500 })
  const mine = ((agg ?? []) as { user_id: string; total_points: number }[]).find((r) => r.user_id === uid)
  // Exclude any goal bonus itself from progress, so the bonus can't self-fulfil.
  const { data: todayBonus } = await supabaseAdmin
    .from('economy_point_grants')
    .select('points')
    .eq('dedupe_key', `goal-bonus:${uid}:${dateStr}`)
    .maybeSingle()
  const earned = Math.max(0, Math.round(Number(mine?.total_points ?? 0)) - (todayBonus?.points ?? 0))

  // Special-day payoff: award once, deduped by key (unique index).
  let bonusAwarded = !!todayBonus
  if (!bonusAwarded && bonus > 0 && goal > 0 && earned >= goal) {
    const { error } = await supabaseAdmin.from('economy_point_grants').insert({
      user_id: uid,
      user_email: ctx.scopeEmail ?? null,
      source: 'goal-bonus',
      points: bonus,
      note: `${special?.label ?? 'Weekend'} XP goal hit (${goal} XP)`,
      dedupe_key: `goal-bonus:${uid}:${dateStr}`,
    })
    if (!error) bonusAwarded = true // unique-violation on a race = already awarded
    else if (error.code === '23505') bonusAwarded = true
  }

  return NextResponse.json({
    configured: true,
    date: dateStr,
    kind,
    label: special?.label ?? (isWeekend ? 'Weekend' : 'School day'),
    goal,
    earned,
    bonus,
    bonusAwarded,
  })
})
