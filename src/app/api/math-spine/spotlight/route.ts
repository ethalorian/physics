import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { buildSpotlightGrant } from '@/lib/math-spine'

// POST /api/math-spine/spotlight
// A teacher "spotlight": a manual recognition grant for a specific student's
// math-literacy contribution ("assigning competence"). Teacher/admin only.
// Repeatable — each spotlight is its own moment (unique dedupe_key), so the same
// student can be celebrated more than once.
export const POST = withAuth(async (request, ctx) => {
  const role = ctx.role
  if (role !== 'admin' && role !== 'teacher') {
    return NextResponse.json({ error: 'Only teachers can award a spotlight' }, { status: 403 })
  }

  const body = await request.json()
  const { user_id } = body
  if (!user_id) {
    return NextResponse.json({ error: 'Missing required field: user_id' }, { status: 400 })
  }

  const spec = buildSpotlightGrant({
    userId: user_id,
    userEmail: body.user_email ?? null,
    competencyId: body.competency_id ?? null,
    note: body.note ?? null,
    awardedBy: ctx.email,
    points: typeof body.points === 'number' ? body.points : undefined,
  })

  const { data, error } = await supabaseAdmin
    .from('math_spine_point_grants')
    .insert(spec)
    .select('milestone, competency_id, strand, points, note, awarded_at')
    .single()
  if (error) {
    console.error('Error awarding spotlight:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ awarded: data }, { status: 201 })
})
