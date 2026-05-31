/**
 * MathSpineGrowth — the student's math-literacy view.
 *
 * Headline axis: the four math strands (Proportional Reasoning, Quantities &
 * Estimation, Symbolic Manipulation, Graphs & Vectors), each a decaying weighted
 * average (w = 0.60) of the student's competency records — but UNLIKE the unit
 * growth lines, these span the WHOLE YEAR (the spine never resets). Below: the
 * eleven competencies grouped by strand. At the bottom: the celebration trail —
 * the points this student has earned growing their math literacy.
 *
 * Presentational + pure: feed it the student's records & grants; it computes via
 * the source-of-truth rollup. Wire a data loader around it.
 */
import { MathCompetencyRecord, MathStrand, DEFAULT_RECENCY_WEIGHT } from '@/data/curriculum-types'
import { STRAND_ORDER, STRAND_LABEL } from '@/lib/math-spine'
import MathClimb from './MathClimb'
import {
  PALETTE,
  levelWord,
  levelColor,
  buildRecordsByCompetency,
  competencyValue,
  strandValue,
  strandSeries,
  trendForCompetency,
  Trend,
} from './math-spine-display'

export interface SpineCompetency {
  id: string
  code: string
  statement: string
  strand: MathStrand
}

export interface SpineGrant {
  milestone: string
  competencyId?: string
  strand?: string
  points: number
  note?: string
  awardedAt?: string
}

export interface MathSpineGrowthProps {
  studentName?: string
  competencies: SpineCompetency[]
  records: MathCompetencyRecord[]
  grants?: SpineGrant[]
  mathPointsEarned?: number
  recencyWeight?: number
}

const MILESTONE_LABEL: Record<string, string> = {
  'levelup-almost': 'Reached "Almost"',
  'competency-fluent': 'Became Fluent',
  'strand-complete': 'Completed a strand',
  'spotlight': 'Teacher spotlight',
}

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === 'none') return null
  const color = trend === 'up' ? PALETTE.sage : trend === 'down' ? 'var(--viz-down)' : PALETTE.indigoMuted
  const d = trend === 'up' ? 'M3 13l5-5 4 4 6-7' : trend === 'down' ? 'M3 6l5 5 4-4 6 7' : 'M3 10h15'
  return (
    <svg width={18} height={18} viewBox="0 0 21 21" aria-label={`trend ${trend}`} role="img">
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Sparkline({ series }: { series: number[] }) {
  if (series.length < 2) return null
  const w = 80
  const h = 24
  const pts = series
    .map((v, i) => {
      const x = (i / (series.length - 1)) * w
      const y = h - (Math.max(0, Math.min(3, v)) / 3) * h
      return `${x.toFixed(0)},${y.toFixed(0)}`
    })
    .join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label="growth trend">
      <polyline points={pts} fill="none" stroke={PALETTE.lavender} strokeWidth={2} />
    </svg>
  )
}

