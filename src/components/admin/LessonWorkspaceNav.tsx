'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { conceptTitle } from '@/lib/video-instruction'
import { useRouter } from 'next/navigation'
import { useLessonContext } from './useLessonContext'
import { appliesToClass, classLabel, lessonContextHref, releaseStatus, type ReleaseData } from '@/lib/lesson-release'

export default function LessonWorkspaceNav({ lessonId, title, published, active = 'prepare' }: { lessonId: string; title: string; published?: boolean; active?: 'prepare' | 'preview' | 'teach' | 'work' }) {
  const router = useRouter()
  const context = useLessonContext()
  const [data, setData] = useState<ReleaseData | null>(null)
  const [error, setError] = useState('')
  const [running, setRunning] = useState(false)
  useEffect(() => {
    const abort = new AbortController()
    fetch('/api/lesson-access', { signal: abort.signal }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error ?? 'Class settings unavailable'); setData(d) }).catch(e => { if (!abort.signal.aborted) setError(e.message) })
    return () => abort.abort()
  }, [])
  const lesson = data?.lessons.find(l => l.id === lessonId)
  const classes = data?.classes.filter(c => !lesson || appliesToClass(lesson, c)) ?? []
  const classId = classes.some(c => c.id === context.classId) ? context.classId : ''
  useEffect(() => {
    if (!classId) { setRunning(false); return }
    const abort = new AbortController()
    fetch('/api/present/sessions?active=1', { signal: abort.signal }).then(r => r.ok ? r.json() : null).then(d => setRunning(Boolean(d?.sessions?.some((s: {lesson_id:string;course_id:string}) => s.lesson_id === lessonId && s.course_id === classId)))).catch(() => {})
    return () => abort.abort()
  }, [classId, lessonId])
  function select(value: string) {
    const url = new URL(window.location.href); if(value)url.searchParams.set('class', value);else url.searchParams.delete('class'); url.searchParams.set('lesson', lessonId)
    window.history.replaceState(window.history.state, '', url)
    context.remember({ classId: value, lessonId })
    window.dispatchEvent(new Event('popstate'))
    router.refresh()
  }
  const href = (path: string) => lessonContextHref(path, { class: classId, lesson: lessonId })
  return <header className="mb-5 space-y-4 border-b pb-5">
    <Link className="inline-flex min-h-11 items-center text-sm underline" href={href('/admin/dashboard')}>← Lessons</Link>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-muted-foreground">Selected lesson</p><h1 className="text-2xl font-semibold">{conceptTitle(title)}</h1></div><label className="text-sm">Class<select aria-label="Workspace class" className="ml-2 min-h-11 rounded-lg border bg-background px-3" value={classId} onChange={e => select(e.target.value)}><option value="">Choose a class</option>{classes.map(c => <option key={c.id} value={c.id}>{classLabel(c)}</option>)}</select></label></div>
    <p className="text-sm text-muted-foreground">{published ? 'Published' : 'Draft'} · Student access: {classId && data ? releaseStatus(data.windows[`${classId}|${lessonId}`]) : 'choose a class'} · {running ? 'Presentation running' : 'No presentation running'}</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <nav aria-label="Lesson workspace" className="flex flex-wrap gap-2">{([
      ['prepare', 'Prepare', `/admin/lessons/${lessonId}`], ['preview', 'Student preview', `/admin/lessons/${lessonId}/preview`], ['teach', running ? 'Resume teaching' : 'Teach', '/admin/command-center'], ['work', 'Student work', '/admin/control-room'],
    ] as const).map(([part,label,path]) => <Link key={part} aria-current={active === part ? 'page' : undefined} className={`inline-flex min-h-11 items-center rounded-lg border px-4 text-sm ${active === part ? 'bg-primary text-primary-foreground' : ''}`} href={href(path)} onClick={() => context.remember({classId,lessonId})}>{label}</Link>)}</nav>
  </header>
}
