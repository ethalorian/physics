import { validateWorkDue } from '@/lib/class-work'
import { parseLessonReadingKey } from '@/lib/lesson-reading-key'
import { readingQuizForStudent } from '@/lib/reading-quiz-access'
import { CURRENT_LESSON_FIELDS, isCurrentLesson } from '@/lib/current-lesson-catalog'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { READING_UUID, validateReadingAnswers, type ReadingSubmission, type ReadingWork } from '@/lib/textbook-assignments'
import { accessReading, readingJson, readingRows, readingRpcError, readingStaff } from '@/lib/textbook-assignments-server'

export const GET = withAuth<{ id: string }>(async (_req, ctx) => {
  const { id } = await ctx.params
  if (!READING_UUID.test(id)) return readingJson({ error: 'Reading unavailable.' }, 404)
  const access = await accessReading(id, ctx)
  if (!access) return readingJson({ error: 'Reading unavailable for this account.' }, 404)
  const staff = readingStaff(ctx), assignment = access.assignment
  const roster = staff ? await readingRows((a, b) => supabaseAdmin.from('course_students').select('student_id,students(id,name)').eq('course_id', assignment.course_id).eq('enrollment_state', 'ACTIVE').order('id').range(a, b)) : []
  const students = roster.flatMap(r => {
    const s = (Array.isArray(r.students) ? r.students[0] : r.students) as { id: string; name: string } | null
    return s ? [s] : []
  })
  const users = staff ? students.map(s => s.id) : [ctx.userId]
  const targetIds = [...new Set(assignment.questions.map(q => q.target_id))]
  const [work, submissions, targets] = await Promise.all([
    users.length ? readingRows<ReadingWork>((a, b) => supabaseAdmin.from('textbook_work').select('*').eq('assignment_id', id).in('user_id', users).order('user_id').range(a, b)) : [],
    users.length ? readingRows<ReadingSubmission>((a, b) => supabaseAdmin.from('textbook_submissions').select('*').eq('assignment_id', id).in('user_id', users).order('submitted_at', { ascending: false }).order('id').range(a, b)) : [],
    readingRows((a, b) => supabaseAdmin.from('learning_targets').select('id,statement,unit_id,domain,program').in('id', targetIds).order('id').range(a, b)),
  ])
  const reviews = submissions.length ? await readingRows((a, b) => supabaseAdmin.from('textbook_reviews').select('id,submission_id,decision,ratings,note,reviewed_at').in('submission_id', submissions.map(s => s.id)).order('reviewed_at', { ascending: false }).order('id').range(a, b)) : []
  const origin=assignment.origin_key?parseLessonReadingKey(assignment.origin_key):null
  let lesson_slug:string|null=null
  if(origin){const {data:lesson,error}=await supabaseAdmin.from('lessons').select(`slug,${CURRENT_LESSON_FIELDS}`).eq('id',origin.lessonId).maybeSingle();if(error)throw error;lesson_slug=lesson&&isCurrentLesson(lesson)?lesson.slug:null}
  const readingQuiz=staff?null:await readingQuizForStudent(id,ctx.userId)
  return readingJson({ assignment, students, work, submissions, targets, reviews, staff, lesson_slug, readingQuiz })
})

export const POST = withAuth<{ id: string }>(async (req, ctx) => {
  const { id } = await ctx.params
  if (!READING_UUID.test(id)) return readingJson({ error: 'Reading unavailable.' }, 404)
  const access = await accessReading(id, ctx)
  if (!access) return readingJson({ error: 'Reading unavailable for this account.' }, 404)
  let b
  try { b = await req.json() } catch { return readingJson({ error: 'Invalid request.' }, 400) }
  if (!b || typeof b !== 'object') return readingJson({ error: 'Invalid request.' }, 400)
  const staff = readingStaff(ctx)
  if (staff) {
    if (ctx.viewingAsTeacher) return readingJson({ error: 'Switch back to your own account before making changes.' }, 403)
    if (b.action === 'due-date' || b.action === 'reopen') {
      if (access.assignment.status === 'draft' || b.action === 'reopen' && access.assignment.status !== 'archived') return readingJson({ error: 'Refresh the assignment before changing it.' }, 409)
      if (!Number.isInteger(b.version) || b.version < 1 || b.version >= 2147483647) return readingJson({ error: 'Reload the assignment.' }, 400)
      let due_at: string | null = access.assignment.due_at
      if (b.action === 'due-date') { try { due_at = validateWorkDue(b.due_at) } catch(e) { return readingJson({ error: (e as Error).message }, 400) } }
      const {data,error} = await supabaseAdmin.from('textbook_assignments').update({ ...(b.action === 'reopen' ? {status:'published'} : {due_at}), version:b.version+1, updated_at:new Date().toISOString() }).eq('id',id).eq('version',b.version).eq('status',access.assignment.status).select('id,due_at,version').maybeSingle()
      if(error)throw error
      return data ? readingJson(data) : readingJson({error:'Assignment changed. Refresh before saving.'},409)
    }
    if (b.action === 'archive') {
      if (access.assignment.status !== 'published') return readingJson({ error: 'Only published readings can be archived.' }, 409)
      if (!Number.isInteger(b.version)) return readingJson({ error: 'Reload the assignment.' }, 400)
      const { data, error } = await supabaseAdmin.from('textbook_assignments').update({ status: 'archived', version: b.version + 1, updated_at: new Date().toISOString() }).eq('id', id).eq('status', 'published').eq('version', b.version).select('id').maybeSingle()
      if (error) throw error
      return data ? readingJson({ ok: true }) : readingJson({ error: 'Assignment changed. Reload before archiving.' }, 409)
    }
    if (b.action !== 'review' || !READING_UUID.test(b.submission_id ?? '') || !READING_UUID.test(b.request_id ?? '') || !['rated', 'returned'].includes(b.decision) || typeof b.note !== 'string' || b.note.length > 2000 || !b.ratings || typeof b.ratings !== 'object' || Array.isArray(b.ratings)) return readingJson({ error: 'Complete the review.' }, 400)
    const { data: submission, error: subError } = await supabaseAdmin.from('textbook_submissions').select('id').eq('id', b.submission_id).eq('assignment_id', id).maybeSingle()
    if (subError) throw subError
    if (!submission) return readingJson({ error: 'Submission unavailable.' }, 404)
    const { data, error } = await supabaseAdmin.rpc('review_textbook_submission', { p_submission: submission.id, p_request: b.request_id, p_actor: ctx.email, p_owner: access.course.teacher_email, p_decision: b.decision, p_ratings: b.ratings, p_note: b.note.trim() })
    return error ? readingRpcError(error) : readingJson({ review: data })
  }
  if (ctx.realRole !== 'student' || !['save', 'submit'].includes(b.action)) return readingJson({ error: 'Action unavailable.' }, 403)
  if (!Number.isInteger(b.version) || b.version < 0 || !READING_UUID.test(b.request_id ?? '')) return readingJson({ error: 'Reload the reading before continuing.' }, 400)
  let answers
  try { answers = validateReadingAnswers(b.answers, access.assignment.questions, b.action === 'submit') } catch (e) { return readingJson({ error: (e as Error).message }, 400) }
  const { data, error } = await supabaseAdmin.rpc('textbook_student_action', { p_assignment: id, p_user: ctx.userId, p_action: b.action, p_answers: answers, p_version: b.version, p_request: b.request_id })
  if(error)return readingRpcError(error)
  return readingJson({ work: data, ...(b.action==='submit'?{readingQuiz:await readingQuizForStudent(id,ctx.userId)}:{}) })
})
