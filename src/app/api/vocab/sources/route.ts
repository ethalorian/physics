import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/vocab/sources — units and lessons that have any vocab terms,
// for the arcade's "pick a unit or lesson" play selector.

type SetRow = { id: string; lesson_id: string | null; unit_id: string | null }

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // sets that actually have terms
    const { data: termRows } = await supabaseAdmin.from('vocabulary_terms').select('vocabulary_set_id')
    const setIdsWithTerms = [...new Set(((termRows ?? []) as { vocabulary_set_id: string }[]).map((r) => r.vocabulary_set_id))]
    if (setIdsWithTerms.length === 0) return NextResponse.json({ units: [], lessons: [] })

    // Only PUBLISHED sets surface in the arcade picker. Draft sets (half-built
    // vocab a teacher hasn't marked game-ready) stay hidden here.
    const { data: setRows } = await supabaseAdmin.from('vocabulary_sets').select('id, lesson_id, unit_id').eq('published', true).in('id', setIdsWithTerms)
    const sets = (setRows ?? []) as SetRow[]
    const lessonIds = [...new Set(sets.map((s) => s.lesson_id).filter((x): x is string => Boolean(x)))]
    const unitIds = [...new Set(sets.map((s) => s.unit_id).filter((x): x is string => Boolean(x)))]

    const [{ data: lessonRows }, { data: unitRows }] = await Promise.all([
      lessonIds.length ? supabaseAdmin.from('lessons').select('id, title, unit, lesson_number').in('id', lessonIds) : Promise.resolve({ data: [] }),
      unitIds.length ? supabaseAdmin.from('units').select('id, name, order_index').in('id', unitIds) : Promise.resolve({ data: [] }),
    ])

    const lessons = ((lessonRows ?? []) as { id: string; title: string | null; unit: string | null; lesson_number: number | null }[])
      .map((l) => ({ id: l.id, title: l.title ?? 'Lesson', unit: l.unit ?? '', lessonNumber: l.lesson_number ?? 0 }))
      .sort((a, b) => a.unit.localeCompare(b.unit) || a.lessonNumber - b.lessonNumber)
    const units = ((unitRows ?? []) as { id: string; name: string; order_index: number }[])
      .sort((a, b) => a.order_index - b.order_index)
      .map((u) => ({ id: u.id, name: u.name }))

    return NextResponse.json({ units, lessons })
  } catch (error) {
    console.error('Error in GET /api/vocab/sources:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
