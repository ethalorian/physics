import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'

// GET - Fetch all courses from database
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = getUserRole(session.user.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json({ 
        error: 'Forbidden - Admin/Teacher access required' 
      }, { status: 403 })
    }

    // Fetch all courses from database
    const { data: courses, error } = await supabaseAdmin
      .from('courses')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching courses:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch courses',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      courses: courses || []
    })

  } catch (error) {
    console.error('Courses API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

