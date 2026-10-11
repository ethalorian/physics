import { supabaseAdmin } from '@/lib/supabase'
import { isSameIdentity } from '@/lib/identity-aliases'
import { PLANS, UNIT_LABEL, trackForCourse } from '@/lib/lesson-plan-export'
import { deckForDay } from '@/data/lesson-decks'
import type { BlockDocument, DeckBlock } from '@/data/content-blocks'
import { planPresentationKey, type PlanPresentationChoice, type PlanTarget } from './course-plan-presentation'

type Actor = {role: string; email: string; scopeEmail?: string}
type Course = {id: string; program: string | null; track: string | null; teacher_email: string}
const unavailable = (error: string, status = 403) => ({ok:false as const,error,status})

export async function presentationCourse(id: string, actor?: Actor) {
  const result = await supabaseAdmin.from('courses').select('id,program,track,teacher_email').eq('id',id).maybeSingle()
  if(result.error)return unavailable('Could not check class access. Please retry.',503)
  const course=result.data as Course | null
  if(!course || (actor && actor.role!=='admin' && !isSameIdentity(actor.scopeEmail??actor.email,course.teacher_email)))return unavailable('This class is not available to your teaching account.')
  return {ok:true as const,course}
}

/** The same authored day list as Course Plans; no lesson query or publication gate. */
export function coursePlanChoices(course: Pick<Course,'program'|'track'>, edition?: string | null): PlanPresentationChoice[] {
  const track=trackForCourse({...course,track:course.track??'cpa'})
  if(!track || track==='projects')return []
  return Object.entries(PLANS[track]??{}).flatMap(([unit,days])=>days.map(day=>({
    id:planPresentationKey(unit,day.day),unit_id:unit,unit:UNIT_LABEL[unit]??unit,day:day.day,title:day.title,
    deck:deckForDay(unit,day.day,edition??course.track??'cpa'),
  })))
}

export async function resolveClassPlan(target: PlanTarget, courseId: string, actor?: Actor, edition?: string | null) {
  if(typeof target.plan_unit_id!=='string'||!Number.isSafeInteger(target.plan_day)||target.plan_day<1)return unavailable('Choose a valid Course Plans day.',400)
  const checked=await presentationCourse(courseId,actor)
  if(!checked.ok)return checked
  const track=edition==='honors'||(!edition&&checked.course.track==='honors')?'honors':'cpa'
  const choice=coursePlanChoices(checked.course,track).find(p=>p.unit_id===target.plan_unit_id&&p.day===target.plan_day)
  if(!choice)return unavailable('This Course Plans day is unavailable for the selected class.',404)
  if(!choice.deck)return unavailable('This Course Plans day does not have a presentation deck yet.',422)
  const deck:DeckBlock={...choice.deck,id:'course-plan-deck',type:'deck',navigation:'manual'}
  const document:BlockDocument={schemaVersion:1,blocks:[]}
  const title=`${choice.unit} · Day ${choice.day} — ${choice.deck.title.replace(/^(?:(?:CPA|Honors|ETF) · )?Day \d+ [—·] /,'')}`
  // Reuse the presentation renderer's document shape; this ID is never a lesson FK.
  const lesson={id:choice.id,title,content_blocks:document,original:document,deck,track}
  return {ok:true as const,lesson,plan:{...target,plan_track:track,title}}
}
