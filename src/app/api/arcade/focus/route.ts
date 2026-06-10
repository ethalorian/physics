import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/arcade/focus — what vocabulary should THIS student be playing?
 *
 * Steers the arcade's training floor toward the words of the unit the
 * student is actually in: their most recent lesson_progress → that lesson's
 * published vocab (best), else its unit's published vocab. Falls back to the
 * most recently updated published set so new students still get a steer.
 *
 * Returns { scope: 'lesson'|'unit', id, label } or { scope: null }.
 */

type SetRow = { id: string; lesson_id: string | null; unit_id: string | null; updated_at: string | null }

export const GET = withAuth(async (request, ctx) => {
  // published sets that actually have terms — same gate as /api/vocab/sources
  const { data: termRows } = await supabaseAdmin.from('vocabulary_terms').select('vocabulary_set_id')
  const withTerms = [...new Set(((termRows ?? []) as { vocabulary_set_id: string }[]).map((r) => r.vocabulary_set_id))]
  if (withTerms.length === 0) return NextResponse.json({ scope: null })
  const { data: setRows } = await supabaseAdmin
    .from('vocabulary_sets')
    .select('id, lesson_id, unit_id, updated_at')
    .eq('published', true)
    .in('id', withTerms)
  const sets = (setRows ?? []) as SetRow[]
  if (sets.length === 0) return NextResponse.json({ scope: null })
  const lessonSet = new Set(sets.map((s) => s.lesson_id).filter(Boolean))
  const unitSet = new Set(sets.map((s) => s.unit_id).filter(Boolean))

  // the student's recent lessons, newest first
  const { data: progress } = await supabaseAdmin
    .from('lesson_progress')
    .select('lesson_id, created_at, completed_at')
    .eq('user_id', ctx.userId)
    .order('created_at', { ascending: false })
    .limit(10)
  const recentLessonIds = [...new Set(((progress ?? []) as { lesson_id: string | null }[])
    .map((p) => p.lesson_id).filter((x): x is string => Boolean(x)))]

  if (recentLessonIds.length > 0) {
    const { data: lessonRows } = await supabaseAdmin
      .from('lessons')
      .select('id, title, unit')
      .in('id', recentLessonIds)
    const byId = new Map(((lessonRows ?? []) as { id: string; title: string | null; unit: string | null }[])
      .map((l) => [l.id, l]))
    for (const lid of recentLessonIds) {
      const lesson = byId.get(lid)
      if (!lesson) continue
      // best: this exact lesson has published vocab
      if (lessonSet.has(lid)) {
        return NextResponse.json({ scope: 'lesson', id: lid, label: lesson.title ?? 'Current lesson' })
      }
      // good: the lesson's unit has published vocab
      if (lesson.unit) {
        const { data: unitRows } = await supabaseAdmin
          .from('units').select('id, name').eq('name', lesson.unit).limit(1)
        const unit = (unitRows ?? [])[0] as { id: string; name: string } | undefined
        if (unit && unitSet.has(unit.id)) {
          return NextResponse.json({ scope: 'unit', id: unit.id, label: unit.name })
        }
      }
    }
  }

  // fallback: the most recently touched published set (teacher just published = current)
  const newest = [...sets].sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))[0]
  if (newest.lesson_id) {
    const { data: l } = await supabaseAdmin.from('lessons').select('title').eq('id', newest.lesson_id).limit(1)
    return NextResponse.json({ scope: 'lesson', id: newest.lesson_id, label: (l ?? [])[0]?.title ?? 'Latest vocab' })
  }
  if (newest.unit_id) {
    const { data: u } = await supabaseAdmin.from('units').select('name').eq('id', newest.unit_id).limit(1)
    return NextResponse.json({ scope: 'unit', id: newest.unit_id, label: (u ?? [])[0]?.name ?? 'Latest vocab' })
  }
  return NextResponse.json({ scope: null })
})
