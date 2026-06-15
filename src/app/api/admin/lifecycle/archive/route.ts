import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/admin/lifecycle/archive   body: { school_year: string }
// Admin-only. Reversible: hides the year's sections and deactivates students who
// are left with no ACTIVE enrollment. NEVER deletes work or mastery — see
// archive_school_year() in 20260615_golive_rekey_to_students_id.sql.
export const POST = withRole('admin', async (request) => {
  let body: { school_year?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }
  const year = (body.school_year ?? '').trim()
  if (!year) return NextResponse.json({ error: 'school_year is required' }, { status: 400 })

  const { data, error } = await supabaseAdmin.rpc('archive_school_year', { p_year: year })
  if (error) {
    console.error('[lifecycle] archive failed:', error)
    return NextResponse.json({ error: 'Archive failed' }, { status: 500 })
  }
  const row = Array.isArray(data) ? data[0] : data
  return NextResponse.json({
    ok: true,
    school_year: year,
    sections_archived: row?.sections_archived ?? 0,
    students_deactivated: row?.students_deactivated ?? 0,
  })
})
