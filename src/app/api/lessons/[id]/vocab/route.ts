import { authorizeLesson } from '@/lib/lesson-access'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAuth, withContentEditor } from '@/lib/api-auth'

export const GET = withAuth<{ id: string }>(async (_req, ctx) => {
  const { id } = await ctx.params, access = await authorizeLesson(ctx, id)
  if (!access.ok) return access.response
  const { data: set, error } = await supabaseAdmin.from('vocabulary_sets').select('id, published, updated_at').eq('lesson_id', id).maybeSingle()
  if (error) throw error
  if (!set) return NextResponse.json({ setId: null, published: false, updated_at: null, terms: [] })
  const terms = await supabaseAdmin.from('vocabulary_terms').select('id, term, definition, tier, cognate, part_of_speech, example, image_url, order_index, icon, definition_es, translations, contexts').eq('vocabulary_set_id', set.id).eq('archived', false).order('tier').order('order_index')
  if (terms.error) throw terms.error
  return NextResponse.json({ setId: set.id, published: set.published ?? false, updated_at: set.updated_at, terms: terms.data ?? [] })
})

export const PUT = withContentEditor<{ id: string }>('lessons', async (req, ctx) => {
  const { id } = await ctx.params, body = await req.json().catch(() => null)
  if (!body || !Array.isArray(body.terms) || !Object.prototype.hasOwnProperty.call(body, 'expected_updated_at')) return NextResponse.json({ error: 'Reload the vocabulary before saving so its version can be checked.' }, { status: 428 })
  if (body.terms.some((t: { term?: unknown; definition?: unknown }) => !t || typeof t.term !== 'string' || !t.term.trim() || typeof t.definition !== 'string' || !t.definition.trim())) return NextResponse.json({ error: 'Each term needs a word and a definition.' }, { status: 422 })
  const { data, error } = await supabaseAdmin.rpc('save_lesson_vocabulary', { p_lesson: id, p_expected: body.expected_updated_at, p_terms: body.terms, p_published: typeof body.published === 'boolean' ? body.published : null })
  if (error) return NextResponse.json({ error: error.message }, { status: error.code === '40001' ? 409 : 422 })
  return NextResponse.json({ ok: true, ...data })
})
