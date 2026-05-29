import { NextResponse } from 'next/server'
import { withAuth, withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { loadRotationCalendar } from '@/lib/pacing-server'
import { ROTATING_BLOCKS } from '@/lib/rotation'

// The school-wide rotation calendar (singleton). Any staff can read it; only the
// admin can set the anchor + no-school dates.
// GET /api/pacing/rotation
// PUT /api/pacing/rotation  { anchor_date, anchor_p1_block, no_school_dates }

export const GET = withRole(['admin', 'teacher'], async () => {
    return NextResponse.json({ calendar: await loadRotationCalendar() })
})

export const PUT = withAuth(async (request, ctx) => {
    if (ctx.role !== 'admin') return NextResponse.json({ error: 'Only the admin can set the rotation calendar' }, { status: 403 })

    const body = (await request.json()) as { anchor_date?: string | null; anchor_p1_block?: string | null; no_school_dates?: string[]; cycle_offset?: number }
    const p1 = body.anchor_p1_block ? body.anchor_p1_block.toUpperCase() : null
    if (p1 && !ROTATING_BLOCKS.includes(p1 as typeof ROTATING_BLOCKS[number])) {
      return NextResponse.json({ error: 'Period-1 block must be A–F (G is fixed at period 2)' }, { status: 400 })
    }

    const row = {
      id: 'default',
      anchor_date: body.anchor_date ?? null,
      anchor_p1_block: p1,
      no_school_dates: Array.isArray(body.no_school_dates) ? body.no_school_dates : [],
      cycle_offset: Number.isInteger(body.cycle_offset) ? body.cycle_offset : 0,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabaseAdmin.from('rotation_calendar').upsert(row, { onConflict: 'id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, calendar: row })
})
