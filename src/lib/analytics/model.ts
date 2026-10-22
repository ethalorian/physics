import { BLOOMS } from '@/lib/assessment-demand'
import { decayingAverage } from '@/data/curriculum-types'
import type { AnalyticsDataset, AnalyticsFilter, QuestionEvidence, SkillGrowth, StudentFocus } from './types'

export const mean = (values: number[]): number | null => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
export const percent = (q: QuestionEvidence) => q.score === null || q.possible <= 0 ? null : q.score / q.possible * 100
function groups<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const result = new Map<string, T[]>()
  for (const row of rows) { const k = key(row); const list = result.get(k) ?? []; list.push(row); result.set(k, list) }
  return result
}
export function scopeAnalytics(data: AnalyticsDataset, filter: AnalyticsFilter) {
  const classes = data.classes.filter(c => (!filter.classId || c.id === filter.classId) && (!filter.teacher || c.teacher === filter.teacher))
  const classIds = new Set(classes.map(c => c.id))
  const students = data.students.filter(s => s.classIds.some(id => classIds.has(id)) && (!filter.studentId || s.id === filter.studentId))
  const targets = data.targets.filter(t => (!filter.unitId || t.unitId === filter.unitId) && (!filter.targetId || t.id === filter.targetId))
  const studentIds = new Set(students.map(s => s.id)), targetIds = new Set(targets.map(t => t.id))
  const targetMatches = (id: string | null) => !filter.unitId && !filter.targetId || !!id && targetIds.has(id)
  return { ...data, classes, students, targets,
    ratings: data.ratings.filter(r => studentIds.has(r.studentId) && targetIds.has(r.targetId)),
    questions: data.questions.filter(q => studentIds.has(q.studentId) && classIds.has(q.classId) && targetMatches(q.targetId) && (!filter.bloom || q.bloom === filter.bloom)),
    practice: data.practice.filter(p => studentIds.has(p.studentId) && classIds.has(p.classId) && (!filter.unitId && !filter.targetId || p.targetIds.some(id => targetIds.has(id)))),
    feedback: data.feedback.filter(f => studentIds.has(f.studentId) && targetMatches(f.targetId)),
    // App activity has no reliable skill/class attribution; retain the selected current roster only.
    activity: data.activity.filter(a => studentIds.has(a.studentId)),
    assignments: data.assignments.filter(a => studentIds.has(a.studentId) && a.classIds.some(id => classIds.has(id)) && (!filter.unitId && !filter.targetId || a.targetIds.some(id => targetIds.has(id)))).map(a => ({ ...a, classIds: a.classIds.filter(id => classIds.has(id)), targetIds: a.targetIds.filter(id => targetIds.has(id)) })),
  }
}
export function skillGrowth(data: AnalyticsDataset): SkillGrowth[] {
  return [...groups(data.ratings, r => `${r.studentId}:${r.targetId}`).values()].map(rows => {
    const ordered = [...rows].sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id))
    const recent = ordered.filter(r => r.at >= data.from && r.at <= data.asOf), first = recent[0], latest = recent.at(-1)
    const paired = !!first && !!latest && latest.at > first.at
    return { studentId: rows[0].studentId, targetId: rows[0].targetId, current: decayingAverage(ordered.map(r => r.level)),
      first: first?.level ?? null, latest: latest?.level ?? null, delta: paired ? latest.level - first.level : null,
      observations: recent.length, lastAt: ordered.at(-1)?.at ?? null, persistent: paired && first.level < 2.45 && latest.level < 2.45 }
  })
}
export function studentSummaries(data: AnalyticsDataset) {
  const byStudent = groups(skillGrowth(data), r => r.studentId)
  return data.students.map(student => {
    const skills = byStudent.get(student.id) ?? [], paired = skills.filter(s => s.delta !== null)
    const current = mean(skills.flatMap(s => s.current === null ? [] : [s.current]))
    const delta = mean(paired.map(s => s.delta!)), persistent = skills.filter(s => s.persistent).length
    const low = skills.filter(s => s.current !== null && s.current < 2.45).length
    const recent = skills.reduce((n, s) => n + s.observations, 0)
    return { ...student, skills, current, delta, paired: paired.length, persistent, low, recent,
      improving: delta !== null && delta > 0, attention: persistent > 0, missing: recent === 0 }
  })
}
export function focusStudents(data: AnalyticsDataset, focus: StudentFocus) {
  return studentSummaries(data).filter(s => focus === 'all' || s[focus]).sort((a, b) => b.persistent - a.persistent || b.low - a.low || a.name.localeCompare(b.name))
}
export function targetSummaries(data: AnalyticsDataset) {
  const byTarget = groups(skillGrowth(data), r => r.targetId)
  return data.targets.map(target => {
    const skills = byTarget.get(target.id) ?? []
    return { ...target, rated: skills.length, current: mean(skills.flatMap(s => s.current === null ? [] : [s.current])),
      delta: mean(skills.flatMap(s => s.delta === null ? [] : [s.delta])), paired: skills.filter(s => s.delta !== null).length,
      low: skills.filter(s => s.current !== null && s.current < 2.45).length, persistent: skills.filter(s => s.persistent).length,
      missing: data.students.length - skills.length }
  }).sort((a, b) => b.persistent - a.persistent || b.low - a.low || b.rated - a.rated || a.slug.localeCompare(b.slug))
}
/** Equal weight per student-question, with first/latest always from the same immutable question. */
export function questionSummary(rows: QuestionEvidence[]) {
  const pairs = [...groups(rows.filter(q => percent(q) !== null), q => JSON.stringify([q.studentId, q.questionKey])).values()].map(attempts => {
    const sorted = [...attempts].sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id))
    return { first: sorted[0], latest: sorted.at(-1)! }
  })
  const repeated = pairs.filter(p => p.latest.at > p.first.at)
  const first = mean(repeated.map(p => percent(p.first)!)), latest = mean(repeated.map(p => percent(p.latest)!))
  return { score: mean(pairs.map(p => percent(p.latest)!)), first, latest, delta: first === null || latest === null ? null : latest - first,
    pairs: repeated.length, improved: repeated.filter(p => percent(p.latest)! > percent(p.first)!).length,
    students: new Set(pairs.map(p => p.latest.studentId)).size, scored: pairs.length, submissions: rows.length, unscored: rows.filter(q => q.score === null).length }
}
export function questionSummaries(data: AnalyticsDataset) {
  return [...groups(data.questions, q => q.questionKey).entries()].map(([key, rows]) => ({ key, question: rows[0], ...questionSummary(rows) }))
    .sort((a, b) => (a.score ?? 101) - (b.score ?? 101) || a.question.prompt.localeCompare(b.question.prompt))
}
export function bloomSummaries(data: AnalyticsDataset) {
  return BLOOMS.map(bloom => ({ bloom, ...questionSummary(data.questions.filter(q => q.bloom === bloom)) }))
}
export function weeklyScores(data: AnalyticsDataset) {
  const weeks = new Map<string, QuestionEvidence[]>()
  for (let ms = Date.parse(data.from); ms <= Date.parse(data.asOf); ms += 7 * 86400000) weeks.set(new Date(ms).toISOString().slice(0, 10), [])
  for (const question of data.questions) {
    const index = Math.floor((Date.parse(question.at) - Date.parse(data.from)) / (7 * 86400000))
    const key = new Date(Date.parse(data.from) + index * 7 * 86400000).toISOString().slice(0, 10)
    weeks.get(key)?.push(question)
  }
  return [...weeks].map(([week, rows]) => ({ week, ...questionSummary(rows) }))
}
export function feedbackFollowUps(data: AnalyticsDataset) {
  const result: { before: QuestionEvidence; after: QuestionEvidence | null; nextQuestion: QuestionEvidence | null; delta: number | null }[] = []
  for (const rows of groups(data.questions, q => JSON.stringify([q.studentId, q.questionKey])).values()) {
    const sorted = [...rows].sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id))
    for (const before of sorted.filter(q => q.feedback.trim() && q.reviewedAt)) {
      // An attempt submitted before the feedback was released is never counted as a response to it.
      const after = sorted.find(q => q.at > before.reviewedAt! && q.id !== before.id) ?? null
      const nextQuestion = data.questions.filter(q => q.studentId === before.studentId && q.classId === before.classId && q.targetId === before.targetId && q.bloom === before.bloom && q.bloom !== null && q.at > before.reviewedAt! && (q.assessmentId !== before.assessmentId || q.questionId !== before.questionId)).sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id))[0] ?? null
      const initial = percent(before), next = after ? percent(after) : null
      result.push({ before, after, nextQuestion, delta: initial === null || next === null ? null : next - initial })
    }
  }
  return result.sort((a, b) => b.before.reviewedAt!.localeCompare(a.before.reviewedAt!))
}
export function engagementSummary(data: AnalyticsDataset) {
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', hourCycle: 'h23' })
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const cells = days.flatMap(day => Array.from({ length: 24 }, (_, hour) => ({ day, hour, events: 0, students: new Set<string>() })))
  for (const event of data.activity) {
    const parts = formatter.formatToParts(new Date(event.at)), day = parts.find(p => p.type === 'weekday')?.value, hour = Number(parts.find(p => p.type === 'hour')?.value)
    const cell = cells.find(c => c.day === day && c.hour === hour)
    if (cell) { cell.events++; cell.students.add(event.studentId) }
  }
  return { active: new Set(data.activity.map(a => a.studentId)).size,
    cells: cells.map(c => ({ ...c, students: c.students.size })),
    sources: [...groups(data.activity, a => a.source)].map(([name, rows]) => ({ name: name.replaceAll('_', ' '), count: rows.length })).sort((a, b) => b.count - a.count),
    devices: [...groups(data.activity, a => a.device)].map(([name, rows]) => ({ name, count: rows.length })),
    teachers: [...new Set(data.classes.map(c => c.teacher).filter((t): t is string => !!t))].map(teacher => ({ teacher,
      ratings: data.ratings.filter(r => r.teacher?.toLowerCase() === teacher.toLowerCase() && r.at >= data.from).length,
      feedback: data.feedback.filter(f => f.teacher?.toLowerCase() === teacher.toLowerCase()).length,
    })),
  }
}
