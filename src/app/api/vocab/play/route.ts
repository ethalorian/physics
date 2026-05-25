import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/vocab/play?lesson_id=...        — one lesson's vocab
//     /api/vocab/play?unit_id=...          — all vocab across a unit's lessons
//     &tier=all|1|2|3                      — optional tier filter
// Returns terms for the arcade + a scoreSetId to attribute the game score to
// (per-game personal bests/leaderboard are by game_type, so the set id is just
// provenance — for a unit we use the first lesson's set).

type SetRow = { id: string; lesson_id: string | null }
type TermRow = { id: string; term: string; definition: string; tier: number | null }

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sp = new URL(req.url).searchParams
    const lessonId = sp.get('lesson_id')
    const unitId = sp.get('unit_id')
    const tierParam = sp.get('tier')
    const tier = tierParam && tierParam !== 'all' ? Number(tierParam) : null

    // resolve the set(s) in scope
    let setIds: string[] = []
    let scoreSetId: string | null = null
    let label = 'Vocabulary'

    // Only PUBLISHED sets are playable — defense in depth behind the picker,
    // so a direct/stale call to a draft lesson's set returns nothing.
    if (lessonId) {
      const { data: set } = await supabaseAdmin.from('vocabulary_sets').select('id, lesson_id').eq('lesson_id', lessonId).eq('published', true).maybeSingle()
      const s = set as SetRow | null
      if (s) { setIds = [s.id]; scoreSetId = s.id }
      const { data: l } = await supabaseAdmin.from('lessons').select('title').eq('id', lessonId).maybeSingle()
      label = (l as { title: string } | null)?.title ?? 'Lesson'
    } else if (unitId) {
      const { data: sets } = await supabaseAdmin.from('vocabulary_sets').select('id, lesson_id').eq('unit_id', unitId).eq('published', true)
      const rows = (sets ?? []) as SetRow[]
      setIds = rows.map((r) => r.id)
      scoreSetId = setIds[0] ?? null
      const { data: u } = await supabaseAdmin.from('units').select('name').eq('id', unitId).maybeSingle()
      label = (u as { name: string } | null)?.name ?? 'Unit'
    } else {
      return NextResponse.json({ error: 'lesson_id or unit_id required' }, { status: 400 })
    }

    if (setIds.length === 0) return NextResponse.json({ terms: [], scoreSetId: null, label })

    let q = supabaseAdmin
      .from('vocabulary_terms')
      .select('id, term, definition, tier')
      .in('vocabulary_set_id', setIds)
    if (tier) q = q.eq('tier', tier)
    const { data: termsRaw } = await q
    const terms = ((termsRaw ?? []) as TermRow[]).map((t) => ({ id: t.id, term: t.term, definition: t.definition, tier: t.tier }))

    return NextResponse.json({ terms, scoreSetId, label })
  } catch (error) {
    console.error('Error in GET /api/vocab/play:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
