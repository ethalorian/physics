import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { avatarError } from '@/lib/avatar/server'
export const POST = withAuth(async (request, ctx) => {
  const body = await request.json().catch(() => null)
  if (typeof body?.slug !== 'string' || !/^[a-z0-9-]{1,80}$/.test(body.slug)) return NextResponse.json({ error: 'Choose a valid item.' }, { status: 400 })
  const { data, error } = await supabaseAdmin.rpc('purchase_avatar_item', { p_user_id: ctx.userId, p_email: ctx.email, p_slug: body.slug, p_staff: ctx.realRole === 'admin' || ctx.realRole === 'teacher' })
  return error ? avatarError(error) : NextResponse.json(data)
})
