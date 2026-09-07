'use client'

import { useEffect, useState, useRef, useLayoutEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { projectedBlockPages } from '@/lib/projected-block'
import FigureGraph from '@/components/blocks/FigureGraph'
import type { GraphSeries } from '@/data/content-blocks'
import BlockRenderer from '@/components/blocks/BlockRenderer'
import { commandRequest, type CommandLesson } from '@/lib/classroom-command'

/** Shared student-visible block content, with evidence reads and writes disabled. */
export default function ProjectedBlockPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const params = useSearchParams()
  const lessonId = params.get('lesson') ?? ''
  const blockId = params.get('block') ?? ''
  const part = Math.max(0, Number(params.get('part')) || 0)
  const [stageScale, setStageScale] = useState(1)
  const [contentScale, setContentScale] = useState(1)
  const content = useRef<HTMLDivElement>(null)
  const [lesson, setLesson] = useState<CommandLesson | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    setLesson(null); setError('')
    commandRequest<{ lesson: CommandLesson }>(`/api/present/document?session_id=${encodeURIComponent(sessionId)}&lesson_id=${encodeURIComponent(lessonId)}`, { signal: controller.signal })
      .then(d => { if (!controller.signal.aborted) setLesson(d.lesson) })
      .catch(e => { if (!controller.signal.aborted) setError(e.message) })
    return () => controller.abort()
  }, [sessionId, lessonId])
  const block = lesson?.content_blocks.blocks.find(b => b.id === blockId && b.type !== 'deck')
  const parts = block ? projectedBlockPages(block) : []
  const shown = parts[Math.min(part, parts.length - 1)]
  let graphSeries: GraphSeries[] = []
  if (shown?.type === 'graph') {
    graphSeries = shown.series ?? []
    if (!graphSeries.length && shown.spec) { try { graphSeries = JSON.parse(shown.spec).series ?? [] } catch { /* invalid authored graph */ } }
  }
  useLayoutEffect(() => {
    const fit = () => {
      setStageScale(Math.min(window.innerWidth / 1600, window.innerHeight / 900))
      const el = content.current
      if (el) setContentScale(Math.min(1, 1440 / Math.max(1, el.scrollWidth), 720 / Math.max(1, el.scrollHeight)))
    }
    fit()
    const observer = new ResizeObserver(fit)
    if (content.current) observer.observe(content.current)
    window.addEventListener('resize', fit)
    return () => { observer.disconnect(); window.removeEventListener('resize', fit) }
  }, [shown])
  return <main style={{ position: 'fixed', inset: 0, background: '#10121b', overflow: 'hidden' }}>
    <section aria-label="Projected lesson screen" data-projected-block-ready={shown && !error ? `${blockId}:${part}` : undefined} className="bg-background text-foreground" style={{ position: 'absolute', width: 1600, height: 900, left: '50%', top: '50%', transform: `translate(-50%, -50%) scale(${stageScale})`, overflow: 'hidden', padding: '36px 80px' }}>
      <p style={{ fontSize: 28, lineHeight: 1.3, height: 60, overflow: 'hidden' }}>{lesson?.title ?? 'Lesson block'}</p>
      <div style={{ width: 1440, height: 720, position: 'relative', overflow: 'hidden' }}>
        {error ? <p role="alert">{error}</p> : !lesson ? <p>Loading lesson block…</p> : !shown ? <p>This block is unavailable for the selected class.</p> : <div ref={content} className="projected-content" style={{ width: 1440, transform: `scale(${contentScale})`, transformOrigin: 'top center', fontSize: 32, lineHeight: 1.45 }}>{shown.type === 'graph' ? <FigureGraph presentation title={shown.title} xLabel={shown.xLabel} yLabel={shown.yLabel} series={graphSeries} /> : <BlockRenderer key={shown.id + ':' + part} lessonId={lesson.id} blocks={[shown]} referenceBlocks={lesson.content_blocks.blocks} readOnly />}</div>}
      </div>
      <p style={{ fontSize: 24, textAlign: 'right', marginTop: 16 }}>Lesson block{parts.length > 1 ? ` · Screen ${Math.min(part + 1, parts.length)} of ${parts.length}` : ''} · Follow along on your device</p>
      <style>{`
        .projected-content :is(p,li,label,input,textarea,button,td,th) {font-size: max(1em, 26px); line-height: 1.4;}
        .projected-content :is(.text-xs,.text-sm,.text-caption) {font-size:24px !important;}
        .projected-content :is(h1,h2,h3) {font-size:36px !important;line-height:1.2;}
        .projected-content :is(.overflow-y-auto,.overflow-auto,.overflow-x-auto) {overflow:visible;max-height:none;}
        .projected-content :is(svg,canvas,img,iframe) {max-width:100%;}
        .projected-content iframe {height:560px;}
      `}</style>
    </section>
  </main>
}
