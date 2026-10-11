'use client'
import DeckActivities from '@/components/present/DeckActivities'
import type { DeckActivity } from '@/lib/deck-activities'
import TeachingPoll from '@/components/present/TeachingPoll'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { conceptTitle } from '@/lib/video-instruction'
import dynamic from 'next/dynamic'
import { projectedBlockPages } from '@/lib/projected-block'
import TeachingToolControls from '@/components/teaching-tools/TeachingToolControls'
import { supportsTeachingTool } from '@/lib/teaching-tool-spec'
import ProjectionPanel from '@/components/present/ProjectionPanel'
import ProjectorConnection from '@/components/present/ProjectorConnection'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import styles from './command-center.module.css'
import { MonitorPlay, ChevronLeft, ChevronRight, ArrowLeft, BookOpen, Users, StickyNote, Radio, Check, Settings2 } from 'lucide-react'
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
import TeachingDisplay from '@/components/present/TeachingDisplay'
import { rehearsalState } from '@/lib/teaching-rehearsal'
import { useLessonContext } from '@/components/admin/useLessonContext'
import { planPresentationKey, planTarget, presentationKey, presentationQuery, presentationTarget, type PlanPresentationChoice, type PresentationIdentity } from '@/lib/course-plan-presentation'
import { useViewAs } from '@/lib/use-view-as'

interface Course { id: string; name: string; section: string | null }
type SavedPresentation = PresentationIdentity & {id: string; course_id: string; current_slide: number; created_at: string}
const fieldClass = 'min-h-12 w-full min-w-0 rounded-xl border bg-background px-3 text-base'
const LivePreview = dynamic(() => import('@/components/present/LivePreview'), { loading: () => <p>Loading classroom preview…</p>, ssr: false })

