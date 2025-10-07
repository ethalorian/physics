// Next.js imports
import { NextRequest, NextResponse } from 'next/server'

// Internal imports
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = getUserRole(session.user.email)
    if (userRole !== 'admin' && userRole !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden: Only admin/teacher can view analytics' }, { status: 403 })
    }

    // Fetch lesson assignments analytics
    const { data: lessonAssignments, error: lessonError } = await supabaseAdmin
      .from('lesson_assignments')
      .select('*')

    // Fetch homework assignments analytics
    const { data: homeworkAssignments, error: homeworkError } = await supabaseAdmin
      .from('assignment_assignments')
      .select('*')

    // Fetch student lesson progress
    const { data: studentLessonProgress, error: studentLessonError } = await supabaseAdmin
      .from('student_lesson_assignments')
      .select('*')

    // Fetch student assignment progress
    const { data: studentAssignmentProgress, error: studentAssignmentError } = await supabaseAdmin
      .from('student_assignment_assignments')
      .select('*')

    // If tables don't exist yet, return empty analytics
    if (lessonError || homeworkError || studentLessonError || studentAssignmentError) {
      console.log('Assignment system tables not fully initialized, returning empty analytics')
      return NextResponse.json({
        totalAssignments: 0,
        totalLessonAssignments: 0,
        totalHomeworkAssignments: 0,
        totalStudents: 0,
        completionRate: 0,
        averageScore: 0,
        byStatus: {
          assigned: 0,
          in_progress: 0,
          completed: 0,
          graded: 0,
          overdue: 0
        },
        byCourse: {},
        recentActivity: []
      })
    }

    // Calculate analytics
    const totalLessonAssignments = lessonAssignments?.length || 0
    const totalHomeworkAssignments = homeworkAssignments?.length || 0
    const totalAssignments = totalLessonAssignments + totalHomeworkAssignments

    // Get unique students
    const studentIds = new Set([
      ...(studentLessonProgress || []).map(s => s.student_id),
      ...(studentAssignmentProgress || []).map(s => s.student_id)
    ])
    const totalStudents = studentIds.size

    // Calculate completion rate
    const allProgress = [
      ...(studentLessonProgress || []),
      ...(studentAssignmentProgress || [])
    ]
    const completedCount = allProgress.filter(p => p.status === 'completed' || p.status === 'graded').length
    const completionRate = allProgress.length > 0 ? (completedCount / allProgress.length) * 100 : 0

    // Calculate average score
    const gradedProgress = allProgress.filter(p => p.score !== null && p.score !== undefined)
    const averageScore = gradedProgress.length > 0
      ? gradedProgress.reduce((sum, p) => sum + (p.score || 0), 0) / gradedProgress.length
      : 0

    // Status breakdown
    const byStatus = {
      assigned: allProgress.filter(p => p.status === 'assigned').length,
      in_progress: allProgress.filter(p => p.status === 'in_progress' || p.status === 'started').length,
      completed: allProgress.filter(p => p.status === 'completed').length,
      graded: allProgress.filter(p => p.status === 'graded').length,
      overdue: allProgress.filter(p => p.status === 'overdue').length
    }

    // Course breakdown
    const byCourse: Record<string, number> = {}
    for (const assignment of [...(lessonAssignments || []), ...(homeworkAssignments || [])]) {
      if (assignment.course_id) {
        byCourse[assignment.course_id] = (byCourse[assignment.course_id] || 0) + 1
      }
    }

    // Recent activity (last 10 submissions/completions)
    const recentActivity = allProgress
      .filter(p => p.completed_at || p.submitted_at)
      .sort((a, b) => {
        const dateA = new Date(a.completed_at || a.submitted_at || 0).getTime()
        const dateB = new Date(b.completed_at || b.submitted_at || 0).getTime()
        return dateB - dateA
      })
      .slice(0, 10)
      .map(p => ({
        student_id: p.student_id,
        assignment_type: 'lesson_id' in p ? 'lesson' : 'homework',
        status: p.status,
        score: p.score,
        timestamp: p.completed_at || p.submitted_at
      }))

    return NextResponse.json({
      totalAssignments,
      totalLessonAssignments,
      totalHomeworkAssignments,
      totalStudents,
      completionRate,
      averageScore,
      byStatus,
      byCourse,
      recentActivity
    })
  } catch (error) {
    console.error('Error in GET /api/assignments/analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


