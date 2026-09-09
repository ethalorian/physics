'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import ProjectionPanel from '@/components/present/ProjectionPanel'
import LessonContextLinks from '@/components/admin/LessonContextLinks'
import { MonitorPlay, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import MathMarkdown from '@/components/MathMarkdown'
import TeachingTools from '@/components/present/TeachingTools'
import { useTeachingTools } from '@/components/present/useTeachingTools'
import { projectorStatus } from '@/lib/presentation-tools'
import CommandLobby from '@/components/present/CommandLobby'
import { useCommandSession } from '@/components/present/useCommandSession'
import { useTimerLeft, fmtTimer } from '@/components/lessons/PresentLiveProvider'
import { paginateBlocks } from '@/data/content-blocks'
import { sectionAnchor, sectionIndexForAnchor } from '@/lib/lesson-anchors'
import { sectionForSlide } from '@/lib/present-bridge'
import { commandRequest, commandSlides, commandQuestion, type CommandSlide, type PresentationData } from '@/lib/classroom-command'
import { useViewAs } from '@/lib/use-view-as'

interface Course { id: string; name: string; section: string | null }
interface LessonChoice { id: string; title: string }
const fieldClass = 'min-h-12 w-full min-w-0 rounded-xl border bg-background px-3 text-base'

export default function CommandCenterPage() {
  const { role } = useViewAs()
  const staff = role === 'admin' || role === 'teacher'
  const [courses, setCourses] = useState<Course[]>([])
  const [courseId, setCourseId] = useState('')
  const [activeSessions, setActiveSessions] = useState<{ id: string; lesson_id: string; course_id: string; current_slide: number }[]>([])
  const requestedLesson = useRef('')
  const [attachVersion, setAttachVersion] = useState(0)
  const [history, setHistory] = useState<{ id: string; created_at: string; lesson_id: string }[]>([])
  const [lessons, setLessons] = useState<LessonChoice[]>([])
  const [lessonId, setLessonId] = useState('')
  const [presentation, setPresentation] = useState<PresentationData | null>(null)
  const [slides, setSlides] = useState<CommandSlide[]>([])
  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [origin, setOrigin] = useState('')
  const [retry, setRetry] = useState(0)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const pending = useRef(false)
  const ending = useRef(false)
  const [endingId, setEndingId] = useState('')
  const { state, error: connectionError, busy, patch } = useCommandSession(presentation?.session?.id ?? null)
  const teaching = useTeachingTools(presentation?.session?.id ?? null)
  const [clock, setClock] = useState(Date.now())
  useEffect(() => { const timer = setInterval(() => setClock(Date.now()), 1000); return () => clearInterval(timer) }, [])
  const live = state?.session.status === 'live'
  const left = useTimerLeft(state?.session.timer_ends_at)
  const lesson = presentation?.lesson
  const pages = useMemo(() => paginateBlocks(lesson?.content_blocks.blocks ?? []), [lesson])
  const poll = lesson?.content_blocks.blocks.find(b => b.id === state?.session.poll_block_id)
  const pollable = lesson?.content_blocks.blocks.filter(b => Boolean(commandQuestion(b)?.options?.length)) ?? []
  const locked = busy || starting || loading
  useEffect(() => { setOrigin(window.location.origin); const p=new URLSearchParams(window.location.search); requestedLesson.current=p.get('lesson')??''; if(p.get('class'))setCourseId(p.get('class')!) }, [])
  useEffect(() => {
    if (state?.session.status === 'ended') {
      setPresentation({ session: null, lesson: null, deck: null })
      setNotice('This presentation has ended. You can start a new one.')
    }
  }, [state?.session.status])
  useEffect(() => {
    if (!staff) return
    const controller = new AbortController()
    commandRequest<{ courses: Course[] }>('/api/teacher/courses', { signal: controller.signal }).then(d => { setCourses(d.courses); setCourseId(old => old || d.courses[0]?.id || '') }).catch(e => { if (!controller.signal.aborted) setError(e.message) })
    return () => controller.abort()
  }, [staff, retry])
  useEffect(() => {
    if (!staff || live) return
    const controller = new AbortController()
    const refresh = () => commandRequest<{ sessions: typeof activeSessions }>('/api/present/sessions?active=1', { signal: controller.signal })
      .then(d => { if (!controller.signal.aborted) setActiveSessions(d.sessions) })
      .catch(e => { if (!controller.signal.aborted) setError(`Could not find live presentations. ${e.message}`) })
    void refresh()
    const timer = setInterval(refresh, 5000)
    return () => { controller.abort(); clearInterval(timer) }
  }, [staff, live, retry])
  useEffect(() => {
    if (!courseId) return
    const controller = new AbortController()
    setLessons([]); setLessonId(requestedLesson.current); requestedLesson.current = ''; setPresentation(null); setLoading(true)
    commandRequest<{ lessons: LessonChoice[] }>(`/api/lessons/published?course_id=${encodeURIComponent(courseId)}`, { signal: controller.signal }).then(d => { if (!controller.signal.aborted) setLessons(d.lessons) }).catch(e => { if (!controller.signal.aborted) setError(e.message) }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [courseId, retry])
  useEffect(() => {
    if (!courseId) return
    const controller = new AbortController()
    commandRequest<{ sessions: { id: string; created_at: string; lesson_id: string }[] }>(`/api/present/sessions?history=1&course_id=${encodeURIComponent(courseId)}`, { signal: controller.signal }).then(d => setHistory(d.sessions)).catch(() => {})
    return () => controller.abort()
  }, [courseId, live])
  useEffect(() => {
    if (!lessonId) return
    const controller = new AbortController()
    setLoading(true); setError(''); setPresentation(null)
    commandRequest<PresentationData>(`/api/present/sessions?lesson_id=${encodeURIComponent(lessonId)}&course_id=${encodeURIComponent(courseId)}`, { signal: controller.signal }).then(d => { if (!controller.signal.aborted) setPresentation(d) }).catch(e => { if (!controller.signal.aborted) setError(e.message) }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [courseId, lessonId, attachVersion])
  useEffect(() => {
    if (!presentation?.lesson) { setSlides([]); return }
    const controller = new AbortController()
    setSlides([])
    commandSlides(presentation.lesson, presentation.deck, controller.signal).then(d => { if (!controller.signal.aborted) setSlides(d) }).catch(e => { if (!controller.signal.aborted) setError(e.message) })
    return () => controller.abort()
  }, [presentation])
  async function endListed(id: string) {
    if (ending.current) return
    ending.current = true; setEndingId(id); setError('')
    try {
      await commandRequest('/api/present/sessions/' + encodeURIComponent(id), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'ended' }) })
      setActiveSessions(old => old.filter(s => s.id !== id))
      setNotice('Presentation ended. Saved notes and student work are kept.')
      setRetry(n => n + 1)
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not end the presentation.') }
    finally { ending.current = false; setEndingId('') }
  }
  async function start() {
    if (pending.current || !courseId || !lessonId) return
    pending.current = true; setStarting(true); setError('')
    try { setPresentation(await commandRequest<PresentationData>('/api/present/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lesson_id: lessonId, course_id: courseId }) })) }
    catch(e) { setError(e instanceof Error ? e.message : 'Could not start') }
    finally { pending.current = false; setStarting(false) }
  }
  function go(index: number) {
    const slide = slides[index]
    if (!slide || !state) return
    const section = slide.anchor ? sectionIndexForAnchor(pages, slide.anchor) : presentation?.deck?.slideMap?.length ? sectionForSlide(index, pages.length, presentation.deck.slideMap) : -1
    void patch({ projected_block_id: null, current_slide: index, current_anchor: section >= 0 ? sectionAnchor(pages[section]) : null })
  }
  async function end() {
    if (await patch({ status: 'ended', poll_block_id: null, timer_seconds: null, blackout: false })) { setConfirmEnd(false); setNotice('Presentation ended. The classroom screen is blank.'); setPresentation({ session: null, lesson: null, deck: null }) }
  }
  const projectorPath = presentation?.session ? `/admin/projector?session=${encodeURIComponent(presentation.session.id)}` : ''
  async function copyLink() {
    try { await navigator.clipboard.writeText(`${origin}${projectorPath}`); setNotice('Projector link copied. Open it on the classroom computer.') }
    catch { setNotice(`Open this address on the classroom computer: ${origin}${projectorPath}`) }
  }
  const current = state?.session.current_slide ?? 0
  if (!staff) return <p className="p-6">The Command Center is available to teachers and administrators.</p>
  return <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6" style={{ touchAction: 'manipulation', paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
    <header className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 p-6"><div><div className="text-overline text-muted-foreground">Teach live</div><LessonContextLinks courseId={courseId} lessonId={lessonId} /><h1 className="text-display mt-4 flex items-center gap-3 text-primary"><MonitorPlay aria-hidden />iPad Command Center</h1><p className="mt-2 text-title-3 text-muted-foreground">Big ideas. Shared discoveries. Your classroom, in motion.</p></div><Button asChild variant="outline" className="min-h-12"><Link href="/admin/observe" target="_blank">Observe & give feedback</Link></Button></header>
    {(error || connectionError) && <div role="alert" className="rounded-xl border border-destructive p-3 text-destructive">{error || connectionError}{!live && <Button className="ml-2 min-h-12" variant="outline" onClick={() => setRetry(n => n + 1)}>Reload</Button>}</div>}
    {teaching.error && <p role="alert" className="text-destructive">{teaching.error}</p>}
    {notice && <p role="status" className="break-words">{notice}</p>}
    {!presentation?.session && <div className="grid gap-3 sm:grid-cols-3">{[['1','Start on your Mac','Choose the class and lesson, then open its projector window.'],['2','Connect your iPad','Sign in with the same account and choose the running presentation.'],['3','Teach from anywhere','Switch slides, project lesson blocks, and launch activities.']].map(([step,title,detail]) => <div key={step} className="rounded-xl border bg-card p-4"><span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-title-3 text-primary">{step}</span><h2 className="mt-2 text-title-3">{title}</h2><p className="mt-1 text-caption text-muted-foreground">{detail}</p></div>)}</div>}
    {!live && activeSessions.length > 0 && <Card className="gap-3 p-4"><h2 className="text-title-2">Presentations already running</h2><p className="text-caption text-muted-foreground">Take control of the session you started on your Mac. Keep its presentation page and projector window open.</p>{activeSessions.map(s => <div key={s.id} className="flex flex-wrap items-center justify-between gap-3"><span>{courses.find(c => c.id === s.course_id)?.name ?? 'Live presentation'} · {lessons.find(l => l.id === s.lesson_id)?.title ?? 'Presentation'} · Slide {s.current_slide + 1}</span><Button className="min-h-12" disabled={locked || Boolean(endingId) || !courses.some(c => c.id === s.course_id)} onClick={() => { if (courseId !== s.course_id) { requestedLesson.current = s.lesson_id; setCourseId(s.course_id) } else setLessonId(s.lesson_id); setAttachVersion(n => n + 1) }}>Control this presentation</Button><Button variant="outline" className="min-h-12" disabled={Boolean(endingId)} onClick={() => endListed(s.id)}>{endingId === s.id ? 'Ending…' : 'End presentation'}</Button></div>)}</Card>}
    <Card className="gap-3 p-4"><fieldset disabled={locked || Boolean(presentation?.session)} className="grid min-w-0 gap-3 sm:grid-cols-2"><label className="min-w-0 text-caption">Class<select aria-label="Class" className={fieldClass} value={courseId} onChange={e => setCourseId(e.target.value)}><option value="">Choose class</option>{courses.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ` · ${c.section}` : ''}</option>)}</select></label><label className="min-w-0 text-caption">Lesson<select aria-label="Lesson" className={fieldClass} value={lessonId} onChange={e => setLessonId(e.target.value)}><option value="">Choose lesson</option>{lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}</select></label></fieldset>
      {!presentation?.session ? <><Button className="min-h-14" disabled={!courseId || !lessonId || locked || !presentation} onClick={start}>{loading ? 'Checking presentation…' : starting ? 'Starting…' : 'Start presentation'}</Button><p className="text-caption text-muted-foreground">An existing live presentation for this lesson and class reconnects automatically.</p></> : <div className="flex flex-wrap items-center gap-2"><span className="mr-auto text-caption">{live ? 'Live session connected' : state?.session.status === 'ended' ? 'Session ended' : 'Connecting…'}</span><Button className="min-h-12" variant="outline" onClick={copyLink}>Copy projector link</Button><Button asChild className="min-h-12" variant="outline"><Link href={projectorPath} target="_blank">Open projector connection</Link></Button></div>}
    </Card>
    {!live && history.length > 0 && <Card className="gap-3 p-4"><h2 className="text-title-2">Saved teaching notes</h2>{history.map(h => <Button key={h.id} asChild variant="outline" className="h-auto min-h-12 justify-start whitespace-normal"><Link href={`/admin/command-center/recap?session=${h.id}`}>{lessons.find(l => l.id === h.lesson_id)?.title ?? 'Lesson'} · {new Date(h.created_at).toLocaleString()}</Link></Button>)}</Card>}
    {live && state && lesson && <>
      <ProjectionPanel seiEnabled={teaching.state?.tools?.sei_enabled ?? false} seiBusy={teaching.busy || !teaching.state} onSeiChange={enabled => { void teaching.action({ action: 'sei_supports', enabled }) }} lesson={lesson} live={state} slideLabel={slides[current]?.label} pulseOpen={teaching.state?.pulse?.status === 'open'} busy={busy} patch={patch} returnToDeck={() => go(current)} />
      <nav aria-label="Live teaching tools" className="sticky top-20 z-20 flex flex-nowrap gap-2 overflow-x-auto rounded-xl border bg-background/95 p-2 shadow-sm backdrop-blur">{[['projector-controls','Projector'],['deck-controls','Deck'],['live-activities','Activities'],['help-queue','Who needs me?'],['pulse-checks','Pulse check'],['student-picker','Pick student'],['teaching-bookmarks','Bookmark']].map(([id,label]) => <Button key={id} asChild variant="outline" className="min-h-12 shrink-0"><a href={`#${id}`}>{label}</a></Button>)}</nav>
      <Card className="gap-3 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><p role="status" className="font-semibold">{teaching.state ? projectorStatus(state, teaching.state, clock) : 'Checking projector…'}</p><Button variant="outline" className="min-h-12" disabled={teaching.busy} onClick={() => teaching.action({ action: 'reconnect' })}>Reconnect projector</Button></div><p className="text-caption text-muted-foreground">Confirmation means the projector window applied the latest command. If its window is closed, reopen it on the classroom computer.</p><Button asChild variant="outline" className="min-h-12"><Link href={`/admin/command-center/recap?session=${state.session.id}`} target="_blank">Saved teaching notes</Link></Button></Card>
      <Card id="deck-controls" className="gap-4 p-5 scroll-mt-40"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-overline text-muted-foreground">Deck controls</div><h2 className="text-title-2">{slides[current]?.label ?? lesson.title}</h2><p className="text-caption">Slide {current + 1}{slides.length ? ` of ${slides.length}` : ''}</p></div><Button variant="outline" className="min-h-14" disabled={busy} aria-pressed={state.session.blackout} onClick={() => patch({ blackout: !state.session.blackout })}>{state.session.blackout ? 'Show screen' : 'Blank screen'}</Button></div><div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-2"><Button aria-label="Previous slide" className="min-h-16 min-w-16" disabled={busy || current === 0 || !slides.length} onClick={() => go(current - 1)}><ChevronLeft /></Button><select aria-label="Jump to slide" className={fieldClass} disabled={busy || !slides.length} value={current} onChange={e => go(Number(e.target.value))}>{slides.map((s, i) => <option key={i} value={i}>{i + 1}. {s.label}</option>)}</select><Button aria-label="Next slide" className="min-h-16 min-w-16" disabled={busy || !slides.length || current >= slides.length - 1} onClick={() => go(current + 1)}><ChevronRight /></Button></div>{slides[current]?.notes && <div className="rounded-xl bg-muted p-3"><div className="text-overline text-muted-foreground">Your speaker notes</div><p className="whitespace-pre-wrap">{slides[current].notes}</p></div>}{presentation?.deck && !presentation.deck.slideMap?.length && !slides[current]?.anchor && <p className="text-caption text-muted-foreground">This slide has no section mapping. Student follow stays unchanged.</p>}</Card>
      <Card className="gap-3 p-4"><div className="flex flex-wrap items-center gap-3"><h2 className="text-title-2 mr-auto">Activity timer</h2>{left !== null && <span role="timer" className="text-title-1 tabular-nums">{fmtTimer(left)}</span>}</div><div className="flex flex-wrap gap-2">{[1,3,5,10].map(m => <Button key={m} variant="outline" className="min-h-12 flex-1" disabled={busy} onClick={() => patch({ timer_seconds: m * 60 })}>{m} min</Button>)}<Button variant="ghost" className="min-h-12" disabled={busy || left === null} onClick={() => patch({ timer_seconds: null })}>Clear timer</Button></div></Card>
      <div id="live-activities" className="grid items-start gap-4 xl:grid-cols-2 scroll-mt-40"><Card className="min-w-0 gap-3 p-4"><h2 className="text-title-2">Live poll</h2><p className="text-muted-foreground">Use a lesson checkpoint. Students respond on their devices.</p>{poll?.type === 'question' ? <><MathMarkdown content={commandQuestion(poll)!.prompt} /><p className="text-caption">{state.saved} of {state.enrolled} saved · {state.session.poll_revealed ? 'Revealed' : state.session.poll_locked ? 'Locked' : 'Accepting responses'}</p>{commandQuestion(poll)!.options?.map(o => <div key={o.id} className="rounded-xl border p-3"><div className="flex justify-between gap-2"><MathMarkdown content={o.text} /><span className="tabular-nums">{state.tally[o.id] ?? 0}</span></div>{state.session.poll_revealed && presentation?.answerKeys?.[poll.id] === o.id && <p className="text-caption" style={{ color: 'var(--viz-up)' }}>Correct answer</p>}</div>)}<div className="flex flex-wrap gap-2"><Button className="min-h-12" disabled={busy} onClick={() => patch({ discussion: teaching.state?.tools?.discussion_block_id === state.session.poll_block_id ? 'revote' : 'start' })}>{teaching.state?.tools?.discussion_block_id === state.session.poll_block_id ? 'Start fresh vote' : 'Pause & discuss · 90 sec'}</Button><Button className="min-h-12" variant="outline" disabled={busy || state.session.poll_revealed} onClick={() => patch({ poll_locked: !state.session.poll_locked })}>{state.session.poll_locked ? 'Reopen responses' : 'Lock responses'}</Button><Button className="min-h-12" disabled={busy || state.session.poll_revealed} onClick={() => patch({ poll_revealed: true })}>Reveal results</Button><Button className="min-h-12" variant="outline" disabled={busy} onClick={() => patch({ poll_block_id: null })}>Close poll</Button></div></> : pollable.length ? pollable.map(b => b.type === 'question' && <Button key={b.id} variant="outline" className="h-auto min-h-14 justify-start whitespace-normal p-3 text-left" disabled={busy || Boolean(state.lobby) || teaching.state?.pulse?.status === 'open'} onClick={() => patch({ poll_block_id: b.id })}>{commandQuestion(b)!.prompt}</Button>) : <p>No multiple-choice checkpoints in this lesson.</p>}</Card><Card className="min-w-0 gap-3 p-4"><CommandLobby key={state.session.id} lesson={lesson} live={state} pulseOpen={teaching.state?.pulse?.status === 'open'} /></Card></div>
      {teaching.state && <TeachingTools key={state.session.id} live={state} state={teaching.state} busy={busy || teaching.busy} action={teaching.action} patch={patch} />}
      <div className="flex flex-wrap items-center gap-3 border-t pt-4">{confirmEnd ? <><p>End this presentation and blank the classroom screen?</p><Button variant="destructive" className="min-h-12" disabled={busy} onClick={end}>End presentation now</Button><Button variant="outline" className="min-h-12" onClick={() => setConfirmEnd(false)}>Keep teaching</Button></> : <Button variant="outline" className="min-h-12" onClick={() => setConfirmEnd(true)}>End presentation</Button>}<p className="text-caption text-muted-foreground">Slides stay active while you use observations in another tab.</p></div>
    </>}
  </div>
}
