import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getEffectiveContext } from '@/lib/effective-context'
import { getTeacherStudentGids } from '@/lib/teacher-scope'

// GET /api/mastery/queue?unit_id=unit-1
// The grading queue: every roster student with UNGRADED work in the unit (block
// responses submitted since the teacher last rated them). Aging matters —
// anything waiting 48h+ is flagged top priority; a student self-rating "Not yet"
// (marzano = 1) is flagged for help. Sorted so the most urgent surfaces first.

type StudentRow = { google_user_id: string | null; name: string | null }
type UnitRow = { id: string; name: string }
type LessonRow = { id: string }
type TargetRow = { id: string }
type BlockRow = { user_id: string; created_at: string; block_type: string | null; response: unknown }
type RecRow = { user_id: string; observed_at: string }

const HOUR = 60 * 60 * 1000

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const ctx = await getEffectiveContext(session.user.email)
    const role = ctx.role
    if (role !== 'admin' && role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const unitId = new URL(request.url).searchParams.get('unit_id') ?? 'unit-1'

    // unit name -> lessons -> lessonIds
    const { data: unitRows } = await supabaseAdmin.from('units').select('id, name').eq('id', unitId)
    const unitName = ((unitRows ?? []) as UnitRow[])[0]?.name ?? null
    let lessonIds: string[] = []
    if (unitName) {
      const { data: lr } = await supabaseAdmin.from('lessons').select('id').eq('unit', unitName)
      lessonIds = ((lr ?? []) as LessonRow[]).map((l) => l.id)
    }

    // unit targets (for "last rated" + the cell to open)
    const { data: tr } = await supabaseAdmin.from('learning_targets').select('id').eq('unit_id', unitId).order('order_index', { ascending: true })
    const targetIds = ((tr ?? []) as TargetRow[]).map((t) => t.id)

    // roster (same scoping as /api/mastery/roster)
    let sQuery = supabaseAdmin.from('students').select('google_user_id, name').order('name', { ascending: true })
    if (role === 'teacher') sQuery = sQuery.in('google_user_id', await getTeacherStudentGids(ctx.scopeEmail))
    const { data: sr } = await sQuery
    const students = ((sr ?? []) as StudentRow[]).filter((s) => s.google_user_id).map((s) => ({ id: s.google_user_id as string, name: s.name ?? 'Student' }))
    const studentIds = students.map((s) => s.id)

    if (studentIds.length === 0 || lessonIds.length === 0) {
      return NextResponse.json({ unitId, firstTargetId: targetIds[0] ?? null, queue: [] })
    }

    // block submissions in the unit
    const { data: br } = await supabaseAdmin
      .from('block_responses')
      .select('user_id, created_at, block_type, response')
      .in('user_id', studentIds)
      .in('lesson_id', lessonIds)
    const blocks = (br ?? []) as BlockRow[]

    // last rating per student on this unit's targets
    const lastRatedByUser = new Map<string, number>()
    if (targetIds.length > 0) {
      const { data: rr } = await supabaseAdmin.from('mastery_records').select('user_id, observed_at').in('user_id', studentIds).in('target_id', targetIds)
      for (const r of (rr ?? []) as RecRow[]) {
        const t = new Date(r.observed_at).getTime()
        if (t > (lastRatedByUser.get(r.user_id) ?? 0)) lastRatedByUser.set(r.user_id, t)
      }
    }

    const now = Date.now()
    const nameById = new Map<string, string>(students.map((s): [string, string] => [s.id, s.name]))
    interface QueueItem { studentId: string; name: string; count: number; oldestAgeHours: number; aged: boolean; needsHelp: boolean }
    const byUser = new Map<string, { count: number; oldest: number; needsHelp: boolean }>()
    for (const b of blocks) {
      const submittedAt = new Date(b.created_at).getTime()
      const lastRated = lastRatedByUser.get(b.user_id) ?? 0
      if (submittedAt <= lastRated) continue // already graded after this submission
      const cur = byUser.get(b.user_id) ?? { count: 0, oldest: submittedAt, needsHelp: false }
      cur.count++
      if (submittedAt < cur.oldest) cur.oldest = submittedAt
      if (b.block_type === 'marzano' && Number(b.response) === 1) cur.needsHelp = true
      byUser.set(b.user_id, cur)
    }

    const queue: QueueItem[] = []
    for (const [uid, v] of byUser) {
      const ageHours = Math.round((now - v.oldest) / HOUR)
      queue.push({ studentId: uid, name: nameById.get(uid) ?? 'Student', count: v.count, oldestAgeHours: ageHours, aged: ageHours >= 48, needsHelp: v.needsHelp })
    }
    // most urgent first: aged or needs-help, then by age
    queue.sort((a, b) => {
      const ap = (a.aged || a.needsHelp) ? 1 : 0
      const bp = (b.aged || b.needsHelp) ? 1 : 0
      if (ap !== bp) return bp - ap
      return b.oldestAgeHours - a.oldestAgeHours
    })

    return NextResponse.json({ unitId, firstTargetId: targetIds[0] ?? null, queue })
  } catch (error) {
    console.error('Error in GET /api/mastery/queue:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
