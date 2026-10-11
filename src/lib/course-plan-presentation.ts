/** A plan presentation is addressed by curriculum day, independently of a lesson. */
export interface PlanTarget { plan_unit_id: string; plan_day: number }
export interface PresentationIdentity { lesson_id?: string | null; plan_unit_id?: string | null; plan_day?: number | null; plan_track?: string | null }
export interface PlanPresentationChoice { id: string; unit_id: string; unit: string; day: number; title: string; deck: {src: string; title: string} | null }
export const planPresentationKey = (unit: string, day: number) => `plan:${unit}:${day}`
export function planTarget(key: string): PlanTarget | null {
  const match = /^plan:([a-z]+(?:-[a-z]+)*-\d+):([1-9]\d*)$/.exec(key)
  return match && Number.isSafeInteger(Number(match[2])) ? {plan_unit_id:match[1],plan_day:Number(match[2])} : null
}
export function presentationKey(identity: PresentationIdentity): string {
  return identity.plan_unit_id && identity.plan_day ? planPresentationKey(identity.plan_unit_id,identity.plan_day) : identity.lesson_id ?? ''
}
export function presentationTarget(key: string): PlanTarget | {lesson_id: string} {
  return planTarget(key) ?? {lesson_id:key}
}
export function presentationQuery(key: string): string {
  return new URLSearchParams(Object.entries(presentationTarget(key)).map(([k,v])=>[k,String(v)])).toString()
}
export function planTeachHref(unit: string, day: number, course = ''): string {
  const p = new URLSearchParams({unit,day:String(day)})
  if(course)p.set('class',course)
  return `/admin/command-center?${p}`
}
