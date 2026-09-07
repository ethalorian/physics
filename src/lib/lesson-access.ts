import { NextResponse } from 'next/server'
import type { AuthContext } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { canEditArea } from '@/lib/content-access'
import { getEnrollment, getStudentTrack } from '@/lib/student-enrollment'
import { getStudentProgram, getUnitProgramMap } from '@/lib/program'
import { getStudentLessonGate } from '@/lib/lesson-windows'
import { filterDocumentForViewer, isLessonVisible, type Viewer } from '@/lib/track-visibility'
import type { GlossaryEntry } from '@/components/MathMarkdown'
import type { BlockDocument } from '@/data/content-blocks'
import { submissionStatus } from '@/lib/lesson-review'

export interface AccessibleLesson {
  id: string; slug: string; title: string; published: boolean; unit_id: string | null
  visibility_track?: string | null; content_blocks?: BlockDocument | null
  unit?: string; estimated_time?: number; hero_image?: string | null
  [key: string]: unknown
}
type Actor = Pick<AuthContext, 'userId' | 'email' | 'realRole'>
type Access = { ok: true; lesson: AccessibleLesson; viewer: Viewer; document: BlockDocument | null } | { ok: false; response: Response }

/** A-4: the same publication, enrollment, program, track and window gates on every surface. */
export async function authorizeLesson(actor: Actor, lessonId: string, write = false, liveEvidence = false): Promise<Access> {
  const deny = (error: string, status: number): Access => ({ ok: false, response: NextResponse.json({ error }, { status }) })
  const staff = actor.realRole === 'admin' || actor.realRole === 'teacher' || await canEditArea(actor.email, 'lessons', false)
  if (write && (actor.realRole !== 'student' || staff)) return deny('Lesson previews are read-only. Use a student account to submit work.', 403)
  if (!staff && actor.realRole !== 'student') return deny('Forbidden', 403)
  const { data, error } = await supabaseAdmin.from('lessons').select('*').eq('id', lessonId).maybeSingle()
  if (error) throw error
  if (!data) return deny('Lesson not found', 404)
  const lesson = data as AccessibleLesson
  let viewer: Viewer = { role: 'admin' }
  if (!staff) {
    const [enrollment, track, program, unitPrograms, gate] = await Promise.all([
      getEnrollment(actor.userId), getStudentTrack(actor.userId), getStudentProgram(actor.userId), getUnitProgramMap(), getStudentLessonGate(actor.userId),
    ])
    if (!enrollment.enrolled) return deny('You are not in a class yet. Ask your teacher to add you.', 403)
    viewer = { role: 'student', track }
    if (!lesson.published || !isLessonVisible(lesson.visibility_track, viewer) || (lesson.unit_id ? unitPrograms.get(lesson.unit_id) ?? 'physics' : 'physics') !== program) return deny('Lesson not found', 404)
    if (!gate(lessonId)) return deny('This lesson is not open for your class.', 403)
  }
  if (write && !liveEvidence) {
    const state = await submissionStatus(actor.userId, lessonId)
    if (state.locked) return { ok: false, response: NextResponse.json({ error: 'Submitted work is locked until your teacher reviews this lesson.', ...state }, { status: 409 }) }
  }
  const doc = lesson.content_blocks && Array.isArray(lesson.content_blocks.blocks) ? lesson.content_blocks : null
  const document = doc ? filterDocumentForViewer(await hydrateLessonDocument(doc, lesson.unit_id), viewer) : null
  return { ok: true, lesson, viewer, document }
}

/** Transfer tasks remain references in the stored BlockDocument; hydrate their authored task at read time. */
export async function hydrateLessonDocument(document: BlockDocument, unitId: string | null): Promise<BlockDocument> {
  const refs = document.blocks.filter((b) => b.type === 'transfer_prompt').map((b) => b.masteryTaskSlug)
  if (!refs.length || !unitId) return document
  const { data: unit, error: unitError } = await supabaseAdmin.from('units').select('program').eq('id', unitId).maybeSingle()
  if (unitError) throw unitError
  const { data, error } = await supabaseAdmin.from('mastery_tasks').select('id, slug, prompt, rubric').in('slug', refs).eq('program', unit?.program ?? 'physics')
  if (error) throw error
  const tasks = new Map((data ?? []).map((t) => [t.slug, t]))
  return { ...document, blocks: document.blocks.map((block) => block.type === 'transfer_prompt' && tasks.has(block.masteryTaskSlug) ? { ...block, task: tasks.get(block.masteryTaskSlug) } : block) } as BlockDocument
}

/** Avoid serializing legacy answer-bearing fields or generation metadata into a student response. */
export function lessonForReader(lesson: AccessibleLesson, document: BlockDocument | null) {
  return { id: lesson.id, slug: lesson.slug, title: lesson.title, unit: lesson.unit, unit_id: lesson.unit_id,
    estimated_time: lesson.estimated_time, hero_image: lesson.hero_image, key_terms: Array.isArray(lesson.key_terms) ? lesson.key_terms.filter((t): t is GlossaryEntry => Boolean(t && typeof t === 'object' && typeof t.term === 'string' && typeof t.definition === 'string')) : undefined,
    content_blocks: document ?? undefined }
}
