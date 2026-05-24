import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'
import { loadRotationCalendar } from '@/lib/pacing-server'
import { ROTATING_BLOCKS } from '@/lib/rotation'

// The school-wide rotation calendar (singleton). Any staff can read it; only the
// admin can set the anchor + no-school dates.
// GET /api/pacing/rotation
// PUT /api/pacing/rotation  { anchor_date, anchor_p1_block, no_school_dates }

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const role = getUserRole(session.user.email)
    if (role !== 'admin' && role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ calendar: await loadRotationCalendar() })
  } catch (error) {
    console.error('Error in GET /api/pacing/rotation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (getUserRole(session.user.email) !== 'admin') return NextResponse.json({ error: 'Only the admin can set the rotation calendar' }, { status: 403 })

    const body = (await request.json()) as { anchor_date?: string | null; anchor_p1_block?: string | null; no_school_dates?: string[] }
    const p1 = body.anchor_p1_block ? body.anchor_p1_block.toUpperCase() : null
    if (p1 && !ROTATING_BLOCKS.includes(p1 as typeof ROTATING_BLOCKS[number])) {
      return NextResponse.json({ error: 'Period-1 block must be A–F (G is fixed at period 2)' }, { status: 400 })
    }

    const row = {
      id: 'default',
      anchor_date: body.anchor_date ?? null,
      anchor_p1_block: p1,
      no_school_dates: Array.isArray(body.no_school_dates) ? body.no_school_dates : [],
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabaseAdmin.from('rotation_calendar').upsert(row, { onConflict: 'id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, calendar: row })
  } catch (error) {
    console.error('Error in PUT /api/pacing/rotation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
