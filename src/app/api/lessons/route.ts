import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdminAdmin } from '@/lib/supabaseAdmin'
import { getUserRole } from '@/lib/permissions'

// GET - Get all lessons for assignment creation
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = getUserRole(session.user.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden - Admin/Teacher access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const unit = searchParams.get('unit')
    const published = searchParams.get('published') !== 'false' // Default to true

    // Build query
    let query = supabaseAdmin
      .from('lessons')
      .select('id, title, slug, description, unit, lesson_number, estimated_time, objectives, published')
      .order('unit', { ascending: true })
      .order('lesson_number', { ascending: true })

    // Apply filters
    if (unit) {
      query = query.eq('unit', unit)
    }
    if (published) {
      query = query.eq('published', true)
    }

    const { data: lessons, error } = await query

    if (error) {
      console.error('Error fetching lessons:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      lessons: lessons || [],
      totalCount: lessons?.length || 0
    })

  } catch (error) {
    console.error('Lessons API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}


