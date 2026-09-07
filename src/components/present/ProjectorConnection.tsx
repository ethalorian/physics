'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import MathMarkdown from '@/components/MathMarkdown'
import { useTimerLeft, fmtTimer } from '@/components/lessons/PresentLiveProvider'
import { deckGo, deckPresenting, readDeck, sectionForSlide } from '@/lib/present-bridge'
import { openPresenterWindow } from '@/lib/present-deck'
import { commandRequest, commandQuestion, type CommandLesson } from '@/lib/classroom-command'
import { paginateBlocks, type DeckBlock } from '@/data/content-blocks'
import { sectionAnchor, sectionIndexForAnchor } from '@/lib/lesson-anchors'
import { useTeachingTools } from './useTeachingTools'
import { projectorSignature, PULSE_OPTIONS } from '@/lib/presentation-tools'
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
      try { ready = Boolean(win && !win.closed && snapshot?.index === live.session.current_slide && win.document.querySelector('[data-projection-signature]')?.getAttribute('data-projection-signature') === signature) } catch { /* closed */ }
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
    <h1 className="text-title-1">Connect the classroom screen</h1>
    <p>Keep this page open on the computer connected to your projector. Sign in with the same teaching account on your iPad.</p>
    <p className="text-title-3">{documentData?.lesson.title ?? 'Loading presentation…'}</p>
    {(error || loadError) && <p role="alert" className="text-destructive">{error || loadError}</p>}
    <Button className="min-h-14" disabled={!documentData || ended} onClick={connect}>{connected ? 'Reopen projector window' : 'Open projector window'}</Button>
    <p role="status">{ended ? 'Presentation ended.' : connected ? 'Projector window open. Move it onto the classroom display and enter fullscreen.' : 'The classroom screen will follow the iPad after you open the projector window.'}</p>
    <p className="text-muted-foreground">Keep this connection page running beside the projector window. Use the iPad Command Center for slide changes.</p>
    {portal && state && createPortal(<>
      {teaching.state && <span style={{ display: 'none' }} data-projection-signature={projectorSignature(state, teaching.state)} />}
      {(state.session.blackout || ended) ? <div style={{ position: 'fixed', inset: 0, zIndex: 2147483647, background: '#000' }} aria-label={ended ? 'Presentation ended' : 'Screen blanked'} /> : <>
        {(showLobby || pulse || poll?.type === 'question') && <div style={{ position: 'fixed', inset: 0, zIndex: 2147483645, background: 'var(--background, white)', color: 'var(--foreground, black)', padding: '5vh 7vw', overflowY: 'auto', fontFamily: 'system-ui', fontSize: 'clamp(24px, 3vw, 56px)' }}>
          {state.lobby ? <div style={{ textAlign: 'center', paddingTop: '12vh' }}><p>Join the activity</p><p style={{ fontSize: 'clamp(56px, 12vw, 180px)', fontWeight: 700, letterSpacing: '.12em' }}>{state.lobby.code}</p><p>{origin.replace(/^https?:\/\//, '')}/lobby</p><p>{state.lobby.status === 'open' ? 'Work with your group on your device.' : state.lobby.status === 'grouped' ? 'Find your group on your device.' : 'Enter the code on your device.'}</p></div> : pulse ? <div><h1>{pulse.kind === 'readiness' ? 'How ready are you to move on?' : 'How confident do you feel?'}</h1><p>Respond on your lesson screen · {pulse.anonymous ? 'anonymous totals' : 'your teacher can offer help'}</p>{PULSE_OPTIONS[pulse.kind].map(label => <p key={label} style={{ padding: 16, border: '2px solid currentColor', borderRadius: 12 }}>{label}</p>)}</div> : poll?.type === 'question' && <>{teaching.state?.tools?.discussion_block_id === state.session.poll_block_id && <p>Discuss with a partner. Explain your reasoning before the fresh vote.</p>}<MathMarkdown content={commandQuestion(poll)!.prompt} />{commandQuestion(poll)!.options?.map(o => <div key={o.id} style={{ marginTop: '2vh', padding: '1vh', border: '2px solid currentColor', borderRadius: 12 }}><MathMarkdown content={o.text} />{state.session.poll_revealed && <span>{state.tally[o.id] ?? 0} responses</span>}</div>)}<p style={{ marginTop: '3vh' }}>{state.saved} of {state.enrolled} responses · {state.session.poll_revealed ? 'Results revealed' : state.session.poll_locked ? 'Responses locked' : 'Respond on your device'}</p></>}
        </div>}
        {left !== null && <div style={{ position: 'fixed', right: 24, top: 20, zIndex: 2147483646, borderRadius: 16, padding: '12px 24px', background: 'var(--background, white)', color: 'var(--foreground, black)', fontFamily: 'system-ui', fontSize: 'clamp(28px, 4vw, 64px)', fontVariantNumeric: 'tabular-nums' }}>{fmtTimer(left)}</div>}
        {error && <div style={{ position: 'fixed', left: 20, bottom: 20, zIndex: 2147483646, padding: 12, background: 'var(--background, white)', color: 'var(--foreground, black)' }}>Connection interrupted · holding the last view</div>}
      </>}
    </>, portal)}
  </div>
}
