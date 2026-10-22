'use client'

import { useEffect, useState, type ReactNode } from 'react'
import type { ReadingDetail } from '@/lib/textbook-assignments'
import type { SyllabusBundleView } from '@/lib/reading-syllabus'
import { readingFetch } from '../ReadingShared'
import styles from './learning-path.module.css'

import { learningPathItems } from './learning-path'
import { LearningPathOverview } from './LearningPathOverview'

/** Uses the existing enrolled-student projection. It never creates assignments
 * or sends private practice/notes to a rating endpoint. */
export default function ReadingLearningPath({ assignmentId, courseId, readingState, readingQuiz, onOpen, disabled, children }: {
  assignmentId: string; courseId: string; readingState: string; readingQuiz: ReadingDetail['readingQuiz'];
  onOpen: (href: string) => void; disabled: boolean; children?: ReactNode
}) {
  const [result, setResult] = useState<{ key: string; bundle: SyllabusBundleView | null } | null>(null)
  const [error, setError] = useState(false), [retry, setRetry] = useState(0)
  const key = `${courseId}:${assignmentId}`
  useEffect(() => {
    const controller = new AbortController()
    setError(false)
    readingFetch<{ staff: boolean; bundles: SyllabusBundleView[] }>(`/api/reading-syllabus?course_id=${encodeURIComponent(courseId)}`, { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setResult({ key, bundle: data.staff ? null : data.bundles.find(b => b.reading_id === assignmentId && b.course_id === courseId) ?? null }) })
      .catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [assignmentId, courseId, key, retry])
  if (error) return <>{children}<p className={styles.retry} role="status">Connected activities could not load. Your reading and answers are still available. <button type="button" onClick={() => setRetry(n => n + 1)}>Retry activities</button></p></>
  const bundle = result?.key === key ? result.bundle : null
  if (!bundle) return <>{children}</>
  return <LearningPathOverview items={learningPathItems(bundle, readingState, readingQuiz)} onOpen={onOpen} disabled={disabled} />
}
