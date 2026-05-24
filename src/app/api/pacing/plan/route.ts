import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'
import { loadPlanItems } from '@/lib/pacing-server'

// GET  /api/pacing/plan — the master suggested pace (ordered items + unit days)
// PUT  /api/pacing/plan — admin edits planned days per lesson / allotted days per unit

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const role = getUserRole(session.user.email)
    if (role !== 'admin' && role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const items = await loadPlanItems()
    const { data: unitRows } = await supabaseAdmin.from('units').select('order_index, name, allotted_days').order('order_index', { ascending: true })
    return NextResponse.json({ items, units: unitRows ?? [] })
  } catch (error) {
    console.error('Error in GET /api/pacing/plan:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (getUserRole(session.user.email) !== 'admin') return NextResponse.json({ error: 'Only the admin can edit the master pace' }, { status: 403 })

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
  } catch (error) {
    console.error('Error in PUT /api/pacing/plan:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
