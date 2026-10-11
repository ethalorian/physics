import { withAuth, withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { READING_UUID, validateReading } from '@/lib/textbook-assignments'
import { readingCourses, readingJson, readingRows, readingRpcError, readingStaff } from '@/lib/textbook-assignments-server'

export const GET = withAuth(async (req, ctx) => {
  const lessonId = new URL(req.url).searchParams.get('lesson_id')
  if (lessonId && !READING_UUID.test(lessonId)) return readingJson({ error: 'Invalid lesson.' }, 400)
  const courses = await readingCourses(ctx), staff = readingStaff(ctx)
  if (!courses.length) return readingJson({ courses: [], assignments: [], work: [], staff })
  const assignments = await readingRows((a, b) => {
    let q = supabaseAdmin.from('textbook_assignments').select('*').in('course_id', courses.map(c => c.id))
    if (!staff) q = q.neq('status', 'draft')
    if (lessonId) q = q.like('origin_key', `lesson:${lessonId}:%`)
    return q.order('created_at', { ascending: false }).order('id').range(a, b)
  })
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
    for(const w of pending)if(enrolled.has(`${byId.get(w.assignment_id)?.course_id}:${w.user_id}`))review_counts[w.assignment_id]=(review_counts[w.assignment_id]??0)+1
  }
  return readingJson({ ...(staff?{review_counts}:{}), courses: courses.map(({ id, name, section, program }) => ({ id, name, section, program })), assignments, work, staff })
})

export const POST = withRole(['teacher', 'admin'], async (req, ctx) => {
  if (ctx.viewingAsTeacher) return readingJson({ error: 'Switch back to your own account before assigning reading.' }, 403)
  let assignment
  try { assignment = validateReading(await req.json()) } catch (e) { return readingJson({ error: (e as Error).message }, 400) }
  const course = (await readingCourses(ctx)).find(c => c.id === assignment.course_id)
  if (!course) return readingJson({ error: 'Choose one of your own classes.' }, 403)
  const { data, error } = await supabaseAdmin.rpc('save_textbook_assignment', { p_assignment: assignment, p_actor: ctx.email, p_owner: course.teacher_email })
  return error ? readingRpcError(error) : readingJson({ assignment: data }, 201)
})
