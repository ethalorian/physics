import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAnswer } from '@/lib/math-answer-check'
import { instantiateTemplate, type ItemTemplate } from '@/lib/math-item-template'

// Check Lab data. GET replays every logged miss through the CURRENT parser
// and returns only the pairs that STILL fail — a parser or key fix quietly
// clears its rows from the dashboard. POST promotes a real student phrasing
// into an item's accepted forms, or dismisses a genuinely-wrong answer.
// Admin-only: answer keys are shared bank content.

interface ItemRow {
  id: string; prompt: string; answer_key: string | null; check_mode: string
  template: ItemTemplate | null
  competency: { code: string | null } | null
}

export const GET = withAuth(async (_req, ctx) => {
  if (ctx.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { data: misses } = await supabaseAdmin
    .from('math_check_misses')
    .select('id, item_id, answer, verdict, source, created_at')
    .order('created_at', { ascending: false })
    .limit(1000)
  const rows = misses ?? []
  if (rows.length === 0) return NextResponse.json({ items: [], totalMisses: 0 })

  const itemIds = [...new Set(rows.map((r) => r.item_id))]
  const { data: items } = await supabaseAdmin
    .from('math_spiral_items')
    .select('id, prompt, answer_key, check_mode, template, competency:math_competencies(code)')
    .in('id', itemIds)
  const itemBy = new Map<string, ItemRow>()
  for (const it of (items ?? []) as unknown as ItemRow[]) itemBy.set(it.id, it)

  // Replay through the current parser. Template items compare against the
  // static key only (per-student keys vary by seed) — a template miss is
  // usually a template bug, so it's still worth surfacing.
  type Group = {
    itemId: string; prompt: string; answerKey: string | null; checkMode: string
    code: string | null; hasTemplate: boolean
    answers: { answer: string; verdict: string; count: number; ids: string[]; latest: string }[]
  }
  const groups = new Map<string, Group>()
  for (const r of rows) {
    const it = itemBy.get(r.item_id)
    if (!it) continue
    if (it.check_mode === 'teacher-only') continue // never machine-judged — not actionable
    let stillFails = true
    if (!it.template) {
      stillFails = checkAnswer(r.answer, it.answer_key) !== 'match'
    } else {
      // best-effort: some template keys are static enough to clear misses
      try {
        const inst = instantiateTemplate(it.prompt, it.template, 'lab-probe')
        stillFails = checkAnswer(r.answer, inst.answerKey) !== 'match' && checkAnswer(r.answer, it.answer_key) !== 'match'
      } catch { stillFails = checkAnswer(r.answer, it.answer_key) !== 'match' }
    }
    if (!stillFails) continue

    let g = groups.get(r.item_id)
    if (!g) {
      g = { itemId: it.id, prompt: it.prompt, answerKey: it.answer_key, checkMode: it.check_mode, code: it.competency?.code ?? null, hasTemplate: !!it.template, answers: [] }
      groups.set(r.item_id, g)
    }
    const norm = r.answer.trim().toLowerCase()
    const existing = g.answers.find((a) => a.answer.trim().toLowerCase() === norm)
    if (existing) { existing.count++; existing.ids.push(r.id) }
    else g.answers.push({ answer: r.answer, verdict: r.verdict, count: 1, ids: [r.id], latest: r.created_at })
  }

  const out = [...groups.values()].sort((a, b) =>
    b.answers.reduce((x, y) => x + y.count, 0) - a.answers.reduce((x, y) => x + y.count, 0))
  return NextResponse.json({ items: out, totalMisses: out.reduce((x, g) => x + g.answers.reduce((a, b) => a + b.count, 0), 0) })
})

// POST { item_id, add_form }  → append "| form" to the item's answer_key
// POST { dismiss_ids: [...] } → delete those miss rows (genuinely wrong answers)
export const POST = withAuth(async (request, ctx) => {
  if (ctx.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  const body = await request.json()

  if (body.item_id && typeof body.add_form === 'string') {
    const form = body.add_form.trim()
    if (!form || form.length > 200 || form.includes('|')) {
      return NextResponse.json({ error: 'Form must be 1-200 chars, no |' }, { status: 400 })
    }
    const { data: item } = await supabaseAdmin.from('math_spiral_items').select('answer_key').eq('id', body.item_id).maybeSingle()
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    // Keep any trailing parenthetical explanation at the end of the key.
    const key = item.answer_key ?? ''
    const tail = key.match(/\s*(\([^()]*\))\s*$/)
    const base = tail ? key.slice(0, key.length - tail[0].length) : key
    const newKey = `${base.trim()} | ${form}${tail ? ` ${tail[1]}` : ''}`
    const { error } = await supabaseAdmin.from('math_spiral_items').update({ answer_key: newKey }).eq('id', body.item_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    // Verify the promotion actually makes the phrasing match.
    const nowMatches = checkAnswer(form, newKey) === 'match'
    return NextResponse.json({ ok: true, answer_key: newKey, nowMatches })
  }

  if (Array.isArray(body.dismiss_ids) && body.dismiss_ids.length > 0) {
    const { error } = await supabaseAdmin.from('math_check_misses').delete().in('id', body.dismiss_ids.slice(0, 200))
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Nothing to do' }, { status: 400 })
})
