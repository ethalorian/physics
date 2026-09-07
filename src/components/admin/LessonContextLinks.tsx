'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { lessonContextHref } from '@/lib/lesson-release'
export default function LessonContextLinks({
  courseId,
  lessonId,
  unitId,
  day,
}: {
  courseId?: string | null
  lessonId?: string | null
  unitId?: string | null
  day?: number | null
}) {
  const [saved, setSaved] = useState<{
    class?: string
    lesson?: string
    unit?: string
    day?: number
  }>({})
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setSaved({
      class: p.get('class') ?? undefined,
      lesson: p.get('lesson') ?? undefined,
      unit: p.get('unit') ?? undefined,
      day: p.has('day') ? Number(p.get('day')) : undefined,
    })
  }, [])
  const changedLesson = lessonId !== undefined && lessonId !== saved.lesson
  const changedPlan =
    (unitId !== undefined && unitId !== saved.unit) ||
    (day !== undefined && day !== saved.day)
  const context = {
    class: courseId ?? saved.class,
    lesson: lessonId ?? (changedPlan ? undefined : saved.lesson),
    unit: unitId ?? (changedLesson ? undefined : saved.unit),
    day: day ?? (changedLesson ? undefined : saved.day),
  }
  if (!context.class && !context.lesson) return null
  const links = [
    ...(context.class
      ? [
          [
            `/admin/classes/${encodeURIComponent(context.class)}`,
            'Back to class',
          ],
        ]
      : []),
    ['/admin/lesson-access', 'Class access'],
    ...(context.lesson
      ? [
          [
            `/admin/lessons/${encodeURIComponent(context.lesson)}/preview`,
            'Student preview',
          ],
        ]
      : []),
    ['/admin/teacher/plans', 'Teacher plan'],
    ['/admin/command-center', 'Teach'],
    ['/admin/control-room', 'Review'],
  ]
  return (
    <nav
      aria-label="Selected lesson workflow"
      className="mb-4 flex flex-wrap gap-2"
    >
      {links.map(([path, label]) => (
        <Link
          key={path}
          className="min-h-11 rounded-lg border px-3 py-2 text-sm"
          href={lessonContextHref(path, context)}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
