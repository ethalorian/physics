import type { LiveCommandState } from '@/lib/classroom-command'
import type { DeckActivity } from '@/lib/deck-activities'
export const PULSE_OPTIONS = {
  readiness: ['Need help', 'Almost ready', 'Ready'],
  confidence: ['Not confident yet', 'Somewhat confident', 'Confident'],
} as const
export type PulseKind = keyof typeof PULSE_OPTIONS | 'custom' | 'warmup' | 'exit_ticket' | 'solo'
export interface Pulse { target_id?:string|null; prompt?:string|null; options?:string[]|null; required?:boolean; locked?:boolean; revealed?:boolean; id: string; kind: PulseKind; anonymous: boolean; status: 'open' | 'closed'; created_at: string; tally?: Record<string, number>; saved?: number }
export interface TeachingMark { id: string; kind: 'bookmark' | 'called' | 'skipped'; student_id: string | null; slide: number; note: string; created_at: string }
export interface TeachingStudent { id: string; name: string }
export interface TeachingNeed extends TeachingStudent { reasons: string[]; requestedAt?: string }
export interface ToolsState {
  deckActivities?: DeckActivity[]
  targets?: {id:string;statement:string}[]
  unitId?:string|null
  pulse: Pulse | null
  tools: { sei_enabled?: boolean; reconnect_token: string | null; discussion_block_id: string | null; discussion_poll_run_id: string | null; updated_at: string } | null
  projector: { signature: string; seen_at: string; slide: number; ready: boolean } | null
  roster: TeachingStudent[]
  needs: TeachingNeed[]
  marks: TeachingMark[]
  targetId?: string | null
}
export function projectorSignature(state: LiveCommandState, tools: ToolsState): string {
  return JSON.stringify([state.session.updated_at, tools.tools?.updated_at ?? null, tools.pulse?.id ?? null, tools.pulse?.status ?? null, state.lobby?.id ?? null, state.lobby?.status ?? null])
}
export function projectorStatus(state: LiveCommandState, tools: ToolsState, now: number): string {
  const ack = tools.projector
  if (!ack || !ack.ready) return 'Projector not connected'
  if (now - new Date(ack.seen_at).getTime() > 10000) return 'Projector connection lost'
  return ack.signature === projectorSignature(state, tools) && ack.slide === state.session.current_slide ? 'Projector confirmed' : 'Waiting for projector'
}
export function uncalledStudents(roster: TeachingStudent[], marks: TeachingMark[], skipped: string[] = []): TeachingStudent[] {
  const used = new Set([...marks.filter(m => m.kind === 'called').map(m => m.student_id), ...skipped])
  return roster.filter(s => !used.has(s.id))
}

export const pulseOptions=(pulse:Pulse):readonly string[]=>pulse.kind==='custom'?pulse.options??[]:isTicket(pulse)?[]:PULSE_OPTIONS[pulse.kind as keyof typeof PULSE_OPTIONS]
export const pulsePrompt=(pulse:Pulse):string=>(pulse.kind==='custom'||isTicket(pulse))?pulse.prompt??'Answer the question on the classroom screen.':pulse.kind==='readiness'?'How ready are you to move on?':'How confident do you feel?'
export function validPulseDraft(value:Record<string,unknown>):boolean {
 if(!['readiness','confidence','custom','warmup','exit_ticket','solo'].includes(String(value.kind))||typeof value.anonymous!=='boolean'||value.required!==undefined&&typeof value.required!=='boolean')return false
 if(value.kind==='warmup'||value.kind==='exit_ticket'||value.kind==='solo')return value.anonymous===false&&typeof value.target_id==='string'&&/^[0-9a-f-]{36}$/i.test(value.target_id)&&typeof value.prompt==='string'&&value.prompt.trim().length>0&&value.prompt.trim().length<=1000
 if(value.kind!=='custom')return true
 return typeof value.prompt==='string'&&value.prompt.trim().length>0&&value.prompt.trim().length<=1000&&Array.isArray(value.options)&&value.options.length>=2&&value.options.length<=6&&value.options.every(o=>typeof o==='string'&&o.trim().length>0&&o.trim().length<=200)&&new Set(value.options.map(o=>String(o).trim().toLowerCase())).size===value.options.length
}

export const isTicket=(pulse:Pick<Pulse,'kind'>)=>pulse.kind==='warmup'||pulse.kind==='exit_ticket'||pulse.kind==='solo'
