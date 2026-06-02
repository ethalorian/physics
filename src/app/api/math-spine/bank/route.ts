import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// /api/math-spine/bank — teacher-managed warm-up item bank.
//   GET    → all items (with tested competency ids) + all competencies
//   POST   → create an item (+ its tested competencies)
//   PATCH  → update an item (fields and/or tested competencies)
//   DELETE ?id= → remove an item
// Staff only. Every warm-up tests at least its primary competency.

function staffOnly(role: string) {
  return role === 'admin' || role === 'teacher'
}

export const GET = withAuth(async (_request, ctx) => {
  if (!staffOnly(ctx.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: comps } = await supabaseAdmin
    .from('math_competencies')
    .select('id, code, statement, strand, order_index, mini_lesson')
    .eq('is_active', true)
    .order('strand', { ascending: true })
    .order('order_index', { ascending: true })

  const { data: items } = await supabaseAdmin
    .from('math_spiral_items')
    .select('id, competency_id, prompt, answer_key, first_unit_id, difficulty, needs_graph, needs_equation_builder, created_at')
    .order('created_at', { ascending: true })

  const { data: tags } = await supabaseAdmin
    .from('math_spiral_item_competencies')
    .select('spiral_item_id, competency_id')
  const testedByItem = new Map<string, string[]>()
  for (const t of tags ?? []) {
    const arr = testedByItem.get(t.spiral_item_id) ?? []
    arr.push(t.competency_id)
    testedByItem.set(t.spiral_item_id, arr)
  }

  const itemsOut = (items ?? []).map((i) => ({
    id: i.id,
    competencyId: i.competency_id,
    prompt: i.prompt,
    answerKey: i.answer_key,
    firstUnitId: i.first_unit_id,
    difficulty: i.difficulty,
    needsGraph: i.needs_graph ?? false,
    needsEquationBuilder: i.needs_equation_builder ?? false,
    testedCompetencyIds: testedByItem.get(i.id) ?? [i.competency_id],
  }))

  return NextResponse.json({ competencies: comps ?? [], items: itemsOut })
})

export const POST = withAuth(async (request, ctx) => {
  if (!staffOnly(ctx.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json()
  const { prompt, competency_id } = body
  if (!prompt || !competency_id) {
    return NextResponse.json({ error: 'prompt and competency_id are required' }, { status: 400 })
  }

  const { data: item, error } = await supabaseAdmin
    .from('math_spiral_items')
    .insert({
      competency_id,
      prompt: String(prompt),
      answer_key: body.answer_key ?? null,
      first_unit_id: body.first_unit_id ?? null,
      difficulty: body.difficulty ?? null,
      needs_graph: Boolean(body.needs_graph),
      needs_equation_builder: Boolean(body.needs_equation_builder),
      created_by: ctx.email,
    })
    .select('id')
    .single()
  if (error || !item) return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 })

  const tested = new Set<string>([competency_id, ...(Array.isArray(body.tested_competency_ids) ? body.tested_competency_ids : [])])
  await supabaseAdmin
    .from('math_spiral_item_competencies')
    .upsert([...tested].map((cid) => ({ spiral_item_id: item.id, competency_id: cid })), { onConflict: 'spiral_item_id,competency_id', ignoreDuplicates: true })

  return NextResponse.json({ id: item.id }, { status: 201 })
})

export const PATCH = withAuth(async (request, ctx) => {
  if (!staffOnly(ctx.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json()
  const { id } = body
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.prompt !== undefined) patch.prompt = String(body.prompt)
  if (body.answer_key !== undefined) patch.answer_key = body.answer_key
  if (body.first_unit_id !== undefined) patch.first_unit_id = body.first_unit_id
  if (body.difficulty !== undefined) patch.difficulty = body.difficulty
  if (body.competency_id !== undefined) patch.competency_id = body.competency_id
  if (body.needs_graph !== undefined) patch.needs_graph = Boolean(body.needs_graph)
  if (body.needs_equation_builder !== undefined) patch.needs_equation_builder = Boolean(body.needs_equation_builder)

  const { error } = await supabaseAdmin.from('math_spiral_items').update(patch).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Replace tested competencies if provided (always include the primary).
  if (Array.isArray(body.tested_competency_ids)) {
    const primary = body.competency_id ?? null
    const tested = new Set<string>(body.tested_competency_ids)
    if (primary) tested.add(primary)
    await supabaseAdmin.from('math_spiral_item_competencies').delete().eq('spiral_item_id', id)
    if (tested.size > 0) {
      await supabaseAdmin
        .from('math_spiral_item_competencies')
        .insert([...tested].map((cid) => ({ spiral_item_id: id, competency_id: cid })))
    }
  }

  return NextResponse.json({ ok: true })
})

export const DELETE = withAuth(async (request, ctx) => {
  if (!staffOnly(ctx.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  const { error } = await supabaseAdmin.from('math_spiral_items').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
})
