import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

/**
 * POST - Mark simulation activity as complete
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { activity_id, result } = body

    if (!activity_id || !result) {
      return NextResponse.json({ 
        error: 'activity_id and result required' 
      }, { status: 400 })
    }

    // Update activity with completion data
    const { data, error } = await supabase
      .from('simulation_activity')
      .update({
        completed_at: new Date().toISOString(),
        time_spent: result.time_spent || 0,
        final_state: result.data || {},
        score: result.score,
        passed: result.completed || false
      })
      .eq('id', activity_id)
      .eq('student_id', session.user.id)
      .select()
      .single()

    if (error) {
      console.error('Error completing activity:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ activity: data })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Failed to complete activity',
      message: error.message 
    }, { status: 500 })
  }
}
