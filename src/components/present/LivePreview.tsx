'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { type DeckBlock } from '@/data/content-blocks'
import { type CommandLesson, type LiveCommandState, commandQuestion } from '@/lib/classroom-command'
import { presentationBinding } from '@/lib/presentation-bindings'
import { buildSlides } from '@/lib/present-auto-slides'
import { projectedBlockPages } from '@/lib/projected-block'
import { resolveDeckSrc } from '@/data/lesson-decks'
import { deckGo, deckPresenting } from '@/lib/present-bridge'
import { type ToolsState } from '@/lib/presentation-tools'
import { TeachingStage } from './TeachingStage'
import TeachingBlockContent, { blockMode } from './TeachingBlockContent'
import TeachingActivity from './TeachingActivity'
import { TeachingToolContext } from '@/components/teaching-tools/TeachingToolRenderer'
import { useTimerLeft, fmtTimer } from '@/components/lessons/PresentLiveProvider'
import { teachingCue } from '@/lib/teaching-content'

/** Same renderers and viewport as the board. Private teaching notes never enter this preview. */
export default function LivePreview({ lesson, deck, live, tools, binding, presentationOnly=false }: { lesson: CommandLesson; deck: DeckBlock | null; live: LiveCommandState; tools: ToolsState | null; binding?: string | null; presentationOnly?:boolean }) {
  const host = useRef<HTMLDivElement>(null), frame = useRef<HTMLIFrameElement>(null)
  const [width, setWidth] = useState(640)
  useEffect(() => { const resize = new ResizeObserver(() => setWidth(host.current?.clientWidth ?? 640)); if (host.current) resize.observe(host.current); return () => resize.disconnect() }, [])
  const deckSrc = deck?.src
  const sync = useCallback(() => { const win = frame.current?.contentWindow ?? null; deckGo(win, live.session.current_slide); deckPresenting(win, true) }, [live.session.current_slide])
  useEffect(() => { if (!deckSrc) return; sync(); const timer = setInterval(sync, 500); return () => clearInterval(timer) }, [sync, deckSrc]) // late custom-element initialization
  const autoSlides = useMemo(() => buildSlides(lesson.title, lesson.content_blocks), [lesson.title, lesson.content_blocks])
  const selected = lesson.content_blocks.blocks.find(b => b.id === live.session.projected_block_id)
  const canonical = presentationBinding(binding, lesson.content_blocks)
  const block = selected ? projectedBlockPages(selected)[live.session.projected_block_page ?? 0] : canonical ?? autoSlides[live.session.current_slide]?.blocks[0]
  const question = lesson.content_blocks.blocks.find(b => b.id === live.session.poll_block_id)
  const pulse = tools?.pulse?.status === 'open' ? tools.pulse : null
  const left = useTimerLeft(live.session.timer_ends_at)
  const seiEnabled = tools?.tools?.sei_enabled ?? false
  return <figure className="m-0 min-w-0">{!presentationOnly&&<figcaption className="mb-2 text-sm font-semibold">Classroom screen preview</figcaption>}<div ref={host} className="relative aspect-video overflow-hidden rounded-xl border bg-black" aria-label="Live classroom preview">
    <div style={{position:'absolute',left:0,top:0,width:1600,height:900,transform:`scale(${width / 1600})`,transformOrigin:'top left',pointerEvents:'none'}} inert>
      {live.session.blackout ? <div style={{width:1600,height:900,background:'#000'}} /> : live.lobby || pulse || question?.type === 'question' ? <TeachingActivity embedded lesson={lesson.title} live={live} pulse={pulse} question={commandQuestion(question)} discussion={Boolean(question && tools?.tools?.discussion_block_id === question.id)} origin={typeof location === 'undefined' ? '' : location.origin} referenceBlocks={lesson.content_blocks.blocks} seiEnabled={seiEnabled} /> : deck && !selected && !canonical ? <iframe ref={frame} title="Authored slide preview" src={resolveDeckSrc(deck.src)} onLoad={sync} tabIndex={-1} style={{width:1600,height:900,border:0}} /> : <TeachingStage original={block?.teachingTool?.kind==='physics-explainer'&&!!block.teachingTool.source} embedded lesson={lesson.title} mode={blockMode(block)} footer={teachingCue(block)}><TeachingToolContext.Provider value={{role:'projector',states:live.session.teaching_tool_state??{}}}>{block ? <TeachingBlockContent block={block} lessonId={lesson.id} referenceBlocks={lesson.content_blocks.blocks} seiEnabled={seiEnabled} /> : <h1 className="teach-headline">{lesson.title}</h1>}</TeachingToolContext.Provider></TeachingStage>}
      {!live.session.blackout && left !== null && <div style={{position:'absolute',right:24,bottom:20,padding:'12px 24px',borderRadius: 'var(--radius-lg)',background:'var(--background)',fontSize:56}}>{fmtTimer(left)}</div>}
    </div>
  </div></figure>
}
