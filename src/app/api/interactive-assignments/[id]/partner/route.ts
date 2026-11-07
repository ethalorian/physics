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
 const [makeup,notes]=await Promise.all([
  supabaseAdmin.from('foundation_makeup_work').select('flagged_at,approved_at,responses').eq('assignment_id',id).eq('user_id',ctx.userId).maybeSingle(),
  supabaseAdmin.from('foundation_setup_notes').select('idea,left_at').eq('assignment_id',id).eq('user_id',ctx.userId).order('left_at',{ascending:false}),
 ])
 if(makeup.error)throw makeup.error
 if(notes.error)throw notes.error
 const setupIdeas=[...new Set(notes.data.map(note=>note.idea as string))]
 if(makeup.data){
  const earlier=await supabaseAdmin.from('foundation_checkpoint_responses').select('checkpoint,contribution,reply,reflection').eq('assignment_id',id).eq('user_id',ctx.userId)
  if(earlier.error)throw earlier.error
  const earlierGroupWriting=Object.fromEntries(earlier.data.map(r=>[r.checkpoint,{contribution:r.contribution,reply:r.reply,reflection:r.reflection}]))
  const responses=makeup.data.responses
  let available=!!makeup.data.approved_at
  const checkpoints=definitions.map(c=>{
   const own={...emptyCheckpointWriting(),...(responses[c.id]??{})},complete=!!own.reflection
   const result={id:c.id,own,peer:null,peerShared:false,available,complete};available=available&&complete;return result
  })
  return NextResponse.json({pair:{code:'',slot:1,peerJoined:false,peerName:null,makeup:true,approved:!!makeup.data.approved_at,flaggedAt:makeup.data.flagged_at,checkpoints,complete:checkpoints.every(c=>c.complete)},setupIdeas,earlierGroupWriting},{headers:privateHeaders})
 }
 const own=await supabaseAdmin.from('foundation_pair_members').select('pair_id,slot').eq('assignment_id',id).eq('user_id',ctx.userId).maybeSingle()
 if(own.error)throw own.error
 if(!own.data)return NextResponse.json({pair:null,setupIdeas},{headers:privateHeaders})

 const fields='pair_id,user_id,checkpoint,contribution,contributed_at,reply,replied_at,reflection,reflected_at,reply_to_user_id,example_selected,source_slot'
 const [pair,membership,responses]=await Promise.all([
  supabaseAdmin.from('foundation_pairs').select('id,code,protocol_version,individual_pace,started_at,notification_key').eq('id',own.data.pair_id).single(),
  supabaseAdmin.from('foundation_pair_members').select('user_id,slot').eq('pair_id',own.data.pair_id).order('slot'),
  supabaseAdmin.from('foundation_checkpoint_responses').select(fields).eq('pair_id',own.data.pair_id),
 ])
 if(pair.error)throw pair.error
 if(membership.error)throw membership.error
 if(responses.error)throw responses.error
 const paced=pair.data.protocol_version===3&&pair.data.individual_pace
 const [authorship,personal,latest]=paced?await Promise.all([
  supabaseAdmin.from('foundation_table_authors').select('user_id,idea_key,first_slot').eq('pair_id',own.data.pair_id),
  supabaseAdmin.from('foundation_checkpoint_responses').select(fields).eq('assignment_id',id).eq('user_id',ctx.userId).neq('pair_id',own.data.pair_id),
  supabaseAdmin.from('foundation_table_switches').select('id,destination_code,status').eq('assignment_id',id).eq('user_id',ctx.userId).order('requested_at',{ascending:false}).limit(1),
 ]):[{data:[],error:null},{data:[],error:null},{data:[],error:null}]
 if(authorship.error)throw authorship.error
 if(personal.error)throw personal.error
 if(latest.error)throw latest.error
 const ids=[...new Set([...membership.data.map(m=>m.user_id),...responses.data.map(r=>r.user_id)])]
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
 // A teacher may have approved a move between these reads. Never return the departed table's data.
 const seat=await supabaseAdmin.from('foundation_pair_members').select('pair_id').eq('assignment_id',id).eq('user_id',ctx.userId).maybeSingle()
 if(seat.error)throw seat.error
 if(seat.data?.pair_id!==own.data.pair_id||!members.some(m=>m.isYou))return NextResponse.json({error:'Your table changed. Check group updates.'},{status:409,headers:privateHeaders})
 const state=foundationGroupView(definitions,ctx.userId,pair.data,members,[...responses.data,...personal.data],authorship.data.map(a=>({...a,name:profiles.data.find(p=>p.id===a.user_id)?.name||'Classmate'})))
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
 return NextResponse.json({pair:{...state,tableSwitch:latest.data[0]??null,items:avatars.items,realtime:url&&key?{url,key,topic:'foundation:'+pair.data.notification_key}:null},setupIdeas},{headers:privateHeaders})
})

