/**
 * MasteryGrowth — the student's growth view.
 *
 * Headline axis: the four kinds of thinking (Knowledge / Reasoning / Skill / Product),
 * each a decaying weighted average (w = 0.60) of the student's target-level records.
 * Below: this unit's targets (the zoomed-in view). Walled off at the bottom: the
 * transfer-task readiness panel, which is scored on the separate 4-D rubric and is
 * NEVER blended into the growth lines.
 *
 * Presentational + pure: feed it the student's records; it computes via the
 * source-of-truth rollup functions. Wire a data loader (API over the new tables)
 * around it.
 */
import {
  LearningTarget,
  MasteryRecord,
  RubricDimension,
  targetValue,
  domainScore,
  DEFAULT_RECENCY_WEIGHT,
} from "@/data/curriculum-types";
import {
  DOMAIN_ORDER,
  DOMAIN_LABEL,
  PALETTE,
  levelWord,
  levelColor,
  buildRecordsByTarget,
  trendFor,
  domainSeries,
  Trend,
} from "./mastery-display";

const RUBRIC_ORDER: RubricDimension[] = ["science", "reasoning", "communication", "transfer"];
const RUBRIC_LABEL: Record<RubricDimension, string> = {
  science: "Science",
  reasoning: "Reasoning",
  communication: "Communication",
  transfer: "Transfer",
};

