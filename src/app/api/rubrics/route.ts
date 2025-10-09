import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserRole } from '@/lib/permissions'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/rubrics - Fetch rubrics (optionally for specific simulation)
 * POST /api/rubrics - Create new rubric (admin/teacher only)
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const simulationId = searchParams.get('simulation_id')
    const isDefault = searchParams.get('default') === 'true'

    let query = supabase
      .from('simulation_rubrics')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })

    if (simulationId) {
      query = query.eq('simulation_id', simulationId)
    }

    if (isDefault) {
      query = query.eq('is_default', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching rubrics:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ rubrics: data || [] })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch rubrics',
      message: error.message 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin/Teacher only
    const userRole = getUserRole(session.user.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Validation
    if (!body.simulation_id || !body.name) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        required: ['simulation_id', 'name']
      }, { status: 400 })
    }

    // Create rubric
    const rubricData = {
      simulation_id: body.simulation_id,
      name: body.name,
      description: body.description,
      grade_a_min: body.grade_a_min || 85,
      grade_b_min: body.grade_b_min || 70,
      grade_c_min: body.grade_c_min || 50,
      criteria: body.criteria || {},
      grade_descriptions: body.grade_descriptions,
      is_default: body.is_default || false,
      published: body.published !== false,
      created_by: session.user.email
    }

    const { data, error } = await supabase
      .from('simulation_rubrics')
      .insert(rubricData)
      .select()
      .single()

    if (error) {
      console.error('Error creating rubric:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ rubric: data }, { status: 201 })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Failed to create rubric',
      message: error.message 
    }, { status: 500 })
  }
}
