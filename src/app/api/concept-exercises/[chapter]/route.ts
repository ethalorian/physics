import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAuth } from '@/lib/api-auth'

// GET /api/concept-exercises/[chapter]
// Serves a chapter's reader + exercise payload to the client — WITHOUT the
// answer key (which never leaves the server; grading happens in the grade route).

export const GET = withAuth<{ chapter: string }>(async (_req, ctx) => {
    const { chapter } = await ctx.params
    const ch = Number(chapter)
    if (!Number.isInteger(ch)) return NextResponse.json({ error: 'Bad chapter' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('concept_exercises')
      .select('chapter, title, text_pdf_url, page_offset, sections')
      .eq('chapter', ch)
      .maybeSingle()

    if (error) { console.error('concept-exercises read error:', error); return NextResponse.json({ error: 'Lookup failed' }, { status: 502 }) }
    if (!data) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })

    return NextResponse.json({
      chapter: data.chapter,
      title: data.title,
      textPdfUrl: data.text_pdf_url,
      pageOffset: data.page_offset ?? 0,
      sections: data.sections ?? [],
    })
})
