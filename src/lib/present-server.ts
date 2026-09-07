import { hydrateLessonDocument } from '@/lib/lesson-access'
import { supabaseAdmin } from '@/lib/supabase'
import { asProgram, getProgramUnitIds, PROGRAM_LABEL } from '@/lib/program'
import { effectiveTrack, filterDocumentForViewer, isLessonVisible, isBlockVisible } from '@/lib/track-visibility'
import type { BlockDocument } from '@/data/content-blocks'
import { isSameIdentity } from '@/lib/identity-aliases'

type PresentationActor = { role: string; email: string; scopeEmail?: string }

/** Explain launch blockers while preserving class, publication, and track gates. */
export async function resolveClassLesson(lessonId: string, courseId: string, actor?: PresentationActor) {
  const unavailable = (error: string, status = 403) => ({ ok: false as const, error, status })
  const { data: course, error } = await supabaseAdmin.from('courses').select('id, teacher_email, program, track').eq('id', courseId).maybeSingle()
  if (error) return unavailable('Could not check class access. Please retry.', 503)
  if (!course || (actor && actor.role !== 'admin' && !isSameIdentity(actor.scopeEmail ?? actor.email, course.teacher_email))) return unavailable('This class is not available to your teaching account. Choose one of your classes.')
  const { data: lesson, error: lessonError } = await supabaseAdmin.from('lessons').select('id, title, unit_id, visibility_track, published, content_blocks').eq('id', lessonId).maybeSingle()
  if (lessonError) return unavailable('Could not load this lesson. Please retry.', 503)
  if (!lesson) return unavailable('This lesson is unavailable.', 404)
  const program = asProgram(course.program)
  const blockers: string[] = []
  if (!lesson.published) blockers.push('This lesson is unpublished. Publish it before starting a live class.')
  if (!(await getProgramUnitIds(program)).includes(lesson.unit_id)) blockers.push(`This lesson is outside the selected class’s ${PROGRAM_LABEL[program]} curriculum. Choose a matching lesson or class.`)
  if (!isLessonVisible(lesson.visibility_track, { role: 'student', track: course.track })) blockers.push('This lesson is not available for the selected class’s track.')
  if (blockers.length) return unavailable(blockers.join(' '))
  const original = lesson.content_blocks as BlockDocument | null
  if (!original?.blocks?.length) return unavailable('This lesson has no content to present. Add lesson content first.', 422)
  const doc = filterDocumentForViewer(await hydrateLessonDocument(original, lesson.unit_id), { role: 'student', track: effectiveTrack(course.track) })
  if (!doc.blocks.length) return unavailable('This lesson has no student-visible content for the selected class.', 422)
  const deck = original.blocks.find(b => b.type === 'deck' && isBlockVisible(b, {role:'teacher',track:course.track})) ?? null
  return { ok: true as const, lesson: { ...lesson, content_blocks: doc, original, deck, track: effectiveTrack(course.track) } }
}

export async function classLesson(lessonId: string, courseId: string, actor?: PresentationActor) {
  const result = await resolveClassLesson(lessonId, courseId, actor)
  return result.ok ? result.lesson : null
}
export async function validateLivePoll(args: { userId: string; lessonId: string; blockId: string; presentSessionId?: string | null; pollRunId?: string | null }): Promise<{ok:true;sessionId:string;pollRunId:string}|{ok:false;error:string;status:number}> {
  const fail = (error: string, status = 409): {ok:false;error:string;status:number} => ({ ok: false, error, status })
  if (!args.presentSessionId || !args.pollRunId) return fail('Live poll session and round are required', 400)
  const { data: session, error } = await supabaseAdmin.from('present_sessions').select('id, lesson_id, course_id, status, poll_block_id, poll_run_id, poll_locked, poll_revealed').eq('id', args.presentSessionId).maybeSingle()
  if (error || !session || session.lesson_id !== args.lessonId || session.status !== 'live' || session.poll_block_id !== args.blockId || session.poll_run_id !== args.pollRunId || session.poll_locked || session.poll_revealed || !session.course_id) return fail('This poll is closed or has changed')
  const { data: membership } = await supabaseAdmin.from('course_students').select('student_id').eq('course_id', session.course_id).eq('student_id', args.userId).maybeSingle()
  if (!membership) return fail('Not enrolled in this presentation class', 403)
  const lesson = await classLesson(args.lessonId, session.course_id)
  if (!lesson?.content_blocks.blocks.some(block => block.id === args.blockId && block.type === 'question')) return fail('Poll block is unavailable', 403)
  return { ok: true, sessionId: session.id, pollRunId: session.poll_run_id }
}
