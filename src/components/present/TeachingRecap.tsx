'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bookmark, ArrowLeft, Download, LockKeyhole } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { commandRequest, commandSlides, type CommandLesson, type CommandSlide } from '@/lib/classroom-command'
import type { DeckBlock } from '@/data/content-blocks'
import { useCommandSession } from './useCommandSession'
import { useTeachingTools } from './useTeachingTools'

export default function TeachingRecap({ sessionId }: { sessionId: string }) {
  const { state, error } = useTeachingTools(sessionId)
  const session = useCommandSession(sessionId)
  const [context, setContext] = useState<{ title: string; course: string; slides: CommandSlide[] } | null>(null)
  const [contextError, setContextError] = useState('')
  const lessonId = session.state?.session.lesson_id
  const courseId = session.state?.session.course_id
  useEffect(() => {
    if (!lessonId) return
    const controller = new AbortController()
    setContext(null); setContextError('')
    async function load() {
      const [doc, classes] = await Promise.all([
        commandRequest<{ lesson: CommandLesson; deck: DeckBlock | null }>(`/api/present/document?lesson_id=${encodeURIComponent(lessonId!)}&session_id=${encodeURIComponent(sessionId)}`, { signal: controller.signal }),
        commandRequest<{ courses: { id: string; name: string; section?: string }[] }>('/api/teacher/courses', { signal: controller.signal }),
      ])
      const slides = await commandSlides(doc.lesson, doc.deck, controller.signal).catch(() => [])
      const course = classes.courses.find(c => c.id === courseId)
      if (!controller.signal.aborted) setContext({ title: doc.lesson.title, course: course ? `${course.name}${course.section ? ` · ${course.section}` : ''}` : 'Presentation class', slides })
    }
    void load().catch(e => { if (!controller.signal.aborted) setContextError(e.message) })
    return () => controller.abort()
  }, [lessonId, courseId, sessionId])
  const notes = state?.marks.filter(m => m.kind === 'bookmark') ?? []
  const live = session.state?.session.status === 'live'
  const back = lessonId && courseId ? `/admin/command-center?course=${encodeURIComponent(courseId)}&lesson=${encodeURIComponent(lessonId)}#teaching-bookmarks` : '/admin/command-center'
  const slideTitle = (index: number) => context?.slides[index]?.label
  function download() {
    const text = [context?.title ?? 'Saved teaching notes', context?.course ?? '', '', ...notes.map(m => `Slide ${m.slide + 1}${slideTitle(m.slide) ? ` · ${slideTitle(m.slide)}` : ''}${m.student_id ? ` · ${state?.roster.find(s => s.id === m.student_id)?.name ?? 'Student'}` : ''}: ${m.note}`)].join('\n')
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
    const a = document.createElement('a'); a.href = url; a.download = 'teaching-notes.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
    <Button asChild variant="ghost" className="min-h-12"><Link href={back}><ArrowLeft size={18} aria-hidden />{live ? 'Back to live presentation' : 'Back to Command Center'}</Link></Button>
    <header><p className="text-overline text-primary">After teaching</p><h1 className="mt-2 text-title-1">Saved teaching notes</h1><p className="mt-2 text-muted-foreground">The moments you bookmarked while teaching, linked to the slide you were on.</p></header>
    <Card className="gap-4 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-title-2">{context?.title ?? 'Presentation notes'}</h2><p className="mt-1 text-caption text-muted-foreground">{context?.course ?? 'Loading lesson details…'}{session.state?.session.created_at ? ` · ${new Date(session.state.session.created_at).toLocaleString()}` : ''}</p></div><span className="flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-caption"><LockKeyhole size={14} aria-hidden />Only for teachers</span></div><div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className="text-caption">{notes.length} saved note{notes.length === 1 ? '' : 's'} · {live ? 'Presentation still live' : 'Presentation history'}</p><Button variant="outline" className="min-h-12" disabled={!notes.length} onClick={download}><Download size={16} aria-hidden />Download notes</Button></div></Card>
    {(error || session.error || contextError) && <p role="alert" className="rounded-xl border border-destructive p-4 text-destructive">{error || session.error || contextError}</p>}
    {!state ? <p role="status">Loading your saved notes…</p> : !notes.length ? <Card className="items-center gap-4 border-dashed p-8 text-center"><Bookmark size={32} className="text-primary" aria-hidden /><h2 className="text-title-2">Your first teaching note starts during the lesson</h2><p className="max-w-lg text-muted-foreground">In the Command Center, tap Bookmark. Choose “Revisit this” or write a note such as “Compare both graphs again tomorrow.” We save it with the current slide and any student you select.</p><p className="max-w-lg text-caption text-muted-foreground">This page collects your notes; it does not automatically summarize slides or student answers.</p><Button asChild className="min-h-12"><Link href={back}>{live ? 'Add a note in the live presentation' : 'Open Command Center'}</Link></Button></Card> : <div className="space-y-4">{notes.map(m => <Card key={m.id} className="gap-3 p-5"><div className="flex flex-wrap items-center gap-2"><span className="rounded-lg bg-primary/10 px-3 py-2 text-caption text-primary">Slide {m.slide + 1}</span><h2 className="text-title-3">{slideTitle(m.slide) ?? 'Teaching moment'}</h2><span className="ml-auto text-caption text-muted-foreground">{new Date(m.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span></div>{m.student_id && <p className="text-caption text-muted-foreground">Student · {state.roster.find(s => s.id === m.student_id)?.name ?? 'Student'}</p>}<p className="whitespace-pre-wrap text-body">{m.note}</p></Card>)}</div>}
  </div>
}
