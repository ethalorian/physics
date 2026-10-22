import { mean, percent, studentSummaries } from './model'
import type { AnalyticsDataset, AssignmentExposure, QuestionEvidence, Rating } from './types'

const DAY = 86400000
export const MIN_IMPACT_STUDENTS = 5
export type ImpactGrouping = 'format' | 'bloom' | 'dok'
export interface ImpactPair {
  studentId: string; targetId: string; exposure: AssignmentExposure; before: Rating; after: Rating; delta: number;
  followUpDays: number; otherAssignments: number;
}
export interface QuestionOutcomePair { studentId: string; before: QuestionEvidence; after: QuestionEvidence; gain: number }
export interface QuestionOutcome { students: number; gain: number | null; pairs: QuestionOutcomePair[] }
export interface ImpactRow {
  id: string; title: string; kind: string; submitted: number; pairs: ImpactPair[]; pairedStudents: number;
  baseline: number | null; outcome: number | null; gain: number | null; improved: number; eligible: boolean;
  missingBaseline: number; missingFollowUp: number; awaitingWindow: number; unmapped: number;
  comparison: { exposed: number; controls: number; gap: number | null; participantGain: number | null; comparisonGain: number | null };
  repeat: QuestionOutcome; newQuestion: QuestionOutcome;
}
function group<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const result = new Map<string, T[]>()
  for (const row of rows) { const id = key(row), values = result.get(id) ?? []; values.push(row); result.set(id, values) }
  return result
}
function evidenceIndex(data: AnalyticsDataset) {
  return {
    ratings: group([...data.ratings].sort((a, b) => Date.parse(a.at) - Date.parse(b.at) || a.id.localeCompare(b.id)), r => `${r.studentId}:${r.targetId}`),
    submissions: group(data.assignments, a => a.assignmentId),
    byStudent: group(data.assignments, a => a.studentId),
    questions: group([...data.questions].sort((a, b) => Date.parse(a.at) - Date.parse(b.at) || a.id.localeCompare(b.id)), q => `${q.studentId}:${q.targetId}`),
  }
}
type EvidenceIndex = ReturnType<typeof evidenceIndex>
function summarized(pairs: ImpactPair[]) {
  const students = [...group(pairs, p => p.studentId).values()].map(rows => ({ before: mean(rows.map(p => p.before.level))!, after: mean(rows.map(p => p.after.level))!, gain: mean(rows.map(p => p.delta))! }))
  return { baseline: mean(students.map(s => s.before)), outcome: mean(students.map(s => s.after)), gain: mean(students.map(s => s.gain)), pairedStudents: students.length, improved: students.filter(s => s.gain > 0).length }
}
function isOwnReview(rating: Rating, exposure: AssignmentExposure, index: EvidenceIndex) {
  const source = rating.source ?? ''
  // Quiz/interactive ratings embed their submission id. Lesson reviews do not identify a submission;
  // conservatively exclude all generic lesson-review ratings when evaluating a lesson submission.
  return exposure.kind === 'lesson' && source.toLowerCase().includes('lesson evidence review') || (index.submissions.get(exposure.assignmentId) ?? []).some(a => !!a.id && source.includes(a.id))
}
function ratingsAround(index: EvidenceIndex, exposure: AssignmentExposure, targetId: string, days: number, studentId = exposure.studentId) {
  const anchor = Date.parse(exposure.at)
  const ratings = index.ratings.get(`${studentId}:${targetId}`) ?? []
  const before = ratings.filter(r => Date.parse(r.at) < anchor && Date.parse(r.at) >= anchor - 30 * DAY).at(-1)
  const after = ratings.find(r => Date.parse(r.at) >= anchor + DAY && Date.parse(r.at) <= anchor + days * DAY && !isOwnReview(r, exposure, index))
  return { before, after }
}
export function impactPairs(data: AnalyticsDataset, exposures: AssignmentExposure[], days: number, index = evidenceIndex(data)) {
  const pairs: ImpactPair[] = [], missingBaseline = new Set<string>(), missingFollowUp = new Set<string>(), awaiting = new Set<string>(), unmapped = new Set<string>()
  const first = new Map<string, AssignmentExposure>()
  for (const exposure of [...exposures].sort((a, b) => Date.parse(a.at) - Date.parse(b.at) || a.id.localeCompare(b.id))) {
    if (!exposure.targetIds.length) unmapped.add(exposure.studentId)
    for (const target of exposure.targetIds) { const key = `${exposure.studentId}:${target}`; if (!first.has(key)) first.set(key, exposure) }
  }
  for (const [key, exposure] of first) {
    const targetId = key.slice(key.indexOf(':') + 1)
    if (Date.parse(exposure.at) + days * DAY > Date.parse(data.asOf)) { awaiting.add(exposure.studentId); continue }
    const { before, after } = ratingsAround(index, exposure, targetId, days)
    if (!before) { missingBaseline.add(exposure.studentId); continue }
    if (!after) { missingFollowUp.add(exposure.studentId); continue }
    pairs.push({ studentId: exposure.studentId, targetId, exposure, before, after, delta: after.level - before.level,
      followUpDays: (Date.parse(after.at) - Date.parse(exposure.at)) / DAY,
      otherAssignments: new Set((index.byStudent.get(exposure.studentId) ?? []).filter(a => a.assignmentId !== exposure.assignmentId && a.targetIds.includes(targetId) && Date.parse(a.at) >= Date.parse(before.at) && Date.parse(a.at) <= Date.parse(after.at)).map(a => a.assignmentId)).size })
  }
  return { pairs, missingBaseline: missingBaseline.size, missingFollowUp: missingFollowUp.size, awaitingWindow: awaiting.size, unmapped: unmapped.size }
}
function comparison(data: AnalyticsDataset, pairs: ImpactPair[], exposures: AssignmentExposure[], days: number, index: EvidenceIndex): ImpactRow['comparison'] {
  const participants = new Set(exposures.map(e => e.studentId)), controls = new Set<string>()
  const contrasts: { studentId: string; participant: number; comparison: number; gap: number }[] = []
  for (const pair of pairs) {
    const matches = data.students.filter(s => !participants.has(s.id) && s.classIds.some(id => pair.exposure.classIds.includes(id))).flatMap(s => {
      const result = ratingsAround(index, pair.exposure, pair.targetId, days, s.id)
      if (!result.before || !result.after || result.before.level !== pair.before.level) return []
      controls.add(s.id); return [result.after.level - result.before.level]
    })
    const controlGain = mean(matches)
    if (controlGain !== null) contrasts.push({ studentId: pair.studentId, participant: pair.delta, comparison: controlGain, gap: pair.delta - controlGain })
  }
  const students = [...group(contrasts, c => c.studentId).values()].map(rows => ({ participant: mean(rows.map(r => r.participant))!, comparison: mean(rows.map(r => r.comparison))!, gap: mean(rows.map(r => r.gap))! }))
  const reportable = students.length >= MIN_IMPACT_STUDENTS && controls.size >= MIN_IMPACT_STUDENTS
  return { exposed: students.length, controls: controls.size, gap: reportable ? mean(students.map(s => s.gap)) : null,
    participantGain: reportable ? mean(students.map(s => s.participant)) : null, comparisonGain: reportable ? mean(students.map(s => s.comparison)) : null }
}
function questionOutcomes(data: AnalyticsDataset, questions: QuestionEvidence[], days: number, index: EvidenceIndex) {
  const repeat: QuestionOutcomePair[] = [], novel: QuestionOutcomePair[] = []
  // One initial question per student/skill in each group prevents prolific submitters dominating a row.
  for (const rows of group(questions.filter(q => percent(q) !== null && q.targetId), q => `${q.studentId}:${q.targetId}`).values()) {
    const before = [...rows].sort((a, b) => Date.parse(a.at) - Date.parse(b.at) || a.id.localeCompare(b.id))[0]
    const at = Date.parse(before.at)
    if (at + days * DAY > Date.parse(data.asOf)) continue
    const later = (index.questions.get(`${before.studentId}:${before.targetId}`) ?? []).filter(q => q.classId === before.classId && Date.parse(q.at) >= at + DAY && Date.parse(q.at) <= at + days * DAY)
    const retry = later.find(q => q.questionKey === before.questionKey)
    const next = later.find(q => q.assessmentId !== before.assessmentId && q.prompt.trim() !== before.prompt.trim() && q.bloom !== null && q.bloom === before.bloom)
    if (retry && percent(retry) !== null) repeat.push({ studentId: before.studentId, before, after: retry, gain: percent(retry)! - percent(before)! })
    if (next && percent(next) !== null) novel.push({ studentId: before.studentId, before, after: next, gain: percent(next)! - percent(before)! })
  }
  const summarize = (rows: QuestionOutcomePair[]) => { const students = [...group(rows, r => r.studentId).values()].map(rows => mean(rows.map(r => r.gain))!); return { students: students.length, gain: mean(students), pairs: rows } }
  return { repeat: summarize(repeat), newQuestion: summarize(novel) }
}
export function assignmentImpact(data: AnalyticsDataset, days: number): ImpactRow[] {
  const index = evidenceIndex(data)
  return [...group(data.assignments, e => e.assignmentId)].map(([id, exposures]) => {
    const result = impactPairs(data, exposures, days, index), stats = summarized(result.pairs)
    const questionIds = new Set(exposures.map(e => e.id))
    return { id, title: exposures[0].title, kind: exposures[0].kind, submitted: new Set(exposures.map(e => e.studentId)).size, ...result, ...stats,
      eligible: stats.pairedStudents >= MIN_IMPACT_STUDENTS, comparison: comparison(data, result.pairs, exposures, days, index),
      ...questionOutcomes(data, data.questions.filter(q => questionIds.has(q.id.split(':')[0])), days, index) }
  }).sort((a, b) => Number(b.eligible) - Number(a.eligible) || (b.gain ?? -3) - (a.gain ?? -3) || b.submitted - a.submitted)
}
export function questionTypeImpact(data: AnalyticsDataset, days: number, grouping: ImpactGrouping): ImpactRow[] {
  const index = evidenceIndex(data)
  const label = (q: QuestionEvidence) => grouping === 'bloom' ? q.bloom ?? 'Bloom’s not tagged' : grouping === 'dok' ? q.dok ? `DOK ${q.dok}` : 'DOK not tagged' : { choice: 'Multiple choice', written: 'Written reasoning', problem: 'Structured problem solving' }[q.kind]
  return [...group(data.questions, label)].map(([title, questions]) => {
    const bySubmission = group(questions, q => q.id.split(':')[0])
    const exposures = [...bySubmission].flatMap(([id, rows]) => {
      const exposure = data.assignments.find(a => a.id === id)
      return exposure ? [{ ...exposure, targetIds: [...new Set(rows.map(q => q.targetId))].filter(id => data.targets.some(t => t.id === id)) }] : []
    })
    const result = impactPairs(data, exposures, days, index), stats = summarized(result.pairs)
    return { id: title, title, kind: grouping, submitted: new Set(questions.map(q => q.studentId)).size, ...result, ...stats, eligible: stats.pairedStudents >= MIN_IMPACT_STUDENTS,
      comparison: { exposed: 0, controls: 0, gap: null, participantGain: null, comparisonGain: null }, ...questionOutcomes(data, questions, days, index) }
  }).sort((a, b) => Number(b.eligible) - Number(a.eligible) || (b.gain ?? -3) - (a.gain ?? -3))
}
export function pearson(points: { x: number; y: number }[]): number | null {
  if (points.length < MIN_IMPACT_STUDENTS) return null
  const x = mean(points.map(p => p.x))!, y = mean(points.map(p => p.y))!
  const xx = points.reduce((n, p) => n + (p.x - x) ** 2, 0), yy = points.reduce((n, p) => n + (p.y - y) ** 2, 0)
  if (!xx || !yy) return null
  return points.reduce((n, p) => n + (p.x - x) * (p.y - y), 0) / Math.sqrt(xx * yy)
}
export function learningCorrelation(data: AnalyticsDataset) {
  const points = studentSummaries(data).flatMap(student => student.delta === null ? [] : [{ studentId: student.id, name: student.name, x: new Set(data.assignments.filter(a => a.studentId === student.id && a.targetIds.length).map(a => a.assignmentId)).size, y: student.delta }])
  return { points, r: pearson(points) }
}
