import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Get student activity summary (admin/teacher only)
export const GET = withRole(['teacher', 'admin'], async (request) => {
    const { searchParams } = new URL(request.url)
    const studentEmail = searchParams.get('student_email')

    // Get activity summary using the database function
    const { data: summaryData, error: summaryError } = await supabaseAdmin
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
      supabaseAdmin
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
      supabaseAdmin
        .from('assignment_submissions')
        .select('*')
        .eq(studentEmail ? 'user_email' : 'user_email', studentEmail || '')
        .order('time_submitted', { ascending: false })
        .limit(10)
    )

    // Get assignment analytics
    promises.push(
      supabaseAdmin
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
})
