import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/analytics/signals?unit=<unit_id|all>
// O-1 · Observatory signals. Reads ONLY existing tables + the additive columns:
//   misconception  — wrong + sure clusters by target (MC-5)
//   calibration    — self vs teacher drift from the mastery_calibration view (MC-2)
//   scaffold       — latest teacher level for scaffold-heavy vs unscaffolded work (SEI-10)
//   lobby          — latest teacher level on a target for students who wrote in a lobby on it vs not (E-4)
// Admin + observer, read-only (O-2). Never writes.

type Target = { id: string; slug: string; statement: string; unit_id: string | null }
type Resp = { user_id: string; target_id: string | null; evidence_source: string | null; confidence: string | null; scaffolds_used: string[] | null; response: { autoCheck?: string } | null; created_at: string }
type Rec = { user_id: string; target_id: string; level: number; observed_at: string }

const mean = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100 : null)

export const GET = withAuth(async (request, ctx) => {
  if (ctx.role !== 'admin' && ctx.role !== 'observer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const unit = new URL(request.url).searchParams.get('unit')

  let tq = supabaseAdmin.from('learning_targets').select('id, slug, statement, unit_id')
  if (unit && unit !== 'all') tq = tq.eq('unit_id', unit)
  const [{ data: t }, { data: r }, { data: m }, { data: c }] = await Promise.all([
    tq,
    supabaseAdmin.from('block_responses').select('user_id, target_id, evidence_source, confidence, scaffolds_used, response, created_at').not('target_id', 'is', null).limit(20000),
    supabaseAdmin.from('mastery_records').select('user_id, target_id, level, observed_at').order('observed_at', { ascending: false }).limit(20000),
    supabaseAdmin.from('mastery_calibration').select('user_id, target_id, delta').not('delta', 'is', null),
  ])
  const targets = (t ?? []) as Target[]
  const byId = new Map(targets.map((x) => [x.id, x]))
  const inScope = (tid: string | null): tid is string => Boolean(tid && byId.has(tid))
  const resps = ((r ?? []) as Resp[]).filter((x) => inScope(x.target_id))
  const recs = ((m ?? []) as Rec[]).filter((x) => inScope(x.target_id))
  const cal = ((c ?? []) as { user_id: string; target_id: string; delta: number }[]).filter((x) => inScope(x.target_id))

  // Latest teacher level per (student, target) — M-4: read, never duplicate.
  const latest = new Map<string, number>()
  for (const x of recs) { const k = `${x.user_id}:${x.target_id}`; if (!latest.has(k)) latest.set(k, x.level) }

  // 1 · misconception: wrong + sure, by target.
  const mis = new Map<string, { n: number; students: Set<string> }>()
  for (const x of resps) {
    if (x.confidence === 'sure' && x.response?.autoCheck === 'mismatch') {
      const e = mis.get(x.target_id!) ?? { n: 0, students: new Set<string>() }
      e.n++; e.students.add(x.user_id); mis.set(x.target_id!, e)
    }
  }
  const misconception = [...mis.entries()].map(([tid, e]) => ({ slug: byId.get(tid)!.slug, statement: byId.get(tid)!.statement, flags: e.n, students: e.students.size }))
    .sort((a, b) => b.students - a.students || b.flags - a.flags).slice(0, 6)

  // 2 · calibration drift.
  const overBy = new Map<string, number>()
  for (const x of cal) if (x.delta > 0) overBy.set(x.target_id, (overBy.get(x.target_id) ?? 0) + 1)
  const calibration = {
    pairs: cal.length,
    calibrated: cal.filter((x) => x.delta === 0).length,
    over: cal.filter((x) => x.delta > 0).length,
    under: cal.filter((x) => x.delta < 0).length,
    overTargets: [...overBy.entries()].map(([tid, n]) => ({ slug: byId.get(tid)!.slug, over: n })).sort((a, b) => b.over - a.over).slice(0, 4),
  }

  // 3 · scaffold dependence: per (student, target) share of responses with ≥1 scaffold on.
  const share = new Map<string, { on: number; n: number }>()
  for (const x of resps) {
    const k = `${x.user_id}:${x.target_id}`
    const e = share.get(k) ?? { on: 0, n: 0 }
    e.n++; if ((x.scaffolds_used?.length ?? 0) > 0) e.on++
    share.set(k, e)
  }
  const heavy: number[] = [], light: number[] = []
  const perTarget = new Map<string, { heavy: number[]; light: number[] }>()
  for (const [k, e] of share) {
    const lvl = latest.get(k); if (lvl === undefined) continue
    const tid = k.split(':')[1]
    const bucket = e.on / e.n >= 0.5 ? 'heavy' : 'light'
    ;(bucket === 'heavy' ? heavy : light).push(lvl)
    const pt = perTarget.get(tid) ?? { heavy: [], light: [] }
    pt[bucket].push(lvl); perTarget.set(tid, pt)
  }
  const scaffold = {
    heavyPairs: heavy.length, lightPairs: light.length, heavyMean: mean(heavy), lightMean: mean(light),
    targets: [...perTarget.entries()].filter(([, v]) => v.heavy.length >= 2 && v.light.length >= 2)
      .map(([tid, v]) => ({ slug: byId.get(tid)!.slug, heavyMean: mean(v.heavy)!, lightMean: mean(v.light)!, gap: Math.round((mean(v.light)! - mean(v.heavy)!) * 100) / 100 }))
      .sort((a, b) => b.gap - a.gap).slice(0, 4),
  }

  // 4 · lobby efficacy: on targets that had a lobby, students who wrote in one vs not.
  const lobbied = new Set<string>()
  const lobbyTargets = new Set<string>()
  for (const x of resps) if (x.evidence_source === 'lobby') { lobbied.add(`${x.user_id}:${x.target_id}`); lobbyTargets.add(x.target_id!) }
  const withL: number[] = [], without: number[] = []
  const perLT = new Map<string, { w: number[]; wo: number[] }>()
  for (const [k, lvl] of latest) {
    const tid = k.split(':')[1]
    if (!lobbyTargets.has(tid)) continue
    const w = lobbied.has(k)
    ;(w ? withL : without).push(lvl)
    const e = perLT.get(tid) ?? { w: [], wo: [] }
    ;(w ? e.w : e.wo).push(lvl); perLT.set(tid, e)
  }
  const lobby = {
    targets: lobbyTargets.size, withPairs: withL.length, withoutPairs: without.length, withMean: mean(withL), withoutMean: mean(without),
    perTarget: [...perLT.entries()].filter(([, v]) => v.w.length >= 2 && v.wo.length >= 2)
      .map(([tid, v]) => ({ slug: byId.get(tid)!.slug, withMean: mean(v.w)!, withoutMean: mean(v.wo)!, delta: Math.round((mean(v.w)! - mean(v.wo)!) * 100) / 100 }))
      .sort((a, b) => b.delta - a.delta).slice(0, 4),
  }

  return NextResponse.json({ misconception, calibration, scaffold, lobby, readOnly: ctx.role === 'observer' })
})
