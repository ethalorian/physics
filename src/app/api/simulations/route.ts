import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserRole } from '@/lib/permissions'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { withRole } from '@/lib/api-auth'

/**
 * GET /api/simulations - Fetch simulations with optional filters
 * PUT /api/simulations - Update existing simulation (admin only)
 */

// eslint-disable-next-line no-restricted-syntax -- public (open to unauthenticated), pending auth review (audit follow-up)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Check if user is admin/teacher to bypass RLS
    const session = await auth()
    const userRole = session?.user?.email ? getUserRole(session.user.email) : 'student'
    const isAdminOrTeacher = userRole === 'admin' || userRole === 'teacher'
    
    // Filters
    const category = searchParams.get('category')
    const unit = searchParams.get('unit')
    const difficulty = searchParams.get('difficulty')
    const search = searchParams.get('search')
    const publishedParam = searchParams.get('published')
    
    // Handle published filter: 'all', 'true', 'false', or default to 'true'
    const published_only = publishedParam !== 'all' && publishedParam !== 'false'

    // Use admin client for admin/teacher to bypass RLS, otherwise use regular client
    const client = isAdminOrTeacher ? supabaseAdmin : supabase

    // Build query
    let query = client
      .from('simulations')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (published_only) {
      query = query.eq('published', true)
    } else if (publishedParam === 'false') {
      query = query.eq('published', false)
    }
    // If 'all', don't filter by published status
    
    if (category) {
      query = query.eq('category', category)
    }
    if (unit) {
      query = query.eq('unit', unit)
    }
    if (difficulty) {
      query = query.eq('difficulty', difficulty)
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching simulations:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      simulations: data || [],
      count: data?.length || 0
    })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch simulations',
      message: error.message 
    }, { status: 500 })
  }
}

export const PUT = withRole(['teacher', 'admin'], async (request) => {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Simulation ID required' }, { status: 400 })
    }

    console.log('Updating simulation:', id, 'with:', updates)

    // Update simulation
    const { data, error } = await supabaseAdmin
      .from('simulations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase error updating simulation:', error)
      
      // Check if it's a "table doesn't exist" error
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Database not set up',
          message: 'The simulations table does not exist. Please run the database migration first.',
          hint: 'Visit /admin/migrations to run the setup'
        }, { status: 500 })
      }
      
      return NextResponse.json({ 
        error: error.message,
        code: error.code,
        details: error.details
      }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ 
        error: 'Simulation not found',
        id 
      }, { status: 404 })
    }

    console.log('✓ Simulation updated successfully:', data.slug)
    return NextResponse.json({ simulation: data })
})
