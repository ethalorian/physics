import {NextResponse} from 'next/server'
import {randomInt} from 'node:crypto'
import {withAuth} from '@/lib/api-auth'
import {supabaseAdmin} from '@/lib/supabase'
import {getStudentTrack} from '@/lib/student-enrollment'
import {displayNames,isStaff} from '@/lib/arcade'
import {missionBySlug,MISSION_VERSION,PRACTICE_XP,type CompetencyCode,type MissionMode} from '@/lib/math-missions/catalog'
import {initialState,transition,viewSession} from '@/lib/math-missions/session'
import type {Session} from '@/lib/math-missions/types'
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
const fail=(error:unknown)=>{console.error('[math-missions]',error);return NextResponse.json({error:'Mission progress could not be saved. Your current step is retained; retry.'},{status:503})}
export const GET=withAuth(async(request,ctx)=>{
 const id=new URL(request.url).searchParams.get('id');
 if(id){if(!uuid(id))return NextResponse.json({error:'Invalid session'},{status:400});const {data,error}=await supabaseAdmin.from('math_mission_sessions').select('*').eq('id',id).eq('user_id',ctx.userId).maybeSingle();if(error)return fail(error);return data?NextResponse.json({session:viewSession(data as Session)}):NextResponse.json({error:'Session not found'},{status:404});}
 const [history,assignments,leaders,track]=await Promise.all([
  supabaseAdmin.from('math_mission_sessions').select('id,mission,code,mode,status,ranked,score,xp,created_at,completed_at,assignment_id,state,review_note,reviewed_at').eq('user_id',ctx.userId).order('created_at',{ascending:false}).limit(100),
  supabaseAdmin.from('math_mission_assignments').select('*').eq('user_id',ctx.userId).is('cancelled_at',null).order('created_at',{ascending:false}).limit(100),
  supabaseAdmin.rpc('math_mission_leaders',{p_user:ctx.userId}),getStudentTrack(ctx.userId),
 ]);
 if(history.error||assignments.error||leaders.error)return fail(history.error||assignments.error||leaders.error);
 const rows=(leaders.data??[]) as {mission:string;user_id:string;score:number;rank:number;period:string}[];
 const names=await displayNames([...new Set(rows.map(r=>r.user_id))]);
 return NextResponse.json({history:history.data,assignments:assignments.data,dailyCap:track==='honors'?15:10,leaders:rows.map(r=>({mission:r.mission,name:r.user_id===ctx.userId?'You':names.get(r.user_id)||'Student',score:r.score,rank:r.rank,period:r.period,isMe:r.user_id===ctx.userId}))});
})
export const POST=withAuth(async(request,ctx)=>{
 const body=await request.json().catch(()=>null);if(!body||typeof body.action!=='string')return NextResponse.json({error:'Invalid action'},{status:400});
 if(body.action==='start'){
  const mission=missionBySlug(body.mission),mode=body.mode as MissionMode;
  if(!mission||!['practice','challenge','retention'].includes(mode)||!(mission.codes as readonly string[]).includes(body.code)||!uuid(body.id))return NextResponse.json({error:'Choose a mission and skill.'},{status:400});
  let assignmentId:string|null=null;
  if(body.assignmentId){if(!uuid(body.assignmentId))return NextResponse.json({error:'Invalid assignment'},{status:400});const {data:a,error}=await supabaseAdmin.from('math_mission_assignments').select('*').eq('id',body.assignmentId).eq('user_id',ctx.userId).is('cancelled_at',null).maybeSingle();if(error)return fail(error);if(!a||a.mission!==mission.slug||a.code!==body.code||mode==='challenge')return NextResponse.json({error:'Assignment does not match this mission.'},{status:403});assignmentId=a.id;}
  if(mode==='retention'){
   const {data:prior,error}=await supabaseAdmin.from('math_mission_sessions').select('completed_at').eq('user_id',ctx.userId).eq('code',body.code).eq('status','completed').eq('mode','practice').lte('completed_at',new Date(Date.now()-86400000).toISOString()).limit(1);
   if(error)return fail(error);if(!prior?.length)return NextResponse.json({error:'A delayed check is available 24 hours after a completed practice session.'},{status:409});
  }
  const {data:existing,error:existingError}=await supabaseAdmin.from('math_mission_sessions').select('*').eq('user_id',ctx.userId).eq('mission',mission.slug).eq('code',body.code).eq('mode',mode).eq('status','active').maybeSingle();
  if(existingError)return fail(existingError);
  if(existing){if(assignmentId&&existing.assignment_id!==assignmentId)return NextResponse.json({error:'Finish your in-progress session before starting this assignment.'},{status:409});return NextResponse.json({session:viewSession(existing as Session),resumed:true});}
  const {data:replay,error:replayError}=await supabaseAdmin.from('math_mission_sessions').select('*').eq('id',body.id).eq('user_id',ctx.userId).maybeSingle();if(replayError)return fail(replayError);if(replay)return NextResponse.json({session:viewSession(replay as Session)});
  const day=new Date().toISOString().slice(0,10),staff=isStaff(ctx);let ranked=mode==='challenge'&&!staff;
  if(ranked){const {count,error}=await supabaseAdmin.from('math_mission_sessions').select('id',{count:'exact',head:true}).eq('user_id',ctx.userId).eq('mission',mission.slug).eq('mode','challenge').eq('challenge_day',day);if(error)return fail(error);ranked=!count;}
  const seed=mode==='challenge'?Number(day.replaceAll('-','')):randomInt(1,2147483647);
  const {data,error}=await supabaseAdmin.from('math_mission_sessions').insert({id:body.id,user_id:ctx.userId,user_email:ctx.email,mission:mission.slug,code:body.code as CompetencyCode,mode,seed,version:MISSION_VERSION,state:initialState(),assignment_id:assignmentId,staff,ranked,challenge_day:mode==='challenge'?day:null}).select().single();
  if(error)return error.code==='23505'?NextResponse.json({error:'A session was started in another tab. Retry to resume it.'},{status:409}):fail(error);
  return NextResponse.json({session:viewSession(data as Session)});
 }
 if(!uuid(body.id)||!Number.isInteger(body.revision))return NextResponse.json({error:'Reload the mission before continuing.'},{status:400});
 const {data,error}=await supabaseAdmin.from('math_mission_sessions').select('*').eq('id',body.id).eq('user_id',ctx.userId).maybeSingle();if(error)return fail(error);if(!data)return NextResponse.json({error:'Session not found'},{status:404});
 const session=data as Session;if(session.status==='completed'||session.revision!==body.revision)return NextResponse.json({session:viewSession(session),resumed:true});
 try{
  const next=transition(session,body.action,body.answer);
  // Completion pays a bounded practice reward, independent of hints or accuracy.
  const {data:saved,error:saveError}=await supabaseAdmin.rpc('save_math_mission',{p_user:ctx.userId,p_session:session.id,p_revision:session.revision,p_state:next.state,p_complete:next.complete,p_ranked:next.ranked,p_score:next.score,p_xp:PRACTICE_XP});
  if(saveError)return fail(saveError);return NextResponse.json({session:viewSession(saved as Session)});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Could not check this step.'},{status:400});}
})
