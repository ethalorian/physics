import { NextResponse } from 'next/server'
import { withAuth, type AuthContext } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getCourseOwnerEmail } from '@/lib/teacher-scope'
import { getCourseWindows } from '@/lib/lesson-windows'

// Per-class lesson open/close windows. Only the OWNING teacher (or that teacher
// via admin) manages a class's windows — admins don't reach into per-class
// release (they own the global published flag instead).

async function assertOwner(
  ctx: AuthContext<{ courseId: string }>,
  courseId: string,
): Promise<{ ok: true; email: string } | { ok: false; status: number }> {
  if (ctx.role !== 'admin' && ctx.role !== 'teacher') return { ok: false, status: 403 }
  const owner = await getCourseOwnerEmail(courseId)
  if (ctx.role === 'teacher' && owner !== ctx.scopeEmail) return { ok: false, status: 403 }
  return { ok: true, email: ctx.scopeEmail }
}

export const GET = withAuth<{ courseId: string }>(async (_request, ctx) => {
    const { courseId } = await ctx.params
    const auth = await assertOwner(ctx, courseId)
    if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: auth.status })
    return NextResponse.json({ windows: await getCourseWindows(courseId) })
})

// POST { lesson_id, open_at, close_at } — set/clear a window. Null dates clear
// that bound; clearing both removes the row (lesson reverts to open-by-default).
export const POST = withAuth<{ courseId: string }>(async (request, ctx) => {
    const { courseId } = await ctx.params
    const auth = await assertOwner(ctx, courseId)
    if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: auth.status })

    const body = await request.json()
    const lessonId: string | undefined = body.lesson_id
    if (!lessonId) return NextResponse.json({ error: 'lesson_id required' }, { status: 400 })
    const openAt: string | null = body.open_at || null
    const closeAt: string | null = body.close_at || null

    if (!openAt && !closeAt) {
      await supabaseAdmin.from('lesson_class_windows').delete().eq('course_id', courseId).eq('lesson_id', lessonId)
      return NextResponse.json({ ok: true, cleared: true })
    }

    const { error } = await supabaseAdmin
      .from('lesson_class_windows')
      .upsert(
        { course_id: courseId, lesson_id: lessonId, open_at: openAt, close_at: closeAt, set_by: auth.email, updated_at: new Date().toISOString() },
        { onConflict: 'course_id,lesson_id' },
      )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
})
