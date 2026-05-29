import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/admin/stats
 * Fetch admin dashboard statistics
 * Requires admin/teacher authentication
 */
export const GET = withRole(['teacher', 'admin'], async (_request, ctx) => {
    console.log('Fetching admin stats for:', ctx.email)

    // Initialize stats
    const stats = {
      totalLessons: 0,
      publishedLessons: 0,
      totalAssignments: 0,
      publishedAssignments: 0,
      activeAssignments: 0,
      enrolledStudents: 0
    }

    // Fetch lessons count (all lessons for admin)
    try {
      const { count: allLessonsCount } = await supabaseAdmin
        .from('lessons')
        .select('*', { count: 'exact', head: true })

      const { count: publishedLessonsCount } = await supabaseAdmin
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('published', true)

      stats.totalLessons = allLessonsCount || 0
      stats.publishedLessons = publishedLessonsCount || 0
    } catch (error) {
      console.error('Error fetching lesson counts:', error)
    }

    // Fetch assignments count
    try {
      const { count: allAssignmentsCount } = await supabaseAdmin
        .from('assignments')
        .select('*', { count: 'exact', head: true })

      const { count: publishedAssignmentsCount } = await supabaseAdmin
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('published', true)

      stats.totalAssignments = allAssignmentsCount || 0
      stats.publishedAssignments = publishedAssignmentsCount || 0

      // Count active assignments (published and not past due date)
      const { count: activeCount } = await supabaseAdmin
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('published', true)
        .or(`due_date.is.null,due_date.gte.${new Date().toISOString()}`)

      stats.activeAssignments = activeCount || 0
    } catch (error) {
      console.error('Error fetching assignment counts:', error)
    }

    // Fetch enrolled students count
    try {
      const { count: studentsCount } = await supabaseAdmin
        .from('students')
        .select('*', { count: 'exact', head: true })

      stats.enrolledStudents = studentsCount || 0
    } catch (error) {
      console.error('Error fetching student count:', error)
    }

    console.log('Admin stats:', stats)

    return NextResponse.json({ stats })
})
