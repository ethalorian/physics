import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/avatar/like { target_user_id } — toggle a "like" on another
// student's Mii. Returns the new liked state + total like count for that avatar.
export const POST = withAuth(async (request, ctx) => {
  const body = await request.json().catch(() => ({}))
  const target = String((body as { target_user_id?: unknown }).target_user_id ?? '')
  if (!target) return NextResponse.json({ error: 'Missing target_user_id' }, { status: 400 })
  if (target === ctx.userId) return NextResponse.json({ error: 'You cannot like your own avatar' }, { status: 400 })

  const { data: existing } = await supabaseAdmin
    .from('avatar_likes')
    .select('target_user_id')
    .eq('liker_user_id', ctx.userId)
    .eq('target_user_id', target)
    .maybeSingle()

  if (existing) {
    await supabaseAdmin.from('avatar_likes').delete().eq('liker_user_id', ctx.userId).eq('target_user_id', target)
  } else {
    await supabaseAdmin.from('avatar_likes').insert({ liker_user_id: ctx.userId, target_user_id: target })
  }

  const { count } = await supabaseAdmin
    .from('avatar_likes')
    .select('*', { count: 'exact', head: true })
    .eq('target_user_id', target)

  return NextResponse.json({ liked: !existing, count: count ?? 0 })
})
