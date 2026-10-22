'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { buildSyllabusReading, type SyllabusCatalog } from '@/lib/reading-syllabus'
import { readingDashboardHref } from '@/lib/reading-dashboard'
import { Button } from '@/components/ui/button'
import AssignmentChapterReader from './interactive/AssignmentChapterReader'
import { interactiveChapterForAssignment } from './interactive/registry'
import { readingFetch } from './ReadingShared'
import { ReadingQuestionText } from './ReadingAssignmentResources'
import styles from './readings.module.css'

/** This page only reads the staff-scoped catalog; previewing never prepares or
 * publishes work. Saved bundles always open the actual editable assignment. */
export default function ReadingSyllabusPreview({ courseId, stepId }: { courseId: string; stepId: string }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [data, setData] = useState<(SyllabusCatalog & { staff: boolean }) | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    setData(null); setError('')
    if (!courseId || !stepId) { setError('Choose a class and reading from the syllabus to preview it.'); return }
    readingFetch<SyllabusCatalog & { staff: boolean }>('/api/reading-syllabus?' + new URLSearchParams({ course_id: courseId }), { signal: controller.signal })
      .then(setData).catch(e => { if (!controller.signal.aborted) setError(e.message) })
    return () => controller.abort()
  }, [courseId, stepId])
  const savedId = data?.staff ? data.bundles.find(bundle => bundle.course_id === courseId && bundle.step_id === stepId)?.reading.id : undefined
  useEffect(() => { if (savedId) router.replace('/readings/' + encodeURIComponent(savedId) + '?reader=interactive') }, [savedId, router])
  const backHref = readingDashboardHref({ view: 'syllabus', courseId, stepId })
  const unavailable = (message: string) => <div className={styles.page}><h1 className="text-title-1">Reading preview</h1><p role="alert">{message}</p><Button asChild><Link href={data && !data.staff ? '/readings' : backHref}>Back to readings</Link></Button></div>
  if (error) return unavailable(error)
  if (!data || savedId || !session?.user?.id) return <p role="status" className="p-6">Opening the selected reading…</p>
  if (!data.staff) return unavailable('Reading preparation previews are available to your teacher. Open your assigned reading from your reading list.')
  const steps = [...data.steps, ...(data.textbookSteps ?? [])]
  const step = steps.find(candidate => candidate.id === stepId)
  const course = data.courses.find(candidate => candidate.id === courseId)
  if (!step || !course) return unavailable('This reading is unavailable for the selected class.')
  if (step.sourceBook === 'openstax' && course.track !== 'honors') return unavailable('Choose an Honors class to preview this OpenStax reading.')
  let sequence = 0
  const assignment = buildSyllabusReading(step, steps, course, slug => data.targets.find(target => target.slug === slug)?.id ?? '', () => `preview-${step.id}-${sequence++}`)
  const definition = interactiveChapterForAssignment(assignment)
  if (!definition) return unavailable('This reading does not fit a single interactive chapter. Open its source reading from the syllabus.')
  return <AssignmentChapterReader definition={definition} teacher assignment={assignment}
    storageKey={`antocci:reader:${session.user.id}:${definition.book}:${definition.chapter}:${definition.language}:${definition.contentVersion}`}
    backLink={<Link href={backHref}>← Back to reading plan</Link>}
    assignmentNotice={<section className={styles.question} aria-label="Preview status"><h2 className="text-title-3">Preview · not yet assigned</h2><p>This is the selected reading and its required response. Return to the reading plan to choose mastery targets and prepare the connected assignments.</p></section>}
    renderQuestion={(question, index) => <article className={styles.question}><h3>Response {index + 1} · {question.reference}</h3><ReadingQuestionText chapter={assignment.chapter} question={question} /><p>{data.targets.find(target => target.id === question.target_id)?.statement}</p></article>}
    assignmentFooter={<Button asChild><Link href={backHref}>Back to reading plan</Link></Button>} />
}
