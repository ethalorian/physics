'use client'

import {useState, type RefObject} from 'react'
import AvatarCharacter from './AvatarCharacter'
import {captureModelEvidence,compareEvidence,type EvidenceSnapshot} from '@/lib/avatar/investigation-evidence'
import type {InvestigationMission} from '@/lib/avatar/investigation-missions'
import {useInvestigationParticipation} from './InvestigationParticipation'
import s from './investigation-evidence.module.css'

export default function InvestigationEvidence({source,mission,actorInModel,onCapture}: {
  source:RefObject<HTMLDivElement|null>;mission:InvestigationMission;actorInModel:boolean;onCapture:()=>void
}) {
  const person=useInvestigationParticipation()
  const [before,setBefore]=useState<EvidenceSnapshot|null>(null),[after,setAfter]=useState<EvidenceSnapshot|null>(null),[notice,setNotice]=useState('')
  const changes=before&&after?compareEvidence(before,after):[]
  function capture(which:'before'|'after'){
    if(!source.current)return
    const snapshot=captureModelEvidence(source.current)
    if(!snapshot.observations.length){setNotice('Inspect the model first. There is no visible observation to capture in this view.');return}
    onCapture()
    if(which==='before'){setBefore(snapshot);setAfter(null)}else setAfter(snapshot)
    setNotice(which==='before'?'Reference captured. Change one condition, then capture a comparison.':'Comparison captured. Use the evidence in your answer or trial notebook.')
  }
  return <section className={s.station} data-avatar-ignore lang="en" translate="yes" aria-label="Your avatar’s evidence station">
    {person?.active&&!actorInModel&&<div className={s.scientist} aria-hidden="true"><AvatarCharacter portrait={person.portrait} sampleStudent={person.sample} pose="side"/><svg viewBox="0 0 90 50" className={s.notebook}><path d="M4 15L40 3L86 15V48L40 36L4 48Z" fill="var(--card)" stroke="var(--foreground)" strokeWidth="2"/><path d="M40 3V36M12 22L33 15M48 15L77 23M12 30L33 23M48 23L77 31" stroke="var(--primary)" strokeWidth="2"/></svg></div>}
    <div className={s.work}><p className={s.role}>{mission.role}</p><h4>My evidence comparison</h4><p>{mission.test}</p>
      <div className={s.actions}><button type="button" onClick={()=>capture('before')}>{before?'Replace reference':'Capture reference'}</button><button type="button" disabled={!before} onClick={()=>capture('after')}>{after?'Replace comparison':'Capture comparison'}</button></div>
      <p className={s.status} role="status">{notice||'Use the model above to collect evidence for your explanation.'}</p>
      {before&&<div className={s.comparison}>{[before,after].map((snapshot,i)=>snapshot&&<details key={i} open><summary>{i?'Comparison':'Reference'}</summary>{snapshot.observations.map((observation,j)=><p key={j}>{observation}</p>)}{snapshot.settings.length>0&&<details><summary>Conditions at capture</summary><dl>{snapshot.settings.map(setting=><div key={setting.name}><dt>{setting.name}</dt><dd>{setting.value}</dd></div>)}</dl></details>}</details>)}</div>}
      {after&&<div className={s.reason}><strong>What changed?</strong>{changes.length?<ul>{changes.map(change=><li key={change.name}>{change.name}: {change.before} → {change.after}</li>)}</ul>:<p>The captured controls match. Compare the observations and check the model time, viewpoint, or assumptions.</p>}<p>{mission.explain}</p></div>}
      <small>These comparison notes last while this activity is open. Record your conclusion in the assignment answers or the simulation’s trial notebook to keep it.</small>
    </div>
  </section>
}
