import 'server-only'
import { worksheetTeachingAssignment } from './worksheets-server'
import { supabaseAdmin } from '@/lib/supabase'
import type { AuthContext } from '@/lib/api-auth'
import type { ReadingCourse } from '@/lib/textbook-assignments'
import { validateReading } from '@/lib/textbook-assignments'
import { assignmentBySlug } from '@/lib/interactive-assignments/catalog'
import { lessonTargets } from '@/lib/interactive-assignments/server'
import { releaseLessons } from '@/lib/lesson-release-server'
import { appliesToClass } from '@/lib/lesson-release'
import { READING_SYLLABUS } from '@/data/reading-syllabus'
import { TEXTBOOK_SYLLABUS } from '@/data/textbook-syllabus'
import { buildSyllabusDrafts, resolveSyllabusWords } from '@/lib/reading-syllabus'
import { isInteractiveReading, isInteractiveSyllabusStep, INTERACTIVE_READING_ONLY } from '@/lib/reading-availability'
import { validateQuiz } from '@/lib/quizzes/validation'
import { vocabularyFor } from '@/lib/vocab-scope-server'

/** Validate current native content before the transaction. All writes, including
 * first-time reading preparation, happen together inside the scheduling RPC. */
export async function teachingAssignment(ctx: AuthContext, course: ReadingCourse, key: string) {
  const split = key.indexOf(':'), kind = key.slice(0, split), id = key.slice(split + 1)
  if (kind === 'worksheet-template') return worksheetTeachingAssignment(course, key)
  if (kind === 'interactive') {
    const activity = assignmentBySlug(id)
    if (!activity || course.program !== 'physics') throw Error('This interactive assignment is unavailable.')
    const targets = await lessonTargets(activity)
    if (!targets[0]) throw Error('This activity needs a learning target before it can be assigned.')
    return { targetId: targets[0].id }
  }
  if (kind === 'lesson') {
    const lesson = (await releaseLessons()).find(l => l.id === id)
    if (!lesson || !appliesToClass(lesson, { ...course, track: course.track ?? null })) throw Error('This lesson is not published for this class.')
    return {}
  }
  let readingId = id
  if (kind === 'reading-template') {
    const step = [...READING_SYLLABUS, ...TEXTBOOK_SYLLABUS].find(s => s.id === id)
    if (!step || !isInteractiveSyllabusStep(step, course.track)) throw Error(INTERACTIVE_READING_ONLY)
    const saved = await supabaseAdmin.from('reading_syllabus_bundles').select('reading_id').eq('course_id', course.id).eq('step_id', id).maybeSingle()
    if (saved.error) throw saved.error
    if (saved.data) readingId = saved.data.reading_id
    else {
      if (step.selectionRequired) throw Error('Set this reading’s learning targets in Reading & media first, then drag it onto the calendar.')
      const catalog = await vocabularyFor(ctx, { courseId: course.id, authoring: true })
      const words = resolveSyllabusWords(step.words, catalog.words, new Set(catalog.sets.filter(s => s.unit_id === step.unit && s.access[course.id]).map(s => s.id)))
      const drafts = buildSyllabusDrafts(step, READING_SYLLABUS, course, catalog.targets, () => crypto.randomUUID())
      drafts.reading = validateReading(drafts.reading) as typeof drafts.reading
      drafts.readingQuiz = validateQuiz(drafts.readingQuiz)
      drafts.vocabularyQuiz = validateQuiz(drafts.vocabularyQuiz)
      return { readingDraft: { ...drafts, words: words.map(w => ({ term: w.existing?.term ?? w.term, definition: w.existing?.definition ?? w.definition, ...(w.existing ? { id: w.existing.id } : {}) })) } }
    }
  }
  if (kind === 'reading' || kind === 'reading-template') {
    const saved = await supabaseAdmin.from('textbook_assignments').select('id,version,chapter,section_ids,passage,honors_reading').eq('id', readingId).eq('course_id', course.id).maybeSingle()
    if (saved.error) throw saved.error
    if (!saved.data) throw Error('This reading belongs to another class. Add its interactive reader from the library for this class.')
    if (!isInteractiveReading(saved.data)) throw Error(INTERACTIVE_READING_ONLY)
    return { readingId, readingVersion: saved.data.version }
  }
  if (kind === 'quiz') {
    const saved = await supabaseAdmin.from('quiz_assignments').select('*').eq('id', id).eq('course_id', course.id).is('deleted_at', null).maybeSingle()
    if (saved.error) throw saved.error
    if (!saved.data) throw Error('Prepare this quiz in this class before placing it on the calendar.')
    if (saved.data.daily_sequence_key) throw Error('Place the linked foundation or review on the calendar to schedule this quiz with its lesson sequence.')
    const pair = await supabaseAdmin.from('worksheet_assignments').select('id').eq('quiz_id',id).maybeSingle()
    if (pair.error) throw pair.error
    if (pair.data) throw Error('Place the linked paper worksheet on the calendar to assign both activities together.')
    validateQuiz({ ...saved.data, status: 'published' })
    return { quizVersion: saved.data.version }
  }
  throw Error('This activity needs its assignment settings before it can be scheduled for students.')
}
