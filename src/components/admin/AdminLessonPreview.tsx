'use client'
import { useEffect, useMemo, useState } from 'react'
import BlockLessonViewer from '@/components/lessons/BlockLessonViewer'
import LessonEditorNav from './LessonEditorNav'
import { filterDocumentForViewer } from '@/lib/track-visibility'
import type { BlockDocument } from '@/data/content-blocks'
import type { GlossaryEntry } from '@/components/MathMarkdown'
import type { ReleaseClass } from '@/lib/lesson-release'
import type { LessonRewardMaps } from '@/lib/xp-policy'

export interface PreviewLesson {
  rewardMaps?: LessonRewardMaps
  targets?: { id: string; slug: string; statement: string }[]
  id: string
  title: string
  slug?: string
  unit_id?: string | null
  lesson_number?: number | null
  published?: boolean
  unit?: string
  estimated_time?: number
  hero_image?: string | null
  content_blocks?: BlockDocument
  key_terms?: GlossaryEntry[]
}
export default function AdminLessonPreview({
  lesson,
  canEdit = true,
}: {
  lesson: PreviewLesson
  canEdit?: boolean
}) {
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-5">
      <LessonEditorNav
        lessonId={lesson.id}
        title={lesson.title}
        unitId={lesson.unit_id}
        day={lesson.lesson_number}
        published={lesson.published}
        active="preview"
        canEdit={canEdit}
      />
      <LessonStudentPreview lesson={lesson} />
    </div>
  )
}
export function LessonStudentPreview({ lesson }: { lesson: PreviewLesson }) {
  const [mode, setMode] = useState('cpa')
  const [reset, setReset] = useState(0)
  const [size, setSize] = useState('full')
  const [course, setCourse] = useState<ReleaseClass | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('class')
    if (!id) {
      setLoading(false)
      return
    }
    const controller = new AbortController()
    fetch('/api/lesson-access', { signal: controller.signal })
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok)
          throw new Error(d.error ?? 'Could not load class preview settings.')
        const c = (d.classes as ReleaseClass[]).find((c) => c.id === id)
        if (!c)
          throw new Error(
            'This class is not available in your current teacher scope.',
          )
        setCourse(c)
        setMode(c.track === 'honors' ? 'honors' : 'cpa')
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [])
  const doc = useMemo(
    () => {
      if (!lesson.content_blocks) return undefined
      const rewardTrack = mode === 'honors' || (mode === 'teacher' && course?.track === 'honors') ? 'honors' : 'cpa'
      const rewards = lesson.rewardMaps?.[rewardTrack]
      const blocks = lesson.content_blocks.blocks.map(block =>
        rewards ? { ...block, xp: rewards[block.id] ?? 0 } : block,
      )
      return filterDocumentForViewer({ ...lesson.content_blocks, blocks }, {
        role: mode === 'teacher' ? 'admin' : 'student',
        track: mode,
      })
    },
    [lesson.content_blocks, lesson.rewardMaps, mode, course?.track],
  )
  const keys = useMemo(
    () =>
      Object.fromEntries(
        (lesson.content_blocks?.blocks ?? []).flatMap((b) =>
          b.type === 'question' &&
          b.question &&
          typeof b.question === 'object' &&
          'correctOptionId' in b.question
            ? [[b.id, String(b.question.correctOptionId)]]
            : [],
        ),
      ),
    [lesson.content_blocks],
  )
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <label className="text-sm">
          View
          <select
            aria-label="Preview mode"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="ml-2 min-h-11 rounded-lg border bg-background px-3"
          >
            <option value="cpa">Student preview · CPA</option>
            <option value="honors">Student preview · Honors</option>
            <option value="teacher">Teacher view · all sections</option>
          </select>
        </label>
        <label className="text-sm">
          Width
          <select
            aria-label="Preview width"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="ml-2 min-h-11 rounded-lg border bg-background px-3"
          >
            <option value="full">Desktop</option>
            <option value="tablet">Tablet</option>
            <option value="phone">Phone</option>
          </select>
        </label>
        <button
          className="min-h-11 rounded-lg border px-3 text-sm"
          onClick={() => setReset((n) => n + 1)}
        >
          Reset preview answers
        </button>
      </div>
      <p className="text-sm text-muted-foreground">
        {mode === 'teacher'
          ? 'Teacher view can open every section.'
          : 'Try checkpoints and submission with temporary answers.'}{' '}
        Preview never saves student work or changes class access.
        {course
          ? ` Reader settings: ${course.section ?? course.name}.`
          : ' Default reader settings.'}
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error} Return to class access to choose a class.
        </p>
      )}
      {loading ? (
        <p role="status">Loading preview settings…</p>
      ) : !doc?.blocks.length ? (
        <p className="rounded-lg border p-5">
          No student content yet. Add activities in Content.
        </p>
      ) : (
        <div
          className="mx-auto overflow-hidden rounded-xl border"
          style={{
            maxWidth:
              size === 'phone' ? 390 : size === 'tablet' ? 768 : undefined,
          }}
        >
          <BlockLessonViewer
            key={`${mode}:${reset}:${course?.id ?? ''}`}
            preview
            staffView={mode === 'teacher'}
            previewAnswerKeys={keys}
            previewTargets={lesson.targets?.map((t) => ({
              slug: t.slug,
              statement: t.statement,
              self: null,
              teacher: null,
              delta: null,
            }))}
            previewFlags={
              course
                ? {
                    experience: course.lesson_experience ?? 'stepped',
                    gateCheckpoints: course.gate_checkpoints ?? true,
                  }
                : undefined
            }
            lesson={{ ...lesson, content_blocks: doc }}
          />
        </div>
      )}
    </div>
  )
}
