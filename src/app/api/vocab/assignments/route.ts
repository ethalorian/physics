import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// Teacher: which vocabulary sets are assigned to which class.
//   GET  /api/vocab/assignments?course_id=…  → { assignments, sets }  (sets = every published set with a term count)
//   POST /api/vocab/assignments { course_id, vocabulary_set_id, due_on?, note? }  → assign (upsert, re-activates)
//   DELETE /api/vocab/assignments { id }  → unassign (soft: active=false, attempts stay)

async function ownsCourse(ctx: { role: string; scopeEmail?: string | null }, courseId: string) {
  const { data } = await supabaseAdmin.from('courses').select('id, teacher_email').eq('id', courseId).maybeSingle()
  if (!data) return false
  return ctx.role === 'admin' || (data as { teacher_email: string | null }).teacher_email === ctx.scopeEmail
}

export const GET = withRole(['teacher', 'admin'], async (request, ctx) => {
  const courseId = new URL(request.url).searchParams.get('course_id')
  if (!courseId) return NextResponse.json({ error: 'course_id required' }, { status: 400 })
  if (!(await ownsCourse(ctx, courseId))) return NextResponse.json({ error: 'Not your class' }, { status: 403 })

  const [{ data: asg }, { data: sets }, { data: terms }] = await Promise.all([
    supabaseAdmin.from('vocab_assignments').select('id, vocabulary_set_id, due_on, note, active, created_at').eq('course_id', courseId).order('created_at', { ascending: false }),
    supabaseAdmin.from('vocabulary_sets').select('id, name, lesson_id, unit_id, published').eq('published', true),
    supabaseAdmin.from('vocabulary_terms').select('vocabulary_set_id'),
  ])
  const countBy = new Map<string, number>()
  for (const t of (terms ?? []) as { vocabulary_set_id: string }[]) countBy.set(t.vocabulary_set_id, (countBy.get(t.vocabulary_set_id) ?? 0) + 1)
  type SetRow = { id: string; name: string | null; lesson_id: string | null; unit_id: string | null }
  const setRows = ((sets ?? []) as SetRow[]).filter((s) => (countBy.get(s.id) ?? 0) > 0)
  const lessonIds = setRows.map((s) => s.lesson_id).filter((x): x is string => Boolean(x))
  const { data: lessons } = lessonIds.length ? await supabaseAdmin.from('lessons').select('id, title, slug, unit').in('id', lessonIds) : { data: [] }
  const lessonBy = new Map(((lessons ?? []) as { id: string; title: string; slug: string; unit: string | null }[]).map((l) => [l.id, l]))
  const setsOut = setRows.map((s) => {
    const l = s.lesson_id ? lessonBy.get(s.lesson_id) : undefined
    return { id: s.id, label: l?.title ?? s.name ?? 'Vocabulary set', slug: l?.slug ?? null, unit: l?.unit ?? s.unit_id, terms: countBy.get(s.id) ?? 0 }
  }).sort((a, b) => (a.slug ?? '').localeCompare(b.slug ?? ''))
  return NextResponse.json({ assignments: asg ?? [], sets: setsOut })
})

export const POST = withRole(['teacher', 'admin'], async (request, ctx) => {
  const body = (await request.json().catch(() => ({}))) as { course_id?: string; vocabulary_set_id?: string; due_on?: string | null; note?: string | null }
  if (!body.course_id || !body.vocabulary_set_id) return NextResponse.json({ error: 'course_id and vocabulary_set_id required' }, { status: 400 })
  if (!(await ownsCourse(ctx, body.course_id))) return NextResponse.json({ error: 'Not your class' }, { status: 403 })
  const { data, error } = await supabaseAdmin.from('vocab_assignments')
    .upsert({ course_id: body.course_id, vocabulary_set_id: body.vocabulary_set_id, assigned_by: ctx.email, due_on: body.due_on || null, note: body.note ?? null, active: true }, { onConflict: 'course_id,vocabulary_set_id' })
    .select('id, vocabulary_set_id, due_on, note, active, created_at').single()
  if (error) return NextResponse.json({ error: 'Could not assign' }, { status: 500 })
  return NextResponse.json({ assignment: data })
})

export const DELETE = withRole(['teacher', 'admin'], async (request, ctx) => {
  const body = (await request.json().catch(() => ({}))) as { id?: string }
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { data: a } = await supabaseAdmin.from('vocab_assignments').select('id, course_id').eq('id', body.id).maybeSingle()
  if (!a) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!(await ownsCourse(ctx, (a as { course_id: string }).course_id))) return NextResponse.json({ error: 'Not your class' }, { status: 403 })
  await supabaseAdmin.from('vocab_assignments').update({ active: false }).eq('id', body.id)
  return NextResponse.json({ ok: true })
})
