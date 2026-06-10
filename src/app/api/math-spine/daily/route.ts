import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAuth } from '@/lib/api-auth'
import { resolveTargetStudent } from '@/lib/teacher-scope'
import { decayingAverage } from '@/data/curriculum-types'
import { FLUENT_THRESHOLD } from '@/lib/math-spine'
import { pickTargetRung, rungState, type PickKind, type RungInput } from '@/lib/math-spine-picker'
import { instantiateTemplate, type ItemTemplate } from '@/lib/math-item-template'

// GET /api/math-spine/daily[?user_id=...]
// The daily-dashboard "to-do": one warm-up problem, chosen by the shared picker
// (src/lib/math-spine-picker.ts): refresh rungs jump the queue, stale Got-it
// rungs get a ~2-week re-check, otherwise climb the prerequisite ladder; a
// fully-Got-it student gets maintenance + stretch. Deterministic per day.
// Returns pickKind so the page can frame the problem honestly, plus a snapshot.
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

  // This student's records → per-competency chronological levels.
  const { data: recRows } = await supabaseAdmin
    .from('math_competency_records')
    .select('competency_id, level, observed_at')
    .eq('user_id', targetUserId)
    .in('competency_id', competencyIds)
    .order('observed_at', { ascending: true })
  const levelsByComp = new Map<string, number[]>()
  const latestByComp = new Map<string, string>()
  for (const r of recRows ?? []) {
    const arr = levelsByComp.get(r.competency_id) ?? []
    arr.push(r.level)
    levelsByComp.set(r.competency_id, arr)
    latestByComp.set(r.competency_id, r.observed_at)
  }
  const valueOf = (id: string): number | null => decayingAverage(levelsByComp.get(id) ?? [])

  // One shared picker decides the rung AND why (refresh > recheck > climb > maintenance).
  const rungs: RungInput[] = competencies.map((c, i) => ({
    id: c.id,
    sequence: (c.sequence_order ?? 900 + i) * 1000 + c.order_index,
    levels: levelsByComp.get(c.id) ?? [],
    latestObservedAt: latestByComp.get(c.id) ?? null,
  }))
  const pick = pickTargetRung(rungs)
  const target = competencies.find((c) => c.id === pick?.id) ?? competencies[0]
  const pickKind: PickKind = pick?.kind ?? 'climb'

  // Spiral items for that competency; rotate by day so it varies.
  // Re-checks and maintenance prefer the spaced-retrieval bank (is_spaced),
  // and maintenance leans harder (stretch) when difficulty is tagged.
  const { data: itemRows } = await supabaseAdmin
    .from('math_spiral_items')
    .select('id, prompt, answer_key, difficulty, needs_graph, needs_equation_builder, translations, is_spaced, template')
    .eq('competency_id', target.id)
    .order('created_at', { ascending: true })
  let pool = itemRows ?? []
  if (pickKind === 'recheck' || pickKind === 'maintenance') {
    const spaced = pool.filter((i) => i.is_spaced)
    if (spaced.length > 0) pool = spaced
  }
  if (pickKind === 'maintenance') {
    const stretch = pool.filter((i) => (i.difficulty ?? '').match(/hard|stretch|challenge/i))
    if (stretch.length > 0) pool = stretch
  }

  const tiersFromDb = (target.mini_lesson as { tiers?: unknown } | null)?.tiers ?? null
  let item: {
    spiralItemId: string
    competencyId: string
    competencyCode: string
    competencyStatement: string
    prompt: string
    difficulty?: string
    needsGraph?: boolean
    needsEquationBuilder?: boolean
    competencyValue: number | null
    miniLessonTiers?: unknown
    translations?: Record<string, string>
  } | null = null
  if (pool.length > 0) {
    const dayNum = Math.floor(Date.now() / 86_400_000) // days since epoch
    const chosen = pool[dayNum % pool.length]

    // Shared prompt, varied numbers: a templated item keeps one problem
    // structure for the whole rung today, but fills the {slots} per student
    // (seeded user+item+day — warmup-submit recomputes the same numbers when
    // it checks the answer). A malformed template falls back to the static
    // prompt rather than blocking the student.
    let prompt = chosen.prompt
    let translations = (chosen.translations ?? {}) as Record<string, string>
    if (chosen.template) {
      try {
        const inst = instantiateTemplate(chosen.prompt, chosen.template as ItemTemplate, `${targetUserId}:${chosen.id}:${dayNum}`)
        prompt = inst.prompt
        translations = Object.fromEntries(
          Object.entries(translations).map(([k, v]) => [
            k,
            instantiateTemplate(v, chosen.template as ItemTemplate, `${targetUserId}:${chosen.id}:${dayNum}`).prompt,
          ]),
        )
      } catch (e) {
        console.error('Bad item template, serving static prompt:', chosen.id, e)
      }
    }

    item = {
      spiralItemId: chosen.id,
      competencyId: target.id,
      competencyCode: target.code,
      competencyStatement: target.statement,
      prompt,
      // answer_key deliberately NOT sent to the client — the self-check runs
      // server-side and students shouldn't find the key in the network tab.
      difficulty: chosen.difficulty ?? undefined,
      needsGraph: chosen.needs_graph ?? false,
      needsEquationBuilder: chosen.needs_equation_builder ?? false,
      competencyValue: valueOf(target.id),
      miniLessonTiers: tiersFromDb,
      translations,
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

  // One RATED submission per day, regardless of competency (the picker target
  // can shift mid-day after a review — that must not grant a second rated rep).
  let alreadySubmitted = false
  {
    const dayStart = new Date()
    dayStart.setHours(0, 0, 0, 0)
    const { data: pend } = await supabaseAdmin
      .from('math_warmup_submissions')
      .select('id')
      .eq('user_id', targetUserId)
      .gte('submitted_at', dayStart.toISOString())
      .limit(1)
    alreadySubmitted = (pend ?? []).length > 0
  }

  // Snapshot for the card framing + the ladder strip on the warm-up page.
  const fluentCount = competencies.filter((c) => (valueOf(c.id) ?? 0) >= FLUENT_THRESHOLD).length
  const { data: grantRows } = await supabaseAdmin
    .from('math_spine_point_grants')
    .select('points')
    .eq('user_id', targetUserId)
  const mathPointsEarned = (grantRows ?? []).reduce((sum, g) => sum + (g.points || 0), 0)

  const ladder = rungs
    .map((r) => {
      const c = competencies.find((x) => x.id === r.id)!
      return {
        competencyId: r.id,
        code: c.code,
        statement: c.statement,
        sequence: r.sequence,
        state: rungState(r.levels),
        isToday: r.id === target.id,
      }
    })
    .sort((a, b) => a.sequence - b.sequence)

  return NextResponse.json({
    item,
    pickKind,
    ladder,
    alreadySubmitted,
    translationEnabled,
    snapshot: { mathPointsEarned, fluentCount, total: competencies.length },
  })
})
