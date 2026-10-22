import {NextResponse} from 'next/server'
import {withAuth} from '@/lib/api-auth'
import {supabaseAdmin} from '@/lib/supabase'
import {accessibleAssignment,privateHeaders} from '@/lib/interactive-assignments/server'
import {assessVelocity,processVelocitySubmission} from '@/lib/interactive-assignments/grading-server'
import {emptyVelocityState} from '@/lib/interactive-assignments/velocity'
import {assignmentBySlug,assignmentByDay} from '@/lib/interactive-assignments/catalog'
export const maxDuration=180
export const POST=withAuth(async(request,ctx)=>{
 if(!['teacher','admin'].includes(ctx.role)||ctx.viewingAsTeacher)return NextResponse.json({error:'Use your own teacher account to review work.'},{status:403})
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return NextResponse.json({error:'Request origin unavailable.'},{status:403})
 const body=await request.json().catch(()=>null);if(!body)return NextResponse.json({error:'Invalid request.'},{status:422})
 if(body.action==='check'){
  const lesson=assignmentBySlug(body.slug??assignmentByDay(3)!.slug);if(!lesson)return NextResponse.json({error:'Lesson unavailable.'},{status:422})
  const state=emptyVelocityState();for(const q of lesson.questions)state.answers[q.id]=q.options?String(q.correct):q.answer!==undefined?String(q.answer):q.explanation
  if(lesson.slug==='day-3-velocity')state.answers['6b']='I chose graph B. Its positive slope is velocity away from the sensor: position increases by the same amount every second. The straight line has the same rise over run everywhere, so velocity stays constant.'
  const arrow=(label:string,angle:number,magnitude:number)=>({label,angle,magnitude}),book=[arrow('Earth gravity',270,19.6),arrow('Desk normal',90,19.6)],floor=[arrow('Earth gravity',270,19.6),arrow('Floor normal',90,19.6)]
  if(!lesson.simulation&&lesson.day===10)state.answers['2a']=JSON.stringify(book)
  if(!lesson.simulation&&lesson.day===15){state.answers['1a']=JSON.stringify(book);state.answers['1b']=JSON.stringify([...floor,arrow('Hand applied push',0,10),arrow('Floor friction',180,10)]);state.answers['2a']=JSON.stringify([arrow('Earth gravity',270,9.8)]);state.answers['4a']=JSON.stringify([...floor,arrow('Rope tension',0,12),arrow('Floor friction',180,4)])}
  if(!lesson.simulation&&lesson.day===20)state.answers['4a']=JSON.stringify([arrow('Gravity from object A',180,300),arrow('Gravity from object B',270,400)])
  if(lesson.simulation==='incline-lab')state.answers['2c']=JSON.stringify([arrow('Earth gravity',270,49),arrow('Ramp normal',60,49*Math.cos(Math.PI/6)),arrow('Rope tension',150,24.5)])
  if(lesson.simulation==='free-body-diagram'){state.answers['2c']=JSON.stringify([...floor,arrow('Person push',0,10),arrow('Rope pull',180,4)]);state.answers['4a']=JSON.stringify([arrow('Earth gravity',270,39.2),arrow('Table normal',90,39.2),arrow('Person push',0,18),arrow('Rope pull',180,6)])}
  try{const g=await assessVelocity(state,true,lesson);const issues=lesson.questions.filter(q=>q.diagram).flatMap(q=>{const item=g.result.items?.find(i=>i.id===q.id);return item?.status==='complete'?[]:[q.id+': '+(item?.reason??'Missing sample assessment.')]});if(lesson.slug==='day-3-velocity'&&g.result.explanation.status!=='complete')issues.push('6b: '+g.result.explanation.reason);if(issues.length)return NextResponse.json({error:'Claude connected; sample grading needs review. '+issues.join(' ')+' Teacher rating controls remain available.'},{status:422});return NextResponse.json({ok:true,model:g.model,message:'Claude connection and sample grading passed. No student work or mastery ratings were changed.'},{headers:privateHeaders})}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Claude connection failed.'},{status:502})}
 }
 if(body.action!=='process'||typeof body.assignmentId!=='string')return NextResponse.json({error:'Invalid analysis request.'},{status:422})
 const assignment=await accessibleAssignment(ctx,body.assignmentId);if(!assignment)return NextResponse.json({error:'Assignment unavailable.'},{status:404})
 const roster=await supabaseAdmin.from('course_students').select('student_id').eq('course_id',assignment.course_id).eq('enrollment_state','ACTIVE');if(roster.error)throw roster.error
 const users=roster.data.map(r=>r.student_id);if(!users.length)return NextResponse.json({processed:0,remaining:0})
 const [work,submissions]=await Promise.all([supabaseAdmin.from('interactive_assignment_work').select('user_id,version,status').eq('assignment_id',assignment.id).in('user_id',users),supabaseAdmin.from('interactive_assignment_submissions').select('id,user_id,version').eq('assignment_id',assignment.id).in('user_id',users)]);if(work.error)throw work.error;if(submissions.error)throw submissions.error
 const ids=submissions.data.filter(s=>work.data.some(w=>w.user_id===s.user_id&&w.version===s.version&&w.status==='submitted')).map(s=>s.id)
 if(!ids.length)return NextResponse.json({processed:0,remaining:0})
 const [jobs,reviews]=await Promise.all([supabaseAdmin.from('interactive_assignment_ai_reviews').select('submission_id,status,locked_until').in('submission_id',ids),supabaseAdmin.from('interactive_assignment_reviews').select('submission_id').in('submission_id',ids)]);if(jobs.error)throw jobs.error;if(reviews.error)throw reviews.error
 const ready=jobs.data.filter(j=>reviews.data.filter(r=>r.submission_id===j.submission_id).length<(assignmentBySlug(assignment.slug)?.targets.length??1)&&(j.status==='queued'||j.status==='error'||(j.status==='processing'&&Date.parse(j.locked_until)<Date.now())))
 const results=await Promise.all(ready.slice(0,3).map(j=>processVelocitySubmission(j.submission_id,true)))
 return NextResponse.json({processed:results.filter(r=>r.processed).length,failed:results.filter(r=>'error' in r).length,remaining:Math.max(0,ready.length-3)},{headers:privateHeaders})
})
