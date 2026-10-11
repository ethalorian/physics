import { NextResponse } from 'next/server'
import { withRole, type AuthContext } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { appliesToClass, type ReleaseWindow } from '@/lib/lesson-release'
import { releaseLessons } from '@/lib/lesson-release-server'
import { getCourseWindows } from '@/lib/lesson-windows'
import { isSameIdentity } from '@/lib/identity-aliases'
import { lessonWorkSchedule, sameLessonSchedule } from '@/lib/lesson-work-schedule'

async function ownedCourse(ctx:AuthContext<{courseId:string}>,courseId:string){
  const {data,error}=await supabaseAdmin.from('courses').select('teacher_email,program,track').eq('id',courseId).is('archived_at',null).maybeSingle()
  if(error)throw error
  return data&&(ctx.role==='admin'||isSameIdentity(ctx.scopeEmail,data.teacher_email))?data:null
}
export const GET=withRole<{courseId:string}>(['teacher','admin'],async(_req,ctx)=>{
  const {courseId}=await ctx.params
  if(!await ownedCourse(ctx,courseId))return NextResponse.json({error:'Choose your own class.'},{status:403})
  return NextResponse.json({windows:await getCourseWindows(courseId)})
})

// Due dates describe expectations. Only open_at / close_at grant student access.
export const POST=withRole<{courseId:string}>(['teacher','admin'],async(req,ctx)=>{
  if(ctx.viewingAsTeacher)return NextResponse.json({error:'Return to your own account before changing assignments.'},{status:403})
  const {courseId}=await ctx.params,course=await ownedCourse(ctx,courseId)
  if(!course)return NextResponse.json({error:'Choose your own class.'},{status:403})
  const body=await req.json().catch(()=>null)
  if(!body||typeof body!=='object'||Array.isArray(body)||typeof body.lesson_id!=='string')return NextResponse.json({error:'Choose a lesson and schedule.'},{status:400})
  const {data:existing,error}=await supabaseAdmin.from('lesson_class_windows').select('open_at,close_at,due_at,updated_at').eq('course_id',courseId).eq('lesson_id',body.lesson_id).maybeSingle()
  if(error)throw error
  if('expected' in body&&(!body.expected||typeof body.expected==='object')&&!sameLessonSchedule(body.expected as ReleaseWindow|null,existing))return NextResponse.json({error:'This schedule changed in another window. Refresh before saving.'},{status:409})
  let window
  try{window=lessonWorkSchedule(body,existing)}catch(e){return NextResponse.json({error:(e as Error).message},{status:422})}
  const lesson=(await releaseLessons()).find(l=>l.id===body.lesson_id)
  if(!lesson||!appliesToClass(lesson,course))return NextResponse.json({error:'This lesson is not published for this class’s curriculum and track.'},{status:422})
  const row={course_id:courseId,lesson_id:body.lesson_id,...window,set_by:ctx.email,updated_at:new Date().toISOString()}
  // Existing editors clear both dates to close. Preserve homework deadlines and
  // history for the work overview while continuing to deny student access.
  const query=existing?supabaseAdmin.from('lesson_class_windows').update(row).eq('course_id',courseId).eq('lesson_id',body.lesson_id).eq('updated_at',existing.updated_at):supabaseAdmin.from('lesson_class_windows').insert(row)
  const saved=await query.select('open_at,close_at,due_at').maybeSingle()
  if(saved.error?.code==='23505'||!saved.error&&!saved.data)return NextResponse.json({error:'This schedule changed in another window. Refresh before saving.'},{status:409})
  if(saved.error)throw saved.error
  return NextResponse.json({ok:true,window:saved.data})
})
