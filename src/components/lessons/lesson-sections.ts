import type { LessonPage, ContentBlock } from '@/data/content-blocks'

/**
 * Section model for the lesson reading screen.
 *
 * A "section" is one paginated page (see `paginateBlocks`). The viewer is
 * page-at-a-time, so sections map cleanly onto pages — clicking a rail dot
 * jumps with the existing `goTo(i)`, no scroll observer needed. These helpers
 * derive a human title and an honest time estimate per section so the rail and
 * the "Section N of M · ~T min left" header have something to show.
 */

export interface LessonSection {
  /** page index */
  index: number
  /** short, human title for the rail */
  title: string
  /** estimated minutes for this section (>= 1 when a lesson time is known) */
  minutes: number
  /** does the section hold save-required work? */
  hasCapture: boolean
}

const MAX_TITLE = 42

function clip(s: string): string {
  const t = s.replace(/\s+/g, ' ').trim()
  return t.length > MAX_TITLE ? t.slice(0, MAX_TITLE - 1).trimEnd() + '…' : t
}

/** Strip the lightest markdown so a heading/sentence reads as plain text. */
function deMarkdown(s: string): string {
  return s
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\$[^$]*\$/g, '') // drop inline math — it never makes a good title
    .replace(/[#>*_~]/g, '')
    .trim()
}

/** First usable line of a prose block: a heading if present, else first sentence. */
function proseTitle(markdown: string): string | null {
  const lines = markdown.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return null
  const heading = lines.find((l) => /^#{1,3}\s+/.test(l))
  if (heading) return deMarkdown(heading.replace(/^#{1,3}\s+/, ''))
  const firstText = deMarkdown(lines[0])
  if (!firstText) return null
  // first sentence-ish
  const sentence = firstText.split(/(?<=[.!?])\s/)[0]
  return sentence || firstText
}

/**
 * A readable title for a section, derived from its leading content. Falls back
 * to a role label ("Get oriented" / "Read & think" / "Your task" / "Wrap up")
 * so every section names itself.
 */
export function deriveSectionTitle(page: LessonPage, index: number, pageCount: number): string {
  const isLast = index === pageCount - 1
  for (const b of page.blocks) {
    const t = blockTitle(b)
    if (t) return clip(t)
  }
  if (page.hasCapture) return 'Your task'
  if (index === 0) return 'Get oriented'
  if (isLast) return 'Wrap up'
  return 'Read & think'
}

function blockTitle(b: ContentBlock): string | null {
  switch (b.type) {
    case 'target':
      return b.statement || null
    case 'prose':
      return proseTitle(b.markdown)
    case 'callout':
      return b.title || null
    case 'procedure':
      return b.title || 'Build steps'
    case 'worked_example':
      return 'Worked example'
    case 'vocab':
      return 'Key terms'
    case 'sim_embed':
      return 'Simulation'
    case 'gewa':
      return 'Solve it'
    case 'exit_ticket':
      return 'Exit ticket'
    case 'reading':
      return 'Tonight\'s reading'
    default:
      return null
  }
}

/**
 * Distribute a lesson's estimated minutes across its sections, weighting
 * save-required sections more heavily (they take longer than reading). Returns
 * a whole-minute estimate per section; 0 for every section when no lesson time
 * is known (the caller then hides the time hint).
 */
export function computeSectionMinutes(pages: LessonPage[], estimatedTime?: number): number[] {
  if (!estimatedTime || estimatedTime <= 0 || pages.length === 0) return pages.map(() => 0)
  const weights = pages.map((p) => {
    let w = 1
    for (const b of p.blocks) {
      if (p.captureBlocks.includes(b)) w += 1.5
      else w += 0.25
    }
    return w
  })
  const total = weights.reduce((s, w) => s + w, 0)
  return weights.map((w) => Math.max(1, Math.round((w / total) * estimatedTime)))
}

export function buildSections(pages: LessonPage[], estimatedTime?: number): LessonSection[] {
  const minutes = computeSectionMinutes(pages, estimatedTime)
  return pages.map((p, i) => ({
    index: i,
    title: deriveSectionTitle(p, i, pages.length),
    minutes: minutes[i],
    hasCapture: p.hasCapture,
  }))
}

/** Minutes remaining from `currentIndex` to the end (inclusive of current). */
export function minutesLeft(sections: LessonSection[], currentIndex: number): number {
  return sections.slice(currentIndex).reduce((s, sec) => s + sec.minutes, 0)
}
