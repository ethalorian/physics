import { prepareSequenceDate, sequenceDateNotice, saveConfirmedSequenceDate } from '@/lib/sequence-date-server'
import {hasDimensionGrade,gradeTable} from '@/lib/interactive-assignments/graded-assignment'
import {missingReviewFoundations} from '@/lib/interactive-assignments/foundations/sequence-server'
import { choiceSourceDispositions } from '@/lib/choice-calendar-server'
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { assignmentCourses,privateHeaders,lessonTargets } from '@/lib/interactive-assignments/server'
import { validPlanDate } from '@/lib/learning-week'
import { assignmentModel } from '@/lib/interactive-assignments/grading-server'
import {assignmentBySlug,assignmentByDay,submissionMatchesAssignment} from '@/lib/interactive-assignments/catalog'
export const GET=withAuth(async(request,ctx)=>{
 const slug=new URL(request.url).searchParams.get('slug'),lesson=slug?assignmentBySlug(slug):assignmentByDay(3)!
 if(!lesson)return NextResponse.json({error:'Lesson unavailable.'},{status:404})
 const courses=await assignmentCourses(ctx),staff=['teacher','admin'].includes(ctx.role),course=new URL(request.url).searchParams.get('class')
 const ids=courses.filter(c=>!course||c.id===course).map(c=>c.id)
 if(new URL(request.url).searchParams.get('view')==='calendar'){
  if(!staff)return NextResponse.json({error:'Teacher access required.'},{status:403,headers:privateHeaders})
  const r=ids.length?await supabaseAdmin.from('interactive_assignments').select('id,course_id,slug,target_id,created_at,due_on').in('course_id',ids):{data:[],error:null};if(r.error)throw r.error
  return NextResponse.json({courses,assignments:r.data,readOnly:!!ctx.viewingAsTeacher},{headers:privateHeaders})
 }
 const targets=await lessonTargets(lesson)
 if(!ids.length)return NextResponse.json({staff,courses,assignments:[],work:[],submissions:[],reviews:[],roster:[],target:targets[0],targets},{headers:privateHeaders})
 const assignments=await supabaseAdmin.from('interactive_assignments').select('id,course_id,slug,target_id,created_at,due_on').in('course_id',ids);if(assignments.error)throw assignments.error
 if(!staff){
  const choices=await choiceSourceDispositions(ids,[ctx.userId],'interactive')
  assignments.data=assignments.data.filter(a=>validPlanDate(a.due_on)&&!choices.exemptions[a.id]?.includes(ctx.userId)&&!choices.available[a.id]?.includes(ctx.userId))
 }
 if(staff&&slug)assignments.data=assignments.data.filter(a=>a.slug===slug)
 const aIds=assignments.data.map(a=>a.id)
 const prerequisites=staff?[]:await missingReviewFoundations(aIds,ctx.userId)
 assignments.data=assignments.data.map(a=>({...a,prerequisites:prerequisites.filter(p=>p.assignment_id===a.id)}))
 const roster=staff?await supabaseAdmin.from('course_students').select('course_id,student_id,students(name)').in('course_id',ids).eq('enrollment_state','ACTIVE'):{data:[],error:null};if(roster.error)throw roster.error
 if(!aIds.length)return NextResponse.json({staff,courses,assignments:[],work:[],submissions:[],reviews:[],roster:roster.data,target:targets[0],targets},{headers:privateHeaders})
 const users=staff?[...new Set(roster.data.map(r=>r.student_id))]:[ctx.userId]
 if(!users.length)return NextResponse.json({staff,courses,assignments:assignments.data,work:[],submissions:[],reviews:[],roster:roster.data,target:targets[0],targets},{headers:privateHeaders})
 const [work,submissions]=await Promise.all([supabaseAdmin.from('interactive_assignment_work').select('assignment_id,user_id,state,version,status,updated_at').in('assignment_id',aIds).in('user_id',users),supabaseAdmin.from('interactive_assignment_submissions').select('id,assignment_id,user_id,state,version,submitted_at').in('assignment_id',aIds).in('user_id',users).order('submitted_at',{ascending:false})]);if(work.error)throw work.error;if(submissions.error)throw submissions.error
 submissions.data=submissions.data.filter(s=>{const current=assignmentBySlug(assignments.data.find(a=>a.id===s.assignment_id)?.slug??'');return current&&submissionMatchesAssignment(s.state,current)})
 const makeup=staff&&lesson.foundation?await supabaseAdmin.from('foundation_makeup_work').select('assignment_id,user_id,flagged_at,approved_at').in('assignment_id',aIds).in('user_id',users):{data:[],error:null};if(makeup.error)throw makeup.error
 const subIds=submissions.data.map(s=>s.id),reviews=subIds.length?await supabaseAdmin.from('interactive_assignment_reviews').select('id,submission_id,target_id,level,feedback,created_at').in('submission_id',subIds):{data:[],error:null};if(reviews.error)throw reviews.error
 const grades=hasDimensionGrade(lesson)&&subIds.length?await supabaseAdmin.from(gradeTable(lesson)).select('submission_id,rubric_version,items,mastery,earned,possible,feedback,revision,request_id,released_at').in('submission_id',subIds):{data:[],error:null};if(grades.error)throw grades.error
 const ai=staff&&subIds.length?await supabaseAdmin.from('interactive_assignment_ai_reviews').select('submission_id,status,result,model,error,updated_at,locked_until').in('submission_id',subIds):{data:[],error:null};if(ai.error)throw ai.error
 return NextResponse.json({...(staff?{ai:ai.data,claudeConfigured:!!process.env.ANTHROPIC_API_KEY,claudeModel:assignmentModel()}:{}),makeup:makeup.data,staff,courses,assignments:assignments.data,work:work.data,submissions:submissions.data,reviews:reviews.data,grades:grades.data,roster:roster.data,target:targets[0],targets},{headers:privateHeaders})
})
export const POST=withAuth(async(request,ctx)=>{
 if(!['teacher','admin'].includes(ctx.role)||ctx.viewingAsTeacher)return NextResponse.json({error:'Use your own teacher account to assign work.'},{status:403})
 const body=await request.json(),courses=await assignmentCourses(ctx),lesson=assignmentBySlug(body.slug??assignmentByDay(3)!.slug)
 if(!lesson)return NextResponse.json({error:'Lesson unavailable.'},{status:422})
 if(!courses.some(c=>c.id===body.course_id))return NextResponse.json({error:'Class unavailable.'},{status:403})
 if(body.due_on!==undefined&&body.due_on!==null&&!validPlanDate(body.due_on))return NextResponse.json({error:'Choose a valid due date.'},{status:422})
 // Calendar dates are the assignment state. Clearing one unassigns the activity,
 // while keeping the same row and all linked answers, submissions, and ratings.
 if(![undefined,'calendar','schedule'].includes(body.action))return NextResponse.json({error:'Choose a calendar action.'},{status:422})
 if(body.due_on===undefined||(!body.action&&!validPlanDate(body.due_on)))return NextResponse.json({error:'Choose a calendar due date to assign this activity.'},{status:422})
 const target=body.due_on!==null?(await lessonTargets(lesson))[0]:null
 // One transaction creates/moves the whole linked sequence; no partial first insert.
 const owner=courses.find(c=>c.id===body.course_id)!.teacher_email
 const dateChange=await prepareSequenceDate(body.course_id,'interactive:'+lesson.slug,body.due_on,body.sequenceConfirmation)
 if(dateChange&&!dateChange.confirmed)return NextResponse.json(sequenceDateNotice(dateChange.context),{status:409,headers:privateHeaders})
 const saved=dateChange?.confirmed?await saveConfirmedSequenceDate(owner,body.course_id,'interactive:'+lesson.slug,body.due_on,dateChange.confirmed,'interactive',{},ctx.email):await supabaseAdmin.rpc('set_interactive_assignment_date',{p_course:body.course_id,p_slug:lesson.slug,p_target:target?.id??null,p_due:body.due_on,p_owner:courses.find(c=>c.id===body.course_id)!.teacher_email})
 if(saved.error){if(['P0001','23514','40P01'].includes(saved.error.code))return NextResponse.json({error:saved.error.code==='40P01'?'The calendar changed at the same time. Refresh and try again.':saved.error.message},{status:409});throw saved.error}
 if(!saved.data)return NextResponse.json({error:'Assignment unavailable. Refresh the calendar.'},{status:404})
 const linked=await supabaseAdmin.from('daily_lesson_sequences').select('foundation_id,review_id,quiz_id').eq('course_id',body.course_id).or(`foundation_id.eq.${saved.data.id},review_id.eq.${saved.data.id}`).maybeSingle();if(linked.error)throw linked.error
 const sequence=linked.data
 const quiz=sequence?await supabaseAdmin.from('quiz_assignments').select('due_at').eq('id',sequence.quiz_id).single():{data:null,error:null};if(quiz.error)throw quiz.error
 const pair=sequence?await supabaseAdmin.from('interactive_assignments').select('id,course_id,slug,target_id,created_at,due_on').in('id',[sequence.foundation_id,sequence.review_id]):{data:[],error:null};if(pair.error)throw pair.error
 return NextResponse.json({ok:true,assignment:saved.data,linkedAssignments:pair.data,sequence:sequence?{foundationDue:pair.data.find(a=>a.id===sequence.foundation_id)?.due_on,reviewDue:pair.data.find(a=>a.id===sequence.review_id)?.due_on,quizDue:quiz.data?.due_at}:null},{headers:privateHeaders})
})
