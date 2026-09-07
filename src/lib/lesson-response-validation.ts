import type { ContentBlock } from '@/data/content-blocks'

/** E-3: only the server can attach correctness; client-provided feedback is discarded. */
export function checkedLessonResponse(block: ContentBlock, incoming: unknown): { ok: true; response: unknown } | { ok: false; error: string } {
  if (JSON.stringify(incoming)?.length > 200_000) return { ok: false, error: 'This response is too large.' }
  if (block.type !== 'question' || !incoming || typeof incoming !== 'object' || Array.isArray(incoming)) return { ok: true, response: incoming }
  const { autoCheck: ignored, ...response } = incoming as Record<string, unknown>
  void ignored
  const question = block.question as { options?: { id: string }[]; correctOptionId?: string } | undefined
  const picked = response.optionId
  if (picked != null && picked !== '' && (typeof picked !== 'string' || !question?.options?.some((option) => option.id === picked))) return { ok: false, error: 'Choose one of the authored options.' }
  if (question?.correctOptionId && picked) return { ok: true, response: { ...response, autoCheck: picked === question.correctOptionId ? 'match' : 'mismatch' } }
  return { ok: true, response }
}
