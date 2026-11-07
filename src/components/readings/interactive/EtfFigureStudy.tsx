'use client'
import { useEffect, useId, useState } from 'react'
import studies from '@/data/etf-original/figure-studies.json'
import styles from './etf-edition.module.css'
export type FigureStudy = typeof studies[number]
export function pageImage(chapter:number, page:number) { return '/api/etf-reader/'+chapter+'?page='+page }

export default function EtfFigureStudy({study}:{study:FigureStudy}) {
  const [active,setActive]=useState(0),[playing,setPlaying]=useState(false)
  const clip=useId()
  const stop=study.stops[active]
  useEffect(()=>{
    if(!playing) return
    const timer=window.setTimeout(()=>{
      if(active>=study.stops.length-1) setPlaying(false)
      else setActive(active+1)
    },4200)
    return ()=>window.clearTimeout(timer)
  },[active,playing,study])
  const [x,y,w,h]=study.crop
  return <figure id={'figure-study-'+study.chapter} className={styles.study}><figcaption><p className={styles.kicker}>Figure study · printed p. {study.page}</p><h3>{study.title}</h3></figcaption>
    <div className={styles.studyGrid}><div className={styles.plate}><svg viewBox={`${x*10} ${y*12.88} ${w*10} ${h*12.88}`} role="img" aria-label={study.title+' · '+stop.label}>
      <defs><clipPath id={clip}><rect x={x*10} y={y*12.88} width={w*10} height={h*12.88}/></clipPath></defs>
      <image clipPath={'url(#'+clip+')'} href={pageImage(study.chapter,study.page)} width="1000" height="1288" preserveAspectRatio="none"/>
      <g className={styles.pin} style={{transform:'translate('+(x+w*stop.x/100)*10+'px,'+(y+h*stop.y/100)*12.88+'px)'}}><circle r={Math.max(7,Math.min(w,h)*.29)} fill="none" stroke="#fff" strokeWidth="5"/><circle r={Math.max(7,Math.min(w,h)*.29)} fill="none" stroke="#11745e" strokeWidth="2.5"/></g>
    </svg></div><div className={styles.annotation}><p className={styles.kicker}>Look {active+1} of {study.stops.length}</p><h4>{stop.label}</h4><p>{stop.detail}</p><div className={styles.controls} aria-label="Explore the figure">{study.stops.map((s,i)=><button type="button" key={s.label} aria-label={'Look '+(i+1)+' · '+s.label} aria-pressed={active===i} onClick={()=>{setPlaying(false);setActive(i)}}>{i+1}</button>)}<button type="button" aria-pressed={playing} onClick={()=>{if(!playing&&active===study.stops.length-1)setActive(0);setPlaying(!playing)}}>{playing?'Pause tour':'Play tour'}</button></div></div></div>
    <p className={styles.credit}>Detail from the original printed page. Use “Printed page” to see the full illustration and its caption.</p>
  </figure>
}
