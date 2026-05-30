import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/lobby/targets — learning targets for the session create form, so a
// teacher can tie a lobby to a specific target and group on that target's
// mastery (Fork B2). Optional ?unit_id= filter.
export const GET = withRole(['teacher', 'admin'], async (request) => {
  const unitId = new URL(request.url).searchParams.get('unit_id')
  let q = supabaseAdmin
    .from('learning_targets')
    .select('id, statement, domain, unit_id, order_index')
    .order('unit_id', { ascending: true })
    .order('order_index', { ascending: true })
  if (unitId) q = q.eq('unit_id', unitId)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: 'Failed to load targets' }, { status: 500 })
  return NextResponse.json({ targets: data ?? [] })
})
