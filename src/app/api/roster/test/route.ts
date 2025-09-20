import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'

// GET - Test database connection and table existence
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = getUserRole(session.user.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('🧪 Testing database connection and tables...')
    
    const tests = {
      supabase_connection: false,
      students_table: false,
      courses_table: false,
      sync_course_function: false,
      sync_student_function: false,
      student_activity_table: false
    }

    // Test Supabase connection
    try {
      const { data, error } = await supabase.from('lessons').select('count').limit(1)
      tests.supabase_connection = !error
      console.log('✅ Supabase connection:', tests.supabase_connection)
    } catch (err) {
      console.log('❌ Supabase connection failed:', err)
    }

    // Test students table
    try {
      const { error } = await supabase.from('students').select('count').limit(1)
      tests.students_table = !error
      console.log('✅ Students table exists:', tests.students_table)
    } catch (err) {
      console.log('❌ Students table test failed:', err)
    }

    // Test courses table
    try {
      const { error } = await supabase.from('courses').select('count').limit(1)
      tests.courses_table = !error
      console.log('✅ Courses table exists:', tests.courses_table)
    } catch (err) {
      console.log('❌ Courses table test failed:', err)
    }

    // Test student_activity table
    try {
      const { error } = await supabase.from('student_activity').select('count').limit(1)
      tests.student_activity_table = !error
      console.log('✅ Student activity table exists:', tests.student_activity_table)
    } catch (err) {
      console.log('❌ Student activity table test failed:', err)
    }

    // Test sync_course function
    try {
      const { error } = await supabase.rpc('sync_course', {
        p_google_course_id: 'test-course-id',
        p_name: 'Test Course'
      })
      tests.sync_course_function = !error
      console.log('✅ sync_course function exists:', tests.sync_course_function)
      
      // Clean up test data
      if (!error) {
        await supabase.from('courses').delete().eq('google_course_id', 'test-course-id')
      }
    } catch (err) {
      console.log('❌ sync_course function test failed:', err)
    }

    // Test sync_student function
    try {
      const { error } = await supabase.rpc('sync_student', {
        p_google_user_id: 'test-user-id',
        p_email: 'test@example.com',
        p_name: 'Test Student',
        p_course_id: 'test-course-id'
      })
      tests.sync_student_function = !error
      console.log('✅ sync_student function exists:', tests.sync_student_function)
      
      // Clean up test data
      if (!error) {
        await supabase.from('students').delete().eq('google_user_id', 'test-user-id')
      }
    } catch (err) {
      console.log('❌ sync_student function test failed:', err)
    }

    const allTestsPassed = Object.values(tests).every(test => test === true)
    
    return NextResponse.json({
      success: allTestsPassed,
      tests,
      message: allTestsPassed 
        ? 'All database components are ready for roster import'
        : 'Some database components are missing - check the migration',
      recommendations: allTestsPassed ? [] : [
        'Run the database migration: create_student_activity_tables.sql',
        'Check Supabase dashboard for table creation',
        'Verify database functions were created successfully'
      ]
    })

  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({ 
      error: 'Failed to run database tests',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}



