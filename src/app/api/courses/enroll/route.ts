import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// POST - Enroll student using join code
export const POST = withAuth(async (request, ctx) => {
    const body = await request.json()
    const { joinCode } = body

    if (!joinCode || typeof joinCode !== 'string') {
      return NextResponse.json({ 
        error: 'Join code is required' 
      }, { status: 400 })
    }

    // Normalize join code (uppercase, trim whitespace)
    const normalizedCode = joinCode.toUpperCase().trim()

    // Find course by join code
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id, name, section, join_code_enabled, join_code_expires_at, max_enrollments')
      .eq('join_code', normalizedCode)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ 
        error: 'Invalid join code' 
      }, { status: 404 })
    }

    // Validate join code is active
    if (!course.join_code_enabled) {
      return NextResponse.json({ 
        error: 'This join code is no longer active' 
      }, { status: 400 })
    }

    if (course.join_code_expires_at && new Date(course.join_code_expires_at) < new Date()) {
      return NextResponse.json({ 
        error: 'This join code has expired' 
      }, { status: 400 })
    }

    // Find or create student record
    const { data: studentRecord } = await supabaseAdmin
      .from('students')
      .select('id, email, name')
      .eq('email', ctx.email)
      .maybeSingle()

    let studentId: string

    if (!studentRecord) {
      // Create student record
      const { data: newStudent, error: createError } = await supabaseAdmin
        .from('students')
        .insert({
          email: ctx.email,
          name: ctx.session.user.name || ctx.email.split('@')[0],
          google_user_id: ctx.userId || `user_${Date.now()}`
        })
        .select()
        .single()

      if (createError || !newStudent) {
        console.error('Failed to create student record:', createError)
        return NextResponse.json({ 
          error: 'Failed to create student record',
          details: createError?.message || 'Unknown error'
        }, { status: 500 })
      }

      studentId = newStudent.id
    } else {
      studentId = studentRecord.id
    }

    // Check if already enrolled
    const { data: existing } = await supabaseAdmin
      .from('course_students')
      .select('id')
      .eq('course_id', course.id)
      .eq('student_id', studentId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Already enrolled in this course',
        course: { id: course.id, name: course.name, section: course.section }
      })
    }

    // Enroll student (enrolled_by omitted to avoid FK constraint to auth.users)
    const { error: enrollError } = await supabaseAdmin
      .from('course_students')
      .insert({
        course_id: course.id,
        student_id: studentId,
        enrollment_state: 'ACTIVE',
        enrolled_via: 'join_code',
        enrolled_at: new Date().toISOString()
      })

    if (enrollError) {
      console.error('Enrollment failed:', enrollError)
      return NextResponse.json({ 
        error: 'Failed to enroll in course',
        details: enrollError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully enrolled in course',
      course: {
        id: course.id,
        name: course.name,
        section: course.section
      }
    })
})

// GET - Check if join code is valid (without enrolling)
// eslint-disable-next-line no-restricted-syntax -- public join-code validation (intentionally unauthenticated)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const joinCode = searchParams.get('code')

    if (!joinCode) {
      return NextResponse.json({ 
        error: 'Join code parameter is required' 
      }, { status: 400 })
    }

    // Normalize join code
    const normalizedCode = joinCode.toUpperCase().trim()

    // Find course by join code
    const { data: course, error } = await supabaseAdmin
      .from('courses')
      .select('id, name, section, teacher_email, join_code_enabled, join_code_expires_at, max_enrollments, student_count')
      .eq('join_code', normalizedCode)
      .single()

    if (error || !course) {
      return NextResponse.json({ 
        valid: false,
        message: 'Invalid join code' 
      })
    }

    // Check if code is enabled
    if (!course.join_code_enabled) {
      return NextResponse.json({ 
        valid: false,
        message: 'This join code is no longer active' 
      })
    }

    // Check if code has expired
    if (course.join_code_expires_at && new Date(course.join_code_expires_at) < new Date()) {
      return NextResponse.json({ 
        valid: false,
        message: 'This join code has expired' 
      })
    }

    // Check enrollment limit
    if (course.max_enrollments && course.student_count >= course.max_enrollments) {
      return NextResponse.json({ 
        valid: false,
        message: 'This course has reached maximum enrollment' 
      })
    }

    // Code is valid
    return NextResponse.json({ 
      valid: true,
      course: {
        name: course.name,
        section: course.section
      },
      message: 'Join code is valid' 
    })

  } catch (error) {
    console.error('Join code validation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

