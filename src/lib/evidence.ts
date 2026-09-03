/**
 * Evidence vocabulary — E-2 of docs/LESSON_SYSTEM_RULES.md.
 * The ONE place the closed set of `block_responses.evidence_source` values lives.
 * Never free text; add here (and in the DB check) or not at all.
 */
export const EVIDENCE_SOURCES = ['lesson_checkpoint', 'exit_ticket', 'lobby', 'live_poll', 'warmup', 'practice', 'transfer'] as const
export type EvidenceSource = (typeof EVIDENCE_SOURCES)[number]

export function isEvidenceSource(v: unknown): v is EvidenceSource {
  return typeof v === 'string' && (EVIDENCE_SOURCES as readonly string[]).includes(v)
}

/** Default evidence source for a block type saved from the student reader. */
export function evidenceSourceFor(blockType: string): EvidenceSource {
  if (blockType === 'exit_ticket') return 'exit_ticket'
  if (blockType === 'transfer_prompt') return 'transfer'
  if (blockType === 'concept_exercise') return 'practice'
  return 'lesson_checkpoint'
}

/** Human label for the Control Room filter (M-3). */
export const EVIDENCE_LABEL: Record<EvidenceSource, string> = {
  lesson_checkpoint: 'Checkpoint',
  exit_ticket: 'Exit ticket',
  lobby: 'Lobby',
  live_poll: 'Live poll',
  warmup: 'Warm-up',
  practice: 'Practice',
  transfer: 'Transfer',
}

export type Confidence = 'sure' | 'unsure'
export function isConfidence(v: unknown): v is Confidence { return v === 'sure' || v === 'unsure' }
