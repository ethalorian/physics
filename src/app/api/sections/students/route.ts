import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getCourseOwnerEmail } from '@/lib/teacher-scope'

// GET - Get students for a specific section
export const GET = withRole(['teacher', 'admin'], async (request, ctx) => {
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

    // A teacher may only view a section in a course they own (admins: any).
    if (ctx.role === 'teacher') {
      const owner = await getCourseOwnerEmail((sectionData as { course_id: string }).course_id)
      if (owner !== ctx.scopeEmail) {
        return NextResponse.json({ error: 'Forbidden - not your section' }, { status: 403 })
      }
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
})

