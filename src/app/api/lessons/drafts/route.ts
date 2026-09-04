import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAuth, withEnrolledStudent } from '@/lib/api-auth'

// Autosave drafts for a lesson's capture blocks (decision 2026-09-04, "save as you type").
//
//   POST { lesson_id, drafts: [{ block_id, block_type?, response }] }
//        → ONE upsert for the whole batch, no side effects. The client batches and
//          debounces (useBlockResponses.draft), so a typing student costs the
//          backend one small write every few seconds, not one per keystroke.
//   GET  ?lesson_id=… → { drafts: { [block_id]: { response, updated_at } } } (own only)
//
// A draft is NOT evidence: it never awards XP, never counts toward progress, never
// enters the grading queue. block_responses (explicit Save) remains the record and
// clears the draft. sendBeacon can only POST, which is why this is POST not PUT.

const MAX_DRAFTS = 40
const MAX_BYTES = 200_000 // a sketch's strokes; anything larger is dropped, not stored

export const POST = withEnrolledStudent(async (request, ctx) => {
  const body = await request.json().catch(() => null) as { lesson_id?: string; drafts?: { block_id?: string; block_type?: string; response?: unknown }[] } | null
  const lessonId = body?.lesson_id
  if (!lessonId || !Array.isArray(body?.drafts)) return NextResponse.json({ error: 'Missing lesson_id or drafts' }, { status: 400 })
  const now = new Date().toISOString()
  const rows = body!.drafts!
    .filter((d) => typeof d.block_id === 'string' && d.block_id && d.response !== undefined && d.response !== null)
    .slice(0, MAX_DRAFTS)
    .filter((d) => JSON.stringify(d.response).length <= MAX_BYTES)
    .map((d) => ({ user_id: ctx.userId, lesson_id: lessonId, block_id: d.block_id!, block_type: typeof d.block_type === 'string' ? d.block_type : null, response: d.response, updated_at: now }))
  if (rows.length === 0) return NextResponse.json({ ok: true, saved: 0 })
  const { error } = await supabaseAdmin.from('block_drafts').upsert(rows, { onConflict: 'user_id,lesson_id,block_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, saved: rows.length, updated_at: now })
})

export const GET = withAuth(async (request, ctx) => {
  const { searchParams } = new URL(request.url)
  const lessonId = searchParams.get('lesson_id')
  if (!lessonId) return NextResponse.json({ error: 'Missing lesson_id' }, { status: 400 })
  const { data } = await supabaseAdmin
    .from('block_drafts')
    .select('block_id, response, updated_at')
    .eq('lesson_id', lessonId)
    .eq('user_id', ctx.userId)
  const drafts: Record<string, { response: unknown; updated_at: string }> = {}
  for (const r of (data ?? []) as { block_id: string; response: unknown; updated_at: string }[]) drafts[r.block_id] = { response: r.response, updated_at: r.updated_at }
  return NextResponse.json({ drafts })
})
