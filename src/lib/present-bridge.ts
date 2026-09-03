/**
 * Presenter bridge — P-2 of docs/LESSON_SYSTEM_RULES.md.
 *
 * The deck runs in a SECOND WINDOW (openPresenterWindow, never an iframe). The
 * deck is served from /public on our own origin, so the opener can reach into it:
 *   - <deck-stage> exposes index / length / goTo / next / prev and fires a
 *     `slidechange` CustomEvent (bubbles + composed) on every nav;
 *   - slides are its direct <section> children carrying data-label and
 *     data-speaker-notes (docs/Deck-Integration-Handoff.md §4);
 *   - it also mirrors position into location.hash (#N, 1-based) — the fallback.
 * The auto-generated deck (/present/[lessonId]) speaks the same surface, so the
 * live layer never knows which kind of deck it is driving (P-1).
 */

export interface DeckSlide { label: string; notes: string }
export interface DeckSnapshot { index: number; total: number; slides: DeckSlide[] }

interface StageLike extends HTMLElement { index: number; length: number; goTo(i: number): void; next(): void; prev(): void }

function stageOf(win: Window | null): StageLike | null {
  try { return (win?.document.querySelector('deck-stage') as StageLike | null) ?? null } catch { return null }
}

/** Read what the deck currently shows. Null while the window is loading or closed. */
export function readDeck(win: Window | null): DeckSnapshot | null {
  if (!win || win.closed) return null
  const stage = stageOf(win)
  if (!stage) return null
  const slides: DeckSlide[] = Array.from(stage.children).map((el) => ({
    label: el.getAttribute('data-label') ?? '',
    notes: el.getAttribute('data-speaker-notes') ?? '',
  }))
  let index = typeof stage.index === 'number' ? stage.index : 0
  if (typeof stage.index !== 'number') {
    const h = (win.location.hash || '').match(/^#(\d+)$/)
    if (h) index = Math.max(0, parseInt(h[1], 10) - 1)
  }
  return { index, total: slides.length, slides }
}

export function deckGo(win: Window | null, i: number) { const s = stageOf(win); if (s) s.goTo(i) }
export function deckNext(win: Window | null) { const s = stageOf(win); if (s) s.next() }
export function deckPrev(win: Window | null) { const s = stageOf(win); if (s) s.prev() }

/** Tell the deck it is on the projector: hides its nav overlay + rail. */
export function deckPresenting(win: Window | null, on: boolean) {
  try { win?.postMessage({ __omelette_presenting: on }, '*') } catch { /* closed */ }
}

const BLACKOUT_ID = 'live-layer-blackout'
/** P-3 · blackout: a full-window black overlay injected into the deck document. */
export function deckBlackout(win: Window | null, on: boolean) {
  try {
    const doc = win?.document
    if (!doc) return
    let el = doc.getElementById(BLACKOUT_ID)
    if (on && !el) {
      el = doc.createElement('div')
      el.id = BLACKOUT_ID
      el.setAttribute('style', 'position:fixed;inset:0;background:#000;z-index:2147483647;cursor:none')
      doc.body.appendChild(el)
    } else if (!on && el) el.remove()
  } catch { /* closed */ }
}

/**
 * Subscribe to slide changes. Uses the `slidechange` event when the stage is
 * ready and falls back to polling (window still loading, or a raw deck).
 */
export function watchDeck(win: Window | null, onChange: (snap: DeckSnapshot) => void): () => void {
  let last = -1
  let stopped = false
  const emit = () => {
    if (stopped) return
    const snap = readDeck(win)
    if (snap && snap.index !== last) { last = snap.index; onChange(snap) }
  }
  const handler = () => emit()
  let bound: Window | null = null
  const tick = () => {
    if (stopped) return
    if (!bound && win && !win.closed && stageOf(win)) {
      try { win.addEventListener('slidechange', handler); bound = win } catch { /* cross-origin never happens here */ }
    }
    emit()
  }
  const id = window.setInterval(tick, 400)
  tick()
  return () => { stopped = true; window.clearInterval(id); try { bound?.removeEventListener('slidechange', handler) } catch { /* closed */ } }
}

/** P-1 · slide → section. slideMap wins; otherwise 1:1 clamped to the section count. */
export function sectionForSlide(slide: number, sectionCount: number, slideMap?: { slide: number; section: number }[]): number {
  if (slideMap?.length) {
    const exact = slideMap.find((m) => m.slide === slide)
    if (exact) return Math.min(exact.section, Math.max(0, sectionCount - 1))
    const before = [...slideMap].filter((m) => m.slide < slide).sort((a, b) => b.slide - a.slide)[0]
    if (before) return Math.min(before.section, Math.max(0, sectionCount - 1))
    return 0
  }
  return Math.max(0, Math.min(sectionCount - 1, slide))
}
