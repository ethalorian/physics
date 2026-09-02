import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/challenges — the signed-in student's ACTIVE challenges for today:
// definition, live progress since local midnight, and the bonus state. The
// daily target resets each day of the challenge's range; hitting it awards the
// bonus once per day (economy grant deduped by challenge:id:user:date).

const TZ = 'America/New_York'

function localToday(): { dateStr: string; startIso: string } {
  const now = new Date()
  const fmt = (t: number) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(t))
  const dateStr = fmt(now.getTime())
  let probe = now.getTime()
  while (fmt(probe - 15 * 60000) === dateStr) probe -= 15 * 60000
  while (fmt(probe - 60000) === dateStr) probe -= 60000
  return { dateStr, startIso: new Date(probe).toISOString() }
}

interface Challenge {
  id: string; title: string; kind: string; game_slug: string | null
  metric: string; target: number; bonus_xp: number
}

export const GET = withAuth(async (_req, ctx) => {
  const uid = ctx.userId
  const { dateStr, startIso } = localToday()

  // Which challenges apply to me: my active enrollments' courses + direct picks.
  const { data: enrolls } = await supabaseAdmin
    .from('course_students').select('course_id').eq('student_id', uid).eq('enrollment_state', 'active')
  const courseIds = (enrolls ?? []).map((e) => e.course_id)

  const orParts = [`student_id.eq.${uid}`]
  if (courseIds.length > 0) orParts.push(`course_id.in.(${courseIds.join(',')})`)
  const { data: assigns } = await supabaseAdmin
    .from('xp_challenge_assignments').select('challenge_id').or(orParts.join(','))
  const chIds = [...new Set((assigns ?? []).map((a) => a.challenge_id))]

  // Assigned challenges + admin GLOBAL challenges (those apply to everyone).
  let q = supabaseAdmin
    .from('xp_challenges')
    .select('id, title, kind, game_slug, metric, target, bonus_xp')
    .eq('active', true)
    .lte('starts_on', dateStr).gte('ends_on', dateStr)
  q = chIds.length > 0 ? q.or(`is_global.eq.true,id.in.(${chIds.join(',')})`) : q.eq('is_global', true)
  const { data: chRows } = await q
  const challenges = (chRows ?? []) as Challenge[]
  if (challenges.length === 0) return NextResponse.json({ challenges: [] })

  // ---- today's raw activity, fetched once and sliced per challenge ----------
  const [{ data: arcadeGrants }, { data: plays }, { data: vocab }, { data: mathGrants }] = await Promise.all([
    supabaseAdmin.from('economy_point_grants').select('points, reference').eq('user_id', uid).eq('source', 'arcade-payout').gte('awarded_at', startIso),
    supabaseAdmin.from('arcade_plays').select('game_slug').eq('user_id', uid).gte('created_at', startIso),
    supabaseAdmin.from('vocabulary_game_scores').select('score').eq('user_id', uid).gte('completed_at', startIso),
    supabaseAdmin.from('math_spine_point_grants').select('points').eq('user_id', uid).gte('awarded_at', startIso),
  ])

  const progressFor = (c: Challenge): number => {
    if (c.kind === 'arcade-any' || c.kind === 'arcade-game') {
      const slug = c.kind === 'arcade-game' ? c.game_slug : null
      if (c.metric === 'plays') {
        return (plays ?? []).filter((p) => !slug || p.game_slug === slug).length
      }
      return Math.round((arcadeGrants ?? []).filter((g) => !slug || g.reference === slug).reduce((a, g) => a + (g.points ?? 0), 0))
    }
    if (c.kind === 'vocab-games') {
      if (c.metric === 'plays') return (vocab ?? []).length
      // mirrors the leaderboard formula's per-play cap
      return (vocab ?? []).reduce((a, v) => a + Math.min(25, Math.round((v.score ?? 0) / 10)), 0)
    }
    // math: XP earned in the math spine today (metric is always 'xp' here)
    return Math.round((mathGrants ?? []).reduce((a, g) => a + (g.points ?? 0), 0))
  }

  // Existing bonuses for today (so progress can exclude them and UI shows state).
  const keys = challenges.map((c) => `challenge:${c.id}:${uid}:${dateStr}`)
  const { data: paid } = await supabaseAdmin
    .from('economy_point_grants').select('dedupe_key').in('dedupe_key', keys)
  const paidSet = new Set((paid ?? []).map((p) => p.dedupe_key))

  const out = []
  for (const c of challenges) {
    const progress = progressFor(c)
    let bonusAwarded = paidSet.has(`challenge:${c.id}:${uid}:${dateStr}`)
    if (!bonusAwarded && c.bonus_xp > 0 && progress >= c.target) {
      const { error } = await supabaseAdmin.from('economy_point_grants').insert({
        user_id: uid,
        user_email: ctx.email,
        source: 'challenge-bonus',
        points: c.bonus_xp,
        reference: c.id,
        note: `Challenge hit — ${c.title}`,
        dedupe_key: `challenge:${c.id}:${uid}:${dateStr}`,
      })
      if (!error || error.code === '23505') bonusAwarded = true
    }
    out.push({
      id: c.id, title: c.title, kind: c.kind, gameSlug: c.game_slug,
      metric: c.metric, target: c.target, bonusXp: c.bonus_xp,
      progress, done: progress >= c.target, bonusAwarded,
    })
  }
  return NextResponse.json({ challenges: out })
})
