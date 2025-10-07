import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'

/**
 * GET /api/admin/stats
 * Fetch admin dashboard statistics
 * Requires admin/teacher authentication
 */
export async function GET() {
  try {
    // Check authentication
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Check if user is admin or teacher
    const userRole = getUserRole(session.user.email)
    const isAdmin = userRole === 'admin' || userRole === 'teacher'

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin/Teacher access required' },
        { status: 403 }
      )
    }

    console.log('Fetching admin stats for:', session.user.email)

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

  } catch (error) {
    console.error('Error in admin stats API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
