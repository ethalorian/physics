import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET — teacher view: full catalog + redemption queue.
export const GET = withRole(['teacher', 'admin'], async () => {
  const [{ data: rewards }, { data: redemptions }] = await Promise.all([
    supabaseAdmin.from('rewards').select('*').order('cost_points', { ascending: true }),
    supabaseAdmin.from('reward_redemptions').select('*').order('created_at', { ascending: false }).limit(200),
  ])
  return NextResponse.json({ rewards: rewards ?? [], redemptions: redemptions ?? [] })
})

// POST — create or update a reward.
export const POST = withRole(['teacher', 'admin'], async (request, ctx) => {
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
    created_by: ctx.email,
    updated_at: new Date().toISOString(),
  }
  const query = body.id
    ? supabaseAdmin.from('rewards').update(row).eq('id', body.id).select().single()
    : supabaseAdmin.from('rewards').insert(row).select().single()
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: body.id ? 200 : 201 })
})

// PATCH — update a redemption's status (approve / fulfill / deny).
export const PATCH = withRole(['teacher', 'admin'], async (request, ctx) => {
  const body = await request.json()
  const allowed = ['pending', 'approved', 'fulfilled', 'denied']
  if (!body.redemption_id || !allowed.includes(body.status)) {
    return NextResponse.json({ error: 'redemption_id and a valid status are required' }, { status: 400 })
  }
  const patch: Record<string, unknown> = { status: body.status }
  if (body.status === 'fulfilled') {
    patch.fulfilled_at = new Date().toISOString()
    patch.fulfilled_by = ctx.email
  }
  const { data, error } = await supabaseAdmin
    .from('reward_redemptions')
    .update(patch)
    .eq('id', body.redemption_id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
})
