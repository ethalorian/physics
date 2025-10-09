// Next.js imports
import { NextRequest, NextResponse } from 'next/server'

// Internal imports
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Fetch lessons
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unitId = searchParams.get('unit_id')
    const slug = searchParams.get('slug')
    const published = searchParams.get('published')
    
    // Build query
    let query = supabaseAdmin
      .from('lessons')
      .select('*')
      .order('unit_id, order_index', { ascending: true })

    // Apply filters
    if (unitId) {
      query = query.eq('unit_id', unitId)
    }
    
    if (slug) {
      query = query.eq('slug', slug)
    }
    
    if (published !== null) {
      query = query.eq('published', published === 'true')
    }

    const { data: lessons, error } = await query

    if (error) {
      console.error('Error fetching lessons:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(lessons || [])

  } catch (error) {
    console.error('Error in GET /api/lessons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}