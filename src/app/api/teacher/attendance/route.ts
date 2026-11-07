import { withRole, type AuthContext } from '@/lib/api-auth'
import { readingCourses, readingJson } from '@/lib/textbook-assignments-server'
import { loadGradingSettings } from '@/lib/grading-terms-server'
import { validTermDate } from '@/lib/grading-terms'
import { canMarkMeeting, classMeetings, loadAttendancePreview } from '@/lib/meaningful-attendance-server'
import { ATTENDANCE_LABELS } from '@/lib/meaningful-attendance'
import { supabaseAdmin } from '@/lib/supabase'
import { QUIZ_UUID } from '@/lib/quizzes/types'

async function ownedPhysicsCourse(ctx: AuthContext, id: unknown) {
  return (await readingCourses(ctx)).find(course=>course.id===id && course.program==='physics')
}
export const GET=withRole(['teacher','admin'],async(req,ctx)=>{
  const p=req.nextUrl.searchParams,course=await ownedPhysicsCourse(ctx,p.get('class'))
  if(!course) return readingJson({error:'Choose one of your Physics classes.'},403)
  const preview=await loadAttendancePreview(course.id,p.get('term'),p.get('day'),ctx.viewingAsTeacher || !!ctx.session.experience)
  return readingJson(preview)
})

export const POST=withRole(['teacher','admin'],async(req,ctx)=>{
  if(ctx.viewingAsTeacher || ctx.session.experience || req.headers.get('origin')!==req.nextUrl.origin)
    return readingJson({error:'Use your own teacher account to change attendance.'},403)
  const body=await req.json().catch(()=>null)
  const course=await ownedPhysicsCourse(ctx,body?.course)
  if(!course) return readingJson({error:'Class unavailable.'},403)
  const term=(await loadGradingSettings(course.id)).terms.find(t=>t.id===body.term)
  if(!term) return readingJson({error:'Choose a configured grading term.'},400)
  let result
  if(body.action==='confirm') {
    if(!validTermDate(body.day) || !Array.isArray(body.marks) || !body.marks.length || body.marks.length>500 ||
      !body.marks.every((m: Record<string,unknown>)=>m && typeof m.id==='string' && QUIZ_UUID.test(m.id) &&
        typeof m.mark==='string' && Object.hasOwn(ATTENDANCE_LABELS,m.mark) && typeof m.made_up==='boolean' &&
        Number.isSafeInteger(m.revision) && Number(m.revision)>=0) ||
      new Set(body.marks.map((m:{id:string})=>m.id)).size!==body.marks.length)
      return readingJson({error:'Choose a valid mark for each student.'},400)
    if(!await canMarkMeeting(course.id,term,body.day)) return readingJson({error:'Choose an elapsed class meeting in this term.'},400)
    result=await supabaseAdmin.rpc('save_attendance_meeting',{p_course:course.id,p_term:term.id,p_day:body.day,p_marks:body.marks,p_actor:ctx.email})
  } else if(body.action==='publish-live') {
    result=await supabaseAdmin.rpc('publish_live_attendance_term',{p_course:course.id,p_term:term.id,p_actor:ctx.email})
  } else if(body.action==='post' && Array.isArray(body.preview)) {
    const { dates } = await classMeetings(course.id,[term])
    result=await supabaseAdmin.rpc('post_automatic_attendance_term',{p_course:course.id,p_term:term.id,p_days:dates,p_preview:body.preview,p_actor:ctx.email})
  } else return readingJson({error:'Choose an attendance action.'},400)
  if(result.error) return readingJson({error:result.error.code==='P0001'?result.error.message:'Attendance could not be saved. Refresh and try again.'},result.error.code==='P0001'?409:503)
  return readingJson({saved:true})
})
