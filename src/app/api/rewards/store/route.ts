import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAuth } from '@/lib/api-auth'
import { resolveTargetStudent, getStudentCourseIds } from '@/lib/teacher-scope'
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

    // Per-period store: the student sees exactly the rewards PLACED in the
    // course(s) (period(s)) they are enrolled in. A teacher places their own
    // rewards and chosen globals into each period; nothing shows otherwise.
    const courseIds = await getStudentCourseIds(userId)

    const [{ data: redemptions }, balance] = await Promise.all([
      supabaseAdmin.from('reward_redemptions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      getBalance(userId),
    ])

    let rewards: unknown[] = []
    if (courseIds.length > 0) {
      const { data: placed } = await supabaseAdmin
        .from('store_reward_placements').select('reward_id').in('course_id', courseIds)
      const rewardIds = [...new Set(((placed ?? []) as { reward_id: string }[]).map((r) => r.reward_id))]
      if (rewardIds.length > 0) {
        const { data: rw } = await supabaseAdmin
          .from('rewards').select('*').eq('active', true).in('id', rewardIds).order('cost_points', { ascending: true })
        rewards = rw ?? []
      }
    }

    return NextResponse.json({ balance, rewards, redemptions: redemptions ?? [] })
})
