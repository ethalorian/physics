'use client'
import { initialTeachingTool } from '@/lib/teaching-tool-spec'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { presentationBinding } from '@/lib/presentation-bindings'
import { TeachingStage } from './TeachingStage'
import TeachingBlockContent, { blockMode } from './TeachingBlockContent'
import { teachingCue } from '@/lib/teaching-content'
import TeachingActivity from './TeachingActivity'
import { useTimerLeft, fmtTimer } from '@/components/lessons/PresentLiveProvider'
import { presentationKey } from '@/lib/presentation-keyboard'
import { projectedBlockPages } from '@/lib/projected-block'
import { deckGo, deckPresenting, readDeck, sectionForSlide } from '@/lib/present-bridge'
import { fullscreenKeyHint, openPresenterWindow } from '@/lib/present-deck'
import { commandRequest, commandQuestion, type CommandLesson } from '@/lib/classroom-command'
import { paginateBlocks, type DeckBlock } from '@/data/content-blocks'
import { sectionAnchor, sectionIndexForAnchor } from '@/lib/lesson-anchors'
import { useTeachingTools } from './useTeachingTools'
import { projectorSignature } from '@/lib/presentation-tools'
import { useCommandSession } from './useCommandSession'

/** Run on the projector COMPUTER. The iPad writes session state; this bridge drives the second window. */
export default function ProjectorConnection({ sessionId, existingWindow, compact = false }: { sessionId: string; existingWindow?: Window | null; compact?: boolean }) {
  const { state, error, patch } = useCommandSession(sessionId)
  const teaching = useTeachingTools(sessionId, true)
  const teachingRef = useRef(teaching.state)
  teachingRef.current = teaching.state
  const reconnectSeen = useRef<string | null | undefined>(undefined)
  const [documentData, setDocumentData] = useState<{ lesson: CommandLesson; deck: DeckBlock | null } | null>(null)
  const [loadError, setLoadError] = useState('')
  const [connected, setConnected] = useState(false)
  const [portal, setPortal] = useState<HTMLElement | null>(null)
  const [binding, setBinding] = useState<{index:number;value:string|null} | null>(null)
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
    if (snapshot) setBinding({index:receivedSlide,value:snapshot.slides[receivedSlide]?.binding ?? null})
    if (snapshot && snapshot.index !== receivedSlide) deckGo(win, receivedSlide)
  }, [connected, receivedSlide])
  const left = useTimerLeft(state?.session.timer_ends_at)
  const documentSessionId = state?.session.id
  useEffect(() => { setOrigin(window.location.origin) }, [])
  useEffect(() => {
    if (!documentSessionId) return
    const controller = new AbortController()
    commandRequest<{ lesson: CommandLesson; deck: DeckBlock | null }>(`/api/present/document?session_id=${encodeURIComponent(sessionId)}`, { signal: controller.signal })
      .then(setDocumentData).catch(e => { if (!controller.signal.aborted) setLoadError(e.message) })
    return () => controller.abort()
  }, [documentSessionId, sessionId])

  async function connect() {
    if (!documentData) return
    const src = documentData.deck?.src ?? `/embed/present/${encodeURIComponent(documentData.lesson.id)}?session_id=${encodeURIComponent(sessionId)}`
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
      if (event.composedPath().some(n => typeof (n as Element).matches === 'function' && (n as Element).matches('input, textarea, select, [contenteditable="true"]'))) return
      const command = presentationKey(event.key, live.session.current_slide, snapshot.total)
      if (command === null) return
      event.preventDefault(); event.stopImmediatePropagation()
      if (command === 'blank') { void patch({ blackout: !live.session.blackout }); return }
      if (command === 'timer') return // The class timer lives on the remote.
      if(live.lobby || live.session.poll_block_id || teachingRef.current?.pulse?.status==='open')return
      if (live.session.projected_block_id) {
        const block = documentData.lesson.content_blocks.blocks.find(b => b.id === live.session.projected_block_id)
        if(block?.teachingTool?.kind==='physics-explainer') {
          const old=live.session.teaching_tool_state?.[block.id]?.state
          const current=Math.min(block.teachingTool.frames.length-1,old?.frame??0)
          const next=presentationKey(event.key,current,block.teachingTool.frames.length)
          if(typeof next==='number')void patch({teaching_tool:{block_id:block.id,state:{frame:next,show:false,...(old?.claude?{claude:{...old.claude,offset:0}}:{})}},expected_command_revision:live.session.command_revision})
          return
        }
        const count = block ? projectedBlockPages(block).length : 1
        const next = presentationKey(event.key, live.session.projected_block_page ?? 0, count)
        if (typeof next === 'number') void patch({ projected_block_page: next })
        return
      }
      const index = command
      if (index < 0 || index >= snapshot.total) return
      const pages = paginateBlocks(documentData.lesson.content_blocks.blocks)
      const anchor = snapshot.slides[index]?.anchor
      const section = anchor ? sectionIndexForAnchor(pages, anchor) : documentData.deck?.slideMap?.length ? sectionForSlide(index, pages.length, documentData.deck.slideMap) : -1
      void patch({ current_slide: index, current_anchor: section >= 0 ? sectionAnchor(pages[section]) : null })
    }
    const onNavigate = (event: Event) => {
      const live = stateRef.current, snapshot = readDeck(deckWindow.current)
      const index = (event as CustomEvent<{index:number}>).detail?.index
      if (!documentData || !live || !snapshot || live.session.status !== 'live' || !Number.isInteger(index) || index < 0 || index >= snapshot.total || live.session.projected_block_id) return
      const pages = paginateBlocks(documentData.lesson.content_blocks.blocks)
      const anchor = snapshot.slides[index]?.anchor
      const section = anchor ? sectionIndexForAnchor(pages, anchor) : documentData.deck?.slideMap?.length ? sectionForSlide(index, pages.length, documentData.deck.slideMap) : -1
      void patch({current_slide:index,current_anchor:section>=0?sectionAnchor(pages[section]):null})
    }
    const tick = () => {
      const win = deckWindow.current
      if (!win || win.closed) { setConnected(false); setPortal(null); return }
      const live = stateRef.current
      const snap = readDeck(win)
      if (!snap || !live) return
      const index = live.session.current_slide, value = snap.slides[index]?.binding ?? null
      setBinding(old => old?.index === index && old.value === value ? old : {index,value})
      deckPresenting(win, true)
      if (snap.index !== live.session.current_slide) deckGo(win, live.session.current_slide)
      try {
        if (keyboardDocument !== win.document) {
          keyboardDocument?.removeEventListener('keydown', onKey, true); keyboardDocument?.removeEventListener('classroomnavigate', onNavigate)
          keyboardDocument = win.document
          keyboardDocument.addEventListener('keydown', onKey, true); keyboardDocument.addEventListener('classroomnavigate', onNavigate)
        }
        let host = win.document.getElementById('classroom-command-overlay')
        if (!host) { host = win.document.createElement('div'); host.id = 'classroom-command-overlay'; win.document.body.appendChild(host) }
        setPortal(old => old === host ? old : host)
      } catch { setLoadError('The projector deck must be hosted on this site.') }
    }
    tick(); const timer = setInterval(tick, 300)
    return () => { clearInterval(timer); keyboardDocument?.removeEventListener('keydown', onKey, true); keyboardDocument?.removeEventListener('classroomnavigate', onNavigate) }
  }, [connected, documentData, patch])
  useEffect(() => () => {
    try {
      const doc = deckWindow.current?.document
      if (doc && stateRef.current?.session.status === 'ended') {
        // Leaving the finished session must not uncover the last slide.
        const blank = doc.createElement('div')
        blank.setAttribute('aria-label', 'Guided session ended')
        blank.style.cssText = 'position:fixed;inset:0;background:#000;z-index:2147483647'
        doc.body.appendChild(blank)
      }
      doc?.getElementById('classroom-command-overlay')?.remove()
    } catch { /* window closed */ }
  }, [])
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
      if (!live || !tools || !win || win.closed) return
      const signature = projectorSignature(live, tools)
      const snapshot = readDeck(win)
      let ready = false
      try {
        ready = Boolean(win && !win.closed && snapshot?.index === live.session.current_slide && win.document.querySelector('[data-projection-signature]')?.getAttribute('data-projection-signature') === signature)
        if (ready && snapshot?.slides[live.session.current_slide]?.binding && !live.session.projected_block_id && !live.session.blackout && live.session.status === 'live') {
          ready = win?.document.querySelector('[data-bound-slide-ready]')?.getAttribute('data-bound-slide-ready') === String(live.session.current_slide)
        }
        if (ready && live.session.projected_block_id && !live.session.blackout && live.session.status === 'live') {
          const frame = win?.document.querySelector<HTMLIFrameElement>('iframe[title="Projected lesson block"]')
          ready = frame?.contentDocument?.querySelector('[data-projected-block-ready]')?.getAttribute('data-projected-block-ready') === `${live.session.projected_block_id}:${live.session.projected_block_page ?? 0}` && frame?.contentDocument?.querySelector('[data-projected-sei]')?.getAttribute('data-projected-sei') === String(tools.tools?.sei_enabled ?? false)
          const block=documentData?.lesson.content_blocks.blocks.find(b=>b.id===live.session.projected_block_id)
          if(ready && block?.teachingTool)ready=frame?.contentDocument?.querySelector('[data-projected-tool-state]')?.getAttribute('data-projected-tool-state')===JSON.stringify(live.session.teaching_tool_state?.[block.id]??null)
          if(ready&&block?.teachingTool?.kind==='physics-explainer'&&block.teachingTool.source){const original=frame?.contentDocument?.querySelector('[data-claude-ready="true"]');ready=!!original&&original.getAttribute('data-claude-applied')===JSON.stringify(live.session.teaching_tool_state?.[block.id]?.state??initialTeachingTool(block).state)}
        }
      } catch { /* closed or block still loading */ }
      sending = true
      try { await commandRequest(`/api/present/sessions/${sessionId}/tools`, { method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'ack', signature, ready, slide: snapshot?.index ?? 0 }) }) }
      catch { /* the iPad marks the heartbeat stale */ }
      finally { sending = false }
    }
    const timer = setInterval(ack, 2000)
    return () => { controller.abort(); clearInterval(timer) }
  }, [sessionId, documentData])
  const boundBlock = documentData && binding?.index === state?.session.current_slide ? presentationBinding(binding?.value, documentData.lesson.content_blocks) : undefined
  const pulse = teaching.state?.pulse?.status === 'open' ? teaching.state.pulse : null
  const poll = documentData?.lesson.content_blocks.blocks.find(b => b.id === state?.session.poll_block_id)
  const showLobby = Boolean(state?.lobby)
  const ended = state?.session.status === 'ended'

  return <div className={existingWindow !== undefined ? 'hidden' : compact ? 'space-y-3' : 'mx-auto max-w-3xl space-y-5 p-6'}>
    {!compact && <header><p className="text-overline text-primary">Classroom screen</p><h1 className="mt-2 text-title-1">{documentData?.lesson.title ?? 'Loading guided activity…'}</h1><p className="mt-3 text-muted-foreground">Open the activity on the classroom display, then use your iPad to guide the problem solving.</p></header>}
    {(error || loadError) && <p role="alert" className="text-destructive">{error || loadError}</p>}
    <Button className="min-h-14" disabled={!documentData || ended} onClick={connect}>{connected ? 'Reopen projector window' : 'Open projector window'}</Button>
    <p role="status">{ended ? 'Guided session ended.' : connected ? 'Projector window open. Keep this page open to receive iPad controls.' : 'The activity opens in a separate window for your classroom screen.'}</p>
    {connected && <p className="text-sm text-muted-foreground">Move the activity window to your projector and use {fullscreenKeyHint()} for fullscreen. Use Extend display.</p>}
    {!compact && <div className="rounded-xl border p-4"><p className="font-semibold">Continue on your iPad</p><p className="mt-2 text-sm">Open Guided problem solving with the same account, then choose “Resume guided session.” Keep this page and the projector window open on the computer.</p><a className="mt-3 inline-flex min-h-12 items-center text-primary underline" href="/admin/command-center" target="_blank" rel="noreferrer">Open guided problem solving</a></div>}
    {portal && state && createPortal(<>
      {teaching.state && <span style={{ display: 'none' }} data-projection-signature={projectorSignature(state, teaching.state)} />}
      {(state.session.blackout || ended) ? <div style={{ position: 'fixed', inset: 0, zIndex: 2147483647, background: '#000' }} aria-label={ended ? 'Guided session ended' : 'Screen blanked'} /> : <>
        {state.session.lesson_id && !state.session.projected_block_id && boundBlock && <div data-bound-slide-ready={state.session.current_slide} style={{position:'fixed',inset:0,zIndex:2147483644}}><TeachingStage lesson={documentData?.lesson.title ?? 'Today’s lesson'} mode={blockMode(boundBlock)} footer={teachingCue(boundBlock)}><TeachingBlockContent block={boundBlock} lessonId={state.session.lesson_id} referenceBlocks={documentData?.lesson.content_blocks.blocks ?? []} seiEnabled={teaching.state?.tools?.sei_enabled ?? false}/></TeachingStage></div>}
        {state.session.lesson_id && state.session.projected_block_id && <iframe key={state.session.projected_block_id} title="Projected lesson block" src={`${origin}/embed/present-block/${encodeURIComponent(sessionId)}?lesson=${encodeURIComponent(state.session.lesson_id)}&block=${encodeURIComponent(state.session.projected_block_id)}&part=${state.session.projected_block_page ?? 0}`} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 0, zIndex: 2147483644, background: 'white' }} allow="fullscreen" />}
        {(showLobby || pulse || poll?.type === 'question') && <div style={{ position: 'fixed', inset: 0, zIndex: 2147483645 }}><TeachingActivity seiEnabled={teaching.state?.tools?.sei_enabled ?? false} referenceBlocks={documentData?.lesson.content_blocks.blocks ?? []} lesson={documentData?.lesson.title ?? 'Today’s lesson'} live={state} pulse={pulse} question={commandQuestion(poll)} discussion={Boolean(teaching.state?.tools?.discussion_block_id && teaching.state.tools.discussion_block_id === state.session.poll_block_id)} origin={origin} /></div>}
        {left !== null && <div style={{ position: 'fixed', right: 24, bottom: 20, zIndex: 2147483646, borderRadius: 'var(--radius-lg)', padding: '12px 24px', background: 'var(--background)', color: 'var(--foreground)', fontFamily: 'system-ui', fontSize: 'clamp(28px, 4vw, 64px)', fontVariantNumeric: 'tabular-nums' }}>{fmtTimer(left)}</div>}
        {error && <div style={{ position: 'fixed', left: 20, bottom: 20, zIndex: 2147483646, padding: 12, background: 'var(--background)', color: 'var(--foreground)' }}>Connection interrupted · holding the last view</div>}
      </>}
    </>, portal)}
  </div>
}
