import { NextResponse } from 'next/server'
import { withRole } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { decayingAverage } from '@/data/curriculum-types'

// GET /api/admin/workshop — the curriculum studio's data (Workshop design):
//   (no params)      → the SHELF: one row per unit with lesson + review-coverage
//                      rollups, where sections are, the next content gap.
//   ?unit=<unitId>   → the UNIT board: lessons w/ status + open classes, targets
//                      w/ coverage and mastery.
//   ?target=<id>     → the TARGET workbench: per-class mastery, evidence counts,
//                      pending AI reviews (approval itself stays on
//                      /api/admin/reviews — one gate, one place).

type Block = { type?: string; visibilityTrack?: string }
const blocksOf = (cb: unknown): Block[] => {
  const b = (cb as { blocks?: Block[] } | null)?.blocks
  return Array.isArray(b) ? b : []
}

export const GET = withRole('admin', async (request) => {
  const url = new URL(request.url)
  const unitParam = url.searchParams.get('unit')
  const targetParam = url.searchParams.get('target')

  // ---------- shared rollups ----------
  const [{ data: units }, { data: lessons }, { data: targets }, { data: reviews }, { data: pacing }, { data: courses }] = await Promise.all([
    supabaseAdmin.from('units').select('id, name, order_index, allotted_days, default_start_date').order('order_index'),
    supabaseAdmin.from('lessons').select('id, title, unit_id, lesson_number, published, visibility_track, content_blocks'),
    supabaseAdmin.from('learning_targets').select('id, slug, statement, unit_id, order_index').eq('exclude_from_growth', false).order('order_index'),
    supabaseAdmin.from('target_reviews').select('id, target_id, status, questions, reteach, created_at'),
    supabaseAdmin.from('section_pacing').select('course_id, current_unit_id'),
    supabaseAdmin.from('courses').select('id, name, section, teacher_email').is('archived_at', null),
  ])

  const courseLabel = new Map((courses ?? []).map((c) => [c.id, [c.name, c.section].filter(Boolean).join(' · ')]))
  const targetsByUnit = new Map<string, typeof targets & object[]>()
  for (const t of (targets ?? [])) {
    const arr = (targetsByUnit.get(t.unit_id) ?? []) as typeof targets & object[]
    arr.push(t); targetsByUnit.set(t.unit_id, arr)
  }
  const approvedTargets = new Set((reviews ?? []).filter((r) => r.status === 'approved').map((r) => r.target_id))
  const pendingByTarget = new Map<string, number>()
  for (const r of (reviews ?? [])) if (r.status === 'pending') pendingByTarget.set(r.target_id, (pendingByTarget.get(r.target_id) ?? 0) + 1)
  const questionsByTarget = new Map<string, number>()
  for (const r of (reviews ?? [])) if (r.status === 'approved') {
    const q = Array.isArray(r.questions) ? r.questions.length : 0
    questionsByTarget.set(r.target_id, (questionsByTarget.get(r.target_id) ?? 0) + q)
  }
  const sectionsOnUnit = new Map<string, string[]>()
  for (const p of (pacing ?? [])) {
    if (!p.current_unit_id) continue
    const arr = sectionsOnUnit.get(p.current_unit_id) ?? []
    const label = courseLabel.get(p.course_id)
    if (label) arr.push(label)
    sectionsOnUnit.set(p.current_unit_id, arr)
  }

  const shelfRows = (units ?? []).map((u) => {
    const ls = (lessons ?? []).filter((l) => l.unit_id === u.id)
    const ts = (targetsByUnit.get(u.id) ?? []) as { id: string }[]
    const covered = ts.filter((t) => approvedTargets.has(t.id)).length
    const pending = ts.reduce((a, t) => a + (pendingByTarget.get(t.id) ?? 0), 0)
    const questions = ts.reduce((a, t) => a + (questionsByTarget.get(t.id) ?? 0), 0)
    const teaching = (sectionsOnUnit.get(u.id) ?? [])
    return {
      id: u.id, name: u.name,
      published: ls.filter((l) => l.published).length,
      drafts: ls.filter((l) => !l.published).length,
      targets: ts.length, covered, pending, questions,
      teachingSections: teaching,
      status: teaching.length > 0 ? 'teaching' : ls.length === 0 ? 'outline' : ls.every((l) => l.published) && ts.length > 0 ? 'complete' : 'building',
    }
  })

  const totalLessons = (lessons ?? []).length
  const totalPublished = (lessons ?? []).filter((l) => l.published).length
  const totalTargets = (targets ?? []).length
  const totalCovered = (targets ?? []).filter((t) => approvedTargets.has(t.id)).length
  const pendingTotal = [...pendingByTarget.values()].reduce((a, b) => a + b, 0)

  // Next gap: the first unit at/after the one being taught with fewer published
  // lessons than targets (content thinner than the target list demands).
  const teachingIdx = shelfRows.findIndex((r) => r.status === 'teaching')
  const gap = shelfRows.slice(Math.max(0, teachingIdx)).find((r) => r.targets > 0 && r.published < r.targets && r.status !== 'complete') ?? null

  if (!unitParam && !targetParam) {
    return NextResponse.json({
      shelf: shelfRows,
      gap: gap ? { unitId: gap.id, unitName: gap.name, missing: gap.targets - gap.published } : null,
      desk: pendingTotal,
      year: { published: totalPublished, lessons: totalLessons, covered: totalCovered, targets: totalTargets },
    })
  }

  // ---------- unit board ----------
  if (unitParam) {
    const unitLessons = (lessons ?? []).filter((l) => l.unit_id === unitParam)
      .sort((a, b) => (a.lesson_number ?? 0) - (b.lesson_number ?? 0))
    const lessonIds = unitLessons.map((l) => l.id)
    const { data: windows } = lessonIds.length
      ? await supabaseAdmin.from('lesson_class_windows').select('lesson_id, course_id, open_at, close_at').in('lesson_id', lessonIds)
      : { data: [] as { lesson_id: string; course_id: string; open_at: string | null; close_at: string | null }[] }
    const now = Date.now()
    const openBy = new Map<string, string[]>()
    for (const w of windows ?? []) {
      const open = (!w.open_at || new Date(w.open_at).getTime() <= now) && (!w.close_at || new Date(w.close_at).getTime() > now)
      if (!open) continue
      const arr = openBy.get(w.lesson_id) ?? []
      const label = courseLabel.get(w.course_id)
      if (label) arr.push(label)
      openBy.set(w.lesson_id, arr)
    }
    const ts = ((targetsByUnit.get(unitParam) ?? []) as { id: string; slug: string; statement: string }[])
    // per-target mastery avg (all students)
    const { data: recs } = ts.length
      ? await supabaseAdmin.from('mastery_records').select('target_id, user_id, level, observed_at').in('target_id', ts.map((t) => t.id)).order('observed_at')
      : { data: [] as { target_id: string; user_id: string; level: number }[] }
    const seq = new Map<string, number[]>()
    for (const r of (recs ?? []) as { target_id: string; user_id: string; level: number }[]) {
      const k = `${r.user_id}:${r.target_id}`
      ;(seq.get(k) ?? seq.set(k, []).get(k)!).push(r.level)
    }
    const perTarget = ts.map((t) => {
      const vals: number[] = []
      for (const [k, levels] of seq) if (k.endsWith(`:${t.id}`)) {
        const v = decayingAverage(levels)
        if (v !== null && v !== undefined) vals.push(v)
      }
      const avg = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null
      return {
        id: t.id, slug: t.slug, statement: t.statement,
        approved: approvedTargets.has(t.id),
        pending: pendingByTarget.get(t.id) ?? 0,
        avg, rated: vals.length,
      }
    })
    return NextResponse.json({
      unit: (units ?? []).find((u) => u.id === unitParam) ?? null,
      teachingSections: sectionsOnUnit.get(unitParam) ?? [],
      lessons: unitLessons.map((l) => {
        const blocks = blocksOf(l.content_blocks)
        return {
          id: l.id, number: l.lesson_number, title: l.title, published: l.published,
          blockCount: blocks.length,
          exitTickets: blocks.filter((b) => b.type === 'exit_ticket').length,
          honorsBlocks: blocks.filter((b) => b.visibilityTrack === 'honors').length,
          track: l.visibility_track ?? null,
          openIn: openBy.get(l.id) ?? [],
        }
      }),
      targets: perTarget,
    })
  }

  // ---------- target workbench ----------
  const t = (targets ?? []).find((x) => x.id === targetParam)
  if (!t) return NextResponse.json({ error: 'Unknown target' }, { status: 404 })
  const [{ data: recs }, { data: enrolls }] = await Promise.all([
    supabaseAdmin.from('mastery_records').select('user_id, level, observed_at').eq('target_id', t.id).order('observed_at'),
    supabaseAdmin.from('course_students').select('course_id, student_id').eq('enrollment_state', 'ACTIVE'),
  ])
  const classOf = new Map<string, string>()
  for (const e of (enrolls ?? [])) if (!classOf.has(e.student_id)) classOf.set(e.student_id, e.course_id)
  const seq = new Map<string, number[]>()
  for (const r of (recs ?? []) as { user_id: string; level: number }[]) {
    ;(seq.get(r.user_id) ?? seq.set(r.user_id, []).get(r.user_id)!).push(r.level)
  }
  const byClass = new Map<string, number[]>()
  for (const [uid, levels] of seq) {
    const v = decayingAverage(levels)
    if (v === null || v === undefined) continue
    const cid = classOf.get(uid)
    if (!cid) continue
    ;(byClass.get(cid) ?? byClass.set(cid, []).get(cid)!).push(v)
  }
  const sections = [...byClass.entries()].map(([cid, vals]) => ({
    label: courseLabel.get(cid) ?? 'Class',
    teacher: (courses ?? []).find((c) => c.id === cid)?.teacher_email?.split('@')[0] ?? '',
    avg: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
    n: vals.length,
  })).sort((a, b) => a.avg - b.avg)
  const pendingList = (reviews ?? []).filter((r) => r.target_id === t.id && r.status === 'pending')
    .map((r) => ({
      id: r.id,
      title: (r.reteach ?? '').split('\n')[0].slice(0, 80) || 'Generated review',
      questions: Array.isArray(r.questions) ? r.questions.length : 0,
      created_at: r.created_at,
    }))
  return NextResponse.json({
    target: { id: t.id, slug: t.slug, statement: t.statement },
    sections,
    evidence: (recs ?? []).length,
    approvedCount: (reviews ?? []).filter((r) => r.target_id === t.id && r.status === 'approved').length,
    approvedQuestions: questionsByTarget.get(t.id) ?? 0,
    pending: pendingList,
  })
})
