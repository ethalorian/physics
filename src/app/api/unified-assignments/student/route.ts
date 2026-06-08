import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getTeacherStudentGids } from '@/lib/teacher-scope'

/**
 * GET /api/unified-assignments/student
 * Get all assignments and progress for the currently logged-in student
 */
export const GET = withAuth(async (request, ctx) => {
    const { searchParams } = new URL(request.url)
    // `student_id` here is actually an email. A student may only read their own;
    // an admin may read anyone; a teacher only students on their own roster.
    // (Previously this trusted the param from any caller — an IDOR.)
    const requestedEmail = searchParams.get('student_id')
    let studentEmail = ctx.email
    if (requestedEmail && requestedEmail !== ctx.email) {
      if (ctx.role === 'admin') {
        studentEmail = requestedEmail
      } else if (ctx.role === 'teacher') {
        const gids = await getTeacherStudentGids(ctx.scopeEmail)
        const { data: roster } = await supabaseAdmin.from('students').select('email').in('google_user_id', gids)
        const allowed = (roster ?? []).some((s: { email: string | null }) => s.email === requestedEmail)
        if (!allowed) return NextResponse.json({ error: 'Forbidden - student not in your roster' }, { status: 403 })
        studentEmail = requestedEmail
      } else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
    const supabase = supabaseAdmin

    // Query student's assignment progress with assignment details
    const { data: progressRecords, error: progressError } = await supabase
      .from('student_assignment_progress')
      .select(`
        *,
        assignment:unified_assignments(
          id,
          assignment_type,
          reference_id,
          title,
          description,
          instructions,
          course_id,
          assigned_at,
          available_from,
          due_date,
          closes_at,
          max_attempts,
          time_limit,
          allow_late_submission,
          requires_completion,
          max_score,
          weight,
          published,
          assigned_by
        )
      `)
      .eq('student_email', studentEmail)
      .order('created_at', { ascending: false })

    if (progressError) {
      console.error('Error fetching student progress:', progressError)
      
      // Check if table doesn't exist
      if (progressError.message?.includes('relation') && progressError.message?.includes('does not exist')) {
        // Return empty array if tables don't exist yet
        return NextResponse.json({ assignments: [] })
      }
      
      return NextResponse.json({ error: progressError.message }, { status: 500 })
    }

    // Filter to only include progress records with published assignments
    const publishedProgressRecords = (progressRecords || []).filter(
      (p: { assignment?: { published?: boolean } }) => p.assignment?.published === true
    )

    // Also get any published assignments the student is directly assigned to
    // but may not have a progress record yet
    const { data: directAssignments, error: assignmentError } = await supabase
      .from('unified_assignments')
      .select('*')
      .eq('published', true)
      .contains('assigned_students', [studentEmail])

    if (assignmentError) {
      console.error('Error fetching direct assignments:', assignmentError)
    }

    // Combine and dedupe - progress records take priority
    const progressAssignmentIds = new Set(
      publishedProgressRecords.map((p: { unified_assignment_id: string }) => p.unified_assignment_id)
    )

    const additionalAssignments = (directAssignments || [])
      .filter(a => !progressAssignmentIds.has(a.id))
      .map(assignment => ({
        id: `temp-${assignment.id}`,
        unified_assignment_id: assignment.id,
        student_id: ctx.userId || studentEmail,
        student_email: studentEmail,
        status: 'assigned' as const,
        progress_percentage: 0,
        attempt_number: 1,
        attempts_used: 0,
        time_spent: 0,
        is_late: false,
        is_excused: false,
        needs_attention: false,
        created_at: assignment.assigned_at,
        updated_at: assignment.assigned_at,
        assignment
      }))

    const allProgress = [...publishedProgressRecords, ...additionalAssignments]

    return NextResponse.json({ assignments: allProgress })
})

