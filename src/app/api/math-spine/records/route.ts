import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'
import {
  GrantSpec,
  evaluateCompetencyMilestones,
  evaluateStrandComplete,
  competencyValue,
} from '@/lib/math-spine'
import { MathStrand } from '@/data/curriculum-types'

// POST /api/math-spine/records
// Records a single Marzano observation (1-3) for a student on a math competency,
// then evaluates which celebration MILESTONES the new value unlocks and awards
// the corresponding points (idempotently, via dedupe_key). Teacher/admin only —
// math mastery is teacher-assessed. APPEND-ONLY: always inserts a new row.
//
// Returns { record, awarded } where `awarded` is the list of grants that were
// NEW this call (so the UI can celebrate exactly those).
export const POST = withAuth(async (request, ctx) => {
  const role = ctx.role
  if (role !== 'admin' && role !== 'teacher') {
    return NextResponse.json({ error: 'Only teachers can record mastery' }, { status: 403 })
  }

  const body = await request.json()
  const { user_id, competency_id, level } = body
  if (!user_id || !competency_id || ![1, 2, 3].includes(level)) {
    return NextResponse.json(
      { error: 'Missing or invalid fields: user_id, competency_id, level (1, 2, or 3)' },
      { status: 400 },
    )
  }

  // 1) Append the observation.
  const row = {
    user_id,
    user_email: body.user_email ?? null,
    competency_id,
    level,
    unit_id: body.unit_id ?? null,
    evidence_source: body.evidence_source ?? null,
    observed_at: body.observed_at ?? new Date().toISOString(),
  }
  const { data: record, error: insertErr } = await supabaseAdmin
    .from('math_competency_records')
    .insert(row)
    .select()
    .single()
  if (insertErr) {
    console.error('Error recording math mastery:', insertErr)
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  // 2) Identify the competency (slug + strand) we just observed.
  const { data: comp } = await supabaseAdmin
    .from('math_competencies')
    .select('id, slug, strand')
    .eq('id', competency_id)
    .single()
  if (!comp) {
    return NextResponse.json({ record, awarded: [] }, { status: 201 })
  }
  const strand = comp.strand as MathStrand

  const specs: GrantSpec[] = []

  // 3) Per-competency milestones (Almost / Fluent crossings).
  const { data: thisCompRecs } = await supabaseAdmin
    .from('math_competency_records')
    .select('level, observed_at')
    .eq('user_id', user_id)
    .eq('competency_id', competency_id)
    .order('observed_at', { ascending: true })
  const levelsChronological = (thisCompRecs ?? []).map((r) => r.level)
  specs.push(
    ...evaluateCompetencyMilestones({
      userId: user_id,
      userEmail: body.user_email ?? null,
      competencyId: competency_id,
      competencySlug: comp.slug,
      levelsChronological,
    }),
  )

  // 4) Strand-complete milestone (every active competency in the strand is Fluent).
  const { data: strandComps } = await supabaseAdmin
    .from('math_competencies')
    .select('id')
    .eq('strand', strand)
    .eq('is_active', true)
  const strandIds = (strandComps ?? []).map((c) => c.id)
  if (strandIds.length > 0) {
    const { data: strandRecs } = await supabaseAdmin
      .from('math_competency_records')
      .select('competency_id, level, observed_at')
      .eq('user_id', user_id)
      .in('competency_id', strandIds)
      .order('observed_at', { ascending: true })
    const byComp = new Map<string, number[]>()
    for (const r of strandRecs ?? []) {
      const arr = byComp.get(r.competency_id) ?? []
      arr.push(r.level)
      byComp.set(r.competency_id, arr)
    }
    // Every active competency must have records AND be Fluent.
    const values = strandIds.map((id) => {
      const levels = byComp.get(id)
      return levels ? competencyValue(levels) : null
    })
    const strandGrant = evaluateStrandComplete({
      userId: user_id,
      userEmail: body.user_email ?? null,
      strand,
      competencyValues: values,
    })
    if (strandGrant) specs.push(strandGrant)
  }

  // 5) Write grants idempotently; only rows that did NOT already exist come back.
  let awarded: GrantSpec[] = []
  if (specs.length > 0) {
    const { data: inserted, error: grantErr } = await supabaseAdmin
      .from('math_spine_point_grants')
      .upsert(specs, { onConflict: 'dedupe_key', ignoreDuplicates: true })
      .select('milestone, competency_id, strand, points, dedupe_key')
    if (grantErr) {
      // Don't fail the observation if the celebration write hiccups — the record stands.
      console.error('Error writing math grants:', grantErr)
    } else {
      awarded = (inserted ?? []) as unknown as GrantSpec[]
    }
  }

  return NextResponse.json({ record, awarded }, { status: 201 })
})
