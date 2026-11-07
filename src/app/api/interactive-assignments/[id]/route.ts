import {FOUNDATION_SUBMISSION_GATES_PAUSED} from '@/lib/interactive-assignments/foundations/recovery'
import {resolveFoundationQuestionEdition} from '@/lib/interactive-assignments/foundations/cpa'
import {foundationEdition} from '@/lib/interactive-assignments/foundations/core-questions'
import {checkRevisionBeforeSubmit,recordRevisionSubmitted} from '@/lib/review-desk/revision-server'
import {hasDimensionGrade,gradeTable} from '@/lib/interactive-assignments/graded-assignment'
import {missingReviewFoundations} from '@/lib/interactive-assignments/foundations/sequence-server'
import {validateSimulationEvidence} from '@/lib/interactive-assignments/simulation-trials'
import { NextResponse, after } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { accessibleAssignment,privateHeaders,lessonTargets,UUID } from '@/lib/interactive-assignments/server'
import { validateVelocityState,missingVelocityAnswers } from '@/lib/interactive-assignments/velocity'
import {assignmentBySlug,submissionMatchesAssignment} from '@/lib/interactive-assignments/catalog'
import { processVelocitySubmission } from '@/lib/interactive-assignments/grading-server'
export const maxDuration=180
export const GET=withAuth<{id:string}>(async(request,ctx)=>{
 const {id}=await ctx.params,staff=['teacher','admin'].includes(ctx.role)
 const preview=assignmentBySlug(id)
 if(preview&&staff){const questionEdition=preview.foundation?resolveFoundationQuestionEdition(null,new URL(request.url).searchParams.get('edition')==='cpa'?'cpa':'honors'):undefined;const targets=await lessonTargets(preview);return NextResponse.json({questionEdition,staff:true,preview:true,slug:preview.slug,target:targets[0],targets},{headers:privateHeaders})}
 const assignment=await accessibleAssignment(ctx,id);if(!assignment)return NextResponse.json({error:'Assignment unavailable.'},{status:404})
 const lesson=assignmentBySlug(assignment.slug);if(!lesson)return NextResponse.json({error:'Lesson unavailable.'},{status:404})
 const prerequisites=staff?[]:await missingReviewFoundations([id],ctx.userId)
 if(prerequisites.length)return NextResponse.json({locked:true,staff:false,assignment,prerequisites,error:'Submit your foundation before opening this review.'},{status:403,headers:privateHeaders})
 const targets=await lessonTargets(lesson)
 const [work,submissions]=await Promise.all([supabaseAdmin.from('interactive_assignment_work').select('assignment_id,user_id,state,version,status,updated_at').eq('assignment_id',id).eq('user_id',ctx.userId).maybeSingle(),supabaseAdmin.from('interactive_assignment_submissions').select('id,assignment_id,user_id,state,version,submitted_at').eq('assignment_id',id).eq('user_id',ctx.userId).order('submitted_at',{ascending:false}).limit(1)]);if(work.error)throw work.error;if(submissions.error)throw submissions.error
 const submission=submissions.data.find(s=>submissionMatchesAssignment(s.state,lesson)),review=submission?await supabaseAdmin.from('interactive_assignment_reviews').select('id,submission_id,target_id,level,feedback,created_at').eq('submission_id',submission.id):{data:[],error:null};if(review.error)throw review.error
 const grade=hasDimensionGrade(lesson)&&submission&&work.data?.status==='submitted'&&submission.version===work.data.version?await supabaseAdmin.from(gradeTable(lesson)).select('submission_id,rubric_version,items,mastery,earned,possible,feedback,revision,request_id,released_at').eq('submission_id',submission.id).maybeSingle():{data:null,error:null};if(grade.error)throw grade.error
 const questionEdition=lesson.foundation?resolveFoundationQuestionEdition(work.data?.state??submission?.state,assignment.courseTrack):undefined
 return NextResponse.json({questionEdition,grade:grade.data,assignment,staff,work:work.data,submission,review:review.data[0]??null,reviews:review.data,slug:lesson.slug,target:targets[0],targets},{headers:privateHeaders})
})
export const POST=withAuth<{id:string}>(async(request,ctx)=>{
 if(ctx.role!=='student')return NextResponse.json({error:'Teacher preview does not save student work.'},{status:403})
 const {id}=await ctx.params,assignment=await accessibleAssignment(ctx,id);if(!assignment)return NextResponse.json({error:'Assignment unavailable.'},{status:404})
 const prerequisites=await missingReviewFoundations([id],ctx.userId)
 if(prerequisites.length)return NextResponse.json({locked:true,prerequisites,error:'Submit your foundation before opening this review.'},{status:403,headers:privateHeaders})
 const body=await request.json();if(!Number.isInteger(body.version)||body.version<0||(body.submitId&&!UUID.test(body.submitId)))return NextResponse.json({error:'Invalid save request.'},{status:422})
 const original=assignmentBySlug(assignment.slug);if(!original)return NextResponse.json({error:'Lesson unavailable.'},{status:404})
 const existing=original.foundation?await supabaseAdmin.from('interactive_assignment_work').select('state,version').eq('assignment_id',id).eq('user_id',ctx.userId).maybeSingle():{data:null,error:null}
 if(existing.error)throw existing.error
 const questionEdition=original.foundation?resolveFoundationQuestionEdition(existing.data?.state,assignment.courseTrack):undefined
 // Never trust a client's edition or let an old tab silently save different questions.
 if(original.foundation&&body.state?.foundationQuestionEdition!==questionEdition)return NextResponse.json({error:'The question version changed. Copy any unsaved answers, then reload this assignment.'},{status:409})
 const lesson=foundationEdition(original,existing.data?.state??{foundationQuestionEdition:questionEdition})
 let state;try{state=validateVelocityState(body.state,lesson.questions);if(lesson.simulation)validateSimulationEvidence(lesson.simulation,state)}catch(e){return NextResponse.json({error:(e as Error).message},{status:422})}
 if(questionEdition)state.foundationQuestionEdition=questionEdition
 const missing=missingVelocityAnswers(state,lesson.questions);if(body.submitId&&missing.length&&!(lesson.foundation&&FOUNDATION_SUBMISSION_GATES_PAUSED))return NextResponse.json({error:'Add a response to '+missing.join(', ')+'. You can submit answers even when you are unsure.'},{status:422})
 if(body.submitId&&!(lesson.foundation&&FOUNDATION_SUBMISSION_GATES_PAUSED)){const message=await checkRevisionBeforeSubmit('interactive:'+id,ctx.userId);if(message)return NextResponse.json({error:message},{status:422})}
 const result=await supabaseAdmin.rpc('write_interactive_assignment',{p_assignment:id,p_user:ctx.userId,p_version:body.version,p_state:state,p_submit:body.submitId??null})
 if(result.error){if(result.error.code==='P0001')return NextResponse.json({error:result.error.message},{status:409});throw result.error}
 if(body.submitId)await recordRevisionSubmitted('interactive:'+id,ctx.userId)
 if(body.submitId)after(async()=>{try{await processVelocitySubmission(body.submitId)}catch{console.error('[assignment-grading] Saved submission is pending analysis.')}})
 return NextResponse.json(result.data,{headers:privateHeaders})
})
