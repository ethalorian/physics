'use client'

import {useRef,useState,type ReactNode} from 'react'
import {useAvatarPortrait} from '@/hooks/useAvatarPortrait'
import AvatarCharacter from './AvatarCharacter'
import CustomizeAvatarLink from './CustomizeAvatarLink'
import s from './reading-companion.module.css'

/** A student chooses evidence from the actual lesson. Official answers stay in their existing fields. */
export default function ReadingCompanion({title,focus,sample=false,children}:{title:string;focus:string;sample?:boolean;children:ReactNode}) {
 const {portrait}=useAvatarPortrait(!sample),source=useRef<HTMLDivElement>(null)
 const [choosing,setChoosing]=useState(false),[passages,setPassages]=useState<string[]>([]),[evidence,setEvidence]=useState(''),[draft,setDraft]=useState('')
 function findEvidence(){
  const texts=Array.from(source.current?.querySelectorAll('p,figcaption,blockquote')??[])
   .filter(node=>!node.closest('[hidden],[aria-hidden="true"],[data-avatar-ignore],button,label'))
   .map(node=>node.textContent?.replace(/\s+/g,' ').trim()??'').filter(text=>text.length>35)
  setPassages(Array.from(new Set(texts)).slice(0,30));setChoosing(true)
 }
 function choose(text:string){setEvidence(text);setChoosing(false)}
 return <div data-reading-companion>
  <div ref={source}>{children}</div>
  <section className={s.scene} lang="en" translate="yes" aria-label="Read and reason with your avatar">
   <div className={s.student}><AvatarCharacter portrait={portrait} sampleStudent={sample} pose="seated"/><CustomizeAvatarLink label="Change your look" language="en">Change your look ↗</CustomizeAvatarLink></div>
   <div className={s.work}><p className={s.role}>Your avatar · Evidence investigator</p><h3>{title}</h3><p>{focus}</p>
    {evidence?<><blockquote>{evidence}</blockquote><p><strong>Make the connection:</strong> What does this evidence show? Explain how it supports or challenges your answer. Include a page, figure, or video time when useful.</p></>:<p>Find a statement, observation, or worked example that helps you answer the question. Bring it to your avatar’s notebook, then explain the connection in your response.</p>}
    <button type="button" onClick={findEvidence}>{evidence?'Choose different evidence':'Find evidence in this step'}</button>
    {choosing&&<div className={s.choices}><h4>Choose the passage you want to use</h4>{passages.length>0&&<div className={s.passages}>{passages.map((passage,index)=><button type="button" key={index} onClick={()=>choose(passage)}>{passage}</button>)}</div>}
     <label>Or note evidence from the PDF, video, or diagram<textarea maxLength={1500} value={draft} onChange={event=>setDraft(event.target.value)} placeholder="Include the page, figure, or video time."/></label><button type="button" disabled={!draft.trim()} onClick={()=>choose(draft.trim())}>Use this evidence</button><button type="button" onClick={()=>setChoosing(false)}>Close</button>
    </div>}
    <small>This is a practice notebook for this step. Put your evidence and reasoning in the answer field to save it with your assignment.</small>
   </div>
  </section>
 </div>
}
