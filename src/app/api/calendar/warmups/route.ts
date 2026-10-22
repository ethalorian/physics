import { withAuth, withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { readingCourses, readingJson, readingRows, readingStaff } from '@/lib/textbook-assignments-server'
import { studentWarmupDates } from '@/lib/calendar-warmups-server'
import { validPlanDate } from '@/lib/learning-week'
import { isMathWarmupDate } from '@/lib/math-warmup-schedule'

export const GET = withAuth(async(req,ctx) => {
  if (!readingStaff(ctx)) return readingJson({days:await studentWarmupDates(ctx.userId)})
  const courseId = new URL(req.url).searchParams.get('class')
  if (!courseId) return readingJson({days:[]})
  if (!(await readingCourses(ctx)).some(c=>c.id===courseId)) return readingJson({error:'Choose your own class.'},403)
  const rows = await readingRows<{day:string}>((a,b)=>supabaseAdmin.from('calendar_warmups').select('day').eq('course_id',courseId).order('day').range(a,b))
  return readingJson({courseId,days:rows.map(r=>r.day)})
})
export const POST = withRole(['teacher','admin'],async(req,ctx) => {
  if (ctx.viewingAsTeacher) return readingJson({error:'Return to your own account to assign work.'},403)
  const body=await req.json().catch(()=>null)
  if (!body || typeof body.course_id!=='string' || !validPlanDate(body.day) || !isMathWarmupDate(body.day) || typeof body.assigned!=='boolean') return readingJson({error:'Choose a Tuesday or Thursday on the class calendar.'},400)
  if (!(await readingCourses(ctx)).some(c=>c.id===body.course_id)) return readingJson({error:'Choose your own class.'},403)
  const result=body.assigned
    ? await supabaseAdmin.from('calendar_warmups').upsert({course_id:body.course_id,day:body.day,assigned_by:ctx.email,assigned_at:new Date().toISOString()},{onConflict:'course_id,day'})
    : await supabaseAdmin.from('calendar_warmups').delete().eq('course_id',body.course_id).eq('day',body.day)
  if(result.error)throw result.error
  return readingJson({ok:true})
})
