import {withRole} from '@/lib/api-auth'
import {supabaseAdmin} from '@/lib/supabase'
import {accessQuiz, quizJson} from '@/lib/quizzes/server'
import {QUIZ_UUID} from '@/lib/quizzes/types'
import {quizDueDateChange, sameQuizDueDate} from '@/lib/quizzes/due-date'

/** Teacher scheduling only. Student save/submit routes and work versions are untouched. */
export const POST = withRole<{id: string}>(['teacher', 'admin'], async (req, ctx) => {
  if (ctx.viewingAsTeacher) return quizJson({error: 'Return to your own account to edit the due date.'}, 403)
  const {id} = await ctx.params
  if (!QUIZ_UUID.test(id)) return quizJson({error: 'Quiz unavailable.'}, 404)
  const access = await accessQuiz(id, ctx)
  if (!access) return quizJson({error: 'Quiz unavailable.'}, 404)
  let change
  try { change = quizDueDateChange(await req.json()) }
  catch (error) { return quizJson({error: (error as Error).message}, 400) }
  const quiz = access.quiz
  if (quiz.status !== 'published') return quizJson({error: 'This quiz is no longer published. Reload to see its current status.'}, 409)
  // A lost response can safely be retried without changing the date twice.
  if ([change.version, change.version + 1].includes(quiz.version) && sameQuizDueDate(quiz.due_at, change.due_at)) {
    return quizJson({due_at: quiz.due_at, version: quiz.version})
  }
  if (quiz.version !== change.version) return quizJson({error: 'Quiz settings changed in another window. Reload the current date before saving again.'}, 409)
  const {data, error} = await supabaseAdmin.from('quiz_assignments')
    .update({due_at: change.due_at, version: change.version + 1, updated_at: new Date().toISOString()})
    .eq('id', id).eq('course_id', access.course.id).eq('status', 'published').eq('version', change.version)
    .select('due_at,version').maybeSingle()
  if (error) throw error
  return data ? quizJson({due_at: data.due_at, version: data.version}) : quizJson({error: 'Quiz settings changed in another window. Reload the current date before saving again.'}, 409)
})
