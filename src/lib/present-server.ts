import { hydrateLessonDocument } from '@/lib/lesson-access'
import { supabaseAdmin } from '@/lib/supabase'
import { asProgram, getProgramUnitIds } from '@/lib/program'
import { effectiveTrack, filterDocumentForViewer, isLessonVisible, isBlockVisible } from '@/lib/track-visibility'
import type { BlockDocument } from '@/data/content-blocks'

export async function classLesson(lessonId: string, courseId: string, actor?: { role: string; email: string }) {
  const { data: course, error } = await supabaseAdmin.from('courses').select('id, teacher_email, program, track').eq('id', courseId).maybeSingle()
  if (error || !course || (actor && actor.role !== 'admin' && course.teacher_email?.toLowerCase() !== actor.email.toLowerCase())) return null
  const { data: lesson } = await supabaseAdmin.from('lessons').select('id, title, unit_id, visibility_track, published, content_blocks').eq('id', lessonId).maybeSingle()
  if (!lesson || !lesson.published || !(await getProgramUnitIds(asProgram(course.program))).includes(lesson.unit_id) || !isLessonVisible(lesson.visibility_track, { role: 'student', track: course.track })) return null
  const original = lesson.content_blocks as BlockDocument | null
  if (!original?.blocks) return null
  const doc = filterDocumentForViewer(await hydrateLessonDocument(original, lesson.unit_id), { role: 'student', track: effectiveTrack(course.track) })
  const deck = original.blocks.find(b => b.type === 'deck' && isBlockVisible(b, {role:'teacher',track:course.track})) ?? null
  return { ...lesson, content_blocks: doc, original, deck, track: effectiveTrack(course.track) }
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
