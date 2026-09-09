'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { projectedBlockPages } from '@/lib/projected-block'
import { useTeachingTools } from '@/components/present/useTeachingTools'
import { lessonLocation } from '@/components/lessons/LessonVisualIdentity'
import { TeachingStage } from '@/components/present/TeachingStage'
import TeachingBlockContent, { blockMode } from '@/components/present/TeachingBlockContent'
import { commandRequest, type CommandLesson } from '@/lib/classroom-command'

/** Shared student-visible block content, with evidence reads and writes disabled. */
export default function ProjectedBlockPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const teaching = useTeachingTools(sessionId, true)
  const params = useSearchParams()
  const lessonId = params.get('lesson') ?? ''
  const blockId = params.get('block') ?? ''
  const part = Math.max(0, Number(params.get('part')) || 0)
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
  return <div data-projected-sei={String(teaching.state?.tools?.sei_enabled ?? false)} data-projected-block-ready={shown && !error ? `${blockId}:${part}` : undefined}>
    <TeachingStage location={lessonLocation(blockId, lesson?.content_blocks.blocks ?? [])} lesson={lesson?.title ?? 'Today’s lesson'} mode={blockMode(shown)} footer={<>{parts.length > 1 ? `Screen ${Math.min(part + 1, parts.length)} of ${parts.length} · ` : ''}{shown?.type === 'question' ? 'Answer on your lesson screen.' : 'Follow along on your device'}</>}>
      {error ? <p role="alert">{error}</p> : !lesson ? <p>Loading lesson block…</p> : !shown ? <p>This block is unavailable for the selected class.</p> : <TeachingBlockContent seiEnabled={teaching.state?.tools?.sei_enabled ?? false} key={shown.id + ':' + part} block={shown} lessonId={lesson.id} referenceBlocks={lesson.content_blocks.blocks} />}
    </TeachingStage>
  </div>
}
