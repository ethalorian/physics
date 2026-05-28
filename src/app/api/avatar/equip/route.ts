import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import type { EquippedItems, ItemSlot } from '@/lib/avatar/types'

const VALID_SLOTS: ItemSlot[] = ['eyewear', 'head', 'body', 'pin', 'background', 'facial_hair']

// POST /api/avatar/equip  { slot: ItemSlot, slug: string | null }
// Equips an owned item in a slot, or unequips when slug is null. Validates the
// student owns the slug and that the item belongs to the requested slot.

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    const body = await request.json()
    const slot = body?.slot as ItemSlot
    const slug = (body?.slug ?? null) as string | null
    if (!slot || !VALID_SLOTS.includes(slot)) {
      return NextResponse.json({ error: 'Invalid slot' }, { status: 400 })
    }

    if (slug) {
      // Item must exist + belong to the slot + be owned by this student.
      const [{ data: item }, { data: own }] = await Promise.all([
        supabaseAdmin.from('avatar_items').select('slug, slot').eq('slug', slug).maybeSingle(),
        supabaseAdmin.from('student_owned_items').select('item_slug').eq('user_id', userId).eq('item_slug', slug).maybeSingle(),
      ])
      if (!item) return NextResponse.json({ error: 'Unknown item' }, { status: 404 })
      if ((item as { slot: string }).slot !== slot) return NextResponse.json({ error: 'Item does not belong to that slot' }, { status: 400 })
      if (!own) return NextResponse.json({ error: 'You do not own that item' }, { status: 403 })
    }

    const { data: existing } = await supabaseAdmin
      .from('student_avatars')
      .select('equipped')
      .eq('user_id', userId)
      .maybeSingle()
    const equipped: EquippedItems = { ...((existing?.equipped as EquippedItems) ?? {}) }
    if (slug) equipped[slot] = slug; else delete equipped[slot]

    const { error } = await supabaseAdmin
      .from('student_avatars')
      .upsert({ user_id: userId, equipped, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, equipped })
  } catch (error) {
    console.error('Error in POST /api/avatar/equip:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
