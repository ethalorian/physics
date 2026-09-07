import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ITEM_COLUMNS } from '@/lib/avatar/server'
import { withDefaults } from '@/lib/avatar/types'
import type { AvatarItem, AvatarTraits, EquippedItems } from '@/lib/avatar/types'

// GET /api/avatar/me
// Lightweight bundle for chrome (AccountMenu, navbar, any compact surface
// that needs to render the student's avatar). Returns ONLY what's needed to
// draw the composed Mii — no full catalog, no balance. Designed to be cheap
// enough to call from every signed-in page.

export interface MeBundle {
  alias: string | null
  setup_completed: boolean
  traits: AvatarTraits | null
  equipped: EquippedItems
  equipped_items: AvatarItem[]
}

export const GET = withAuth(async (request, ctx) => {
    const userId = ctx.userId

    const [{ data: avatarRow, error: avatarError }, { data: studentRow, error: studentError }] = await Promise.all([
      supabaseAdmin
        .from('student_avatars')
        .select('traits, equipped, setup_completed')
        .eq('user_id', userId)
        .maybeSingle(),
      supabaseAdmin
        .from('students')
        .select('alias')
        .eq('id', userId)
        .maybeSingle(),
    ])

    if (avatarError) throw avatarError
    if (studentError) throw studentError
    const traits = avatarRow?.setup_completed ? withDefaults(avatarRow.traits) : null
    const equipped = ((avatarRow?.equipped as EquippedItems) ?? {})
    const equippedSlugs = Object.values(equipped).filter((s): s is string => typeof s === 'string')

    let equipped_items: AvatarItem[] = []
    if (equippedSlugs.length > 0) {
      const { data: items, error: itemsError } = await supabaseAdmin
        .from('avatar_items')
        .select(ITEM_COLUMNS)
        .in('slug', equippedSlugs)
      if (itemsError) throw itemsError
      equipped_items = (items ?? []) as AvatarItem[]
    }

    const bundle: MeBundle = {
      alias: (studentRow as { alias?: string | null } | null)?.alias ?? null,
      setup_completed: !!avatarRow?.setup_completed,
      traits,
      equipped,
      equipped_items,
    }
    return NextResponse.json(bundle)
})
