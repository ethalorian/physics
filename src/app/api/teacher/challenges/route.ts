import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { bountyRoster, bountyRows } from '@/lib/xp-bounty-data'
import { BOUNTY_PERIODS, bountyToday, bountyWindow, validBountyDate } from '@/lib/xp-bounty-period'
import { BOUNTY_KIND_LABELS, VOCAB_BOUNTY_GAMES } from '@/lib/xp-bounty-catalog'

const staffOnly = (role: string) => role === 'admin' || role === 'teacher'
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const GET = withAuth(async (_req, ctx) => {
  if (!staffOnly(ctx.role)) return bad('Forbidden', 403)
  const [roster, challenges, games] = await Promise.all([
    bountyRoster(ctx.scopeEmail),
    bountyRows((from, to) => supabaseAdmin.from('xp_challenges')
      .select('id, title, kind, game_slug, metric, target, bonus_xp, starts_on, ends_on, period, active, is_global, created_at')
      .eq('teacher_email', ctx.scopeEmail).order('created_at', { ascending: false }).order('id').range(from, to)),
    bountyRows((from, to) => supabaseAdmin.from('arcade_games').select('slug, name, enabled')
      .order('sort_order').order('slug').range(from, to)),
  ])
  const ids = challenges.map(c => c.id)
  const [assigns, grants] = ids.length ? await Promise.all([
    bountyRows((from, to) => supabaseAdmin.from('xp_challenge_assignments')
      .select('id, challenge_id, course_id, student_id').in('challenge_id', ids).order('id').range(from, to)),
    bountyRows((from, to) => supabaseAdmin.from('economy_point_grants')
      .select('id, reference, user_id, dedupe_key').eq('source', 'challenge-bonus').in('reference', ids).order('id').range(from, to)),
  ]) : [[], []]
  const today = bountyToday()
  return NextResponse.json({ myCourses: roster.courses, students: roster.students, games, teacherEmail: ctx.scopeEmail,
    challenges: challenges.map(c => {
      const window = bountyWindow(c, today)
      const assignments = assigns.filter(a => a.challenge_id === c.id)
      const recipients = roster.students.filter(s => c.is_global || assignments.some(a => a.student_id === s.id || s.courseIds.includes(a.course_id)))
      const recipientIds = new Set(recipients.map(s => s.id))
      const completed = new Set(grants.filter(g => g.reference === c.id && recipientIds.has(g.user_id)
        && g.dedupe_key === `challenge:${c.id}:${g.user_id}:${window.key}`).map(g => g.user_id))
      return { ...c, window, recipientCount: recipients.length, completedPeriod: completed.size,
        assignments: assignments.map(a => ({ ...a, label: a.course_id
          ? roster.courses.find(course => course.id === a.course_id)?.label ?? 'Former class'
          : roster.students.find(s => s.id === a.student_id)?.name ?? 'Former student' })),
      }
    }),
  })
})

