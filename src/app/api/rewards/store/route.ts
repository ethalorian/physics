import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAuth } from '@/lib/api-auth'
import { resolveTargetStudent } from '@/lib/teacher-scope'
import { getBalance } from '@/lib/points'
import { grantEarnedCarParts } from '@/lib/car-parts'

// GET /api/rewards/store — the student store: spendable balance, active rewards, own redemptions.
// Staff may pass ?user_id= to view a specific student.
export const GET = withAuth(async (request, ctx) => {
    const role = ctx.role
    const requested = request.nextUrl.searchParams.get('user_id')
    // Admins may view any student; a teacher only their own roster.
    const resolved = await resolveTargetStudent({
      role,
      selfId: ctx.userId,
      scopeEmail: ctx.email,
      requestedUserId: requested,
    })
    if (!resolved.ok) {
      return NextResponse.json({ error: 'Forbidden - student not in your roster' }, { status: 403 })
    }
    const userId = resolved.userId

    // Reconcile Unit-8 car-part grants before reading: any build lesson the
    // student has passed (graded >= grant_min_score) yields its part, once.
    await grantEarnedCarParts(userId)

    const [{ data: rewards }, { data: redemptions }, balance] = await Promise.all([
      supabaseAdmin.from('rewards').select('*').eq('active', true).order('cost_points', { ascending: true }),
      supabaseAdmin.from('reward_redemptions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      getBalance(userId),
    ])

    return NextResponse.json({ balance, rewards: rewards ?? [], redemptions: redemptions ?? [] })
})
