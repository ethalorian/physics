'use client'
import { useEffect, useId, useRef, useState } from 'react'
import InteractiveChapterReader, { type ReaderProps } from './InteractiveChapterReader'
import chapters from '@/data/etf-original/chapters.json'
import studies from '@/data/etf-original/figure-studies.json'
import { etfPages } from '@/data/etf-original/source'
import EtfFigureStudy, { pageImage } from './EtfFigureStudy'
import EtfStreetPlan from './EtfStreetPlan'
import EtfBenchModel from './EtfBenchModel'
import styles from './etf-edition.module.css'

type Edition = {chapter:number;first:number;last:number;pages:{printed:number;figure?:number[];blocks:{kind:'body'|'heading'|'extra';text:string}[]}[]}
type Chapter = typeof chapters[number]
type Props = Omit<ReaderProps,'renderOpening'|'renderSection'>
function PrintedPage({chapter,page}:{chapter:Chapter;page:number}) {
  const [zoom,setZoom]=useState(false),[failed,setFailed]=useState(false)
  return <figure className={styles.printed}><figcaption><strong>Original printed page {page}</strong><button type="button" aria-pressed={zoom} onClick={()=>setZoom(v=>!v)}>{zoom?'Fit page':'Enlarge page'}</button></figcaption>
    {failed?<p>The page image could not load. <a href={chapter.url+'#page='+(page-chapter.from+1)} target="_blank" rel="noreferrer">Open the same printed page in the source PDF</a>.</p>:<div tabIndex={zoom?0:undefined} className={styles.paperScroll} aria-label={zoom?'Enlarged page, scroll to inspect':undefined}>
      {/* Native image keeps protected pages same-origin and fetches only the visible page. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={zoom?styles.enlarged:styles.fit} alt={chapter.title+' · printed page '+page+'. Select Reading text for selectable text.'} src={pageImage(chapter.number,page)} onError={()=>setFailed(true)}/>
    </div>}</figure>
}

function SourceReading({chapter,study,assigned,storageKey}:{chapter:Chapter;study:typeof studies[number];assigned:boolean;storageKey:string}) {
  const initial=assigned&&chapter.number===2?12:chapter.from
  const end=assigned&&chapter.number===2?14:assigned&&chapter.number===10?87:chapter.to
  const [page,setPage]=useState(initial),[original,setOriginal]=useState(false),[edition,setEdition]=useState<Edition|null>(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0)
  const heading=useRef<HTMLHeadingElement>(null),picker=useId()
  useEffect(()=>{try{const previous=Number(localStorage.getItem(storageKey));if(previous>=initial&&previous<=end)setPage(previous)}catch{/* Device storage is optional. */}},[storageKey,initial,end])
  useEffect(()=>{
    const controller=new AbortController()
    async function load(){try{
      const response=await fetch('/api/etf-reader/'+chapter.number,{signal:controller.signal})
      if(!response.ok)throw Error('Reader pages could not be loaded.')
      const data:Edition=await response.json()
      if(data.chapter!==chapter.number||!data.pages.length)throw Error('Reader pages could not be loaded.')
      if(!controller.signal.aborted){setEdition(data);setError('')}
    }catch{if(!controller.signal.aborted)setError('The reading text could not load. You can retry or use the printed page.')}}
    void load()
    return ()=>controller.abort()
  },[chapter.number,attempt])
  function go(n:number,focus=false){setPage(n);try{localStorage.setItem(storageKey,String(n))}catch{/* Optional. */}if(focus)requestAnimationFrame(()=>heading.current?.focus())}
  const current=edition?.pages.find(p=>p.printed===page)
  const body=current?.blocks.filter(b=>b.kind!=='extra')??[],extras=current?.blocks.filter(b=>b.kind==='extra')??[]
  const atStudy=page===study.page
  const crop=current?.figure
  return <div className={styles.edition}><div className={styles.bar}><div><p className={styles.kicker}>{assigned?'Assigned reading':'Chapter reading'} · pp. {initial}–{end}</p><h3 tabIndex={-1} ref={heading}>Printed page {page}</h3></div>
    <label htmlFor={picker}>Go to page <select id={picker} value={page} onChange={e=>go(Number(e.target.value))}>{Array.from({length:end-initial+1},(_,i)=>initial+i).map(n=><option key={n} value={n}>{n}{n===study.page?' · figure study':''}</option>)}</select></label></div>
    <div className={styles.mode}><div className={styles.controls}><button type="button" aria-pressed={!original} onClick={()=>setOriginal(false)}>Reading text</button><button type="button" aria-pressed={original} onClick={()=>setOriginal(true)}>Printed page</button></div>{!atStudy&&study.page>=initial&&study.page<=end&&<button type="button" className={styles.studyJump} onClick={()=>{setOriginal(false);go(study.page,true)}}>Explore the figure on p. {study.page} →</button>}</div>
    {original?<PrintedPage key={page} chapter={chapter} page={page}/>:<>
      {error?<p role="alert">{error} <button type="button" onClick={()=>{setError('');setAttempt(i=>i+1)}}>Retry reading</button></p>:!edition?<p role="status">Opening the original reading…</p>:<div className={styles.prose}>{body.map((b,i)=>b.kind==='heading'?<h4 key={i}>{b.text}</h4>:<p key={i}>{b.text}</p>)}</div>}
      {crop&&!atStudy&&<figure className={styles.originalFigure}><svg style={{aspectRatio:(crop[2]*10)+' / '+(crop[3]*12.88)}} viewBox={`${crop[0]*10} ${crop[1]*12.88} ${crop[2]*10} ${crop[3]*12.88}`} role="img" aria-label={'Original illustration on printed page '+page+' of '+chapter.title}><image href={pageImage(chapter.number,page)} width="1000" height="1288" preserveAspectRatio="none"/></svg><figcaption>From printed page {page}. <button type="button" onClick={()=>setOriginal(true)}>Inspect in the original layout</button></figcaption></figure>}
      {atStudy&&<><EtfFigureStudy study={study}/>{chapter.number===10?<EtfStreetPlan/>:<EtfBenchModel chapter={chapter.number}/>}</>}
      {extras.length>0&&<details key={page} className={styles.margin} open={!body.length}><summary>Captions, terms and other text on this page</summary>{extras.map((b,i)=><p key={i}>{b.text}</p>)}</details>}
    </>}
    <nav aria-label="Original reading pages" className={styles.turn}><button type="button" disabled={page===initial} onClick={()=>go(page-1,true)}>← Previous page</button><span>{page-initial+1} of {end-initial+1}</span><button type="button" disabled={page===end} onClick={()=>go(page+1,true)}>Next page →</button></nav>
    <p className={styles.credit}>Engineering the Future · © 2008 Museum of Science, Boston. Original reading and illustrations. <a href={chapter.url+'#page='+(page-chapter.from+1)} target="_blank" rel="noopener noreferrer">Source PDF · p. {page}</a></p>
  </div>
}

export default function EtfChapterReader(props:Props) {
  const c=chapters.find(ch=>ch.number===props.definition.chapter)!,study=studies.find(s=>s.chapter===c.number)!
  const context=props.assignment?.id??'library',pageKey=props.storageKey+':etf-pages:'+context
  return <InteractiveChapterReader {...props} compactAssignment renderOpening={start=><section className={styles.cover}>
    <div className={styles.coverRule}><span>Engineering the Future</span><span>Chapter {String(c.number).padStart(2,'0')}</span></div>
    <p className={styles.kicker}>An engineer’s account · English edition</p><h1>{c.title}</h1><p className={styles.byline}>By {study.author}</p><p className={styles.question}>{c.heading}</p>
    <button type="button" className={styles.start} onClick={start}>Begin the case study <span aria-hidden="true">→</span></button>
    <p className={styles.coverNote}>{props.assignment?'Assigned pp. '+etfPages(c):'Printed pp. '+c.from+'–'+c.to} · Illustrated reading and figure study</p>
  </section>} renderSection={()=><SourceReading key={pageKey} chapter={c} study={study} assigned={Boolean(props.assignment)} storageKey={pageKey}/>}/>
}
