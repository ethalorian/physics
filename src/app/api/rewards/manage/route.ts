import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getTeacherStudentEmails } from '@/lib/teacher-scope'

// Per-period rewards.
//  - A reward is GLOBAL (owner_email NULL, admin-owned) or a teacher's OWN.
//  - Visibility is by PLACEMENT: a reward shows in a course's (period's) store
//    only when placed there (store_reward_placements). Placing one reward in
//    several courses = "same reward across multiple periods".
//  - A teacher places their own rewards + globals into their own courses, edits
//    only their own rewards, and fulfills only their own students' redemptions.
//    Admins manage the global catalog and see everything.

type CourseRow = { id: string; name: string | null; section: string | null; teacher_email: string | null }
const label = (c: CourseRow) => (c.section ? `${c.name ?? 'Class'} · ${c.section}` : (c.name ?? 'Class'))

async function teacherCourseIds(email: string): Promise<string[]> {
  const { data } = await supabaseAdmin.from('courses').select('id').eq('teacher_email', email)
  return ((data ?? []) as { id: string }[]).map((c) => c.id)
}
async function teacherOwnsCourse(email: string, courseId: string, isAdmin: boolean): Promise<boolean> {
  if (isAdmin) return true
  const { data } = await supabaseAdmin.from('courses').select('teacher_email').eq('id', courseId).maybeSingle()
  return (data as { teacher_email: string | null } | null)?.teacher_email === email
}

// GET — store-builder data for the caller.
export const GET = withRole(['teacher', 'admin'], async (_request, ctx) => {
  const isAdmin = ctx.realRole === 'admin'
  const email = ctx.scopeEmail

  const [{ data: myRewards }, { data: library }, { data: courseRows }] = await Promise.all([
    supabaseAdmin.from('rewards').select('*').eq('owner_email', email).order('cost_points', { ascending: true }),
    supabaseAdmin.from('rewards').select('*').is('owner_email', null).eq('active', true).order('cost_points', { ascending: true }),
    supabaseAdmin.from('courses').select('id, name, section, teacher_email').eq('teacher_email', email).order('name', { ascending: true }),
  ])
  const myCourses = ((courseRows ?? []) as CourseRow[]).map((c) => ({ id: c.id, label: label(c) }))
  const myCourseIds = myCourses.map((c) => c.id)

  const { data: placeRows } = myCourseIds.length
    ? await supabaseAdmin.from('store_reward_placements').select('reward_id, course_id').in('course_id', myCourseIds)
    : { data: [] as { reward_id: string; course_id: string }[] }

  // Redemption queue: teacher sees only their roster; admin all.
  let rq = supabaseAdmin.from('reward_redemptions').select('*').order('created_at', { ascending: false }).limit(200)
  if (!isAdmin) {
    const rosterEmails = await getTeacherStudentEmails(email)
    rq = rq.in('user_email', rosterEmails.length ? rosterEmails : ['__none__'])
  }
  const { data: redemptions } = await rq

  const globals = isAdmin
    ? (await supabaseAdmin.from('rewards').select('*').is('owner_email', null).order('cost_points', { ascending: true })).data ?? []
    : []

  return NextResponse.json({
    isAdmin,
    myRewards: myRewards ?? [],
    library: library ?? [],
    myCourses,
    placements: placeRows ?? [],
    redemptions: redemptions ?? [],
    globals,
  })
})

