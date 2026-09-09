'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import TeachingActivity from './TeachingActivity'
import { useTimerLeft, fmtTimer } from '@/components/lessons/PresentLiveProvider'
import { deckGo, deckPresenting, readDeck, sectionForSlide } from '@/lib/present-bridge'
import { openPresenterWindow } from '@/lib/present-deck'
import { commandRequest, commandQuestion, type CommandLesson } from '@/lib/classroom-command'
import { paginateBlocks, type DeckBlock } from '@/data/content-blocks'
import { sectionAnchor, sectionIndexForAnchor } from '@/lib/lesson-anchors'
import { useTeachingTools } from './useTeachingTools'
import { projectorSignature } from '@/lib/presentation-tools'
import { useCommandSession } from './useCommandSession'

/** Run on the projector COMPUTER. The iPad writes session state; this bridge drives the second window. */
export default function ProjectorConnection({ sessionId, existingWindow }: { sessionId: string; existingWindow?: Window | null }) {
  const { state, error, patch } = useCommandSession(sessionId)
  const teaching = useTeachingTools(sessionId, true)
  const teachingRef = useRef(teaching.state)
  teachingRef.current = teaching.state
  const reconnectSeen = useRef<string | null | undefined>(undefined)
  const [documentData, setDocumentData] = useState<{ lesson: CommandLesson; deck: DeckBlock | null } | null>(null)
  const [loadError, setLoadError] = useState('')
  const [connected, setConnected] = useState(false)
  const [portal, setPortal] = useState<HTMLElement | null>(null)
  const [origin, setOrigin] = useState('')
  const deckWindow = useRef<Window | null>(null)
  useEffect(() => {
    if (existingWindow === undefined) return
    deckWindow.current = existingWindow
    setConnected(Boolean(existingWindow)); setPortal(null)
  }, [existingWindow])
  const stateRef = useRef(state)
  stateRef.current = state
  const receivedSlide = state?.session.current_slide
  // Apply received commands on render; the interval only handles late deck readiness.
  useEffect(() => {
    if (!connected || receivedSlide === undefined) return
    const win = deckWindow.current
    const snapshot = readDeck(win)
    if (snapshot && snapshot.index !== receivedSlide) deckGo(win, receivedSlide)
  }, [connected, receivedSlide])
  const left = useTimerLeft(state?.session.timer_ends_at)
  const lessonId = state?.session.lesson_id
  useEffect(() => { setOrigin(window.location.origin) }, [])
  useEffect(() => {
    if (!lessonId) return
    const controller = new AbortController()
    commandRequest<{ lesson: CommandLesson; deck: DeckBlock | null }>(`/api/present/document?lesson_id=${encodeURIComponent(lessonId)}&session_id=${encodeURIComponent(sessionId)}`, { signal: controller.signal })
      .then(setDocumentData).catch(e => { if (!controller.signal.aborted) setLoadError(e.message) })
    return () => controller.abort()
  }, [lessonId, sessionId])

  async function connect() {
    if (!documentData || !lessonId) return
    const src = documentData.deck?.src ?? `/embed/present/${encodeURIComponent(lessonId)}?session_id=${encodeURIComponent(sessionId)}`
    const win = await openPresenterWindow(src)
    deckWindow.current = win
    setConnected(Boolean(win)); setPortal(null)
    setLoadError(win ? '' : 'Allow pop-ups for this site, then open the projector again.')
  }
  useEffect(() => {
    if (!connected) return
    let keyboardDocument: Document | null = null
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || !documentData) return
      const live = stateRef.current
      const snapshot = readDeck(deckWindow.current)
      if (!live || live.session.status !== 'live' || !snapshot) return
      if (!['ArrowRight', 'ArrowLeft', 'b', 'B'].includes(event.key)) return
      event.preventDefault(); event.stopImmediatePropagation()
      if (event.key.toLowerCase() === 'b') { void patch({ blackout: !live.session.blackout }); return }
      if (live.session.projected_block_id) return
      const index = live.session.current_slide + (event.key === 'ArrowRight' ? 1 : -1)
      if (index < 0 || index >= snapshot.total) return
      const pages = paginateBlocks(documentData.lesson.content_blocks.blocks)
      const anchor = snapshot.slides[index]?.anchor
      const section = anchor ? sectionIndexForAnchor(pages, anchor) : documentData.deck?.slideMap?.length ? sectionForSlide(index, pages.length, documentData.deck.slideMap) : -1
      void patch({ current_slide: index, current_anchor: section >= 0 ? sectionAnchor(pages[section]) : null })
    }
    const tick = () => {
      const win = deckWindow.current
      if (!win || win.closed) { setConnected(false); setPortal(null); return }
      const live = stateRef.current
      const snap = readDeck(win)
      if (!snap || !live) return
      deckPresenting(win, true)
      if (snap.index !== live.session.current_slide) deckGo(win, live.session.current_slide)
      try {
        if (keyboardDocument !== win.document) {
          keyboardDocument?.removeEventListener('keydown', onKey, true)
          keyboardDocument = win.document
          keyboardDocument.addEventListener('keydown', onKey, true)
        }
        let host = win.document.getElementById('classroom-command-overlay')
        if (!host) { host = win.document.createElement('div'); host.id = 'classroom-command-overlay'; win.document.body.appendChild(host) }
        setPortal(old => old === host ? old : host)
      } catch { setLoadError('The projector deck must be hosted on this site.') }
    }
    tick(); const timer = setInterval(tick, 300)
    return () => { clearInterval(timer); keyboardDocument?.removeEventListener('keydown', onKey, true) }
  }, [connected, documentData, patch])
  useEffect(() => () => { try { deckWindow.current?.document.getElementById('classroom-command-overlay')?.remove() } catch { /* window closed */ } }, [])
  useEffect(() => {
    const token = teaching.state?.tools?.reconnect_token ?? null
    if (reconnectSeen.current === undefined) { reconnectSeen.current = token; return }
    if (token && token !== reconnectSeen.current) {
      const win = deckWindow.current
      if (win && !win.closed) { setPortal(null); win.location.reload() }
      else setLoadError('Reconnection requested. Open the projector window on this computer.')
    }
    reconnectSeen.current = token
  }, [teaching.state?.tools?.reconnect_token])
  useEffect(() => {
    let sending = false
    const controller = new AbortController()
    const ack = async () => {
      if (sending) return
      const live = stateRef.current, tools = teachingRef.current, win = deckWindow.current
      if (!live || !tools) return
      const signature = projectorSignature(live, tools)
      const snapshot = readDeck(win)
      let ready = false
      try {
        ready = Boolean(win && !win.closed && snapshot?.index === live.session.current_slide && win.document.querySelector('[data-projection-signature]')?.getAttribute('data-projection-signature') === signature)
        if (ready && live.session.projected_block_id && !live.session.blackout && live.session.status === 'live') {
          const frame = win?.document.querySelector<HTMLIFrameElement>('iframe[title="Projected lesson block"]')
          ready = frame?.contentDocument?.querySelector('[data-projected-block-ready]')?.getAttribute('data-projected-block-ready') === `${live.session.projected_block_id}:${live.session.projected_block_page ?? 0}`
        }
      } catch { /* closed or block still loading */ }
      sending = true
      try { await commandRequest(`/api/present/sessions/${sessionId}/tools`, { method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'ack', signature, ready, slide: snapshot?.index ?? 0 }) }) }
      catch { /* the iPad marks the heartbeat stale */ }
      finally { sending = false }
    }
    const timer = setInterval(ack, 2000)
    return () => { controller.abort(); clearInterval(timer) }
  }, [sessionId])
  const pulse = teaching.state?.pulse?.status === 'open' ? teaching.state.pulse : null
  const poll = documentData?.lesson.content_blocks.blocks.find(b => b.id === state?.session.poll_block_id)
  const showLobby = Boolean(state?.lobby)
  const ended = state?.session.status === 'ended'

  return <div className={existingWindow !== undefined ? 'hidden' : 'mx-auto max-w-3xl space-y-5 p-6'}>
    <div className="rounded-2xl border bg-primary/5 p-6"><p className="text-overline text-primary">On your classroom computer</p><h1 className="mt-2 text-title-1">Connect the classroom screen</h1><p className="mt-3 text-muted-foreground">This computer displays the lesson. Your iPad is the remote.</p></div>
    <ol className="grid list-none gap-3 sm:grid-cols-3">{[['1','Open the display','Use the button below to launch your deck in a separate window.'],['2','Move it to the projector','Use Extend display, then make the deck fullscreen.'],['3','Take your iPad','Sign in to the same account. Open Command Center and choose the running presentation.']].map(([step,title,detail]) => <li key={step} className="rounded-xl border bg-card p-4"><p className="text-overline text-primary">Step {step}</p><h2 className="mt-2 text-title-3">{title}</h2><p className="mt-2 text-caption text-muted-foreground">{detail}</p></li>)}</ol>
    <p className="text-title-3">{documentData?.lesson.title ?? 'Loading presentation…'}</p>
    {(error || loadError) && <p role="alert" className="text-destructive">{error || loadError}</p>}
    <Button className="min-h-14" disabled={!documentData || ended} onClick={connect}>{connected ? 'Reopen projector window' : 'Open projector window'}</Button>
    <p role="status">{ended ? 'Presentation ended.' : connected ? 'Projector window open. Move it onto the classroom display and enter fullscreen.' : 'The classroom screen will follow the iPad after you open the projector window.'}</p>
    <div className="rounded-xl border bg-muted p-4"><p className="font-semibold">Keep both windows open on this computer</p><p className="mt-1 text-caption text-muted-foreground">The deck shows the lesson; this page receives your iPad commands. Switching to a lesson block preserves the deck’s slide position.</p><a className="mt-3 inline-flex min-h-12 items-center text-primary underline" href="/admin/command-center">Open Command Center</a></div>
    {portal && state && createPortal(<>
      {teaching.state && <span style={{ display: 'none' }} data-projection-signature={projectorSignature(state, teaching.state)} />}
      {(state.session.blackout || ended) ? <div style={{ position: 'fixed', inset: 0, zIndex: 2147483647, background: '#000' }} aria-label={ended ? 'Presentation ended' : 'Screen blanked'} /> : <>
        {state.session.projected_block_id && <iframe key={state.session.projected_block_id} title="Projected lesson block" src={`${origin}/embed/present-block/${encodeURIComponent(sessionId)}?lesson=${encodeURIComponent(state.session.lesson_id)}&block=${encodeURIComponent(state.session.projected_block_id)}&part=${state.session.projected_block_page ?? 0}`} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 0, zIndex: 2147483644, background: 'white' }} allow="fullscreen" />}
        {(showLobby || pulse || poll?.type === 'question') && <div style={{ position: 'fixed', inset: 0, zIndex: 2147483645 }}><TeachingActivity lesson={documentData?.lesson.title ?? 'Today’s lesson'} live={state} pulse={pulse} question={commandQuestion(poll)} discussion={Boolean(teaching.state?.tools?.discussion_block_id && teaching.state.tools.discussion_block_id === state.session.poll_block_id)} origin={origin} /></div>}
        {left !== null && <div style={{ position: 'fixed', right: 24, bottom: 20, zIndex: 2147483646, borderRadius: 16, padding: '12px 24px', background: 'var(--background, white)', color: 'var(--foreground, black)', fontFamily: 'system-ui', fontSize: 'clamp(28px, 4vw, 64px)', fontVariantNumeric: 'tabular-nums' }}>{fmtTimer(left)}</div>}
        {error && <div style={{ position: 'fixed', left: 20, bottom: 20, zIndex: 2147483646, padding: 12, background: 'var(--background, white)', color: 'var(--foreground, black)' }}>Connection interrupted · holding the last view</div>}
      </>}
    </>, portal)}
  </div>
}
