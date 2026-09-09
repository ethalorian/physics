import type { LiveCommandState } from '@/lib/classroom-command'
export const PULSE_OPTIONS = {
  readiness: ['Need help', 'Almost ready', 'Ready'],
  confidence: ['Not confident yet', 'Somewhat confident', 'Confident'],
} as const
export type PulseKind = keyof typeof PULSE_OPTIONS
export interface Pulse { id: string; kind: PulseKind; anonymous: boolean; status: 'open' | 'closed'; created_at: string; tally?: Record<string, number>; saved?: number }
export interface TeachingMark { id: string; kind: 'bookmark' | 'called' | 'skipped'; student_id: string | null; slide: number; note: string; created_at: string }
export interface TeachingStudent { id: string; name: string }
export interface TeachingNeed extends TeachingStudent { reasons: string[]; requestedAt?: string }
export interface ToolsState {
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
