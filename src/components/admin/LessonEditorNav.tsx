'use client'
import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { lessonContextHref, safeLessonReturn } from '@/lib/lesson-release'
export default function LessonEditorNav({
  lessonId,
  title,
  unitId,
  day,
  published,
  active,
  canEdit = true,
  children,
}: {
  lessonId: string
  title: string
  unitId?: string | null
  day?: number | null
  published?: boolean
  active: 'build' | 'edit' | 'preview'
  canEdit?: boolean
  children?: ReactNode
}) {
  const [returnTo, setReturnTo] = useState<string | null>(null)
  const [target, setTarget] = useState('')
  const [courseId, setCourseId] = useState('')
  useEffect(() => {
    const p = new URLSearchParams(window.location.search); setCourseId(p.get('class') ?? ''); setReturnTo(safeLessonReturn(p.get('return'))); setTarget(p.get('target') ?? '')
  }, [])
  const href = (path: string) =>
    lessonContextHref(path, {
      class: courseId, return: returnTo, target,
      lesson: lessonId,
      unit: unitId,
      day,
    })
  return (
    <header className="mb-5 space-y-3 border-b pb-4">
      <Link
        className="text-sm underline"
        href={
          returnTo ?? (courseId
            ? href(`/admin/classes/${encodeURIComponent(courseId)}`)
            : canEdit
              ? '/admin/dashboard'
              : '/admin/lesson-access')
        }
      >
        ←{' '}
        {returnTo ? 'Back to library view' : courseId
          ? 'Back to class'
          : canEdit
            ? 'Lesson library'
            : 'Lesson access'}
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {published !== undefined && (
            <p className="text-sm text-muted-foreground">
              Curriculum:{' '}
              {published
                ? 'Published · ready for teachers to release'
                : 'Draft'}
            </p>
          )}
        </div>
        {children}
      </div>
      <nav aria-label="Lesson workflow" className="flex flex-wrap gap-2">
        {(canEdit
          ? [
              ['build', 'Content'],
              ['edit', 'Settings'],
              ['preview', 'Preview'],
            ]
          : [['preview', 'Preview']]
        ).map(([part, label]) => (
          <Link
            key={part}
            href={href(`/admin/lessons/${lessonId}/${part}`)}
            aria-current={part === active ? 'page' : undefined}
            className={`min-h-11 rounded-lg border px-4 py-2 text-sm ${part === active ? 'bg-primary text-primary-foreground' : ''}`}
          >
            {label}
          </Link>
        ))}
        <Link
          className="min-h-11 rounded-lg border px-4 py-2 text-sm"
          href={href('/admin/lesson-access')}
        >
          Class access
        </Link>
        {!courseId && unitId && day!==undefined && <Link className="min-h-11 rounded-lg border px-4 py-2 text-sm" href={href('/admin/teacher/plans')}>Teacher plan</Link>}
        {courseId && (
          <>
            <Link
              className="min-h-11 rounded-lg border px-4 py-2 text-sm"
              href={href('/admin/teacher/plans')}
            >
              Teacher plan
            </Link>
            <Link
              className="min-h-11 rounded-lg border px-4 py-2 text-sm"
              href={href('/admin/command-center')}
            >
              Teach
            </Link>
            <Link
              className="min-h-11 rounded-lg border px-4 py-2 text-sm"
              href={href('/admin/control-room')}
            >
              Review
            </Link>
          </>
        )}
      </nav>
      {published && canEdit && active !== 'preview' && (
        <p className="text-xs text-muted-foreground">
          Saving changes updates this shared published lesson for every class
          using it. Vocabulary has its own Save button.
        </p>
      )}
    </header>
  )
}