export const POST=withAuth<{id:string}>(async(req,ctx)=>{
 const {id}=await ctx.params,a=await accessibleAssignment(ctx,id),foundation=a?assignmentBySlug(a.slug)?.foundation:undefined
 const definitions=foundation?getFoundationCheckpoints(foundation):[]
 if(!a||!foundation)return NextResponse.json({error:'Assigned foundation unavailable.'},{status:404,headers:privateHeaders})
 let b;try{b=await req.json()}catch{return NextResponse.json({error:'Choose a valid partner action.'},{status:422,headers:privateHeaders})}
 const switchActions:Record<string,string>={requestSwitch:'request',cancelSwitch:'cancel',approveSwitch:'approve',declineSwitch:'decline'}
 if(b&&Object.hasOwn(switchActions,b.action)){
  const action=switchActions[b.action],decision=action==='approve'||action==='decline'
  if(decision?(!['teacher','admin'].includes(ctx.role)||!['teacher','admin'].includes(ctx.realRole)||ctx.viewingAsTeacher):(ctx.role!=='student'||ctx.realRole!=='student'))
   return NextResponse.json({error:'Use your own account for this table switch.'},{status:403,headers:privateHeaders})
  const user=decision?b.userId:ctx.userId,request=decision?b.requestId:b.text
  if(typeof user!=='string'||!UUID.test(user)||(action==='request'?typeof b.text!=='string'||!/^[a-z0-9]{10}$/i.test(b.text.trim())||typeof b.code!=='string':typeof request!=='string'||!UUID.test(request)))
   return NextResponse.json({error:'Choose a valid request or enter the other table’s 10-character code.'},{status:422,headers:privateHeaders})
  const {data,error}=await supabaseAdmin.rpc('foundation_table_switch_action',{p_assignment:id,p_user:user,p_action:action,p_code:action==='request'?b.text.trim():null,p_source:action==='request'?b.code:null,p_request:action==='request'?null:request,p_teacher:decision?ctx.scopeEmail:null})
  if(error){if(error.code==='P0001')return NextResponse.json({error:error.message},{status:422,headers:privateHeaders});throw error}
  return NextResponse.json(data,{headers:privateHeaders})
 }
 if(b?.action==='approveMakeup'){
  if(!['teacher','admin'].includes(ctx.role)||!['teacher','admin'].includes(ctx.realRole)||ctx.viewingAsTeacher)return NextResponse.json({error:'Use your own teacher account to approve make-up work.'},{status:403,headers:privateHeaders})
  if(typeof b.userId!=='string'||!UUID.test(b.userId))return NextResponse.json({error:'Choose a student’s request.'},{status:422,headers:privateHeaders})
  const {data,error}=await supabaseAdmin.rpc('foundation_approve_makeup',{p_assignment:id,p_student:b.userId,p_teacher:ctx.scopeEmail,p_admin:ctx.role==='admin'&&ctx.realRole==='admin'})
  if(error){if(error.code==='P0001')return NextResponse.json({error:error.message},{status:422,headers:privateHeaders});throw error}
  return NextResponse.json(data,{headers:privateHeaders})
 }
 if(ctx.role!=='student'||ctx.realRole!=='student')return NextResponse.json({error:'Use your student account.'},{status:403,headers:privateHeaders})
 const groupActions=['create','join','start','leave']
 if(!b||![...groupActions,'share','compare','reply','reflect','makeup'].includes(b.action)||typeof b.text!=='string'||b.text.length>4000||(b.action==='compare'&&!['1','2','3','4','example'].includes(b.text)&&!UUID.test(b.text))||(!groupActions.includes(b.action)&&b.action!=='makeup'&&!definitions.some(c=>c.id===b.checkpoint)))return NextResponse.json({error:'Choose a partner stop and a response of at most 4,000 characters.'},{status:422,headers:privateHeaders})
 const makeup=await supabaseAdmin.from('foundation_makeup_work').select('flagged_at').eq('assignment_id',id).eq('user_id',ctx.userId).maybeSingle()
 if(makeup.error)throw makeup.error
 const independent=b.action==='makeup'||!!makeup.data
 if(b.action!=='makeup'&&b.mode&&b.mode!==(independent?'independent':'group'))return NextResponse.json({error:'Your work mode changed. Your private draft is preserved. Check the updated group or independent directions before sharing.'},{status:409,headers:privateHeaders})
 if(independent&&(groupActions.includes(b.action)||b.action==='compare'))return NextResponse.json({error:'Continue with your independent make-up activities.'},{status:422,headers:privateHeaders})
 const {data,error}=await supabaseAdmin.rpc(independent?'foundation_makeup_action':groupActions.includes(b.action)?'foundation_partner_action':'foundation_write_at_table',{
  p_assignment:id,p_user:ctx.userId,p_action:b.action==='makeup'?'flag':b.action,p_text:b.text,...(independent?{p_checkpoint:b.checkpoint??null}:groupActions.includes(b.action)?{}:{p_checkpoint:b.checkpoint,p_code:typeof b.code==='string'?b.code:null}),
 })
 if(error){if(error.code==='P0001')return NextResponse.json({error:error.message},{status:422,headers:privateHeaders});throw error}
 return NextResponse.json(data,{headers:privateHeaders})
})
