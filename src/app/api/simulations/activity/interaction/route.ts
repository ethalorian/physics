import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

/**
 * POST - Record a simulation interaction
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      .eq('student_id', session.user.id)
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
      .eq('student_id', session.user.id)

    if (updateError) {
      console.error('Error updating interactions:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Failed to record interaction',
      message: error.message 
    }, { status: 500 })
  }
}
