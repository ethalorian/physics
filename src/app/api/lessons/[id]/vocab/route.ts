import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAuth, withRole } from '@/lib/api-auth'

// A lesson's tiered SEI vocab lives in ONE vocabulary_set bound to the lesson.
// GET  /api/lessons/[id]/vocab  — the lesson's tiered terms
// PUT  /api/lessons/[id]/vocab  — replace the lesson's terms (admin/teacher)

interface TermInput {
  term: string
  definition: string
  tier?: number | null
  cognate?: string | null
  part_of_speech?: string | null
  example?: string | null
  image_url?: string | null
}

type LessonRow = { id: string; title: string | null; unit: string | null }

export const GET = withAuth<{ id: string }>(async (_req, ctx) => {
    const { id: lessonId } = await ctx.params

    const { data: set } = await supabaseAdmin
      .from('vocabulary_sets')
      .select('id, published')
      .eq('lesson_id', lessonId)
      .maybeSingle()
    if (!set) return NextResponse.json({ setId: null, published: false, terms: [] })
    const s = set as { id: string; published: boolean | null }

    const { data: terms } = await supabaseAdmin
      .from('vocabulary_terms')
      .select('id, term, definition, tier, cognate, part_of_speech, example, image_url, order_index')
      .eq('vocabulary_set_id', s.id)
      .order('tier', { ascending: true })
      .order('order_index', { ascending: true })

    return NextResponse.json({ setId: s.id, published: s.published ?? false, terms: terms ?? [] })
})

export const PUT = withRole<{ id: string }>(['teacher', 'admin'], async (req, ctx) => {
    const { id: lessonId } = await ctx.params
    const body = (await req.json()) as { terms?: TermInput[]; published?: boolean }
    const terms = (body.terms ?? []).filter((t) => t.term?.trim())

    // lesson → unit_id (vocabulary_sets.unit_id references units.id; lessons.unit is the name)
    const { data: lessonRow } = await supabaseAdmin.from('lessons').select('id, title, unit').eq('id', lessonId).maybeSingle()
    const lesson = lessonRow as LessonRow | null
    if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    let unitId: string | null = null
    if (lesson.unit) {
      const { data: u } = await supabaseAdmin.from('units').select('id').eq('name', lesson.unit).maybeSingle()
      unitId = (u as { id: string } | null)?.id ?? null
    }

    // find or create the lesson's set. New sets default to DRAFT (published:false)
    // so half-built vocab never surfaces in the arcade; the teacher publishes
    // explicitly when the list is game-ready. `published` only gates the arcade
    // play-picker — the in-lesson vocab block shows terms regardless.
    const { data: existing } = await supabaseAdmin.from('vocabulary_sets').select('id').eq('lesson_id', lessonId).maybeSingle()
    let setId = (existing as { id: string } | null)?.id ?? null
    if (!setId) {
      const { data: created, error: createErr } = await supabaseAdmin
        .from('vocabulary_sets')
        .insert({ name: `${lesson.title ?? 'Lesson'} vocab`, lesson_id: lessonId, unit_id: unitId, created_by: ctx.email, published: body.published ?? false })
        .select('id')
        .single()
      if (createErr || !created) return NextResponse.json({ error: createErr?.message ?? 'Could not create set' }, { status: 500 })
      setId = (created as { id: string }).id
    } else {
      const patch: { unit_id: string | null; updated_at: string; published?: boolean } = { unit_id: unitId, updated_at: new Date().toISOString() }
      if (typeof body.published === 'boolean') patch.published = body.published
      await supabaseAdmin.from('vocabulary_sets').update(patch).eq('id', setId)
    }

    // replace terms
    await supabaseAdmin.from('vocabulary_terms').delete().eq('vocabulary_set_id', setId)
    if (terms.length > 0) {
      const rows = terms.map((t, i) => ({
        vocabulary_set_id: setId,
        term: t.term.trim(),
        definition: t.definition ?? '',
        tier: t.tier ?? null,
        cognate: t.cognate ?? null,
        part_of_speech: t.part_of_speech ?? null,
        example: t.example ?? null,
        image_url: t.image_url ?? null,
        order_index: i,
      }))
      const { error: insErr } = await supabaseAdmin.from('vocabulary_terms').insert(rows)
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, setId, count: terms.length, published: body.published ?? undefined })
})
