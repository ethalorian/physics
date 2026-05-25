import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/concept-exercises/[chapter]
// Serves a chapter's reader + exercise payload to the client — WITHOUT the
// answer key (which never leaves the server; grading happens in the grade route).

export async function GET(_req: Request, { params }: { params: Promise<{ chapter: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { chapter } = await params
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
  } catch (err) {
    console.error('Error in GET /api/concept-exercises/[chapter]:', err)
    return NextResponse.json({ error: 'Could not load chapter' }, { status: 500 })
  }
}
