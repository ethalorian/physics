import { NextResponse } from 'next/server'
import { withAuth, withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { loadPlanItems, loadUnits, asProgram } from '@/lib/pacing-server'

// GET  /api/pacing/plan?program=physics|trades — one program's master pace (ordered items + unit windows)
// PUT  /api/pacing/plan — admin edits planned-day weights per lesson / window days per unit (by unit id)

export const GET = withRole(['admin', 'teacher'], async (request) => {
    const program = asProgram(new URL(request.url).searchParams.get('program'))
    const [items, units] = await Promise.all([loadPlanItems(program), loadUnits(program)])
    return NextResponse.json({ program, items, units })
})

export const PUT = withAuth(async (request, ctx) => {
    if (ctx.role !== 'admin') return NextResponse.json({ error: 'Only the admin can edit the master pace' }, { status: 403 })

    const body = (await request.json()) as {
      lessons?: { id: string; planned_days: number }[]
      units?: { id: string; allotted_days: number }[]
      program?: string
    }

    for (const l of body.lessons ?? []) {
      if (!l.id || !Number.isFinite(l.planned_days)) continue
      await supabaseAdmin.from('lessons').update({ planned_days: l.planned_days }).eq('id', l.id)
    }
    for (const u of body.units ?? []) {
      if (!u.id || !Number.isFinite(u.allotted_days)) continue
      await supabaseAdmin.from('units').update({ allotted_days: u.allotted_days }).eq('id', u.id)
    }

    const program = asProgram(body.program)
    const [items, units] = await Promise.all([loadPlanItems(program), loadUnits(program)])
    return NextResponse.json({ ok: true, program, items, units })
})
