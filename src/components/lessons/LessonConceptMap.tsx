'use client'

import { LESSON_COMPLETION_LABELS } from '@/lib/lesson-completion'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowLeftRight, ArrowRight, BookOpen, Box, Check, CircleDot, Compass, Expand, FlaskConical, Gauge, LockKeyhole, Minus, MoveHorizontal, Navigation, Orbit, Plus, RefreshCw, Timer } from 'lucide-react'
import { conceptLayout, connectionPath, nextConceptLesson, type ConceptLesson, type LessonConceptMapData } from '@/lib/lesson-concept-map'
import styles from './LessonConceptMap.module.css'

const icons = {1:BookOpen,2:Orbit,3:MoveHorizontal,4:Box,5:Navigation,6:ArrowLeftRight,7:Timer,8:Gauge}
function accessLabel(lesson: ConceptLesson) {
  if(lesson.watchHref) return 'Video available'
  if(lesson.access==='scheduled') return 'Opens soon'
  if(lesson.access==='closed') return 'Access closed'
  if(lesson.access!=='open') return 'Not open yet'
  if(lesson.completion) return LESSON_COMPLETION_LABELS[lesson.completion.state]
  if(lesson.progress>=100) return 'Completed'
  return lesson.progress>0?'In progress':'Open to you'
}
function nodeTone(lesson: ConceptLesson) {
  return lesson.watchHref?'open':lesson.access!=='open'?'locked':lesson.progress>=100?'complete':lesson.progress>0?'progress':'open'
}

