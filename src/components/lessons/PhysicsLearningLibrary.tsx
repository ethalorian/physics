'use client'

import { LESSON_COMPLETION_LABELS, type LessonCompletion } from '@/lib/lesson-completion'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BookOpen, FlaskConical, PlayCircle, Rocket, Search } from 'lucide-react'
import catalog from '@/data/physics-learning-catalog.json'
import { PHYSICS_GROUPS, type PhysicsLearningEntry } from '@/lib/physics-learning'
import { lessonContextHref } from '@/lib/lesson-release'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import VideoInstructionLibrary from './VideoInstructionLibrary'
import { PHYSICS_VIDEOS, isVideoInstructionEntry, lessonsForVideo } from '@/lib/video-instruction'
import theme from './LearningTheme.module.css'
import styles from './PhysicsLearning.module.css'

export interface LearningLesson {
  id: string; slug: string; title: string; unit?: string; unit_id?: string | null;
  description?: string; estimated_time?: number; progress?: number;
  completion?: LessonCompletion;
  window?: { state: string } | null;
  learning?: PhysicsLearningEntry; published?:boolean;blockCount?:number;
}
const units = PHYSICS_GROUPS
const lanes = [{ id: 'videos', label: 'Video lessons', icon: PlayCircle }, { id: 'lesson', label: 'Practice & reading', icon: BookOpen }, { id: 'investigation', label: 'Investigate', icon: FlaskConical }, { id: 'mission', label: 'Asteroid missions', icon: Rocket }]
const byId = new Map(catalog.map(entry => [entry.id, entry]))
export const hasPhysicsLearning = (lessons: LearningLesson[]) => lessons.some(lesson => lesson.learning || byId.has(lesson.id))

