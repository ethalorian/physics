/**
 * Math-spine server orchestration.
 *
 * One code path for "a teacher observed a student at level L on competency C":
 * append the observation, evaluate which celebration milestones it unlocks, and
 * write the corresponding point grants idempotently. Shared by the direct
 * records endpoint and the warm-up review flow so they can never drift.
 */
import { supabaseAdmin } from '@/lib/supabase'
import { MathStrand } from '@/data/curriculum-types'
import {
  GrantSpec,
  evaluateCompetencyMilestones,
  evaluateStrandComplete,
  competencyValue,
} from '@/lib/math-spine'

export interface RecordMathResult {
  record: unknown
  awarded: { milestone: string; points: number }[]
  error?: string
}

export async function recordMathObservation(args: {
  userId: string
  userEmail?: string | null
  competencyId: string
  level: 1 | 2 | 3
  unitId?: string | null
  evidenceSource?: string | null
  observedAt?: string
}): Promise<RecordMathResult> {
  const { userId, userEmail, competencyId, level } = args

  // 1) Append the observation (append-only).
  const { data: record, error: insertErr } = await supabaseAdmin
    .from('math_competency_records')
    .insert({
      user_id: userId,
      user_email: userEmail ?? null,
      competency_id: competencyId,
      level,
      unit_id: args.unitId ?? null,
      evidence_source: args.evidenceSource ?? null,
      observed_at: args.observedAt ?? new Date().toISOString(),
    })
    .select()
    .single()
  if (insertErr) return { record: null, awarded: [], error: insertErr.message }

  // 2) Identify the competency (slug + strand).
  const { data: comp } = await supabaseAdmin
    .from('math_competencies')
    .select('id, slug, strand')
    .eq('id', competencyId)
    .single()
  if (!comp) return { record, awarded: [] }
  const strand = comp.strand as MathStrand

  const specs: GrantSpec[] = []

  // 3) Per-competency milestones (Almost / Fluent crossings).
  const { data: thisCompRecs } = await supabaseAdmin
    .from('math_competency_records')
    .select('level, observed_at')
    .eq('user_id', userId)
    .eq('competency_id', competencyId)
    .order('observed_at', { ascending: true })
  specs.push(
    ...evaluateCompetencyMilestones({
      userId,
      userEmail,
      competencyId,
      competencySlug: comp.slug,
      levelsChronological: (thisCompRecs ?? []).map((r) => r.level),
    }),
  )

  // 4) Strand-complete (every active competency in the strand is Fluent).
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
      .eq('user_id', userId)
      .in('competency_id', strandIds)
      .order('observed_at', { ascending: true })
    const byComp = new Map<string, number[]>()
    for (const r of strandRecs ?? []) {
      const arr = byComp.get(r.competency_id) ?? []
      arr.push(r.level)
      byComp.set(r.competency_id, arr)
    }
    const values = strandIds.map((id) => {
      const levels = byComp.get(id)
      return levels ? competencyValue(levels) : null
    })
    const strandGrant = evaluateStrandComplete({ userId, userEmail, strand, competencyValues: values })
    if (strandGrant) specs.push(strandGrant)
  }

  // 5) Write grants idempotently; only genuinely-new rows come back.
  let awarded: { milestone: string; points: number }[] = []
  if (specs.length > 0) {
    const { data: inserted, error: grantErr } = await supabaseAdmin
      .from('math_spine_point_grants')
      .upsert(specs, { onConflict: 'dedupe_key', ignoreDuplicates: true })
      .select('milestone, points')
    if (grantErr) {
      console.error('Error writing math grants:', grantErr)
    } else {
      awarded = (inserted ?? []) as { milestone: string; points: number }[]
    }
  }

  return { record, awarded }
}
