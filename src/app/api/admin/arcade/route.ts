import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Staff arcade controls.
 *   GET   — every cabinet, enabled or not, in curriculum order.
 *   PATCH — { slug, enabled?, cost_xp? } toggle a cabinet or reprice its coin.
 *
 * This is the admin face of the rule learned the hard way: cabinet rows land
 * in the database instantly, game files land at the next deploy. The panel
 * at /admin/arcade pairs this API with a per-cabinet "file deployed?" check
 * so staff can SEE the gap before students fall into it.
 */

export const GET = withRole(['teacher', 'admin'], async () => {
  const { data } = await supabaseAdmin
    .from('arcade_games')
    .select('slug, name, unit, accent, cost_xp, enabled, sort_order, src_path')
    .order('sort_order', { ascending: true })
  return NextResponse.json({ games: data ?? [] })
})

export const PATCH = withRole(['teacher', 'admin'], async (request) => {
  const body = await request.json().catch(() => ({}))
  const { slug, enabled, cost_xp } = body as { slug?: string; enabled?: boolean; cost_xp?: number }
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

  const patch: Record<string, unknown> = {}
  if (typeof enabled === 'boolean') patch.enabled = enabled
  if (typeof cost_xp === 'number' && Number.isFinite(cost_xp)) {
    patch.cost_xp = Math.max(0, Math.min(500, Math.round(cost_xp)))
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('arcade_games')
    .update(patch)
    .eq('slug', slug)
    .select('slug, enabled, cost_xp')
    .single()
  if (error || !data) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, game: data })
})
