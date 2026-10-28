export type SequenceRole = 'foundation' | 'review' | 'quiz'
export type SequenceDateMode = 'single' | 'linked'
export type SequenceDateSnapshot = {
  course: string; source: string; requestedDue: string; sequenceKey: string;
  foundation: { id: string; slug: string; date: string | null };
  review: { id: string; slug: string; date: string | null };
  quiz: { id: string; date: string | null; version: number; status: string; deletedAt: string | null };
}
export type SequenceDateContext = { role: SequenceRole; snapshot: SequenceDateSnapshot; normalDates: Record<SequenceRole, string> }
export const sequenceRoleLabels: Record<SequenceRole, string> = { foundation: 'In-class discussion / foundation', review: 'Daily review', quiz: 'Lesson quiz' }
export class DateChangeCancelled extends Error { constructor() { super('Date change canceled. Nothing was changed.'); this.name = 'DateChangeCancelled' } }
export function proposedSequenceDates(context: SequenceDateContext, mode: SequenceDateMode): Record<SequenceRole, string | null> {
  if (mode === 'linked') return context.normalDates
  return { foundation: context.snapshot.foundation.date, review: context.snapshot.review.date, quiz: context.snapshot.quiz.date, [context.role]: context.snapshot.requestedDue }
}
export async function confirmedDateRequest<T>(url: string, body: unknown, confirm: (context: SequenceDateContext) => Promise<SequenceDateMode | null>, method = 'POST', fetcher: typeof fetch = fetch): Promise<T> {
  const send = async (payload: unknown) => {
    const response = await fetcher(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(30000) })
    const result = await response.json().catch(() => ({error:'Could not confirm the date. Reload and try again.'}))
    return { response, result }
  }
  let { response, result } = await send(body)
  if (response.status === 409 && result.code === 'SEQUENCE_DATE_CONFIRMATION' && result.confirmation?.snapshot) {
    const mode = await confirm(result.confirmation)
    if (!mode) throw new DateChangeCancelled()
    const retry = await send({ ...(body as Record<string, unknown>), sequenceConfirmation: { mode, expected: result.confirmation.snapshot } })
    response = retry.response; result = retry.result
  }
  if (!response.ok) throw Error(result.error || 'The date change could not be saved. Please reload and try again.')
  return result as T
}
