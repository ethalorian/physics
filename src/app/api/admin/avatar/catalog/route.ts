import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getEffectiveContext } from '@/lib/effective-context'
import type { AvatarItem } from '@/lib/avatar/types'

// GET /api/admin/avatar/catalog
// Admin-only: every avatar_items row plus the number of students who own each.
// Used by the admin catalog browser at /admin/avatar.

export interface CatalogRow extends AvatarItem {
  enabled: boolean
  owner_count: number
  target_statement: string | null
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const ctx = await getEffectiveContext(session.user.email)
    if (ctx.realRole !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: itemsRaw } = await supabaseAdmin
      .from('avatar_items')
      .select('slug, slot, name, cost_xp, unlock_target_id, unlock_min_level, svg_layer, z_order, enabled, sort_order')
      .order('slot', { ascending: true })
      .order('sort_order', { ascending: true })
    const items = (itemsRaw ?? []) as (AvatarItem & { enabled: boolean })[]

    // Ownership counts in one query (group by item_slug).
    const { data: ownsRaw } = await supabaseAdmin
      .from('student_owned_items')
      .select('item_slug')
    const counts = new Map<string, number>()
    for (const r of (ownsRaw ?? []) as { item_slug: string }[]) {
      counts.set(r.item_slug, (counts.get(r.item_slug) ?? 0) + 1)
    }

    // Resolve target statements for unlock-gated items.
    const targetIds = [...new Set(items.map((i) => i.unlock_target_id).filter(Boolean) as string[])]
    const stmtById = new Map<string, string>()
    if (targetIds.length > 0) {
      const { data: ts } = await supabaseAdmin
        .from('learning_targets')
        .select('id, statement')
        .in('id', targetIds)
      for (const t of (ts ?? []) as { id: string; statement: string }[]) stmtById.set(t.id, t.statement)
    }

    const catalog: CatalogRow[] = items.map((i) => ({
      ...i,
      owner_count: counts.get(i.slug) ?? 0,
      target_statement: i.unlock_target_id ? stmtById.get(i.unlock_target_id) ?? null : null,
    }))

    return NextResponse.json({ catalog })
  } catch (error) {
    console.error('Error in GET /api/admin/avatar/catalog:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
