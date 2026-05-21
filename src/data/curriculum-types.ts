/**
 * Curriculum content-layer types — SOURCE OF TRUTH
 * See: App Integration/content_layer_spec.md
 *
 * This module is the model the Supabase schema is DERIVED from, not the reverse.
 * Content entities are authored & versioned here. Runtime entities are owned by
 * the database; their shapes are declared here only so the projection stays honest.
 */

// ---------------------------------------------------------------------------
// CONTENT LAYER (authored, versioned, stable)
// ---------------------------------------------------------------------------

/** Top of the clean tree: a "kind of thinking" (Stiggins/Chappuis target types). */
export type Domain = "knowledge" | "reasoning" | "skill" | "product";

/** Optional secondary tag for filtering the dashboard by physics topic. */
export type ContentStrand = "motion-kinematics" | "forces-dynamics";

/**
 * The hinge of the whole model. One "I can…" statement.
 * Carries EXACTLY ONE domain (the mastery-rollup axis) and EXACTLY ONE unit
 * (the time axis). contentStrand is an optional secondary filter tag.
 */
export interface LearningTarget {
  id: string;                  // stable slug, e.g. "u1.f-ma-solve"
  statement: string;           // verbatim student-facing "I can…" text
  domain: Domain;              // exactly ONE — clean-tree rollup axis
  unitId: string;              // exactly ONE — curriculum/time placement
  contentStrand?: ContentStrand;
  standardRefs?: string[];     // NGSS / AP / MA codes (authoritative list in physics-standards.ts)
  /** Excluded from the growth tree (e.g. metacognitive workshop targets). */
  excludeFromGrowth?: boolean;
}

export interface Unit {
  id: string;
  name: string;
  orderIndex: number;
  targetIds: string[];         // ordered
  masteryTaskId: string;
}

/** The four dimensions of the summative rubric — a DIFFERENT scheme from Domain. */
export type RubricDimension = "science" | "reasoning" | "communication" | "transfer";

export interface MasteryTask {
  id: string;
  unitId: string;
  prompt: string;
  rubric: Record<RubricDimension, { description: string }>;
  // Scale is 0–4 per dimension; lowest-dimension grading applied by the engine.
}

// ---------------------------------------------------------------------------
// RUNTIME LAYER (DB-authoritative — declared here, owned there)
// ---------------------------------------------------------------------------

export type MarzanoLevel = 1 | 2 | 3;
export type RubricScore = 0 | 1 | 2 | 3 | 4;

/** The growth-line grain. Append-only, longitudinal: a target is re-observed over time. */
export interface MasteryRecord {
  studentId: string;
  targetId: string;
  observedAt: string;          // ISO date — records are time-stamped, never overwritten
  level: MarzanoLevel;
  evidenceSource?: string;     // exit ticket, lab, conversation, quiz item…
}

/** The standalone summative readout. NEVER blended into the K/R/S/P growth lines. */
export interface MasteryTaskResult {
  studentId: string;
  masteryTaskId: string;
  scoredAt: string;
  scores: Record<RubricDimension, RubricScore>;
  overall?: number;            // lowest-dimension rule
}

// ---------------------------------------------------------------------------
// ROLLUP — decaying weighted average (DECIDED: w = 0.60, decay by sequence)
// ---------------------------------------------------------------------------

export const DEFAULT_RECENCY_WEIGHT = 0.6;

/**
 * Collapse an ordered list of levels into one value, emphasizing recent evidence
 * while never fully forgetting the past (influence shrinks geometrically).
 *
 *   value₁ = level₁
 *   valueₙ = w·levelₙ + (1 − w)·valueₙ₋₁
 *
 * @param levels  observation levels in chronological order (oldest → newest)
 * @param w       recency weight in (0,1); higher = more responsive, more volatile
 */
export function decayingAverage(
  levels: number[],
  w: number = DEFAULT_RECENCY_WEIGHT,
): number | null {
  if (levels.length === 0) return null;
  return levels.reduce((acc, lvl, i) => (i === 0 ? lvl : w * lvl + (1 - w) * acc));
}

/** A student's current value on one target = decaying average of its records (sorted by date). */
export function targetValue(
  records: MasteryRecord[],
  w: number = DEFAULT_RECENCY_WEIGHT,
): number | null {
  const ordered = [...records].sort((a, b) => a.observedAt.localeCompare(b.observedAt));
  return decayingAverage(ordered.map((r) => r.level), w);
}

/**
 * A student's domain growth number = mean of their per-target decaying values
 * across the targets in that domain for which they have at least one record.
 * Targets flagged excludeFromGrowth are dropped.
 */
export function domainScore(
  domain: Domain,
  targets: LearningTarget[],
  recordsByTarget: Map<string, MasteryRecord[]>,
  w: number = DEFAULT_RECENCY_WEIGHT,
): number | null {
  const values: number[] = [];
  for (const t of targets) {
    if (t.domain !== domain || t.excludeFromGrowth) continue;
    const recs = recordsByTarget.get(t.id);
    if (!recs || recs.length === 0) continue;
    const v = targetValue(recs, w);
    if (v !== null) values.push(v);
  }
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
