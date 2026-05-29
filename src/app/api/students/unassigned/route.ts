import { NextResponse } from 'next/server'
import { withAuth, withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Get all unassigned students
export const GET = withRole(['teacher', 'admin'], async (request, ctx) => {
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
})

// POST - Manually assign student to course
export const POST = withAuth(async (request, ctx) => {
    const userRole = ctx.role
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

    // Verify student exists in database
    const { data: studentCheck, error: studentCheckError } = await supabaseAdmin
      .from('students')
      .select('id, email, name')
      .eq('id', studentId)
      .single()

    if (studentCheckError || !studentCheck) {
      return NextResponse.json({ 
        error: 'Student not found in database',
        details: `Student ID: ${studentId} - ${studentCheckError?.message || 'Not found'}` 
      }, { status: 404 })
    }

    // Verify course exists in database
    const { data: courseCheck, error: courseCheckError } = await supabaseAdmin
      .from('courses')
      .select('id, name, google_course_id, teacher_email')
      .eq('id', courseId)
      .single()

    if (courseCheckError || !courseCheck) {
      return NextResponse.json({ 
        error: 'Course not found in database',
        details: `Course ID: ${courseId} - ${courseCheckError?.message || 'Not found'}` 
      }, { status: 404 })
    }

    // For teachers (non-admin), verify they own this course
    if (userRole === 'teacher' && courseCheck.teacher_email) {
      if (courseCheck.teacher_email !== ctx.email) {
        return NextResponse.json({
          error: 'You can only assign students to your own courses'
        }, { status: 403 })
      }
    }

    // Use the database function to assign student
    // Note: Pass null for enrolled_by since we use NextAuth (not Supabase Auth)
    const { data, error } = await supabaseAdmin
      .rpc('assign_student_to_course', {
        p_student_id: studentId,
        p_course_id: courseId,
        p_assigned_by: null
      })

    if (error) {
      console.error('Database function error:', error)
      return NextResponse.json({ 
        error: 'Failed to assign student to course',
        details: error.message 
      }, { status: 500 })
    }

    const result = data[0]

    if (!result || !result.success) {
      return NextResponse.json({ 
        error: result?.message || 'Unknown error from database function'
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
})

// DELETE - Remove student from course (useful for misassignments)
export const DELETE = withAuth(async (request, ctx) => {
    const userRole = ctx.role
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

      if (!course || course.teacher_email !== ctx.email) {
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
})

