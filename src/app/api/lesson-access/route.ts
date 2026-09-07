import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { canEditArea } from '@/lib/content-access'
import { releaseClasses, releaseLessons } from '@/lib/lesson-release-server'
import type { ReleaseWindow } from '@/lib/lesson-release'

export const GET = withRole(['teacher', 'admin'], async (_request, ctx) => {
  const [classes, lessons, canEdit] = await Promise.all([releaseClasses(ctx.scopeEmail, ctx.role === 'admin'), releaseLessons(), canEditArea(ctx.email, 'lessons', ctx.realRole === 'admin')])
  const windows: Record<string, ReleaseWindow> = {}
  if (classes.length) {
    const wins = await supabaseAdmin.from('lesson_class_windows').select('course_id, lesson_id, open_at, close_at').in('course_id', classes.map(c => c.id))
    if (wins.error) throw wins.error
    for (const w of wins.data ?? []) windows[`${w.course_id}|${w.lesson_id}`] = { open_at: w.open_at, close_at: w.close_at }
  }
  return NextResponse.json({ classes, lessons, windows, canEdit })
})
