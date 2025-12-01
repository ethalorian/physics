import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'

// GET - Get students for a specific section
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
    const sectionId = searchParams.get('section_id')

    if (!sectionId) {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 })
    }

    // Get section info first
    const { data: sectionData, error: sectionError } = await supabaseAdmin
      .from('sections')
      .select(`
        id,
        name,
        description,
        course_id,
        course:courses(id, name, google_course_id, section)
      `)
      .eq('id', sectionId)
      .single()

    if (sectionError) {
      console.error('Error fetching section:', sectionError)
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    // Get students for this section
    const { data: studentsData, error: studentsError } = await supabaseAdmin
      .rpc('get_section_students', { p_section_id: sectionId })

    if (studentsError) {
      console.error('Error fetching section students:', studentsError)
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
    }

    return NextResponse.json({
      section: sectionData,
      students: studentsData || [],
      totalStudents: studentsData?.length || 0
    })

  } catch (error) {
    console.error('Section students fetch error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

