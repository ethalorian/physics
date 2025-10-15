import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserRole } from '@/lib/permissions'
import { supabase } from '@/lib/supabase'
import { AssignmentAnalytics, TeacherDashboardSummary, StudentDashboardSummary } from '@/types/unified-assignment'

/**
 * GET /api/unified-assignments/analytics
 * Get analytics for assignments
 * Query params:
 *   - type: 'assignment' | 'teacher_dashboard' | 'student_dashboard'
 *   - assignment_id: (for type=assignment)
 *   - course_id: (optional filter for dashboards)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = getUserRole(session.user.email)
    const { searchParams } = new URL(request.url)
    
    const type = searchParams.get('type') || 'assignment'
    const assignmentId = searchParams.get('assignment_id')
    const courseId = searchParams.get('course_id')

    if (type === 'assignment') {
      if (!assignmentId) {
        return NextResponse.json(
          { error: 'assignment_id required for assignment analytics' },
          { status: 400 }
        )
      }

      const analytics = await getAssignmentAnalytics(assignmentId)
      return NextResponse.json(analytics)
    }

    if (type === 'teacher_dashboard') {
      if (userRole !== 'admin' && userRole !== 'teacher') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const dashboard = await getTeacherDashboard(session.user.email, courseId)
      return NextResponse.json(dashboard)
    }

    if (type === 'student_dashboard') {
      const dashboard = await getStudentDashboard(session.user.email)
      return NextResponse.json(dashboard)
    }

    return NextResponse.json({ error: 'Invalid analytics type' }, { status: 400 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get detailed analytics for a specific assignment
 */
async function getAssignmentAnalytics(assignmentId: string): Promise<AssignmentAnalytics> {
  // Get assignment details
  const { data: assignment } = await supabase
    .from('unified_assignments')
    .select('*')
    .eq('id', assignmentId)
    .single()

  if (!assignment) {
    throw new Error('Assignment not found')
  }

  // Get all progress records for this assignment
  const { data: progressRecords } = await supabase
    .from('student_assignment_progress')
    .select('*')
    .eq('unified_assignment_id', assignmentId)

  if (!progressRecords || progressRecords.length === 0) {
    return {
      assignment_id: assignmentId,
      title: assignment.title,
      assignment_type: assignment.assignment_type,
      total_assigned: 0,
      total_started: 0,
      total_completed: 0,
      total_submitted: 0,
      start_rate: 0,
      completion_rate: 0,
      submission_rate: 0,
      status_counts: {},
      overdue_students: 0,
      needs_grading_count: 0,
      flagged_students: 0
    }
  }

  const totalAssigned = progressRecords.length
  const started = progressRecords.filter(p => 
    ['started', 'in_progress', 'completed', 'submitted', 'graded'].includes(p.status)
  )
  const completed = progressRecords.filter(p => 
    ['completed', 'submitted', 'graded'].includes(p.status)
  )
  const submitted = progressRecords.filter(p => 
    ['submitted', 'graded'].includes(p.status)
  )

  // Calculate scores
  const scores = progressRecords
    .filter(p => p.percentage !== null && p.percentage !== undefined)
    .map(p => p.percentage as number)
    .sort((a, b) => a - b)

  const averageScore = scores.length > 0
    ? scores.reduce((sum, s) => sum + s, 0) / scores.length
    : undefined

  const medianScore = scores.length > 0
    ? scores[Math.floor(scores.length / 2)]
    : undefined

  // Grade distribution
  const gradeDistribution: { [grade: string]: number } = {}
  progressRecords.forEach(p => {
    if (p.letter_grade) {
      gradeDistribution[p.letter_grade] = (gradeDistribution[p.letter_grade] || 0) + 1
    }
  })

  // Time statistics
  const timeSpent = progressRecords
    .filter(p => p.time_spent > 0)
    .map(p => p.time_spent)
    .sort((a, b) => a - b)

  const averageTimeSpent = timeSpent.length > 0
    ? timeSpent.reduce((sum, t) => sum + t, 0) / timeSpent.length
    : undefined

  const medianTimeSpent = timeSpent.length > 0
    ? timeSpent[Math.floor(timeSpent.length / 2)]
    : undefined

  // Status counts
  const statusCounts: { [status: string]: number } = {}
  progressRecords.forEach(p => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1
  })

  // Attention metrics
  const overdueStudents = progressRecords.filter(p => p.status === 'overdue').length
  const needsGradingCount = progressRecords.filter(p => p.status === 'submitted').length
  const flaggedStudents = progressRecords.filter(p => p.needs_attention).length

  return {
    assignment_id: assignmentId,
    title: assignment.title,
    assignment_type: assignment.assignment_type,
    total_assigned: totalAssigned,
    total_started: started.length,
    total_completed: completed.length,
    total_submitted: submitted.length,
    start_rate: (started.length / totalAssigned) * 100,
    completion_rate: (completed.length / totalAssigned) * 100,
    submission_rate: (submitted.length / totalAssigned) * 100,
    average_score: averageScore,
    median_score: medianScore,
    highest_score: scores.length > 0 ? scores[scores.length - 1] : undefined,
    lowest_score: scores.length > 0 ? scores[0] : undefined,
    grade_distribution: gradeDistribution,
    average_time_spent: averageTimeSpent,
    median_time_spent: medianTimeSpent,
    status_counts: statusCounts as any,
    overdue_students: overdueStudents,
    needs_grading_count: needsGradingCount,
    flagged_students: flaggedStudents
  }
}

