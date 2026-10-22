import type {Assignment, Work, Submission, Review} from './server'
import {assignmentBySlug} from './catalog'
import {evidenceStatus, type AiReview} from './analytics'
import {recordedSimulationEvidence} from './simulation-trials'

export type ResultsStudent = {id: string; name: string}
export type ResultRow = {
  studentId: string; name: string; assignmentId: string; slug: string
  status: 'not-started' | 'draft' | 'review' | 'rated'
  analysis: 'none' | AiReview['status']; ratedTargets: number; totalTargets: number
  trials: number | null; responsesToReview: number; pendingResponses: number
  submittedAt: string | null
}
export type QuestionPattern = {id: string; prompt: string; section: string; assessed: number; needsReview: number; pending: number}
export type ActivityResult = {
  assignment: Assignment; title: string; group: string; roster: number
  submitted: number; drafts: number; awaiting: number; rated: number; aiReady: number; aiErrors: number
  noTrials: number; teacherLevels: [number, number, number]; questions: QuestionPattern[]
}
export type SimulationResults = {activities: ActivityResult[]; rows: ResultRow[]}

/** Use only the current submitted version. A draft/revision never inherits old AI or teacher results. */
export function simulationResults({assignments, students, work, submissions, reviews, ai}: {
  assignments: Assignment[]; students: ResultsStudent[]; work: Omit<Work, 'state'>[]; submissions: Submission[]; reviews: Review[]; ai: AiReview[]
}): SimulationResults {
  const rows: ResultRow[] = [], activities: ActivityResult[] = []
  const workByKey = new Map(work.map(w => [w.assignment_id + ':' + w.user_id, w]))
  const subByKey = new Map(submissions.map(s => [s.assignment_id + ':' + s.user_id + ':' + s.version, s]))
  const aiById = new Map(ai.map(a => [a.submission_id, a]))
  for (const assignment of assignments) {
    const lesson = assignmentBySlug(assignment.slug)
    if (!lesson?.simulation) continue
    const questions = lesson.questions.filter(q => !q.reflection).map(q => ({id: q.id, prompt: q.prompt, section: lesson.sections[q.part - 1].title, assessed: 0, needsReview: 0, pending: 0}))
    const activity: ActivityResult = {assignment, title: lesson.title, group: lesson.investigationGroup ?? 'Investigation', roster: students.length, submitted: 0, drafts: 0, awaiting: 0, rated: 0, aiReady: 0, aiErrors: 0, noTrials: 0, teacherLevels: [0, 0, 0], questions}
    for (const student of students) {
      const w = workByKey.get(assignment.id + ':' + student.id)
      const sub = w?.status === 'submitted' ? subByKey.get(assignment.id + ':' + student.id + ':' + w.version) : undefined
      const analysis = sub ? aiById.get(sub.id) : undefined
      const ratings = sub ? [...new Map(reviews.filter(r => r.submission_id === sub.id).map(r => [r.target_id, r])).values()] : []
      const fullyRated = ratings.length >= lesson.targets.length
      const row: ResultRow = {studentId: student.id, name: student.name, assignmentId: assignment.id, slug: lesson.slug, status: sub ? fullyRated ? 'rated' : 'review' : w ? 'draft' : 'not-started', analysis: analysis?.status ?? 'none', ratedTargets: ratings.length, totalTargets: lesson.targets.length, trials: sub ? recordedSimulationEvidence(lesson.simulation, sub.state).length : null, responsesToReview: 0, pendingResponses: 0, submittedAt: sub?.submitted_at ?? null}
      if (sub) {
        activity.submitted++
        if (fullyRated) activity.rated++; else activity.awaiting++
        if (analysis?.status === 'ready') activity.aiReady++
        if (analysis?.status === 'error') activity.aiErrors++
        if (row.trials === 0) activity.noTrials++
        for (const rating of ratings) activity.teacherLevels[rating.level - 1]++
        for (const pattern of questions) {
          const q = lesson.questions.find(q => q.id === pattern.id)!
          const status = evidenceStatus(q, sub.state, analysis)
          if (status === 'pending' || status === 'missing') { pattern.pending++; row.pendingResponses++; continue }
          pattern.assessed++
          if (!['correct', 'complete'].includes(status)) { pattern.needsReview++; row.responsesToReview++ }
        }
      } else if (w) activity.drafts++
      rows.push(row)
    }
    activities.push(activity)
  }
  return {activities, rows}
}
