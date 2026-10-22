import { withAuth, withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { TEXTBOOK_SYLLABUS, mapTextbookTargets } from '@/data/textbook-syllabus'
import { READING_SYLLABUS } from '@/data/reading-syllabus'
import { HONORS_READING_MAP } from '@/lib/openstax-physics'
import { buildSyllabusDrafts, resolveSyllabusWords } from '@/lib/reading-syllabus'
import { syllabusBundles } from '@/lib/reading-syllabus-server'
import { readingCourses, readingJson, readingRows, readingRpcError, readingStaff } from '@/lib/textbook-assignments-server'
import { READING_UUID, validateReading, type ReadingTarget } from '@/lib/textbook-assignments'
import { validateQuiz } from '@/lib/quizzes/validation'
import { vocabularyFor } from '@/lib/vocab-scope-server'
import { isInteractiveReading, isInteractiveSyllabusStep, INTERACTIVE_READING_ONLY } from '@/lib/reading-availability'

export const GET = withAuth(async(req,ctx)=>{
  const requested=new URL(req.url).searchParams.get('course_id')
  const courses=(await readingCourses(ctx)).filter(c=>c.program==='physics')
  if(requested&&!courses.some(c=>c.id===requested))return readingJson({error:'Choose an available Physics class.'},403)
  const selected=requested?[requested]:courses.map(c=>c.id),staff=readingStaff(ctx)
  const [bundles,targets]=await Promise.all([
    syllabusBundles(selected,staff?undefined:ctx.userId),
    staff?readingRows<ReadingTarget>((a,b)=>supabaseAdmin.from('learning_targets').select('id,slug,statement,unit_id,domain,program').eq('program','physics').eq('exclude_from_growth',false).order('id').range(a,b)):[],
  ])
  const assignable = (step: (typeof READING_SYLLABUS)[number]) => courses.filter(c => selected.includes(c.id)).some(c => isInteractiveSyllabusStep(step, c.track))
  return readingJson({staff,readOnly:ctx.viewingAsTeacher,courses:courses.map(({id,name,section,program,track})=>({id,name,section,program,track})),bundles,targets,textbookSteps:staff?TEXTBOOK_SYLLABUS.filter(assignable):[],
    steps:staff?READING_SYLLABUS.filter(assignable).map(s=>({...s,honorsReading:HONORS_READING_MAP[s.id]})):READING_SYLLABUS.map(({id,unit,title,focus,prerequisites})=>({id,unit,title,focus,prerequisites}))})
})

export const POST = withRole(['teacher','admin'],async(req,ctx)=>{
  if(ctx.viewingAsTeacher)return readingJson({error:'Use your own account to prepare or assign a syllabus step.'},403)
  let body:Record<string,unknown>
  try{const v=await req.json();if(!v||typeof v!=='object'||Array.isArray(v))throw Error();body=v}catch{return readingJson({error:'Choose a syllabus step.'},400)}
  if(!READING_UUID.test(String(body.course_id))||typeof body.step_id!=='string'||!['prepare','release'].includes(String(body.action)))return readingJson({error:'Choose a class, step, and action.'},400)
  let step=[...READING_SYLLABUS,...TEXTBOOK_SYLLABUS].find(s=>s.id===body.step_id)
  if(!step)return readingJson({error:'This syllabus step is unavailable.'},404)
  const course=(await readingCourses(ctx)).find(c=>c.id===body.course_id&&c.program==='physics')
  if(!course)return readingJson({error:'Choose your own Physics class.'},403)
  if(step.sourceBook==='openstax'&&course.track!=='honors')return readingJson({error:'Choose an Honors class for OpenStax.'},409)
  if (!isInteractiveSyllabusStep(step, course.track)) return readingJson({ error: INTERACTIVE_READING_ONLY }, 409)
  if(body.action==='release'){
    if(!Number.isInteger(body.version)||Number(body.version)<1||(typeof body.due_at!=='string'||!Number.isFinite(Date.parse(body.due_at))))return readingJson({error:'Refresh the reading and choose a valid due date.'},400)
    const saved = await supabaseAdmin.from('reading_syllabus_bundles').select('reading_id').eq('course_id',course.id).eq('step_id',step.id).maybeSingle()
    if (saved.error) throw saved.error
    if (!saved.data) return readingJson({ error: 'Prepare this interactive reading before assigning it.' }, 409)
    const reading = await supabaseAdmin.from('textbook_assignments').select('chapter,section_ids,passage,honors_reading').eq('id',saved.data.reading_id).eq('course_id',course.id).maybeSingle()
    if (reading.error) throw reading.error
    if (!reading.data || !isInteractiveReading(reading.data)) return readingJson({ error: INTERACTIVE_READING_ONLY }, 409)
    const {data,error}=await supabaseAdmin.rpc('release_reading_syllabus_step',{p_course:course.id,p_step:step.id,p_owner:course.teacher_email,p_actor:ctx.email,p_version:body.version,p_due:body.due_at})
    return error?readingRpcError(error):readingJson({bundle:data})
  }
  const catalog=await vocabularyFor(ctx,{courseId:course.id,authoring:true})
  try{step=mapTextbookTargets(step,catalog.targets,{unit:body.unit,reading_target:body.reading_target,vocabulary_target:body.vocabulary_target})}catch(e){return readingJson({error:(e as Error).message},409)}
  const resolved=resolveSyllabusWords(step.words,catalog.words,new Set(catalog.sets.filter(s=>s.unit_id===step.unit&&s.access[course.id]).map(s=>s.id)))
  let drafts
  try{
    drafts=buildSyllabusDrafts({...step,words:resolved.map(w=>({term:w.existing?.term??w.term,definition:w.existing?.definition??w.definition}))},READING_SYLLABUS,course,catalog.targets,()=>crypto.randomUUID())
    drafts.reading=validateReading(drafts.reading) as typeof drafts.reading
    if (!isInteractiveReading(drafts.reading)) throw Error(INTERACTIVE_READING_ONLY)
    drafts.readingQuiz=validateQuiz(drafts.readingQuiz);drafts.vocabularyQuiz=validateQuiz(drafts.vocabularyQuiz)
  }catch(e){return readingJson({error:(e as Error).message},409)}
  const {data,error}=await supabaseAdmin.rpc('create_reading_syllabus_bundle',{p_payload:{...drafts,words:resolved.map(w=>({term:w.existing?.term??w.term,definition:w.existing?.definition??w.definition,...(w.existing?{id:w.existing.id}:{})}))},p_actor:ctx.email,p_owner:course.teacher_email})
  return error?readingRpcError(error):readingJson({bundle:data},201)
})
