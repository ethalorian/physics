import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// PATCH /api/math-spine/competency-lesson
// Edit the tiered mini-lesson shown on the warm-up screen for one competency.
// Body: { competency_id, tiers: [{title, steps:[], tip?}, ...] } — typically 3
// tiers (Start here / Building / Fluent). Setting tiers null reverts to the
// authored default in math-spine-lessons.ts. Staff only.
interface TierIn { title?: unknown; steps?: unknown; tip?: unknown }

export const PATCH = withAuth(async (request, ctx) => {
  if (ctx.role !== 'admin' && ctx.role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await request.json()
  const { competency_id } = body
  if (!competency_id) return NextResponse.json({ error: 'competency_id is required' }, { status: 400 })

  let mini: { tiers: { title: string; steps: string[]; tip?: string }[] } | null = null
  if (Array.isArray(body.tiers)) {
    const tiers = (body.tiers as TierIn[]).map((t) => {
      const steps = Array.isArray(t.steps) ? t.steps.map(String).map((s) => s.trim()).filter(Boolean) : []
      const title = String(t.title ?? '').trim()
      const tip = t.tip && String(t.tip).trim() ? String(t.tip).trim() : undefined
      return { title, steps, ...(tip ? { tip } : {}) }
    })
    // Every provided tier needs a title and at least one step.
    if (tiers.some((t) => !t.title || t.steps.length === 0)) {
      return NextResponse.json({ error: 'Each tier needs a title and at least one step.' }, { status: 400 })
    }
    mini = { tiers }
  }

  const { error } = await supabaseAdmin
    .from('math_competencies')
    .update({ mini_lesson: mini, updated_at: new Date().toISOString() })
    .eq('id', competency_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
})
