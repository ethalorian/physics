import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { releaseClasses, releaseLessons } from '@/lib/lesson-release-server'
import { appliesToClass } from '@/lib/lesson-release'
import { authorizeLesson, lessonForReader } from '@/lib/lesson-access'
import { getStudentLessonWindowStatuses } from '@/lib/lesson-windows'
import { getStudentTrack } from '@/lib/student-enrollment'
import { studentReaderFlags } from '@/lib/lesson-reader-flags'
import { isAssignedTrade } from '@/lib/vocational'
import type { LanguageProfile } from '@/lib/sei'
import { submissionStatus } from '@/lib/lesson-review'
import { lessonTargetReferences, referencedLessonTargets } from '@/lib/lesson-target-references'
import type { BlockResponseMap } from '@/components/blocks/useBlockResponses'

// Read-only inspection. Never impersonates a session or calls a student mutation.
export const GET = withAuth(async (request,ctx) => {
  if (!['teacher','admin'].includes(ctx.role)) return NextResponse.json({error:'Forbidden'},{status:403})
  const params=new URL(request.url).searchParams
  const classId=params.get('class'), studentId=params.get('student'), lessonId=params.get('lesson')
  const classes=await releaseClasses(ctx.scopeEmail,ctx.role==='admin')
  if(!classId)return NextResponse.json({classes,students:[],lessons:[]})
  const course=classes.find(c=>c.id===classId)
  if(!course)return NextResponse.json({error:'Class is outside your teaching scope.'},{status:403})
  const members=await supabaseAdmin.from('course_students').select('student_id').eq('course_id',classId)
  if(members.error)throw members.error
  const ids=(members.data??[]).map(r=>r.student_id).filter(Boolean)
  if(studentId&&!ids.includes(studentId))return NextResponse.json({error:'Student is not enrolled in this class.'},{status:403})
  const roster=ids.length?await supabaseAdmin.from('students').select('id,name,email').in('id',ids).order('name'):{data:[],error:null}
  if(roster.error)throw roster.error
  const students=roster.data??[]
  if(!studentId)return NextResponse.json({classes,students,lessons:[]})
  const student=students.find(s=>s.id===studentId)
  if(!student)return NextResponse.json({error:'Student not found.'},{status:404})
  const [all,windows,track]=await Promise.all([releaseLessons(),getStudentLessonWindowStatuses(studentId),getStudentTrack(studentId)])
  const lessons=all.filter(l=>appliesToClass(l,{...course,track})).map(l=>({...l,window:windows[l.id]??{state:'closed'}}))
  const base={classes,students,student,course,lessons}
  if(!lessonId)return NextResponse.json(base,{headers:{'Cache-Control':'private, no-store'}})
  if(!lessons.some(l=>l.id===lessonId))return NextResponse.json({error:'Lesson is not in this student’s class curriculum.'},{status:403})
  const access=await authorizeLesson({userId:studentId,email:student.email??'',realRole:'student'},lessonId)
  const status=await submissionStatus(studentId,lessonId)
  if(!access.ok){const reason=await access.response.json();return NextResponse.json({...base,status,unavailable:reason.error},{headers:{'Cache-Control':'private, no-store'}})}
  const refs=lessonTargetReferences(access.document)
  const [saved,drafts,sections,bySlug,byId,flags,language,trade]=await Promise.all([
    supabaseAdmin.from('block_responses').select('block_id,response,created_at').eq('user_id',studentId).eq('lesson_id',lessonId).order('created_at'),
    supabaseAdmin.from('block_drafts').select('block_id,response,updated_at').eq('user_id',studentId).eq('lesson_id',lessonId),
    supabaseAdmin.from('lesson_section_progress').select('completed_sections,completed_anchors,document_revision').eq('user_id',studentId).eq('lesson_id',lessonId).maybeSingle(),
    supabaseAdmin.from('learning_targets').select('id,slug,statement').in('slug',refs),
    supabaseAdmin.from('learning_targets').select('id,slug,statement').in('id',refs.filter(s=>/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(s))),
    studentReaderFlags(studentId),
    supabaseAdmin.from('language_profile').select('wida,home_lang,l1_default').eq('user_id',studentId).maybeSingle(),
    supabaseAdmin.from('vocational_profiles').select('trade').eq('user_id',studentId).maybeSingle(),
  ])
  for(const result of [saved,drafts,sections,bySlug,byId,language,trade])if(result.error)throw result.error
  const targets=referencedLessonTargets(access.document,[...(bySlug.data??[]),...(byId.data??[])])
  const ratings=targets.length?await supabaseAdmin.from('mastery_records').select('target_id,level').eq('user_id',studentId).in('target_id',targets.map(t=>t.id)).order('observed_at',{ascending:false}):{data:[],error:null}
  if(ratings.error)throw ratings.error
  const visible=new Set(access.document?.blocks.map(b=>b.id)??[])
  const responses:BlockResponseMap={}
  for(const r of saved.data??[])if(visible.has(r.block_id))responses[r.block_id]={response:r.response,created_at:r.created_at}
  for(const r of drafts.data??[])if(visible.has(r.block_id)&&(!responses[r.block_id]||r.updated_at>responses[r.block_id].created_at))responses[r.block_id]={response:r.response,created_at:r.updated_at,draft:true}
  const languageProfile:LanguageProfile={userId:studentId,wida:(language.data?.wida??null) as LanguageProfile['wida'],homeLang:(language.data?.home_lang??null) as LanguageProfile['homeLang'],l1Default:Boolean(language.data?.l1_default)}
  return NextResponse.json({...base,status,flags,languageProfile,trade:isAssignedTrade(trade.data?.trade)?trade.data.trade:null,lesson:lessonForReader(access.lesson,access.document),responses,progress:sections.data,targets:targets.map(t=>({...t,self:null,teacher:ratings.data?.find(r=>r.target_id===t.id)?.level??null,delta:null}))},{headers:{'Cache-Control':'private, no-store'}})
})
