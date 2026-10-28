import type { ResultActivity } from '@/lib/assessment-results/types'

export type Rating = 1 | 2 | 3 | null
export type Suggestion = { level: Rating; rationale: string; feedback: string }
export type Evidence = {
  id: string; prompt: string; response: unknown; previous?: unknown; guide?: string;
  targetIds: string[]; context?: string; suggestion?: Suggestion; teacherFeedback?: string;
  /** Native renderer data for diagrams, mathematical responses and group context. */
  rendering?: 'problem' | 'math' | 'force' | 'simulation' | 'artifact';
}
export type ScoreItem = { id: string; label: string; possible: number; step: number; automatic?: number; suggested?: number; feedback?: string }
export type ReviewDecision = {
  scores: Record<string, number>; ratings: Record<string, Rating>;
  evidenceRatings: Record<string, Rating>; feedback: Record<string, string>;
  note: string; gradeValue: string | null;
}
export type SavedDraft = { id: string; version: number; state: 'draft' | 'ready' | 'releasing' | 'returning' | 'released' | 'returned'; payload: ReviewDecision; request_id: string }
export type Revision = {
  id: string; source_key: string; user_id: string; source_version: string; feedback: string;
  evidence: Evidence[]; change_summary: string; addressed: string[];
  requested_at: string; resubmitted_at: string | null; released_at: string | null;
}
export type ReviewDocument = {
  activity: Pick<ResultActivity, 'key' | 'kind' | 'title' | 'sourceId' | 'unitIds'>;
  userId: string; studentName: string; version: string; reviewVersion?: string; submissionId: string;
  submittedAt: string | null; attempt: number; state: 'submitted' | 'returned' | 'released' | 'draft';
  evidence: Evidence[]; targets: {id:string;statement:string;allowSkip:boolean;released?:Rating}[];
  scoreItems: ScoreItem[]; gradeMode: 'points' | 'dimensions' | 'mastery' | 'completion';
  gradeFormat?: 'numeric' | 'letter' | 'credit';
  initialDecision?: ReviewDecision; suggestedFeedback?: string; draft: SavedDraft | null; revision: Revision | null;
  canReturn: boolean; canRelease: boolean; limitation?: string;
  /** Source-owned review remains available for exceptional cases and full artifacts. */
  sourceHref: string;
}

export const emptyDecision = (): ReviewDecision => ({ scores:{}, ratings:{}, evidenceRatings:{}, feedback:{}, note:'', gradeValue:null })
export function appendFeedback(current: string, suggestion: string) {
  const text = suggestion.trim()
  if (!text || current.trim() === text || current.includes(text)) return current
  return current.trim() ? current.trimEnd() + '\n\n' + text : text
}
export function reviewPercent(doc: Pick<ReviewDocument,'gradeMode'|'scoreItems'>, decision: ReviewDecision) {
  if (!doc.scoreItems.length) return null
  const scores = doc.scoreItems.map(item => item.automatic ?? decision.scores[item.id])
  if (scores.some((score,i) => !Number.isFinite(score) || score < 0 || score > doc.scoreItems[i].possible)) return null
  return doc.gradeMode === 'dimensions' ? [50,75,85,89,96][Math.min(...scores)] : 100 * scores.reduce((a,b) => a+b,0) / doc.scoreItems.reduce((n,i) => n+i.possible,0)
}
export function validateDecision(doc: ReviewDocument, value: unknown, ready=false): ReviewDecision {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Your review could not be read.')
  const d = value as ReviewDecision
  for (const key of ['scores','ratings','evidenceRatings','feedback'] as const) if (!d[key] || typeof d[key] !== 'object' || Array.isArray(d[key])) throw Error('Your review could not be read.')
  if (typeof d.note !== 'string' || d.note.length > 1600 || !(d.gradeValue === null || typeof d.gradeValue === 'string' && d.gradeValue.length < 30)) throw Error('Keep overall feedback within 1,600 characters.')
  for (const [id,score] of Object.entries(d.scores)) {
    const item=doc.scoreItems.find(i=>i.id===id)
    if (!item || !Number.isFinite(score) || score<0 || score>item.possible || score/item.step%1!==0 || item.automatic!==undefined && score!==item.automatic) throw Error('Check the authored point values.')
  }
  for (const [id,level] of Object.entries(d.ratings)) {
    const target=doc.targets.find(t=>t.id===id)
    if (!target || ![1,2,3,null].includes(level) || level===null && !target.allowSkip || target.released!==undefined && level!==target.released) throw Error('Check the mastery decisions.')
  }
  for (const [id,level] of Object.entries(d.evidenceRatings)) if (!doc.evidence.some(e=>e.id===id) || ![1,2,3,null].includes(level)) throw Error('Check the evidence decisions.')
  for (const [id,note] of Object.entries(d.feedback)) if (![...doc.evidence,...doc.scoreItems].some(i=>i.id===id) || typeof note!=='string' || note.length>800) throw Error('Keep each response’s feedback within 800 characters.')
  if (ready) {
    if (!doc.canRelease || doc.state!=='submitted') throw Error('Only a current submitted attempt can be released.')
    if (doc.scoreItems.some(i=>i.automatic===undefined && !Object.hasOwn(d.scores,i.id))) throw Error('Score every required item before marking this review ready.')
    if (doc.targets.some(t=>t.released===undefined && !Object.hasOwn(d.ratings,t.id))) throw Error('Make a decision for every learning target.')
    if (doc.gradeFormat && doc.gradeFormat!=='numeric' && !d.gradeValue) throw Error('Choose the letter grade or credit decision.')
  }
  return {scores:{...d.scores},ratings:{...d.ratings},evidenceRatings:{...d.evidenceRatings},feedback:{...d.feedback},note:d.note.trim(),gradeValue:d.gradeValue}
}

/** Menu columns may own native evidence; the review desk can still open each source. */
export function reviewableActivities(activities:ResultActivity[]):ResultActivity[]{return [...new Map(activities.flatMap(a=>[a,...reviewableActivities(a.evidenceActivities??[])]).map(a=>[a.key,a])).values()]}
