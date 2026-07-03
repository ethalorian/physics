/**
 * Presenter-window launcher for lesson slide decks (self-contained HTML
 * bundles under /public/decks/ — see docs/Deck-Integration-Handoff.md §3).
 *
 * Launch pattern: a SECOND WINDOW, never an iframe, so the deck can live on
 * the projector while the teacher's dashboard stays on the laptop.
 *   - Chrome/Edge: the Window Management API (getScreenDetails, one-time
 *     permission) opens the deck on the external display, ALREADY fullscreen
 *     (Chrome's fullscreen-popup feature) — no keyboard step at all.
 *   - Firefox/Safari, single screen, or permission denied: plain window.open —
 *     the teacher drags to the projector and uses browser fullscreen.
 * The returned handle enables the (future) postMessage speaker-notes panel.
 */

interface ScreenDetailed {
  isPrimary: boolean
  availLeft: number
  availTop: number
  availWidth: number
  availHeight: number
}
interface ScreenDetails { screens: ScreenDetailed[] }
type WindowWithScreens = Window & { getScreenDetails?: () => Promise<ScreenDetails> }

/** Platform-aware browser-fullscreen hint: F11 is Windows/Linux; macOS is ⌃⌘F. */
export function fullscreenKeyHint(): string {
  const mac = typeof navigator !== 'undefined' && /Mac|iP(hone|ad|od)/.test(navigator.platform)
  return mac ? '⌃⌘F (or the green window button)' : 'F11'
}

/** Open a deck in the presenter window. Returns the window handle (or null if blocked). */
export async function openPresenterWindow(src: string): Promise<Window | null> {
  const url = encodeURI(src)

  // Preferred: place the deck straight onto the external display, fullscreen.
  try {
    const w = window as WindowWithScreens
    if (typeof w.getScreenDetails === 'function') {
      const details = await w.getScreenDetails()
      const external = details.screens.find((s) => !s.isPrimary)
      if (external) {
        return window.open(
          url,
          'deck-presenter',
          `popup,fullscreen,left=${external.availLeft},top=${external.availTop},width=${external.availWidth},height=${external.availHeight}`,
        )
      }
    }
  } catch {
    // Permission denied or API unavailable — fall through to the plain open.
  }

  // Fallback: normal window; teacher drags to the projector + browser fullscreen.
  return window.open(url, 'deck-presenter')
}
