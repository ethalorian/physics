import { choiceSourceDispositions } from '@/lib/choice-calendar-server'
import { calendarAssigned, CALENDAR_ASSIGNMENT_MESSAGE } from '@/lib/calendar-assignment'
import { readingExemptions } from '@/lib/reading-exemptions-server'
import { withAuth, withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { READING_UUID, validateReading } from '@/lib/textbook-assignments'
import { readingCourses, readingJson, readingRows, readingRpcError, readingStaff } from '@/lib/textbook-assignments-server'
import { isInteractiveReading, INTERACTIVE_READING_ONLY } from '@/lib/reading-availability'

export const GET = withAuth(async (req, ctx) => {
  const lessonId = new URL(req.url).searchParams.get('lesson_id')
  if (lessonId && !READING_UUID.test(lessonId)) return readingJson({ error: 'Invalid lesson.' }, 400)
  const courses = await readingCourses(ctx), staff = readingStaff(ctx)
  if (!courses.length) return readingJson({ courses: [], assignments: [], work: [], staff })
  const available = await readingRows((a, b) => {
    let q = supabaseAdmin.from('textbook_assignments').select('*').in('course_id', courses.map(c => c.id))
    if (!staff) q = q.eq('status', 'published')
    if (lessonId) q = q.like('origin_key', `lesson:${lessonId}:%`)
    return q.order('created_at', { ascending: false }).order('id').range(a, b)
  })
  const exemptions = await readingExemptions(available.map(a => a.id), staff ? undefined : ctx.userId)
  const excused = new Set(exemptions.map(e => e.assignment_id + ':' + e.user_id))
  const choices = staff ? null : await choiceSourceDispositions(courses.filter(c => (c.program ?? 'physics') === 'physics').map(c => c.id), [ctx.userId], 'reading')
  const assignments = staff ? available : available.filter(a => !choices?.exemptions[a.id]?.includes(ctx.userId) && !choices?.available[a.id]?.includes(ctx.userId) && calendarAssigned(a.status,a.due_at) && !excused.has(a.id + ':' + ctx.userId) && (!a.opens_at || Date.parse(a.opens_at) <= Date.now()))
  // Only the student's own work goes to the student. Roster answers are fetched
  // on an individual teacher review page, never in list/home responses.
  const work = !staff && assignments.length ? await readingRows((a, b) => supabaseAdmin.from('textbook_work').select('*').eq('user_id', ctx.userId).in('assignment_id', assignments.map(x => x.id)).order('assignment_id').range(a, b)) : []
  const review_counts:Record<string,number>={}
  if(staff&&assignments.some(a=>a.status==='published')){
    const [roster,pending]=await Promise.all([
      readingRows((a,b)=>supabaseAdmin.from('course_students').select('course_id,student_id').in('course_id',courses.map(c=>c.id)).eq('enrollment_state','ACTIVE').order('id').range(a,b)),
      readingRows((a,b)=>supabaseAdmin.from('textbook_work').select('assignment_id,user_id').in('assignment_id',assignments.filter(a=>a.status==='published').map(a=>a.id)).eq('state','submitted').order('assignment_id').order('user_id').range(a,b))
    ])
    const enrolled=new Set(roster.map(r=>`${r.course_id}:${r.student_id}`)),byId=new Map(assignments.map(a=>[a.id,a]))
    for(const w of pending)if(!excused.has(w.assignment_id+':'+w.user_id)&&enrolled.has(`${byId.get(w.assignment_id)?.course_id}:${w.user_id}`))review_counts[w.assignment_id]=(review_counts[w.assignment_id]??0)+1
  }
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
