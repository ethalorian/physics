import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAuth } from '@/lib/api-auth'
import { resolveTargetStudent } from '@/lib/teacher-scope'
import { decayingAverage } from '@/data/curriculum-types'
import { FLUENT_THRESHOLD } from '@/lib/math-spine'

// GET /api/math-spine/daily[?user_id=...]
// The daily-dashboard "to-do": one warm-up problem, chosen for the competency the
// student most needs (lowest whole-year value), drawn from the spiral bank. Also
// returns a small snapshot (points earned, # Fluent) so the card can frame it.
// Deterministic per day, so it doesn't reshuffle on every reload.
export const GET = withAuth(async (request, ctx) => {
  const { searchParams } = new URL(request.url)
  const resolved = await resolveTargetStudent({
    role: ctx.role,
    selfId: ctx.userId,
    scopeEmail: ctx.email,
    requestedUserId: searchParams.get('user_id'),
  })
  if (!resolved.ok) {
    return NextResponse.json({ error: 'Forbidden - student not in your roster' }, { status: 403 })
  }
  const targetUserId = resolved.userId

  // Active competencies.
  const { data: compRows } = await supabaseAdmin
    .from('math_competencies')
    .select('id, code, statement, strand, order_index, sequence_order, mini_lesson')
    .eq('is_active', true)
    .order('sequence_order', { ascending: true, nullsFirst: false })
  const competencies = compRows ?? []
  if (competencies.length === 0) {
    return NextResponse.json({ item: null, snapshot: { mathPointsEarned: 0, fluentCount: 0, total: 0 } })
  }
  const competencyIds = competencies.map((c) => c.id)

  // This student's records → per-competency decaying value.
  const { data: recRows } = await supabaseAdmin
    .from('math_competency_records')
    .select('competency_id, level, observed_at')
    .eq('user_id', targetUserId)
    .in('competency_id', competencyIds)
    .order('observed_at', { ascending: true })
  const levelsByComp = new Map<string, number[]>()
  for (const r of recRows ?? []) {
    const arr = levelsByComp.get(r.competency_id) ?? []
    arr.push(r.level)
    levelsByComp.set(r.competency_id, arr)
  }
  const valueOf = (id: string): number | null => decayingAverage(levelsByComp.get(id) ?? [])

  // Walk the prerequisite ladder: everyone starts at the first rung (number sense)
  // and only advances to the next skill once they're Fluent on the current one.
  // So a zero-fluency student always gets rung 1 — never a skill they can't access.
  const ladder = [...competencies].sort(
    (a, b) => (a.sequence_order ?? 999) - (b.sequence_order ?? 999) || a.order_index - b.order_index,
  )
  const target = ladder.find((c) => (valueOf(c.id) ?? 0) < FLUENT_THRESHOLD) ?? ladder[ladder.length - 1]

  // Spiral items for that competency; rotate by day so it varies.
  const { data: itemRows } = await supabaseAdmin
    .from('math_spiral_items')
    .select('id, prompt, answer_key, difficulty, needs_graph, needs_equation_builder, translations')
    .eq('competency_id', target.id)
    .order('created_at', { ascending: true })
  const tiersFromDb = (target.mini_lesson as { tiers?: unknown } | null)?.tiers ?? null
  let item: {
    spiralItemId: string
    competencyId: string
    competencyCode: string
    competencyStatement: string
    prompt: string
    answerKey?: string
    difficulty?: string
    needsGraph?: boolean
    needsEquationBuilder?: boolean
    competencyValue: number | null
    miniLessonTiers?: unknown
    translations?: Record<string, string>
  } | null = null
  if (itemRows && itemRows.length > 0) {
    const dayNum = Math.floor(Date.now() / 86_400_000) // days since epoch
    const chosen = itemRows[dayNum % itemRows.length]
    item = {
      spiralItemId: chosen.id,
      competencyId: target.id,
      competencyCode: target.code,
      competencyStatement: target.statement,
      prompt: chosen.prompt,
      answerKey: chosen.answer_key ?? undefined,
      difficulty: chosen.difficulty ?? undefined,
      needsGraph: chosen.needs_graph ?? false,
      needsEquationBuilder: chosen.needs_equation_builder ?? false,
      competencyValue: valueOf(target.id),
      miniLessonTiers: tiersFromDb,
      translations: (chosen.translations ?? {}) as Record<string, string>,
    }
  }

  // Does any section this student is in have the translation toggle on? Only then
  // do we expose the Translate option (google_user_id → students.id → courses).
  let translationEnabled = false
  {
    const { data: s } = await supabaseAdmin.from('students').select('id').eq('google_user_id', targetUserId).maybeSingle()
    if (s?.id) {
      const { data: cs } = await supabaseAdmin.from('course_students').select('course_id').eq('student_id', s.id)
      const courseIds = (cs ?? []).map((c) => c.course_id)
      if (courseIds.length > 0) {
        const { data: en } = await supabaseAdmin.from('courses').select('id').in('id', courseIds).eq('math_translation_enabled', true).limit(1)
        translationEnabled = (en ?? []).length > 0
      }
    }
  }

  // Has this student already submitted today's warm-up for this competency?
  let alreadySubmitted = false
  if (item) {
    const dayStart = new Date()
    dayStart.setHours(0, 0, 0, 0)
    const { data: pend } = await supabaseAdmin
      .from('math_warmup_submissions')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('competency_id', item.competencyId)
      .gte('submitted_at', dayStart.toISOString())
      .limit(1)
    alreadySubmitted = (pend ?? []).length > 0
  }

  // Snapshot for the card framing.
  const fluentCount = competencies.filter((c) => (valueOf(c.id) ?? 0) >= FLUENT_THRESHOLD).length
  const { data: grantRows } = await supabaseAdmin
    .from('math_spine_point_grants')
    .select('points')
    .eq('user_id', targetUserId)
  const mathPointsEarned = (grantRows ?? []).reduce((sum, g) => sum + (g.points || 0), 0)

  return NextResponse.json({
    item,
    alreadySubmitted,
    translationEnabled,
    snapshot: { mathPointsEarned, fluentCount, total: competencies.length },
  })
})
