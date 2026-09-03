import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { TEXTBOOK_BUCKET, textbookChapter, textbookObjectPath } from '@/data/textbook'

// GET /api/textbook/[chapter]
// Streams one chapter of Conceptual Physics to a SIGNED-IN user (any role).
// The bucket is private, so this route is the only door: the browser never
// sees a storage URL, and the response is served inline so the /textbook
// iframe (or a new tab) renders it with the native PDF viewer.
//
// Fallback: 26 chapters were uploaded earlier to the PUBLIC `lesson-media`
// bucket for the Concept Exercise block (concept_exercises.text_pdf_url). If a
// chapter is not yet in the private bucket, proxy that copy so the reader
// still works — the response is still gated by this route's session check.
//
// Fetches from Supabase are cached per chapter at the CDN/edge for a day; the
// files are static and ~2–6 MB each.

export const GET = withAuth<{ chapter: string }>(async (_req, ctx) => {
  const { chapter } = await ctx.params
  const n = Number(chapter)
  const meta = Number.isInteger(n) ? textbookChapter(n) : undefined
  if (!meta) return NextResponse.json({ error: 'No such chapter' }, { status: 404 })

  const filename = `Conceptual Physics - Ch ${String(n).padStart(2, '0')} ${meta.title}.pdf`
    .replace(/[^\w .()-]+/g, ' ')
  const headers = {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `inline; filename="${filename}"`,
    'Cache-Control': 'private, max-age=0, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
  }

  // 1) Private bucket (preferred).
  const { data: blob, error } = await supabaseAdmin.storage
    .from(TEXTBOOK_BUCKET)
    .download(textbookObjectPath(n))
  if (blob && !error) {
    return new Response(blob.stream(), { status: 200, headers })
  }

  // 2) Legacy public copy attached to the concept exercise for this chapter.
  const { data: ex } = await supabaseAdmin
    .from('concept_exercises')
    .select('text_pdf_url')
    .eq('chapter', n)
    .maybeSingle()
  const legacyUrl = ex?.text_pdf_url as string | null | undefined
  if (legacyUrl) {
    const upstream = await fetch(legacyUrl, { cache: 'no-store' })
    if (upstream.ok && upstream.body) {
      return new Response(upstream.body, { status: 200, headers })
    }
  }

  return NextResponse.json(
    { error: `Chapter ${n} has not been uploaded yet` },
    { status: 404 },
  )
})