/**
 * Get teacher dashboard summary
 */
async function getTeacherDashboard(
  teacherEmail: string,
  courseId?: string | null
): Promise<TeacherDashboardSummary> {
  // Get all assignments by this teacher
  let assignmentsQuery = supabase
    .from('unified_assignments')
    .select(`
      *,
      progress:student_assignment_progress(*)
    `)
    .eq('assigned_by', teacherEmail)
    .eq('published', true)

  if (courseId) {
    assignmentsQuery = assignmentsQuery.eq('course_id', courseId)
  }

  const { data: assignments } = await assignmentsQuery

  if (!assignments || assignments.length === 0) {
    return {
      total_assignments: 0,
      total_students: 0,
      assignments_by_type: {
        lesson: 0,
        homework: 0,
        vocabulary: 0,
        simulation: 0,
        simulation_embedded: 0
      },
      needs_grading: 0,
      overdue_count: 0,
      flagged_count: 0,
      recent_submissions: 0,
      recent_completions: 0,
      courses: []
    }
  }

  // Count by type
  const assignmentsByType = {
    lesson: 0,
    homework: 0,
    vocabulary: 0,
    simulation: 0,
    simulation_embedded: 0
  }
  assignments.forEach(a => {
    const type = a.assignment_type as keyof typeof assignmentsByType
    if (type in assignmentsByType) {
      assignmentsByType[type]++
    }
  })

  // Get all progress records
  const allProgress = assignments.flatMap(a => a.progress || [])
  const uniqueStudents = new Set(allProgress.map(p => p.student_id))

  // Counts
  const needsGrading = allProgress.filter(p => p.status === 'submitted').length
  const overdueCount = allProgress.filter(p => p.status === 'overdue').length
  const flaggedCount = allProgress.filter(p => p.needs_attention).length

  // Recent activity (last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const recentSubmissions = allProgress.filter(p => 
    p.submitted_at && p.submitted_at > oneDayAgo
  ).length
  const recentCompletions = allProgress.filter(p => 
    p.completed_at && p.completed_at > oneDayAgo
  ).length

  // Get course breakdown
  const { data: courses } = await supabase
    .from('courses')
    .select('id, name, google_course_id')

  const courseBreakdown = courses?.map(course => {
    const courseAssignments = assignments.filter(a => a.course_id === course.google_course_id)
    const courseProgress = courseAssignments.flatMap(a => a.progress || [])
    const completed = courseProgress.filter(p => 
      ['completed', 'submitted', 'graded'].includes(p.status)
    )

    return {
      course_id: course.google_course_id,
      course_name: course.name,
      active_assignments: courseAssignments.length,
      avg_completion_rate: courseProgress.length > 0
        ? (completed.length / courseProgress.length) * 100
        : 0
    }
  }) || []

  return {
    total_assignments: assignments.length,
    total_students: uniqueStudents.size,
    assignments_by_type: assignmentsByType,
    needs_grading: needsGrading,
    overdue_count: overdueCount,
    flagged_count: flaggedCount,
    recent_submissions: recentSubmissions,
    recent_completions: recentCompletions,
    courses: courseBreakdown
  }
}

