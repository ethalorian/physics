import { NextResponse } from 'next/server'
import { withAuth, withEnrolledStudent } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { accessibleAssignment } from '@/lib/interactive-assignments/server'
import { validPlanDate } from '@/lib/learning-week'

export const GET = withAuth(async (_request, ctx) => {
  const { data, error } = await supabaseAdmin.from('student_learning_plans').select('assignment_key,planned_on').eq('user_id', ctx.userId)
  if (error) throw error
  return NextResponse.json({ plans: Object.fromEntries((data ?? []).map(row => [row.assignment_key, row.planned_on])) }, { headers: { 'Cache-Control': 'private, no-store' } })
})

export const POST = withEnrolledStudent(async (request, ctx) => {
  const body = await request.json().catch(() => null)
  if (!body || typeof body.assignment_key !== 'string' || !(/^(video|reading|quiz|vocabulary|interactive):[0-9a-f-]{36}$/i.test(body.assignment_key) || /^review:unit-1(-honors)?$/.test(body.assignment_key)) || (body.planned_on !== null && !validPlanDate(body.planned_on))) return NextResponse.json({ error: 'Choose an assignment and a valid planning date.' }, { status: 400 })
  if(body.assignment_key.startsWith('interactive:')&&!await accessibleAssignment(ctx,body.assignment_key.slice('interactive:'.length)))return NextResponse.json({error:'Assignment unavailable.'},{status:404})
  // A personal intention only: never updates an assignment, deadline, score, or completion.
  // Ownership is derived from the session, never from the request payload.
  const { error } = await supabaseAdmin.from('student_learning_plans').upsert({ user_id: ctx.userId, assignment_key: body.assignment_key, planned_on: body.planned_on, updated_at: new Date().toISOString() }, { onConflict: 'user_id,assignment_key' })
  if (error) throw error
  return NextResponse.json({ saved: true }, { headers: { 'Cache-Control': 'private, no-store' } })
})
