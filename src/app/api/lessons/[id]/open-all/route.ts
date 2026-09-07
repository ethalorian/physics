import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { releaseClasses, releaseLessons } from '@/lib/lesson-release-server'
import { appliesToClass } from '@/lib/lesson-release'

export const POST = withRole<{ id: string }>(['teacher', 'admin'], async (request, ctx) => {
  const { id: lessonId } = await ctx.params
  const body = await request.json().catch(() => null)
  if (!body || !['open', 'close'].includes(body.action)) return NextResponse.json({ error: 'Choose open or close.' }, { status: 400 })
  const classes = await releaseClasses(ctx.scopeEmail, ctx.role === 'admin')
  const lesson = (await releaseLessons()).find(l => l.id === lessonId)
  if (body.action === 'open' && !lesson) return NextResponse.json({ error: 'Only published lessons can be released.' }, { status: 422 })
  const ids = classes.filter(c => body.action === 'close' || (lesson && appliesToClass(lesson, c))).map(c => c.id)
  if (!ids.length) return NextResponse.json({ ok: true, count: 0, action: body.action })
  const now = new Date().toISOString()
  const result = body.action === 'close'
    ? await supabaseAdmin.from('lesson_class_windows').delete().eq('lesson_id', lessonId).in('course_id', ids)
    : await supabaseAdmin.from('lesson_class_windows').upsert(ids.map(course_id => ({ course_id, lesson_id: lessonId, open_at: now, close_at: null, set_by: ctx.scopeEmail, updated_at: now })), { onConflict: 'course_id,lesson_id' })
  if (result.error) throw result.error
  return NextResponse.json({ ok: true, count: ids.length, action: body.action })
})
