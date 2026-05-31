import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// PATCH /api/math-spine/competency-lesson
// Edit the mini-lesson shown on the warm-up screen for one competency.
// Body: { competency_id, mini_lesson: { title, steps: string[], tip? } | null }
// Setting null reverts to the authored default in math-spine-lessons.ts. Staff only.
export const PATCH = withAuth(async (request, ctx) => {
  if (ctx.role !== 'admin' && ctx.role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await request.json()
  const { competency_id } = body
  if (!competency_id) return NextResponse.json({ error: 'competency_id is required' }, { status: 400 })

  let mini = body.mini_lesson ?? null
  if (mini) {
    const steps = Array.isArray(mini.steps) ? mini.steps.map(String).filter((s: string) => s.trim()) : []
    mini = {
      title: String(mini.title ?? '').trim(),
      steps,
      ...(mini.tip && String(mini.tip).trim() ? { tip: String(mini.tip).trim() } : {}),
    }
    if (!mini.title || mini.steps.length === 0) {
      return NextResponse.json({ error: 'A mini-lesson needs a title and at least one step.' }, { status: 400 })
    }
  }

  const { error } = await supabaseAdmin
    .from('math_competencies')
    .update({ mini_lesson: mini, updated_at: new Date().toISOString() })
    .eq('id', competency_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
})
