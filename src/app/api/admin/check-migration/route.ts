import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabase } from '@/lib/supabase'

/**
 * Check if simulation migration ran successfully
 */
export const GET = withRole('admin', async () => {
  const results = {
    tables: {} as Record<string, any>,
    simulations: [] as any[],
    overall: 'checking...'
  }

  try {
    // Check each table
    const tables = ['simulations', 'tools', 'interactive_lessons', 'simulation_activity', 'interactive_lesson_progress']
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      results.tables[table] = {
        exists: !error,
        error: error?.message || null,
        count: count || 0
      }
    }

    // Fetch simulations to verify seed data
    if (results.tables['simulations']?.exists) {
      const { data, error } = await supabase
        .from('simulations')
        .select('id, title, slug, published')
      
      results.simulations = data || []
    }

    // Overall status
    const allTablesExist = Object.values(results.tables).every((t: any) => t.exists)
    const hasSimulations = results.simulations.length > 0

    if (allTablesExist && hasSimulations) {
      results.overall = 'success'
    } else if (allTablesExist) {
      results.overall = 'tables-exist-no-data'
    } else {
      results.overall = 'migration-not-run'
    }

    return NextResponse.json(results)

  } catch (error: any) {
    return NextResponse.json({
      overall: 'error',
      error: error.message
    }, { status: 500 })
  }
})
