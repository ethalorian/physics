/**
 * SEI level logic — pure, testable, shared by the renderer, the publish lint
 * and the Control Room.
 *
 * The rule the whole layer rests on (claude/Project-Physics-SEI-Access-Layer.md):
 * the PHYSICS prompt and the rubric are identical at every level — only the
 * language load changes. Scaffolds render by WIDA level and fade as the
 * student grows; the student can always turn a scaffold back ON, never be
 * forced off; the teacher can override per block. Mastery records never see
 * any of this.
 */
import type { ContentBlock, LangCode, ResponseMode, SeiFrame, SeiScaffold } from '@/data/content-blocks'

export type ScaffoldLevel = 'full' | 'partial' | 'bare'
export type WidaLevel = 1 | 2 | 3 | 4 | 5 | 6

export interface LanguageProfile {
  userId: string
  /** WIDA composite 1–6. null = no profile → treated as bare (English-dominant default). */
  wida: WidaLevel | null
  homeLang: LangCode | null
  /** Show the L1 rendering by default (student may toggle). */
  l1Default: boolean
}

/** WIDA 1–2 → full · 3–4 → partial · 5–6 or no profile → bare. */
export function levelForWida(wida: WidaLevel | null | undefined): ScaffoldLevel {
  if (!wida) return 'bare'
  if (wida <= 2) return 'full'
  if (wida <= 4) return 'partial'
  return 'bare'
}

/** The effective level for one block: teacher override wins, then the profile,
 *  then the student's own dial (which can only ADD support, never remove the
 *  teacher's floor). */
export function effectiveLevel(sei: SeiScaffold | undefined, profile: LanguageProfile | null, studentDial: ScaffoldLevel | null): ScaffoldLevel {
  const fromProfile = levelForWida(profile?.wida)
  const base = sei?.override ?? fromProfile
  if (!studentDial) return base
  // more support wins
  return RANK[studentDial] > RANK[base] ? studentDial : base
}
const RANK: Record<ScaffoldLevel, number> = { bare: 0, partial: 1, full: 2 }

/** Which frame tier a level shows by default. bare = none (available on request). */
export function frameTierFor(level: ScaffoldLevel): 1 | 2 | null {
  return level === 'full' ? 1 : level === 'partial' ? 2 : null
}

/** Pick the frame to show: exact tier, else the nearest lower-support tier. */
export function pickFrame(frames: SeiFrame[] | undefined, tier: 1 | 2 | 3): SeiFrame | null {
  if (!frames || frames.length === 0) return null
  const exact = frames.find((f) => f.level === tier)
  if (exact) return exact
  const sorted = [...frames].sort((a, b) => a.level - b.level)
  return sorted.find((f) => f.level > tier) ?? sorted[sorted.length - 1] ?? null
}

/** Default response modes: text always; the block's extra modes are offered at full/partial. */
export function modesFor(sei: SeiScaffold | undefined, level: ScaffoldLevel, fallback: ResponseMode[] = ['text']): ResponseMode[] {
  const extra = sei?.modes ?? []
  if (level === 'bare') return fallback
  return [...new Set([...fallback, ...extra])]
}

/** The L1 rendering to show, if any. */
export function pickL1(map: Partial<Record<LangCode, string>> | undefined, lang: LangCode | null | undefined): string | null {
  if (!map || !lang) return null
  return map[lang] ?? null
}

/** Names of the scaffolds that are ON for a render — logged with the response
 *  (block_responses.scaffolds_used) so the Control Room reads the work in context
 *  and the Observatory can disaggregate. */
export function scaffoldsOn(opts: { level: ScaffoldLevel; l1: boolean; frame: SeiFrame | null; wordBank: boolean; visual: boolean; talkFirst: boolean; mode: ResponseMode }): string[] {
  const out: string[] = [`level:${opts.level}`, `mode:${opts.mode}`]
  if (opts.l1) out.push('l1')
  if (opts.frame) out.push(`frame:${opts.frame.level}`)
  if (opts.wordBank) out.push('word_bank')
  if (opts.visual) out.push('visual')
  if (opts.talkFirst) out.push('talk_first')
  return out
}

// ---------------------------------------------------------------------------
// Publish lint — "the builder won't publish a capture block that has no visual,
// no frame, or Tier 3 terms not in the lesson vocab set." Hard for program
// `projects`; warnings for everything else (the asteroid course predates the rule).
// ---------------------------------------------------------------------------

const CAPTURE_TEXT: ReadonlySet<string> = new Set(['question', 'exit_ticket', 'observation', 'sentence_frame'])
const VISUAL_TYPES: ReadonlySet<string> = new Set(['figure', 'diagram', 'graph', 'sim_embed', 'animation_3d', 'sketch', 'lab_notebook'])

export interface SeiLintIssue { blockId: string; blockType: string; rule: 'visual' | 'frame' | 'vocab'; message: string }

/** Lint a block list. `vocabTerms` = the lesson's vocabulary set (lowercased). */
export function seiLint(blocks: ContentBlock[], vocabTerms: string[] = []): SeiLintIssue[] {
  const issues: SeiLintIssue[] = []
  const vocab = new Set(vocabTerms.map((t) => t.toLowerCase()))
  blocks.forEach((b, i) => {
    if (!CAPTURE_TEXT.has(b.type)) return
    if (b.type === 'sentence_frame' && !(b as { capture?: boolean }).capture) return
    const sei = b.sei
    const prev = blocks[i - 1]
    const hasVisual = Boolean(sei?.visual) || Boolean(prev && VISUAL_TYPES.has(prev.type))
    if (!hasVisual) issues.push({ blockId: b.id, blockType: b.type, rule: 'visual', message: 'No visual carries the meaning: add sei.visual or put a figure/diagram/sim/graph block right before it.' })
    const ownFrame = (b as { frame?: string; patternFrame?: string }).frame || (b as { patternFrame?: string }).patternFrame
    const hasFrame = Boolean(sei?.frames?.length) || Boolean(ownFrame) || (b.type === 'question' && Boolean((b as { question?: { options?: unknown[] } }).question?.options?.length))
    if (!hasFrame) issues.push({ blockId: b.id, blockType: b.type, rule: 'frame', message: 'No frame for output: add sei.frames (tier 1 forced-choice at least) or a frame on the block.' })
    if (vocab.size > 0 && sei?.tier2Terms) {
      for (const t of sei.tier2Terms) if (!vocab.has(t.toLowerCase())) issues.push({ blockId: b.id, blockType: b.type, rule: 'vocab', message: `"${t}" is not in this lesson's vocabulary set — add it so the glossary and the wall agree.` })
    }
  })
  return issues
}