export default function LessonConceptMap({data,onRefresh,observer=false}:{data:LessonConceptMapData;onRefresh:()=>void;observer?:boolean}) {
  const [selectedId,setSelectedId]=useState(''),[unit,setUnit]=useState('all'),[zoom,setZoom]=useState(1)
  const viewport=useRef<HTMLDivElement>(null),drag=useRef<{x:number;y:number;left:number;top:number}|null>(null)
  const detail=useRef<HTMLElement>(null),marker=useId().replace(/:/g,'')
  const units=[...new Map(data.nodes.map(n=>[n.unitId,n.unit])).entries()]
  const nodes=useMemo(()=>data.nodes.filter(n=>unit==='all'||n.unitId===unit),[data.nodes,unit])
  const layout=useMemo(()=>conceptLayout(nodes),[nodes])
  const placed=new Map(layout.nodes.map(n=>[n.lesson.id,n]))
  const connections=data.connections.filter(c=>placed.has(c.from)&&placed.has(c.to))
  const next=nextConceptLesson(nodes)
  const selected=nodes.find(n=>n.id===selectedId)??next??nodes[0]
  const related=new Set(connections.filter(c=>c.from===selected?.id||c.to===selected?.id).flatMap(c=>[c.from,c.to]))
  const openCount=nodes.filter(n=>n.access==='open').length
  const videoCount=nodes.filter(n=>n.watchHref).length
  const completed=nodes.filter(n=>n.progress>=100).length
  const incoming=connections.filter(c=>c.to===selected?.id),outgoing=connections.filter(c=>c.from===selected?.id)

  // Fit the graph to a roomy display; preserve readable nodes and horizontal
  // touch scrolling on small screens instead of shrinking text to fit a phone.
  useEffect(()=>{
    const el=viewport.current;if(!el)return
    let previousWidth = -1
    const fit=()=>{if(el.clientWidth===previousWidth)return;previousWidth=el.clientWidth;const scale=Math.max(.72,Math.min(1,(el.clientWidth-16)/layout.width));setZoom(scale);el.scrollLeft=Math.max(0,(layout.width*scale-el.clientWidth)/2)}
    fit();const observer=new ResizeObserver(fit);observer.observe(el);return()=>observer.disconnect()
  },[layout.width])
  const fit=()=>{const el=viewport.current;if(el){setZoom(Math.max(.3,Math.min(1,(el.clientWidth-16)/layout.width)));el.scrollTo({left:0,top:0,behavior:'smooth'})}}
  const focusNext=()=>{
    if(!next)return
    setSelectedId(next.id)
    const pos=placed.get(next.id),el=viewport.current
    if(pos&&el)el.scrollTo({left:Math.max(0,(pos.x+110)*zoom-el.clientWidth/2),top:Math.max(0,pos.y*zoom-80),behavior:'smooth'})
    el?.querySelector<HTMLButtonElement>(`[data-lesson-id="${next.id}"]`)?.focus({preventScroll:true})
  }
  const select=(id:string)=>setSelectedId(id)
  if(!selected)return null
  return <section className={styles.map} aria-label="Lesson concept map">
    <header className={styles.intro}>
      <div><p className={styles.eyebrow}>{observer ? 'PHYSICS CONCEPT MAP' : 'YOUR VIDEO SPINE & PRACTICE'}</p><h2>See how the ideas connect.</h2><p>{observer ? 'Explore the connections and open any published lesson in a read-only preview.' : 'Watch videos anytime to explore the ideas. Open assigned questions and activities from your class calendar.'}</p></div>
      <div className={styles.counts}><span><strong>{videoCount}</strong> videos to watch</span><span><strong>{openCount}</strong> assignments open</span>{!observer&&<span><strong>{completed}</strong> submitted</span>}</div>
    </header>
    <div className={styles.workspace}>
      <div className={styles.mapColumn}>
        <div className={styles.toolbar}>
          <div className={styles.legend} aria-label="Map key"><span><i data-tone="open"/>Open</span>{!observer&&<><span><i data-tone="complete"/>Submitted</span><span><i data-tone="locked"/>Not open</span></>}</div>
          <div className={styles.tools} aria-label="Map controls">
            {units.length>1&&<select aria-label="Map unit" value={unit} onChange={e=>{setUnit(e.target.value);setSelectedId('')}}><option value="all">All units</option>{units.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select>}
            <button type="button" aria-label="Zoom out" disabled={zoom<=.3} onClick={()=>setZoom(z=>Math.max(.3,z-.15))}><Minus size={16}/></button><span className={styles.zoom}>{Math.round(zoom*100)}%</span>
            <button type="button" aria-label="Zoom in" disabled={zoom>=1.6} onClick={()=>setZoom(z=>Math.min(1.6,z+.15))}><Plus size={16}/></button>
            <button type="button" aria-label="Fit map" onClick={fit}><Expand size={17}/></button>
            <button type="button" aria-label="Refresh lesson access" onClick={onRefresh}><RefreshCw size={16}/></button>
          </div>
        </div>
        <div className={styles.viewport} ref={viewport} tabIndex={0} role="region" aria-label="Connected lessons. Scroll to explore and select a lesson to see its connections."
          onPointerDown={e=>{if(e.pointerType!=='mouse'||e.button!==0||(e.target as Element).closest('button'))return;const el=e.currentTarget;drag.current={x:e.clientX,y:e.clientY,left:el.scrollLeft,top:el.scrollTop};el.setPointerCapture(e.pointerId)}}
          onPointerMove={e=>{if(!drag.current)return;e.currentTarget.scrollLeft=drag.current.left-(e.clientX-drag.current.x);e.currentTarget.scrollTop=drag.current.top-(e.clientY-drag.current.y)}}
          onPointerUp={()=>{drag.current=null}} onPointerCancel={()=>{drag.current=null}}>
          <div className={styles.scaledSpace} style={{width:layout.width*zoom,height:layout.height*zoom}}>
            <div className={styles.canvas} style={{width:layout.width,height:layout.height,transform:`scale(${zoom})`}}>
              <svg className={styles.lines} width={layout.width} height={layout.height} aria-hidden="true">
                <defs><marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 1 1 L 9 5 L 1 9" fill="none" stroke="context-stroke" strokeWidth="1.6"/></marker></defs>
                {connections.map(c=><path key={c.from+c.to} d={connectionPath(placed.get(c.from)!,placed.get(c.to)!)} data-active={c.from===selected.id||c.to===selected.id} markerEnd={`url(#${marker})`}/>)}
              </svg>
              {layout.nodes.map(({lesson,x,y})=>{
                const Icon=lesson.sequence?icons[lesson.sequence as keyof typeof icons]??BookOpen:lesson.kind==='investigation'?FlaskConical:BookOpen
                const locked=!lesson.watchHref && lesson.access!=='open'
                return <button type="button" key={lesson.id} data-lesson-id={lesson.id} className={styles.node} style={{left:x,top:y}} data-tone={nodeTone(lesson)} data-selected={lesson.id===selected.id} data-related={related.has(lesson.id)} aria-pressed={lesson.id===selected.id} aria-label={`${lesson.label}. ${accessLabel(lesson)}. Show lesson details.`} onClick={()=>select(lesson.id)}>
                  <span className={styles.nodeTop}><span className={styles.nodeIcon}><Icon size={23} strokeWidth={1.7}/></span><span className={styles.nodeSequence}>{lesson.sequence?`VIDEO ${String(lesson.sequence).padStart(2,'0')}`:lesson.kind==='investigation'?'INVESTIGATE':'PRACTICE'}</span><span className={styles.accessIcon}>{locked?<LockKeyhole size={14}/>:lesson.progress>=100?<Check size={17}/>:<CircleDot size={15}/>}</span></span>
                  <strong>{lesson.label}</strong><span className={styles.nodeStatus}>{accessLabel(lesson)}</span>
                </button>
              })}
              <div className={styles.mapNote}><Compass size={22}/><strong>Ideas build on ideas.</strong><span>Select a lesson to explore its connections.</span></div>
            </div>
          </div>
        </div>
        <div className={styles.mapFooter}><span>{observer ? 'Drag or scroll to explore published lessons and their connections.' : 'Drag or scroll to explore. Videos are available to watch; your calendar lists assigned work.'}</span>{!observer&&next&&<button type="button" onClick={focusNext}>Find my next lesson <ArrowRight size={15}/></button>}<button type="button" className={styles.mobileDetails} onClick={()=>detail.current?.scrollIntoView({behavior:'smooth',block:'start'})}>Selected lesson <ArrowDown size={15}/></button></div>
      </div>
      <aside className={styles.detail} aria-label="Selected lesson details" ref={detail}>
        <div className={styles.detailTop}><span className={styles.eyebrow}>{selected.sequence?`VIDEO ${String(selected.sequence).padStart(2,'0')}`:'EXPLORE THE IDEA'}</span><span className={styles.status} data-tone={nodeTone(selected)}>{selected.watchHref || selected.access==='open'?<CircleDot size={13}/>:<LockKeyhole size={13}/>} {accessLabel(selected)}</span></div>
        <h3>{selected.title}</h3><p className={styles.focus}>{selected.focus}</p>
        {selected.watchHref && !observer ? <><Link className={styles.openLesson} href={selected.watchHref}>Watch video<ArrowRight size={18}/></Link><Link className="inline-flex min-h-11 items-center text-sm text-primary underline" href="/home">Questions & assignments on calendar →</Link></> : selected.access==='open'&&selected.href?<Link className={styles.openLesson} href={selected.href}>{selected.completion?.state==='ready'?'Finish & submit':selected.progress>=100?'Revisit lesson':selected.progress>0?'Continue lesson':'Open lesson'}<ArrowRight size={18}/></Link>:<div className={styles.lockedNotice}><LockKeyhole size={18}/><p>{selected.access==='scheduled'&&selected.opensAt?`Scheduled to open ${new Date(selected.opensAt).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}.`:selected.access==='closed'?'Your teacher has closed access to this lesson.':'Your teacher has not opened this lesson for your class yet.'}<span>You can still explore how this idea connects.</span></p></div>}
        {!selected.watchHref&&selected.progress>0&&<p className={styles.progressNote}>{selected.completion ? `${selected.completion.answered} of ${selected.completion.required} required responses saved. ${LESSON_COMPLETION_LABELS[selected.completion.state]}.` : `${Math.round(selected.progress)}% of lesson completed.`} Saving answers and earning XP do not submit a lesson. Mastery comes from your evidence and teacher feedback.</p>}
        {!!incoming.length&&<section className={styles.connections}><h4>Builds on</h4>{incoming.map(c=>{const n=placed.get(c.from)!.lesson;return <button type="button" key={c.from} onClick={()=>select(n.id)}><span><strong>{n.label}</strong><small>{c.label}</small></span><ArrowRight size={15}/></button>})}</section>}
        {!!outgoing.length&&<section className={styles.connections}><h4>Leads to</h4>{outgoing.map(c=>{const n=placed.get(c.to)!.lesson;return <button type="button" key={c.to} onClick={()=>select(n.id)}><span><strong>{n.label}</strong><small>{c.label}</small></span><ArrowRight size={15}/></button>})}</section>}
        {!!selected.targets.length&&<section className={styles.targets}><h4>Learning targets</h4><ul>{selected.targets.map(t=><li key={t.slug}>{t.statement}</li>)}</ul></section>}
        <p className={styles.detailNote}>{observer ? 'Observer preview · published lessons are read-only.' : 'Videos are available for review. Your teacher assigns questions through the calendar.'}</p>
      </aside>
    </div>
  </section>
}