export default function CommandCenterPage() {
  const { role } = useViewAs()
  const context = useLessonContext()
  const [display,setDisplay] = useState('computer')
  const [mode,setMode] = useState<'live'|'rehearse'|'slides'>('live')
  const [local,setLocal] = useState<ReturnType<typeof rehearsalState>|null>(null)
  const [mirror,setMirror] = useState(false)
  const [initialized,setInitialized] = useState(false)
  const [search,setSearch] = useState('')
  const [unitId,setUnitId] = useState('')
  const [track,setTrack] = useState('cpa')
  const restoreContext = useRef(false)
  useEffect(()=>{try{setDisplay(localStorage.getItem('teaching-display')??'computer')}catch{}},[])
  useEffect(()=>{if(!context.ready||restoreContext.current)return;restoreContext.current=true;const p=new URLSearchParams(window.location.search);if(!p.get('class')&&!p.get('course')&&context.classId){setCourseId(context.classId)}},[context.ready,context.classId])

  const staff = role === 'admin' || role === 'teacher'
  const [courses, setCourses] = useState<Course[]>([])
  const [courseId, setCourseId] = useState('')
  const [activeSessions, setActiveSessions] = useState<SavedPresentation[]>([])
  const requestedLesson = useRef('')
  const [attachVersion, setAttachVersion] = useState(0)
  const [history, setHistory] = useState<SavedPresentation[]>([])
  const [lessons, setLessons] = useState<PlanPresentationChoice[]>([])
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
  const [view, setView] = useState('teach')
  const [deckChoice,setDeckChoice]=useState<{activity:DeckActivity;mode:'solo'|'lobby';sessionId:string;key:number}|null>(null)
  const [discussionChoice,setDiscussionChoice]=useState<{blockId?:string;frame?:number;source?:'lesson'|'textbook';prompt?:string;targetId?:string|null;key:number}>({key:0})
  const [showContent, setShowContent] = useState(false)
  const [showConnection, setShowConnection] = useState(false)
  const [tablet, setTablet] = useState(false)
  const [finished, setFinished] = useState<{ id: string; title: string } | null>(null)
  // Keep the computer's bridge mounted through tab changes and the finish screen.
  const [bridgeId, setBridgeId] = useState<string | null>(null)
  const contentButton = useRef<HTMLButtonElement>(null)
  const finishButton = useRef<HTMLButtonElement>(null)
  const pending = useRef(false)
  const ending = useRef(false)
  const [endingId, setEndingId] = useState('')
  const { state, error: connectionError, busy, patch } = useCommandSession(presentation?.session?.id ?? null)
  const teaching = useTeachingTools(presentation?.session?.id ?? null)
  const [clock, setClock] = useState(Date.now())
  useEffect(() => { const timer = setInterval(() => setClock(Date.now()), 1000); return () => clearInterval(timer) }, [])
  const live = state?.session.status === 'live'
  const left = useTimerLeft(state?.session.timer_ends_at)
  const isPlan = Boolean(presentation?.plan || state?.session.plan_unit_id)
  const lesson = presentation?.lesson
  const pages = useMemo(() => paginateBlocks(lesson?.content_blocks.blocks ?? []), [lesson])
  const poll = lesson?.content_blocks.blocks.find(b => b.id === state?.session.poll_block_id)
  const pollable = lesson?.content_blocks.blocks.filter(b => Boolean(commandQuestion(b)?.options?.length)) ?? []
  const locked = busy || starting || loading
  useEffect(() => {
    setOrigin(window.location.origin)
    setTablet(navigator.maxTouchPoints > 1 && /Mac|iPad|iPhone/.test(navigator.platform))
    const params = new URLSearchParams(window.location.search)
    const unit=params.get('unit'),day=Number(params.get('day'))
    requestedLesson.current = unit && Number.isSafeInteger(day) && day>0 ? planPresentationKey(unit,day) : params.get('lesson') ?? ''
    if(unit)setUnitId(unit)
    if(params.get('resume')==='1')setAttachVersion(1)
    if(params.get('display')==='mirror')setMirror(true)
    setInitialized(true)
    const course = params.get('course') ?? params.get('class')
    if (course) setCourseId(course)
    if (window.location.hash === '#teaching-bookmarks') setView('notes')
  }, [])
  useEffect(() => {
    if (state?.session.status !== 'ended' || !presentation?.session) return
    setFinished({ id: state.session.id, title: presentation?.lesson?.title ?? 'Presentation' })
    setConfirmEnd(false); setShowContent(false); setShowConnection(false)
    setPresentation(null); setLessonId(''); setNotice('')
    setActiveSessions(old => old.filter(s => s.id !== state.session.id))
    const url = new URL(window.location.href)
    for(const key of ['lesson','unit','day','resume'])url.searchParams.delete(key); url.hash = ''
    window.history.replaceState(window.history.state, '', url)
  }, [state?.session.status, state?.session.id, presentation?.lesson?.title, presentation?.session])
  useEffect(() => {
    if (!staff) return
    const controller = new AbortController()
    commandRequest<{ courses: Course[] }>('/api/teacher/courses', { signal: controller.signal }).then(d => { setCourses(d.courses); setCourseId(old => d.courses.some(c=>c.id===old)?old:'') }).catch(e => { if (!controller.signal.aborted) setError(e.message) })
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
    if (!courseId) { setLessons([]); setLessonId(''); setPresentation(null); return }
    const controller = new AbortController()
    setLessons([]); setLessonId(requestedLesson.current); requestedLesson.current = ''; setPresentation(null); setLocal(null); setLoading(true)
    commandRequest<{ plans: PlanPresentationChoice[]; track: string }>(`/api/present/plans?course_id=${encodeURIComponent(courseId)}`, { signal: controller.signal }).then(d => { if (!controller.signal.aborted) { setLessons(d.plans); setTrack(d.track); setUnitId(old=>d.plans.some(p=>p.unit_id===old)?old:d.plans[0]?.unit_id??'') } }).catch(e => { if (!controller.signal.aborted) setError(e.message) }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [courseId, retry])
  useEffect(() => {
    if (!courseId) return
    const controller = new AbortController()
    commandRequest<{ sessions: SavedPresentation[] }>(`/api/present/sessions?history=1&course_id=${encodeURIComponent(courseId)}`, { signal: controller.signal }).then(d => setHistory(d.sessions)).catch(() => {})
    return () => controller.abort()
  }, [courseId, live])
  useEffect(() => {
    if (!lessonId || !courseId) return
    const controller = new AbortController()
    setLoading(true); setError(''); setPresentation(null)
    commandRequest<PresentationData>(`/api/present/sessions?${presentationQuery(lessonId)}&course_id=${encodeURIComponent(courseId)}${attachVersion?'':'&prepare=1'}`, { signal: controller.signal }).then(d => { if (!controller.signal.aborted) setPresentation(d) }).catch(e => { if (!controller.signal.aborted) setError(e.message) }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [courseId, lessonId, attachVersion, retry])
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
    context.remember({classId:courseId,lessonId:planTarget(lessonId)?'':lessonId})
    if(mode!=='live'){setLocal(rehearsalState(lessonId,courseId));return}
    if(display==='mirror')setMirror(true)
    pending.current = true; setStarting(true); setError(''); setFinished(null); setNotice(''); setView('teach'); setShowConnection(display==='computer'&&!tablet)
    try { setPresentation(await commandRequest<PresentationData>('/api/present/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...presentationTarget(lessonId), course_id: courseId }) })) }
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
    if (ending.current || !state) return
    ending.current = true; setEndingId(state.session.id); setError('')
    try {
      if (state.lobby) await commandRequest('/api/lobby/sessions/' + state.lobby.id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'closed' }) })
      if (teaching.state?.pulse?.status === 'open' && !await teaching.action({ action: 'close_pulse' })) return
      await patch({ status: 'ended', poll_block_id: null, timer_seconds: null, blackout: false })
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not finish the presentation. Please retry.') }
    finally { ending.current = false; setEndingId('') }
  }
  const projectorPath = presentation?.session ? `/admin/projector?session=${encodeURIComponent(presentation.session.id)}` : ''
  async function copyLink() {
    try { await navigator.clipboard.writeText(`${origin}${projectorPath}`); setNotice('Projector link copied. Open it on the classroom computer.') }
    catch { setNotice(`Open this address on the classroom computer: ${origin}${projectorPath}`) }
  }
  const current = state?.session.current_slide ?? 0
  const projected = lesson?.content_blocks.blocks.find(b => b.id === state?.session.projected_block_id)
  const explainer=projected?.teachingTool?.kind==='physics-explainer'?projected.teachingTool:null
  const explainerIndex=Math.max(0,Math.min((explainer?.frames.length??1)-1,state?.session.teaching_tool_state?.[projected?.id??'']?.state.frame??0))
  const explainerFrame=explainer?.frames[explainerIndex]
  function explainerGo(index:number) {
    if(!projected||!state)return
    const original=state.session.teaching_tool_state?.[projected.id]?.state.claude
    return patch({teaching_tool:{block_id:projected.id,state:{frame:index,show:false,...(original?{claude:{...original,offset:0}}:{})}},expected_command_revision:state.session.command_revision})
  }
  const blockScreens = explainer?explainer.frames.length:projected ? projectedBlockPages(projected).length : 0
  async function returnToTeaching() {
    if (!state) return
    if (state.lobby) {
      try { await commandRequest('/api/lobby/sessions/' + state.lobby.id, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status:'closed'}) }) }
      catch (e) { setError(e instanceof Error ? e.message : 'Could not close the activity.'); return }
    }
    if (teaching.state?.pulse?.status === 'open' && !await teaching.action({action:'close_pulse'})) return
    if (await patch({ poll_block_id:null, blackout:false })) setView('teach')
  }
  useEffect(() => {
    if (presentation?.session && !tablet && display==='computer') setBridgeId(presentation.session.id)
  }, [presentation?.session, tablet, display])
  useEffect(() => {
    if (!live || !courseId || !lessonId) return
    const url = new URL(window.location.href)
    url.searchParams.set('course', courseId)
    const target=planTarget(lessonId)
    if(target){url.searchParams.set('unit',target.plan_unit_id);url.searchParams.set('day',String(target.plan_day));url.searchParams.delete('lesson')}
    else {url.searchParams.set('lesson',lessonId);url.searchParams.delete('unit');url.searchParams.delete('day')}
    url.searchParams.delete('class')
    url.searchParams.set('resume','1')
    if(mirror)url.searchParams.set('display','mirror');else url.searchParams.delete('display')
    window.history.replaceState(window.history.state, '', url)
  }, [live, courseId, lessonId, mirror])
  const course = courses.find(c => c.id === courseId)
  const screenStatus = state && teaching.state ? projectorStatus(state, teaching.state, clock) : 'Checking projector…'
  const screenConnected = screenStatus === 'Projector confirmed' || screenStatus === 'Waiting for projector'
  const activityOpen = Boolean(state?.lobby || state?.session.poll_block_id || teaching.state?.pulse?.status === 'open')
  const position = explainer?`Explainer section · ${explainerIndex+1} of ${blockScreens}`:projected ? `Lesson content · ${(state?.session.projected_block_page ?? 0) + 1} of ${blockScreens}` : `Slide ${current + 1} of ${slides.length || '…'}`
  const screenLabel = state?.session.blackout ? 'Screen is blank' : state?.lobby ? 'Group activity' : teaching.state?.pulse?.status === 'open' ? 'Pulse check' : state?.session.poll_block_id ? 'Live poll' : explainerFrame?explainerFrame.title:projected ? 'Lesson content' : slides[current]?.label ?? 'Loading slides…'
  const controlBusy = busy || Boolean(endingId)
  const tabs = [{ id: 'teach', label: 'Teach', icon: MonitorPlay }, { id: 'activities', label: 'Activities', icon: Radio }, { id: 'students', label: 'Students', icon: Users }, { id: 'notes', label: 'Notes', icon: StickyNote }]
  function attach(session: typeof activeSessions[number]) {
    setMirror(display==='mirror')
    setFinished(null); setNotice(''); setView('teach'); setShowConnection(!tablet)
    const key=presentationKey(session)
    if(session.plan_unit_id)setUnitId(session.plan_unit_id)
    if (courseId !== session.course_id) { requestedLesson.current = key; setCourseId(session.course_id) }
    else setLessonId(key)
    setAttachVersion(n => n + 1)
  }
  if(!initialized)return <p role="status" className="p-6">Preparing Teach…</p>
  if (!staff) return <p className="p-6">Teach is available to teachers and administrators.</p>
  if(mirror && (!live || !state || !presentation?.lesson))return <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center"><h1 className="text-2xl font-semibold">{starting?'Connecting presentation…':'Presentation is not running'}</h1><p>Stop mirroring before returning to private teacher controls.</p><Button className="min-h-12" disabled={starting} onClick={()=>setMirror(false)}>Mirroring stopped · return to workspace</Button></main>
  if ((local || (mirror && live && state)) && presentation?.lesson) {
    const shown=local??state!
    return <TeachingDisplay presentation={presentation} slides={slides} live={shown} tools={local?null:teaching.state} rehearsal={!!local&&mode==='rehearse'} busy={!local&&controlBusy} error={local?'':connectionError||error||teaching.error} onFinish={local?undefined:()=>void end()} onGo={index=>{if(local){setLocal({...local,session:{...local.session,current_slide:index,current_anchor:slides[index]?.anchor??null}})}else go(index)}} onPatch={values=>{if(local)setLocal({...local,session:{...local.session,...values}});else {const {timer_ends_at,...rest}=values;void patch({...rest,...('timer_ends_at' in values?{timer_seconds:timer_ends_at?Math.max(1,Math.round((Date.parse(timer_ends_at)-Date.now())/1000)):null}:{})})}}} onExit={()=>{setLocal(null);setMirror(false);const url=new URL(window.location.href);url.searchParams.delete('display');window.history.replaceState(window.history.state,'',url)}}/>
  }
  return <div className={styles.page}>
    {!live && <header className={styles.setupHeader}>
      <Button asChild variant="ghost" className="min-h-12"><Link href={role === 'admin' ? '/admin/home' : '/admin/classes'}><ArrowLeft size={18} />Teacher home</Link></Button>
      <div className="text-overline text-primary">Teach</div>
      <h1 className="text-title-1">Ready to teach.</h1>
      <p className="text-muted-foreground">Choose your class, unit, and Course Plans day to present its deck.</p><Button asChild variant="outline" className="min-h-12"><a href="/explainers/claude/index.html" target="_blank" rel="noopener noreferrer">Browse original explainers</a></Button>
    </header>}
    {(error || connectionError || teaching.error) && <div role="alert" className="rounded-xl border border-destructive p-3 text-destructive">{error || connectionError || teaching.error}{!live && <Button className="ml-2 min-h-12" variant="outline" onClick={() => setRetry(n => n + 1)}>Try again</Button>}</div>}
    {notice && <p role="status" className="break-words">{notice}</p>}
    {!live && finished && <Card className="gap-4 p-6 border-primary/30">
      <Check size={28} className="text-primary" aria-hidden />
      <div><h2 className="text-title-2">Presentation finished</h2><p className="mt-1">{conceptTitle(finished.title)}</p></div>
      <p className="text-muted-foreground">The classroom screen is blank. Your teaching notes and student responses are saved.</p>
      <div className="flex flex-wrap gap-3"><Button asChild className="min-h-12"><Link href={`/admin/command-center/recap?session=${finished.id}`}>View saved notes</Link></Button><Button variant="outline" className="min-h-12" onClick={() => { setFinished(null); setView('teach') }}>Present another day</Button></div>
    </Card>}
    {!live && !finished && <div className={styles.setup}>
      {activeSessions.length > 0 && <Card className="gap-4 border-primary/30 p-5">
        <div><p className="text-overline text-primary">Continue teaching</p><h2 className="mt-1 text-title-2">Presentations already running</h2><p className="mt-1 text-muted-foreground">Pick up where you left off, on this device.</p></div>
        {activeSessions.map(s => <div key={s.id} className={styles.resume}>
          <div><strong>{courses.find(c => c.id === s.course_id)?.name ?? 'Live presentation'}{courses.find(c => c.id === s.course_id)?.section ? ` · ${courses.find(c => c.id === s.course_id)?.section}` : ''}</strong><p className="text-sm text-muted-foreground">{conceptTitle(lessons.find(l => l.id === presentationKey(s))?.title ?? 'Presentation in progress')} · Slide {s.current_slide + 1}</p></div>
          <Button className="min-h-12" disabled={locked || Boolean(endingId) || !courses.some(c => c.id === s.course_id)} onClick={() => attach(s)}>Control this presentation</Button>
          <details><summary className="min-h-11 cursor-pointer content-center text-sm text-muted-foreground">Options</summary><Button variant="outline" className="min-h-12" disabled={Boolean(endingId)} onClick={() => endListed(s.id)}>{endingId === s.id ? 'Ending…' : 'End presentation'}</Button></details>
        </div>)}
      </Card>}
      <Card className="gap-5 p-5 sm:p-6">
        <div><p className="text-overline text-primary">{activeSessions.length ? 'Or present another day' : 'Start here'}</p><h2 className="mt-1 text-title-2">What are you teaching?</h2></div>
        <fieldset disabled={locked || Boolean(presentation?.session)} className="grid min-w-0 gap-4 sm:grid-cols-2">
          <label className="min-w-0 text-sm font-medium">Class<select aria-label="Class" className={fieldClass + ' mt-2'} value={courseId} onChange={e => {setAttachVersion(0);setCourseId(e.target.value);context.remember({classId:e.target.value,lessonId:''})}}><option value="">Choose class</option>{courses.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ' · '+c.section : ''}</option>)}</select></label>
          <label className="min-w-0 text-sm font-medium">Unit<select aria-label="Unit" className={fieldClass+' mt-2'} value={unitId} onChange={e=>{setUnitId(e.target.value);setLessonId('');setPresentation(null);setAttachVersion(0);setSearch('')}}><option value="">Choose unit</option>{[...new Map(lessons.map(p=>[p.unit_id,p.unit])).entries()].map(([id,title])=><option key={id} value={id}>{title}</option>)}</select></label>
          <label className="text-sm">Find a day<input className={fieldClass+' mt-2'} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Day number or topic"/></label>
          <label className="min-w-0 text-sm font-medium">Course Plans day<select aria-label="Course Plans day" className={fieldClass+' mt-2'} value={lessonId} onChange={e=>{setAttachVersion(0);setPresentation(null);setLessonId(e.target.value);setError('');context.remember({classId:courseId,lessonId:''})}}><option value="">Choose day</option>{lessons.filter(p=>p.unit_id===unitId&&(p.id===lessonId||('Day '+p.day+' '+p.title).toLowerCase().includes(search.toLowerCase()))).map(p=><option key={p.id} value={p.id} disabled={!p.deck}>{conceptTitle(p.title).match(/^Day \d+/i)?conceptTitle(p.title):`Day ${p.day} — ${conceptTitle(p.title)}`}{!p.deck?' · deck not available':''}</option>)}</select></label>
        </fieldset>
        {!loading && courseId && !lessons.length && <p>No Course Plans days are available for this class yet.</p>}
        {courseId && lessons.length>0 && <p className="text-sm text-muted-foreground">{unitId.startsWith('trades-etf-')?'ETF':track==='honors'?'Honors':'CPA'} decks · Days match Course Plans. Days without a deck are marked unavailable.</p>}
        {courseId && <div className="flex flex-wrap gap-2">{history.filter(h=>h.plan_unit_id&&lessons.some(p=>p.id===presentationKey(h)&&p.deck)).slice(0,3).map(h=><Button key={h.id} variant="outline" onClick={()=>{setAttachVersion(0);setUnitId(h.plan_unit_id!);setLessonId(presentationKey(h));setSearch('')}}>Recent: {conceptTitle(lessons.find(p=>p.id===presentationKey(h))?.title??'Day '+h.plan_day)}</Button>)}</div>}
        {presentation?.lesson && <section className="space-y-3 rounded-xl border p-4"><h3 className="font-semibold">{conceptTitle(presentation.lesson.title)}</h3><p className="text-sm">{isPlan?(presentation.plan?.plan_unit_id?.startsWith('trades-etf-')?'ETF':presentation.plan?.plan_track==='honors'?'Honors':'CPA')+' presentation deck':'Existing lesson presentation'} · {presentation.session?'Live session running':'Ready to present'}</p>{isPlan&&<Link className="inline-block min-h-11 py-2 underline" href={'/admin/teacher/plans?'+new URLSearchParams({class:courseId,unit:unitId,day:String(planTarget(lessonId)?.plan_day??1)})}>View this Course Plans day</Link>}<LivePreview lesson={presentation.lesson} deck={presentation.deck} live={rehearsalState(lessonId,courseId)} tools={null} binding={slides[0]?.binding}/></section>}
        <fieldset className="space-y-3"><legend className="font-semibold">Display setup</legend>{[['computer','Control a classroom computer'],['mirror','Mirror this iPad']].map(([value,label])=><label key={value} className="flex min-h-11 items-center gap-3"><input type="radio" name="display" value={value} checked={display===value} onChange={()=>{setDisplay(value);try{localStorage.setItem('teaching-display',value)}catch{}}}/>{label}</label>)}<p className="text-sm text-muted-foreground">{display==='mirror'?'Opens a presentation-only screen with touch controls. Stop mirroring before returning to private teacher controls.':'Open the projector window on the classroom computer. Keep its connection page open, then control the same presentation on the iPad.'}</p></fieldset>
        <label className="text-sm font-medium">Teaching mode<select className={fieldClass+' mt-2'} value={mode} onChange={e=>setMode(e.target.value as typeof mode)}><option value="rehearse">Rehearse · nothing saved</option><option value="slides">Present on this device only</option><option value="live">Present deck · sync iPad and projector</option></select></label>
        <Button className="min-h-14 text-base" disabled={!courseId || !lessonId || locked || !presentation || Boolean(presentation.session)||!slides.length} onClick={start}><MonitorPlay size={20} />{loading ? 'Loading deck…' : starting ? 'Starting…' : presentation?.session ? 'Connecting to presentation…' : mode==='rehearse'?'Start rehearsal':mode==='slides'?'Present on this device':'Present deck'}</Button>
        <p className="text-sm text-muted-foreground">{mode==='live'?'Your iPad and classroom computer control the same deck and slide position.':'Opens on this device only. Choose “Present deck · sync iPad and projector” to control another screen.'}</p>
      </Card>
      {history.length > 0 && <details className="rounded-xl border p-4"><summary className="min-h-11 cursor-pointer content-center font-semibold">Previous teaching notes</summary><div className="mt-3 grid gap-2">{history.map(h => <Button key={h.id} asChild variant="outline" className="h-auto min-h-12 justify-start whitespace-normal"><Link href={`/admin/command-center/recap?session=${h.id}`}>{lessons.find(l => l.id === presentationKey(h))?.title ?? (h.plan_day?'Day '+h.plan_day:'Presentation')} · {new Date(h.created_at).toLocaleString()}</Link></Button>)}</div></details>}
    </div>}
    {live && state && lesson && <Tabs value={view} onValueChange={value => { setView(value); setShowConnection(false) }} className="gap-4">
      <div className={styles.remote} id="deck-controls">
        <div className={styles.sessionHeader}>
          <div className="min-w-0"><p className="text-sm text-muted-foreground">{course?.name ?? 'Live class'}{course?.section ? ` · ${course.section}` : ''}</p><h1 className="truncate text-lg font-semibold" title={conceptTitle(lesson.title)}>{conceptTitle(lesson.title)}</h1></div>
          <Button variant="outline" className="min-h-12" aria-expanded={showConnection} onClick={() => setShowConnection(v => !v)}><Settings2 size={17} /><span className={styles.connectionLabel}>{screenConnected ? 'Screen connected' : 'Connect screen'}</span></Button>
          <Button ref={finishButton} variant="ghost" className="min-h-12" onClick={() => setConfirmEnd(true)}>Finish</Button>
        </div>
        <Button className="min-h-12" variant="outline" onClick={()=>setMirror(true)}>Open presentation-only display</Button>
        <div className={styles.controls}>
          <Button aria-label="Previous slide" variant="outline" className="min-h-14" disabled={controlBusy || activityOpen || (projected ? !(explainer?explainerIndex:state.session.projected_block_page ?? 0) : current === 0)} onClick={() => explainer?explainerGo(explainerIndex-1):projected ? patch({ projected_block_page: (state.session.projected_block_page ?? 0) - 1 }) : go(current - 1)}><ChevronLeft size={22} /></Button>
          <div className="min-w-0 text-center"><p className="text-sm font-semibold">{position}</p><p className="truncate text-sm text-muted-foreground">{screenLabel}</p></div>
          <Button aria-label="Next slide" className="min-h-14" disabled={controlBusy || activityOpen || (projected ? (explainer?explainerIndex:state.session.projected_block_page ?? 0) >= blockScreens - 1 : !slides.length || current >= slides.length - 1)} onClick={() => explainer?explainerGo(explainerIndex+1):projected ? patch({ projected_block_page: (state.session.projected_block_page ?? 0) + 1 }) : go(current + 1)}>Next <ChevronRight size={22} /></Button>
          <Button variant="outline" className={styles.blank} disabled={controlBusy} aria-pressed={state.session.blackout} onClick={() => patch({ blackout: !state.session.blackout })}>{state.session.blackout ? 'Show screen' : 'Blank screen'}</Button>
          <label className={styles.timer}><span className="sr-only">Class timer</span><select aria-label="Class timer" value="" disabled={controlBusy} onChange={e => { if (e.target.value) void patch({ timer_seconds: Number(e.target.value) || null }) }}><option value="">{left !== null ? fmtTimer(left) : 'Timer'}</option>{[1,3,5,10].map(m => <option key={m} value={m * 60}>{m} min</option>)}<option value="0">Clear timer</option></select></label>
        </div>
        {activityOpen && <Button className="min-h-12 w-full" variant="outline" disabled={controlBusy || teaching.busy} onClick={returnToTeaching}>Close activity & return to teaching</Button>}
        <TabsList className={styles.tabs} aria-label="Teaching workspace">{tabs.map(({ id, label, icon: Icon }) => <TabsTrigger key={id} value={id} aria-label={label} className={styles.tab}><Icon size={18} aria-hidden />{label}{id === 'students' && Boolean(teaching.state?.needs.length) && <span aria-hidden className={styles.badge}>{teaching.state?.needs.length}</span>}</TabsTrigger>)}</TabsList>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground"><p role="status">{screenStatus}</p><span>Only the classroom preview is shown to students.</span></div>
      <TabsContent value="teach" forceMount hidden={view !== 'teach' || showConnection} className="mt-0 space-y-4">
        {!screenConnected && !showConnection && <div className={styles.connectPrompt}><div><strong>Connect your classroom screen</strong><p className="mt-1 text-sm text-muted-foreground">{tablet ? 'Open Teach on the classroom computer and choose this running presentation.' : 'Open the projector window on this computer, then take your iPad.'}</p></div><Button className="min-h-12" onClick={() => setShowConnection(true)}>Set up screen</Button></div>}
        <div className={explainer?.source ? styles.explainerStage : styles.teachingStage}>
          {explainer?.source ? <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap gap-2">
              {explainerFrame?.discussion&&<Button className="min-h-12" disabled={controlBusy||activityOpen} onClick={()=>{setDiscussionChoice({blockId:projected?.id,frame:explainerIndex,source:'lesson',key:Date.now()});setView('activities')}}>Discuss this slide in groups</Button>}
              <Button variant="outline" className="min-h-12" disabled={controlBusy||activityOpen} onClick={()=>{setDiscussionChoice({source:'textbook',key:Date.now()});setView('activities')}}>Launch a textbook question</Button>
            </div>
            <div hidden={activityOpen}><TeachingToolControls document={lesson.content_blocks} session={state.session} busy={controlBusy || activityOpen} patch={patch} /></div>
            <details open={activityOpen} className="rounded-xl border p-4">
              <summary className="min-h-11 cursor-pointer content-center text-sm font-semibold">Classroom screen preview · display only</summary>
              <LivePreview lesson={lesson} deck={presentation?.deck ?? null} live={state} tools={teaching.state} binding={slides[current]?.binding} />
            </details>
          </div> : <LivePreview lesson={lesson} deck={presentation?.deck ?? null} live={state} tools={teaching.state} binding={slides[current]?.binding} />}
          <div className="space-y-4 min-w-0">
            <label className="block text-sm font-medium">Go to a slide<select aria-label="Jump to slide" className={fieldClass + ' mt-2'} disabled={controlBusy || activityOpen || !slides.length} value={current} onChange={e => go(Number(e.target.value))}>{slides.map((s,i) => <option key={i} value={i}>{i + 1}. {s.label}</option>)}</select></label>
            <div className={styles.speakerNotes}><p className="text-overline text-muted-foreground">Your speaker notes · private</p><p className="mt-2 whitespace-pre-wrap text-sm">{explainerFrame ? `Discussion: ${explainerFrame.prompt}${explainerFrame.reasoning?'\n\nExpected reasoning: '+explainerFrame.reasoning:''}${explainerFrame.discussion ? '\n\nDebrief: '+explainerFrame.discussion.debrief : ''}` : slides[current]?.notes || 'No speaker notes for this slide.'}</p></div>
            {!projected && slides[current + 1] && <p className="text-sm text-muted-foreground"><strong>Up next</strong> · {slides[current + 1].label}</p>}
            {!explainer?.source&&lesson.content_blocks.blocks.some(b=>b.teachingTool?.kind==='physics-explainer')&&<label className="block text-sm font-medium">Open an explainer<select aria-label="Open an explainer" className={fieldClass+' mt-2'} disabled={controlBusy||activityOpen} value={explainer?projected?.id:''} onChange={e=>{if(e.target.value)void patch({projected_block_id:e.target.value,blackout:false,poll_block_id:null})}}><option value="">Choose a presentation…</option>{lesson.content_blocks.blocks.filter(b=>b.teachingTool?.kind==='physics-explainer').map(b=><option key={b.id} value={b.id}>{b.teachingMoment?.title}</option>)}</select></label>}
            {!explainer?.source&&explainerFrame?.discussion&&<Button className="min-h-12 w-full" disabled={controlBusy||activityOpen} onClick={()=>{setDiscussionChoice({blockId:projected?.id,frame:explainerIndex,source:'lesson',key:Date.now()});setView('activities')}}>Discuss this slide in groups</Button>}
            <Button variant="outline" className="min-h-12 w-full" onClick={()=>setView('activities')}>Launch a poll or lobby</Button>
            {!isPlan&&!explainer?.source&&<Button variant="outline" className="min-h-12 w-full" disabled={controlBusy||activityOpen} onClick={()=>{setDiscussionChoice({source:'textbook',key:Date.now()});setView('activities')}}>Launch a textbook question</Button>}
            {!isPlan&&<Button ref={contentButton} variant="outline" className="min-h-12 w-full" onClick={() => setShowContent(true)}><BookOpen size={18} />Show lesson content</Button>}
            {projected && <Button variant="outline" className="min-h-12 w-full" disabled={controlBusy || activityOpen} onClick={() => go(current)}>Return to deck · slide {current + 1}</Button>}
            {!isPlan&&<div className="flex items-center justify-between gap-2"><span id="remote-sei-label" className="text-sm font-medium">SEI supports</span><Button role="switch" aria-labelledby="remote-sei-label" aria-checked={teaching.state?.tools?.sei_enabled ?? false} variant={teaching.state?.tools?.sei_enabled ? 'default' : 'outline'} className="min-h-12 min-w-20" disabled={controlBusy || teaching.busy || !teaching.state} onClick={() => teaching.action({ action: 'sei_supports', enabled: !teaching.state?.tools?.sei_enabled })}>{teaching.state?.tools?.sei_enabled ? 'On' : 'Off'}</Button></div>}
          </div>
        </div>
        {projected && !explainer?.source && supportsTeachingTool(projected) && <TeachingToolControls document={lesson.content_blocks} session={state.session} busy={controlBusy || activityOpen} patch={patch} />}
      </TabsContent>
      {<TabsContent value="activities" forceMount hidden={view !== 'activities' || showConnection} className="mt-0 space-y-4">
      {teaching.state?.deckActivities&&<DeckActivities key={state.session.id+':'+state.session.plan_day+':'+state.session.plan_track} activities={teaching.state.deckActivities} currentSlide={state.session.current_slide} busy={controlBusy||teaching.busy||activityOpen} onChoose={(activity,mode)=>{setDeckChoice({activity,mode,sessionId:state.session.id,key:Date.now()});if(mode==='lobby')setDiscussionChoice({prompt:activity.prompt+'\n\nThink individually first. Then take turns explaining. Submit a group claim supported by evidence and reasoning.',targetId:activity.targetId,key:Date.now()});requestAnimationFrame(()=>document.getElementById(mode==='solo'?'presentation-live-poll':'presentation-group-activity')?.scrollIntoView({behavior:'smooth',block:'start'}))}}/>}
      <div id="live-activities" className="grid items-start gap-4 xl:grid-cols-2 scroll-mt-40"><>{isPlan?(teaching.state&&<TeachingPoll key={state.session.id+':'+(deckChoice?.sessionId===state.session.id&&deckChoice.mode==='solo'?deckChoice.key:'manual')} preferred={deckChoice?.sessionId===state.session.id&&deckChoice.mode==='solo'?deckChoice.activity:undefined} live={state} state={teaching.state} busy={controlBusy||teaching.busy} action={teaching.action}/>):<Card density="compact" className="min-w-0"><h2 className="text-title-2">Lesson checkpoint poll</h2><p className="text-muted-foreground">Use a lesson checkpoint. Students respond on their devices.</p>{poll?.type === 'question' ? <><MathMarkdown content={commandQuestion(poll)!.prompt} /><p className="text-caption">{state.saved} of {state.enrolled} saved · {state.session.poll_revealed ? 'Revealed' : state.session.poll_locked ? 'Locked' : 'Accepting responses'}</p>{commandQuestion(poll)!.options?.map(o => <div key={o.id} className="rounded-xl border p-3"><div className="flex justify-between gap-2"><MathMarkdown content={o.text} /><span className="tabular-nums">{state.tally[o.id] ?? 0}</span></div>{state.session.poll_revealed && presentation?.answerKeys?.[poll.id] === o.id && <p className="text-caption" style={{ color: 'var(--viz-up)' }}>Correct answer</p>}</div>)}<div className="flex flex-wrap gap-2"><Button className="min-h-12" disabled={busy} onClick={() => patch({ discussion: teaching.state?.tools?.discussion_block_id === state.session.poll_block_id ? 'revote' : 'start' })}>{teaching.state?.tools?.discussion_block_id === state.session.poll_block_id ? 'Start fresh vote' : 'Pause & discuss · 90 sec'}</Button><Button className="min-h-12" variant="outline" disabled={busy || state.session.poll_revealed} onClick={() => patch({ poll_locked: !state.session.poll_locked })}>{state.session.poll_locked ? 'Reopen responses' : 'Lock responses'}</Button><Button className="min-h-12" disabled={busy || state.session.poll_revealed} onClick={() => patch({ poll_revealed: true })}>Reveal results</Button><Button className="min-h-12" variant="outline" disabled={busy} onClick={() => patch({ poll_block_id: null })}>Close poll</Button></div></> : pollable.length ? pollable.map(b => b.type === 'question' && <Button key={b.id} variant="outline" className="h-auto min-h-14 justify-start whitespace-normal p-3 text-left" disabled={busy || Boolean(state.lobby) || teaching.state?.pulse?.status === 'open'} onClick={() => patch({ poll_block_id: b.id })}>{commandQuestion(b)!.prompt}</Button>) : <p>No multiple-choice checkpoints in this lesson.</p>}</Card>}</><Card density="compact" className="min-w-0"><CommandLobby key={`${state.session.id}-${discussionChoice.key}`} preferred={discussionChoice.prompt&&deckChoice?.sessionId!==state.session.id?undefined:discussionChoice} lesson={lesson} live={state} pulseOpen={teaching.state?.pulse?.status === 'open'} /></Card></div>
      {!isPlan&&teaching.state&&<TeachingPoll key={state.session.id+':'+(deckChoice?.sessionId===state.session.id&&deckChoice.mode==='solo'?deckChoice.key:'manual')} preferred={deckChoice?.sessionId===state.session.id&&deckChoice.mode==='solo'?deckChoice.activity:undefined} live={state} state={teaching.state} busy={controlBusy||teaching.busy} action={teaching.action}/>}
      </TabsContent>}
      {teaching.state && <TeachingTools key={state.session.id} view={showConnection ? 'connection' : view} live={state} state={teaching.state} busy={controlBusy || teaching.busy} action={teaching.action} patch={patch} />}
      <Dialog open={showContent} onOpenChange={setShowContent}><DialogContent className={styles.dialog} onCloseAutoFocus={event => { event.preventDefault(); contentButton.current?.focus() }}>
        <DialogTitle>Show lesson content</DialogTitle><DialogDescription>Choose a prompt, visual, or teaching tool. Your slide position is saved.</DialogDescription>
        {connectionError && <p role="alert" className="text-destructive">{connectionError}</p>}
        <ProjectionPanel lesson={lesson} live={state} pulseOpen={teaching.state?.pulse?.status === 'open'} busy={controlBusy} patch={async body => { const saved = await patch(body); if (saved) setShowContent(false); return saved }} />
      </DialogContent></Dialog>
      <Dialog open={confirmEnd} onOpenChange={setConfirmEnd}><DialogContent className={styles.dialog} onCloseAutoFocus={event => { event.preventDefault(); finishButton.current?.focus() }}>
        <DialogTitle>Finish teaching?</DialogTitle><DialogDescription>This blanks the classroom screen and closes the current activity, poll, and timer. Your teaching notes and student responses stay saved.</DialogDescription>
        {(error || connectionError || teaching.error) && <p role="alert" className="text-destructive">{error || connectionError || teaching.error}</p>}
        <div className="flex flex-wrap gap-3"><Button variant="destructive" className="min-h-12" disabled={controlBusy || teaching.busy} onClick={end}>{endingId ? 'Finishing…' : 'End presentation now'}</Button><Button variant="outline" className="min-h-12" disabled={Boolean(endingId)} onClick={() => setConfirmEnd(false)}>Keep teaching</Button></div>
      </DialogContent></Dialog>
    </Tabs>}
    <div hidden={!live || !showConnection} className={styles.connectionPanel}>
      <div className="flex items-center justify-between gap-3"><h2 className="text-title-2">Classroom screen</h2><Button variant="outline" className="min-h-12" onClick={() => setShowConnection(false)}>Back to teaching</Button></div>
      {tablet ? <p>On your classroom computer, open <strong>Teach / Command Center</strong>, choose <strong>Control this presentation</strong>, then <strong>Open projector window</strong>. Keep that page open while you teach from this iPad.</p> : <p>Open the deck on your classroom display. Keep this page open; the iPad connects to the same presentation.</p>}
      {bridgeId && <ProjectorConnection key={bridgeId} sessionId={bridgeId} compact />}
      <div className="flex flex-wrap gap-3"><Button variant="outline" className="min-h-12" disabled={teaching.busy || !live} onClick={() => teaching.action({ action: 'reconnect' })}>Reconnect projector</Button><Button variant="outline" className="min-h-12" onClick={copyLink}>Copy projector link</Button></div>
      <p className="text-sm text-muted-foreground">If the projector window was closed, reopen it on the computer. Use an extended display to keep teacher controls private.</p>
    </div>
  </div>
}
