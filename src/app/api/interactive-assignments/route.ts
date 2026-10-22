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
 const roster=staff?await supabaseAdmin.from('course_students').select('course_id,student_id,students(name)').in('course_id',ids).eq('enrollment_state','ACTIVE'):{data:[],error:null};if(roster.error)throw roster.error
 if(!aIds.length)return NextResponse.json({staff,courses,assignments:[],work:[],submissions:[],reviews:[],roster:roster.data,target:targets[0],targets},{headers:privateHeaders})
 const users=staff?[...new Set(roster.data.map(r=>r.student_id))]:[ctx.userId]
 if(!users.length)return NextResponse.json({staff,courses,assignments:assignments.data,work:[],submissions:[],reviews:[],roster:roster.data,target:targets[0],targets},{headers:privateHeaders})
 const [work,submissions]=await Promise.all([supabaseAdmin.from('interactive_assignment_work').select('assignment_id,user_id,state,version,status,updated_at').in('assignment_id',aIds).in('user_id',users),supabaseAdmin.from('interactive_assignment_submissions').select('id,assignment_id,user_id,state,version,submitted_at').in('assignment_id',aIds).in('user_id',users).order('submitted_at',{ascending:false})]);if(work.error)throw work.error;if(submissions.error)throw submissions.error
 submissions.data=submissions.data.filter(s=>{const current=assignmentBySlug(assignments.data.find(a=>a.id===s.assignment_id)?.slug??'');return current&&submissionMatchesAssignment(s.state,current)})
 const subIds=submissions.data.map(s=>s.id),reviews=subIds.length?await supabaseAdmin.from('interactive_assignment_reviews').select('id,submission_id,target_id,level,feedback,created_at').in('submission_id',subIds):{data:[],error:null};if(reviews.error)throw reviews.error
 const ai=staff&&subIds.length?await supabaseAdmin.from('interactive_assignment_ai_reviews').select('submission_id,status,result,model,error,updated_at,locked_until').in('submission_id',subIds):{data:[],error:null};if(ai.error)throw ai.error
 return NextResponse.json({...(staff?{ai:ai.data,claudeConfigured:!!process.env.ANTHROPIC_API_KEY,claudeModel:assignmentModel()}:{}),staff,courses,assignments:assignments.data,work:work.data,submissions:submissions.data,reviews:reviews.data,roster:roster.data,target:targets[0],targets},{headers:privateHeaders})
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
 if(body.due_on!==null){
  const target=(await lessonTargets(lesson))[0]
  const created=await supabaseAdmin.from('interactive_assignments').upsert({course_id:body.course_id,slug:lesson.slug,target_id:target.id,due_on:body.due_on},{onConflict:'course_id,slug',ignoreDuplicates:true});if(created.error)throw created.error
 }
 const saved=await supabaseAdmin.from('interactive_assignments').update({due_on:body.due_on}).eq('course_id',body.course_id).eq('slug',lesson.slug).select('id,course_id,slug,target_id,created_at,due_on').maybeSingle();if(saved.error)throw saved.error
 return saved.data?NextResponse.json({ok:true,assignment:saved.data},{headers:privateHeaders}):NextResponse.json({error:'Assignment unavailable. Refresh the calendar.'},{status:404})
})
