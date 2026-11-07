import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ITEM_COLUMNS } from '@/lib/avatar/server'
import type { AvatarItem } from '@/lib/avatar/types'

// GET /api/admin/avatar/catalog
// Admin-only: every avatar_items row plus the number of students who own each.
// Used by the admin catalog browser at /admin/avatar.

export interface CatalogRow extends AvatarItem {
  enabled: boolean
  owner_count: number
}

export const GET = withRole('admin', async () => {
    const { data: itemsRaw, error: itemsRawError } = await supabaseAdmin
      .from('avatar_items')
      .select(`${ITEM_COLUMNS}, sort_order`)
      .order('slot', { ascending: true })
      .order('sort_order', { ascending: true })
    if (itemsRawError) throw itemsRawError
    const items = (itemsRaw ?? []) as (AvatarItem & { enabled: boolean })[]

    // Ownership counts in one query (group by item_slug).
    const { data: ownsRaw, error: ownsRawError } = await supabaseAdmin.rpc('avatar_owner_counts')
    if (ownsRawError) throw ownsRawError
    const counts = new Map<string, number>()
    for (const r of (ownsRaw ?? []) as { item_slug: string; owner_count: number }[]) {
      counts.set(r.item_slug, Number(r.owner_count))
    }

    const catalog: CatalogRow[] = items.map((i) => ({
      ...i,
      owner_count: counts.get(i.slug) ?? 0,
    }))

    return NextResponse.json({ catalog })
})
