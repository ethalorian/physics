'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { binderDayLabel, binderMaterials, type BinderLesson, type BinderSection, type BinderSource } from '@/lib/binder-reading'
import s from './BinderDailyReader.module.css'

const letters: BinderSection[] = ['A','B','C','D','E']

// Approved source markup has only four inline tags. Everything else is rendered as text.
function paragraph(text: string, show: (section: BinderSection) => void) {
  const stack: {tag:string; children:ReactNode[]}[] = [{tag:'',children:[]}]
  for (const [i, token] of text.split(/(<\/?(?:b|eq|var|sub)>)/).entries()) {
    const current = stack[stack.length-1]
    if (/^<(b|eq|var|sub)>$/.test(token)) stack.push({tag:token.slice(1,-1),children:[]})
    else if (/^<\//.test(token) && stack.length > 1) {
      const {tag,children} = stack.pop()!
      const Tag = tag === 'var' ? 'var' : tag === 'sub' ? 'sub' : 'strong'
      stack[stack.length-1].children.push(<Tag key={i}>{children}</Tag>)
    } else {
      for (const piece of token.split(/(Section [A-E]\b)/)) {
        const match = /^Section ([A-E])$/.exec(piece)
        current.children.push(match ? <button type="button" className={s.tab} key={i+'-'+current.children.length} onClick={()=>show(match[1] as BinderSection)}>{piece}</button> : piece)
      }
    }
  }
  return stack[0].children
}

function SectionViewer({lesson,section,onClose}: {lesson:BinderLesson;section:BinderSection;onClose:()=>void}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(()=>{const dialog=ref.current;dialog?.showModal();return ()=>dialog?.close()},[])
  const source=lesson.sections[section]
  return <dialog ref={ref} className={s.dialog} aria-labelledby="binder-section-title" onCancel={onClose}>
    <header><h3 id="binder-section-title">Section {section} · {source.title}</h3><button type="button" autoFocus onClick={onClose}>Close</button></header>
    <svg viewBox={source.box.join(' ')} role="img" aria-label={'Printed note excerpt: '+source.title}><image href={binderMaterials(lesson)+'.webp'} width="612" height="792" /></svg>
    <details><summary>Read section text</summary><p>{source.text}</p></details>
    <a href={lesson.packet+'#page=1'} target="_blank" rel="noreferrer">Open full-size note page ↗</a>
  </dialog>
}

function WordPractice({lesson}:{lesson:BinderLesson}) {
  const [index,setIndex]=useState(0), [choice,setChoice]=useState<string|null>(null)
  const word=lesson.words[index]
  return <section className={s.practice}><h3>Practice the vocabulary</h3><p>Which term fits this description from the notes?</p>
    <p className={s.definition}>{word.definition}</p><div className={s.choices}>{lesson.words.map(w=><button key={w.term} type="button" aria-pressed={choice===w.term} onClick={()=>setChoice(w.term)}>{w.term}</button>)}</div>
    <p aria-live="polite">{choice && (choice===word.term ? 'Correct. '+word.term+' matches that description.' : 'Try again. Open Section A to compare the meanings.')}</p>
    <button type="button" onClick={()=>{setIndex((index+1)%lesson.words.length);setChoice(null)}}>{index===lesson.words.length-1?'Start again':'Next word'}</button>
  </section>
}

function VelocityGraph({honors}:{honors:boolean}) {
  const [seconds,setSeconds]=useState(honors?5:4)
  const vi=honors?20:0, vf=honors?0:4, displacement=(vi+vf)*seconds/2
  const x=40+seconds*29, start=122-vi*(honors?4.5:22.5), end=122-vf*(honors?4.5:22.5)
  return <details className={s.explore}><summary>Explore the velocity–time graph</summary>
    <p>Hold the starting and final velocities fixed. Change the duration and compare the shaded area with the displacement.</p>
    <label>Duration · {seconds} s <input type="range" min="1" max="8" value={seconds} onChange={e=>setSeconds(+e.target.value)} /></label>
    <svg viewBox="0 0 310 155" role="img" aria-label={`Velocity changes uniformly from ${vi} to ${vf} m/s in ${seconds} seconds. Displacement ${displacement} m.`}>
      <path d={`M40 122 L40 ${start} L${x} ${end} L${x} 122 Z`} fill="#b5d8e7"/><path d="M40 21V122H281" fill="none" stroke="#222"/>
      <path d={`M40 ${start} L${x} ${end}`} fill="none" stroke="#174760" strokeWidth="3"/>
      <g fontSize="11" fill="#222"><text x="7" y="15">v (m/s)</text><text x="14" y="35">{Math.max(vi,vf)}</text><text x="27" y="127">0</text><text x={x} y="138" textAnchor="middle">{seconds}</text><text x="275" y="150">t (s)</text></g>
    </svg><p aria-live="polite"><strong>Δx = ½({vi} + {vf}) × {seconds} = {displacement} m</strong></p></details>
}

export default function BinderDailyReader({source,heading=true,initialSection}:{source:BinderSource;heading?:boolean;initialSection?:BinderSection}) {
  const [lesson,setLesson]=useState<BinderLesson|null>(null),[error,setError]=useState(false),[retry,setRetry]=useState(0),[section,setSection]=useState<BinderSection|null>(null)
  const url=binderMaterials(source)
  useEffect(()=>{
    const controller=new AbortController()
    setLesson(null);setError(false);setSection(initialSection??null)
    fetch(url+'.json',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{if(!controller.signal.aborted)setLesson(data)}).catch(()=>{if(!controller.signal.aborted)setError(true)})
    return ()=>controller.abort()
  },[url,retry,initialSection])
  if(error)return <p role="alert">The binder reading could not load. <button type="button" onClick={()=>setRetry(retry+1)}>Retry</button></p>
  if(!lesson)return <p role="status">Opening the daily reading…</p>
  return <article className={s.reader}><header><p className={s.eyebrow}>{lesson.edition.toUpperCase()} Physics{!heading && ` · ${binderDayLabel(lesson.day)}`}</p>
    {heading&&<h1>{binderDayLabel(lesson.day)} · {lesson.title}</h1>}<p>{lesson.subtitle}</p></header>
    <nav aria-label="Daily note sections"><p>Open a tab to inspect the original note page.</p><div>{letters.map(letter=><button type="button" key={letter} className={s.tab} onClick={()=>setSection(letter)}>Section {letter}</button>)}</div></nav>
    <div className={s.prose}>{lesson.paragraphs.map((p,i)=><p key={i}>{paragraph(p,setSection)}</p>)}</div>
    {lesson.day===8&&<VelocityGraph honors={lesson.edition==='honors'}/>}
    <WordPractice key={url} lesson={lesson}/><a href={lesson.packet} download>Download notes and reading (PDF)</a>
    {section&&<SectionViewer lesson={lesson} section={section} onClose={()=>setSection(null)}/>}
  </article>
}
