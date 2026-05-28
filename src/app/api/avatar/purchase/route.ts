import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getBalance } from '@/lib/points'
import { getEffectiveContext } from '@/lib/effective-context'

// POST /api/avatar/purchase  { slug: string }
// Spends XP for a purchasable avatar item OR claims a mastery-unlocked item
// (cost_xp NULL). On success: writes a row to student_owned_items, and for
// purchases also writes an approved reward_redemption so the XP balance ledger
// reflects the spend automatically (no duplicate balance source).

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || !session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id
    const userEmail = session.user.email

    const body = await request.json()
    const slug = (body?.slug ?? '') as string
    if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

    // Item must exist + be enabled.
    const { data: itemRow } = await supabaseAdmin
      .from('avatar_items')
      .select('slug, name, cost_xp, unlock_target_id, unlock_min_level, enabled')
      .eq('slug', slug)
      .maybeSingle()
    const item = itemRow as { slug: string; name: string; cost_xp: number | null; unlock_target_id: string | null; unlock_min_level: number | null; enabled: boolean } | null
    if (!item || !item.enabled) return NextResponse.json({ error: 'Unknown item' }, { status: 404 })

    // Already owned? No-op.
    const { data: alreadyOwned } = await supabaseAdmin
      .from('student_owned_items')
      .select('item_slug')
      .eq('user_id', userId)
      .eq('item_slug', slug)
      .maybeSingle()
    if (alreadyOwned) return NextResponse.json({ ok: true, already_owned: true })

    // Staff (teacher + admin) grant — bypass XP balance + mastery gate.
    const ctx = await getEffectiveContext(userEmail)
    const isStaff = ctx.realRole === 'admin' || ctx.realRole === 'teacher'
    if (isStaff) {
      const { error: ownErr } = await supabaseAdmin.from('student_owned_items').insert({
        user_id: userId, item_slug: slug, source: 'admin_grant',
      })
      if (ownErr) return NextResponse.json({ error: ownErr.message }, { status: 500 })
      return NextResponse.json({ ok: true, source: 'staff_free' })
    }

    // PURCHASE path (cost_xp set): validate balance, spend, grant.
    if (item.cost_xp != null) {
      const balance = await getBalance(userId)
      if (balance.balance < item.cost_xp) {
        return NextResponse.json({ error: 'Not enough XP', need: item.cost_xp, balance: balance.balance }, { status: 400 })
      }
      // Insert redemption row first (this is what the balance helper reads).
      const { error: redErr } = await supabaseAdmin.from('reward_redemptions').insert({
        user_id: userId,
        user_email: userEmail,
        reward_id: null,
        reward_name: `Avatar item: ${item.name}`,
        cost_points: item.cost_xp,
        status: 'approved',
        fulfilled_at: new Date().toISOString(),
        fulfilled_by: 'system',
        note: `avatar:${slug}`,
      })
      if (redErr) return NextResponse.json({ error: redErr.message }, { status: 500 })
      const { error: ownErr } = await supabaseAdmin.from('student_owned_items').insert({
        user_id: userId, item_slug: slug, source: 'purchase',
      })
      if (ownErr) return NextResponse.json({ error: ownErr.message }, { status: 500 })
      const newBalance = await getBalance(userId)
      return NextResponse.json({ ok: true, source: 'purchase', balance: newBalance.balance })
    }

    // UNLOCK CLAIM path (cost_xp null, has unlock_target_id): verify mastery threshold met.
    if (item.unlock_target_id) {
      const { data: recs } = await supabaseAdmin
        .from('mastery_records')
        .select('level, observed_at')
        .eq('user_id', userId)
        .eq('target_id', item.unlock_target_id)
        .order('observed_at', { ascending: true })
      // Inline decaying-average to avoid pulling the whole curriculum helper here.
      const levels = ((recs ?? []) as { level: number }[]).map((r) => r.level)
      if (levels.length === 0) return NextResponse.json({ error: 'Not yet eligible to unlock' }, { status: 400 })
      let v = levels[0]
      const w = 0.60
      for (let i = 1; i < levels.length; i++) v = (1 - w) * v + w * levels[i]
      const need = item.unlock_min_level ?? 2.5
      if (v < need) return NextResponse.json({ error: 'Not yet eligible to unlock', current: v, need }, { status: 400 })

      const { error: ownErr } = await supabaseAdmin.from('student_owned_items').insert({
        user_id: userId, item_slug: slug, source: 'unlock',
      })
      if (ownErr) return NextResponse.json({ error: ownErr.message }, { status: 500 })
      return NextResponse.json({ ok: true, source: 'unlock' })
    }

    return NextResponse.json({ error: 'Item is not purchasable' }, { status: 400 })
  } catch (error) {
    console.error('Error in POST /api/avatar/purchase:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
