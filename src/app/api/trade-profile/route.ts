import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { resolveTargetStudent, getTeacherStudentGids } from '@/lib/teacher-scope'
import { getStudentProgram } from '@/lib/program'
import { isAssignedTrade } from '@/lib/vocational'

export const GET = withAuth(async (request, ctx) => {
  if (!['student','teacher','admin'].includes(ctx.role)) return NextResponse.json({error:'Forbidden'},{status:403})
  const url = new URL(request.url)
  if (url.searchParams.get('roster') === '1') {
    if (ctx.role !== 'teacher' && ctx.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    let q = supabaseAdmin.from('course_students').select('student_id, courses!inner(program) ').eq('courses.program','trades')
    if (ctx.role === 'teacher') q = q.in('student_id',await getTeacherStudentGids(ctx.scopeEmail))
    const { data: enrollment, error: enrollmentError } = await q
    if (enrollmentError) throw enrollmentError
    const ids = [...new Set((enrollment ?? []).map(r=>r.student_id))]
    if (!ids.length) return NextResponse.json({ students: [] })
    const [{data: students,error: studentError},{data: profiles,error: profileError}] = await Promise.all([
      supabaseAdmin.from('students').select('id, name, email').in('id',ids),
      supabaseAdmin.from('vocational_profiles').select('user_id, trade').in('user_id',ids),
    ])
    if (studentError || profileError) throw studentError || profileError
    return NextResponse.json({ students: (students ?? []).map(s=>({...s,trade:profiles?.find(p=>p.user_id===s.id)?.trade ?? null})) })
  }
  const target = await resolveTargetStudent({ role:ctx.role, scopeEmail:ctx.scopeEmail, selfId:ctx.userId, requestedUserId:url.searchParams.get('user_id') })
  if (!target.ok) return NextResponse.json({error:'Forbidden'},{status:403})
  if (await getStudentProgram(target.userId) !== 'trades') return NextResponse.json({error:'Trades enrollment required'},{status:403})
  const {data,error}=await supabaseAdmin.from('vocational_profiles').select('trade').eq('user_id',target.userId).maybeSingle()
  if(error) throw error
  return NextResponse.json({trade:data?.trade ?? null})
})
export const PUT = withAuth(async (request,ctx) => {
  if (!['student','teacher','admin'].includes(ctx.role)) return NextResponse.json({error:'Forbidden'},{status:403})
  const body = await request.json()
  if (!isAssignedTrade(body.trade)) return NextResponse.json({error:'Choose Electrical, Carpentry or Plumbing.'},{status:400})
  if (body.user_id && ctx.role==='student' && body.user_id!==ctx.userId) return NextResponse.json({error:'Forbidden'},{status:403})
  const target = await resolveTargetStudent({role:ctx.role,scopeEmail:ctx.scopeEmail,selfId:ctx.userId,requestedUserId:body.user_id})
  if(!target.ok) return NextResponse.json({error:'Forbidden'},{status:403})
  if(await getStudentProgram(target.userId)!=='trades') return NextResponse.json({error:'Trades enrollment required'},{status:403})
  const staff=ctx.role==='teacher'||ctx.role==='admin'
  const patch={user_id:target.userId,trade:body.trade,updated_by:ctx.email,updated_at:new Date().toISOString()}
  // Students select their existing program once. Only roster-scoped staff correct it.
  const result=staff ? await supabaseAdmin.from('vocational_profiles').upsert(patch,{onConflict:'user_id'}) : await supabaseAdmin.from('vocational_profiles').insert(patch)
  if(result.error) {
    if(result.error.code==='23505') return NextResponse.json({error:'Your trade is already saved. Ask your teacher to correct it.'},{status:409})
    throw result.error
  }
  return NextResponse.json({trade:body.trade})
})
