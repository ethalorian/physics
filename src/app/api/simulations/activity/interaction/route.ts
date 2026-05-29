import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/lib/api-auth'

/**
 * POST - Record a simulation interaction
 */
export const POST = withAuth(async (request, ctx) => {
    const body = await request.json()
    const { activity_id, interaction } = body

    if (!activity_id || !interaction) {
      return NextResponse.json({ 
        error: 'activity_id and interaction required' 
      }, { status: 400 })
    }

    // Fetch current activity
    const { data: activity, error: fetchError } = await supabase
      .from('simulation_activity')
      .select('interactions')
      .eq('id', activity_id)
      .eq('student_id', ctx.userId)
      .single()

    if (fetchError || !activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Append new interaction
    const interactions = Array.isArray(activity.interactions) 
      ? [...activity.interactions, interaction]
      : [interaction]

    // Update activity
    const { error: updateError } = await supabase
      .from('simulation_activity')
      .update({ interactions })
      .eq('id', activity_id)
      .eq('student_id', ctx.userId)

    if (updateError) {
      console.error('Error updating interactions:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
})
