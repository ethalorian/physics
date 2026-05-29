import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withRole } from '@/lib/api-auth'

/**
 * GET /api/simulations/analytics - Fetch aggregated simulation analytics
 * Teacher/Admin only
 */
export const GET = withRole(['teacher', 'admin'], async () => {
    // Fetch all simulations
    const { data: simulations, error: simsError } = await supabase
      .from('simulations')
      .select('id, title, slug')
      .eq('published', true)

    if (simsError) {
      return NextResponse.json({ error: simsError.message }, { status: 500 })
    }

    // Fetch activity data for each simulation
    const stats = await Promise.all(
      (simulations || []).map(async (sim) => {
        const { data: activities } = await supabase
          .from('simulation_activity')
          .select('*')
          .eq('simulation_id', sim.id)

        const totalStudents = new Set(activities?.map(a => a.student_id) || []).size
        const completedActivities = activities?.filter(a => a.completed_at) || []
        const totalCompletions = completedActivities.length

        const avgTimeSpent = completedActivities.length > 0
          ? Math.round(completedActivities.reduce((sum, a) => sum + (a.time_spent || 0), 0) / completedActivities.length)
          : 0

        const avgScore = completedActivities.length > 0
          ? Math.round(completedActivities.reduce((sum, a) => sum + (a.score || 0), 0) / completedActivities.length)
          : 0

        const completionRate = totalStudents > 0
          ? Math.round((totalCompletions / totalStudents) * 100)
          : 0

        const avgAiHints = activities && activities.length > 0
          ? Math.round((activities.reduce((sum, a) => sum + (a.ai_hints_used || 0), 0) / activities.length) * 10) / 10
          : 0

        return {
          simulation_id: sim.id,
          simulation_title: sim.title,
          simulation_slug: sim.slug,
          total_students: totalStudents,
          total_completions: totalCompletions,
          avg_time_spent: avgTimeSpent,
          avg_score: avgScore,
          completion_rate: completionRate,
          ai_hints_avg: avgAiHints
        }
      })
    )

    return NextResponse.json({ stats })
})
