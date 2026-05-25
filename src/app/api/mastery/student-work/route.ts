import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserRole } from '@/lib/permissions'

// GET /api/mastery/student-work?user_id=<google_user_id>&unit_id=unit-1
// Feeds the rate-from-work drawer: the student's submitted block work across the
// unit's lessons (latest per block) + their mastery rating history per target.

type UnitRow = { id: string; name: string }
type LessonRow = { id: string; title: string; lesson_number: number }
type BlockRow = { lesson_id: string | null; block_id: string; block_type: string | null; response: unknown; created_at: string }
type TargetRow = { id: string; statement: string; domain: string; order_index: number }
type RecordRow = { target_id: string; level: number; observed_at: string }

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const role = getUserRole(session.user.email)
    const isStaff = role === 'admin' || role === 'teacher'

    const { searchParams } = new URL(request.url)
    const unitId = searchParams.get('unit_id')
    const requestedUserId = searchParams.get('user_id')
    // When a specific target cell is opened, scope the returned work to just that
    // target's lesson — so the teacher sees only the evidence for what they clicked.
    const targetId = searchParams.get('target_id')
    if (!unitId) {
      return NextResponse.json({ error: 'Missing unit_id' }, { status: 400 })
    }
    // Students may only inspect their own work; staff may pass any user_id.
    const userId = isStaff && requestedUserId ? requestedUserId : session.user.id

    // Unit name bridges to lessons.unit (display string == units.name).
    const { data: unitRows } = await supabaseAdmin.from('units').select('id, name').eq('id', unitId)
    const unitName = ((unitRows ?? []) as UnitRow[])[0]?.name ?? null

    // Lessons in the unit
    let lessons: LessonRow[] = []
    if (unitName) {
      const { data: lessonRows } = await supabaseAdmin
        .from('lessons')
        .select('id, title, lesson_number')
        .eq('unit', unitName)
        .order('lesson_number', { ascending: true })
      lessons = (lessonRows ?? []) as LessonRow[]
    }
    const titleByLesson = new Map<string, string>(lessons.map((l): [string, string] => [l.id, l.title]))
    const lessonIds = lessons.map((l) => l.id)

    // If a target was clicked, narrow the lessons to just that target's lesson.
    let scopeLessonIds = lessonIds
    if (targetId) {
      const { data: tRow } = await supabaseAdmin.from('learning_targets').select('lesson_id').eq('id', targetId).maybeSingle()
      const lid = (tRow as { lesson_id: string | null } | null)?.lesson_id ?? null
      scopeLessonIds = lid && lessonIds.includes(lid) ? [lid] : []
    }

    // The student's block work for those lessons — latest per (lesson, block)
    const work: { lessonTitle: string; lessonId: string | null; blockType: string | null; blockId: string; response: unknown; createdAt: string }[] = []
    if (scopeLessonIds.length > 0) {
      const { data: blockRows } = await supabaseAdmin
        .from('block_responses')
        .select('lesson_id, block_id, block_type, response, created_at')
        .eq('user_id', userId)
        .in('lesson_id', scopeLessonIds)
        .order('created_at', { ascending: false })
      const seen = new Set<string>()
      for (const b of (blockRows ?? []) as BlockRow[]) {
        const key = `${b.lesson_id}|${b.block_id}`
        if (seen.has(key)) continue
        seen.add(key)
        work.push({
          lessonTitle: (b.lesson_id && titleByLesson.get(b.lesson_id)) || 'Lesson',
          lessonId: b.lesson_id,
          blockType: b.block_type,
          blockId: b.block_id,
          response: b.response,
          createdAt: b.created_at,
        })
      }
    }

    // Targets + this student's rating history for the unit
    const { data: targetRowsRaw } = await supabaseAdmin
      .from('learning_targets')
      .select('id, statement, domain, order_index')
      .eq('unit_id', unitId)
      .order('order_index', { ascending: true })
    const targets = ((targetRowsRaw ?? []) as TargetRow[]).map((t) => ({ id: t.id, statement: t.statement, domain: t.domain }))
    const targetIds = targets.map((t) => t.id)

    let records: RecordRow[] = []
    if (targetIds.length > 0) {
      const { data: recRaw } = await supabaseAdmin
        .from('mastery_records')
        .select('target_id, level, observed_at')
        .eq('user_id', userId)
        .in('target_id', targetIds)
        .order('observed_at', { ascending: true })
      records = (recRaw ?? []) as RecordRow[]
    }

    return NextResponse.json({ userId, unitId, targets, records, work })
  } catch (error) {
    console.error('Error in GET /api/mastery/student-work:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
