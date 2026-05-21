/**
 * LessonTargetMastery — read-only replacement for the old objective checkboxes
 * inside a lesson. A student no longer self-marks "done"; they see their
 * teacher-assessed level on each of this lesson's targets, the word, and the
 * direction it's moving. Drop this in where <LearningObjectives> used to render.
 */
import {
  LearningTarget,
  MasteryRecord,
  targetValue,
  DEFAULT_RECENCY_WEIGHT,
} from "@/data/curriculum-types";
import {
  DOMAIN_LABEL,
  PALETTE,
  levelWord,
  levelColor,
  buildRecordsByTarget,
  trendFor,
  Trend,
} from "./mastery-display";

export interface LessonTargetMasteryProps {
  /** The learning targets attached to this lesson. */
  targets: LearningTarget[];
  /** This student's mastery records (may include other lessons' targets; filtered here). */
  records: MasteryRecord[];
  recencyWeight?: number;
}

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === "none") return null;
  const color = trend === "up" ? PALETTE.sage : trend === "down" ? "#C08B8B" : PALETTE.indigoMuted;
  const d = trend === "up" ? "M3 13l5-5 4 4 6-7" : trend === "down" ? "M3 6l5 5 4-4 6 7" : "M3 10h15";
  return (
    <svg width={18} height={18} viewBox="0 0 21 21" aria-label={`trend ${trend}`} role="img">
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LessonTargetMastery({
  targets,
  records,
  recencyWeight = DEFAULT_RECENCY_WEIGHT,
}: LessonTargetMasteryProps) {
  const byTarget = buildRecordsByTarget(records);
  const shown = targets.filter((t) => !t.excludeFromGrowth);

  if (shown.length === 0) {
    return (
      <p className="text-sm" style={{ color: PALETTE.indigoMuted }}>
        No learning targets attached to this lesson yet.
      </p>
    );
  }

  const anyEvidence = shown.some((t) => (byTarget.get(t.id)?.length ?? 0) > 0);

  return (
    <div className="space-y-1">
      {!anyEvidence && (
        <p className="text-sm mb-2" style={{ color: PALETTE.indigoMuted }}>
          Your teacher hasn&apos;t recorded mastery on these targets yet — they&apos;ll appear here as you show what you can do.
        </p>
      )}
      {shown.map((t, i) => {
        const recs = byTarget.get(t.id);
        const value = recs ? targetValue(recs, recencyWeight) : null;
        const trend = trendFor(recs, recencyWeight);
        const tag = t.domain.charAt(0).toUpperCase();
        return (
          <div
            key={t.id}
            className="flex items-center gap-3 py-2.5"
            style={{ borderTop: i === 0 ? "none" : "0.5px solid #EEEBF5" }}
          >
            <span
              className="text-[11px] font-medium rounded px-2 py-0.5"
              style={{ background: "#EEEBF6", color: "#4A4470" }}
              title={DOMAIN_LABEL[t.domain]}
            >
              {tag}
            </span>
            <span className="flex-1 text-sm leading-snug" style={{ color: PALETTE.indigo }}>
              {t.statement}
            </span>
            {value !== null && (
              <span className="text-xs font-medium" style={{ color: levelColor(value) }}>
                {levelWord(value)}
              </span>
            )}
            <span className="text-sm font-medium" style={{ color: PALETTE.indigo, minWidth: 28, textAlign: "right" }}>
              {value === null ? "—" : value.toFixed(1)}
            </span>
            <TrendIcon trend={trend} />
          </div>
        );
      })}
    </div>
  );
}
