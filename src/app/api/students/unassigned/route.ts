import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'

// GET - Get all unassigned students
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

    // Use the database function to get unassigned students
    const { data, error } = await supabaseAdmin
      .rpc('get_unassigned_students')

    if (error) {
      console.error('Error fetching unassigned students:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch unassigned students',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      students: data || [],
      count: data?.length || 0
    })

  } catch (error) {
    console.error('Unassigned students API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - Manually assign student to course
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = getUserRole(session.user.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json({ 
        error: 'Forbidden - Admin/Teacher access required' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { studentId, courseId } = body

    if (!studentId || !courseId) {
      return NextResponse.json({ 
        error: 'studentId and courseId are required' 
      }, { status: 400 })
    }

    // For teachers (non-admin), verify they own this course
    if (userRole === 'teacher') {
      const { data: course } = await supabaseAdmin
        .from('courses')
        .select('teacher_email')
        .eq('id', courseId)
        .single()

      if (!course || course.teacher_email !== session.user.email) {
        return NextResponse.json({ 
          error: 'You can only assign students to your own courses' 
        }, { status: 403 })
      }
    }

    // Use the database function to assign student
    const { data, error } = await supabaseAdmin
      .rpc('assign_student_to_course', {
        p_student_id: studentId,
        p_course_id: courseId,
        p_assigned_by: session.user.id
      })

    if (error) {
      console.error('Error assigning student:', error)
      return NextResponse.json({ 
        error: 'Failed to assign student to course',
        details: error.message 
      }, { status: 500 })
    }

    const result = data[0]

    if (!result.success) {
      return NextResponse.json({ 
        error: result.message 
      }, { status: 400 })
    }

    // Fetch updated student and course info
    const { data: studentData } = await supabaseAdmin
      .from('students')
      .select(`
        id,
        email,
        name,
        enrollments:course_students(
          course:courses(id, name, section)
        )
      `)
      .eq('id', studentId)
      .single()

    return NextResponse.json({
      success: true,
      message: result.message,
      student: studentData
    })

  } catch (error) {
    console.error('Student assignment API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Remove student from course (useful for misassignments)
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const courseId = searchParams.get('courseId')

    if (!studentId || !courseId) {
      return NextResponse.json({ 
        error: 'studentId and courseId parameters are required' 
      }, { status: 400 })
    }

    // For teachers, verify they own this course
    if (userRole === 'teacher') {
      const { data: course } = await supabaseAdmin
        .from('courses')
        .select('teacher_email')
        .eq('id', courseId)
        .single()

      if (!course || course.teacher_email !== session.user.email) {
        return NextResponse.json({ 
          error: 'You can only remove students from your own courses' 
        }, { status: 403 })
      }
    }

    // Remove enrollment
    const { error } = await supabaseAdmin
      .from('course_students')
      .delete()
      .eq('student_id', studentId)
      .eq('course_id', courseId)

    if (error) {
      console.error('Error removing student from course:', error)
      return NextResponse.json({ 
        error: 'Failed to remove student from course',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Student removed from course successfully'
    })

  } catch (error) {
    console.error('Student removal API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