export default function MathSpineGrowth({
  studentName,
  competencies,
  records,
  grants = [],
  mathPointsEarned = 0,
  recencyWeight = DEFAULT_RECENCY_WEIGHT,
}: MathSpineGrowthProps) {
  const byCompetency = buildRecordsByCompetency(records)
  const idsByStrand = (strand: MathStrand) =>
    competencies.filter((c) => c.strand === strand).map((c) => c.id)

  const fluentCount = competencies.filter(
    (c) => (competencyValue(byCompetency.get(c.id), recencyWeight) ?? 0) >= 2.5,
  ).length
  const strandsComplete = grants.filter((g) => g.milestone === 'strand-complete').length

  return (
    <div style={{ background: 'var(--card)', color: PALETTE.indigo }} className="rounded-xl border p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-medium" style={{ color: PALETTE.indigo }}>
          Your math literacy
        </h2>
        <span className="text-sm" style={{ color: PALETTE.indigoMuted }}>
          {studentName}
        </span>
      </div>
      <p className="text-sm mt-1 mb-4" style={{ color: PALETTE.indigoMuted }}>
        The math that carries every unit. It never goes away — your growth here builds all year.
      </p>

      {/* Points earned banner */}
      <div
        className="flex items-center justify-between rounded-lg border px-4 py-3 mb-4"
        style={{ background: 'var(--muted)', borderColor: PALETTE.hairline }}
      >
        <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          Math-literacy points earned
        </span>
        <span className="text-lg font-semibold tabular-nums" style={{ color: PALETTE.sage }}>
          {mathPointsEarned} pts
        </span>
      </div>

      {/* Your math climb — ratings over time */}
      <MathClimb competencies={competencies} records={records} />

      {/* Strand cards */}
      <div className="grid gap-3 mt-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        {STRAND_ORDER.map((strand) => {
          const ids = idsByStrand(strand)
          const value = strandValue(ids, byCompetency, recencyWeight)
          const series = strandSeries(ids, records, recencyWeight)
          const empty = value === null
          return (
            <div
              key={strand}
              className="rounded-lg border bg-card p-3.5"
              style={{ borderColor: PALETTE.hairline, borderStyle: empty ? 'dashed' : 'solid' }}
            >
              <div
                className="flex items-center gap-2 text-sm font-medium"
                style={{ color: empty ? 'var(--muted-foreground)' : 'var(--foreground)' }}
              >
                <span
                  aria-hidden
                  style={{ width: 8, height: 8, borderRadius: 2, background: empty ? PALETTE.periwinkle : PALETTE.lavender }}
                />
                {STRAND_LABEL[strand]}
              </div>
              {empty ? (
                <p className="text-sm mt-2.5 leading-snug" style={{ color: 'var(--muted-foreground)' }}>
                  No evidence recorded yet.
                </p>
              ) : (
                <>
                  <div className="flex items-baseline gap-2 mt-2 mb-0.5">
                    <span className="text-2xl font-medium">{value!.toFixed(1)}</span>
                    <span className="text-xs font-medium" style={{ color: levelColor(value) }}>
                      {levelWord(value)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded my-1.5" style={{ background: 'var(--secondary)' }}>
                    <div
                      className="h-full rounded"
                      style={{ width: `${Math.round((value! / 3) * 100)}%`, background: levelColor(value) }}
                    />
                  </div>
                  <Sparkline series={series} />
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Competencies grouped by strand */}
      {STRAND_ORDER.map((strand) => {
        const comps = competencies.filter((c) => c.strand === strand)
        if (comps.length === 0) return null
        return (
          <div key={strand}>
            <p className="text-sm font-medium mt-5 mb-1" style={{ color: 'var(--foreground)' }}>
              {STRAND_LABEL[strand]}
            </p>
            <div className="rounded-lg border bg-card px-4" style={{ borderColor: PALETTE.hairline }}>
              {comps.map((c, i) => {
                const recs = byCompetency.get(c.id)
                const value = competencyValue(recs, recencyWeight)
                const trend = trendForCompetency(recs, recencyWeight)
                const fluent = (value ?? 0) >= 2.5
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 py-2.5"
                    style={{ borderTop: i === 0 ? 'none' : '0.5px solid var(--secondary)' }}
                  >
                    <span
                      className="text-[11px] font-medium rounded px-2 py-0.5 tabular-nums"
                      style={{ background: 'var(--secondary)', color: 'var(--foreground)' }}
                    >
                      {c.code}
                    </span>
                    <span className="flex-1 text-[13px] leading-snug">{c.statement}</span>
                    {fluent && (
                      <span aria-label="Fluent" title="Fluent" style={{ color: PALETTE.sage }}>
                        ★
                      </span>
                    )}
                    <span className="text-[13px] font-medium tabular-nums" style={{ color: PALETTE.indigo }}>
                      {value === null ? '—' : value.toFixed(1)}
                    </span>
                    <TrendIcon trend={trend} />
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Celebration trail */}
      <div className="flex items-center gap-2 mt-6 mb-2">
        <div className="flex-1" style={{ height: '0.5px', background: 'var(--border)' }} />
        <span className="text-[11px]" style={{ color: 'var(--muted-foreground)', letterSpacing: '0.3px' }}>
          what you&apos;ve earned
        </span>
        <div className="flex-1" style={{ height: '0.5px', background: 'var(--border)' }} />
      </div>
      <div className="flex flex-wrap gap-2 mb-1">
        <span
          className="text-xs rounded-full px-3 py-1"
          style={{ background: 'var(--viz-up-surface)', color: 'var(--viz-up)' }}
        >
          ★ {fluentCount} of {competencies.length} skills Fluent
        </span>
        <span
          className="text-xs rounded-full px-3 py-1"
          style={{ background: 'var(--viz-up-surface)', color: 'var(--viz-up)' }}
        >
          {strandsComplete} strand{strandsComplete === 1 ? '' : 's'} complete
        </span>
      </div>
      {grants.length > 0 && (
        <div className="rounded-lg border bg-card mt-2 px-4" style={{ borderColor: PALETTE.hairline }}>
          {grants.slice(0, 6).map((g, i) => (
            <div
              key={`${g.milestone}-${i}`}
              className="flex items-center gap-3 py-2 text-[13px]"
              style={{ borderTop: i === 0 ? 'none' : '0.5px solid var(--secondary)' }}
            >
              <span className="flex-1" style={{ color: 'var(--foreground)' }}>
                {MILESTONE_LABEL[g.milestone] ?? g.milestone}
                {g.note ? ` — ${g.note}` : ''}
              </span>
              <span className="font-medium tabular-nums" style={{ color: PALETTE.sage }}>
                +{g.points}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
