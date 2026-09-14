import { createHash } from 'node:crypto'
import { findDay, type DayPlan } from './lesson-plan-export'
export interface PlanLesson { id: string; unit_id: string; lesson_number: number | null; published: boolean; content_fingerprint: string; title?:string;estimated_time?:number|null }
export interface PlanLink { lesson_id: string; unit_id: string; plan_day: number; plan_fingerprint: string; content_fingerprint: string; verified_at?: string; verification_kind?: string }
export const lessonPlanRevision=(lesson:PlanLesson)=>createHash('sha256').update(JSON.stringify([lesson.content_fingerprint,lesson.title??null,lesson.estimated_time??null,lesson.unit_id,lesson.lesson_number])).digest('hex')
export const planFingerprint = (plan: DayPlan) => createHash('sha256').update(plan.title + '\n' + plan.bodyHtml).digest('hex')
export function planAlignment(lesson: PlanLesson, links: PlanLink[]) {
  const plan = findDay(lesson.unit_id, lesson.lesson_number ?? -1, ['cpa','trades','projects'])
  if (!plan) return { status: 'missing' as const, message: 'No matching teacher plan.' }
  const link = links.find(l => l.lesson_id === lesson.id)
  if (!link) return { status: 'unreviewed' as const, message: 'Plan linked by unit and day; compare it with the lesson before teaching.' }
  if (link.unit_id !== lesson.unit_id || link.plan_day !== lesson.lesson_number || link.plan_fingerprint !== planFingerprint(plan) || link.content_fingerprint !== lessonPlanRevision(lesson)) return { status: 'changed' as const, message: 'The lesson or plan changed since the last alignment check.' }
  if(link.verification_kind==='baseline')return {status:'baseline' as const,message:'Plan linked to this lesson revision. Compare the preview as you prepare.'}
  return { status: 'aligned' as const, message: 'Plan and lesson alignment checked.', checkedAt: link.verified_at }
}