/**
 * Get student dashboard summary
 */
async function getStudentDashboard(studentEmail: string): Promise<StudentDashboardSummary> {
  // Get all progress records for this student
  const { data: progressRecords } = await supabase
    .from('student_assignment_progress')
    .select(`
      *,
      assignment:unified_assignments(
        id,
        title,
        assignment_type,
        due_date,
        max_score
      )
    `)
    .eq('student_email', studentEmail)

  if (!progressRecords || progressRecords.length === 0) {
    return {
      total_assignments: 0,
      in_progress: 0,
      completed: 0,
      overdue: 0,
      due_this_week: 0,
      due_today: 0,
      recent_scores: [],
      total_time_spent: 0,
      avg_time_per_assignment: 0,
      assignments_by_type: {
        lesson: { total: 0, completed: 0, in_progress: 0 },
        homework: { total: 0, completed: 0, in_progress: 0 },
        vocabulary: { total: 0, completed: 0, in_progress: 0 },
        simulation: { total: 0, completed: 0, in_progress: 0 },
        simulation_embedded: { total: 0, completed: 0, in_progress: 0 }
      }
    }
  }

  const totalAssignments = progressRecords.length
  const inProgress = progressRecords.filter(p => 
    ['started', 'in_progress'].includes(p.status)
  ).length
  const completed = progressRecords.filter(p => 
    ['completed', 'submitted', 'graded'].includes(p.status)
  ).length
  const overdue = progressRecords.filter(p => p.status === 'overdue').length

  // Due dates
  const now = new Date()
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const dueToday = progressRecords.filter(p => 
    p.assignment?.due_date && new Date(p.assignment.due_date) <= todayEnd
  ).length
  const dueThisWeek = progressRecords.filter(p => 
    p.assignment?.due_date && new Date(p.assignment.due_date) <= weekEnd
  ).length

  // Recent scores (last 5 graded)
  const recentScores = progressRecords
    .filter(p => p.status === 'graded' && p.percentage !== null)
    .sort((a, b) => new Date(b.graded_at!).getTime() - new Date(a.graded_at!).getTime())
    .slice(0, 5)
    .map(p => ({
      assignment_title: p.assignment!.title,
      score: p.score || 0,
      max_score: p.max_score || 0,
      percentage: p.percentage || 0
    }))

  // Overall average
  const gradedAssignments = progressRecords.filter(p => p.percentage !== null)
  const overallAverage = gradedAssignments.length > 0
    ? gradedAssignments.reduce((sum, p) => sum + (p.percentage || 0), 0) / gradedAssignments.length
    : undefined

  // Time spent
  const totalTimeSpent = progressRecords.reduce((sum, p) => sum + (p.time_spent || 0), 0)
  const avgTimePerAssignment = progressRecords.length > 0
    ? totalTimeSpent / progressRecords.length
    : 0

  // By type
  const assignmentsByType: StudentDashboardSummary['assignments_by_type'] = {
    lesson: { total: 0, completed: 0, in_progress: 0 },
    homework: { total: 0, completed: 0, in_progress: 0 },
    vocabulary: { total: 0, completed: 0, in_progress: 0 },
    simulation: { total: 0, completed: 0, in_progress: 0 },
    simulation_embedded: { total: 0, completed: 0, in_progress: 0 }
  }

  progressRecords.forEach(p => {
    const type = p.assignment!.assignment_type as keyof typeof assignmentsByType
    if (type in assignmentsByType) {
      assignmentsByType[type].total++
      if (['completed', 'submitted', 'graded'].includes(p.status)) {
        assignmentsByType[type].completed++
      }
      if (['started', 'in_progress'].includes(p.status)) {
        assignmentsByType[type].in_progress++
      }
    }
  })

  return {
    total_assignments: totalAssignments,
    in_progress: inProgress,
    completed: completed,
    overdue: overdue,
    due_this_week: dueThisWeek,
    due_today: dueToday,
    overall_average: overallAverage,
    recent_scores: recentScores,
    total_time_spent: totalTimeSpent,
    avg_time_per_assignment: avgTimePerAssignment,
    assignments_by_type: assignmentsByType
  }
}