export default function PhysicsLearningLibrary({ lessons, onOtherCourses, staff = false, manage = false, observer = false, query, onQueryChange }: { lessons: LearningLesson[]; onOtherCourses: () => void; staff?: boolean;manage?:boolean;observer?:boolean;query?:string;onQueryChange?:(query:string)=>void }) {
  const [localQuery,setLocalQuery]=useState('')
  const params=new URLSearchParams(query??localQuery)
  const requestedLane=params.get('collection'),lane=lanes.some(l=>l.id===requestedLane)?requestedLane!:'videos',unit=params.get('unit')??'all',search=params.get('q')??'',status=params.get('status')??'all'
  const update=(changes:Record<string,string>)=>{const p=new URLSearchParams(params);Object.entries(changes).forEach(([key,value])=>value&&value!=='all'?p.set(key,value):p.delete(key));const next=p.toString();if(onQueryChange)onQueryChange(next);else setLocalQuery(next)}
  const editHref=(path:string,row?:LearningLesson)=>lessonContextHref(path,{unit:row?.unit_id??(unit==='foundations'?'unit-1':unit==='all'?undefined:unit),class:params.get('class'),lesson:row?.id,return:'/admin/dashboard'+(params.size?'?'+params:'')})
  const rows = useMemo(() => lessons.flatMap(lesson => {
    const entry:PhysicsLearningEntry|undefined = lesson.learning ?? byId.get(lesson.id)
    return entry?.source === 'new' ? [{ ...entry, lesson }] : []
  }), [lessons])
  const available = new Set(rows.map(row => row.id))
  const filtered = rows.filter(row => row.kind === lane && !isVideoInstructionEntry(row) && (unit === 'all' || row.unitId === unit) && (!manage || (status==='all'||row.lesson.published===(status==='published'))) && `${row.title} ${row.targets.map(t => t.statement).join(' ')}`.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>Number(b.source==='new')-Number(a.source==='new'))
  const groups = Object.keys(units).map(id => ({ id, title: units[id], rows: filtered.filter(row => row.unitId === id) })).filter(group => group.rows.length)
  const total = rows.filter(row => row.kind === 'lesson' && !isVideoInstructionEntry(row)).length
  const videoLessons = rows.map(row=>({...row.lesson,learning:row}))
  const videoCount = PHYSICS_VIDEOS.filter(video=>staff||lessonsForVideo(video,videoLessons).length).length
  return <div className={`${theme.theme} ${styles.library}`}>
    {manage?<section className={styles.manageIntro}><div><p className={styles.eyebrow}>PHYSICS · STUDENT LEARNING PATH</p><h2>Teach from the same map.</h2><p>Choose a concept, investigation, or asteroid application. Edit the lesson, try the student preview, then set class access.</p><p className={styles.collectionNote}>{rows.length} learning-path lessons</p></div><div className={styles.manageActions}><Link href={editHref('/admin/lessons/new')}>Create learning-path lesson</Link><Link href="/admin/lessons/roadmap">Target coverage & video queue →</Link></div></section>:lane==='videos'?<header className="flex flex-wrap items-center justify-between gap-3"><p className={styles.eyebrow}>PHYSICS · {videoCount} VIDEOS · YOUR LEARNING PATH</p>{!observer&&<Link className="inline-flex min-h-11 items-center text-sm text-primary underline" href="/dashboard/growth">Mastery & teacher feedback →</Link>}</header>:<section className={styles.hero}>
      <svg className={styles.motionArt} viewBox="0 0 650 300" fill="none" aria-hidden="true"><path d="M0 275H650M65 300V0" className={styles.gridLine}/><path d="M35 260C185 260 210 50 390 50S530 190 650 15" className={styles.motionCurve}/><circle cx="390" cy="50" r="7"/><circle cx="35" cy="260" r="4"/></svg>
      <div><p className={styles.eyebrow}>ANTOCCIPHYSICS · YOUR LEARNING PATH</p><h2>Understand it.<br /><em>Put it to work.</em></h2><p>Use the video sequence to learn and revisit concepts. Apply those tools in the Asteroid story, classroom investigations, and assigned work.</p><div className={styles.heroMeta}><span>{total} reading & practice lessons</span><span>{videoCount} video lessons</span><span>Readings & collected checks</span></div></div>
      <div className={styles.pathArt} aria-label="Learning connects concepts, investigations, and asteroid applications"><div><PlayCircle /><strong>Learn the idea</strong><span>Videos & worked examples</span></div><ArrowRight /><div><FlaskConical /><strong>Test your thinking</strong><span>Practice, simulations & labs</span></div><ArrowRight /><div><Rocket /><strong>Make the connection</strong><span>Apply it to 2026-XJ</span></div></div>
    </section>}
    {!manage&&!observer&&lane!=='videos'&&<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4"><p className="text-sm">Use your teacher’s feedback to choose what to practice next. Lesson progress and mastery are different.</p><Link className="inline-flex min-h-11 items-center text-sm font-semibold text-primary underline" href="/dashboard/growth">Mastery & teacher feedback →</Link></div>}
    <div className={styles.toolbar}><div className={styles.tabs} aria-label="Lesson collection">{lanes.map(({id,label,icon:Icon}) => <button type="button" aria-pressed={lane===id} key={id} onClick={()=>update({collection:id})}><Icon size={16}/>{label}</button>)}</div><Button variant="ghost" className="min-h-11" onClick={onOtherCourses}>{manage?'All programs & publishing':'All courses'}</Button></div>
    {lane==='videos'?<VideoInstructionLibrary classId={params.get('class')??undefined} observer={observer} lessons={videoLessons} staff={staff} canEdit={manage} accessHref={staff?row=>editHref('/admin/lesson-access',row):undefined} lessonHref={manage?row=>editHref(`/admin/lessons/${row.id}`,row):undefined}/>:<>
    <div className={styles.filters}><label><Search size={18}/><Input aria-label="Search topics or learning targets" value={search} onChange={e=>update({q:e.target.value})} placeholder="Search a topic or learning target"/></label><select aria-label="Physics unit" value={unit} onChange={e=>update({unit:e.target.value})}><option value="all">All units</option>{Object.entries(units).filter(([id])=>rows.some(row=>row.unitId===id)).map(([id,title])=><option key={id} value={id}>{title}</option>)}</select>{manage&&<><select aria-label="Publication status" value={status} onChange={e=>update({status:e.target.value})}><option value="all">Published & drafts</option><option value="published">Published</option><option value="draft">Drafts</option></select></>}</div>
    {manage&&<p className={styles.collectionNote}>Published lessons still need class access before students can open them. A learning-path label describes the layout; formative checks provide evidence for mastery.</p>}
    <p className={styles.collectionNote}>{lane==='lesson'?'Start with an explanation, then try a problem. Lessons without a video include written instruction and practice.':lane==='investigation'?'Predict, investigate, and explain. A simulation supports a model; a lab adds evidence from measurements.':lane==='mission'?'Use several learning targets together to investigate fictional asteroid 2026-XJ. The scenario is fictional; the physics is real.':'Choose a lesson to begin.'}</p>
    {groups.map(group=><section key={group.id} className={styles.group}><div className={styles.groupHeading}><h3>{group.title}</h3><span>{group.rows.length} {lane==='mission'?(group.rows.length===1?'mission':'missions'):(group.rows.length===1?'lesson':'lessons')}</span></div><div className={styles.cards}>{group.rows.map(row=>{
      const closed=row.lesson.window?.state==='closed'||row.lesson.window?.state==='scheduled'
      const video=isVideoInstructionEntry(row)
      return <article key={row.id} className={styles.card} data-tone={row.kind==='investigation'?'investigate':row.kind==='mission'?'mission':video?'concept':'practice'}><div className={styles.cardTop}><span className={styles.cardLabel}>{row.kind==='mission'?<Rocket size={20}/>:row.kind==='investigation'?<FlaskConical size={20}/>:video?<PlayCircle size={20}/>:<BookOpen size={20}/>}{video?'VIDEO LESSON':row.kind==='mission'?'ASTEROID APPLICATION':row.kind==='investigation'?'INVESTIGATION':'READ & PRACTICE'}</span>{row.source==='new'&&<span className={styles.newBadge}>{manage?'Learning path':'New format'}</span>}</div><h4>{row.title}</h4>{manage&&<p className={styles.collectionNote}>{row.lesson.published?'Published':'Draft'} · Learning-path format{!row.lesson.blockCount?' · Needs activities':''}</p>}<p className={styles.target}>{row.targets[0]?.statement || row.lesson.description || 'Connect this idea to your physics learning targets.'}</p>{row.targets.length>1&&<details><summary>See all {row.targets.length} learning targets</summary><ul>{row.targets.slice(1).map(t=><li key={t.slug}>{t.statement}</li>)}</ul></details>}<div className={styles.resources}><span>{row.hasWorkedExample?'Worked example':'Concept explanation'}</span>{row.hasSimulation&&<span>Simulation</span>}{row.readings.length>0&&<span>Textbook reading</span>}</div><div className={styles.cardFoot}><span>{row.lesson.estimated_time ? `About ${row.lesson.estimated_time} min` : 'Work at your pace'}{row.lesson.completion?` · ${LESSON_COMPLETION_LABELS[row.lesson.completion.state]}`:(row.lesson.progress??0)>0?` · ${row.lesson.progress}% of lesson`:''}</span>{manage?<Link href={editHref(`/admin/lessons/${row.id}/build`,row.lesson)}>Edit content<ArrowRight size={16}/></Link>:closed?<span>Class access closed</span>:<Link href={`/lessons/${row.lesson.slug}`}>{(row.lesson.progress??0)>0?'Continue':'Open lesson'}<ArrowRight size={16}/></Link>}</div>{manage&&<div className={styles.manageLinks}><Link href={editHref(`/admin/lessons/${row.id}/preview`,row.lesson)}>Student preview</Link><Link href={editHref(`/admin/lessons/${row.id}/edit`,row.lesson)}>Settings & publish</Link><Link href={editHref('/admin/lesson-access',row.lesson)}>Class access</Link></div>}</article>
    })}</div></section>)}
    {!filtered.length&&<div className={styles.empty}><h3>No lessons in this view yet</h3><p>{manage?'Try another collection, unit, or publication status.':available.size?'Try another unit or clear your search. Your teacher controls which lessons are open for your class.':'Your teacher will open lessons for your class here.'}</p><Button variant="outline" onClick={()=>update({unit:'all',q:'',collection:'videos',status:'all'})}>Show video lessons</Button></div>}
    </>}
    {staff&&!manage&&<p className={styles.collectionNote}>Teacher tools: <Link href="/admin/lessons/roadmap">Target coverage & video recording queue</Link></p>}
  </div>
}
