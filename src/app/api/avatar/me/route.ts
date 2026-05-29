import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import type { AvatarItem, AvatarTraits, EquippedItems } from '@/lib/avatar/types'

// GET /api/avatar/me
// Lightweight bundle for chrome (AccountMenu, navbar, any compact surface
// that needs to render the student's avatar). Returns ONLY what's needed to
// draw the composed Mii — no full catalog, no balance. Designed to be cheap
// enough to call from every signed-in page.

export interface MeBundle {
  use_custom_avatar: boolean
  alias: string | null
  setup_completed: boolean
  traits: AvatarTraits | null
  equipped: EquippedItems
  equipped_items: AvatarItem[]
}

export const GET = withAuth(async (request, ctx) => {
    const userId = ctx.userId

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

    const traits = avatarRow?.setup_completed ? (avatarRow.traits as AvatarTraits) : null
    const equipped = ((avatarRow?.equipped as EquippedItems) ?? {})
    const equippedSlugs = Object.values(equipped).filter((s): s is string => typeof s === 'string')

    let equipped_items: AvatarItem[] = []
    if (equippedSlugs.length > 0) {
      const { data: items } = await supabaseAdmin
        .from('avatar_items')
        .select('slug, slot, name, cost_xp, unlock_target_id, unlock_min_level, svg_layer, z_order')
        .in('slug', equippedSlugs)
      equipped_items = (items ?? []) as AvatarItem[]
    }

    const bundle: MeBundle = {
      use_custom_avatar: !!avatarRow?.use_custom_avatar,
      alias: (studentRow as { alias?: string | null } | null)?.alias ?? null,
      setup_completed: !!avatarRow?.setup_completed,
      traits,
      equipped,
      equipped_items,
    }
    return NextResponse.json(bundle)
})
