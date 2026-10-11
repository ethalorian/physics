import {withRole} from '@/lib/api-auth'
import {supabaseAdmin} from '@/lib/supabase'
import {quizCourses, quizJson} from '@/lib/quizzes/server'
import {QUIZ_UUID} from '@/lib/quizzes/types'

/** Reversible deletion for unpublished drafts only; never deletes assessment evidence. */
export const POST = withRole<{id: string}>(['teacher', 'admin'], async (req, ctx) => {
  if (ctx.viewingAsTeacher) return quizJson({error: 'Return to your own account to delete drafts.'}, 403)
  const {id} = await ctx.params
  if (!QUIZ_UUID.test(id)) return quizJson({error: 'Draft unavailable.'}, 404)
  let body
  try { body = await req.json() } catch { return quizJson({error: 'Invalid request.'}, 400) }
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => !['action', 'version'].includes(k)) || !['delete', 'restore'].includes(body.action) || !Number.isInteger(body.version) || body.version < 1 || body.version >= 2147483647) return quizJson({error: 'Reload the draft before continuing.'}, 400)
  const {data: quiz, error} = await supabaseAdmin.from('quiz_assignments').select('id,course_id,title,status,version,deleted_at').eq('id', id).maybeSingle()
  if (error) throw error
  if (!quiz || !(await quizCourses(ctx)).some(c => c.id === quiz.course_id)) return quizJson({error: 'Draft unavailable.'}, 404)
  if (quiz.status !== 'draft') return quizJson({error: 'Only unpublished drafts can be deleted. Published quizzes and student work are protected.'}, 409)
  const {data: work, error: workError} = await supabaseAdmin.from('quiz_work').select('quiz_id').eq('quiz_id', id).range(0, 0)
  if (workError) throw workError
  if (work?.length) return quizJson({error: 'This quiz has student work and cannot be deleted.'}, 409)
  const deleting = body.action === 'delete'
  // Retrying after a lost response is safe; restoring increments the version again.
  if (!!quiz.deleted_at === deleting && [body.version, body.version + 1].includes(quiz.version)) return quizJson({id, title: quiz.title, version: quiz.version, deleted: deleting})
  if (quiz.version !== body.version) return quizJson({error: 'This draft changed in another window. Refresh the quiz list before continuing.'}, 409)
  let update = supabaseAdmin.from('quiz_assignments').update({deleted_at: deleting ? new Date().toISOString() : null, version: body.version + 1, updated_at: new Date().toISOString()}).eq('id', id).eq('course_id', quiz.course_id).eq('status', 'draft').eq('version', body.version)
  update = deleting ? update.is('deleted_at', null) : update.eq('deleted_at', quiz.deleted_at)
  const result = await update.select('id,title,version').maybeSingle()
  if (result.error) throw result.error
  return result.data ? quizJson({...result.data, deleted: deleting}) : quizJson({error: 'This draft changed or was published. Refresh the quiz list before continuing.'}, 409)
})
