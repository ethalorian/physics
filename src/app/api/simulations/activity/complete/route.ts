import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/lib/api-auth'

/**
 * POST - Mark simulation activity as complete
 */
export const POST = withAuth(async (request, ctx) => {
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
      .eq('student_id', ctx.userId)
      .select()
      .single()

    if (error) {
      console.error('Error completing activity:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ activity: data })
})
