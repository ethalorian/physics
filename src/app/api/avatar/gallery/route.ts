import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import type { AvatarItem } from '@/lib/avatar/types'

// GET /api/avatar/gallery
// The whole-school "avatar wall": every student who has completed their Mii AND
// opted to show it (use_custom_avatar). Aliases only. Returns a shared item
// catalog (so the client can render equipped items), per-avatar like counts +
// whether the viewer liked it, and a "featured" set (most-liked first).
export interface GalleryAvatar {
  user_id: string
  name: string
  traits: Record<string, string>
  equipped: Record<string, string>
  likes: number
  liked_by_me: boolean
  is_me: boolean
}

export const GET = withAuth(async (_request, ctx) => {
  const { data: avs } = await supabaseAdmin
    .from('student_avatars')
    .select('user_id, traits, equipped, use_custom_avatar, setup_completed')
    .eq('use_custom_avatar', true)
    .eq('setup_completed', true)
  const rows = (avs ?? []) as { user_id: string; traits: Record<string, string> | null; equipped: Record<string, string> | null }[]
  if (rows.length === 0) return NextResponse.json({ items: [], avatars: [], featured: [] })

  const userIds = rows.map((r) => r.user_id)

  // names (alias preferred; fall back to name; never expose email)
  const { data: students } = await supabaseAdmin
    .from('students').select('google_user_id, alias, name').in('google_user_id', userIds)
  const nameByUser = new Map<string, string>()
  for (const s of (students ?? []) as { google_user_id: string | null; alias: string | null; name: string | null }[]) {
    if (s.google_user_id) nameByUser.set(s.google_user_id, s.alias || s.name || 'Student')
  }

  // resolve every equipped slug → a shared AvatarItem catalog the client renders
  const slugs = new Set<string>()
  for (const r of rows) for (const slug of Object.values(r.equipped ?? {})) if (slug) slugs.add(slug)
  let items: AvatarItem[] = []
  if (slugs.size > 0) {
    const { data: it } = await supabaseAdmin
      .from('avatar_items')
      .select('slug, slot, name, cost_xp, unlock_target_id, unlock_min_level, svg_layer, z_order')
      .in('slug', [...slugs])
    items = (it ?? []) as AvatarItem[]
  }

  // likes: count per target + which the viewer liked
  const { data: likeRows } = await supabaseAdmin
    .from('avatar_likes').select('liker_user_id, target_user_id').in('target_user_id', userIds)
  const likeCount = new Map<string, number>()
  const likedByMe = new Set<string>()
  for (const l of (likeRows ?? []) as { liker_user_id: string; target_user_id: string }[]) {
    likeCount.set(l.target_user_id, (likeCount.get(l.target_user_id) ?? 0) + 1)
    if (l.liker_user_id === ctx.userId) likedByMe.add(l.target_user_id)
  }

  const avatars: GalleryAvatar[] = rows.map((r) => ({
    user_id: r.user_id,
    name: nameByUser.get(r.user_id) ?? 'Student',
    traits: r.traits ?? {},
    equipped: r.equipped ?? {},
    likes: likeCount.get(r.user_id) ?? 0,
    liked_by_me: likedByMe.has(r.user_id),
    is_me: r.user_id === ctx.userId,
  }))
  // most-liked first, then alphabetical for stable ordering
  avatars.sort((a, b) => b.likes - a.likes || a.name.localeCompare(b.name))
  const featured = avatars.filter((a) => a.likes > 0).slice(0, 6)

  return NextResponse.json({ items, avatars, featured })
})
