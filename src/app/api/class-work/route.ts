import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { readingCourses, readingJson, readingRows } from '@/lib/textbook-assignments-server'
import { appliesToClass, lessonLabel, type ReleaseWindow } from '@/lib/lesson-release'
import { releaseLessons } from '@/lib/lesson-release-server'
import { assessmentCenterHref } from '@/lib/assessment-center'
import { lessonWorkAccess, validateWorkDue, type ClassWorkItem } from '@/lib/class-work'
import { isSameIdentity } from '@/lib/identity-aliases'

/** The teacher overview contains assignment metadata only, never student answers. */
export const GET = withRole(['teacher', 'admin'], async (req, ctx) => {
  const courseId = new URL(req.url).searchParams.get('class')
  const course = (await readingCourses(ctx)).find(c => c.id === courseId)
  if (!course) return readingJson({ error: 'Choose one of your classes.' }, 403)
  const warnings: string[] = []
  async function source<T>(label: string, promise: Promise<T[]>): Promise<T[]> {
    try { return await promise } catch (error) { console.error(`[class-work] ${label}`, error); warnings.push(`${label} could not load. Refresh to see the complete class list.`); return [] }
  }
  const list = (table: string, fields: string) => readingRows((a,b) => supabaseAdmin.from(table).select(fields).eq('course_id', course.id).order('id').range(a,b))
  const [lessons, windows, quizzes, readings, tasks, sets, bundles, enrollments, simulations] = await Promise.all([
    source('Lessons', releaseLessons()),
    source('Lesson schedules', readingRows<{lesson_id:string;open_at:string|null;close_at:string|null;due_at:string|null}>((a,b) => supabaseAdmin.from('lesson_class_windows').select('lesson_id,open_at,close_at,due_at').eq('course_id',course.id).order('lesson_id').range(a,b))),
    source('Quizzes', readingRows<{id:string;title:string;due_at:string|null;status:string;version:number;student_ids:string[]|null;kind:string}>((a,b) => supabaseAdmin.from('quiz_assignments').select('id,title,due_at,status,version,student_ids,kind').eq('course_id',course.id).is('deleted_at',null).order('id').range(a,b))),
    source('Readings', list('textbook_assignments','id,title,reading,due_at,opens_at,status,version')),
    source('Vocabulary', list('vocab_tasks','id,title,due_on,active,syllabus_draft,student_ids,task_kind')),
    source('Vocabulary sets', list('vocab_assignments','id,vocabulary_set_id,due_on,active,vocabulary_sets(name)')),
    source('Reading sequence', readingRows<{reading_id:string;practice_id:string;reading_quiz_id:string;vocabulary_quiz_id:string;step_id:string}>((a,b)=>supabaseAdmin.from('reading_syllabus_bundles').select('reading_id,practice_id,reading_quiz_id,vocabulary_quiz_id,step_id').eq('course_id',course.id).order('step_id').range(a,b))),
    source('Class roster', readingRows<{student_id:string;students:unknown}>((a,b) => supabaseAdmin.from('course_students').select('student_id,students(name)').eq('course_id',course.id).eq('enrollment_state','ACTIVE').order('id').range(a,b))),
    source('Simulations', list('simulation_assignments','id,title,due_date,is_active,published,simulation_id')),
  ])
  const studentIds = enrollments.map(e=>e.student_id)
  const missions = studentIds.length ? await source('Math missions',readingRows<{id:string;title:string;due_at:string|null;cancelled_at:string|null;user_id:string;teacher_email:string}>((a,b)=>supabaseAdmin.from('math_mission_assignments').select('id,title,due_at,cancelled_at,user_id,teacher_email').in('user_id',studentIds).order('id').range(a,b))) : []
  const audience = (ids: string[] | null) => ids ? `${ids.filter(id=>studentIds.includes(id)).length} selected students` : 'Whole class'
  const href = (view: 'lessons'|'quizzes'|'readings', id?: string) => assessmentCenterHref(view,id,course.id)
  const syllabusHref = `/admin/reading-syllabus?class=${encodeURIComponent(course.id)}`
  const windowBy = new Map(windows.map(w=>[w.lesson_id,w]))
  const items: ClassWorkItem[] = lessons.filter(l=>appliesToClass(l,{...course,track:course.track??null})).map(l=>{
    const window = windowBy.get(l.id)
    return {id:`lesson:${l.id}`,sourceId:l.id,kind:l.video_sequence?'homework':'lesson',title:lessonLabel(l),context:l.unit??'',audience:'Whole class',dueAt:window?.due_at??null,
      access:lessonWorkAccess(window),opensAt:window?.open_at,closesAt:window?.close_at,window:window as ReleaseWindow|undefined??null,
      href:href('lessons')+`&lesson=${encodeURIComponent(l.id)}${l.unit_id?'&unit='+encodeURIComponent(l.unit_id):''}`,canEditDue:true,canToggle:true}
  })
  for(const q of quizzes){
    const bundle=bundles.find(b=>b.reading_quiz_id===q.id||b.vocabulary_quiz_id===q.id)
    items.push({id:`quiz:${q.id}`,sourceId:q.id,kind:'quiz',quizSchedule:q.kind==='vocabulary'?'vocabulary':'regular',title:q.title,context:bundle?(bundle.reading_quiz_id===q.id?'Reading sequence · unlocks after reading':'Reading sequence'):'',audience:audience(q.student_ids),dueAt:q.due_at,access:q.status==='published'?'open':q.status==='draft'?'draft':'closed',version:q.version,href:q.status==='draft'&&bundle?syllabusHref:href('quizzes',q.id),canEditDue:q.status==='published',canToggle:q.status!=='draft',restriction:bundle&&q.status==='draft'?'Release with its reading sequence.':undefined})
  }
  for(const raw of readings){const r=raw as unknown as {id:string;title:string;reading:string;due_at:string|null;opens_at:string|null;status:string;version:number};const bundled=bundles.some(b=>b.reading_id===r.id);items.push({id:`reading:${r.id}`,sourceId:r.id,kind:'reading',title:r.title,context:r.reading,audience:'Whole class',dueAt:r.due_at,opensAt:r.opens_at,access:r.status==='published'?(r.opens_at&&Date.parse(r.opens_at)>Date.now()?'scheduled':'open'):r.status==='draft'?'draft':'closed',version:r.version,href:r.status==='draft'&&bundled?syllabusHref:href('readings',r.id),canEditDue:r.status!=='draft',canToggle:r.status!=='draft',restriction:r.status==='draft'&&bundled?'Release with its reading sequence.':undefined})}
  for(const raw of tasks){const t=raw as unknown as {id:string;title:string;due_on:string|null;active:boolean;syllabus_draft:boolean;student_ids:string[];task_kind:string};if(t.task_kind==='quiz')continue;items.push({id:`vocab:${t.id}`,sourceId:t.id,kind:'vocabulary',quizSchedule:t.task_kind==='quiz'?'vocabulary':undefined,title:t.title,context:'Practice or checkpoint',audience:audience(t.student_ids),dueAt:t.due_on,dateOnly:true,access:t.active?'open':t.syllabus_draft?'draft':'closed',href:t.syllabus_draft?syllabusHref:`/admin/vocabulary/tasks?class=${course.id}&task_id=${t.id}`,canEditDue:!t.syllabus_draft&&course.teacher_email===ctx.scopeEmail,canToggle:!t.syllabus_draft&&course.teacher_email===ctx.scopeEmail,restriction:t.syllabus_draft?'Release with its reading sequence.':undefined})}
  for(const raw of sets){const s=raw as unknown as {id:string;vocabulary_set_id:string;due_on:string|null;active:boolean;vocabulary_sets:{name:string}|null};items.push({id:`set:${s.id}`,sourceId:s.id,kind:'vocabulary-set',title:s.vocabulary_sets?.name??'Vocabulary set',context:'Assigned word set',audience:'Whole class',dueAt:s.due_on,dateOnly:true,access:s.active?'open':'closed',href:`/admin/vocabulary/assign?class=${course.id}`,canEditDue:true,canToggle:true})}
  for(const m of missions){const student=enrollments.find(e=>e.student_id===m.user_id)?.students as {name?:string}|null;items.push({id:`math:${m.id}`,sourceId:m.id,kind:'math',title:m.title,context:'Individual skill practice',audience:student?.name??'One student',dueAt:m.due_at,access:m.cancelled_at?'closed':'open',href:`/admin/math-spine/missions?user_id=${encodeURIComponent(m.user_id)}`,canEditDue:isSameIdentity(ctx.scopeEmail,m.teacher_email),canToggle:isSameIdentity(ctx.scopeEmail,m.teacher_email)})}
  for(const raw of simulations){const s=raw as unknown as {id:string;title:string|null;due_date:string|null;published:boolean;is_active:boolean};items.push({id:`simulation:${s.id}`,sourceId:s.id,kind:'simulation',title:s.title??'Simulation assignment',context:'Class simulation',audience:'Whole class',dueAt:s.due_date,access:!s.published?'draft':s.is_active?'open':'closed',href:'/admin/simulations/assignments',canEditDue:true,canToggle:s.published})}
  return readingJson({courseId:course.id,items,warnings,readOnly:ctx.viewingAsTeacher||!isSameIdentity(ctx.scopeEmail,course.teacher_email)})
})

