import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAuth } from '@/lib/api-auth'
import { decayingAverage } from '@/data/curriculum-types'
import { checkAnswerWithMode } from '@/lib/math-answer-check'
import { pickTargetRung, type RungInput } from '@/lib/math-spine-picker'
import { instantiateTemplate, type ItemTemplate } from '@/lib/math-item-template'
import { matchSlip, type Slip, type SlipFeedback } from '@/lib/math-misconceptions'

// Practice issues an immutable server-side problem. Correct answers earn 1 XP
// once per instance, through the same XP ledger as warm-ups and milestones.
async function currentTargetCompetency(userId: string) {
  const { data: compRows } = await supabaseAdmin
    .from('math_competencies')
    .select('id, code, statement, order_index, sequence_order, mini_lesson')
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

// GET /api/math-spine/practice — another rep on the current rung.
export const GET = withAuth(async (_request, ctx) => {
  if (ctx.role !== 'student') return NextResponse.json({ error: 'Student practice only' }, { status: 403 })
  const picked = await currentTargetCompetency(ctx.userId)
  if (!picked) return NextResponse.json({ item: null })
  const { target, value } = picked

  const { data: itemRows, error: itemError } = await supabaseAdmin
    .from('math_spiral_items')
    .select('id, prompt, difficulty, needs_graph, needs_equation_builder, translations, template, check_mode, answer_key, misconceptions, competency:math_competencies(misconception_fallback)')
    .eq('competency_id', target.id)
    // Practice is the instant-check loop — prose/explain items can never be
    // machine-judged, so they stay in warm-ups (where the teacher reads them).
    .neq('check_mode', 'teacher-only')
  if (itemError) return NextResponse.json({error:'Could not load practice.'},{status:503})
  const pool = itemRows ?? []
  if (pool.length === 0) return NextResponse.json({ item: null })
  const chosen = pool[Math.floor(Math.random() * pool.length)]

  // Templated items get fresh numbers per rep: a random seed instantiates the
  // prompt now and is echoed back on POST so the check recomputes the same key.
  let prompt = chosen.prompt
  let templateSeed: string | null = null
  let translations = (chosen.translations ?? {}) as Record<string,string>
  if (chosen.template) {
    try {
      templateSeed = `practice:${ctx.userId}:${Date.now()}:${Math.floor(Math.random() * 1e9)}`
      prompt = instantiateTemplate(chosen.prompt, chosen.template as ItemTemplate, templateSeed).prompt
      translations = Object.fromEntries(Object.entries(translations).map(([code,text]) => [code, instantiateTemplate(text, chosen.template as ItemTemplate, templateSeed!).prompt]))
    } catch {
      templateSeed = null // malformed template — serve the static prompt/key
    }
  }

  const item = {
      spiralItemId: chosen.id,
      competencyId: target.id,
      competencyCode: target.code,
      competencyStatement: target.statement,
      miniLessonTiers: (target.mini_lesson as { tiers?: unknown } | null)?.tiers ?? null,
      prompt,
      templateSeed,
      needsGraph: chosen.needs_graph ?? false,
      checkMode: chosen.check_mode,
      needsEquationBuilder: chosen.needs_equation_builder ?? false,
      competencyValue: value,
      translations,
    }
  const issued = await supabaseAdmin.from('math_practice_instances').insert({user_id:ctx.userId,item,checking:chosen}).select('id').single()
  if (issued.error) return NextResponse.json({error:'Could not prepare practice. Please retry.'},{status:503})
  return NextResponse.json({item:{...item,instanceId:issued.data.id},xpAvailable:1})
})

// POST /api/math-spine/practice — check a rep; maybe award a token point.
export const POST = withAuth(async (request, ctx) => {
  if (ctx.role !== 'student') return NextResponse.json({error:'Student practice only'},{status:403})
  const body = await request.json()
  const answer = typeof body.answer === 'string' ? body.answer : ''
  if (typeof body.instance_id !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.instance_id) || !answer.trim() || answer.length>4000) return NextResponse.json({error:'Reload practice and enter your answer.'},{status:400})
  const {data:instance,error:instanceError} = await supabaseAdmin.from('math_practice_instances').select('id,item,checking').eq('id',body.instance_id).eq('user_id',ctx.userId).maybeSingle()
  if(instanceError) return NextResponse.json({error:'Could not check this problem. Please retry.'},{status:503})
  if(!instance) return NextResponse.json({error:'Practice problem not found.'},{status:404})
  const itemRow = instance.checking
  // Recompute from the issued server snapshot; client-supplied seeds are ignored.
  let key: string | null | undefined = itemRow.answer_key
  let templateValues: Record<string, number> | null = null
  const templateSeed = instance.item.templateSeed as string | null
  if (itemRow.template && templateSeed) {
    try {
      const inst = instantiateTemplate(itemRow.prompt, itemRow.template as ItemTemplate, templateSeed)
      key = inst.answerKey
      templateValues = inst.values
    } catch {
      key = itemRow.answer_key
    }
  }
  const result = checkAnswerWithMode(answer, key, itemRow.check_mode)

  // On a ✗, the same descriptive feedback the daily rep gives.
  let feedback: SlipFeedback | null = null
  if (result === 'mismatch') {
    const comp = itemRow.competency as { misconception_fallback: string | null } | { misconception_fallback: string | null }[] | null
    feedback = matchSlip(
      answer,
      Array.isArray(itemRow.misconceptions) ? (itemRow.misconceptions as Slip[]) : null,
      (itemRow.template as ItemTemplate | null) ?? null,
      templateValues,
      itemRow.check_mode,
      (Array.isArray(comp) ? comp[0] : comp)?.misconception_fallback ?? null,
    )
  }

  // Feed the Check Lab: practice misses are the richest source of real
  // phrasings, since students retry freely here.
  if (result === 'unknown' || result === 'mismatch') {
    supabaseAdmin.from('math_check_misses').insert({
      item_id: instance.item.spiralItemId, user_id: ctx.userId, answer: answer.trim().slice(0, 500),
      verdict: result, source: 'practice',
    }).then(() => {}, () => {}) // best-effort
  }

  let reward = {xpAwarded:0,xpEarned:0}
  if(result === 'match') {
    const {data,error} = await supabaseAdmin.rpc('award_math_practice_xp',{p_instance:instance.id,p_user:ctx.userId,p_email:ctx.email})
    if(error) return NextResponse.json({error:'Your XP could not be saved. Check again to retry.'},{status:503})
    reward=data
  }
  return NextResponse.json({result,feedback,...reward})
})
