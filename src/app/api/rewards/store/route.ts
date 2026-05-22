import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'
import { getBalance } from '@/lib/points'

// GET /api/rewards/store — the student store: spendable balance, active rewards, own redemptions.
// Staff may pass ?user_id= to view a specific student.
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const role = getUserRole(session.user.email)
    const isStaff = role === 'admin' || role === 'teacher'
    const requested = request.nextUrl.searchParams.get('user_id')
    const userId = isStaff && requested ? requested : session.user.id

    const [{ data: rewards }, { data: redemptions }, balance] = await Promise.all([
      supabaseAdmin.from('rewards').select('*').eq('active', true).order('cost_points', { ascending: true }),
      supabaseAdmin.from('reward_redemptions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      getBalance(userId),
    ])

    return NextResponse.json({ balance, rewards: rewards ?? [], redemptions: redemptions ?? [] })
  } catch (error) {
    console.error('Error in GET /api/rewards/store:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
