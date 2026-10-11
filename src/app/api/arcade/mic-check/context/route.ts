import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { currentUnitForCourse } from '@/lib/pacing-server'

// Only the caller's course progression is returned. Avatar art uses the existing /api/avatar/me.
export const GET = withAuth(async (_request, ctx) => {
  if (ctx.realRole === 'admin' || ctx.realRole === 'teacher') {
    return NextResponse.json({ unlockedThrough: 8, preferredUnit: 'unit-1' })
  }
  const { data, error } = await supabaseAdmin.from('course_students')
    .select('course_id, courses ( program )').eq('student_id', ctx.userId)
  if (error) throw error
  const rows = (data ?? []) as unknown as Array<{ course_id: string; courses: { program: string | null } | Array<{ program: string | null }> | null }>
  const ids = [...new Set(rows.filter(row => {
    const courses = Array.isArray(row.courses) ? row.courses : row.courses ? [row.courses] : []
    return courses.some(course => (course.program ?? 'physics') === 'physics')
  }).map(row => row.course_id))]
  const positions = await Promise.all(ids.map(currentUnitForCourse))
  const unlockedThrough = Math.max(1, ...positions.map(position => {
    const match = /^unit-([1-8])$/.exec(position.unitId ?? '')
    return position.program === 'physics' && match ? Number(match[1]) : 1
  }))
  return NextResponse.json({ unlockedThrough, preferredUnit: `unit-${unlockedThrough}` })
})
