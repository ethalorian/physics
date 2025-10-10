import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'

// POST - Generate or update join code for a course
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { 
      courseId, 
      enabled = true, 
      expiresInDays, 
      maxEnrollments 
    } = body

    if (!courseId) {
      return NextResponse.json({ 
        error: 'courseId is required' 
      }, { status: 400 })
    }

    // Verify course exists and user has access
    // Try both UUID and Google course ID
    let query = supabaseAdmin
      .from('courses')
      .select('id, name, teacher_email, google_course_id')
    
    // Check if courseId is a UUID or Google course ID
    if (courseId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      query = query.eq('id', courseId)
    } else {
      query = query.eq('google_course_id', courseId)
    }
    
    const { data: course, error: courseError } = await query.single()

    if (courseError || !course) {
      return NextResponse.json({ 
        error: 'Course not found in database. Please import the course from Google Classroom first.' 
      }, { status: 404 })
    }

    // For teachers (non-admin), verify they own this course
    if (userRole === 'teacher' && course.teacher_email !== session.user.email) {
      return NextResponse.json({ 
        error: 'You can only manage join codes for your own courses' 
      }, { status: 403 })
    }

    // Generate new join code
    const { data: newCode, error: codeError } = await supabaseAdmin
      .rpc('generate_join_code')

    if (codeError || !newCode) {
      return NextResponse.json({ 
        error: 'Failed to generate join code' 
      }, { status: 500 })
    }

    // Calculate expiration date if specified
    let expiresAt = null
    if (expiresInDays && expiresInDays > 0) {
      const expireDate = new Date()
      expireDate.setDate(expireDate.getDate() + expiresInDays)
      expiresAt = expireDate.toISOString()
    }

    // Update course with join code (use the database UUID, not the Google course ID)
    const { data: updatedCourse, error: updateError } = await supabaseAdmin
      .from('courses')
      .update({
        join_code: newCode,
        join_code_enabled: enabled,
        join_code_expires_at: expiresAt,
        max_enrollments: maxEnrollments || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', course.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to update course with join code' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      joinCode: newCode,
      course: updatedCourse,
      expiresAt,
      message: 'Join code generated successfully'
    })

  } catch (error) {
    console.error('Join code generation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT - Update join code settings (enable/disable, change expiration)
export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { courseId, enabled, expiresInDays, maxEnrollments } = body

    if (!courseId) {
      return NextResponse.json({ 
        error: 'courseId is required' 
      }, { status: 400 })
    }

    // Verify course exists - handle both UUID and Google course ID
    let query = supabaseAdmin
      .from('courses')
      .select('id, name, teacher_email, join_code, google_course_id')
    
    if (courseId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      query = query.eq('id', courseId)
    } else {
      query = query.eq('google_course_id', courseId)
    }
    
    const { data: course } = await query.single()

    if (!course) {
      return NextResponse.json({ 
        error: 'Course not found in database. Please import the course from Google Classroom first.' 
      }, { status: 404 })
    }

    // For teachers, verify ownership
    if (userRole === 'teacher' && course.teacher_email !== session.user.email) {
      return NextResponse.json({ 
        error: 'You can only manage your own courses' 
      }, { status: 403 })
    }

    // Calculate new expiration if specified
    let expiresAt = null
    if (expiresInDays && expiresInDays > 0) {
      const expireDate = new Date()
      expireDate.setDate(expireDate.getDate() + expiresInDays)
      expiresAt = expireDate.toISOString()
    }

    // Update settings
    const updateData: any = { updated_at: new Date().toISOString() }
    if (typeof enabled === 'boolean') updateData.join_code_enabled = enabled
    if (expiresAt !== null) updateData.join_code_expires_at = expiresAt
    if (maxEnrollments !== undefined) updateData.max_enrollments = maxEnrollments || null

    const { data: updatedCourse, error: updateError } = await supabaseAdmin
      .from('courses')
      .update(updateData)
      .eq('id', course.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to update join code settings' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      course: updatedCourse,
      message: 'Join code settings updated successfully'
    })

  } catch (error) {
    console.error('Join code update error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Disable/remove join code
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
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json({ 
        error: 'courseId parameter is required' 
      }, { status: 400 })
    }

    // Verify course exists - handle both UUID and Google course ID
    let query = supabaseAdmin
      .from('courses')
      .select('id, teacher_email, google_course_id')
    
    if (courseId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      query = query.eq('id', courseId)
    } else {
      query = query.eq('google_course_id', courseId)
    }
    
    const { data: course } = await query.single()

    if (!course) {
      return NextResponse.json({ 
        error: 'Course not found in database. Please import the course from Google Classroom first.' 
      }, { status: 404 })
    }

    // For teachers, verify ownership
    if (userRole === 'teacher' && course.teacher_email !== session.user.email) {
      return NextResponse.json({ 
        error: 'You can only manage your own courses' 
      }, { status: 403 })
    }

    // Disable join code
    const { error: updateError } = await supabaseAdmin
      .from('courses')
      .update({
        join_code_enabled: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', course.id)

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to disable join code' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Join code disabled successfully'
    })

  } catch (error) {
    console.error('Join code deletion error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

