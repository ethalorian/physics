import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// POST - Enroll student using join code
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { joinCode } = body

    if (!joinCode || typeof joinCode !== 'string') {
      return NextResponse.json({ 
        error: 'Join code is required' 
      }, { status: 400 })
    }

    // Normalize join code (uppercase, trim whitespace)
    const normalizedCode = joinCode.toUpperCase().trim()

    // Use the database function to enroll student
    const { data, error } = await supabaseAdmin
      .rpc('enroll_student_with_code', {
        p_student_email: session.user.email,
        p_join_code: normalizedCode
      })

    if (error) {
      console.error('Enrollment error:', error)
      return NextResponse.json({ 
        error: 'Failed to process enrollment',
        details: error.message 
      }, { status: 500 })
    }

    // The function returns a row with success, message, course_id, course_name
    const result = data[0]

    if (!result.success) {
      return NextResponse.json({ 
        error: result.message 
      }, { status: 400 })
    }

    // Fetch full course details for response
    const { data: courseData } = await supabaseAdmin
      .from('courses')
      .select('id, name, section, description, teacher_email')
      .eq('id', result.course_id)
      .single()

    return NextResponse.json({
      success: true,
      message: result.message,
      course: courseData || {
        id: result.course_id,
        name: result.course_name
      }
    })

  } catch (error) {
    console.error('Enrollment API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET - Check if join code is valid (without enrolling)
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

