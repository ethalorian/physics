import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'

// GET - Get sections for a course or all sections
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
    const courseId = searchParams.get('course_id')

    if (courseId) {
      // Get sections for a specific course using the RPC function
      const { data, error } = await supabaseAdmin
        .rpc('get_course_sections', { p_course_id: courseId })

      if (error) {
        console.error('Error fetching course sections:', error)
        return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 })
      }

      return NextResponse.json({ sections: data || [] })
    } else {
      // Get all sections with course info
      const { data, error } = await supabaseAdmin
        .from('sections')
        .select(`
          id,
          name,
          description,
          google_section_name,
          teacher_email,
          max_capacity,
          is_active,
          created_at,
          course:courses(id, name, google_course_id)
        `)
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('Error fetching sections:', error)
        return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 })
      }

      return NextResponse.json({ sections: data || [] })
    }
  } catch (error) {
    console.error('Sections fetch error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// POST - Create a new section or assign student to section
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = getUserRole(session.user.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden - Admin/Teacher access required' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'create_section') {
      // Create a new section
      const { courseId, name, description, maxCapacity } = body

      if (!courseId || !name) {
        return NextResponse.json({ error: 'Course ID and section name are required' }, { status: 400 })
      }

      const { data, error } = await supabaseAdmin
        .from('sections')
        .insert({
          course_id: courseId,
          name,
          description: description || null,
          teacher_email: session.user.email,
          max_capacity: maxCapacity || null,
          is_active: true
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          return NextResponse.json({ error: 'A section with this name already exists for this course' }, { status: 409 })
        }
        console.error('Error creating section:', error)
        return NextResponse.json({ error: 'Failed to create section' }, { status: 500 })
      }

      return NextResponse.json({ success: true, section: data })

    } else if (action === 'assign_student') {
      // Assign a student to a section
      const { studentId, sectionId } = body

      if (!studentId || !sectionId) {
        return NextResponse.json({ error: 'Student ID and section ID are required' }, { status: 400 })
      }

      const { data, error } = await supabaseAdmin
        .rpc('assign_student_to_section', {
          p_student_id: studentId,
          p_section_id: sectionId,
          p_assigned_by: session.user.email
        })

      if (error) {
        console.error('Error assigning student to section:', error)
        return NextResponse.json({ error: 'Failed to assign student' }, { status: 500 })
      }

      return NextResponse.json({ success: true, assignmentId: data })

    } else if (action === 'bulk_assign') {
      // Bulk assign students to a section
      const { studentIds, sectionId } = body

      if (!Array.isArray(studentIds) || studentIds.length === 0 || !sectionId) {
        return NextResponse.json({ error: 'Student IDs array and section ID are required' }, { status: 400 })
      }

      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[]
      }

      for (const studentId of studentIds) {
        const { error } = await supabaseAdmin
          .rpc('assign_student_to_section', {
            p_student_id: studentId,
            p_section_id: sectionId,
            p_assigned_by: session.user.email
          })

        if (error) {
          results.failed++
          results.errors.push(`Failed to assign student ${studentId}: ${error.message}`)
        } else {
          results.success++
        }
      }

      return NextResponse.json({ 
        success: true, 
        assigned: results.success,
        failed: results.failed,
        errors: results.errors.length > 0 ? results.errors : undefined
      })

    } else {
      return NextResponse.json({ error: 'Invalid action. Use create_section, assign_student, or bulk_assign' }, { status: 400 })
    }

  } catch (error) {
    console.error('Sections POST error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// PUT - Update a section
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = getUserRole(session.user.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden - Admin/Teacher access required' }, { status: 403 })
    }

    const body = await request.json()
    const { sectionId, name, description, maxCapacity, isActive } = body

    if (!sectionId) {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (maxCapacity !== undefined) updateData.max_capacity = maxCapacity
    if (isActive !== undefined) updateData.is_active = isActive

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No update fields provided' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('sections')
      .update(updateData)
      .eq('id', sectionId)
      .select()
      .single()

    if (error) {
      console.error('Error updating section:', error)
      return NextResponse.json({ error: 'Failed to update section' }, { status: 500 })
    }

    return NextResponse.json({ success: true, section: data })

  } catch (error) {
    console.error('Sections PUT error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// DELETE - Remove student from section or delete section
export async function DELETE(request: NextRequest) {
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
    const action = searchParams.get('action')
    const sectionId = searchParams.get('section_id')
    const studentId = searchParams.get('student_id')

    if (action === 'remove_student') {
      // Remove student from section
      if (!sectionId || !studentId) {
        return NextResponse.json({ error: 'Section ID and student ID are required' }, { status: 400 })
      }

      const { error } = await supabaseAdmin
        .from('student_sections')
        .update({ is_active: false })
        .eq('section_id', sectionId)
        .eq('student_id', studentId)

      if (error) {
        console.error('Error removing student from section:', error)
        return NextResponse.json({ error: 'Failed to remove student' }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'Student removed from section' })

    } else if (action === 'delete_section') {
      // Soft delete section (set is_active to false)
      if (!sectionId) {
        return NextResponse.json({ error: 'Section ID is required' }, { status: 400 })
      }

      const { error } = await supabaseAdmin
        .from('sections')
        .update({ is_active: false })
        .eq('id', sectionId)

      if (error) {
        console.error('Error deleting section:', error)
        return NextResponse.json({ error: 'Failed to delete section' }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'Section deleted' })

    } else {
      return NextResponse.json({ error: 'Invalid action. Use remove_student or delete_section' }, { status: 400 })
    }

  } catch (error) {
    console.error('Sections DELETE error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

