import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'

async function requireStaff() {
  const session = await auth()
  if (!session?.user?.email) return { error: 'Unauthorized', status: 401 as const, session: null }
  const role = getUserRole(session.user.email)
  if (role !== 'admin' && role !== 'teacher') return { error: 'Teachers only', status: 403 as const, session: null }
  return { error: null, status: 200 as const, session }
}

// GET — teacher view: full catalog + redemption queue.
export async function GET() {
  const gate = await requireStaff()
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status })
  const [{ data: rewards }, { data: redemptions }] = await Promise.all([
    supabaseAdmin.from('rewards').select('*').order('cost_points', { ascending: true }),
    supabaseAdmin.from('reward_redemptions').select('*').order('created_at', { ascending: false }).limit(200),
  ])
  return NextResponse.json({ rewards: rewards ?? [], redemptions: redemptions ?? [] })
}

// POST — create or update a reward.
export async function POST(request: NextRequest) {
  const gate = await requireStaff()
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status })
  const body = await request.json()
  if (!body.name || body.cost_points === undefined) {
    return NextResponse.json({ error: 'name and cost_points are required' }, { status: 400 })
  }
  const row = {
    name: body.name,
    description: body.description ?? null,
    cost_points: Math.max(0, Math.round(body.cost_points)),
    category: body.category ?? null,
    stock: body.stock ?? null,
    active: body.active ?? true,
    created_by: gate.session!.user!.email,
    updated_at: new Date().toISOString(),
  }
  const query = body.id
    ? supabaseAdmin.from('rewards').update(row).eq('id', body.id).select().single()
    : supabaseAdmin.from('rewards').insert(row).select().single()
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: body.id ? 200 : 201 })
}

// PATCH — update a redemption's status (approve / fulfill / deny).
export async function PATCH(request: NextRequest) {
  const gate = await requireStaff()
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status })
  const body = await request.json()
  const allowed = ['pending', 'approved', 'fulfilled', 'denied']
  if (!body.redemption_id || !allowed.includes(body.status)) {
    return NextResponse.json({ error: 'redemption_id and a valid status are required' }, { status: 400 })
  }
  const patch: Record<string, unknown> = { status: body.status }
  if (body.status === 'fulfilled') {
    patch.fulfilled_at = new Date().toISOString()
    patch.fulfilled_by = gate.session!.user!.email
  }
  const { data, error } = await supabaseAdmin
    .from('reward_redemptions')
    .update(patch)
    .eq('id', body.redemption_id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
