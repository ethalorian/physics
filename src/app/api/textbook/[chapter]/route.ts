import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { TEXTBOOK_BUCKET, textbookChapter, textbookObjectPath } from '@/data/textbook'
import { parseTextbookLanguage, textbookLanguageTag } from '@/lib/textbook-language'

// GET /api/textbook/[chapter]
// Streams one chapter of Conceptual Physics to a SIGNED-IN user (any role).
// The bucket is private, so this route is the only door: the browser never
// sees a storage URL, and the response is served inline so the /textbook
// reader (or a new tab) renders the selected language.
//
// Fallback: 26 chapters were uploaded earlier to the PUBLIC `lesson-media`
// bucket for the Concept Exercise block (concept_exercises.text_pdf_url). If a
// chapter is not yet in the private bucket, proxy that copy so the reader
// still works — the response is still gated by this route's session check.
//
// Stable chapter/language URLs are revalidated using Storage's content ETag.
// withAuth runs BEFORE revalidation, including responses that reuse a cached PDF.

async function fetchPdf(
  url: string,
  request: Request,
  responseHeaders: Record<string, string>,
  credentials: Record<string, string> = {},
): Promise<Response | null> {
  const headers = new Headers(credentials)
  // Ask Storage to check the current object instead of serving a stale CDN copy.
  headers.set('Cache-Control', 'no-cache')
  const validator = request.headers.get('if-none-match')
  if (validator) headers.set('If-None-Match', validator)

  // The SDK's download() buffers the entire PDF and hides its ETag/status.
  // A conditional GET lets Storage return 304 before transferring the PDF.
  const upstream = await fetch(url, { headers, cache: 'no-store', signal: request.signal })
  const outgoing = new Headers(responseHeaders)
  const etag = upstream.headers.get('etag')
  if (etag) outgoing.set('ETag', etag)
  if (upstream.status === 304 && validator) {
    // Storage can omit the ETag on 304. Preserve a single browser validator;
    // for a list/wildcard, let the browser retain its existing cache metadata.
    if (!etag && /^(W\/)?"[^"\r\n]*"$/.test(validator.trim())) {
      outgoing.set('ETag', validator.trim())
    }
    return new Response(null, { status: 304, headers: outgoing })
  }
  if (upstream.status === 200 && upstream.body) {
    return new Response(upstream.body, { status: 200, headers: outgoing })
  }
  await upstream.body?.cancel()
  return null
}

export const GET = withAuth<{ chapter: string }>(async (req, ctx) => {
  const { chapter } = await ctx.params
  const n = Number(chapter)
  const meta = Number.isInteger(n) ? textbookChapter(n) : undefined
  if (!meta) return NextResponse.json({ error: 'No such chapter' }, { status: 404 })
  const language = parseTextbookLanguage(new URL(req.url).searchParams.get('lang') ?? 'en')
  if (!language) return NextResponse.json({ error: 'Unsupported textbook language' }, { status: 400 })

  const filename = `Conceptual Physics - Ch ${String(n).padStart(2, '0')} ${meta.title}${language === 'es' ? ' - Espanol' : language === 'pt' ? ' - Portugues' : ''}.pdf`
    .replace(/[^\w .()-]+/g, ' ')
  const headers = {
    'Content-Type': 'application/pdf',
    'Content-Language': textbookLanguageTag(language),
    'Content-Disposition': `inline; filename="${filename}"`,
    'Cache-Control': 'private, max-age=0, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
  }

  // 1) Private bucket (preferred). Credentials remain on the server and are
  // never sent to the browser or to the legacy public URL below.
  const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!storageUrl || !serviceKey) throw new Error('Missing server Storage configuration')
  const objectPath = textbookObjectPath(n, language).split('/').map(encodeURIComponent).join('/')
  const pdf = await fetchPdf(
    `${storageUrl}/storage/v1/object/${TEXTBOOK_BUCKET}/${objectPath}`,
    req,
    headers,
    { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  )
  if (pdf) return pdf

  // Never silently substitute English for a selected translated edition.
  if (language !== 'en') return NextResponse.json(
    { error: language === 'pt' ? `A versão em português do capítulo ${n} não está disponível. Selecione outro idioma ou tente novamente mais tarde.` : `La versión en español del capítulo ${n} no está disponible. Puedes volver a English e intentarlo más tarde.` },
    { status: 404 },
  )

  // 2) Legacy public copy attached to the concept exercise for this chapter.
  const { data: ex } = await supabaseAdmin
    .from('concept_exercises')
    .select('text_pdf_url')
    .eq('chapter', n)
    .maybeSingle()
  const legacyUrl = ex?.text_pdf_url as string | null | undefined
  if (legacyUrl) {
    const legacyPdf = await fetchPdf(legacyUrl, req, headers)
    if (legacyPdf) return legacyPdf
  }

  return NextResponse.json(
    { error: `Chapter ${n} has not been uploaded yet` },
    { status: 404 },
  )
})