// Older assignment types have no embedded schedule editor. Keep their changes
// narrow, class-scoped, and conditional on the metadata the teacher just saw.
export const PATCH = withRole(['teacher','admin'], async(req,ctx)=>{
  if(ctx.viewingAsTeacher)return readingJson({error:'Return to your own account before changing assignments.'},403)
  const b=await req.json().catch(()=>null)
  if(!b||typeof b!=='object'||Array.isArray(b)||!['vocabulary-set','math','simulation'].includes(b.kind)||!['due','open','close'].includes(b.action)||typeof b.id!=='string'||typeof b.courseId!=='string')return readingJson({error:'Choose an assignment and action.'},400)
  const course=(await readingCourses(ctx)).find(c=>c.id===b.courseId)
  if(!course)return readingJson({error:'Choose one of your classes.'},403)
  let due:string|null=null
  if(b.action==='due'){try{due=validateWorkDue(b.due_at,b.kind==='vocabulary-set')}catch(e){return readingJson({error:(e as Error).message},400)}}
  const table=b.kind==='math'?'math_mission_assignments':b.kind==='simulation'?'simulation_assignments':'vocab_assignments'
  let q=supabaseAdmin.from(table).select('*').eq('id',b.id)
  if(b.kind!=='math')q=q.eq('course_id',course.id)
  const {data:row,error}=await q.maybeSingle();if(error)throw error
  if(!row)return readingJson({error:'Assignment unavailable.'},404)
  if(b.kind==='math'){
    if(!isSameIdentity(ctx.scopeEmail,row.teacher_email))return readingJson({error:'Only the assigning teacher can change this mission.'},403)
    const {data:enrollment,error:enrollmentError}=await supabaseAdmin.from('course_students').select('id').eq('course_id',course.id).eq('student_id',row.user_id).eq('enrollment_state','ACTIVE').maybeSingle()
    if(enrollmentError)throw enrollmentError
    if(!enrollment)return readingJson({error:'Student is not enrolled in this class.'},403)
  }
  const dateKey=b.kind==='math'?'due_at':b.kind==='simulation'?'due_date':'due_on'
  const access=b.kind==='math'?(row.cancelled_at?'closed':'open'):b.kind==='simulation'?(!row.published?'draft':row.is_active?'open':'closed'):row.active?'open':'closed'
  if(b.expectedDue!==(row[dateKey]??null)||b.expectedAccess!==access)return readingJson({error:'Assignment changed. Refresh before saving.'},409)
  if(access==='draft'&&b.action!=='due')return readingJson({error:'Publish this draft in its assignment editor first.'},409)
  const patch=b.action==='due'?{[dateKey]:due}:b.kind==='math'?{cancelled_at:b.action==='close'?new Date().toISOString():null}:b.kind==='simulation'?{is_active:b.action==='open'}:{active:b.action==='open'}
  let update=supabaseAdmin.from(table).update(patch).eq('id',row.id)
  update=row[dateKey]===null?update.is(dateKey,null):update.eq(dateKey,row[dateKey])
  if(b.kind==='math')update=row.cancelled_at?update.eq('cancelled_at',row.cancelled_at):update.is('cancelled_at',null)
  else if(b.kind==='simulation')update=update.eq('is_active',row.is_active).eq('published',row.published)
  else update=update.eq('active',row.active)
  const saved=await update.select('id').maybeSingle()
  if(saved.error)throw saved.error
  return saved.data?readingJson({ok:true}):readingJson({error:'Assignment changed. Refresh before saving.'},409)
})
