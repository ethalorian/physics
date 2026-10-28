import {isLabAssignment} from '@/lib/interactive-assignments/catalog'
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { accessibleAssignment, lessonTargets, privateHeaders, UUID } from '@/lib/interactive-assignments/server'
import { assignmentBySlug } from '@/lib/interactive-assignments/catalog'
import { validLabMastery } from '@/lib/interactive-assignments/lab-grades'
import { FOUR_DIMENSION_LAB_VERSION, validLabDimensions } from '@/lib/interactive-assignments/lab-rubric'
import { processVelocitySubmission } from '@/lib/interactive-assignments/grading-server'

export const maxDuration = 180
export const POST = withAuth(async (request, ctx) => {
  if (!['teacher','admin'].includes(ctx.role) || ctx.viewingAsTeacher) return NextResponse.json({error:'Use your own teacher account to review lab work.'},{status:403})
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({error:'Request origin unavailable.'},{status:403})
  const body = await request.json().catch(()=>null)
  if (!body || !UUID.test(body.submissionId ?? '')) return NextResponse.json({error:'Choose a submitted lab.'},{status:422})
  const sub = await supabaseAdmin.from('interactive_assignment_submissions').select('id,assignment_id,user_id').eq('id',body.submissionId).maybeSingle()
  if (sub.error) throw sub.error
  const assignment = sub.data && await accessibleAssignment(ctx,sub.data.assignment_id)
  const lesson = assignment && assignmentBySlug(assignment.slug)
  if (!assignment || !lesson || !isLabAssignment(lesson)) return NextResponse.json({error:'Lab submission unavailable.'},{status:404})
  const enrolled = await supabaseAdmin.from('course_students').select('student_id').eq('course_id',assignment.course_id).eq('student_id',sub.data!.user_id).eq('enrollment_state','ACTIVE').maybeSingle()
  if (enrolled.error) throw enrolled.error
  if (!enrolled.data) return NextResponse.json({error:'Student is not in the current class roster.'},{status:403})
  if (body.action === 'analyze') {
    const result = await processVelocitySubmission(body.submissionId,true)
    return NextResponse.json(result,{status:'error' in result?502:200,headers:privateHeaders})
  }
  const targets = await lessonTargets(lesson)
  if (body.action !== 'release' || !UUID.test(body.requestId ?? '') || !Number.isInteger(body.revision) || body.revision < 0 || !validLabDimensions(body.items) || !validLabMastery(body.mastery,targets.map(t=>t.id)) || typeof body.feedback !== 'string' || body.feedback.length > 1600) return NextResponse.json({error:'Review all four rubric scores and every mastery decision before release.'},{status:422})
  const saved = await supabaseAdmin.rpc('release_simulation_lab_grade',{p_submission:body.submissionId,p_request:body.requestId,p_revision:body.revision,p_reviewer:ctx.scopeEmail,p_admin:ctx.role==='admin',p_rubric:FOUR_DIMENSION_LAB_VERSION,p_items:body.items,p_mastery:body.mastery,p_feedback:body.feedback.trim()})
  if (saved.error) return NextResponse.json({error:saved.error.code==='P0001'?saved.error.message:'Could not release this lab. Your draft is still available.'},{status:409})
  return NextResponse.json({grade:saved.data},{status:201,headers:privateHeaders})
})
