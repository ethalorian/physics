export interface EvidenceDecision {
  key: string;
  level: 1 | 2 | 3 | null;
  reason?: string;
}
export function summarizeEvidence(decisions: EvidenceDecision[]) {
  const levels = decisions.flatMap((d) => (d.level === null ? [] : [d.level]));
  const mean = levels.length
    ? levels.reduce((a, b) => a + b, 0) / levels.length
    : null;
  return {
    count: levels.length,
    mean,
    level: mean === null ? null : (Math.round(mean) as 1 | 2 | 3),
  };
}
export function validateEvidenceDecisions(
  input: unknown,
  expected: string[],
): EvidenceDecision[] {
  if (
    !Array.isArray(input) ||
    !expected.length ||
    input.length !== expected.length ||
    input.length > 300
  )
    throw new Error("Review every response before sending.");
  const seen = new Set<string>();
  const decisions = input.map((value) => {
    if (!value || typeof value !== "object")
      throw new Error("Invalid evidence rating.");
    const { key, level, reason } = value;
    if (typeof key !== "string" || !expected.includes(key) || seen.has(key))
      throw new Error(
        "The evidence changed. Reload the review before sending.",
      );
    seen.add(key);
    if (![1, 2, 3, null].includes(level))
      throw new Error("Choose 1, 2, or 3 for each response.");
    if (
      level === null &&
      (typeof reason !== "string" || !reason.trim() || reason.length > 300)
    )
      throw new Error("Explain why excluded evidence cannot be rated.");
    return {
      key,
      level,
      ...(level === null ? { reason: reason.trim() } : {}),
    } as EvidenceDecision;
  });
  if (!summarizeEvidence(decisions).count)
    throw new Error(
      "At least one response needs a rating. Use feedback only when more evidence is needed.",
    );
  return decisions;
}
