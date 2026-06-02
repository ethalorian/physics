import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/lessons/[id]/open-all  { action?: 'open' | 'close' }
// One-click release: open (or close) this lesson for every class the teacher
// owns. "open" upserts an open-now window (open_at = now, no close) for each
// class; "close" removes those windows so the lesson reverts to closed-by-default.
export const POST = withRole<{ id: string }>(['teacher', 'admin'], async (request, ctx) => {
  const { id: lessonId } = await ctx.params
  const body = (await request.json().catch(() => ({}))) as { action?: string }
  const action = body.action === 'close' ? 'close' : 'open'

  // The teacher's own classes (admins with no owned classes fall back to all).
  const { data: owned } = await supabaseAdmin.from('courses').select('id').eq('teacher_email', ctx.scopeEmail)
  let courseIds = (owned ?? []).map((c) => (c as { id: string }).id)
  if (courseIds.length === 0 && ctx.role === 'admin') {
    const { data: all } = await supabaseAdmin.from('courses').select('id')
    courseIds = (all ?? []).map((c) => (c as { id: string }).id)
  }
  if (courseIds.length === 0) return NextResponse.json({ ok: true, count: 0, action })

  if (action === 'close') {
    const { error } = await supabaseAdmin
      .from('lesson_class_windows')
      .delete()
      .eq('lesson_id', lessonId)
      .in('course_id', courseIds)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, count: courseIds.length, action })
  }

  const now = new Date().toISOString()
  const rows = courseIds.map((cid) => ({
    course_id: cid, lesson_id: lessonId, open_at: now, close_at: null, set_by: ctx.scopeEmail, updated_at: now,
  }))
  const { error } = await supabaseAdmin
    .from('lesson_class_windows')
    .upsert(rows, { onConflict: 'course_id,lesson_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, count: courseIds.length, action })
})
