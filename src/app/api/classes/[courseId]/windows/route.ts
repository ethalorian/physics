import { NextResponse } from 'next/server'
import { withAuth, type AuthContext } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { appliesToClass, validateReleaseWindow } from '@/lib/lesson-release'
import { releaseLessons } from '@/lib/lesson-release-server'
import { getCourseWindows } from '@/lib/lesson-windows'

// Per-class lesson open/close windows. Only the OWNING teacher (or that teacher
// via admin) manages a class's windows — admins don't reach into per-class
// release (they own the global published flag instead).

async function assertOwner(
  ctx: AuthContext<{ courseId: string }>,
  courseId: string,
): Promise<{ ok: true; email: string } | { ok: false; status: number }> {
  if (ctx.role !== 'admin' && ctx.role !== 'teacher') return { ok: false, status: 403 }
  const { data: course, error } = await supabaseAdmin.from('courses').select('teacher_email').eq('id', courseId).maybeSingle()
  if (error) throw error
  if (!course) return { ok: false, status: 404 }
  if (ctx.role === 'teacher' && course.teacher_email !== ctx.scopeEmail) return { ok: false, status: 403 }
  return { ok: true, email: ctx.scopeEmail }
}

export const GET = withAuth<{ courseId: string }>(async (_request, ctx) => {
    const { courseId } = await ctx.params
    const auth = await assertOwner(ctx, courseId)
    if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: auth.status })
    return NextResponse.json({ windows: await getCourseWindows(courseId) })
})

// POST { lesson_id, open_at, close_at } — set/clear a window. To OPEN a lesson
// now, send open_at = now (close_at null). Clearing both removes the row, which
// now means the lesson is CLOSED for this class (closed-by-default).
export const POST = withAuth<{ courseId: string }>(async (request, ctx) => {
    const { courseId } = await ctx.params
    const auth = await assertOwner(ctx, courseId)
    if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: auth.status })

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid schedule.' }, { status: 400 })
    const lessonId: string | undefined = body.lesson_id
    if (!lessonId || typeof lessonId !== 'string') return NextResponse.json({ error: 'lesson_id required' }, { status: 400 })
    const openAt = body.open_at ?? null
    const closeAt = body.close_at ?? null
    const invalid = validateReleaseWindow(openAt, closeAt)
    if (invalid) return NextResponse.json({ error: invalid }, { status: 422 })

    if (!openAt && !closeAt) {
      const { error } = await supabaseAdmin.from('lesson_class_windows').delete().eq('course_id', courseId).eq('lesson_id', lessonId)
      if (error) throw error
      return NextResponse.json({ ok: true, cleared: true })
    }

    const [lessons, course] = await Promise.all([releaseLessons(), supabaseAdmin.from('courses').select('program, track').eq('id', courseId).single()])
    if (course.error) throw course.error
    const lesson = lessons.find(l => l.id === lessonId)
    if (!lesson || !appliesToClass(lesson, course.data)) return NextResponse.json({ error: 'This lesson is not published for this class’s curriculum and track.' }, { status: 422 })

    const { error } = await supabaseAdmin
      .from('lesson_class_windows')
      .upsert(
        { course_id: courseId, lesson_id: lessonId, open_at: openAt, close_at: closeAt, set_by: auth.email, updated_at: new Date().toISOString() },
        { onConflict: 'course_id,lesson_id' },
      )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
})
