import { type BlockDocument, type DeckBlock, type ContentBlock, type InlineQuestion } from '@/data/content-blocks'
import { buildSlides } from '@/lib/present-auto-slides'
import { resolveDeckSrc } from '@/data/lesson-decks'

export interface CommandSession {
  id: string; lesson_id: string; course_id: string; status: 'live' | 'ended'; current_slide: number
  current_section: number; current_anchor: string | null; poll_block_id: string | null
  projected_block_id?: string | null; projected_block_page?: number
  poll_run_id: string | null; poll_locked: boolean; poll_revealed: boolean; blackout: boolean
  timer_ends_at: string | null; updated_at: string
}
export interface LiveCommandState {
  session: CommandSession
  lobby: { id: string; code: string; status: string } | null
  saved: number; enrolled: number; tally: Record<string, number>
}
export interface CommandLesson { id: string; title: string; content_blocks: BlockDocument }
export interface PresentationData { session: CommandSession | null; lesson: CommandLesson | null; deck: DeckBlock | null; answerKeys?: Record<string, string> }
export interface CommandSlide { label: string; notes: string; anchor: string | null }

export async function commandRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const cancel = () => controller.abort()
  if (options?.signal?.aborted) cancel()
  options?.signal?.addEventListener('abort', cancel, { once: true })
  const timeout = setTimeout(cancel, 12000)
  try {
    const response = await fetch(url, { cache: 'no-store', ...options, signal: controller.signal })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error ?? `Request failed (${response.status})`)
    return data as T
  } finally {
    clearTimeout(timeout)
    options?.signal?.removeEventListener('abort', cancel)
  }
}

/** Same slide sequence as the projector renderer, including continuation slides. */
export function autoCommandSlides(doc: BlockDocument): CommandSlide[] {
  return buildSlides('', doc).map(({ label, notes, anchor }) => ({ label, notes, anchor }))
}

export async function commandSlides(lesson: CommandLesson, deck: DeckBlock | null, signal?: AbortSignal): Promise<CommandSlide[]> {
  if (!deck) return autoCommandSlides(lesson.content_blocks)
  const url = new URL(resolveDeckSrc(deck.src), window.location.origin)
  if (url.origin !== window.location.origin) throw new Error('Remote slide control requires a deck hosted on this site.')
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error('Could not read slide titles. Retry loading the presentation.')
  const slides = deckSlidesFromHtml(await response.text())
  if (!slides.length) throw new Error('This deck does not expose slide controls.')
  return slides
}

/** Read exported deck metadata without executing its bundled scripts. */
export function deckSlidesFromHtml(html: string): CommandSlide[] {
  let doc = new DOMParser().parseFromString(html, 'text/html')
  const template = doc.querySelector('script[type="__bundler/template"]')
  if (template) {
    const source: unknown = JSON.parse(template.textContent ?? '')
    if (typeof source !== 'string') throw new Error('The exported deck template is invalid.')
    doc = new DOMParser().parseFromString(source, 'text/html')
  }
  const stage = doc.querySelector('deck-stage, x-import[component-from-global-scope="deck-stage"]')
  return [...(stage?.children ?? [])].filter(el => el.tagName === 'SECTION').map((slide, i) => ({
    label: slide.getAttribute('data-label') || `Slide ${i + 1}`,
    notes: slide.getAttribute('data-speaker-notes') || '',
    anchor: slide.getAttribute('data-section-anchor'),
  }))
}

export function commandQuestion(block: ContentBlock | undefined): InlineQuestion | null {
  return block?.type === 'question' ? block.question as InlineQuestion : null
}
