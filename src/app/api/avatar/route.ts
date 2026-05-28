import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getBalance } from '@/lib/points'
import { targetValue, type MasteryRecord } from '@/data/curriculum-types'
import type { AvatarItem, EquippedItems, ItemSlot } from '@/lib/avatar/types'

// GET /api/avatar
// Returns the full avatar bundle for the signed-in student:
//   - traits (null until trait-builder completed)
//   - equipped items by slot
//   - owned item slugs
//   - the whole catalog with computed state per item
//   - current XP balance (so the wardrobe can show what's affordable)

export type CatalogState = 'owned' | 'affordable' | 'too_expensive' | 'unlock_available' | 'locked_until_mastery'

interface CatalogEntry extends AvatarItem { state: CatalogState; unlock_progress?: number }

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    // 1) Avatar row (traits + equipped). Lazy-created on first read.
    const { data: avatarRow } = await supabaseAdmin
      .from('student_avatars')
      .select('traits, equipped, setup_completed')
      .eq('user_id', userId)
      .maybeSingle()

    const traits = avatarRow?.setup_completed ? (avatarRow.traits as Record<string, string>) : null
    const equipped = (avatarRow?.equipped ?? {}) as EquippedItems
    const setup_completed = !!avatarRow?.setup_completed

    // 2) Catalog + ownership in parallel.
    const [{ data: itemsRaw }, { data: ownedRaw }, balance] = await Promise.all([
      supabaseAdmin
        .from('avatar_items')
        .select('slug, slot, name, cost_xp, unlock_target_id, unlock_min_level, svg_layer, z_order')
        .eq('enabled', true)
        .order('sort_order', { ascending: true }),
      supabaseAdmin.from('student_owned_items').select('item_slug').eq('user_id', userId),
      getBalance(userId),
    ])
    const items = (itemsRaw ?? []) as AvatarItem[]
    const owned = new Set((ownedRaw ?? []).map((r) => (r as { item_slug: string }).item_slug))

    // 3) Mastery rollup for any unlock-gated items.
    const unlockTargetIds = [...new Set(items.map((i) => i.unlock_target_id).filter(Boolean) as string[])]
    const targetLevel = new Map<string, number | null>()
    if (unlockTargetIds.length > 0) {
      const { data: recs } = await supabaseAdmin
        .from('mastery_records')
        .select('user_id, target_id, level, observed_at')
        .eq('user_id', userId)
        .in('target_id', unlockTargetIds)
        .order('observed_at', { ascending: true })
      const byTarget = new Map<string, MasteryRecord[]>()
      for (const r of (recs ?? []) as { target_id: string; level: number; observed_at: string }[]) {
        const arr = byTarget.get(r.target_id) ?? []
        arr.push({ studentId: userId, targetId: r.target_id, level: r.level as 1 | 2 | 3, observedAt: r.observed_at })
        byTarget.set(r.target_id, arr)
      }
      for (const tid of unlockTargetIds) {
        const arr = byTarget.get(tid) ?? []
        targetLevel.set(tid, arr.length > 0 ? targetValue(arr) : null)
      }
    }

    // 4) Compute per-item state.
    const catalog: CatalogEntry[] = items.map((item) => {
      if (owned.has(item.slug)) return { ...item, state: 'owned' }
      if (item.unlock_target_id) {
        const level = targetLevel.get(item.unlock_target_id) ?? 0
        const need = item.unlock_min_level ?? 2.5
        if (level >= need) return { ...item, state: 'unlock_available', unlock_progress: level }
        return { ...item, state: 'locked_until_mastery', unlock_progress: level }
      }
      if (item.cost_xp == null) return { ...item, state: 'locked_until_mastery' } // safety net
      if (balance.balance >= item.cost_xp) return { ...item, state: 'affordable' }
      return { ...item, state: 'too_expensive' }
    })

    return NextResponse.json({
      traits,
      setup_completed,
      equipped,
      owned: [...owned],
      catalog,
      balance: balance.balance,
      lifetimeEarned: balance.lifetimeEarned,
    })
  } catch (error) {
    console.error('Error in GET /api/avatar:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Re-export slot type so other routes can reuse it.
export type { ItemSlot }
