import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/admin/duplicates
// Admin-only: groups of student rows that look like the SAME PERSON spread
// across multiple records (typically a Google-Classroom-imported stub +
// a sign-in row with a real school email). Pairs by case-insensitive name
// match. Returns activity counts so the admin can choose the canonical row.

export interface DuplicateRow {
  id: string
  google_user_id: string | null
  email: string | null
  name: string | null
  created_at: string | null
  is_classroom_stub: boolean       // email ends in @classroom.local
  enrolled: boolean
  block_responses: number
  lesson_progress: number
  game_scores: number
}

export interface DuplicateGroup {
  name: string
  rows: DuplicateRow[]
}

export const GET = withRole('admin', async () => {
    // 1) Find names that appear in students more than once.
    const { data: allStudents } = await supabaseAdmin
      .from('students')
      .select('id, google_user_id, email, name, created_at')
      .order('created_at', { ascending: true })
    type RawRow = { id: string; google_user_id: string | null; email: string | null; name: string | null; created_at: string | null }
    const rows = (allStudents ?? []) as RawRow[]
    const byName = new Map<string, RawRow[]>()
    for (const r of rows) {
      const key = (r.name ?? '').trim().toLowerCase()
      if (!key) continue
      const list = byName.get(key) ?? []
      list.push(r)
      byName.set(key, list)
    }
    const dupNames = [...byName.entries()].filter(([, list]) => list.length > 1)
    if (dupNames.length === 0) {
      return NextResponse.json({ groups: [], totalStudents: rows.length })
    }

    const allDupIds = dupNames.flatMap(([, list]) => list.map((r) => r.id))
    const allDupGoogleIds = dupNames.flatMap(([, list]) => list.map((r) => r.google_user_id).filter((x): x is string => !!x))

    // 2) Enrollment + activity counts in batches.
    const [{ data: enrolled }, { data: br }, { data: lp }, { data: gs }] = await Promise.all([
      supabaseAdmin.from('course_students').select('student_id').in('student_id', allDupIds),
      supabaseAdmin.from('block_responses').select('user_id').in('user_id', allDupGoogleIds),
      supabaseAdmin.from('lesson_progress').select('user_id').in('user_id', allDupGoogleIds),
      supabaseAdmin.from('vocabulary_game_scores').select('user_id').in('user_id', allDupGoogleIds),
    ])
    const enrolledSet = new Set((enrolled ?? []).map((r) => (r as { student_id: string }).student_id))
    const tally = (arr: { user_id: string }[] | null | undefined) => {
      const map = new Map<string, number>()
      for (const r of (arr ?? [])) map.set(r.user_id, (map.get(r.user_id) ?? 0) + 1)
      return map
    }
    const brMap = tally(br as { user_id: string }[] | null)
    const lpMap = tally(lp as { user_id: string }[] | null)
    const gsMap = tally(gs as { user_id: string }[] | null)

    const groups: DuplicateGroup[] = dupNames.map(([name, list]) => ({
      name: list[0].name ?? name,
      rows: list.map((r): DuplicateRow => ({
        id: r.id,
        google_user_id: r.google_user_id,
        email: r.email,
        name: r.name,
        created_at: r.created_at,
        is_classroom_stub: (r.email ?? '').endsWith('@classroom.local'),
        enrolled: enrolledSet.has(r.id),
        block_responses: r.google_user_id ? brMap.get(r.google_user_id) ?? 0 : 0,
        lesson_progress: r.google_user_id ? lpMap.get(r.google_user_id) ?? 0 : 0,
        game_scores: r.google_user_id ? gsMap.get(r.google_user_id) ?? 0 : 0,
      })),
    }))

    return NextResponse.json({ groups, totalStudents: rows.length })
})
