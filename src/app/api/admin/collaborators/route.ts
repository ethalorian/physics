import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ALL_CONTENT_AREAS, type ContentArea } from '@/lib/content-access'

// Admin-only: manage curriculum collaborators — people granted edit rights to
// specific curriculum AREAS. Admins author everything; a collaborator authors only
// the areas listed here. Teachers (no grant) author nothing.

type GrantRow = { email: string; area: ContentArea; granted_at: string | null; granted_by: string | null }

export const GET = withRole('admin', async () => {
  const { data } = await supabaseAdmin
    .from('content_editor_grants')
    .select('email, area, granted_at, granted_by')
    .order('email', { ascending: true })
  const rows = (data ?? []) as GrantRow[]

  const byEmail = new Map<string, { email: string; areas: ContentArea[] }>()
  for (const r of rows) {
    if (!byEmail.has(r.email)) byEmail.set(r.email, { email: r.email, areas: [] })
    byEmail.get(r.email)!.areas.push(r.area)
  }
  return NextResponse.json({
    collaborators: [...byEmail.values()],
    areas: ALL_CONTENT_AREAS,
  })
})

export const POST = withRole('admin', async (request, ctx) => {
  const body = (await request.json()) as { email?: string; area?: string; grant?: boolean }
  const email = (body.email ?? '').trim()
  const area = body.area as ContentArea
  if (!email || !email.includes('@') || !ALL_CONTENT_AREAS.includes(area)) {
    return NextResponse.json({ error: 'A valid email and a known area are required' }, { status: 400 })
  }
  // Guard: never grant an area to an admin via this list (they already have all),
  // and avoid no-op self entries — purely cosmetic, keeps the list meaningful.

  if (body.grant === false) {
    const { error } = await supabaseAdmin
      .from('content_editor_grants')
      .delete()
      .eq('email', email)
      .eq('area', area)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, granted: false })
  }

  const { error } = await supabaseAdmin
    .from('content_editor_grants')
    .upsert({ email, area, granted_by: ctx.email }, { onConflict: 'email,area' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, granted: true })
})
