import { prepareSequenceDate, sequenceDateNotice, saveConfirmedSequenceDate } from '@/lib/sequence-date-server'
import {withRole} from '@/lib/api-auth'
import {supabaseAdmin} from '@/lib/supabase'
import {accessQuiz, quizJson} from '@/lib/quizzes/server'
import {QUIZ_UUID} from '@/lib/quizzes/types'
import {quizDueDateChange, sameQuizDueDate} from '@/lib/quizzes/due-date'
import {quizScheduleError} from '@/lib/quiz-schedule'

/** Teacher scheduling only. Student save/submit routes and work versions are untouched. */
export const POST = withRole<{id: string}>(['teacher', 'admin'], async (req, ctx) => {
  if (ctx.viewingAsTeacher) return quizJson({error: 'Return to your own account to edit the due date.'}, 403)
  const {id} = await ctx.params
  if (!QUIZ_UUID.test(id)) return quizJson({error: 'Quiz unavailable.'}, 404)
  const access = await accessQuiz(id, ctx)
  if (!access) return quizJson({error: 'Quiz unavailable.'}, 404)
  const {data:pair,error:pairError}=await supabaseAdmin.from('worksheet_assignments').select('id').eq('quiz_id',id).maybeSingle();if(pairError)throw pairError
  if(pair)return quizJson({error:'Edit both deadlines in the linked paper worksheet.',worksheet_id:pair.id},409)
  let change, body
  try { body = await req.json(); const fields = { ...body }; delete fields.sequenceConfirmation; change = quizDueDateChange(fields) }
  catch (error) { return quizJson({error: (error as Error).message}, 400) }
  const quiz = access.quiz
  const scheduleError = quizScheduleError(change.due_at, quiz.daily_sequence_key ? 'daily' : quiz.kind === 'vocabulary' ? 'vocabulary' : 'regular')
  if (scheduleError) return quizJson({error: scheduleError}, 400)
  if (!['published','archived'].includes(quiz.status)) return quizJson({error: 'This quiz is no longer published. Reload to see its current status.'}, 409)
  // A lost response can safely be retried without changing the date twice.
  const status=change.due_at?'published':'archived'
  if (quiz.status===status && [change.version, change.version + 1].includes(quiz.version) && sameQuizDueDate(quiz.due_at, change.due_at)) {
    return quizJson({due_at: quiz.due_at, version: quiz.version})
  }
  if (quiz.version !== change.version) return quizJson({error: 'Quiz settings changed in another window. Reload the current date before saving again.'}, 409)
  if (quiz.daily_sequence_key) {
    if (!change.due_at) return quizJson({error: 'Use Remove from calendar on the discussion or review to unassign the linked group.'}, 409)
    let dateChange
    try { dateChange = await prepareSequenceDate(access.course.id, 'quiz:' + id, change.due_at, body.sequenceConfirmation) }
    catch (error) { return quizJson({error: error instanceof Error ? error.message : 'Could not load linked dates.'}, 409) }
    if (!dateChange) return quizJson({error: 'The linked assignments could not be found. Reload before changing dates.'}, 409)
    if (!dateChange.confirmed) return quizJson(sequenceDateNotice(dateChange.context), 409)
    const saved = await saveConfirmedSequenceDate(access.course.teacher_email, access.course.id, 'quiz:' + id, change.due_at, dateChange.confirmed, 'quiz', {version: change.version}, ctx.email)
    if (saved.error) return quizJson({error: saved.error.code === 'P0001' ? saved.error.message : 'The date could not be confirmed. Reload and try again.'}, 409)
    return quizJson(saved.data)
  }
  const {data, error} = await supabaseAdmin.from('quiz_assignments')
    .update({status, due_at: change.due_at, version: change.version + 1, updated_at: new Date().toISOString()})
    .eq('id', id).eq('course_id', access.course.id).eq('status', quiz.status).eq('version', change.version)
    .select('due_at,version').maybeSingle()
  if (error) throw error
  return data ? quizJson({due_at: data.due_at, version: data.version}) : quizJson({error: 'Quiz settings changed in another window. Reload the current date before saving again.'}, 409)
})
