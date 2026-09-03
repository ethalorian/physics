/**
 * Stepped-reader logic (S-*, B-3) — pure helpers so the viewer stays readable
 * and the rules are testable. See docs/LESSON_SYSTEM_RULES.md.
 */
import { isBlockComplete, isCaptureBlock, type ContentBlock, type LessonPage } from '@/data/content-blocks'
import type { BlockResponseMap } from '@/components/blocks/useBlockResponses'

/** B-3 · a gate block is satisfied when complete and, if auto-checked, correct. */
export function gateSatisfied(b: ContentBlock, responses: BlockResponseMap): boolean {
  const r = responses[b.id]?.response
  if (!isBlockComplete(b, r)) return false
  const auto = (r as { autoCheck?: string } | undefined)?.autoCheck
  return auto !== 'mismatch'
}

/** The gate blocks on a page (capture blocks flagged gate: true). */
export function pageGates(page: LessonPage): ContentBlock[] {
  return page.blocks.filter((b) => b.gate === true && isCaptureBlock(b))
}

/** The first unsatisfied gate on a page, or null. */
export function pageBlockedBy(page: LessonPage, responses: BlockResponseMap): ContentBlock | null {
  return pageGates(page).find((b) => !gateSatisfied(b, responses)) ?? null
}

/** S-2 · sections after the first page with an unsatisfied gate are locked. */
export function firstLockedIndex(pages: LessonPage[], responses: BlockResponseMap, gating: boolean): number {
  if (!gating) return pages.length
  for (let i = 0; i < pages.length; i++) if (pageBlockedBy(pages[i], responses)) return i + 1
  return pages.length
}

/** S-5 · the gate note names the missing thing. */
export function gateNote(blocked: ContentBlock | null): string | null {
  if (!blocked) return null
  const label: Partial<Record<ContentBlock['type'], string>> = {
    question: 'Answer the checkpoint correctly to continue',
    exit_ticket: 'Save your exit ticket to continue',
    gewa: 'Finish the GEWA solve to continue',
    sketch: 'Save your sketch to continue',
    observation: 'Save your observation to continue',
    data_table: 'Enter your data to continue',
    marzano: 'Rate yourself to continue',
    sentence_frame: 'Complete the frame to continue',
    concept_exercise: 'Submit the practice to continue',
  }
  return label[blocked.type] ?? 'Finish the task on this section to continue'
}

/** S-4 · help / mini-lesson block types that render in a drawer. */
export const HELP_TYPES: ReadonlySet<string> = new Set(['worked_example', 'callout', 'procedure'])

/** Split a page into runs: consecutive help blocks become one drawer. */
export function splitHelpRuns(blocks: ContentBlock[]): { help: boolean; blocks: ContentBlock[] }[] {
  const runs: { help: boolean; blocks: ContentBlock[] }[] = []
  for (const b of blocks) {
    const help = HELP_TYPES.has(b.type)
    const last = runs[runs.length - 1]
    if (last && last.help === help) last.blocks.push(b)
    else runs.push({ help, blocks: [b] })
  }
  return runs
}

/** The section's target: the first capture block's targetId. */
export function sectionTarget(page: LessonPage): string | null {
  return page.captureBlocks.find((b) => b.targetId)?.targetId ?? page.blocks.find((b) => b.targetId)?.targetId ?? null
}

/** S-6 · Done-screen tallies. */
export function doneTallies(blocks: ContentBlock[], responses: BlockResponseMap) {
  const capture = blocks.filter(isCaptureBlock)
  const autoCheckable = capture.filter((b) => b.type === 'question' && Boolean((b as { question?: { correctOptionId?: string } }).question?.correctOptionId))
  const autoRight = autoCheckable.filter((b) => (responses[b.id]?.response as { autoCheck?: string } | undefined)?.autoCheck === 'match').length
  const awaiting = capture.filter((b) => !autoCheckable.includes(b) && isBlockComplete(b, responses[b.id]?.response)).length
  const xpPending = capture.filter((b) => typeof b.xp === 'number' && b.xp > 0 && !isBlockComplete(b, responses[b.id]?.response)).reduce((a, b) => a + (b.xp ?? 0), 0)
  return { autoChecked: autoCheckable.length, autoRight, awaiting, xpPending }
}

/** MC-3 · coaching copy for the calibration read-back. Never judgment. */
export function calibrationCopy(delta: number | null): string | null {
  if (delta === null) return null
  if (delta === 0) return 'Your self-rating matched your teacher’s. That is calibration — keep checking yourself the same way.'
  if (delta > 0) return 'You rated yourself higher than your teacher did. One concrete check: could you explain the step that tripped your group to someone who missed class? If not yet, that is the gap.'
  return 'You rated yourself lower than your teacher did. Look at what you actually produced — the evidence says more than your gut did. Re-rate if you agree.'
}
