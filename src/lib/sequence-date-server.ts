import 'server-only'
import { supabaseAdmin } from './supabase'
import type { SequenceDateContext, SequenceDateMode, SequenceDateSnapshot } from './sequence-date-change'

type Confirmed = { mode: SequenceDateMode; expected: SequenceDateSnapshot }
/** Caller must authorize this class before asking for its private scheduling context. */
export async function prepareSequenceDate(course: string, source: string, due: string | null, confirmation: unknown) {
  if (!due || !/^(interactive|quiz):/.test(source)) return null
  const { data, error } = await supabaseAdmin.rpc('daily_lesson_date_context', { p_course: course, p_source: source, p_due: due })
  if (error) throw error
  const context = data as SequenceDateContext | null
  if (!context) return null
  // Reassigning a withdrawn group still uses its original automatic assignment workflow.
  if (!context.snapshot.foundation.date || !context.snapshot.review.date) {
    if (context.role === 'quiz') throw Error('Assign the discussion and review on the calendar before changing the linked quiz date.')
    return null
  }
  const value = confirmation as Partial<Confirmed> | null
  const confirmed = value && ['single', 'linked'].includes(value.mode ?? '') && value.expected?.source === source && value.expected.requestedDue === due ? value as Confirmed : null
  return { context, confirmed }
}
export function sequenceDateNotice(context: SequenceDateContext) {
  return { error: 'Review the linked dates before confirming this change.', code: 'SEQUENCE_DATE_CONFIRMATION', confirmation: context }
}
export function saveConfirmedSequenceDate(owner: string, course: string, source: string, due: string, confirmation: Confirmed, operation: 'interactive' | 'schedule' | 'assign' | 'quiz', args: Record<string, unknown>, actor: string) {
  return supabaseAdmin.rpc('confirm_daily_lesson_date', { p_owner: owner, p_course: course, p_source: source, p_due: due, p_mode: confirmation.mode, p_expected: confirmation.expected, p_operation: operation, p_arguments: args, p_actor: actor })
}
