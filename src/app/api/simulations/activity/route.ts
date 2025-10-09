import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

/**
 * Simulation Activity Tracking
 * POST - Start new activity session
 * GET - Fetch student activity history
 */

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { simulation_id, lesson_id, step_id } = body

    if (!simulation_id) {
      return NextResponse.json({ error: 'simulation_id required' }, { status: 400 })
    }

    // Create new activity record
    const activityData = {
      student_id: session.user.id,
      simulation_id,
      lesson_id: lesson_id || null,
      step_id: step_id || null,
      started_at: new Date().toISOString(),
      interactions: [],
      ai_messages: [],
      ai_hints_used: 0,
      time_spent: 0
    }

    const { data, error } = await supabase
      .from('simulation_activity')
      .insert(activityData)
      .select()
      .single()

    if (error) {
      console.error('Error creating activity:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ activity: data }, { status: 201 })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Failed to start activity',
      message: error.message 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const student_id = searchParams.get('student_id') || session.user.id
    const simulation_id = searchParams.get('simulation_id')
    const lesson_id = searchParams.get('lesson_id')

    // Build query
    let query = supabase
      .from('simulation_activity')
      .select('*')
      .eq('student_id', student_id)
      .order('created_at', { ascending: false })

    if (simulation_id) {
      query = query.eq('simulation_id', simulation_id)
    }
    if (lesson_id) {
      query = query.eq('lesson_id', lesson_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching activity:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ activities: data || [] })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch activity',
      message: error.message 
    }, { status: 500 })
  }
}
