import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { isStaff } from '@/lib/arcade'
import { avatarError } from '@/lib/avatar/server'
// Shares the avatar/store spend lock; charge and play creation roll back together.
export const POST = withAuth(async (request, ctx) => {
  const body = await request.json().catch(() => null)
  if (typeof body?.slug !== 'string' || !/^[a-z0-9-]{1,80}$/.test(body.slug)) return NextResponse.json({ error: 'Missing game slug' }, { status: 400 })
  const { data, error } = await supabaseAdmin.rpc('purchase_arcade_play', { p_user_id: ctx.userId, p_email: ctx.email, p_slug: body.slug, p_staff: isStaff(ctx) })
  return error ? avatarError(error) : NextResponse.json(data)
})
