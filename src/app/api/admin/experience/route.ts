import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
async function allClasses() {
  const result = await supabaseAdmin.from('courses').select('id,name,section').order('name')
  if (result.error) throw result.error
  return result.data ?? []
}
import { getStudentProgram,getProgramUnitIds } from '@/lib/program'
import { getStudentTrack } from '@/lib/student-enrollment'
import { getStudentLessonWindowStatuses } from '@/lib/lesson-windows'
import { isLessonVisible } from '@/lib/track-visibility'
import { CURRENT_LESSON_FIELDS, isCurrentLesson } from '@/lib/current-lesson-catalog'
import { getGrantedRole } from '@/lib/roles'
import { getUserRole } from '@/lib/permissions'
import { EXPERIENCE_COOKIE, EXPERIENCE_MARKER, EXPERIENCE_MAX_AGE, ROLE_HOME, isUserRole, type ExperienceUser, type RoleExperience } from '@/lib/experience'
import { signExperience } from '@/lib/experience-token'

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } })
async function owner() {
  const session = await auth()
  if (!session?.user?.id || !session.user.email) return null
  const actor = session.experience?.actor ?? { ...session.user, name: session.user.name || session.user.email, role: session.user.role ?? 'student' }
  if (!actor.email) return null
  // Recheck the grant so a revoked DB admin cannot keep using an old preview.
  const role = getUserRole(actor.email) === 'admin' ? 'admin' : await getGrantedRole(actor.email)
  return role === 'admin' ? actor as ExperienceUser : null
}
function sameOrigin(request: NextRequest) {
  return request.headers.get('origin') === new URL(request.url).origin
}
async function staffChoices(actor: ExperienceUser) {
  const [courses, grants] = await Promise.all([
    supabaseAdmin.from('courses').select('teacher_email'),
    supabaseAdmin.from('user_roles').select('email,role').in('role', ['teacher', 'admin']),
  ])
  if (courses.error || grants.error) throw courses.error || grants.error
  return [...new Set([actor.email, ...(courses.data ?? []).map(c => c.teacher_email), ...(grants.data ?? []).map(g => g.email)].filter((email): email is string => Boolean(email)))].sort()
}
// eslint-disable-next-line no-restricted-syntax -- Authenticates the real admin actor, including while the session is projected as a student.
export async function GET(request: NextRequest) {
  try {
    const actor = await owner()
    if (!actor) return json({ error: 'Admin access required.' }, 403)
    const classes = await allClasses()
    const classId = request.nextUrl.searchParams.get('class')
    if (!classId) return json({ classes, teachers: await staffChoices(actor), students: [], actor })
    if (!classes.some(c => c.id === classId)) return json({ error: 'Class not found.' }, 404)
    const members = await supabaseAdmin.from('course_students').select('student_id').eq('course_id', classId)
    if (members.error) throw members.error
    const ids = (members.data ?? []).map(s => s.student_id)
    const roster = ids.length ? await supabaseAdmin.from('students').select('id,name,email').in('id', ids).order('name') : { data: [], error: null }
    if (roster.error) throw roster.error
    const studentId=request.nextUrl.searchParams.get('student')
    if(!studentId)return json({students:roster.data??[]})
    if(!ids.includes(studentId))return json({error:'Student is not enrolled in this class.'},403)
    const [program,track,windows,catalog]=await Promise.all([getStudentProgram(studentId),getStudentTrack(studentId),getStudentLessonWindowStatuses(studentId),supabaseAdmin.from('lessons').select(`id,title,published,visibility_track,${CURRENT_LESSON_FIELDS}`).order('title')])
    if(catalog.error)throw catalog.error
    const unitIds=new Set(await getProgramUnitIds(program))
    const availability=(catalog.data??[]).filter(isCurrentLesson).map(lesson=>({id:lesson.id,title:lesson.title,reason:!unitIds.has(lesson.unit_id)?'Different program':!lesson.published?'Unpublished':!isLessonVisible(lesson.visibility_track,{role:'student',track})?'Different course track':!windows[lesson.id]?'Not released to this student’s classes':windows[lesson.id].state==='scheduled'?'Scheduled for later':windows[lesson.id].state==='closed'?'Class access closed':'Available'}))
    return json({students:roster.data??[],availability})
  } catch (error) { console.error('[experience] directory', error); return json({ error: 'The account list could not be loaded. Try again.' }, 503) }
}
// eslint-disable-next-line no-restricted-syntax -- Real-admin authorization plus same-origin enforcement; intentionally bypasses the projected role write guard.
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return json({ error: 'Same-origin request required.' }, 403)
  try {
    const actor = await owner()
    if (!actor) return json({ error: 'Admin access required.' }, 403)
    const body = await request.json().catch(() => null)
    if (!body || !isUserRole(body.role)) return json({ error: 'Choose a role.' }, 400)
    let user: ExperienceUser = { ...actor, role: body.role }
    if (body.role === 'student') {
      if (typeof body.classId !== 'string' || typeof body.studentId !== 'string') return json({ error: 'Choose a class and student.' }, 400)
      const classes = await allClasses()
      if (!classes.some(c => c.id === body.classId)) return json({ error: 'Class not found.' }, 404)
      const member = await supabaseAdmin.from('course_students').select('student_id').eq('course_id', body.classId).eq('student_id', body.studentId).maybeSingle()
      if (member.error) throw member.error
      if (!member.data) return json({ error: 'This student is not enrolled in that class.' }, 403)
      const student = await supabaseAdmin.from('students').select('id,name,email').eq('id', body.studentId).single()
      if (student.error) throw student.error
      if (!student.data?.email) return json({ error: 'This student needs an account email before you can inspect their experience.' }, 409)
      const role = getUserRole(student.data.email) !== 'student' ? getUserRole(student.data.email) : await getGrantedRole(student.data.email)
      if (role && role !== 'student') return json({ error: 'Choose a student account, rather than a staff account.' }, 400)
      user = { ...student.data, name: student.data.name || student.data.email, role: 'student' }
    } else if (body.role === 'teacher') {
      if (typeof body.teacherEmail !== 'string' || !(await staffChoices(actor)).includes(body.teacherEmail)) return json({ error: 'Choose a teacher from the list.' }, 400)
      const teacher = await supabaseAdmin.from('students').select('id,name,email').eq('email', body.teacherEmail).maybeSingle()
      if (teacher.error) throw teacher.error
      if (teacher.data) user = { id: teacher.data.id, email: body.teacherEmail, name: teacher.data.name || body.teacherEmail, role: 'teacher' }
      else if (body.teacherEmail !== actor.email) return json({ error: 'This teacher needs to sign in once before their account can be inspected.' }, 409)
    }
    const experience: RoleExperience = { id: crypto.randomUUID(), actor, user, readOnly: true, expiresAt: Date.now() + EXPERIENCE_MAX_AGE * 1000 }
    const response = json({ redirect: ROLE_HOME[user.role] })
    const options = { secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: EXPERIENCE_MAX_AGE + 300 }
    response.cookies.set(EXPERIENCE_COOKIE, await signExperience(experience, process.env.NEXTAUTH_SECRET ?? ''), { ...options, httpOnly: true })
    response.cookies.set(EXPERIENCE_MARKER, experience.id, options)
    for (const name of ['view_as_teacher', 'view_as_student']) response.cookies.set(name, '', { path: '/', maxAge: 0 })
    return response
  } catch (error) { console.error('[experience] start', error); return json({ error: 'The walkthrough could not start. Try again.' }, 503) }
}
// eslint-disable-next-line no-restricted-syntax -- Same-origin recovery only clears preview cookies, including after session expiry.
export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return json({ error: 'Same-origin request required.' }, 403)
  // Clearing a preview can only restore the existing signed-in account. Keep
  // this recovery path usable even after expiry or a revoked role grant.
  const response = json({ redirect: '/admin/home' })
  for (const name of [EXPERIENCE_COOKIE, EXPERIENCE_MARKER, 'view_as_teacher', 'view_as_student']) response.cookies.set(name, '', { path: '/', maxAge: 0 })
  return response
}
