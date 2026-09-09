import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

/** Notifications contain no data; authoritative commands always use the authenticated APIs. */
export const GET = withRole<{ id: string }>(['teacher', 'admin'], async (_request, ctx) => {
  const { id } = await ctx.params
  const { data, error } = await supabaseAdmin.from('present_sessions').select('id, teacher_id').eq('id', id).maybeSingle()
  if (error) return NextResponse.json({ error: 'Could not connect' }, { status: 503 })
  if (!data || (ctx.role !== 'admin' && data.teacher_id !== ctx.userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return NextResponse.json({ realtime: url && key ? { url, key, topic: `present:${id}` } : null }, { headers: { 'Cache-Control': 'no-store' } })
})
