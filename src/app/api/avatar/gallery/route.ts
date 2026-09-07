import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ITEM_COLUMNS } from '@/lib/avatar/server'
import { withDefaults } from '@/lib/avatar/types'
export interface GalleryAvatar { user_id: string; name: string; traits: Record<string, string>; equipped: Record<string, string>; likes: number | null; liked_by_me: boolean; is_me: boolean }
export const GET = withAuth(async (request, ctx) => {
  const offset = Number(request.nextUrl.searchParams.get('offset') ?? 0)
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000) return NextResponse.json({ error: 'Invalid page.' }, { status: 400 })
  const { data, error } = await supabaseAdmin.rpc('avatar_gallery_page', { p_user_id: ctx.userId, p_role: ctx.role, p_email: ctx.scopeEmail, p_offset: offset })
  if (error) throw error
  const rows = data as GalleryAvatar[]
  const avatars = rows.slice(0, 48).map(a => ({ ...a, traits: withDefaults(a.traits) }))
  const slugs = [...new Set(avatars.flatMap(a => Object.values(a.equipped ?? {})))]
  const items = slugs.length ? await supabaseAdmin.from('avatar_items').select(ITEM_COLUMNS).in('slug', slugs) : { data: [], error: null }
  if (items.error) throw items.error
  return NextResponse.json({ avatars, items: items.data, next_offset: rows.length > 48 ? offset + 48 : null })
})
