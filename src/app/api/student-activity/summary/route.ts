import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getTeacherStudentEmails } from '@/lib/teacher-scope'

// GET - Get student activity summary (admin/teacher only)
export const GET = withRole(['teacher', 'admin'], async (request, ctx) => {
    const { searchParams } = new URL(request.url)
    const studentEmail = searchParams.get('student_email')

    // A teacher must name a specific student, and only one on their own roster
    // (without this guard, a teacher calling with no email hit an unscoped RPC).
    if (ctx.role === 'teacher') {
      if (!studentEmail) {
        return NextResponse.json({ error: 'student_email is required' }, { status: 400 })
      }
      const rosterEmails = await getTeacherStudentEmails(ctx.scopeEmail)
      if (!rosterEmails.includes(studentEmail)) {
        return NextResponse.json({ error: 'Forbidden - student not in your roster' }, { status: 403 })
      }
    }

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
