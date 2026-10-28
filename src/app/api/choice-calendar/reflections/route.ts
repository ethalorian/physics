import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { readingRows, readingStaff } from '@/lib/textbook-assignments-server'
import { choiceCourses } from '@/lib/choice-calendar-server'
import { createReadyReflection, REFLECTION_TEMPLATES } from '@/lib/reflection-assignments'
import { validateBlockDocument } from '@/data/block-registry'
import type { LibraryStep } from '@/lib/activity-library'
import { isDeepStrictEqual } from 'node:util'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const targetUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const bad = (error: string, status = 422) => Response.json({ error }, { status })

/** Add a preset as an independent assignment. The menu still controls release
 * and dates; repeating the activity in another sequence gets fresh receipts. */
export const POST = withAuth(async (req, ctx) => {
  if (!readingStaff(ctx) || ctx.viewingAsTeacher) return bad('Use your own teacher account to add an activity.', 403)
  const body = await req.json().catch(() => null)
  const template = REFLECTION_TEMPLATES.find(t => t.kind === body?.kind)
  if (!template || !uuid.test(body?.request_id ?? '') || !/^unit-[1-8]$/.test(body?.unit_id ?? '') || body?.target_id != null && !targetUuid.test(body.target_id)) return bad('Choose a valid reflection activity and Physics unit.')
  if (body.title !== undefined && (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 180)) return bad('Use an assignment title of 1–180 characters.')
  if (!(await choiceCourses(ctx)).some(c => c.id === body.course_id)) return bad('Choose one of your Physics classes.', 403)
  const [unit, targets] = await Promise.all([
    supabaseAdmin.from('units').select('id,name').eq('id', body.unit_id).eq('program', 'physics').maybeSingle(),
    readingRows<{ id: string }>((a, b) => supabaseAdmin.from('learning_targets').select('id').eq('unit_id', body.unit_id).eq('program', 'physics').order('id').range(a, b)),
  ])
  if (unit.error) throw unit.error
  if (!unit.data || !targets.length || body.target_id && !targets.some(t => t.id === body.target_id)) return bad('Choose a Physics unit with available learning targets.')
  const targetIds = body.target_id ? [body.target_id as string] : targets.map(t => t.id)
  const document = createReadyReflection(template.kind, targetIds)
  const issues = validateBlockDocument(document, true)
  if (issues.length) return bad(issues.map(issue => issue.message).join(' '))
  const lesson = { id: body.request_id, slug: `sequence-reflection-${body.course_id}-${template.kind}-${body.request_id}`, title: body.title?.trim() ?? template.title, unit_id: unit.data.id, unit: unit.data.name, lesson_number: 1, published: true, visibility_track: null, content_blocks: document }
  const step: LibraryStep = { id: 'lesson:' + lesson.id, kind: 'lesson', sourceId: lesson.id, planKey: 'lesson:' + lesson.id, title: lesson.title, href: '/lessons/' + lesson.slug, followUp: false, unitIds: [lesson.unit_id], targetIds, format: template.kind, reflectionTemplate: template.kind, availability: 'Ready' }
  const result = (status = 200) => Response.json({ lesson_id: lesson.id, step }, { status })
  // Reusing the request after a lost response must not create a second assignment.
  const existing = async () => {
    const found = await supabaseAdmin.from('lessons').select('id,slug,title,unit_id,content_blocks').eq('id', lesson.id).maybeSingle()
    if (found.error) throw found.error
    if (!found.data) return null
    return found.data.slug === lesson.slug && found.data.title === lesson.title && found.data.unit_id === lesson.unit_id && isDeepStrictEqual(found.data.content_blocks, document)
      ? result() : bad('This request was already used for another assignment. Reopen the activity library and try again.', 409)
  }
  const found = await existing()
  if (found) return found
  const saved = await supabaseAdmin.from('lessons').insert(lesson)
  if (saved.error) {
    if (saved.error.code === '23505') { const retry = await existing(); if (retry) return retry }
    throw saved.error
  }
  return result(201)
})
