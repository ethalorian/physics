import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { resolveTargetStudent } from '@/lib/teacher-scope'
import { decayingAverage } from '@/data/curriculum-types'

// GET /api/math-spine/student-warmups?user_id=<gid>[&competency_id=<id>]
// Feeds the math review drawer: the student's submitted warm-up answers (pending
// first, then recent) — optionally scoped to one competency — plus their current
// rolled-up value and rating history for context. Teacher/admin only (roster-scoped).
export const GET = withAuth(async (request, ctx) => {
  const { searchParams } = new URL(request.url)
  const requestedUserId = searchParams.get('user_id')
  const competencyId = searchParams.get('competency_id')

  const resolved = await resolveTargetStudent({
    role: ctx.role,
    selfId: ctx.userId,
    scopeEmail: ctx.email,
    requestedUserId,
  })
  if (!resolved.ok) return NextResponse.json({ error: 'Forbidden - student not in your roster' }, { status: 403 })
  const userId = resolved.userId

  // Submissions (pending first, newest first), optionally scoped to one competency.
  let subQuery = supabaseAdmin
    .from('math_warmup_submissions')
    .select('id, competency_id, prompt, response, status, resulting_level, submitted_at, reviewed_at, tested_competency_ids, rated_competency_ids')
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false })
    .limit(20)
  if (competencyId) subQuery = subQuery.eq('competency_id', competencyId)
  const { data: subs } = await subQuery
  const submissions = (subs ?? []).sort((a, b) => {
    if (a.status !== b.status) return a.status === 'pending' ? -1 : 1
    return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
  })

  // Current value + rating history for the scoped competency (context for the rater).
  let currentValue: number | null = null
  let history: { level: number; observed_at: string; evidence_source: string | null }[] = []
  if (competencyId) {
    const { data: recs } = await supabaseAdmin
      .from('math_competency_records')
      .select('level, observed_at, evidence_source')
      .eq('user_id', userId)
      .eq('competency_id', competencyId)
      .order('observed_at', { ascending: true })
    history = recs ?? []
    if (history.length) currentValue = decayingAverage(history.map((r) => r.level))
  }

  return NextResponse.json({ userId, competencyId, submissions, currentValue, history })
})
