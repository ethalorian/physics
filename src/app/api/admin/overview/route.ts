import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/admin/overview
// Headline numbers for the superadmin command center: roster size, colleague
// adoption, content published, mastery ratings logged, pending rewards, and how
// many students were active in the last 7 days.

export const GET = withRole('admin', async () => {
    const overview = {
      students: 0,
      colleagues: 0,
      publishedLessons: 0,
      masteryRatings: 0,
      pendingRewards: 0,
      activeStudents7d: 0,
    }

    // Students enrolled
    const { count: studentCount } = await supabaseAdmin
      .from('students')
      .select('*', { count: 'exact', head: true })
    overview.students = studentCount ?? 0

    // Colleagues = distinct teacher_email on the roster
    const { data: teacherRows } = await supabaseAdmin.from('students').select('teacher_email')
    overview.colleagues = new Set(
      ((teacherRows ?? []) as { teacher_email: string | null }[])
        .map((r) => r.teacher_email)
        .filter((e): e is string => !!e),
    ).size

    // Published lessons
    const { count: lessonCount } = await supabaseAdmin
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('published', true)
    overview.publishedLessons = lessonCount ?? 0

    // Mastery ratings logged (all-time)
    const { count: masteryCount } = await supabaseAdmin
      .from('mastery_records')
      .select('*', { count: 'exact', head: true })
    overview.masteryRatings = masteryCount ?? 0

    // Pending reward redemptions (awaiting fulfilment)
    const { count: rewardCount } = await supabaseAdmin
      .from('reward_redemptions')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'approved'])
    overview.pendingRewards = rewardCount ?? 0

    // Students active in the last 7 days
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: activity } = await supabaseAdmin
      .from('student_activity')
      .select('user_id')
      .gte('created_at', since)
      .limit(5000)
    overview.activeStudents7d = new Set(
      ((activity ?? []) as { user_id: string | null }[]).map((a) => a.user_id).filter((u): u is string => !!u),
    ).size

    return NextResponse.json({ overview })
})
