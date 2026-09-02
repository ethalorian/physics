import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { decayingAverage } from '@/data/curriculum-types'

// GET /api/teacher/cockpit/roster?class=<courseId>&unit=<unitId>
// One table for screen 2c: roster + activity + per-target mastery, sorted
// "who needs you first". Merges what Roster and Mastery analytics showed
// separately. Read scope: the teacher's own class (admin may view any class
// they own — same rule, cockpit is per-teacher).

export const GET = withAuth(async (request, ctx) => {
  if (ctx.role !== 'admin' && ctx.role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const url = new URL(request.url)
  const classId = url.searchParams.get('class')
  const unitId = url.searchParams.get('unit') ?? 'unit-1'
  if (!classId) return NextResponse.json({ error: 'class required' }, { status: 400 })

  // The class must be the caller's own.
  const { data: course } = await supabaseAdmin.from('courses').select('id, teacher_email').eq('id', classId).maybeSingle()
  if (!course || course.teacher_email !== ctx.scopeEmail) {
    return NextResponse.json({ error: 'Not your class' }, { status: 403 })
  }

  const { data: enrolls } = await supabaseAdmin
    .from('course_students').select('student_id').eq('course_id', classId).eq('enrollment_state', 'active')
  const gids = (enrolls ?? []).map((e) => e.student_id)
  // An empty class still needs the full shape — the cockpit reads
  // roster.summary.* on the Overview tab and crashes on undefined.
  if (gids.length === 0) {
    return NextResponse.json({
      students: [], targets: [],
      summary: { classAvg: null, fluent: 0, total: 0, activeThisWeek: 0, weakestTarget: null },
    })
  }

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const [{ data: studs }, { data: targets }, { data: records }, { data: activity }, { data: lessons }, { data: xp }, { data: pending }] = await Promise.all([
    supabaseAdmin.from('students').select('id, name, alias').in('id', gids),
    supabaseAdmin.from('learning_targets').select('id, slug, statement, domain, order_index').eq('unit_id', unitId).eq('exclude_from_growth', false).order('order_index'),
    supabaseAdmin.from('mastery_records').select('user_id, target_id, level, observed_at').in('user_id', gids).order('observed_at'),
    supabaseAdmin.from('student_activity').select('user_id, created_at').in('user_id', gids).order('created_at', { ascending: false }).limit(4000),
    supabaseAdmin.from('lesson_progress').select('user_id').in('user_id', gids),
    supabaseAdmin.from('math_spine_point_grants').select('user_id, points').in('user_id', gids).gte('awarded_at', weekAgo),
    supabaseAdmin.from('math_warmup_submissions').select('user_id').eq('status', 'pending').in('user_id', gids),
  ])

  const lastActive = new Map<string, string>()
  for (const a of (activity ?? []) as { user_id: string; created_at: string }[]) {
    if (!lastActive.has(a.user_id)) lastActive.set(a.user_id, a.created_at)
  }
  const lessonsBy = new Map<string, number>()
  for (const l of (lessons ?? []) as { user_id: string }[]) lessonsBy.set(l.user_id, (lessonsBy.get(l.user_id) ?? 0) + 1)
  const xpBy = new Map<string, number>()
  for (const g of (xp ?? []) as { user_id: string; points: number }[]) xpBy.set(g.user_id, (xpBy.get(g.user_id) ?? 0) + (g.points ?? 0))
  const pendingBy = new Map<string, number>()
  for (const p of (pending ?? []) as { user_id: string }[]) pendingBy.set(p.user_id, (pendingBy.get(p.user_id) ?? 0) + 1)

  // per student × target decaying average
  const seq = new Map<string, number[]>()
  for (const r of (records ?? []) as { user_id: string; target_id: string; level: number }[]) {
    const k = `${r.user_id}:${r.target_id}`
    ;(seq.get(k) ?? seq.set(k, []).get(k)!).push(r.level)
  }

  const targetList = (targets ?? []) as { id: string; slug: string; statement: string; domain: string }[]
  const now = Date.now()
  const rows = ((studs ?? []) as { id: string; name: string | null; alias: string | null }[]).map((s) => {
    const cells: Record<string, number | null> = {}
    let sum = 0, n = 0
    for (const t of targetList) {
      const levels = seq.get(`${s.id}:${t.id}`)
      const dv = levels && levels.length ? decayingAverage(levels) : null
      const v = dv === null || dv === undefined ? null : Math.round(dv * 10) / 10
      cells[t.id] = v
      if (v !== null) { sum += v; n++ }
    }
    const last = lastActive.get(s.id) ?? null
    const idleDays = last ? Math.floor((now - new Date(last).getTime()) / 86400000) : null
    const unitAvg = n ? Math.round((sum / n) * 10) / 10 : null
    // attention score: idle days weigh heaviest, then weak average, then backlog
    const attention = (idleDays === null ? 10 : Math.min(idleDays, 10)) * 3
      + (unitAvg === null ? 4 : Math.max(0, (2.45 - unitAvg)) * 6)
      + (pendingBy.get(s.id) ?? 0)
    return {
      id: s.id,
      name: s.name || s.alias || 'Student',
      lastActive: last,
      idleDays,
      lessonsDone: lessonsBy.get(s.id) ?? 0,
      xpWeek: Math.round(xpBy.get(s.id) ?? 0),
      pending: pendingBy.get(s.id) ?? 0,
      cells,
      unitAvg,
      attention: Math.round(attention * 10) / 10,
    }
  }).sort((a, b) => b.attention - a.attention)

  const classAvg = (() => {
    const vals = rows.map((r) => r.unitAvg).filter((v): v is number => v !== null)
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null
  })()
  // weakest target = lowest mean across students with data
  let weakest: { slug: string; almost: number } | null = null
  let weakestMean = Infinity
  for (const t of targetList) {
    const vals = rows.map((r) => r.cells[t.id]).filter((v): v is number => v !== null)
    if (vals.length < 3) continue
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length
    if (mean < weakestMean) {
      weakestMean = mean
      weakest = { slug: t.slug, almost: vals.filter((v) => v >= 1.7 && v < 2.45).length }
    }
  }

  return NextResponse.json({
    targets: targetList,
    students: rows,
    summary: {
      classAvg,
      fluent: rows.filter((r) => (r.unitAvg ?? 0) >= 2.45).length,
      total: rows.length,
      activeThisWeek: rows.filter((r) => r.idleDays !== null && r.idleDays <= 7).length,
      weakestTarget: weakest,
    },
  })
})
