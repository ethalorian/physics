import {createHash} from 'node:crypto'
import {NextResponse} from 'next/server'
import {withEnrolledStudent} from '@/lib/api-auth'
import {supabaseAdmin} from '@/lib/supabase'
import {classLesson} from '@/lib/present-server'
import type {PresentInvitation} from '@/lib/present-invitation'
import {isTicket} from '@/lib/presentation-tools'
import type {Pulse} from '@/lib/presentation-tools'

/** All active class invitations, independent of which page a student has open. */
export const GET=withEnrolledStudent(async(_req,ctx)=>{
 const json=(items:PresentInvitation[])=>NextResponse.json({invitations:items},{headers:{'Cache-Control':'private, no-store'}})
 const members=await supabaseAdmin.from('course_students').select('course_id').eq('student_id',ctx.userId).eq('enrollment_state','ACTIVE')
 if(members.error)throw members.error
 if(!members.data?.length)return json([])
 const courses=await supabaseAdmin.from('courses').select('id,name,section').in('id',members.data.map(m=>m.course_id)).is('archived_at',null)
 if(courses.error)throw courses.error
 if(!courses.data?.length)return json([])
 const sessions=await supabaseAdmin.from('present_sessions').select('id,course_id,lesson_id,poll_block_id,poll_run_id,poll_locked,poll_revealed,created_at').in('course_id',courses.data.map(c=>c.id)).eq('status','live').order('created_at',{ascending:false}).limit(20)
 if(sessions.error)throw sessions.error
 if(!sessions.data?.length)return json([])
 const ids=sessions.data.map(s=>s.id)
 const [pulses,lobbies]=await Promise.all([
  supabaseAdmin.from('present_pulses').select('id,session_id,kind,anonymous,status,created_at,prompt,options,required,locked,revealed,target_id,salt').in('session_id',ids).eq('status','open').eq('locked',false),
  supabaseAdmin.from('lobby_sessions').select('id,present_session_id,code,task_prompt,created_at').in('present_session_id',ids).in('status',['lobby','grouped','open']),
 ])
 if(pulses.error||lobbies.error)throw pulses.error||lobbies.error
 const items:PresentInvitation[]=[]
 for(const session of sessions.data){
  const course=courses.data.find(c=>c.id===session.course_id)!
  const base={sessionId:session.id,courseName:[course.name,course.section].filter(Boolean).join(' · ')}
  for(const row of pulses.data??[]){
   if(row.session_id!==session.id)continue
   const response=isTicket(row)?await supabaseAdmin.from('present_ticket_responses').select('id').eq('pulse_id',row.id).eq('user_id',ctx.userId).maybeSingle():await supabaseAdmin.from('present_pulse_responses').select('choice').eq('pulse_id',row.id).eq('respondent_key',createHash('md5').update(row.salt+ctx.userId).digest('hex')).maybeSingle()
   if(response.error)throw response.error
   if(response.data)continue
   const pulse:Pulse={id:row.id,kind:row.kind,anonymous:row.anonymous,status:row.status,created_at:row.created_at,prompt:row.prompt,options:row.options,required:row.required,locked:row.locked,revealed:row.revealed,target_id:row.target_id}
   items.push({...base,id:'pulse:'+row.id,kind:'pulse',createdAt:row.created_at,required:row.required,pulse})
  }
  for(const row of lobbies.data??[]){
   if(row.present_session_id!==session.id)continue
   const member=await supabaseAdmin.from('lobby_members').select('user_id').eq('session_id',row.id).eq('user_id',ctx.userId).maybeSingle()
   if(member.error)throw member.error
   if(!member.data)items.push({...base,id:'lobby:'+row.id,kind:'lobby',code:row.code,prompt:row.task_prompt??'Join your class activity.',createdAt:row.created_at,required:false})
  }
  if(session.lesson_id&&session.poll_block_id&&session.poll_run_id&&!session.poll_locked&&!session.poll_revealed){
   const lesson=await classLesson(session.lesson_id,session.course_id)
   const block=lesson?.content_blocks.blocks.find(b=>b.id===session.poll_block_id&&b.type==='question')
   if(!block)continue
   const answered=await supabaseAdmin.from('block_responses').select('id').eq('present_session_id',session.id).eq('poll_run_id',session.poll_run_id).eq('user_id',ctx.userId).limit(1)
   if(answered.error)throw answered.error
   if(!answered.data?.length)items.push({...base,id:'question:'+session.poll_run_id,kind:'lesson_poll',prompt:'Your teacher opened a live question. Join the class poll.',href:'/lessons/'+encodeURIComponent(lesson!.slug)+'#'+encodeURIComponent(session.poll_block_id),createdAt:session.created_at,required:false})
  }
 }
 return json(items.sort((a,b)=>Number(b.required)-Number(a.required)||b.createdAt.localeCompare(a.createdAt)))
})
