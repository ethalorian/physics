'use client'

/**
 * DeckPresentCard — the teacher-facing "Present" launch card for a `deck`
 * content block (docs/Deck-Integration-Handoff.md §2–3).
 *
 * Launch pattern (§3): a SECOND WINDOW, not an iframe, so the deck can live on
 * the projector while the dashboard stays on the laptop.
 *   - Chrome/Edge: the Window Management API (getScreenDetails, one-time
 *     permission) opens the deck directly on the external display, sized to it.
 *   - Firefox/Safari, single screen, or permission denied: plain window.open —
 *     the teacher drags the window to the projector and presses F11.
 * The window handle is kept for the (future) postMessage presenter side-panel.
 *
 * Students never see this component: `deck` blocks are stripped server-side in
 * src/lib/track-visibility.ts before the document reaches the client.
 */

import { useRef, useState } from 'react'
import { MonitorPlay, Presentation, Timer, Keyboard } from 'lucide-react'

// Platform-aware browser-fullscreen hint: F11 is a Windows/Linux idiom; macOS
// uses ⌃⌘F (or the green traffic-light button). SSR-safe: default to the Mac
// string only when navigator says so at render time (client component).
const isMac = () => typeof navigator !== 'undefined' && /Mac|iP(hone|ad|od)/.test(navigator.platform)

interface ScreenDetailed {
  isPrimary: boolean
  availLeft: number
  availTop: number
  availWidth: number
  availHeight: number
}
interface ScreenDetails { screens: ScreenDetailed[] }
type WindowWithScreens = Window & { getScreenDetails?: () => Promise<ScreenDetails> }

export default function DeckPresentCard({ src, title }: { src: string; title: string }) {
  // Handle to the presenter window — Phase 2 (speaker-notes side panel) will
  // postMessage against this.
  const deckWin = useRef<Window | null>(null)
  const [opened, setOpened] = useState(false)

  const present = async () => {
    const url = encodeURI(src)

    // Preferred: place the deck straight onto the external display (Chrome/Edge).
    try {
      const w = window as WindowWithScreens
      if (typeof w.getScreenDetails === 'function') {
        const details = await w.getScreenDetails()
        const external = details.screens.find((s) => !s.isPrimary)
        if (external) {
          // `fullscreen` in the features string is Chrome's "fullscreen popup"
          // (allowed once window-management permission is granted): the deck
          // arrives on the projector ALREADY fullscreen — no F11/⌃⌘F needed.
          deckWin.current = window.open(
            url,
            'deck-presenter',
            `popup,fullscreen,left=${external.availLeft},top=${external.availTop},width=${external.availWidth},height=${external.availHeight}`,
          )
          setOpened(Boolean(deckWin.current))
          return
        }
      }
    } catch {
      // Permission denied or API unavailable — fall through to the plain open.
    }

    // Fallback: normal tab/window; teacher drags to the projector + F11.
    deckWin.current = window.open(url, 'deck-presenter')
    setOpened(Boolean(deckWin.current))
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid color-mix(in oklch, var(--primary) 40%, var(--border))', background: 'var(--card)' }}
    >
      <div
        className="flex items-center gap-2 px-4 py-2"
        style={{ background: 'color-mix(in oklch, var(--primary) 14%, var(--card))' }}
      >
        <span
          className="flex items-center justify-center shrink-0"
          style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          <Presentation size={15} />
        </span>
        <span className="text-xs font-semibold" style={{ color: 'color-mix(in oklch, var(--primary) 55%, var(--foreground))' }}>
          Lesson deck
        </span>
        <span
          className="ml-auto text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Teachers only
        </span>
      </div>

      <div className="p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{title}</div>
          <div className="flex items-center gap-3 mt-1 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
            <span className="inline-flex items-center gap-1"><Keyboard size={12} /> ← → to navigate</span>
            <span className="inline-flex items-center gap-1"><Timer size={12} /> T for the class timer</span>
          </div>
          {opened && (
            <div className="text-[11px] mt-1.5" style={{ color: 'var(--muted-foreground)' }}>
              If the deck opened on this screen: drag it to the projector, then{' '}
              {isMac() ? <>press <strong>⌃⌘F</strong> (or the green window button)</> : <>press <strong>F11</strong></>} for fullscreen.
              Display mode must be <strong>Extend</strong>, not Mirror.
            </div>
          )}
        </div>
        <button
          onClick={present}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shrink-0"
          style={{
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 22px -8px color-mix(in oklch, var(--primary) 70%, transparent)',
          }}
        >
          <MonitorPlay size={16} /> Present
        </button>
      </div>
    </div>
  )
}
