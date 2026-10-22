import { NextResponse } from 'next/server'
import { withAuth, withEnrolledStudent } from '@/lib/api-auth'
import { authorizeLesson } from '@/lib/lesson-access'
import { supabaseAdmin } from '@/lib/supabase'
import { resolveTargetStudent } from '@/lib/teacher-scope'
import { ARTIFACT_ID, LESSON_ARTIFACT_BUCKET, MAX_ARTIFACT_BYTES, artifactFileType } from '@/lib/lesson-artifacts'

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status })
export const POST = withEnrolledStudent(async (request, ctx) => {
  const form = await request.formData().catch(() => null)
  const lessonId = form?.get('lesson_id'), blockId = form?.get('block_id'), file = form?.get('file')
  if (form?.get('expected_user_id') !== ctx.userId) return fail('Account changed. Reload before uploading.', 409)
  if (typeof lessonId !== 'string' || !ARTIFACT_ID.test(lessonId) || typeof blockId !== 'string' || !(file instanceof File)) return fail('Choose a manga page to upload.')
  if (!file.size || file.size > MAX_ARTIFACT_BYTES) return fail('Choose a photo or PDF smaller than 4 MB.', 413)
  const access = await authorizeLesson(ctx, lessonId, true)
  if (!access.ok) return access.response
  const block = access.document?.blocks.find(b => b.id === blockId)
  if (block?.type !== 'sketch' || block.submission !== 'upload') return fail('This activity does not accept file uploads.', 422)
  const bytes = new Uint8Array(await file.arrayBuffer()), format = artifactFileType(bytes)
  if (!format) return fail('Use a JPEG, PNG, WebP image, or PDF.', 415)
  const id = crypto.randomUUID(), path = `${ctx.userId}/${lessonId}/${id}.${format.ext}`
  const uploaded = await supabaseAdmin.storage.from(LESSON_ARTIFACT_BUCKET).upload(path, bytes, { contentType: format.type, upsert: false })
  if (uploaded.error) return fail('The upload could not be saved. Please try again.', 502)
  const name = file.name.replace(/[\x00-\x1f\x7f]/g, '').slice(0, 180) || `manga.${format.ext}`
  const saved = await supabaseAdmin.from('lesson_artifacts').insert({ id, user_id: ctx.userId, lesson_id: lessonId, block_id: blockId, path, name, content_type: format.type, size: file.size })
  if (saved.error) {
    await supabaseAdmin.storage.from(LESSON_ARTIFACT_BUCKET).remove([path])
    return fail('The upload could not be recorded. Please try again.', 502)
  }
  return NextResponse.json({ id, name, content_type: format.type }, { status: 201 })
})

export const GET = withAuth(async (request, ctx) => {
  const params = new URL(request.url).searchParams, id = params.get('id') ?? ''
  if (!ARTIFACT_ID.test(id)) return fail('File unavailable.', 404)
  const result = await supabaseAdmin.from('lesson_artifacts').select('*').eq('id', id).maybeSingle()
  if (result.error) throw result.error
  const file = result.data
  if (!file) return fail('File unavailable.', 404)
  const resolved = await resolveTargetStudent({ role: ctx.role, selfId: ctx.userId, scopeEmail: ctx.scopeEmail, requestedUserId: file.user_id })
  if (!resolved.ok || resolved.userId !== file.user_id) return fail('File unavailable.', 404)
  const access = await authorizeLesson(ctx, file.lesson_id)
  if (!access.ok) return access.response
  if (access.viewer.role !== 'admin' && !access.document?.blocks.some(b => b.id === file.block_id)) return fail('File unavailable.', 404)
  if (params.get('metadata') === '1') return NextResponse.json({ id, name: file.name, content_type: file.content_type }, { headers: { 'Cache-Control': 'private, no-store' } })
  const downloaded = await supabaseAdmin.storage.from(LESSON_ARTIFACT_BUCKET).download(file.path)
  if (downloaded.error || !downloaded.data) return fail('Could not load the file. Please try again.', 502)
  return new Response(downloaded.data, { headers: {
    'Content-Type': file.content_type, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "sandbox; default-src 'none'",
    'Content-Disposition': `${file.content_type === 'application/pdf' ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(file.name)}`,
  } })
})
