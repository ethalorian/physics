/**
 * Shared display helpers for the mastery UI.
 * Pure functions over the source-of-truth model in src/data/curriculum-types.ts.
 *
 * Level language (confirmed by Craig 2026-05-21): Not yet / Almost / Got it.
 * Students see the number AND the word AND a trend — every signal doubled so it
 * survives grayscale and colorblindness.
 */
import {
  Domain,
  LearningTarget,
  MasteryRecord,
  decayingAverage,
  DEFAULT_RECENCY_WEIGHT,
} from "@/data/curriculum-types";

export const DOMAIN_ORDER: Domain[] = ["knowledge", "reasoning", "skill", "product"];

export const DOMAIN_LABEL: Record<Domain, string> = {
  knowledge: "Knowledge",
  reasoning: "Reasoning",
  skill: "Skill",
  product: "Product",
};

// Curriculum palette (terrestrial + galactical). Calm, muted, grayscale-safe.
// Token-backed so growth visuals adapt to light/dark. These are CSS custom
// properties (defined in globals.css), valid anywhere a CSS color string is —
// inline style values and SVG stroke/fill included.
export const PALETTE = {
  indigo: "var(--foreground)",
  indigoMuted: "var(--muted-foreground)",
  lavender: "var(--primary)",
  sage: "var(--viz-up)",
  periwinkle: "var(--viz-faint)",
  hairline: "var(--border)",
  rose: "var(--viz-down)",
};

export type Trend = "up" | "flat" | "down" | "none";

/** 1 / 2 / 3 Marzano → student-facing word. null = no evidence yet. */
export function levelWord(v: number | null): string {
  if (v === null) return "Not started";
  if (v < 1.5) return "Not yet";
  if (v < 2.5) return "Almost";
  return "Got it";
}

/** Accent color for a level. Always paired with the number + word, never alone. */
export function levelColor(v: number | null): string {
  if (v === null || v < 1.5) return PALETTE.periwinkle;
  if (v < 2.5) return PALETTE.lavender;
  return PALETTE.sage;
}

export function buildRecordsByTarget(
  records: MasteryRecord[],
): Map<string, MasteryRecord[]> {
  const m = new Map<string, MasteryRecord[]>();
  for (const r of records) {
    const arr = m.get(r.targetId) ?? [];
    arr.push(r);
    m.set(r.targetId, arr);
  }
  return m;
}

/** Direction of travel: compare the decaying average with and without the latest observation. */
export function trendFor(
  records: MasteryRecord[] | undefined,
  w: number = DEFAULT_RECENCY_WEIGHT,
): Trend {
  if (!records || records.length < 2) return "none";
  const levels = [...records]
    .sort((a, b) => a.observedAt.localeCompare(b.observedAt))
    .map((r) => r.level);
  const cur = decayingAverage(levels, w);
  const prev = decayingAverage(levels.slice(0, -1), w);
  if (cur === null || prev === null) return "none";
  const d = cur - prev;
  if (d > 0.05) return "up";
  if (d < -0.05) return "down";
  return "flat";
}

/** Running decaying-average series for one domain (chronological) — drives the sparkline. */
export function domainSeries(
  domain: Domain,
  targets: LearningTarget[],
  records: MasteryRecord[],
  w: number = DEFAULT_RECENCY_WEIGHT,
): number[] {
  const ids = new Set(
    targets.filter((t) => t.domain === domain && !t.excludeFromGrowth).map((t) => t.id),
  );
  const levels = records
    .filter((r) => ids.has(r.targetId))
    .sort((a, b) => a.observedAt.localeCompare(b.observedAt))
    .map((r) => r.level);
  const series: number[] = [];
  let acc = 0;
  levels.forEach((lvl, i) => {
    acc = i === 0 ? lvl : w * lvl + (1 - w) * acc;
    series.push(acc);
  });
  return series;
}