// POST — create a reward (no id) or partially update one (with id).
//   On create, an optional `course_ids` places it into those periods; if omitted
//   it is placed into ALL the teacher's periods (so a new reward is immediately
//   live, and the teacher can then differentiate per period).
export const POST = withRole(['teacher', 'admin'], async (request, ctx) => {
  const isAdmin = ctx.realRole === 'admin'
  const body = await request.json()

  if (body.id) {
    const { data: existing } = await supabaseAdmin.from('rewards').select('owner_email').eq('id', body.id).maybeSingle()
    if (!existing) return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
    const owner = (existing as { owner_email: string | null }).owner_email
    if (!(isAdmin || owner === ctx.scopeEmail)) return NextResponse.json({ error: 'You can only edit your own rewards' }, { status: 403 })

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.name !== undefined) patch.name = body.name
    if (body.description !== undefined) patch.description = body.description
    if (body.cost_points !== undefined) patch.cost_points = Math.max(0, Math.round(body.cost_points))
    if (body.category !== undefined) patch.category = body.category
    if (body.stock !== undefined) patch.stock = body.stock
    if (body.active !== undefined) patch.active = !!body.active
    const { data, error } = await supabaseAdmin.from('rewards').update(patch).eq('id', body.id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (!body.name || body.cost_points === undefined) {
    return NextResponse.json({ error: 'name and cost_points are required' }, { status: 400 })
  }
  const ownerEmail = isAdmin && body.global === true ? null : ctx.scopeEmail
  const { data: created, error } = await supabaseAdmin.from('rewards').insert({
    name: body.name,
    description: body.description ?? null,
    cost_points: Math.max(0, Math.round(body.cost_points)),
    category: body.category ?? null,
    stock: body.stock ?? null,
    active: body.active ?? true,
    owner_email: ownerEmail,
    created_by: ctx.email,
    updated_at: new Date().toISOString(),
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Place a teacher's NEW own reward into their periods (default: all).
  if (ownerEmail) {
    const myIds = await teacherCourseIds(ctx.scopeEmail)
    const requested: string[] | undefined = Array.isArray(body.course_ids) ? body.course_ids : undefined
    const targetIds = (requested ? requested.filter((id) => myIds.includes(id)) : myIds)
    if (targetIds.length > 0) {
      await supabaseAdmin.from('store_reward_placements').upsert(
        targetIds.map((cid) => ({ course_id: cid, reward_id: created.id, added_by: ctx.email })),
        { onConflict: 'course_id,reward_id' },
      )
    }
  }
  return NextResponse.json(created, { status: 201 })
})

// PUT — place/remove a reward in one of the caller's periods. { reward_id, course_id, place }
export const PUT = withRole(['teacher', 'admin'], async (request, ctx) => {
  const isAdmin = ctx.realRole === 'admin'
  const body = await request.json()
  if (!body.reward_id || !body.course_id) return NextResponse.json({ error: 'reward_id and course_id required' }, { status: 400 })

  if (!(await teacherOwnsCourse(ctx.scopeEmail, body.course_id, isAdmin))) {
    return NextResponse.json({ error: 'That period is not yours' }, { status: 403 })
  }
  // May place own rewards or globals (not another teacher's reward).
  const { data: reward } = await supabaseAdmin.from('rewards').select('owner_email').eq('id', body.reward_id).maybeSingle()
  if (!reward) return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
  const owner = (reward as { owner_email: string | null }).owner_email
  if (!(isAdmin || owner === null || owner === ctx.scopeEmail)) {
    return NextResponse.json({ error: 'You can only place your own rewards or global rewards' }, { status: 403 })
  }

  if (body.place === false) {
    const { error } = await supabaseAdmin.from('store_reward_placements')
      .delete().eq('course_id', body.course_id).eq('reward_id', body.reward_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, placed: false })
  }
  const { error } = await supabaseAdmin.from('store_reward_placements')
    .upsert({ course_id: body.course_id, reward_id: body.reward_id, added_by: ctx.email }, { onConflict: 'course_id,reward_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, placed: true })
})

// PATCH — fulfill / approve / deny a redemption. Teachers limited to their roster.
export const PATCH = withRole(['teacher', 'admin'], async (request, ctx) => {
  const isAdmin = ctx.realRole === 'admin'
  const body = await request.json()
  const allowed = ['pending', 'approved', 'fulfilled', 'denied']
  if (!body.redemption_id || !allowed.includes(body.status)) {
    return NextResponse.json({ error: 'redemption_id and a valid status are required' }, { status: 400 })
  }
  if (!isAdmin) {
    const { data: red } = await supabaseAdmin.from('reward_redemptions').select('user_email').eq('id', body.redemption_id).maybeSingle()
    const rosterEmails = await getTeacherStudentEmails(ctx.scopeEmail)
    const studentEmail = (red as { user_email: string | null } | null)?.user_email
    if (!studentEmail || !rosterEmails.includes(studentEmail)) {
      return NextResponse.json({ error: 'Forbidden - that redemption is not from your roster' }, { status: 403 })
    }
  }
  const patch: Record<string, unknown> = { status: body.status }
  if (body.status === 'fulfilled') {
    patch.fulfilled_at = new Date().toISOString()
    patch.fulfilled_by = ctx.email
  }
  const { data, error } = await supabaseAdmin.from('reward_redemptions').update(patch).eq('id', body.redemption_id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
})
