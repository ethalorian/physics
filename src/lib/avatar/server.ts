import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import type { AuthContext } from '@/lib/api-auth'
import { validTraits, validEquipped, withDefaults, type SavedLook } from './types'

export const ITEM_COLUMNS = 'slug, slot, name, cost_xp, unlock_target_id, unlock_min_level, svg_layer, z_order, enabled, render_options'
export function avatarError(error: { message: string }): NextResponse {
  const message = error.message
  if (message.includes('AVATAR_CONFLICT')) return NextResponse.json({ error: 'Your avatar changed in another window. Reload the saved version or review and retry your draft.', conflict: true }, { status: 409 })
  if (message.includes('ALIAS_TAKEN')) return NextResponse.json({ error: 'That display name is taken. Try another.' }, { status: 409 })
  if (message.includes('INSUFFICIENT_FUNDS')) return NextResponse.json({ error: 'Not enough XP. Your balance may have changed.' }, { status: 400 })
  if (message.includes('MASTERY_REQUIRED')) return NextResponse.json({ error: 'Reach the listed mastery level before claiming this item.' }, { status: 400 })
  if (message.includes('ITEM_NOT_OWNED')) return NextResponse.json({ error: 'Buy or claim the item before saving this outfit.' }, { status: 400 })
  if (/UNKNOWN_ITEM|ITEM_UNAVAILABLE|INVALID_TARGET/.test(message)) return NextResponse.json({ error: 'That item or avatar is no longer available.' }, { status: 404 })
  console.error('[avatar]', message)
  return NextResponse.json({ error: 'Could not save your changes. Please try again.' }, { status: 500 })
}
export async function saveAvatar(request: Request, ctx: AuthContext): Promise<Response> {
  const body: unknown = await request.json().catch(() => null)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Invalid avatar request.' }, { status: 400 })
  const b = body as Record<string, unknown>
  const patch: Record<string, unknown> = {}
  const allowed = ['revision', 'traits', 'equipped', 'complete', 'gallery_visible', 'alias', 'saved_looks']
  const invalid = () => NextResponse.json({ error: 'Invalid avatar settings. Reload and try again.' }, { status: 400 })
  if (!Number.isSafeInteger(b.revision) || Number(b.revision) < 0 || Object.keys(b).some(k => !allowed.includes(k))) return invalid()
  if ('traits' in b) { if (!validTraits(b.traits)) return invalid(); patch.traits = b.traits }
  if ('equipped' in b) { if (!validEquipped(b.equipped)) return invalid(); patch.equipped = b.equipped }
  for (const key of ['complete', 'gallery_visible']) if (key in b) { if (typeof b[key] !== 'boolean') return invalid(); patch[key] = b[key] }
  if ('alias' in b) {
    if (b.alias !== null && typeof b.alias !== 'string') return invalid()
    const alias = typeof b.alias === 'string' ? b.alias.trim() : ''
    if (alias.length > 32 || (alias && !/^[\p{L}\p{N} ._'-]+$/u.test(alias))) return NextResponse.json({ error: 'Use up to 32 letters, numbers, spaces, dots, apostrophes, underscores or hyphens.' }, { status: 400 })
    patch.alias = alias || null
  }
  if ('saved_looks' in b) {
    if (!Array.isArray(b.saved_looks) || b.saved_looks.length > 6) return invalid()
    const looks: SavedLook[] = []
    for (const look of b.saved_looks) {
      if (!look || typeof look !== 'object' || typeof look.name !== 'string' || !look.name.trim() || look.name.length > 32 || !validTraits(look.traits) || !validEquipped(look.equipped)) return invalid()
      looks.push({ name: look.name.trim(), traits: withDefaults(look.traits), equipped: look.equipped })
    }
    patch.saved_looks = looks
  }
  const { data, error } = await supabaseAdmin.rpc('save_avatar_state', { p_user_id: ctx.userId, p_revision: b.revision, p_patch: patch })
  if (error) return avatarError(error)
  return NextResponse.json({ ok: true, ...data, traits: withDefaults(data.traits) })
}
