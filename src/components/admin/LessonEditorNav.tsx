'use client'
import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import LessonWorkspaceNav from './LessonWorkspaceNav'
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
      <LessonWorkspaceNav lessonId={lessonId} title={title} published={published} active={active==='preview'?'preview':'prepare'}/>
      <nav aria-label="Lesson editing" className="flex flex-wrap gap-2">
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
      </nav>
      {children}
      {published && canEdit && active !== 'preview' && (
        <p className="text-xs text-muted-foreground">
          Saving changes updates this shared published lesson for every class
          using it. Vocabulary has its own Save button.
        </p>
      )}
    </header>
  )
}
