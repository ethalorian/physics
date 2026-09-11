import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { bountyRows } from '@/lib/xp-bounty-data'
import { bountyToday, bountyWindow } from '@/lib/xp-bounty-period'
import { bountyPlayHref } from '@/lib/xp-bounty-catalog'
import { bountyProgress } from '@/lib/xp-bounty-progress'

export const GET = withAuth(async (_req, ctx) => {
  // Staff previews must never receive student bonus grants.
  if (ctx.role !== 'student' || ctx.realRole === 'admin') return NextResponse.json({ challenges: [] })
  const uid = ctx.userId
  const now = new Date()
  const today = bountyToday(now)
  const enrollments = await bountyRows((from, to) => supabaseAdmin.from('course_students')
    .select('course_id').eq('student_id', uid).eq('enrollment_state', 'ACTIVE').order('course_id').range(from, to))
  const courseIds = enrollments.map(e => e.course_id)
  if (!courseIds.length) return NextResponse.json({ challenges: [] })
  const courses = await bountyRows((from, to) => supabaseAdmin.from('courses').select('id, teacher_email')
    .in('id', courseIds).order('id').range(from, to))
  const owners = [...new Set(courses.map(c => c.teacher_email).filter(Boolean))]
  if (!owners.length) return NextResponse.json({ challenges: [] })
  const candidates = await bountyRows((from, to) => supabaseAdmin.from('xp_challenges')
    .select('id, teacher_email, title, kind, game_slug, metric, target, bonus_xp, period, starts_on, ends_on, is_global')
    .in('teacher_email', owners).eq('active', true).lte('starts_on', today).gte('ends_on', today).order('id').range(from, to))
  if (!candidates.length) return NextResponse.json({ challenges: [] })
  const assigns = await bountyRows((from, to) => supabaseAdmin.from('xp_challenge_assignments')
    .select('id, challenge_id, student_id, course_id').in('challenge_id', candidates.map(c => c.id)).order('id').range(from, to))
  // Legacy global definitions now apply only to that teacher's active roster.
  const challenges = candidates.filter(c => c.is_global || assigns.some(a => a.challenge_id === c.id
    && (a.student_id === uid || courses.some(course => course.id === a.course_id && course.teacher_email === c.teacher_email))))
  if (!challenges.length) return NextResponse.json({ challenges: [] })
  const windows = new Map(challenges.map(c => [c.id, bountyWindow(c, today)]))
  const startIso = [...windows.values()].map(w => w.startIso).sort()[0]
  const until = now.toISOString()
  const [arcade, plays, vocab, math] = await Promise.all([
    bountyRows((from, to) => supabaseAdmin.from('economy_point_grants').select('id, points, reference, awarded_at')
      .eq('user_id', uid).eq('source', 'arcade-payout').gte('awarded_at', startIso).lte('awarded_at', until).order('id').range(from, to)),
    bountyRows((from, to) => supabaseAdmin.from('arcade_plays').select('id, game_slug, finished_at, meta')
      .eq('user_id', uid).eq('status', 'finished').gte('finished_at', startIso).lte('finished_at', until).order('id').range(from, to)),
    bountyRows((from, to) => supabaseAdmin.from('vocabulary_game_scores').select('id, score, game_type, completed_at')
      .eq('user_id', uid).gte('completed_at', startIso).lte('completed_at', until).order('id').range(from, to)),
    bountyRows((from, to) => supabaseAdmin.from('math_spine_point_grants').select('id, points, awarded_at')
      .eq('user_id', uid).gte('awarded_at', startIso).lte('awarded_at', until).order('id').range(from, to)),
  ])
  const keyFor = (id: string) => `challenge:${id}:${uid}:${windows.get(id)!.key}`
  const paid = await bountyRows((from, to) => supabaseAdmin.from('economy_point_grants').select('id, dedupe_key')
    .in('dedupe_key', challenges.map(c => keyFor(c.id))).order('id').range(from, to))
  const paidSet = new Set(paid.map(p => p.dedupe_key))
  const out = []
  for (const c of challenges) {
    const window = windows.get(c.id)!
    const progress = bountyProgress(c, window, { arcade, plays, vocab, math })
    let bonusAwarded = paidSet.has(keyFor(c.id))
    if (!bonusAwarded && c.bonus_xp > 0 && progress >= c.target) {
      const { error } = await supabaseAdmin.from('economy_point_grants').insert({
        user_id: uid, user_email: ctx.email, source: 'challenge-bonus', points: c.bonus_xp,
        reference: c.id, note: `Bounty earned — ${c.title}`, dedupe_key: keyFor(c.id),
      })
      if (error && error.code !== '23505') throw error
      bonusAwarded = true
    }
    out.push({ id: c.id, title: c.title, kind: c.kind, gameSlug: c.game_slug,
      metric: c.metric, target: c.target, bonusXp: c.bonus_xp, period: c.period, window,
      progress, done: progress >= c.target, bonusAwarded, playHref: bountyPlayHref(c.kind, c.game_slug),
    })
  }
  return NextResponse.json({ challenges: out })
})
