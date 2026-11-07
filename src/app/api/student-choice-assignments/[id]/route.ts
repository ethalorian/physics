import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { quizJson, quizRows, quizRpcError, quizStaff } from '@/lib/quizzes/server'
import { QUIZ_UUID } from '@/lib/quizzes/types'
import { accessStudentChoice, binderPacket } from '@/lib/student-choice-server'
import { validateChoiceReview, validateChoiceSelection, requiredChoiceCount, validateRequiredChoices, type StudentChoiceReview, type StudentChoiceSelection } from '@/lib/student-choice'

export const GET = withAuth<{ id: string }>(async (_req, ctx) => {
  const { id } = await ctx.params
  if (!QUIZ_UUID.test(id)) return quizJson({ error: 'Student Choice unavailable.' }, 404)
  const access = await accessStudentChoice(id, ctx)
  if (!access) return quizJson({ error: 'Student Choice unavailable for this account.' }, 404)
  const { assignment } = access, staff = quizStaff(ctx), packet = binderPacket(assignment.packet_key, assignment.packet_version)
  if (!packet?.notes[assignment.edition]) return quizJson({ error: 'This original page edition is temporarily unavailable.' }, 503)
  const roster = staff ? await quizRows<{ student_id: string; students: { id: string; name: string; is_active: boolean }[] | { id: string; name: string; is_active: boolean } | null }>((a, b) => supabaseAdmin.from('course_students').select('student_id,students(id,name,is_active)').eq('course_id', assignment.course_id).eq('enrollment_state', 'ACTIVE').order('id').range(a, b)) : []
  const students = roster.flatMap(r => { const s = Array.isArray(r.students) ? r.students[0] : r.students; return s && s.is_active !== false ? [{ id: s.id, name: s.name }] : [] })
  const reviews = await quizRows<StudentChoiceReview>((a, b) => {
    let q = supabaseAdmin.from('student_choice_reviews').select('assignment_id,user_id,state,letter_grade,feedback,version,recorded_at').eq('assignment_id', id)
    if (!staff) q = q.eq('user_id', ctx.userId)
    return q.order('user_id').range(a, b)
  })
  const selections = await quizRows<StudentChoiceSelection>((a, b) => {
    let q = supabaseAdmin.from('student_choice_selections').select('assignment_id,user_id,option_numbers,version,updated_at').eq('assignment_id', id)
    if (!staff) q = q.eq('user_id', ctx.userId)
    return q.order('user_id').range(a, b)
  })
  return quizJson({ staff, readOnly: ctx.viewingAsTeacher, assignment, packet, students, reviews, selections })
})
export const POST = withAuth(async (req, ctx) => {
  if (ctx.viewingAsTeacher) return quizJson({ error: 'Return to your own account before changing Student Choice.' }, 403)
  const { id } = await ctx.params
  if (!QUIZ_UUID.test(id)) return quizJson({ error: 'Student Choice unavailable.' }, 404)
  const access = await accessStudentChoice(id, ctx)
  if (!access) return quizJson({ error: 'Student Choice unavailable for this account.' }, 404)
  const b = await req.json().catch(() => null)
  if (b?.action === 'select') {
    if (ctx.realRole !== 'student' || quizStaff(ctx)) return quizJson({ error: 'Only the assigned student can save their choices.' }, 403)
    const packet = binderPacket(access.assignment.packet_key, access.assignment.packet_version)
    if (packet?.options.length !== 6) return quizJson({ error: 'This set of choices is temporarily unavailable.' }, 503)
    let selection
    try { selection = validateChoiceSelection(b, requiredChoiceCount(access.assignment)) } catch (e) { return quizJson({ error: (e as Error).message }, 400) }
    const { data, error } = await supabaseAdmin.rpc('save_student_choice_selection', { p_id: id, p_user: ctx.userId, p_options: selection.option_numbers, p_version: selection.version })
    return error ? quizRpcError(error) : quizJson({ selection: data })
  }
  if (!quizStaff(ctx)) return quizJson({ error: 'Only your teacher can change the schedule or record a review.' }, 403)
  if (b?.action === 'review') {
    if (!QUIZ_UUID.test(b.user_id ?? '')) return quizJson({ error: 'Choose an assigned student.' }, 400)
    let review
    try { review = validateChoiceReview(b) } catch (e) { return quizJson({ error: (e as Error).message }, 400) }
    const { data, error } = await supabaseAdmin.rpc('record_student_choice_review', { p_id: id, p_user: b.user_id, p_state: review.state, p_letter: review.letter_grade, p_feedback: review.feedback, p_version: review.version, p_actor: ctx.email, p_owner: access.course.teacher_email })
    return error ? quizRpcError(error) : quizJson({ review: data })
  }
  if (b?.action !== 'schedule' || !Number.isInteger(b.version) || b.version < 1 || !['published', 'archived'].includes(b.status) || !Number.isFinite(Date.parse(b.due_at))) return quizJson({ error: 'Choose a deadline and reload before saving.' }, 400)
  const a = access.assignment
  let required
  try { required = validateRequiredChoices(b.required_choices === undefined ? requiredChoiceCount(a) : b.required_choices) } catch (e) { return quizJson({ error: (e as Error).message }, 400) }
  const { data, error } = await supabaseAdmin.rpc('save_student_choice_assignment', { p_id: id, p_course: a.course_id, p_packet: a.packet_key, p_packet_version: a.packet_version, p_unit: a.unit_id, p_day: a.day, p_edition: a.edition, p_title: a.title, p_due: b.due_at, p_status: b.status, p_version: b.version, p_actor: ctx.email, p_owner: access.course.teacher_email, p_required: required })
  return error ? quizRpcError(error) : quizJson({ assignment: data })
})
