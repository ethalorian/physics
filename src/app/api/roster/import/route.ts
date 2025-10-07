import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'
import { googleClassroomAPI } from '@/lib/google-classroom'

// POST - Import roster from Google Classroom
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting roster import...')
    
    const session = await auth()
    if (!session?.user?.email) {
      console.log('❌ No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = getUserRole(session.user.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      console.log('❌ Insufficient permissions:', userRole)
      return NextResponse.json({ error: 'Forbidden - Admin/Teacher access required' }, { status: 403 })
    }

    const body = await request.json()
    const { courseId, accessToken } = body
    console.log('📋 Import request for course:', courseId)

    if (!courseId || !accessToken) {
      console.log('❌ Missing required fields')
      return NextResponse.json({ error: 'Course ID and access token are required' }, { status: 400 })
    }

    // Set the access token for Google Classroom API
    googleClassroomAPI.setAccessToken(accessToken)
    console.log('🔑 Access token set for Google Classroom API')

    // Fetch course information
    console.log('📚 Fetching course information...')
    const course = await googleClassroomAPI.getCourse(courseId)
    if (!course) {
      console.log('❌ Course not found in Google Classroom')
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    console.log('✅ Course fetched:', course.name)

    // Sync course to database
    console.log('💾 Syncing course to database...')
    const { data: courseData, error: courseError } = await supabaseAdmin
      .rpc('sync_course', {
        p_google_course_id: course.id,
        p_name: course.name,
        p_section: course.section || null,
        p_description: course.description || null,
        p_room: course.room || null,
        p_owner_id: course.ownerId || session.user.id,
        p_course_state: course.courseState || 'ACTIVE',
        p_creation_time: course.creationTime ? new Date(course.creationTime) : null,
        p_update_time: course.updateTime ? new Date(course.updateTime) : null
      })

    if (courseError) {
      console.error('❌ Error syncing course:', courseError)
      console.error('Course data attempted:', {
        id: course.id,
        name: course.name,
        section: course.section
      })
      return NextResponse.json({ 
        error: 'Failed to sync course data', 
        details: courseError.message,
        hint: 'Check if database tables and functions exist'
      }, { status: 500 })
    }
    console.log('✅ Course synced successfully')

    // Fetch students from Google Classroom
    console.log('👥 Fetching students from Google Classroom...')
    const students = await googleClassroomAPI.getStudents(courseId)
    console.log(`📊 Found ${students.length} students in Google Classroom`)
    
    let syncedStudents = 0
    const errors: string[] = []

    // Sync each student to database
    for (const student of students) {
      try {
        const email = student.profile?.emailAddress || `${student.userId}@unknown.com`
        const fullName = student.profile?.name?.fullName || 'Unknown Student'
        const firstName = student.profile?.name?.givenName || null
        const lastName = student.profile?.name?.familyName || null
        const photoUrl = student.profile?.photoUrl || null

        const { error: studentError } = await supabaseAdmin
          .rpc('sync_student', {
            p_google_user_id: student.userId,
            p_email: email,
            p_name: fullName,
            p_first_name: firstName,
            p_last_name: lastName,
            p_profile_photo_url: photoUrl,
            p_course_id: courseId,
            p_enrollment_state: 'ACTIVE'
          })

        if (studentError) {
          console.error(`Error syncing student ${student.userId}:`, studentError)
          errors.push(`Failed to sync student: ${fullName}`)
        } else {
          syncedStudents++
        }
      } catch (studentErr) {
        console.error(`Error processing student ${student.userId}:`, studentErr)
        errors.push(`Failed to process student: ${student.profile?.name?.fullName || student.userId}`)
      }
    }

    // Update course student count
    await supabaseAdmin.rpc('update_course_student_counts')

    // Return results
    const response = {
      success: true,
      course: {
        id: course.id,
        name: course.name,
        section: course.section
      },
      studentsTotal: students.length,
      studentsSynced: syncedStudents,
      errors: errors.length > 0 ? errors : undefined
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Roster import error:', error)
    
    // Provide more specific error information
    let errorMessage = 'Internal server error'
    let errorDetails = error instanceof Error ? error.message : 'Unknown error'
    const hints: string[] = []

    if (error instanceof Error) {
      if (error.message.includes('function sync_course') || error.message.includes('does not exist')) {
        errorMessage = 'Database functions not found'
        errorDetails = 'The required database functions are missing'
        hints.push('Run the database migration: create_student_activity_tables.sql')
        hints.push('Check if the sync_course and sync_student functions exist in Supabase')
      } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
        errorMessage = 'Database tables not found'
        errorDetails = 'Required database tables are missing'
        hints.push('Run the database migration to create students and courses tables')
      } else if (error.message.includes('Google')) {
        errorMessage = 'Google Classroom API error'
        errorDetails = error.message
        hints.push('Check Google Classroom API access token')
        hints.push('Verify course ID is correct')
      }
    }

    return NextResponse.json({ 
      error: errorMessage,
      details: errorDetails,
      hints: hints.length > 0 ? hints : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// GET - Get imported roster data
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

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
    }

    // Get course information
    const { data: courseData, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('google_course_id', courseId)
      .single()

    if (courseError) {
      console.error('Error fetching course:', courseError)
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Get students for the course
    const { data: studentsData, error: studentsError } = await supabaseAdmin
      .rpc('get_course_students', { p_course_id: courseId })

    if (studentsError) {
      console.error('Error fetching students:', studentsError)
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
    }

    const response = {
      course: courseData,
      students: studentsData || [],
      totalStudents: studentsData?.length || 0
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Roster fetch error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
