import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { avatarError } from '@/lib/avatar/server'
export const POST = withAuth(async (request, ctx) => {
  const body = await request.json().catch(() => null)
  if (typeof body?.target_user_id !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.target_user_id) || typeof body.liked !== 'boolean') return NextResponse.json({ error: 'Invalid appreciation request.' }, { status: 400 })
  const { data, error } = await supabaseAdmin.rpc('set_avatar_like', { p_user_id: ctx.userId, p_target: body.target_user_id, p_liked: body.liked, p_role: ctx.role, p_email: ctx.scopeEmail })
  return error ? avatarError(error) : NextResponse.json(data)
})
