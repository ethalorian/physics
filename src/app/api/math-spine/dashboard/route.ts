import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { withAuth } from '@/lib/api-auth'
import { resolveTargetStudent } from '@/lib/teacher-scope'
import {
  MathCompetency,
  MathCompetencyFocus,
  MathCompetencyRecord,
  MathStrand,
} from '@/data/curriculum-types'

// GET /api/math-spine/dashboard[?user_id=...]
// Everything a math-spine view needs: the (active) competencies, the just-in-time
// focus schedule, this student's append-only records (whole-year, never reset by
// unit), and the milestone point grants they've earned. Students always get their
// own data; teachers/admins may pass ?user_id= to view a student on their roster.
// With no user_id, staff resolve to themselves (empty records) — enough to drive
// the teacher entry surface, which only needs the competency list.
export const GET = withAuth(async (request, ctx) => {
  const role = ctx.role
  const { searchParams } = new URL(request.url)

  const requestedUserId = searchParams.get('user_id')
  const resolved = await resolveTargetStudent({
    role,
    selfId: ctx.userId,
    scopeEmail: ctx.email,
    requestedUserId,
  })
  if (!resolved.ok) {
    return NextResponse.json({ error: 'Forbidden - student not in your roster' }, { status: 403 })
  }
  const targetUserId = resolved.userId

  // 1) Competencies (the permanent spine).
  const { data: compRows, error: compErr } = await supabaseAdmin
    .from('math_competencies')
    .select('id, slug, code, statement, strand, rationale, is_active, order_index')
    .eq('is_active', true)
    .order('strand', { ascending: true })
    .order('order_index', { ascending: true })
  if (compErr) {
    return NextResponse.json({ error: compErr.message }, { status: 500 })
  }
  const competencies: (MathCompetency & { slug: string })[] = (compRows ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    code: c.code,
    statement: c.statement,
    strand: c.strand as MathStrand,
    rationale: c.rationale ?? undefined,
    isActive: c.is_active,
    orderIndex: c.order_index,
  }))
  const competencyIds = competencies.map((c) => c.id)

  // 2) Just-in-time focus schedule.
  const { data: focusRows, error: focusErr } = await supabaseAdmin
    .from('math_competency_focus')
    .select('competency_id, unit_id, role, physics_hook, order_index')
    .order('order_index', { ascending: true })
  if (focusErr) {
    return NextResponse.json({ error: focusErr.message }, { status: 500 })
  }
  const focus: MathCompetencyFocus[] = (focusRows ?? []).map((f) => ({
    competencyId: f.competency_id,
    unitId: f.unit_id,
    role: f.role as 'introduce' | 'revisit',
    physicsHook: f.physics_hook ?? undefined,
  }))

  // 3) This student's records (append-only, whole-year, chronological).
  let records: MathCompetencyRecord[] = []
  if (competencyIds.length > 0) {
    const { data: recRows, error: recErr } = await supabaseAdmin
      .from('math_competency_records')
      .select('user_id, competency_id, level, observed_at, unit_id, evidence_source')
      .eq('user_id', targetUserId)
      .in('competency_id', competencyIds)
      .order('observed_at', { ascending: true })
    if (recErr) {
      return NextResponse.json({ error: recErr.message }, { status: 500 })
    }
    records = (recRows ?? []).map((r) => ({
      studentId: r.user_id,
      competencyId: r.competency_id,
      level: r.level,
      observedAt: r.observed_at,
      unitId: r.unit_id ?? undefined,
      evidenceSource: r.evidence_source ?? undefined,
    }))
  }

  // 4) Milestone point grants earned (the celebration trail).
  const { data: grantRows } = await supabaseAdmin
    .from('math_spine_point_grants')
    .select('milestone, competency_id, strand, points, note, awarded_at')
    .eq('user_id', targetUserId)
    .order('awarded_at', { ascending: false })
  const grants = (grantRows ?? []).map((g) => ({
    milestone: g.milestone,
    competencyId: g.competency_id ?? undefined,
    strand: g.strand ?? undefined,
    points: g.points,
    note: g.note ?? undefined,
    awardedAt: g.awarded_at,
  }))
  const mathPointsEarned = grants.reduce((sum, g) => sum + (g.points || 0), 0)

  return NextResponse.json({
    userId: targetUserId,
    competencies,
    focus,
    records,
    grants,
    mathPointsEarned,
  })
})
