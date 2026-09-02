import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { TEXTBOOK_BUCKET, TEXTBOOK_CHAPTERS, textbookChapter, textbookObjectPath } from '@/data/textbook'

// Admin console for the textbook bucket (drives /admin/textbook).
//
// GET  → per-chapter status: which chapters are in the private `textbook`
//        bucket (student edition), which would fall back to a public
//        lesson-media TE copy, and which are missing outright.
// POST → { chapter } → a signed upload URL for that chapter's object. The
//        browser PUTs the PDF straight to Supabase Storage, so the file never
//        passes through a Vercel function (4.5 MB body cap) and no storage
//        policy or key is needed on the client. Upsert: re-uploading replaces.

export const GET = withRole('admin', async () => {
  const { data: objects, error } = await supabaseAdmin.storage.from(TEXTBOOK_BUCKET).list('', { limit: 200 })
  if (error) return NextResponse.json({ error: error.message }, { status: 502 })
  const inBucket = new Map((objects ?? []).map((o) => [o.name, o]))

  const { data: legacy } = await supabaseAdmin
    .from('concept_exercises')
    .select('chapter, text_pdf_url')
  const legacyByChapter = new Map((legacy ?? []).map((r) => [r.chapter as number, r.text_pdf_url as string | null]))

  const chapters = TEXTBOOK_CHAPTERS.map((c) => {
    const obj = inBucket.get(textbookObjectPath(c.n))
    const size = obj?.metadata && typeof obj.metadata === 'object' ? (obj.metadata as { size?: number }).size : undefined
    return {
      n: c.n,
      title: c.title,
      status: obj ? 'student' : legacyByChapter.get(c.n) ? 'fallback-te' : 'missing',
      size: size ?? null,
      updatedAt: obj?.updated_at ?? null,
    }
  })
  return NextResponse.json({ bucket: TEXTBOOK_BUCKET, chapters })
})

export const POST = withRole('admin', async (request) => {
  const body = await request.json().catch(() => ({}))
  const n = Number(body?.chapter)
  if (!textbookChapter(n)) return NextResponse.json({ error: 'No such chapter' }, { status: 400 })
  const { data, error } = await supabaseAdmin.storage
    .from(TEXTBOOK_BUCKET)
    .createSignedUploadUrl(textbookObjectPath(n), { upsert: true })
  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Could not sign upload' }, { status: 502 })
  return NextResponse.json({ chapter: n, path: data.path, signedUrl: data.signedUrl })
})
