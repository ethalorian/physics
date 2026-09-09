import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ownerEmailsFor } from '@/lib/identity-aliases'

export const GET = withAuth(async (_request, ctx) => {
  if (!['teacher','admin'].includes(ctx.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const courses = await supabaseAdmin.from('courses').select('id,name,track').in('teacher_email', ownerEmailsFor(ctx.scopeEmail)).is('archived_at', null).order('name')
  if (courses.error) return NextResponse.json({ error: 'Courses unavailable' }, { status: 503 })
  const terms = courses.data.length ? await supabaseAdmin.from('course_xp_terms').select('*').in('course_id', courses.data.map(c => c.id)).order('starts_at') : { data: [], error: null }
  if (terms.error) return NextResponse.json({ error: 'Term rules unavailable' }, { status: 503 })
  return NextResponse.json({ courses: courses.data, terms: terms.data })
})
export const PATCH = withAuth(async (request, ctx) => {
  if (!['teacher','admin'].includes(ctx.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const b = await request.json().catch(() => null)
  if (!b || typeof b.id !== 'string' || typeof b.label !== 'string' || !b.label.trim() || b.label.length > 100 || !Number.isInteger(b.minimum_xp) || b.minimum_xp < 1 || b.minimum_xp > 100000 || !Number.isFinite(b.grade_points) || b.grade_points < 0 || b.grade_points > 100 || !Number.isFinite(Date.parse(b.starts_at)) || !Number.isFinite(Date.parse(b.ends_at)) || Date.parse(b.ends_at) <= Date.parse(b.starts_at)) return NextResponse.json({ error: 'Enter valid dates, an XP minimum, and grade points.' }, { status: 400 })
  const term = await supabaseAdmin.from('course_xp_terms').select('course_id').eq('id', b.id).maybeSingle()
  if (term.error) return NextResponse.json({ error: 'Term unavailable' }, { status: 503 })
  if (!term.data) return NextResponse.json({ error: 'Term not found' }, { status: 404 })
  const course = await supabaseAdmin.from('courses').select('teacher_email').eq('id', term.data.course_id).maybeSingle()
  if (!ownerEmailsFor(ctx.scopeEmail).includes((course.data?.teacher_email ?? '').toLowerCase().trim())) return NextResponse.json({ error: 'Not your course' }, { status: 403 })
  const saved = await supabaseAdmin.from('course_xp_terms').update({ label: b.label.trim(), starts_at: new Date(b.starts_at).toISOString(), ends_at: new Date(b.ends_at).toISOString(), minimum_xp: b.minimum_xp, grade_points: b.grade_points }).eq('id', b.id)
  if (saved.error) return NextResponse.json({ error: saved.error.message.includes('overlap') ? 'These dates overlap another term. Adjust the adjacent term first.' : 'Term rule could not be saved.' }, { status: 409 })
  return NextResponse.json({ ok: true })
})
