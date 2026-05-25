import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getEffectiveContext } from '@/lib/effective-context'

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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id: lessonId } = await params

    const { data: set } = await supabaseAdmin
      .from('vocabulary_sets')
      .select('id')
      .eq('lesson_id', lessonId)
      .maybeSingle()
    if (!set) return NextResponse.json({ setId: null, terms: [] })

    const { data: terms } = await supabaseAdmin
      .from('vocabulary_terms')
      .select('id, term, definition, tier, cognate, part_of_speech, example, image_url, order_index')
      .eq('vocabulary_set_id', (set as { id: string }).id)
      .order('tier', { ascending: true })
      .order('order_index', { ascending: true })

    return NextResponse.json({ setId: (set as { id: string }).id, terms: terms ?? [] })
  } catch (error) {
    console.error('Error in GET /api/lessons/[id]/vocab:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const ctx = await getEffectiveContext(session.user.email)
    if (ctx.role !== 'admin' && ctx.role !== 'teacher') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id: lessonId } = await params
    const body = (await req.json()) as { terms?: TermInput[] }
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

    // find or create the lesson's set
    const { data: existing } = await supabaseAdmin.from('vocabulary_sets').select('id').eq('lesson_id', lessonId).maybeSingle()
    let setId = (existing as { id: string } | null)?.id ?? null
    if (!setId) {
      const { data: created, error: createErr } = await supabaseAdmin
        .from('vocabulary_sets')
        .insert({ name: `${lesson.title ?? 'Lesson'} vocab`, lesson_id: lessonId, unit_id: unitId, created_by: session.user.email, published: true })
        .select('id')
        .single()
      if (createErr || !created) return NextResponse.json({ error: createErr?.message ?? 'Could not create set' }, { status: 500 })
      setId = (created as { id: string }).id
    } else {
      await supabaseAdmin.from('vocabulary_sets').update({ unit_id: unitId, updated_at: new Date().toISOString() }).eq('id', setId)
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

    return NextResponse.json({ ok: true, setId, count: terms.length })
  } catch (error) {
    console.error('Error in PUT /api/lessons/[id]/vocab:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
