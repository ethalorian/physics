'use client'

import { videoWatchHref } from '@/lib/video-watch'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import VideoPlanConnections from './VideoPlanConnections'
import { PlayCircle } from 'lucide-react'
import InstructionVideo from '@/components/blocks/InstructionVideo'
import { PHYSICS_VIDEOS, UPCOMING_PHYSICS_VIDEOS, conceptTitle, lessonsForVideo, watchLessonsForVideo, videoBlock, type VideoLessonLink } from '@/lib/video-instruction'

interface Props {
  classId?: string
  lessons: VideoLessonLink[]
  catalogLessons?: VideoLessonLink[]
  observer?: boolean
  staff?: boolean
  canEdit?: boolean
  draftHref?: (youtubeId: string) => string
  accessHref?: (lesson: VideoLessonLink) => string
  lessonHref?: (lesson: VideoLessonLink) => string
}
const control = 'min-h-11 rounded-lg border bg-background px-3 py-2 text-sm'

export default function VideoInstructionLibrary({ classId, lessons, staff = false, observer = false, canEdit = false, lessonHref, draftHref, catalogLessons, accessHref }: Props) {
  const [browse, setBrowse] = useState<'sequence' | 'targets'>('sequence')
  const [query, setQuery] = useState(''), [target, setTarget] = useState(''), [selected, setSelected] = useState('')
  const player = useRef<HTMLDivElement>(null)
  useEffect(()=>{const params=new URLSearchParams(window.location.search);if(params.has('video'))setSelected(params.get('video')??'')},[])
  useEffect(()=>{if(selected)player.current?.focus()},[selected])
  const catalogue = useMemo(()=>staff?(catalogLessons??lessons):lessons.filter(lesson=>lesson.published!==false),[staff,catalogLessons,lessons])
  const targets = useMemo(() => new Map(catalogue.flatMap(lesson => lesson.learning?.targets.map(item => [item.slug, item.statement] as const) ?? [])), [catalogue])
  const available = PHYSICS_VIDEOS.map(video => ({ video, linked: watchLessonsForVideo(video, catalogue, staff) })).filter(row => staff || row.linked.length)
  const rows = available.filter(({ video }) => (!target || video.targets.some(link => link.slug === target)) && `${video.title} ${video.summary} ${video.targets.map(link => targets.get(link.slug) ?? link.slug).join(' ')}`.toLowerCase().includes(query.toLowerCase()))
  const current = rows.find(row => row.video.youtubeId === selected)
  const active = current?.video
  const videoLessons = active?lessonsForVideo(active,catalogue,staff):[]
  const targetOptions = [...new Set(available.flatMap(({ video }) => video.targets.map(link => link.slug)))].filter(slug => targets.has(slug))
  const next = current ? rows[rows.indexOf(current) + 1] : undefined
  return <section aria-label="Video instruction" className="space-y-5">
    <header className="space-y-2"><p className="text-xs font-semibold uppercase tracking-widest text-primary">{staff ? 'Video lessons · concept spine' : 'Video library · Watch anytime'}</p><h2 className="text-2xl font-semibold">Build the tools for the Asteroid course.</h2><p className="max-w-3xl text-sm text-muted-foreground">{observer ? 'Follow the concept sequence or browse by learning target. Watch videos and open published lessons in a read-only preview.' : 'Watch any published video to learn or review a concept. Your teacher assigns the questions and activities separately on your class calendar. Watching a video here does not assign homework.'}</p></header>
    <div className="flex flex-wrap gap-2" aria-label="Browse video lessons"><button type="button" className={control+(browse==='sequence'?' bg-primary text-primary-foreground':'')} aria-pressed={browse === 'sequence'} onClick={() => { setBrowse('sequence'); setTarget('') }}>Suggested sequence</button><button type="button" className={control+(browse==='targets'?' bg-primary text-primary-foreground':'')} aria-pressed={browse === 'targets'} onClick={() => setBrowse('targets')}>Browse by target</button>{staff && <Link className={control} href="/admin/lessons/roadmap">Target map & recording gaps</Link>}</div>
    <div className="flex flex-wrap gap-3"><label className="flex-1 text-sm">Search videos<input className={control + ' mt-1 w-full'} value={query} onChange={event => setQuery(event.target.value)} placeholder="Position, units, velocity…"/></label>{browse === 'targets' && <label className="min-w-0 flex-1 text-sm">Learning target<select className={control + ' mt-1 w-full'} value={target} onChange={event => setTarget(event.target.value)}><option value="">All available targets</option>{targetOptions.map(slug => <option key={slug} value={slug}>{targets.get(slug)}</option>)}</select></label>}</div>
    {active && current && <div className="space-y-4 rounded-xl border bg-card p-4 sm:p-6" ref={player} tabIndex={-1} aria-label="Selected video lesson"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-primary">{active.collection} · Video {active.sequence}</p><h3 className="text-xl font-semibold">{active.title}</h3></div><button type="button" className={control} onClick={() => setSelected('')}>Close video</button></div><p>{active.focus}</p><InstructionVideo key={active.youtubeId} block={videoBlock(active)}/><div className="space-y-3"><h4 className="font-semibold">Connect it to your targets</h4>{active.targets.filter(link => staff || targets.has(link.slug)).map(link => <div key={link.slug} className="text-sm"><p className="font-medium">{targets.get(link.slug) ?? link.slug}</p><p className="text-muted-foreground">{link.relationship === 'teaches' ? 'Teaches part of this target' : 'Preparation for this target'}: {link.scope}</p></div>)}</div>{staff&&<VideoPlanConnections sequences={[active.sequence]} classId={classId}/>}<div className="space-y-2 border-t pt-4"><h4 className="font-semibold">{staff || observer ? 'Practice & show your thinking' : 'Assigned questions'}</h4>{!staff && !observer ? <Link className="inline-flex min-h-11 items-center text-primary underline" href="/home">Open your calendar for assigned questions →</Link> : <>{videoLessons.map(lesson=><Link className="flex min-h-11 items-center font-medium text-primary underline" key={lesson.id} href={lessonHref?.(lesson)??`/lessons/${lesson.slug}`}>{staff&&lesson.published===false?'Open video lesson draft':'Open video lesson'}: {conceptTitle(lesson.title)} →</Link>)}{current.linked.some(lesson=>!videoLessons.some(v=>v.id===lesson.id))&&<p className="text-sm text-muted-foreground">Related practice for these ideas:</p>}{current.linked.filter(lesson=>!videoLessons.some(v=>v.id===lesson.id)).slice(0, 4).map(lesson => <Link className="flex min-h-11 items-center text-sm text-primary underline" key={lesson.id} href={lessonHref?.(lesson) ?? `/lessons/${lesson.slug}`}>{conceptTitle(lesson.title)}{staff && lesson.published === false ? ' · Draft' : ''} →</Link>)}{canEdit && !videoLessons.length && <Link className="inline-flex min-h-11 items-center font-medium text-primary underline" href={draftHref?.(active.youtubeId)??`/admin/lessons/new?unit=unit-1&video=${active.youtubeId}`}>Create a lesson draft from this video →</Link>}{!current.linked.length && !videoLessons.length && <p className="text-sm text-muted-foreground">A practice lesson has not been linked for this class yet.</p>}</>}<p className="text-xs text-muted-foreground">Watching supports learning. Saved work and teacher feedback show what you understand.</p></div>{next && <button type="button" className={control} onClick={() => setSelected(next.video.youtubeId)}>Next in this view: {next.video.title} →</button>}</div>}
    <ol className="grid gap-3 md:grid-cols-2">{rows.map(({ video, linked }) => {
      const lesson = linked[0]
      return <li key={video.youtubeId} className="min-w-0 rounded-xl border bg-card p-4">
        <p className="text-xs font-medium text-muted-foreground">{video.collection} · Video {video.sequence}</p>
        <h3 className="mt-2 font-semibold">{video.title}</h3>
        <p className="my-3 text-sm text-muted-foreground">{video.focus}</p>
        
        
        <div className="flex flex-wrap gap-2">
          {lesson && <Link className={control+' inline-flex items-center gap-2 bg-primary text-primary-foreground'} href={!staff && !observer ? videoWatchHref(lesson.slug) : lessonHref?.(lesson)??(staff?'/admin/lessons/'+lesson.id:'/lessons/'+lesson.slug)}><PlayCircle size={18}/>{!staff && !observer ? 'Watch video' : lesson.published===false ? 'Open lesson draft' : staff ? 'Open workspace' : 'Preview lesson'}</Link>}
          {!staff && !observer && <Link className={control+' inline-flex items-center'} href="/home">Assignments on calendar</Link>}
          {(staff || observer) && <button type="button" className={control} aria-pressed={selected===video.youtubeId} onClick={()=>setSelected(video.youtubeId)}>Preview video & targets</button>}
          {staff && lesson?.published!==false && lesson && <Link className={control} href={accessHref?.(lesson)??'/admin/control-room?view=calendar&unit=unit-1&lesson='+lesson.id}>Schedule questions</Link>}
          {staff && canEdit && !lesson && <Link className={control} href={draftHref?.(video.youtubeId)??'/admin/lessons/new?unit=unit-1&video='+video.youtubeId}>Create lesson draft</Link>}
        </div>
        {staff && <p className="mt-3 text-xs text-muted-foreground">{lesson?lesson.published===false?'Draft · review and publish before opening for a class':'Video lesson · preparation and support for the course':'No individual lesson yet'}</p>}
      </li>
    })}</ol>
    {!rows.length && <p className="rounded-xl border p-5">{available.length ? 'No videos match this search or target.' : 'Published videos for your course will appear here. Questions are assigned separately on your calendar.'}</p>}
    {staff && UPCOMING_PHYSICS_VIDEOS.length > 0 && <aside className="rounded-xl border border-dashed p-4"><h3 className="font-semibold">Next in preparation: {UPCOMING_PHYSICS_VIDEOS[0].title}</h3><p className="mt-2 text-sm text-muted-foreground">{UPCOMING_PHYSICS_VIDEOS[0]?.scope}</p></aside>}
  </section>
}
