import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getEffectiveContext } from '@/lib/effective-context'

// POST /api/admin/duplicates/merge  { canonical_id, dup_id }
// Admin-only. Merges the duplicate row INTO the canonical row:
//   1. Move course_students.student_id from dup → canonical (skip if already
//      enrolled there).
//   2. Re-key any work tables that key by google_user_id from dup's
//      google_user_id → canonical's google_user_id (only if they differ).
//   3. Delete the dup students row.
// The caller chooses which row is canonical (usually the row WITH work and
// the real school email).

const REKEY_TABLES = [
  'block_responses',
  'mastery_records',
  'lesson_progress',
  'vocabulary_game_scores',
  'reward_redemptions',
  'submissions',
  'gradebook_entries',
  'student_avatars',
  'student_owned_items',
] as const

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const ctx = await getEffectiveContext(session.user.email)
    if (ctx.realRole !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const canonicalId = (body?.canonical_id ?? '') as string
    const dupId = (body?.dup_id ?? '') as string
    if (!canonicalId || !dupId || canonicalId === dupId) {
      return NextResponse.json({ error: 'canonical_id and dup_id required (and must differ)' }, { status: 400 })
    }

    // Fetch both rows.
    const { data: canonical } = await supabaseAdmin.from('students').select('id, google_user_id').eq('id', canonicalId).maybeSingle()
    const { data: dup } = await supabaseAdmin.from('students').select('id, google_user_id').eq('id', dupId).maybeSingle()
    if (!canonical) return NextResponse.json({ error: 'Canonical row not found' }, { status: 404 })
    if (!dup) return NextResponse.json({ error: 'Duplicate row not found' }, { status: 404 })
    const canonicalRow = canonical as { id: string; google_user_id: string | null }
    const dupRow = dup as { id: string; google_user_id: string | null }

    // 1) Move enrollments. Watch for "already enrolled in same course" — we
    //    can't blindly update because the (course, student) UNIQUE would clash.
    const { data: dupEnrolls } = await supabaseAdmin.from('course_students').select('id, course_id').eq('student_id', dupId)
    const { data: canEnrolls } = await supabaseAdmin.from('course_students').select('course_id').eq('student_id', canonicalId)
    const canCourseIds = new Set((canEnrolls ?? []).map((r) => (r as { course_id: string }).course_id))
    const enrollMoves: string[] = []
    const enrollDeletes: string[] = []
    for (const e of (dupEnrolls ?? []) as { id: string; course_id: string }[]) {
      if (canCourseIds.has(e.course_id)) enrollDeletes.push(e.id)
      else enrollMoves.push(e.id)
    }
    if (enrollMoves.length > 0) {
      await supabaseAdmin.from('course_students').update({ student_id: canonicalId }).in('id', enrollMoves)
    }
    if (enrollDeletes.length > 0) {
      await supabaseAdmin.from('course_students').delete().in('id', enrollDeletes)
    }

    // 2) Re-key work tables only if google_user_ids actually differ.
    const rekeyResults: Record<string, number | string> = {}
    if (dupRow.google_user_id && canonicalRow.google_user_id && dupRow.google_user_id !== canonicalRow.google_user_id) {
      for (const table of REKEY_TABLES) {
        const { error, count } = await supabaseAdmin
          .from(table)
          .update({ user_id: canonicalRow.google_user_id }, { count: 'exact' })
          .eq('user_id', dupRow.google_user_id)
        if (error) {
          rekeyResults[table] = `error: ${error.message}`
        } else {
          rekeyResults[table] = count ?? 0
        }
      }
    }

    // 3) Delete the duplicate students row.
    const { error: delErr } = await supabaseAdmin.from('students').delete().eq('id', dupId)
    if (delErr) return NextResponse.json({ error: delErr.message, rekey: rekeyResults }, { status: 500 })

    return NextResponse.json({ ok: true, moved_enrollments: enrollMoves.length, dropped_dup_enrollments: enrollDeletes.length, rekey: rekeyResults })
  } catch (error) {
    console.error('Error in POST /api/admin/duplicates/merge:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