export const POST = withAuth(async (request, ctx) => {
  if (!staffOnly(ctx.role)) return bad('Forbidden', 403)
  const b = await request.json().catch(() => null)
  if (!b || typeof b !== 'object' || Array.isArray(b)) return bad('Invalid request')
  if (typeof b.title !== 'string' || !b.title.trim() || b.title.trim().length > 120
    || !Object.hasOwn(BOUNTY_KIND_LABELS, b.kind) || !['xp', 'plays'].includes(b.metric)) return bad('Valid title, activity, and measure required')
  const period = b.period ?? 'daily'
  if (!BOUNTY_PERIODS.includes(period)) return bad('Choose a valid reward period')
  if (b.is_global === true) return bad('Bounties can only be assigned to your own classes or students', 403)
  if (b.kind === 'math' && b.metric !== 'xp') return bad('Math bounties measure XP earned')
  if (!Number.isInteger(b.target) || b.target < 1 || b.target > 1000) return bad('Target must be 1–1000')
  if (!Number.isInteger(b.bonus_xp) || b.bonus_xp < 1 || b.bonus_xp > 100) return bad('Bounty must be 1–100 XP')
  if (!validBountyDate(b.starts_on) || !validBountyDate(b.ends_on) || b.ends_on < b.starts_on) return bad('Valid start and end dates are required')
  if (Date.parse(b.ends_on) - Date.parse(b.starts_on) > 366 * 86400000) return bad('Choose a date range of one year or less')
  let slug: string | null = null
  if (b.kind === 'arcade-game') {
    if (typeof b.game_slug !== 'string') return bad('Choose a game')
    const { data: game, error } = await supabaseAdmin.from('arcade_games').select('slug').eq('slug', b.game_slug).eq('enabled', true).maybeSingle()
    if (error) throw error
    if (!game) return bad('Choose an available arcade game')
    slug = game.slug
  } else if (b.kind === 'vocab-games' && b.game_slug) {
    if (!VOCAB_BOUNTY_GAMES.some(g => g.slug === b.game_slug)) return bad('Choose a valid vocabulary game')
    slug = b.game_slug
  }
  for (const key of ['course_ids', 'student_ids', 'student_emails']) {
    if (b[key] !== undefined && (!Array.isArray(b[key]) || b[key].some((v: unknown) => typeof v !== 'string'))) return bad('Invalid recipients')
  }
  const courseIds = [...new Set<string>(b.course_ids ?? [])]
  const studentIds = new Set<string>(b.student_ids ?? [])
  const emails = [...new Set<string>((b.student_emails ?? []).map((e: string) => e.trim().toLowerCase()).filter(Boolean))]
  const roster = await bountyRoster(ctx.scopeEmail)
  if (courseIds.some(id => !roster.courses.some(c => c.id === id))) return bad('You can only assign your own classes', 403)
  for (const email of emails) {
    const student = roster.students.find(s => s.email?.toLowerCase() === email)
    if (!student) return bad('Every student must be on your active roster', 403)
    studentIds.add(student.id)
  }
  if ([...studentIds].some(id => !roster.students.some(s => s.id === id))) return bad('Every student must be on your active roster', 403)
  if (!courseIds.length && !studentIds.size) return bad('Choose at least one class or student')

  // Activate only after all recipient rows exist. A failed assignment is never live.
  const { data: challenge, error } = await supabaseAdmin.from('xp_challenges').insert({
    teacher_email: ctx.scopeEmail, title: b.title.trim(), kind: b.kind, game_slug: slug,
    metric: b.metric, target: b.target, bonus_xp: b.bonus_xp, period,
    starts_on: b.starts_on, ends_on: b.ends_on, is_global: false, active: false,
  }).select('id').single()
  if (error || !challenge) throw error ?? new Error('Could not create bounty')
  const { error: assignmentError } = await supabaseAdmin.from('xp_challenge_assignments').insert([
    ...courseIds.map(id => ({ challenge_id: challenge.id, course_id: id, student_id: null })),
    ...[...studentIds].map(id => ({ challenge_id: challenge.id, course_id: null, student_id: id })),
  ])
  if (assignmentError) {
    await supabaseAdmin.from('xp_challenges').delete().eq('id', challenge.id).eq('teacher_email', ctx.scopeEmail)
    throw assignmentError
  }
  const { error: activationError } = await supabaseAdmin.from('xp_challenges').update({ active: true }).eq('id', challenge.id).eq('teacher_email', ctx.scopeEmail)
  if (activationError) throw activationError
  return NextResponse.json({ ok: true, id: challenge.id }, { status: 201 })
})

export const PUT = withAuth(async (request, ctx) => {
  if (!staffOnly(ctx.role)) return bad('Forbidden', 403)
  const b = await request.json().catch(() => null)
  if (!b || !uuid.test(b.id) || typeof b.active !== 'boolean') return bad('Valid id and active state required')
  const { data, error } = await supabaseAdmin.from('xp_challenges').update({ active: b.active })
    .eq('id', b.id).eq('teacher_email', ctx.scopeEmail).select('id').maybeSingle()
  if (error) throw error
  if (!data) return bad('Bounty not found', 404)
  return NextResponse.json({ ok: true })
})

export const DELETE = withAuth(async (request, ctx) => {
  if (!staffOnly(ctx.role)) return bad('Forbidden', 403)
  const id = new URL(request.url).searchParams.get('id')
  if (!id || !uuid.test(id)) return bad('Valid id required')
  const { data, error } = await supabaseAdmin.from('xp_challenges').delete()
    .eq('id', id).eq('teacher_email', ctx.scopeEmail).select('id').maybeSingle()
  if (error) throw error
  if (!data) return bad('Bounty not found', 404)
  return NextResponse.json({ ok: true })
})
