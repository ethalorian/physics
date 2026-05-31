import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabase } from '@/lib/supabase'
import { SIMULATION_CATALOG } from '@/data/simulations-catalog'

/**
 * Add any catalog simulations that are missing from the database.
 *
 * The source of truth is `src/data/simulations-catalog.ts` (kept in sync with the
 * SQL migrations and the SIM_COMPONENTS registry). This inserts the full current
 * field set — including unit id, topic, sort_order, and tags — so a freshly seeded
 * row matches the live gallery exactly. Idempotent: existing slugs are skipped.
 */
export const POST = withRole('admin', async () => {
  try {
    const { data: existing, error: readError } = await supabase
      .from('simulations')
      .select('slug')
    if (readError) {
      return NextResponse.json({ error: readError.message }, { status: 500 })
    }

    const existingSlugs = new Set((existing ?? []).map((s: { slug: string }) => s.slug))
    const missing = SIMULATION_CATALOG.filter((s) => !existingSlugs.has(s.slug))

    if (missing.length === 0) {
      return NextResponse.json({
        message: 'All catalog simulations already exist',
        count: SIMULATION_CATALOG.length,
      })
    }

    const { data: inserted, error } = await supabase
      .from('simulations')
      .insert(missing.map((s) => ({ ...s, created_by: 'system' })))
      .select('slug, unit, sort_order')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      added: inserted,
      count: inserted?.length ?? 0,
      message: `Added ${inserted?.length ?? 0} missing simulation(s)`,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
})
