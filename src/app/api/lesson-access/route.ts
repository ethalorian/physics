import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/lesson-access
// Everything the unified Lesson-access board needs in one shot: the teacher's
// classes, every published lesson, and all current open/close windows keyed by
// `${course_id}|${lesson_id}`. Access (open/close) is a teacher concern; the
// global `published` flag (admin-only) is reflected here read-only.
export const GET = withRole(['teacher', 'admin'], async (_request, ctx) => {
  const { data: owned } = await supabaseAdmin
    .from('courses').select('id, name, section').eq('teacher_email', ctx.scopeEmail).order('section')
  let classes = (owned ?? []) as { id: string; name: string; section: string | null }[]
  if (classes.length === 0 && ctx.role === 'admin') {
    const { data: all } = await supabaseAdmin.from('courses').select('id, name, section').order('section')
    classes = (all ?? []) as { id: string; name: string; section: string | null }[]
  }
  const courseIds = classes.map((c) => c.id)

  const { data: lessonRows } = await supabaseAdmin
    .from('lessons')
    .select('id, title, slug, unit, lesson_number, published')
    .order('lesson_number', { ascending: true })
  const lessons = (lessonRows ?? []) as {
    id: string; title: string; slug: string; unit: string | null; lesson_number: number | null; published: boolean
  }[]

  const windows: Record<string, { open_at: string | null; close_at: string | null }> = {}
  if (courseIds.length > 0) {
    const { data: wins } = await supabaseAdmin
      .from('lesson_class_windows')
      .select('course_id, lesson_id, open_at, close_at')
      .in('course_id', courseIds)
    for (const w of (wins ?? []) as { course_id: string; lesson_id: string; open_at: string | null; close_at: string | null }[]) {
      windows[`${w.course_id}|${w.lesson_id}`] = { open_at: w.open_at, close_at: w.close_at }
    }
  }

  return NextResponse.json({ classes, lessons, windows })
})
