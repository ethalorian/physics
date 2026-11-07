import { withRole } from '@/lib/api-auth'
import { readingCourses, readingJson } from '@/lib/textbook-assignments-server'
import { loadGradingSettings } from '@/lib/grading-terms-server'
import { supabaseAdmin } from '@/lib/supabase'
export const GET = withRole(['teacher','admin'], async (request,ctx) => {
  const params = request.nextUrl.searchParams, cid = params.get('class'), unit = params.get('unit')
  const course = (await readingCourses(ctx)).find(c => c.id === cid)
  if (!course) return readingJson({error:'Choose one of your classes.'},403)
  if (course.program !== 'physics') return readingJson({physics:false})
  const [units,settings,releases,policy] = await Promise.all([
    supabaseAdmin.from('units').select('id,name').eq('program','physics').order('order_index'),
    loadGradingSettings(course.id),
    supabaseAdmin.from('mastery_xp_releases').select('unit_id,term_id').eq('course_id',course.id),
    supabaseAdmin.from('mastery_xp_courses').select('course_id').eq('course_id',course.id).maybeSingle(),
  ])
  if (units.error || releases.error || policy.error) return readingJson({error:'The unit floor could not load.'},503)
  const selected = unit ?? units.data[0]?.id
  if (!units.data.some(u => u.id === selected)) return readingJson({error:'Choose a Physics unit.'},400)
  const preview = await supabaseAdmin.rpc('mastery_xp_preview',{p_course:course.id,p_unit:selected})
  if (preview.error) return readingJson({error:'The roster preview could not load.'},503)
  let roster=preview.data
  if(releases.data.some(r=>r.unit_id===selected)){
    const saved=await supabaseAdmin.from('mastery_xp_results').select('user_id,assigned,completed,students(name)').eq('course_id',course.id).eq('unit_id',selected)
    if(saved.error)return readingJson({error:'Posted grades could not load.'},503)
    roster=saved.data.map(r=>({...r,name:(Array.isArray(r.students)?r.students[0]:r.students)?.name??'Student'})).sort((a,b)=>a.name.localeCompare(b.name))
  }
  return readingJson({physics:true,enabled:!!policy.data,units:units.data,terms:settings.terms,selected,releases:releases.data,roster,readOnly:ctx.viewingAsTeacher || !!ctx.session.experience})
})
export const POST = withRole(['teacher','admin'], async (request,ctx) => {
  if (ctx.viewingAsTeacher || request.headers.get('origin') !== request.nextUrl.origin) return readingJson({error:'Use your own teacher account to post a unit.'},403)
  const b=await request.json().catch(()=>null)
  if (!b || (b.action!=='enable' && (typeof b.unit!=='string' || typeof b.term!=='string' || !Array.isArray(b.preview)))) return readingJson({error:'Preview this unit before posting.'},400)
  const course=(await readingCourses(ctx)).find(c=>c.id===b.course && c.program==='physics')
  if (!course) return readingJson({error:'Class unavailable.'},403)
  if(b.action==='enable'){
    const result=await supabaseAdmin.rpc('enable_mastery_xp',{p_course:course.id,p_actor:ctx.email});
    return result.error?readingJson({error:'Could not enable unit XP. Refresh and try again.'},503):readingJson({enabled:true})
  }
  const r=await supabaseAdmin.rpc('release_mastery_xp',{p_course:course.id,p_unit:b.unit,p_term:b.term,p_actor:ctx.email,p_preview:b.preview})
  return r.error ? readingJson({error:r.error.code==='P0001'?r.error.message:'The unit was not posted. Refresh and try again.'},409) : readingJson({posted:true})
})
