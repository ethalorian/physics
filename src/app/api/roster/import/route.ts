import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { googleClassroomAPI } from '@/lib/google-classroom'

// POST - Import roster from Google Classroom
export const POST = withRole(['teacher', 'admin'], async (request, ctx) => {
  try {
    console.log('🚀 Starting roster import...')

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
        p_teacher_email: ctx.email
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
    console.log('✅ Course synced successfully, course UUID:', courseData)

    // Fetch students from Google Classroom
    console.log('👥 Fetching students from Google Classroom...')
    const students = await googleClassroomAPI.getStudents(courseId)
    console.log(`📊 Found ${students.length} students in Google Classroom`)
    
    // Get the section name from the course for automatic section assignment
    const sectionName = course.section || 'Default Section'
    console.log(`📋 Section name for auto-assignment: "${sectionName}"`)
    
    let syncedStudents = 0
    let sectionsCreated = 0
    const errors: string[] = []

    // Sync each student to database with automatic section assignment
    console.log(`👥 Syncing ${students.length} students to course UUID: ${courseData} (Section: ${sectionName})`)
    for (const student of students) {
      try {
        // Use Google User ID as the unique identifier (no email needed)
        const googleUserId = student.userId
        const fullName = student.profile?.name?.fullName || 'Unknown Student'
        // Google gives us authoritative name parts — capture them so the
        // gradebook can sort by last name exactly like Aspen X2 (no guessing
        // from the full-name string). Fall back to splitting fullName only if
        // a part is missing.
        // Fallback split (only if Google omits a part): first token = first
        // name, EVERYTHING after = surname — matches how Aspen files compound
        // Hispanic surnames (e.g. "Mendez Hernandez" under M).
        const nameParts = fullName.trim().split(/\s+/)
        const firstName = student.profile?.name?.givenName || nameParts[0] || fullName
        const lastName = student.profile?.name?.familyName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '')
        // Generate a unique identifier based on Google User ID for internal use
        const internalEmail = `${googleUserId}@classroom.local`

        console.log(`  📝 Syncing student: ${fullName} (Google ID: ${googleUserId}) to section: ${sectionName}`)

        // Use the new sync_student_with_section function that handles section assignment
        const { data: studentData, error: studentError } = await supabaseAdmin
          .rpc('sync_student_with_section', {
            p_google_user_id: googleUserId,
            p_email: internalEmail,
            p_name: fullName,
            p_photo_url: null,
            p_course_id: courseData,
            p_section_name: sectionName,
            p_teacher_email: ctx.email
          })

        if (studentError) {
          // Fall back to original sync_student if new function doesn't exist yet
          console.log(`  ⚠️ sync_student_with_section failed, falling back to sync_student: ${studentError.message}`)
          
          const { data: fallbackData, error: fallbackError } = await supabaseAdmin
            .rpc('sync_student', {
              p_google_user_id: googleUserId,
              p_email: internalEmail,
              p_name: fullName,
              p_photo_url: null,
              p_course_id: courseData
            })
          
          if (fallbackError) {
            console.error(`  ❌ Error syncing student ${fullName}:`, fallbackError)
            errors.push(`Failed to sync student: ${fullName} - ${fallbackError.message}`)
          } else {
            console.log(`  ✅ Student synced (without section): ${fullName}, student UUID: ${fallbackData}`)
            syncedStudents++
          }
        } else {
          const result = Array.isArray(studentData) ? studentData[0] : studentData
          console.log(`  ✅ Student synced with section: ${fullName}, student UUID: ${result?.student_id}, section UUID: ${result?.section_id}`)
          syncedStudents++
          
          // Track if this was the first student in a new section
          if (result?.section_id) {
            sectionsCreated = 1 // At least one section was created/used
          }
        }

        // Persist the authoritative name parts (the sync RPCs only take the
        // full name). Keyed on the Google user id, which is unique per student.
        const { error: nameError } = await supabaseAdmin
          .from('students')
          .update({ first_name: firstName, last_name: lastName })
          .eq('google_user_id', googleUserId)
        if (nameError) console.error(`  ⚠️ Could not store name parts for ${fullName}:`, nameError.message)
      } catch (studentErr) {
        console.error(`  ❌ Exception processing student:`, studentErr)
        errors.push(`Failed to process student: ${student.profile?.name?.fullName || student.userId}`)
      }
    }
    
    console.log(`✅ Synced ${syncedStudents} out of ${students.length} students`)

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
      section: {
        name: sectionName,
        created: sectionsCreated > 0
      },
      studentsTotal: students.length,
      studentsSynced: syncedStudents,
      studentsAssignedToSection: syncedStudents, // All synced students are assigned to section
      errors: errors.length > 0 ? errors : undefined
    }

    console.log(`✅ Import complete: ${syncedStudents} students synced to section "${sectionName}"`)
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
})

// GET - Get imported roster data
export const GET = withRole(['teacher', 'admin'], async (request, ctx) => {
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

    // Get students for the course (use internal UUID, not Google course ID)
    const { data: studentsData, error: studentsError } = await supabaseAdmin
      .rpc('get_course_students', { p_course_id: courseData.id })

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
})
