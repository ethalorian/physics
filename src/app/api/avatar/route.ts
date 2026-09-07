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
  const targets = [...new Set(items.flatMap(i => i.unlock_target_id ? [i.unlock_target_id] : []))]
  const levels = new Map<string, number>(); const statements = new Map<string, string>()
  if (targets.length) {
    const [targetRows, ...rollups] = await Promise.all([
      supabaseAdmin.from('learning_targets').select('id, statement').in('id', targets),
      ...targets.map(id => supabaseAdmin.rpc('avatar_target_level', { p_user_id: ctx.userId, p_target_id: id })),
    ])
    if (targetRows.error) throw targetRows.error
    for (const t of targetRows.data ?? []) statements.set(t.id, t.statement)
    rollups.forEach((r, index) => { if (r.error) throw r.error; levels.set(targets[index], Number(r.data)) })
  }
  const catalog: CatalogEntry[] = items.map(item => {
    const level = item.unlock_target_id ? levels.get(item.unlock_target_id) ?? 0 : 0
    const state = owned.has(item.slug) ? 'owned' : isStaff ? 'staff_free' : item.unlock_target_id ? (level >= Number(item.unlock_min_level ?? 2.5) ? 'unlock_available' : 'locked_until_mastery') : item.cost_xp == null ? 'locked_until_mastery' : totals.balance >= item.cost_xp ? 'affordable' : 'too_expensive'
    return { ...item, unlock_min_level: item.unlock_min_level == null ? null : Number(item.unlock_min_level), state, unlock_progress: level, target_statement: item.unlock_target_id ? statements.get(item.unlock_target_id) ?? 'Learning target' : null }
  })
  return NextResponse.json({ user_id: ctx.userId, traits: withDefaults(avatar.data?.traits), equipped: avatar.data?.equipped ?? {}, setup_completed: !!avatar.data?.setup_completed, revision: avatar.data?.revision ?? 0, gallery_visible: avatar.data?.gallery_visible ?? false, saved_looks: avatar.data?.saved_looks ?? [], catalog, owned: [...owned], ...totals, isStaff, alias: student.data?.alias ?? null, name: student.data?.name ?? null })
})
