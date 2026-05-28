import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getBalance } from '@/lib/points'
import { getEffectiveContext } from '@/lib/effective-context'
import { targetValue, type MasteryRecord } from '@/data/curriculum-types'
import type { AvatarItem, EquippedItems, ItemSlot } from '@/lib/avatar/types'

// GET /api/avatar
// Returns the full avatar bundle for the signed-in student:
//   - traits (null until trait-builder completed)
//   - equipped items by slot
//   - owned item slugs
//   - the whole catalog with computed state per item
//   - current XP balance (so the wardrobe can show what's affordable)

export type CatalogState = 'owned' | 'affordable' | 'too_expensive' | 'unlock_available' | 'locked_until_mastery' | 'staff_free'

interface CatalogEntry extends AvatarItem { state: CatalogState; unlock_progress?: number }

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id || !session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    // Staff (teacher + admin) get every item for free — they're not the
    // customer earning XP from lesson engagement. Use REAL role so view-as
    // doesn't change the user's own avatar economics.
    const ctx = await getEffectiveContext(session.user.email)
    const isStaff = ctx.realRole === 'admin' || ctx.realRole === 'teacher'

    // 1) Avatar row (traits + equipped) + alias (separate column on students).
    const [{ data: avatarRow }, { data: studentRow }] = await Promise.all([
      supabaseAdmin
        .from('student_avatars')
        .select('traits, equipped, setup_completed, use_custom_avatar')
        .eq('user_id', userId)
        .maybeSingle(),
      supabaseAdmin
        .from('students')
        .select('alias')
        .eq('google_user_id', userId)
        .maybeSingle(),
    ])

    const traits = avatarRow?.setup_completed ? (avatarRow.traits as Record<string, string>) : null
    const equipped = (avatarRow?.equipped ?? {}) as EquippedItems
    const setup_completed = !!avatarRow?.setup_completed
    const use_custom_avatar = !!avatarRow?.use_custom_avatar
    const alias = (studentRow as { alias?: string | null } | null)?.alias ?? null

    // 2) Catalog + ownership in parallel. Skip XP balance for staff — they
    //    don't have an economy and items are free for them.
    const [{ data: itemsRaw }, { data: ownedRaw }, balance] = await Promise.all([
      supabaseAdmin
        .from('avatar_items')
        .select('slug, slot, name, cost_xp, unlock_target_id, unlock_min_level, svg_layer, z_order')
        .eq('enabled', true)
        .order('sort_order', { ascending: true }),
      supabaseAdmin.from('student_owned_items').select('item_slug').eq('user_id', userId),
      isStaff ? Promise.resolve({ balance: 0, lifetimeEarned: 0, spent: 0 }) : getBalance(userId),
    ])
    const items = (itemsRaw ?? []) as AvatarItem[]
    const owned = new Set((ownedRaw ?? []).map((r) => (r as { item_slug: string }).item_slug))

    // 3) Mastery rollup for any unlock-gated items (students only — staff
    //    bypass the gate).
    const unlockTargetIds = isStaff ? [] : [...new Set(items.map((i) => i.unlock_target_id).filter(Boolean) as string[])]
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

    // 4) Compute per-item state. Staff path is uniform: owned or staff_free.
    const catalog: CatalogEntry[] = items.map((item) => {
      if (owned.has(item.slug)) return { ...item, state: 'owned' }
      if (isStaff) return { ...item, state: 'staff_free' }
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
      isStaff,
      alias,
      use_custom_avatar,
    })
  } catch (error) {
    console.error('Error in GET /api/avatar:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Re-export slot type so other routes can reuse it.
export type { ItemSlot }
