/**
 * Fetch avatar bundles for a set of students so the lobby can render the same
 * Mii avatars the rest of the app uses. Returns a shared item catalog (the
 * client resolves equipped slugs → SVG layers from it) plus per-user
 * traits/equipped. Mirrors the data shape of /api/avatar/gallery.
 */
import { supabaseAdmin } from '@/lib/supabase'
import type { AvatarItem } from '@/lib/avatar/types'

export interface AvatarBundle {
  traits: Record<string, string>
  equipped: Record<string, string>
}

export async function getAvatarData(
  gids: string[],
): Promise<{ items: AvatarItem[]; byUser: Record<string, AvatarBundle> }> {
  if (gids.length === 0) return { items: [], byUser: {} }

  const { data: avs } = await supabaseAdmin
    .from('student_avatars')
    .select('user_id, traits, equipped')
    .in('user_id', gids)

  const byUser: Record<string, AvatarBundle> = {}
  const slugs = new Set<string>()
  for (const r of (avs ?? []) as { user_id: string; traits: Record<string, string> | null; equipped: Record<string, string> | null }[]) {
    const traits = r.traits ?? {}
    const equipped = r.equipped ?? {}
    byUser[r.user_id] = { traits, equipped }
    for (const slug of Object.values(equipped)) if (slug) slugs.add(slug)
  }

  let items: AvatarItem[] = []
  if (slugs.size > 0) {
    const { data: it } = await supabaseAdmin
      .from('avatar_items')
      .select('slug, slot, name, cost_xp, unlock_target_id, unlock_min_level, svg_layer, z_order')
      .in('slug', [...slugs])
    items = (it ?? []) as AvatarItem[]
  }

  return { items, byUser }
}
