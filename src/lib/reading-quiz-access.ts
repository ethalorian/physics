import { calendarAssigned } from '@/lib/calendar-assignment'
import 'server-only'
import { courseHomeworkWaivers } from './homework-waivers-server'
import { readingExemptions } from './reading-exemptions-server'
import { supabaseAdmin } from '@/lib/supabase'
import { readingRows } from './textbook-assignments-server'
import { binderSourceForStep } from './binder-reading'

export async function binderForReadingQuiz(quizId: string, courseId: string) {
  const { data, error } = await supabaseAdmin.from('reading_syllabus_bundles').select('step_id')
    .eq('course_id', courseId).or(`reading_quiz_id.eq.${quizId},vocabulary_quiz_id.eq.${quizId}`).maybeSingle()
  if (error) throw error
  return data ? binderSourceForStep(data.step_id) : null
}

/** Submission completes the reading prerequisite. Later teacher feedback does
 * not revoke access or discard quiz work. Unrelated quizzes have no prerequisite.
 */
export async function lockedReadingQuizPrerequisites(quizIds: string[], userId: string): Promise<Map<string, string>> {
  if (!quizIds.length) return new Map()
  const links = await readingRows<{course_id: string; reading_id: string; reading_quiz_id: string}>((a,b) => supabaseAdmin.from('reading_syllabus_bundles').select('course_id,reading_id,reading_quiz_id').in('reading_quiz_id',quizIds).order('reading_quiz_id').range(a,b))
  if (!links.length) return new Map()
  const submissions = await readingRows<{assignment_id: string}>((a,b) => supabaseAdmin.from('textbook_submissions').select('assignment_id').in('assignment_id',links.map(l=>l.reading_id)).eq('user_id',userId).order('id').range(a,b))
  const ids = links.map(link => link.reading_id)
  const [exemptions, removed, waivers] = await Promise.all([
    readingExemptions(ids, userId),
    readingRows<{ id: string }>((a,b) => supabaseAdmin.from('textbook_assignments').select('id').in('id', ids).eq('status', 'archived').order('id').range(a,b)),
    courseHomeworkWaivers([...new Set(links.map(l => l.course_id))]),
  ])
  const complete = new Set([...waivers.filter(w => w.work_key.startsWith('reading:')).map(w => w.work_key.slice(8)), ...submissions.map(s=>s.assignment_id), ...exemptions.map(e=>e.assignment_id), ...removed.map(a=>a.id)])
  return new Map(links.filter(l=>!complete.has(l.reading_id)).map(l=>[l.reading_quiz_id,l.reading_id]))
}

export async function lockedReadingQuizIds(quizIds: string[], userId: string): Promise<Set<string>> {
  return new Set((await lockedReadingQuizPrerequisites(quizIds,userId)).keys())
}

export async function readingQuizForStudent(readingId: string, userId: string) {
  const {data:link,error} = await supabaseAdmin.from('reading_syllabus_bundles').select('reading_quiz_id').eq('reading_id',readingId).maybeSingle()
  if (error) throw error
  if (!link) return null
  const {data:quiz,error:quizError} = await supabaseAdmin.from('quiz_assignments').select('id,status,due_at,deleted_at,student_ids').eq('id',link.reading_quiz_id).maybeSingle()
  if (quizError) throw quizError
  if (!quiz || quiz.deleted_at || !calendarAssigned(quiz.status,quiz.due_at) || quiz.student_ids && !quiz.student_ids.includes(userId)) return null
  const locked = (await lockedReadingQuizIds([quiz.id],userId)).has(quiz.id)
  const {data:work,error:workError} = locked ? {data:null,error:null} : await supabaseAdmin.from('quiz_work').select('state').eq('quiz_id',quiz.id).eq('user_id',userId).maybeSingle()
  if (workError) throw workError
  return {id:locked?null:quiz.id,locked,state:work?.state??'not_started',needsCompletion:!locked&&!['submitted','graded'].includes(work?.state??'')}
}
