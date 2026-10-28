import { choiceSourceDispositions } from '@/lib/choice-calendar-server'
import { calendarAssigned, CALENDAR_ASSIGNMENT_MESSAGE } from '@/lib/calendar-assignment'
import { quizScheduleError } from '@/lib/quiz-schedule'
import { NextResponse } from 'next/server'
import { withAuth,withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { accessVocabTask,vocabCourses } from '@/lib/vocab-access'
import { vocabDiagnostics } from '@/lib/vocab-diagnostics'
import { quizSummary, publicVocabResults } from '@/lib/vocab-quiz'
import { duplicateVocabTask } from '@/lib/vocab-assignment-identity'
import { summarizeVocabActivity } from '@/lib/vocab-activity'
import { vocabRows } from '@/lib/vocab-pagination'
import { vocabularyFor } from '@/lib/vocab-scope-server'
import { UUID,summarizeWords,type VocabTask,type CheckRecord } from '@/lib/vocab-learning'
function groupRows<T>(rows:T[],key:(row:T)=>string):Map<string,T[]>{
 const groups=new Map<string,T[]>()
 for(const row of rows){const id=key(row),group=groups.get(id);if(group)group.push(row);else groups.set(id,[row])}
 return groups
}
function firstRows<T>(rows:T[],key:(row:T)=>string):Map<string,T>{
 const first=new Map<string,T>()
 for(const row of rows){const id=key(row);if(!first.has(id))first.set(id,row)}
 return first
}
export const GET=withAuth(async(req,ctx)=>{
 const summaryView=new URL(req.url).searchParams.get('view')==='summary'
 const staff=ctx.role==='teacher'||ctx.role==='admin'
 let q=supabaseAdmin.from('vocab_tasks').select('*').order('created_at',{ascending:false})
 if(staff) q=q.in('course_id',(await vocabCourses(ctx)).map(c=>c.id))
 else {
  const {data,error}=await supabaseAdmin.from('course_students').select('course_id').eq('student_id',ctx.userId).eq('enrollment_state','ACTIVE');if(error)throw error
  q=q.contains('student_ids',[ctx.userId]).eq('active',true).in('course_id',(data ?? []).map(c=>c.course_id))
 }
 const data=await vocabRows((from,to)=>q.order('id').range(from,to))
 let tasks=(data ?? []) as VocabTask[]
 if(!staff)tasks=tasks.filter(t=>calendarAssigned(t.active,t.due_on))
 const activeCourses=await vocabRows((a,b)=>supabaseAdmin.from('courses').select('id').in('id',[...new Set(tasks.map(t=>t.course_id))]).is('archived_at',null).order('id').range(a,b))
 const activeCourseIds=new Set(activeCourses.map(c=>c.id))
 tasks=tasks.filter(t=>activeCourseIds.has(t.course_id))
 if(!staff&&tasks.length){const choices=await choiceSourceDispositions([...new Set(tasks.map(t=>t.course_id))],[ctx.userId],'vocabulary');tasks=tasks.filter(t=>!choices.exemptions[t.id]?.includes(ctx.userId)&&!choices.available[t.id]?.includes(ctx.userId))}
 if(!tasks.length)return NextResponse.json({tasks:[]})
 const enrollments=await vocabRows((a,b)=>supabaseAdmin.from('course_students').select('course_id,student_id').in('course_id',[...new Set(tasks.map(t=>t.course_id))]).eq('enrollment_state','ACTIVE').order('id').range(a,b))
 const enrolled=new Set(enrollments.map(e=>e.course_id+'|'+e.student_id))
 tasks=tasks.map(t=>({...t,student_ids:t.student_ids.filter(id=>enrolled.has(t.course_id+'|'+id))}))
 let cq=supabaseAdmin.from('vocab_checks').select('id,task_id,user_id,created_at,completed_at,result,review_version,requires_release,reviewed_at').in('task_id',tasks.map(t=>t.id)).order('completed_at',{ascending:false}).order('id')
 if(!staff)cq=cq.eq('user_id',ctx.userId)
 const ids=staff?[...new Set(tasks.flatMap(t=>t.student_ids))]:[ctx.userId]
 const checkpointIds=tasks.filter(t=>t.quiz_format==='checkpoint').map(t=>t.id)
 // These reads depend on the authorized tasks/roster, but not on each other.
 // Keep pagination inside each read so large classes retain all their evidence.
 const [checks,checkpointAttempts,reviews,practice,studentResult,ratingResult]=await Promise.all([
  vocabRows((from,to)=>cq.range(from,to)),
  checkpointIds.length?vocabRows((a,b)=>supabaseAdmin.from('vocab_checkpoint_attempts').select('task_id,user_id,number,submitted_at,released_at').in('task_id',checkpointIds).in('user_id',ids).order('number',{ascending:false}).order('id').range(a,b)):[],
  !summaryView?vocabRows((a,b)=>supabaseAdmin.from('vocab_mastery_reviews').select('task_id,user_id,target_id,level,created_at').in('task_id',tasks.map(t=>t.id)).in('user_id',ids).order('created_at',{ascending:false}).order('id',{ascending:false}).range(a,b)):[],
  !summaryView&&staff&&ids.length?vocabRows((from,to)=>supabaseAdmin.from('vocab_attempts').select('user_id,term_id,game,correct,created_at,occurred_at').in('user_id',ids).in('term_id',[...new Set(tasks.flatMap(t=>t.term_ids))]).gte('created_at',tasks.reduce((date,t)=>t.created_at<date?t.created_at:date,tasks[0].created_at)).order('created_at').order('id').range(from,to)):[],
  !summaryView&&staff&&ids.length?supabaseAdmin.from('students').select('id,name').in('id',ids):{data:[],error:null},
  !summaryView&&staff&&ids.length?supabaseAdmin.from('mastery_records').select('user_id,target_id,level,observed_at').in('user_id',ids).in('target_id',tasks.map(t=>t.target_id).filter((id):id is string=>Boolean(id))).order('observed_at',{ascending:false}):{data:[],error:null},
 ])
 if(studentResult.error)throw studentResult.error
 if(ratingResult.error)throw ratingResult.error
 // Preserve query ordering (latest first) while avoiding repeated whole-class scans.
 const visibleChecks=staff?checks:checks.map(c=>({...c,result:publicVocabResults(c)}))
 const checkIndex=groupRows(visibleChecks,c=>c.task_id+'|'+c.user_id)
 const practiceIndex=groupRows(practice,p=>p.user_id)
 const checkpointIndex=firstRows(checkpointAttempts,a=>a.task_id+'|'+a.user_id)
 const reviewIndex=firstRows(reviews,r=>r.task_id+'|'+r.user_id+'|'+r.target_id)
 const ratingIndex=firstRows(ratingResult.data??[],r=>r.user_id+'|'+r.target_id)
 const studentIndex=firstRows(studentResult.data??[],s=>s.id)
 // Home needs completion and dates, not class diagnostics or word-level evidence.
 if(summaryView)return NextResponse.json({tasks:tasks.map(t=>({id:t.id,title:t.title,created_at:t.created_at,due_on:t.due_on,task_kind:t.task_kind,progress:(staff?t.student_ids:[ctx.userId]).map(id=>{
  const key=t.id+'|'+id,studentChecks=checkIndex.get(key)??[],latest=checkpointIndex.get(key)
  const quiz=t.task_kind==='quiz'?quizSummary(studentChecks,staff):undefined
  return {complete:summarizeWords(t,studentChecks as CheckRecord[]).complete,quiz:quiz&&t.quiz_format==='checkpoint'?{...quiz,submitted:Boolean(latest?.submitted_at),needsReview:Boolean(latest?.submitted_at&&!latest?.released_at)}:quiz}
 })}))})
 return NextResponse.json({tasks:tasks.map(t=>({...t,words:!staff&&t.task_kind==='quiz'?[]:t.words,student_ids:staff?t.student_ids:[ctx.userId],progress:(staff?t.student_ids:[ctx.userId]).map(id=>{
  const key=t.id+'|'+id,studentChecks=checkIndex.get(key)??[]
  const review=reviewIndex.get(key+'|'+t.target_id)
  const summary=t.task_kind==='quiz'?quizSummary(studentChecks,staff):undefined
  const latest=checkpointIndex.get(key)
  const quiz=summary&&t.quiz_format==='checkpoint'?{...summary,submitted:Boolean(latest?.submitted_at),needsReview:Boolean(latest?.submitted_at&&!latest?.released_at)}:summary
  return {studentId:id,name:studentIndex.get(id)?.name??'Student',masteryRating:review?{level:review.level,created_at:review.created_at}:null,diagnostics:staff?vocabDiagnostics(t,studentChecks as CheckRecord[]):undefined,quiz,activity:summarizeVocabActivity(t,studentChecks,practiceIndex.get(id)??[]),physicsRating:ratingIndex.get(id+'|'+t.target_id)?.level??null,...summarizeWords(t,studentChecks as CheckRecord[])}
 })}))})
})
export const POST=withRole(['teacher','admin'],async(req,ctx)=>{
 const b=await req.json() as {course_ids:string[];student_ids?:string[];term_ids:string[];target_id?:string;title:string;note?:string;due_on?:string;threshold:number;min_checks:number;check_mode:string;task_kind?:'practice'|'quiz';quiz_format?:string;questions?:unknown}
 if(b.task_kind==='quiz')return NextResponse.json({error:'Create vocabulary quizzes in the quiz system.',href:'/admin/control-room?view=quizzes'},{status:400})
 if(b.student_ids!==undefined&&!Array.isArray(b.student_ids))return NextResponse.json({error:'Choose valid students.'},{status:400})
 if(!Array.isArray(b.course_ids)||!b.course_ids.length||!Array.isArray(b.term_ids)||!b.term_ids.length||b.term_ids.length>60||[...b.course_ids,...b.term_ids,...(b.student_ids ?? [])].some(id=>!UUID.test(id))||!b.title?.trim()||b.title.length>200||![1,2,3,4,5].includes(b.min_checks)||!Number.isInteger(b.threshold)||b.threshold<50||b.threshold>100||!['recognition','recall'].includes(b.check_mode)||b.target_id&&!UUID.test(b.target_id)||b.due_on&&!/^\d{4}-\d{2}-\d{2}$/.test(b.due_on))return NextResponse.json({error:'Choose classes, 1–60 words, and valid completion settings.'},{status:400})
 if(b.task_kind!==undefined&&b.task_kind!=='practice')return NextResponse.json({error:'Choose a practice assignment.'},{status:400})
 if(!calendarAssigned(true,b.due_on))return NextResponse.json({error:CALENDAR_ASSIGNMENT_MESSAGE},{status:400})
 b.course_ids=[...new Set(b.course_ids)]
 const courses=await vocabCourses(ctx)
 if(b.course_ids.some(id=>!courses.some(c=>c.id===id)))return NextResponse.json({error:'Not your class'},{status:403})
 const available=await vocabularyFor(ctx,{authoring:true})
 if(b.course_ids.some(course=>b.term_ids.some(term=>!available.sets.some(set=>set.access[course]?.includes(term)))))return NextResponse.json({error:'Choose vocabulary connected to the selected classes. Refresh the word list before assigning.'},{status:400})
 if(!b.target_id)return NextResponse.json({error:'Choose a Knowledge target so this assignment can be rated in the Control Room.'},{status:400})
 const {data:target,error:targetError}=await supabaseAdmin.from('learning_targets').select('id,domain,program').eq('id',b.target_id).maybeSingle()
 if(targetError)throw targetError
 if(!target||target.domain!=='knowledge'||courses.filter(c=>b.course_ids.includes(c.id)).some(c=>(c.program??'physics')!==(target.program??'physics')))return NextResponse.json({error:'Choose a Knowledge target in the same program as every selected class.'},{status:400})
 const {data:existing,error:existingError}=await supabaseAdmin.from('vocab_tasks').select('id,active,course_id,term_ids,task_kind,student_ids,quiz_format').in('course_id',b.course_ids).eq('active',true)
 if(existingError)throw existingError
 const {data:enroll,error:e}=await supabaseAdmin.from('course_students').select('course_id,student_id').in('course_id',b.course_ids).eq('enrollment_state','ACTIVE');if(e)throw e
 const audience=(courseId:string)=>[...new Set((enroll??[]).filter(e=>e.course_id===courseId&&(!b.student_ids?.length||b.student_ids.includes(e.student_id))).map(e=>e.student_id))]
 const conflicts=b.course_ids.filter(id=>duplicateVocabTask(existing??[],id,b.term_ids,'practice',audience(id),null))
 if(conflicts.length)return NextResponse.json({error:'These words and this assessment format are already assigned to these students. Open the existing assignment or archive it first.',course_ids:conflicts},{status:409})
 if(b.student_ids?.some(id=>!enroll?.some(e=>e.student_id===id)))return NextResponse.json({error:'Student is not in the selected classes'},{status:400})
 const {data:words,error:w}=await supabaseAdmin.from('vocabulary_terms').select('id,term,definition,tier,vocabulary_set_id,icon,cognate,definition_es,translations,example').in('id',b.term_ids).eq('archived',false);if(w)throw w
 if(words?.length!==new Set(b.term_ids).size)return NextResponse.json({error:'Some words are no longer available. Refresh the list.'},{status:409})
 const {data:sets,error:s}=await supabaseAdmin.from('vocabulary_sets').select('id').in('id',words.map(w=>w.vocabulary_set_id)).eq('published',true).eq('archived',false);if(s)throw s
 if(words.some(w=>!sets?.some(s=>s.id===w.vocabulary_set_id)))return NextResponse.json({error:'Publish the word sets first'},{status:400})
 if(b.check_mode==='recognition'&&new Set(words.map(w=>w.term.toLowerCase())).size<2)return NextResponse.json({error:'Recognition needs at least two distinct words. Use recall for a single word.'},{status:400})
 const rows=b.course_ids.map(course_id=>({course_id,active:true,task_kind:'practice',quiz_format:null,target_id:b.target_id||null,title:b.title.trim(),note:(b.note??'').slice(0,2000),due_on:b.due_on||null,threshold:b.threshold,min_checks:b.min_checks,check_mode:b.check_mode,assigned_by:ctx.email,term_ids:words.map(w=>w.id),words,student_ids:[...new Set((enroll??[]).filter(e=>e.course_id===course_id&&(!b.student_ids?.length||b.student_ids.includes(e.student_id))).map(e=>e.student_id))]})).filter(t=>t.student_ids.length)
 if(!rows.length)return NextResponse.json({error:'No active students selected'},{status:400})
 const {data,error}=await supabaseAdmin.from('vocab_tasks').insert(rows).select('id');if(error?.code==='23505')return NextResponse.json({error:'These words are already assigned. Refresh to see the existing assignment.'},{status:409});if(error)throw error
 return NextResponse.json({created:data?.length,task_ids:(data as {id:string}[]??[]).map(t=>t.id)})
})
export const PATCH=withRole(['teacher','admin'],async(req,ctx)=>{
 const b=await req.json() as Record<string,unknown>
 if(!b||Array.isArray(b)||typeof b.id!=='string'||!UUID.test(b.id))return NextResponse.json({error:'Invalid assignment'},{status:400})
 if(ctx.viewingAsTeacher)return NextResponse.json({error:'Use your own teacher account to edit assignments.'},{status:403})
 const task=await accessVocabTask(b.id,ctx)
 if(!task)return NextResponse.json({error:'Not your assignment'},{status:403})
 if(task.syllabus_draft&&b.active===true)return NextResponse.json({error:'Assign this draft from the reading syllabus so its reading and class roster stay connected.'},{status:409})
 if(Object.keys(b).some(k=>!['id','due_on','active','title','note','min_checks','threshold'].includes(k)))return NextResponse.json({error:'Only assignment details and practice requirements can be edited here.'},{status:400})
 const patch:Partial<Pick<VocabTask,'due_on'|'active'|'title'|'note'|'min_checks'|'threshold'>>={}
 if(b.due_on!==undefined){if(b.due_on!==null&&(typeof b.due_on!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(b.due_on)||Number.isNaN(Date.parse(b.due_on))||new Date(b.due_on).toISOString().slice(0,10)!==b.due_on))return NextResponse.json({error:'Choose a valid due date.'},{status:400});patch.due_on=b.due_on as string|null}
 if(task.task_kind==='quiz'&&(b.due_on!==undefined||b.active===true)){const error=quizScheduleError(patch.due_on===undefined?task.due_on:patch.due_on,'vocabulary');if(error)return NextResponse.json({error},{status:400})}
 if(b.active!==undefined){if(typeof b.active!=='boolean')return NextResponse.json({error:'Invalid assignment status.'},{status:400});patch.active=b.active}
 if(b.title!==undefined){if(typeof b.title!=='string'||!b.title.trim()||b.title.length>200)return NextResponse.json({error:'Use an assignment title of 1–200 characters.'},{status:400});patch.title=b.title.trim()}
 if(b.note!==undefined){if(typeof b.note!=='string'||b.note.length>2000)return NextResponse.json({error:'Directions must be 2,000 characters or fewer.'},{status:400});patch.note=b.note}
 if(task.task_kind==='quiz'&&(b.min_checks!==undefined||b.threshold!==undefined))return NextResponse.json({error:'Check-count and practice-accuracy requirements apply to practice assignments only.'},{status:400})
 if(b.min_checks!==undefined){if(typeof b.min_checks!=='number'||![1,2,3,4,5].includes(b.min_checks))return NextResponse.json({error:'Choose 1–5 checks per word.'},{status:400});patch.min_checks=b.min_checks}
 if(b.threshold!==undefined){if(typeof b.threshold!=='number'||!Number.isInteger(b.threshold)||b.threshold<50||b.threshold>100)return NextResponse.json({error:'Choose a whole-number accuracy goal from 50 to 100 percent.'},{status:400});patch.threshold=b.threshold}
 if(patch.due_on===null)patch.active=false
 if(patch.active===true&&!calendarAssigned(true,patch.due_on===undefined?task.due_on:patch.due_on))return NextResponse.json({error:CALENDAR_ASSIGNMENT_MESSAGE},{status:400})
 if(!Object.keys(patch).length)return NextResponse.json({error:'Choose an assignment setting to change.'},{status:400})
 const {error}=await supabaseAdmin.from('vocab_tasks').update(patch).eq('id',b.id);if(error?.code==='23505')return NextResponse.json({error:'An active assignment already has these words. Archive it before reactivating this one.'},{status:409});if(error)throw error
 return NextResponse.json({ok:true})
})
