import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAuth } from '@/lib/api-auth'
import { decayingAverage } from '@/data/curriculum-types'
import { POINT_VALUES } from '@/lib/math-spine'
import { checkAnswer } from '@/lib/math-answer-check'
import { pickTargetRung, type RungInput } from '@/lib/math-spine-picker'
import { instantiateTemplate, type ItemTemplate } from '@/lib/math-item-template'

// Math-spine PRACTICE mode (redesign decisions 7–8): unlimited self-checked
// reps on the student's current rung. Practice NEVER writes
// math_competency_records — the mastery signal stays pure teacher judgment.
// A correct rep earns a token point (capped per day) via math_spine_point_grants
// with milestone='practice-rep'; the dedupe_key encodes user+date+slot so the
// cap is enforced at write time even under refresh-spamming.
//
// GET  → a practice item on the current target rung (random each request,
//        no answer key exposed).
// POST → { spiral_item_id, answer } → instant verdict + maybe a point.

const PRACTICE_DAILY_CAP = 3

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD (UTC)
}

async function currentTargetCompetency(userId: string) {
  const { data: compRows } = await supabaseAdmin
    .from('math_competencies')
    .select('id, code, statement, order_index, sequence_order')
    .eq('is_active', true)
    .order('sequence_order', { ascending: true, nullsFirst: false })
  const competencies = compRows ?? []
  if (competencies.length === 0) return null

  const { data: recRows } = await supabaseAdmin
    .from('math_competency_records')
    .select('competency_id, level, observed_at')
    .eq('user_id', userId)
    .in('competency_id', competencies.map((c) => c.id))
    .order('observed_at', { ascending: true })
  const levelsByComp = new Map<string, number[]>()
  const latestByComp = new Map<string, string>()
  for (const r of recRows ?? []) {
    const arr = levelsByComp.get(r.competency_id) ?? []
    arr.push(r.level)
    levelsByComp.set(r.competency_id, arr)
    latestByComp.set(r.competency_id, r.observed_at)
  }
  const rungs: RungInput[] = competencies.map((c, i) => ({
    id: c.id,
    sequence: (c.sequence_order ?? 900 + i) * 1000 + c.order_index,
    levels: levelsByComp.get(c.id) ?? [],
    latestObservedAt: latestByComp.get(c.id) ?? null,
  }))
  const pick = pickTargetRung(rungs)
  const target = competencies.find((c) => c.id === pick?.id) ?? competencies[0]
  return {
    target,
    value: decayingAverage(levelsByComp.get(target.id) ?? []),
  }
}

async function practicePointsToday(userId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from('math_spine_point_grants')
    .select('dedupe_key')
    .eq('user_id', userId)
    .eq('milestone', 'practice-rep')
    .like('dedupe_key', `${userId}:practice-rep:${todayStamp()}:%`)
  return (data ?? []).length
}

// GET /api/math-spine/practice — another rep on the current rung.
export const GET = withAuth(async (_request, ctx) => {
  const picked = await currentTargetCompetency(ctx.userId)
  if (!picked) return NextResponse.json({ item: null })
  const { target, value } = picked

  const { data: itemRows } = await supabaseAdmin
    .from('math_spiral_items')
    .select('id, prompt, difficulty, needs_graph, needs_equation_builder, translations, template')
    .eq('competency_id', target.id)
  const pool = itemRows ?? []
  if (pool.length === 0) return NextResponse.json({ item: null })
  const chosen = pool[Math.floor(Math.random() * pool.length)]

  // Templated items get fresh numbers per rep: a random seed instantiates the
  // prompt now and is echoed back on POST so the check recomputes the same key.
  let prompt = chosen.prompt
  let templateSeed: string | null = null
  if (chosen.template) {
    try {
      templateSeed = `practice:${ctx.userId}:${Date.now()}:${Math.floor(Math.random() * 1e9)}`
      prompt = instantiateTemplate(chosen.prompt, chosen.template as ItemTemplate, templateSeed).prompt
    } catch {
      templateSeed = null // malformed template — serve the static prompt/key
    }
  }

  const repsToday = await practicePointsToday(ctx.userId)
  return NextResponse.json({
    item: {
      spiralItemId: chosen.id,
      competencyId: target.id,
      competencyCode: target.code,
      competencyStatement: target.statement,
      prompt,
      templateSeed,
      needsGraph: chosen.needs_graph ?? false,
      needsEquationBuilder: chosen.needs_equation_builder ?? false,
      competencyValue: value,
      translations: (chosen.translations ?? {}) as Record<string, string>,
    },
    pointsToday: repsToday,
    dailyCap: PRACTICE_DAILY_CAP,
  })
})

// POST /api/math-spine/practice — check a rep; maybe award a token point.
export const POST = withAuth(async (request, ctx) => {
  const body = await request.json()
  const { spiral_item_id } = body
  const answer = typeof body.answer === 'string' ? body.answer : ''
  if (!spiral_item_id || !answer.trim()) {
    return NextResponse.json({ error: 'Missing spiral_item_id or answer' }, { status: 400 })
  }

  const { data: itemRow } = await supabaseAdmin
    .from('math_spiral_items')
    .select('id, prompt, answer_key, competency_id, template')
    .eq('id', spiral_item_id)
    .maybeSingle()
  if (!itemRow) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

  // Templated rep: recompute the key from the echoed seed. A student tampering
  // with the seed only changes which numbers they must solve — never a shortcut.
  let key: string | null | undefined = itemRow.answer_key
  const templateSeed = typeof body.template_seed === 'string' ? body.template_seed : null
  if (itemRow.template && templateSeed) {
    try {
      key = instantiateTemplate(itemRow.prompt, itemRow.template as ItemTemplate, templateSeed).answerKey
    } catch {
      key = itemRow.answer_key
    }
  }
  const result = checkAnswer(answer, key)

  // Token point on a confident match only, capped per day. The dedupe_key slot
  // (user:practice-rep:date:n) makes the cap idempotent under retries.
  let pointsAwarded = 0
  let pointsToday = await practicePointsToday(ctx.userId)
  if (result === 'match' && pointsToday < PRACTICE_DAILY_CAP) {
    const { data: inserted } = await supabaseAdmin
      .from('math_spine_point_grants')
      .upsert(
        {
          user_id: ctx.userId,
          user_email: ctx.email,
          milestone: 'practice-rep',
          competency_id: itemRow.competency_id,
          points: POINT_VALUES['practice-rep'],
          note: 'Extra practice rep',
          dedupe_key: `${ctx.userId}:practice-rep:${todayStamp()}:${pointsToday + 1}`,
        },
        { onConflict: 'dedupe_key', ignoreDuplicates: true },
      )
      .select('points')
    if (inserted && inserted.length > 0) {
      pointsAwarded = inserted[0].points
      pointsToday += 1
    }
  }

  return NextResponse.json({
    result, // 'match' | 'mismatch' | 'unknown'
    pointsAwarded,
    pointsToday,
    dailyCap: PRACTICE_DAILY_CAP,
    capReached: pointsToday >= PRACTICE_DAILY_CAP,
  })
})
