export const SUGGESTION_SOURCES = ['lesson','reading','math','presentation','choice','vocabulary','checkpoint','review','mission'] as const
export type SuggestionSource = typeof SUGGESTION_SOURCES[number]
export type SubmissionSuggestion = { summary: string; next_time: string; ratings: { target_id: string; level: 1|2|3|null; rationale: string }[]; scores: { id: string; earned: number; possible: number; feedback: string }[] }
export type SuggestionRow = { status: 'queued'|'processing'|'ready'|'error'; result: SubmissionSuggestion|null; targets: { id:string; statement:string }[]; error: string|null }
export function validSuggestion(value: unknown, targets: string[], scoreItems: { id:string; possible:number }[]): value is SubmissionSuggestion {
  if (!value || typeof value !== 'object') return false
  const r = value as SubmissionSuggestion
  if (typeof r.summary !== 'string' || r.summary.length > 1500 || typeof r.next_time !== 'string' || r.next_time.length > 1000 || !Array.isArray(r.ratings) || r.ratings.length !== targets.length || !Array.isArray(r.scores) || r.scores.length !== scoreItems.length) return false
  const seen = new Set<string>(), scored = new Set<string>()
  return r.ratings.every(t => t && targets.includes(t.target_id) && !seen.has(t.target_id) && !!seen.add(t.target_id) && [1,2,3,null].includes(t.level) && typeof t.rationale === 'string' && !!t.rationale.trim() && t.rationale.length <= 1200)
    && r.scores.every(s => s && !scored.has(s.id) && !!scored.add(s.id) && scoreItems.some(i => i.id === s.id && i.possible === s.possible) && Number.isFinite(s.earned) && Number.isInteger(s.earned) && s.earned >= 0 && s.earned <= s.possible && typeof s.feedback === 'string' && s.feedback.length <= 1200)
}
