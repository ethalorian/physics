import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getBalance } from '@/lib/points'
import { ITEM_COLUMNS, saveAvatar } from '@/lib/avatar/server'
import { withDefaults, type AvatarItem, type CatalogEntry } from '@/lib/avatar/types'
export type { ItemSlot, CatalogState } from '@/lib/avatar/types'
export const PATCH = withAuth(saveAvatar)
export const GET = withAuth(async (_request, ctx) => {
  const isStaff = ctx.realRole === 'admin' || ctx.realRole === 'teacher'
  const [avatar, student, itemsResult, ownedResult, totals] = await Promise.all([
    supabaseAdmin.from('student_avatars').select('traits, equipped, setup_completed, revision, gallery_visible, saved_looks').eq('user_id', ctx.userId).maybeSingle(),
    supabaseAdmin.from('students').select('alias, name').eq('id', ctx.userId).maybeSingle(),
    supabaseAdmin.from('avatar_items').select(ITEM_COLUMNS).order('sort_order').limit(1000),
    supabaseAdmin.from('student_owned_items').select('item_slug').eq('user_id', ctx.userId).limit(1000),
    isStaff ? Promise.resolve({ balance: 0, lifetimeEarned: 0, spent: 0 }) : getBalance(ctx.userId),
  ])
  for (const r of [avatar, student, itemsResult, ownedResult]) if (r.error) throw r.error
  const owned = new Set((ownedResult.data ?? []).map(r => r.item_slug))
  const items = (itemsResult.data as unknown as AvatarItem[]).filter(i => i.enabled || owned.has(i.slug))
  const catalog: CatalogEntry[] = items.map(item => ({
    ...item,
    state: owned.has(item.slug) ? 'owned' : 'unlock_available',
  }))
  return NextResponse.json({ user_id: ctx.userId, traits: withDefaults(avatar.data?.traits), equipped: avatar.data?.equipped ?? {}, setup_completed: !!avatar.data?.setup_completed, revision: avatar.data?.revision ?? 0, gallery_visible: avatar.data?.gallery_visible ?? false, saved_looks: avatar.data?.saved_looks ?? [], catalog, owned: [...owned], ...totals, isStaff, alias: student.data?.alias ?? null, name: student.data?.name ?? null })
})
