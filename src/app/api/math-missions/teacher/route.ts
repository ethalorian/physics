import {NextResponse} from 'next/server'
import {withRole} from '@/lib/api-auth'
import {supabaseAdmin} from '@/lib/supabase'
import {getTeacherStudentGids,teacherCanAccessStudent} from '@/lib/teacher-scope'
import {missionBySlug} from '@/lib/math-missions/catalog'
export const GET=withRole(['teacher','admin'],async(request,ctx)=>{
 const wanted=new URL(request.url).searchParams.get('user_id');
 const ids=ctx.role==='teacher'?await getTeacherStudentGids(ctx.scopeEmail):null;
 if(wanted&&ids&&!ids.includes(wanted))return NextResponse.json({error:'Student not on your roster'},{status:403});
 let sessions=supabaseAdmin.from('math_mission_sessions').select('*').eq('status','completed').order('completed_at',{ascending:false}).limit(200);
 let assignments=supabaseAdmin.from('math_mission_assignments').select('*').is('cancelled_at',null).order('created_at',{ascending:false}).limit(200);
 if(wanted){sessions=sessions.eq('user_id',wanted);assignments=assignments.eq('user_id',wanted);}else if(ids){sessions=sessions.in('user_id',ids);assignments=assignments.in('user_id',ids);}
 const [s,a]=await Promise.all([sessions,assignments]);
 if(s.error||a.error)return NextResponse.json({error:'Could not load mission evidence.'},{status:503});
 return NextResponse.json({sessions:s.data,assignments:a.data});
})
export const POST=withRole(['teacher','admin'],async(request,ctx)=>{
 const body=await request.json().catch(()=>null);
 if(body?.action==='assign'){
  const m=missionBySlug(body.mission);if(!m||!(m.codes as readonly string[]).includes(body.code)||typeof body.userId!=='string')return NextResponse.json({error:'Choose a student and skill.'},{status:400});
  if(ctx.role==='teacher'&&!await teacherCanAccessStudent(ctx.scopeEmail,body.userId))return NextResponse.json({error:'Student not on your roster'},{status:403});
  const {data:student,error:studentError}=await supabaseAdmin.from('students').select('id').eq('id',body.userId).maybeSingle();if(studentError||!student)return NextResponse.json({error:'Student not found'},{status:404});
  if(body.dueAt&&!Number.isFinite(Date.parse(body.dueAt)))return NextResponse.json({error:'Choose a valid due date.'},{status:400});
  const {data,error}=await supabaseAdmin.from('math_mission_assignments').insert({teacher_email:ctx.scopeEmail,user_id:body.userId,mission:m.slug,code:body.code,title:`${m.name} · ${body.code}`,due_at:body.dueAt||null}).select().single();
  return error?NextResponse.json({error:'Could not assign mission.'},{status:503}):NextResponse.json({assignment:data});
 }
 if(body?.action==='review'&&typeof body.id==='string'&&typeof body.note==='string'&&body.note.trim()&&body.note.length<=4000){
  const {data:s,error}=await supabaseAdmin.from('math_mission_sessions').select('id,user_id').eq('id',body.id).eq('status','completed').maybeSingle();if(error||!s)return NextResponse.json({error:'Session not found'},{status:404});
  if(ctx.role==='teacher'&&!await teacherCanAccessStudent(ctx.scopeEmail,s.user_id))return NextResponse.json({error:'Student not on your roster'},{status:403});
  const saved=await supabaseAdmin.from('math_mission_sessions').update({review_note:body.note.trim(),reviewed_by:ctx.scopeEmail,reviewed_at:new Date().toISOString()}).eq('id',s.id);
  return saved.error?NextResponse.json({error:'Could not save feedback.'},{status:503}):NextResponse.json({ok:true});
 }
 if(body?.action==='cancel'&&typeof body.id==='string'){
  const {data:a}=await supabaseAdmin.from('math_mission_assignments').select('id,user_id,teacher_email').eq('id',body.id).maybeSingle();
  if(!a||ctx.role==='teacher'&&(a.teacher_email!==ctx.scopeEmail||!await teacherCanAccessStudent(ctx.scopeEmail,a.user_id)))return NextResponse.json({error:'Assignment not available'},{status:403});
  const {error}=await supabaseAdmin.from('math_mission_assignments').update({cancelled_at:new Date().toISOString()}).eq('id',a.id);return error?NextResponse.json({error:'Could not cancel assignment.'},{status:503}):NextResponse.json({ok:true});
 }
 return NextResponse.json({error:'Invalid request'},{status:400});
})
