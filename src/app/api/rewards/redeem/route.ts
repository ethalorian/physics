import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withEnrolledStudent } from '@/lib/api-auth'

// POST /api/rewards/redeem  { reward_id }
// Creates a 'pending' redemption (request → teacher approves). Reserves the points
// so they can't be double-spent; rejects if the student can't afford it.
export const POST = withEnrolledStudent(async (request, ctx) => {
    const body = await request.json()
    if (!body.reward_id) {
      return NextResponse.json({ error: 'Missing reward_id' }, { status: 400 })
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
