import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { teacherCanAccessStudent } from '@/lib/teacher-scope'

// Teacher → student written feedback (one-way; no student replies).
// Composed in the grading drawers, anchored to a learning target or a math
// competency when sent in context. Same write rule as mastery ratings: the
// student must be on the ACTOR'S own roster — admin widens what you can see,
// never whose students you can message.

// POST /api/feedback  { user_id, message, target_id?, competency_id? }
export const POST = withAuth(async (request, ctx) => {
  if (ctx.role !== 'admin' && ctx.role !== 'teacher') {
    return NextResponse.json({ error: 'Only teachers can send feedback' }, { status: 403 })
  }

  const body = await request.json()
  const { user_id, target_id, competency_id } = body
  const message = typeof body.message === 'string' ? body.message.trim() : ''

  if (!user_id || !message) {
    return NextResponse.json({ error: 'Missing fields: user_id, message' }, { status: 400 })
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: 'Message too long (2000 char max)' }, { status: 400 })
  }

  if (!(await teacherCanAccessStudent(ctx.scopeEmail, user_id))) {
    return NextResponse.json({ error: 'Forbidden - student not on your own roster' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('teacher_feedback')
    .insert({
      user_id,
      teacher_email: ctx.scopeEmail,
      target_id: target_id || null,
      competency_id: competency_id || null,
      message,
    })
    .select()
    .single()

  if (error) {
    console.error('Error sending feedback:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
})

// GET /api/feedback            → student: own feedback (newest first)
// GET /api/feedback?user_id=g… → teacher/admin: history for one student
//                                (any student they can view; sending stays
//                                roster-gated at POST)
export const GET = withAuth(async (request, ctx) => {
  const url = new URL(request.url)
  const requested = url.searchParams.get('user_id')
  const isStaff = ctx.role === 'admin' || ctx.role === 'teacher'

  let uid = ctx.userId
  if (requested && requested !== ctx.userId) {
    if (!isStaff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    uid = requested
  }

  const { data, error } = await supabaseAdmin
    .from('teacher_feedback')
    .select('id, teacher_email, target_id, competency_id, message, created_at, target:learning_targets(slug, statement), competency:math_competencies(code, statement)')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error loading feedback:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ feedback: data ?? [] })
})
