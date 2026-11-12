import { withAuth, withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { quizCourses, quizRows, quizJson, quizRpcError, quizStaff } from '@/lib/quizzes/server'
import { QUIZ_UUID } from '@/lib/quizzes/types'
import { currentBinderCatalog, binderPacket } from '@/lib/student-choice-server'
import { DEFAULT_CHOICE_COUNT, validateRequiredChoices, type StudentChoiceAssignment, type StudentChoiceReview } from '@/lib/student-choice'

export const GET = withAuth(async (_req, ctx) => {
  const staff = quizStaff(ctx), courses = (await quizCourses(ctx)).filter(c => c.program === 'physics')
  const assignments = courses.length ? await quizRows<StudentChoiceAssignment>((a, b) => {
    let q = supabaseAdmin.from('student_choice_assignments').select('*').in('course_id', courses.map(c => c.id))
    if (!staff) q = q.eq('status', 'published')
    return q.order('due_at').order('id').range(a, b)
  }) : []
  const reviews = !staff && assignments.length ? await quizRows<StudentChoiceReview>((a, b) => supabaseAdmin.from('student_choice_reviews').select('assignment_id,user_id,state,letter_grade,feedback,version,recorded_at').in('assignment_id', assignments.map(a => a.id)).eq('user_id', ctx.userId).order('assignment_id').range(a, b)) : []
  return quizJson({ staff, readOnly: ctx.viewingAsTeacher, courses: courses.map(({ id, name, section, program, track }) => ({ id, name, section, program, track })), assignments, reviews, catalog: staff ? currentBinderCatalog : [] })
})
export const POST = withRole(['teacher', 'admin'], async (req, ctx) => {
  if (ctx.viewingAsTeacher) return quizJson({ error: 'Return to your own account before assigning.' }, 403)
  const b = await req.json().catch(() => null), packet = b && binderPacket(b.packet_key)
  if (!b || !QUIZ_UUID.test(b.id ?? '') || !QUIZ_UUID.test(b.course_id ?? '') || !packet || !['cpa', 'honors'].includes(b.edition) || !packet.notes[b.edition as 'cpa' | 'honors'] || !Number.isFinite(Date.parse(b.due_at))) return quizJson({ error: 'Choose a Student Choice day, class, notebook edition and deadline.' }, 400)
  let required
  try { required = validateRequiredChoices(b.required_choices === undefined ? DEFAULT_CHOICE_COUNT : b.required_choices, packet.options.length) } catch (e) { return quizJson({ error: (e as Error).message }, 400) }
  const course = (await quizCourses(ctx)).find(c => c.id === b.course_id && c.program === 'physics')
  if (!course) return quizJson({ error: 'Choose your own Physics class.' }, 403)
  const { data, error } = await supabaseAdmin.rpc('save_student_choice_assignment', { p_id: b.id, p_course: course.id, p_packet: packet.key, p_packet_version: packet.version, p_unit: packet.unit, p_day: packet.day, p_edition: b.edition, p_title: `Day ${packet.day} · ${packet.title}`, p_due: b.due_at, p_status: 'published', p_version: 0, p_actor: ctx.email, p_owner: course.teacher_email, p_required: required, p_available: packet.options.length })
  return error ? quizRpcError(error) : quizJson({ assignment: data }, 201)
})
