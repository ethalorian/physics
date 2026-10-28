import {NextResponse} from 'next/server'
import {withAuth} from '@/lib/api-auth'
import {supabaseAdmin} from '@/lib/supabase'
import {accessibleAssignment,privateHeaders,UUID} from '@/lib/interactive-assignments/server'
import {foundationGroupView} from '@/lib/interactive-assignments/foundations/groups'
import {getAvatarData} from '@/lib/lobby/avatars'
import {assignmentBySlug} from '@/lib/interactive-assignments/catalog'
import {getFoundationCheckpoints,emptyCheckpointWriting} from '@/lib/interactive-assignments/foundations/checkpoints'

export const GET=withAuth<{id:string}>(async(_req,ctx)=>{
 const {id}=await ctx.params,a=await accessibleAssignment(ctx,id),foundation=a?assignmentBySlug(a.slug)?.foundation:undefined
 const definitions=foundation?getFoundationCheckpoints(foundation):[]
 if(!a||!foundation||ctx.role!=='student')return NextResponse.json({error:'Assigned foundation unavailable.'},{status:404,headers:privateHeaders})
 const makeup=await supabaseAdmin.from('foundation_makeup_work').select('flagged_at,approved_at,responses').eq('assignment_id',id).eq('user_id',ctx.userId).maybeSingle()
 if(makeup.error)throw makeup.error
 if(makeup.data){
  const responses=makeup.data.responses
  let available=!!makeup.data.approved_at
  const checkpoints=definitions.map(c=>{
   const own={...emptyCheckpointWriting(),...(responses[c.id]??{})},complete=!!own.reflection
   const result={id:c.id,own,peer:null,peerShared:false,available,complete};available=available&&complete;return result
  })
  return NextResponse.json({pair:{code:'',slot:1,peerJoined:false,peerName:null,makeup:true,approved:!!makeup.data.approved_at,flaggedAt:makeup.data.flagged_at,checkpoints,complete:checkpoints.every(c=>c.complete)}},{headers:privateHeaders})
 }
 const own=await supabaseAdmin.from('foundation_pair_members').select('pair_id,slot').eq('assignment_id',id).eq('user_id',ctx.userId).maybeSingle()
 if(own.error)throw own.error
 if(!own.data)return NextResponse.json({pair:null},{headers:privateHeaders})

 const [pair,membership,responses]=await Promise.all([
  supabaseAdmin.from('foundation_pairs').select('code,protocol_version,started_at,notification_key').eq('id',own.data.pair_id).single(),
  supabaseAdmin.from('foundation_pair_members').select('user_id,slot').eq('pair_id',own.data.pair_id).order('slot'),
  supabaseAdmin.from('foundation_checkpoint_responses').select('user_id,checkpoint,contribution,contributed_at,reply,replied_at,reflection,reflected_at,reply_to_user_id').eq('pair_id',own.data.pair_id),
 ])
 if(pair.error)throw pair.error
 if(membership.error)throw membership.error
 if(responses.error)throw responses.error
 const ids=membership.data.map(m=>m.user_id)
 const [profiles,requests,avatars]=await Promise.all([
  supabaseAdmin.from('students').select('id,name').in('id',ids),
  supabaseAdmin.from('foundation_makeup_work').select('user_id,approved_at').eq('assignment_id',id).in('user_id',ids),
  getAvatarData(ids),
 ])
 if(profiles.error)throw profiles.error
 if(requests.error)throw requests.error
 const members=membership.data.map(m=>{
  const request=requests.data.find(r=>r.user_id===m.user_id)
  return {...m,name:profiles.data.find(p=>p.id===m.user_id)?.name||'Classmate',isYou:m.user_id===ctx.userId,independent:request?(request.approved_at?'approved' as const:'pending' as const):null,avatar:avatars.byUser[m.user_id]??{traits:{},equipped:{}}}
 })
 const state=foundationGroupView(definitions,ctx.userId,pair.data,members,responses.data)
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
 return NextResponse.json({pair:{...state,items:avatars.items,realtime:url&&key?{url,key,topic:'foundation:'+pair.data.notification_key}:null}},{headers:privateHeaders})
})

export const POST=withAuth<{id:string}>(async(req,ctx)=>{
 const {id}=await ctx.params,a=await accessibleAssignment(ctx,id),foundation=a?assignmentBySlug(a.slug)?.foundation:undefined
 const definitions=foundation?getFoundationCheckpoints(foundation):[]
 if(!a||!foundation)return NextResponse.json({error:'Assigned foundation unavailable.'},{status:404,headers:privateHeaders})
 let b;try{b=await req.json()}catch{return NextResponse.json({error:'Choose a valid partner action.'},{status:422,headers:privateHeaders})}
 if(b?.action==='approveMakeup'){
  if(!['teacher','admin'].includes(ctx.role)||!['teacher','admin'].includes(ctx.realRole)||ctx.viewingAsTeacher)return NextResponse.json({error:'Use your own teacher account to approve make-up work.'},{status:403,headers:privateHeaders})
  if(typeof b.userId!=='string'||!UUID.test(b.userId))return NextResponse.json({error:'Choose a student’s request.'},{status:422,headers:privateHeaders})
  const {data,error}=await supabaseAdmin.rpc('foundation_approve_makeup',{p_assignment:id,p_student:b.userId,p_teacher:ctx.scopeEmail,p_admin:ctx.role==='admin'&&ctx.realRole==='admin'})
  if(error){if(error.code==='P0001')return NextResponse.json({error:error.message},{status:422,headers:privateHeaders});throw error}
  return NextResponse.json(data,{headers:privateHeaders})
 }
 if(ctx.role!=='student'||ctx.realRole!=='student')return NextResponse.json({error:'Use your student account.'},{status:403,headers:privateHeaders})
 if(!b||!['create','join','start','share','reply','reflect','makeup'].includes(b.action)||typeof b.text!=='string'||b.text.length>4000||(!['create','join','start','makeup'].includes(b.action)&&!definitions.some(c=>c.id===b.checkpoint)))return NextResponse.json({error:'Choose a partner stop and a response of at most 4,000 characters.'},{status:422,headers:privateHeaders})
 const makeup=await supabaseAdmin.from('foundation_makeup_work').select('flagged_at').eq('assignment_id',id).eq('user_id',ctx.userId).maybeSingle()
 if(makeup.error)throw makeup.error
 const independent=b.action==='makeup'||!!makeup.data
 if(independent&&['create','join','start'].includes(b.action))return NextResponse.json({error:'Continue with your independent make-up activities.'},{status:422,headers:privateHeaders})
 const {data,error}=await supabaseAdmin.rpc(independent?'foundation_makeup_action':['create','join','start'].includes(b.action)?'foundation_partner_action':'foundation_checkpoint_action',{
  p_assignment:id,p_user:ctx.userId,p_action:b.action==='makeup'?'flag':b.action,p_text:b.text,...(independent?{p_checkpoint:b.checkpoint??null}:['create','join','start'].includes(b.action)?{}:{p_checkpoint:b.checkpoint}),
 })
 if(error){if(error.code==='P0001')return NextResponse.json({error:error.message},{status:422,headers:privateHeaders});throw error}
 return NextResponse.json(data,{headers:privateHeaders})
})
