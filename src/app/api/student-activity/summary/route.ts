import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'

// GET - Get student activity summary (admin/teacher only)
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
    const studentEmail = searchParams.get('student_email')

    // Get activity summary using the database function
    const { data: summaryData, error: summaryError } = await supabase
      .rpc('get_student_activity_summary', {
        p_user_email: studentEmail
      })

    if (summaryError) {
      console.error('Error fetching activity summary:', summaryError)
      return NextResponse.json({ error: summaryError.message }, { status: 500 })
    }

    // Get additional detailed data
    const promises = []

    // Get recent lesson progress
    promises.push(
      supabase
        .from('lesson_progress')
        .select(`
          *,
          lesson:lessons(id, title, slug)
        `)
        .eq(studentEmail ? 'user_email' : 'user_email', studentEmail || '')
        .order('last_accessed', { ascending: false })
        .limit(10)
    )

    // Get recent assignment submissions
    promises.push(
      supabase
        .from('assignment_submissions')
        .select('*')
        .eq(studentEmail ? 'user_email' : 'user_email', studentEmail || '')
        .order('time_submitted', { ascending: false })
        .limit(10)
    )

    // Get assignment analytics
    promises.push(
      supabase
        .from('assignment_analytics')
        .select('*')
        .order('last_calculated', { ascending: false })
    )

    const [lessonProgressResult, submissionsResult, analyticsResult] = await Promise.all(promises)

    const response = {
      summary: summaryData,
      recent_lesson_progress: lessonProgressResult.data || [],
      recent_submissions: submissionsResult.data || [],
      assignment_analytics: analyticsResult.data || []
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Student activity summary API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
