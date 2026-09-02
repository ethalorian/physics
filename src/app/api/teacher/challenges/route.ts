import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getTeacherStudentGids } from '@/lib/teacher-scope'

// Teacher CRUD for daily XP challenges — scoped to ctx.scopeEmail. A teacher
// can assign only their OWN courses and students from their own roster (same
// principle as rating: admin widens nothing here).

const staffOnly = (role: string) => role === 'admin' || role === 'teacher'

export const GET = withAuth(async (_req, ctx) => {
  if (!staffOnly(ctx.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // The teacher's OWN classes (imported or created) — the only assignable set,
  // for admins too. Returned even with zero challenges so the form can render.
  const { data: courses } = await supabaseAdmin
    .from('courses').select('id, name, section').eq('teacher_email', ctx.scopeEmail).order('name')
  const myCourses = (courses ?? []).map((c) => ({ id: c.id, label: [c.name, c.section].filter(Boolean).join(' · ') }))
  const isAdmin = ctx.role === 'admin'

  const { data: chRows } = await supabaseAdmin
    .from('xp_challenges')
    .select('id, title, kind, game_slug, metric, target, bonus_xp, starts_on, ends_on, active, is_global, created_at')
    .eq('teacher_email', ctx.scopeEmail)
    .order('created_at', { ascending: false })
  const challenges = chRows ?? []
  if (challenges.length === 0) return NextResponse.json({ challenges: [], myCourses, isAdmin })

  const ids = challenges.map((c) => c.id)
  const { data: assigns } = await supabaseAdmin
    .from('xp_challenge_assignments').select('challenge_id, course_id, student_id').in('challenge_id', ids)
  const courseName = new Map(myCourses.map((c) => [c.id, c.label]))

  // Today's completions: bonus grants keyed challenge:<id>:<uid>:<today ET>
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const { data: paidToday } = await supabaseAdmin
    .from('economy_point_grants').select('reference').eq('source', 'challenge-bonus').in('reference', ids)
    .like('dedupe_key', `%:${today}`)
  const doneBy = new Map<string, number>()
  for (const p of paidToday ?? []) if (p.reference) doneBy.set(p.reference, (doneBy.get(p.reference) ?? 0) + 1)

  return NextResponse.json({
    myCourses,
    isAdmin,
    challenges: challenges.map((c) => ({
      ...c,
      assignments: (assigns ?? []).filter((a) => a.challenge_id === c.id).map((a) => ({
        course_id: a.course_id, student_id: a.student_id,
        label: a.course_id ? (courseName.get(a.course_id) ?? 'Class') : 'Student',
      })),
      completedToday: doneBy.get(c.id) ?? 0,
    })),
  })
})

// POST { title, kind, game_slug?, metric, target, bonus_xp, starts_on, ends_on,
//        course_ids: [], student_emails: [] }
export const POST = withAuth(async (request, ctx) => {
  if (!staffOnly(ctx.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const b = await request.json()

  const KINDS = ['arcade-any', 'arcade-game', 'vocab-games', 'math']
  if (!b.title?.trim() || !KINDS.includes(b.kind) || !['xp', 'plays'].includes(b.metric)) {
    return NextResponse.json({ error: 'Missing/invalid title, kind, or metric' }, { status: 400 })
  }
  if (b.kind === 'arcade-game' && !b.game_slug) return NextResponse.json({ error: 'Pick a game' }, { status: 400 })
  if (b.kind === 'math' && b.metric !== 'xp') return NextResponse.json({ error: 'Math challenges are XP-based' }, { status: 400 })
  const target = Number(b.target), bonus = Number(b.bonus_xp)
  if (!Number.isInteger(target) || target < 1 || target > 1000) return NextResponse.json({ error: 'Target must be 1-1000' }, { status: 400 })
  if (!Number.isInteger(bonus) || bonus < 0 || bonus > 100) return NextResponse.json({ error: 'Bonus must be 0-100' }, { status: 400 })
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.starts_on ?? '') || !/^\d{4}-\d{2}-\d{2}$/.test(b.ends_on ?? '') || b.ends_on < b.starts_on) {
    return NextResponse.json({ error: 'Valid start and end dates are required' }, { status: 400 })
  }

  // Global challenges (every student, automatically) are the ADMIN's lever;
  // teachers always assign explicit slices of their own classes/roster.
  const isGlobal = ctx.role === 'admin' && b.is_global === true

  // Assignment slices — validate ownership before anything is written.
  const courseIds: string[] = isGlobal ? [] : (Array.isArray(b.course_ids) ? b.course_ids : [])
  const studentEmails: string[] = isGlobal ? [] : (Array.isArray(b.student_emails) ? b.student_emails : [])
  if (!isGlobal && courseIds.length === 0 && studentEmails.length === 0) {
    return NextResponse.json({ error: 'Assign at least one class or student' }, { status: 400 })
  }
  if (courseIds.length > 0) {
    const { data: own } = await supabaseAdmin.from('courses').select('id').eq('teacher_email', ctx.scopeEmail).in('id', courseIds)
    if ((own ?? []).length !== courseIds.length) return NextResponse.json({ error: 'You can only assign your own classes' }, { status: 400 })
  }
  let studentIds: string[] = []
  if (studentEmails.length > 0) {
    const emails = studentEmails.map((e: string) => e.trim().toLowerCase()).filter(Boolean)
    const { data: studs } = await supabaseAdmin.from('students').select('id, email').in('email', emails)
    const found = (studs ?? [])
    if (found.length !== emails.length) {
      const missing = emails.filter((e) => !found.some((s) => (s.email ?? '').toLowerCase() === e))
      return NextResponse.json({ error: `Unknown student email(s): ${missing.join(', ')}` }, { status: 400 })
    }
    const roster = new Set(await getTeacherStudentGids(ctx.scopeEmail))
    const off = found.filter((s) => !roster.has(s.id))
    if (off.length > 0) return NextResponse.json({ error: 'Students must be on your own roster' }, { status: 400 })
    studentIds = found.map((s) => s.id)
  }

  const { data: ch, error } = await supabaseAdmin.from('xp_challenges').insert({
    teacher_email: ctx.scopeEmail,
    title: b.title.trim().slice(0, 120),
    kind: b.kind,
    game_slug: b.kind === 'arcade-game' ? b.game_slug : null,
    metric: b.metric, target, bonus_xp: bonus,
    starts_on: b.starts_on, ends_on: b.ends_on,
    is_global: isGlobal,
  }).select('id').single()
  if (error || !ch) return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 })

  if (!isGlobal) {
    const rows = [
      ...courseIds.map((cid) => ({ challenge_id: ch.id, course_id: cid, student_id: null })),
      ...studentIds.map((sid) => ({ challenge_id: ch.id, course_id: null, student_id: sid })),
    ]
    const { error: aErr } = await supabaseAdmin.from('xp_challenge_assignments').insert(rows)
    if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, id: ch.id }, { status: 201 })
})

// PUT { id, active }  — pause/resume. DELETE ?id= — remove (cascade drops slices).
export const PUT = withAuth(async (request, ctx) => {
  if (!staffOnly(ctx.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const b = await request.json()
  if (!b.id || typeof b.active !== 'boolean') return NextResponse.json({ error: 'id and active required' }, { status: 400 })
  const { error } = await supabaseAdmin.from('xp_challenges')
    .update({ active: b.active }).eq('id', b.id).eq('teacher_email', ctx.scopeEmail)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
})

export const DELETE = withAuth(async (request, ctx) => {
  if (!staffOnly(ctx.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await supabaseAdmin.from('xp_challenges')
    .delete().eq('id', id).eq('teacher_email', ctx.scopeEmail)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
})