export interface MasteryGrowthProps {
  studentName?: string;
  unitName?: string;
  /** This unit's targets (source of truth). */
  targets: LearningTarget[];
  /** This student's mastery records. */
  records: MasteryRecord[];
  /** Optional standalone transfer-task result (0–4 per dimension). */
  taskResult?: { scores: Record<RubricDimension, number>; overall?: number };
  recencyWeight?: number;
}

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === "none") return null;
  const color = trend === "up" ? PALETTE.sage : trend === "down" ? "var(--viz-down)" : PALETTE.indigoMuted;
  const d =
    trend === "up"
      ? "M3 13l5-5 4 4 6-7"
      : trend === "down"
      ? "M3 6l5 5 4-4 6 7"
      : "M3 10h15";
  return (
    <svg width={18} height={18} viewBox="0 0 21 21" aria-label={`trend ${trend}`} role="img">
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Sparkline({ series }: { series: number[] }) {
  if (series.length < 2) return null;
  const w = 80;
  const h = 24;
  const pts = series
    .map((v, i) => {
      const x = (i / (series.length - 1)) * w;
      const y = h - (Math.max(0, Math.min(3, v)) / 3) * h;
      return `${x.toFixed(0)},${y.toFixed(0)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label="growth trend">
      <polyline points={pts} fill="none" stroke={PALETTE.lavender} strokeWidth={2} />
    </svg>
  );
}

export default function MasteryGrowth({
  studentName,
  unitName,
  targets,
  records,
  taskResult,
  recencyWeight = DEFAULT_RECENCY_WEIGHT,
}: MasteryGrowthProps) {
  const byTarget = buildRecordsByTarget(records);

  return (
    <div
      style={{ background: "var(--card)", color: PALETTE.indigo }}
      className="rounded-xl border p-5 sm:p-6"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-medium" style={{ color: PALETTE.indigo }}>
          Your growth
        </h2>
        <span className="text-sm" style={{ color: PALETTE.indigoMuted }}>
          {[studentName, unitName].filter(Boolean).join(" · ")}
        </span>
      </div>
      <p className="text-sm mt-1 mb-4" style={{ color: PALETTE.indigoMuted }}>
        By kind of thinking. Recent work counts more, but earlier work still counts.
      </p>

      {/* Domain cards */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        {DOMAIN_ORDER.map((domain) => {
          const value = domainScore(domain, targets, byTarget, recencyWeight);
          const series = domainSeries(domain, targets, records, recencyWeight);
          const empty = value === null;
          return (
            <div
              key={domain}
              className="rounded-lg border bg-card p-3.5"
              style={{ borderColor: PALETTE.hairline, borderStyle: empty ? "dashed" : "solid" }}
            >
              <div className="flex items-center gap-2 text-sm font-medium" style={{ color: empty ? "var(--muted-foreground)" : "var(--foreground)" }}>
                <span
                  aria-hidden
                  style={{ width: 8, height: 8, borderRadius: 2, background: empty ? PALETTE.periwinkle : PALETTE.lavender }}
                />
                {DOMAIN_LABEL[domain]}
              </div>
              {empty ? (
                <p className="text-sm mt-2.5 leading-snug" style={{ color: "var(--muted-foreground)" }}>
                  {domain === "product"
                    ? "Shows up in your transfer task — no growth-line data yet."
                    : "No evidence recorded yet."}
                </p>
              ) : (
                <>
                  <div className="flex items-baseline gap-2 mt-2 mb-0.5">
                    <span className="text-2xl font-medium">{value!.toFixed(1)}</span>
                    <span className="text-xs font-medium" style={{ color: levelColor(value) }}>
                      {levelWord(value)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded my-1.5" style={{ background: "var(--secondary)" }}>
                    <div
                      className="h-full rounded"
                      style={{ width: `${Math.round((value! / 3) * 100)}%`, background: levelColor(value) }}
                    />
                  </div>
                  <Sparkline series={series} />
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* This unit's targets */}
      <p className="text-sm font-medium mt-5 mb-1" style={{ color: "var(--foreground)" }}>
        This unit&apos;s targets
      </p>
      <div className="rounded-lg border bg-card px-4" style={{ borderColor: PALETTE.hairline }}>
        {targets
          .filter((t) => !t.excludeFromGrowth)
          .map((t, i) => {
            const recs = byTarget.get(t.id);
            const value = recs ? targetValue(recs, recencyWeight) : null;
            const trend = trendFor(recs, recencyWeight);
            const tag = t.domain.charAt(0).toUpperCase();
            return (
              <div
                key={t.id}
                className="flex items-center gap-3 py-2.5"
                style={{ borderTop: i === 0 ? "none" : `0.5px solid var(--secondary)` }}
              >
                <span
                  className="text-[11px] font-medium rounded px-2 py-0.5"
                  style={{ background: "var(--secondary)", color: "var(--foreground)" }}
                  title={DOMAIN_LABEL[t.domain]}
                >
                  {tag}
                </span>
                <span className="flex-1 text-[13px] leading-snug">{t.statement}</span>
                <span className="text-[13px] font-medium" style={{ color: PALETTE.indigo }}>
                  {value === null ? "—" : value.toFixed(1)}
                </span>
                <TrendIcon trend={trend} />
              </div>
            );
          })}
      </div>

      {/* Transfer task — walled off; never blended into the growth lines */}
      {taskResult && (
        <>
          <div className="flex items-center gap-2 mt-6 mb-1">
            <div className="flex-1" style={{ height: "0.5px", background: "var(--border)" }} />
            <span className="text-[11px]" style={{ color: "var(--muted-foreground)", letterSpacing: "0.3px" }}>
              scored separately · not part of your growth lines
            </span>
            <div className="flex-1" style={{ height: "0.5px", background: "var(--border)" }} />
          </div>
          <div className="rounded-lg border p-4" style={{ background: "var(--muted)", borderColor: PALETTE.hairline }}>
            <div className="text-sm font-medium mb-2.5" style={{ color: "var(--foreground)" }}>
              Transfer task — readiness
            </div>
            <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))" }}>
              {RUBRIC_ORDER.map((dim) => {
                const score = taskResult.scores[dim] ?? 0;
                return (
                  <div key={dim}>
                    <div className="text-xs mb-1" style={{ color: PALETTE.indigoMuted }}>
                      {RUBRIC_LABEL[dim]}
                    </div>
                    <div className="h-1.5 rounded" style={{ background: "var(--border)" }}>
                      <div
                        className="h-full rounded"
                        style={{ width: `${Math.round((score / 4) * 100)}%`, background: score >= 3 ? PALETTE.sage : PALETTE.lavender }}
                      />
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: PALETTE.indigoMuted }}>
                      {score} of 4
                    </div>
                  </div>
                );
              })}
            </div>
            {taskResult.overall !== undefined && (
              <div className="text-xs mt-3 pt-2.5" style={{ color: PALETTE.indigoMuted, borderTop: "0.5px solid var(--border)" }}>
                Lowest dimension sets the overall:{" "}
                <span className="font-medium" style={{ color: PALETTE.indigo }}>
                  {taskResult.overall} of 4
                </span>
                .
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
