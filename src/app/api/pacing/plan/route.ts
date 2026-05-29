import { NextResponse } from 'next/server'
import { withAuth, withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { loadPlanItems } from '@/lib/pacing-server'

// GET  /api/pacing/plan — the master suggested pace (ordered items + unit days)
// PUT  /api/pacing/plan — admin edits planned days per lesson / allotted days per unit

export const GET = withRole(['admin', 'teacher'], async () => {
    const items = await loadPlanItems()
    const { data: unitRows } = await supabaseAdmin.from('units').select('order_index, name, allotted_days').order('order_index', { ascending: true })
    return NextResponse.json({ items, units: unitRows ?? [] })
})

export const PUT = withAuth(async (request, ctx) => {
    if (ctx.role !== 'admin') return NextResponse.json({ error: 'Only the admin can edit the master pace' }, { status: 403 })

    const body = (await request.json()) as {
      lessons?: { id: string; planned_days: number }[]
      units?: { order_index: number; allotted_days: number }[]
    }

    for (const l of body.lessons ?? []) {
      if (!l.id || !Number.isFinite(l.planned_days)) continue
      await supabaseAdmin.from('lessons').update({ planned_days: l.planned_days }).eq('id', l.id)
    }
    for (const u of body.units ?? []) {
      if (!Number.isFinite(u.order_index) || !Number.isFinite(u.allotted_days)) continue
      await supabaseAdmin.from('units').update({ allotted_days: u.allotted_days }).eq('order_index', u.order_index)
    }

    const items = await loadPlanItems()
    return NextResponse.json({ ok: true, items })
})
