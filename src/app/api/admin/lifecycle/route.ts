import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/admin/lifecycle
// Admin-only. Per-school-year summary that drives the archive / purge UI: how
// many sections each year has, whether it's archived, and how many students are
// enrolled in it. Sections with no school_year set are grouped under "(unset)".
export interface YearSummary {
  school_year: string
  sections: number
  archived_sections: number
  is_archived: boolean      // true when every section in the year is archived
  students: number          // distinct students enrolled in the year's sections
}

export const GET = withRole('admin', async () => {
  const [{ data: courses }, { data: enroll }] = await Promise.all([
    supabaseAdmin.from('courses').select('id, school_year, archived_at'),
    supabaseAdmin.from('course_students').select('course_id, student_id'),
  ])

  const courseYear = new Map<string, string>()
  const byYear = new Map<string, { sections: number; archived: number }>()
  for (const c of (courses ?? []) as { id: string; school_year: string | null; archived_at: string | null }[]) {
    const y = c.school_year ?? '(unset)'
    courseYear.set(c.id, y)
    const agg = byYear.get(y) ?? { sections: 0, archived: 0 }
    agg.sections += 1
    if (c.archived_at) agg.archived += 1
    byYear.set(y, agg)
  }

  const studentsByYear = new Map<string, Set<string>>()
  for (const e of (enroll ?? []) as { course_id: string; student_id: string }[]) {
    const y = courseYear.get(e.course_id)
    if (!y) continue
    if (!studentsByYear.has(y)) studentsByYear.set(y, new Set())
    studentsByYear.get(y)!.add(e.student_id)
  }

  const years: YearSummary[] = [...byYear.entries()]
    .map(([school_year, agg]) => ({
      school_year,
      sections: agg.sections,
      archived_sections: agg.archived,
      is_archived: agg.sections > 0 && agg.archived === agg.sections,
      students: studentsByYear.get(school_year)?.size ?? 0,
    }))
    .sort((a, b) => b.school_year.localeCompare(a.school_year))

  return NextResponse.json({ years })
})
