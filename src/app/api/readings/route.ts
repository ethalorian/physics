import { choiceSourceDispositions } from '@/lib/choice-calendar-server'
import { calendarAssigned, CALENDAR_ASSIGNMENT_MESSAGE } from '@/lib/calendar-assignment'
import { readingExemptions } from '@/lib/reading-exemptions-server'
import { withAuth, withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { READING_UUID, validateReading } from '@/lib/textbook-assignments'
import { readingCourses, readingJson, readingRows, readingRpcError, readingStaff } from '@/lib/textbook-assignments-server'
import { isInteractiveReading, INTERACTIVE_READING_ONLY } from '@/lib/reading-availability'
import { readingCalendarCourse } from '@/lib/reading-calendar-server'
import { readingReviewCounts } from '@/lib/reading-review-counts-server'

export const GET = withAuth(async (req, ctx) => {
  const params = new URL(req.url).searchParams, lessonId = params.get('lesson_id'), calendar = params.get('calendar') === '1'
  if (lessonId && !READING_UUID.test(lessonId)) return readingJson({ error: 'Invalid lesson.' }, 400)
  const courses = await readingCourses(ctx), staff = readingStaff(ctx)
  if (calendar && !staff) return readingJson({ error: 'This dashboard is for teachers.' }, 403)
  const requested = calendar ? params.get('course_id') : null
  const course = calendar ? readingCalendarCourse(courses, requested) : null
  if (requested && !course) return readingJson({ error: 'Choose one of your own classes.' }, 403)
  if (!courses.length) return readingJson({ courses: [], assignments: [], work: [], staff })
  const selected = calendar ? course ? [course.id] : [] : courses.map(c => c.id)
  const available = selected.length ? await readingRows((a, b) => {
    let q = supabaseAdmin.from('textbook_assignments').select('*').in('course_id', selected)
    if (!staff) q = q.eq('status', 'published')
    if (lessonId) q = q.like('origin_key', `lesson:${lessonId}:%`)
    return q.order('created_at', { ascending: false }).order('id').range(a, b)
  }) : []
  // Keep authoritative legacy/source/version fields for the unchanged planner
  // and undo flow. Review counts and student records are not calendar inputs.
  if (calendar) return readingJson({ courses: courses.map(({ id, name, section, program }) => ({ id, name, section, program })), assignments: available, work: [], staff })
  const exemptions = await readingExemptions(available.map(a => a.id), staff ? undefined : ctx.userId)
  const excused = new Set(exemptions.map(e => e.assignment_id + ':' + e.user_id))
  const choices = staff ? null : await choiceSourceDispositions(courses.filter(c => (c.program ?? 'physics') === 'physics').map(c => c.id), [ctx.userId], 'reading')
  const assignments = staff ? available : available.filter(a => !choices?.exemptions[a.id]?.includes(ctx.userId) && !choices?.available[a.id]?.includes(ctx.userId) && calendarAssigned(a.status,a.due_at) && !excused.has(a.id + ':' + ctx.userId) && (!a.opens_at || Date.parse(a.opens_at) <= Date.now()))
  // Only the student's own work goes to the student. Roster answers are fetched
  // on an individual teacher review page, never in list/home responses.
  const work = !staff && assignments.length ? await readingRows((a, b) => supabaseAdmin.from('textbook_work').select('*').eq('user_id', ctx.userId).in('assignment_id', assignments.map(x => x.id)).order('assignment_id').range(a, b)) : []
  const review_counts = staff ? await readingReviewCounts(assignments, courses.map(c => c.id), exemptions) : {}
  return readingJson({ ...(staff?{review_counts}:{}), courses: courses.map(({ id, name, section, program }) => ({ id, name, section, program })), assignments, work, staff })
})

export const POST = withRole(['teacher', 'admin'], async (req, ctx) => {
  if (ctx.viewingAsTeacher) return readingJson({ error: 'Switch back to your own account before assigning reading.' }, 403)
  let assignment
  try { assignment = validateReading(await req.json()) } catch (e) { return readingJson({ error: (e as Error).message }, 400) }
  if (!isInteractiveReading(assignment)) return readingJson({ error: INTERACTIVE_READING_ONLY }, 409)
  if(assignment.status==='published'&&!calendarAssigned(assignment.status,assignment.due_at))return readingJson({error:CALENDAR_ASSIGNMENT_MESSAGE},400)
  const course = (await readingCourses(ctx)).find(c => c.id === assignment.course_id)
  if (!course) return readingJson({ error: 'Choose one of your own classes.' }, 403)
  const { data, error } = await supabaseAdmin.rpc('save_textbook_assignment', { p_assignment: assignment, p_actor: ctx.email, p_owner: course.teacher_email })
  return error ? readingRpcError(error) : readingJson({ assignment: data }, 201)
})
