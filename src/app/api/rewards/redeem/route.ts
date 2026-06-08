import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withEnrolledStudent } from '@/lib/api-auth'
import { getStudentCourseIds } from '@/lib/teacher-scope'

// POST /api/rewards/redeem  { reward_id }
// Creates a 'pending' redemption (request → teacher approves). Reserves the points
// so they can't be double-spent; rejects if the student can't afford it.
export const POST = withEnrolledStudent(async (request, ctx) => {
    const body = await request.json()
    if (!body.reward_id) {
      return NextResponse.json({ error: 'Missing reward_id' }, { status: 400 })
    }

    // Grant-type rewards (Unit-8 car parts) are EARNED by passing their build
    // lesson, never redeemed manually. Without this guard a student could POST a
    // part's id directly — it costs 0, so the funds check would happily pass.
    const { data: grantCheck } = await supabaseAdmin
      .from('rewards')
      .select('grant_lesson_id, category')
      .eq('id', String(body.reward_id))
      .maybeSingle()
    if (grantCheck && (grantCheck.grant_lesson_id || grantCheck.category === 'Car Part')) {
      return NextResponse.json(
        { error: 'Car parts are earned by passing the build lesson, not redeemed' },
        { status: 400 }
      )
    }

    // The reward must be PLACED in one of this student's periods (and active).
    // Otherwise a student could redeem a reward from another period/teacher by id.
    const courseIds = await getStudentCourseIds(ctx.userId)
    let inStore = false
    if (courseIds.length > 0) {
      const { data: placed } = await supabaseAdmin
        .from('store_reward_placements').select('reward_id')
        .in('course_id', courseIds).eq('reward_id', String(body.reward_id)).limit(1)
      if (placed && placed.length > 0) {
        const { data: rw } = await supabaseAdmin.from('rewards').select('active').eq('id', String(body.reward_id)).maybeSingle()
        inStore = !!(rw as { active: boolean } | null)?.active
      }
    }
    if (!inStore) {
      return NextResponse.json({ error: 'That reward is not available in your store' }, { status: 400 })
    }

    // Balance check + redemption insert happen atomically (and serialized
    // per-user) inside the redeem_reward RPC so two concurrent requests can't
    // both pass the balance check and double-spend.
    // See supabase/migrations/atomic_reward_redemption.sql.
    const { data, error } = await supabaseAdmin.rpc('redeem_reward', {
      p_user_id: ctx.userId,
      p_user_email: ctx.email,
      p_reward_id: String(body.reward_id),
    })

    if (error) {
      const msg = error.message || ''
      if (msg.includes('REWARD_NOT_FOUND')) {
        return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
      }
      if (msg.includes('REWARD_INACTIVE')) {
        return NextResponse.json({ error: 'This reward is not available' }, { status: 400 })
      }
      const insufficient = msg.match(/INSUFFICIENT_FUNDS:([\d.-]+):([\d.-]+)/)
      if (insufficient) {
        return NextResponse.json(
          { error: `Not enough points (you have ${Math.round(Number(insufficient[1]))}, this costs ${Math.round(Number(insufficient[2]))})` },
          { status: 400 }
        )
      }
      console.error('Error in redeem_reward RPC:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    // RPC returns a set; take the inserted row.
    const redemption = Array.isArray(data) ? data[0] : data
    return NextResponse.json(redemption, { status: 201 })
})
