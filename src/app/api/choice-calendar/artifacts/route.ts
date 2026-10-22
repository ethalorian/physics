import { NextResponse } from 'next/server'
import { withAuth, withEnrolledStudent } from '@/lib/api-auth'
import { choiceCourses, choiceSections } from '@/lib/choice-calendar-server'
import { readingStaff } from '@/lib/textbook-assignments-server'
import { supabaseAdmin } from '@/lib/supabase'
import { ARTIFACT_ID, MAX_ARTIFACT_BYTES, artifactFileType } from '@/lib/lesson-artifacts'

const bucket = 'student-lab-artifacts'
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status })
export const POST = withEnrolledStudent(async (request, ctx) => {
  if (ctx.realRole !== 'student' || ctx.viewingAsTeacher) return fail('Only students can upload their own work.', 403)
  const form = await request.formData().catch(() => null)
  const sectionId = form?.get('section_id'), optionId = form?.get('option_id'), file = form?.get('file')
  if (form?.get('expected_user_id') !== ctx.userId) return fail('Account changed. Reload before uploading.', 409)
  if (typeof sectionId !== 'string' || !ARTIFACT_ID.test(sectionId) || typeof optionId !== 'string' || !(file instanceof File)) return fail('Choose a lab and a file.')
  if (!file.size || file.size > MAX_ARTIFACT_BYTES) return fail('Choose a photo or PDF smaller than 4 MB.', 413)
  const sections = await choiceSections((await choiceCourses(ctx)).map(c => c.id), false)
  const section = sections.find(s => s.id === sectionId), option = section?.options.find(o => o.id === optionId)
  if (!section?.published || Date.parse(section.opens_at) > Date.now() || !option?.lab || !option.artifactInstructions?.trim()) return fail('Lab unavailable.', 404)
  const selected = await supabaseAdmin.from('choice_selections').select('selected,artifact_submitted_at').eq('section_id', sectionId).eq('option_id', optionId).eq('user_id', ctx.userId).maybeSingle()
  if (selected.error) throw selected.error
  if (!selected.data?.selected || selected.data.artifact_submitted_at) return fail('Choose this lab before uploading, or view your submitted work.', 409)
  const bytes = new Uint8Array(await file.arrayBuffer()), format = artifactFileType(bytes)
  if (!format) return fail('Use a JPEG, PNG, WebP image, or PDF.', 415)
  const id = crypto.randomUUID(), path = `${ctx.userId}/${sectionId}/${id}.${format.ext}`
  const uploaded = await supabaseAdmin.storage.from(bucket).upload(path, bytes, { contentType: format.type, upsert: false })
  if (uploaded.error) return fail('Upload failed. Please try again.', 502)
  const name = file.name.replace(/[\x00-\x1f\x7f]/g, '').slice(0, 180) || `lab.${format.ext}`
  const saved = await supabaseAdmin.from('choice_lab_files').insert({ id, section_id: sectionId, option_id: optionId, user_id: ctx.userId, path, name, content_type: format.type, size: file.size })
  if (saved.error) { await supabaseAdmin.storage.from(bucket).remove([path]); return fail('Could not record your upload. Please retry.', 502) }
  return NextResponse.json({ id, name }, { status: 201 })
})
export const GET = withAuth(async (request, ctx) => {
  const id = new URL(request.url).searchParams.get('id') ?? ''
  if (!ARTIFACT_ID.test(id)) return fail('File unavailable.', 404)
  const result = await supabaseAdmin.from('choice_lab_files').select('*').eq('id', id).maybeSingle()
  if (result.error) throw result.error
  const file = result.data, staff = readingStaff(ctx)
  if (!file || !staff && file.user_id !== ctx.userId) return fail('File unavailable.', 404)
  const sections = await choiceSections((await choiceCourses(ctx)).map(c => c.id), staff)
  if (!sections.some(s => s.id === file.section_id && s.options.some(o => o.id === file.option_id))) return fail('File unavailable.', 404)
  const downloaded = await supabaseAdmin.storage.from(bucket).download(file.path)
  if (downloaded.error || !downloaded.data) return fail('Could not load the file.', 502)
  return new Response(downloaded.data, { headers: { 'Content-Type': file.content_type, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "sandbox; default-src 'none'", 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}` } })
})
