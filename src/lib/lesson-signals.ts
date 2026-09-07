export type Target = { id: string; slug: string; statement: string; unit_id: string | null }
export type Resp = { id: string; lesson_id: string | null; block_id: string; session_id: string | null; present_session_id: string | null; poll_run_id: string | null; user_id: string; target_id: string | null; evidence_source: string | null; confidence: string | null; scaffolds_used: string[] | null; response: { autoCheck?: string } | null; created_at: string }
export type Rec = { user_id: string; target_id: string; level: number; observed_at: string }

const mean = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100 : null)


export type Calibration = { user_id: string; target_id: string; delta: number }
const SUPPORTS = new Set(['word_bank', 'l1', 'visual', 'talk_first', 'given_hint', 'equation_hint'])
/** Level and mode describe the interaction; they are not language supports. */
export function isActualSupport(value: string): boolean {
  return SUPPORTS.has(value) || /^frame:[123]$/.test(value)
}
export function hasSupportLog(values: string[] | null): boolean {
  // Legacy empty arrays cannot distinguish an uninstrumented response from no help.
  return Boolean(values?.some((value) => isActualSupport(value) || /^(level:(full|partial|bare)|mode:(text|sketch|audio|label|choice))$/.test(value)))
}
export function latestEvidence(rows: Resp[]): Resp[] {
  const latest = new Map<string, Resp>()
  for (const row of rows) {
    const key = JSON.stringify([row.user_id, row.lesson_id, row.block_id, row.evidence_source, row.session_id, row.present_session_id, row.poll_run_id])
    const old = latest.get(key)
    if (!old || row.created_at > old.created_at || (row.created_at === old.created_at && row.id > old.id)) latest.set(key, row)
  }
  return [...latest.values()]
}
export function buildLessonSignals(targets: Target[], rows: Resp[], records: Rec[], calibrations: Calibration[]) {
  const byId = new Map(targets.map((x) => [x.id, x]))
  const inScope = (tid: string | null): tid is string => Boolean(tid && byId.has(tid))
  const scoped = rows.filter((x) => inScope(x.target_id))
  const resps = latestEvidence(rows).filter((x) => inScope(x.target_id))
  const recs = records.filter((x) => inScope(x.target_id))
  const cal = calibrations.filter((x) => inScope(x.target_id))
  // Latest teacher level per (student, target) — M-4: read, never duplicate.
  const latest = new Map<string, number>()
  for (const x of [...recs].sort((a, b) => b.observed_at.localeCompare(a.observed_at))) { const k = `${x.user_id}:${x.target_id}`; if (!latest.has(k)) latest.set(k, x.level) }

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

  // 3 · Support-use association, excluding unknown logs from the denominator.
  const share = new Map<string, { on: number; n: number }>()
  for (const x of resps) {
    if (!hasSupportLog(x.scaffolds_used)) continue
    const k = `${x.user_id}:${x.target_id}`
    const e = share.get(k) ?? { on: 0, n: 0 }
    e.n++; if (x.scaffolds_used?.some(isActualSupport)) e.on++
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

  // 4 · Group-work association: on targets that had a lobby, students who wrote in one vs not.
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


  const dated = resps.map((r) => r.created_at).sort()
  const coverage = {
    responses: resps.length, supersededResponses: scoped.length - resps.length,
    loggedResponses: resps.filter((r) => hasSupportLog(r.scaffolds_used)).length,
    missingLogs: resps.filter((r) => !hasSupportLog(r.scaffolds_used)).length,
    missingSource: resps.filter((r) => !r.evidence_source).length,
    from: dated[0] ?? null, through: dated.at(-1) ?? null,
  }
  return { misconception, calibration, scaffold, lobby, coverage }
}
