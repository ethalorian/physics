import { assignmentBySlug } from '@/lib/interactive-assignments/catalog'
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { accessibleAssignment,UUID } from '@/lib/interactive-assignments/server'
export const POST=withAuth(async(request,ctx)=>{
 if(!['teacher','admin'].includes(ctx.role)||ctx.viewingAsTeacher)return NextResponse.json({error:'Only the teacher of this class can review this work.'},{status:403})
 const b=await request.json()
 if(b.action==='reopen'){
  if((typeof b.userId!=='string'||!b.userId.trim()||b.userId.length>200)||!Number.isInteger(b.version)||!await accessibleAssignment(ctx,b.assignmentId??''))return NextResponse.json({error:'Work unavailable.'},{status:403})
  const r=await supabaseAdmin.rpc('reopen_interactive_assignment',{p_assignment:b.assignmentId,p_user:b.userId,p_version:b.version,p_reviewer:ctx.scopeEmail,p_admin:ctx.role==='admin'});if(r.error)return NextResponse.json({error:r.error.code==='P0001'?r.error.message:'Could not return work.'},{status:409});return NextResponse.json({ok:true})
 }
 if((b.targetId!==undefined&&!UUID.test(b.targetId))||!UUID.test(b.submissionId??'')||!UUID.test(b.requestId??'')||![1,2,3].includes(b.level)||typeof b.feedback!=='string'||b.feedback.length>1600)return NextResponse.json({error:'Choose a rating of 1, 2, or 3 and keep feedback under 1600 characters.'},{status:422})
 const s=await supabaseAdmin.from('interactive_assignment_submissions').select('assignment_id').eq('id',b.submissionId).maybeSingle();if(s.error)throw s.error
 const assignment=s.data&&await accessibleAssignment(ctx,s.data.assignment_id)
 if(assignment&&assignmentBySlug(assignment.slug)?.simulation)return NextResponse.json({error:'Open the lab review to release its grade and mastery decisions together.'},{status:409})
 if(!assignment)return NextResponse.json({error:'Submission unavailable.'},{status:403})
 const r=await supabaseAdmin.rpc('rate_interactive_assignment_target',{p_id:b.requestId,p_submission:b.submissionId,p_reviewer:ctx.scopeEmail,p_admin:ctx.role==='admin',p_level:b.level,p_feedback:b.feedback.trim(),p_target:b.targetId??null})
 if(r.error)return NextResponse.json({error:r.error.code==='P0001'?r.error.message:'Could not save the rating.'},{status:409})
 return NextResponse.json({review:r.data},{status:201})
})
