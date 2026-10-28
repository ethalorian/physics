import 'server-only'
import {NextRequest} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase'
import type {NativeAction} from './action-plan'
export {reviewActions,type NativeAction} from './action-plan'
/** Invoke the existing authenticated routes in-process; never follow a client-supplied URL. */
export async function performNativeAction(request:NextRequest,action:NativeAction,actor?:string){
 const b=action.body
 if(action.route==='review-grade'&&b.action==='override'){const r=await supabaseAdmin.from('review_module_scores').select('revision,overrides').eq('module_slug',b.slug).eq('user_id',b.user_id).maybeSingle();if(r.error)throw r.error;const previous=r.data?.overrides?.[String(b.field)];if(r.data?.revision===Number(b.revision)+1&&previous?.score===b.score&&previous?.feedback===String(b.feedback).trim())return {saved:true,replayed:true}}
 if(action.route==='interactive'&&b.action==='reopen'){const r=await supabaseAdmin.from('interactive_assignment_work').select('status,version').eq('assignment_id',b.assignmentId).eq('user_id',b.userId).maybeSingle();if(r.error)throw r.error;if(r.data?.status==='draft'&&r.data.version===Number(b.version)+1)return {saved:true,replayed:true}}
 if(action.route==='review-admin'&&b.action==='reopen'){const r=await supabaseAdmin.from('review_module_work').select('status,version').eq('module_slug',b.slug).eq('user_id',b.user_id).maybeSingle();if(r.error)throw r.error;if(r.data?.status==='draft'&&r.data.version===Number(b.version)+1)return {saved:true,replayed:true}}
 if(action.route==='math-revision'){const r=await supabaseAdmin.from('math_warmup_revisions').select('status,teacher_reply,next_step,acknowledged_by').eq('submission_id',b.submission_id).maybeSingle();if(r.error)throw r.error;if(r.data?.status==='acknowledged'&&r.data.teacher_reply===b.message&&r.data.next_step===b.next_step&&r.data.acknowledged_by===actor)return {saved:true,replayed:true}}
 const routes={mission:()=>import('@/app/api/math-missions/teacher/route'),quiz:()=>import('@/app/api/quizzes/[id]/route'),reading:()=>import('@/app/api/readings/[id]/route'),interactive:()=>import('@/app/api/interactive-assignments/review/route'),lab:()=>import('@/app/api/interactive-assignments/lab-grade/route'),transfer:()=>import('@/app/api/interactive-assignments/transfer-grade/route'),'review-admin':()=>import('@/app/api/review-modules/admin/route'),'review-grade':()=>import('@/app/api/review-modules/grading/route'),math:()=>import('@/app/api/math-spine/warmup-review/route'),'math-revision':()=>import('@/app/api/math-spine/revision/route'),mastery:()=>import('@/app/api/mastery/evidence-review/route'),'lesson-review':()=>import('@/app/api/mastery/lesson-review/route'),checkpoint:()=>import('@/app/api/vocab/checkpoints/route'),vocabulary:()=>import('@/app/api/vocab/checks/route'),record:()=>import('@/app/api/mastery/records/route'),choice:()=>import('@/app/api/choice-calendar/route')}
 const loader=routes[action.route as keyof typeof routes];if(!loader)throw Error('Review action unavailable.')
 const routeModule=await loader(),method=action.method??'POST'
 const handler=routeModule[method as keyof typeof routeModule] as (req:NextRequest,ctx:{params:Promise<Record<string,string>>})=>Promise<Response>
 if(typeof handler!=='function')throw Error('Review action unavailable.')
 const headers=new Headers(request.headers);headers.set('content-type','application/json');headers.set('origin',request.nextUrl.origin)
 const result=await handler(new NextRequest(request.url,{method,headers,body:JSON.stringify(action.body)}),{params:Promise.resolve(action.id?{id:action.id}:{} as Record<string,string>)})
 const data=await result.json();if(!result.ok)throw Error(typeof data.error==='string'?data.error:'This review could not be saved. Refresh and retry.')
 return data
}
