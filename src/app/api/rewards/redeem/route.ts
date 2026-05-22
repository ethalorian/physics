import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getBalance } from '@/lib/points'

// POST /api/rewards/redeem  { reward_id }
// Creates a 'pending' redemption (request → teacher approves). Reserves the points
// so they can't be double-spent; rejects if the student can't afford it.
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    if (!body.reward_id) {
      return NextResponse.json({ error: 'Missing reward_id' }, { status: 400 })
    }

    const { data: reward, error: rErr } = await supabaseAdmin
      .from('rewards')
      .select('id, name, cost_points, active, stock')
      .eq('id', body.reward_id)
      .single()
    if (rErr || !reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
    }
    if (!reward.active) {
      return NextResponse.json({ error: 'This reward is not available' }, { status: 400 })
    }

    const { balance } = await getBalance(session.user.id)
    if (balance < reward.cost_points) {
      return NextResponse.json({ error: `Not enough points (you have ${balance}, this costs ${reward.cost_points})` }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('reward_redemptions')
      .insert({
        user_id: session.user.id,
        user_email: session.user.email,
        reward_id: reward.id,
        reward_name: reward.name,
        cost_points: reward.cost_points,
        status: 'pending',
      })
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/rewards/redeem:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
