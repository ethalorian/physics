import type { VocabularyTerm } from '@/types/assignment'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { accessVocabTask } from '@/lib/vocab-access'
import { withAuth } from '@/lib/api-auth'

// GET /api/vocab/play?lesson_id=...        — one lesson's vocab
//     /api/vocab/play?unit_id=...          — all vocab across a unit's lessons
//     &tier=all|1|2|3                      — optional tier filter
// Returns terms for the arcade + a scoreSetId to attribute the game score to
// (per-game personal bests/leaderboard are by game_type, so the set id is just
// provenance — for a unit we use the first lesson's set).

type SetRow = { id: string; lesson_id: string | null }
type TermRow = { id: string; term: string; definition: string; tier: number | null; cognate: string | null; definition_es: string | null; icon: string | null; example: string | null; part_of_speech: string | null; translations: VocabularyTerm['translations'] }

export const GET = withAuth(async (req, ctx) => {
    const sp = new URL(req.url).searchParams
    const taskId = sp.get('task_id')
    if (taskId) {
      const task = await accessVocabTask(taskId,ctx)
      if(!task || !task.active) return NextResponse.json({error:'Assignment unavailable'},{status:403})
      return NextResponse.json({label:task.title,scoreSetId:task.words[0]?.vocabulary_set_id??null,terms:task.words.map(t=>({...t,definitionEs:t.definition_es}))})
    }
    const setId = sp.get('set_id')
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
    if (setId) {
      const { data: s } = await supabaseAdmin.from('vocabulary_sets').select('id, name').eq('id', setId).eq('published', true).eq('archived', false).eq('archived', false).maybeSingle()
      if (s) { setIds = [s.id]; scoreSetId = s.id; label = s.name }
    } else if (lessonId) {
      const { data: set } = await supabaseAdmin.from('vocabulary_sets').select('id, lesson_id').eq('lesson_id', lessonId).eq('published', true).eq('archived', false).maybeSingle()
      const s = set as SetRow | null
      if (s) { setIds = [s.id]; scoreSetId = s.id }
      const { data: l } = await supabaseAdmin.from('lessons').select('title').eq('id', lessonId).maybeSingle()
      label = (l as { title: string } | null)?.title ?? 'Lesson'
    } else if (unitId) {
      const { data: sets } = await supabaseAdmin.from('vocabulary_sets').select('id, lesson_id').eq('unit_id', unitId).eq('published', true).eq('archived', false)
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
      .select('id, term, definition, tier, cognate, definition_es, icon, example, part_of_speech, translations')
      .in('vocabulary_set_id', setIds).eq('archived', false)
    if (tier) q = q.eq('tier', tier)
    const { data: termsRaw } = await q
    // SEI fields ride along so the arcade can show the picture + Spanish route (see VocabSei.tsx).
    const terms = ((termsRaw ?? []) as TermRow[]).map((t) => ({ id: t.id, term: t.term, definition: t.definition, tier: t.tier, cognate: t.cognate, definitionEs: t.definition_es, icon: t.icon, example: t.example, partOfSpeech: t.part_of_speech, translations: t.translations }))

    return NextResponse.json({ terms, scoreSetId, label })
})
