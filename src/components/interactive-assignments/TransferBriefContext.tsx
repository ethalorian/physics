'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { LessonAssignment } from '@/lib/interactive-assignments/catalog'
import { TRANSFER_BRIEF_SCENES } from '@/lib/interactive-assignments/transfer-brief-scenes'
import s from './TransferBriefContext.module.css'

export default function TransferBriefContext({ lesson }: { lesson: LessonAssignment }) {
  const [condition, setCondition] = useState(0)
  if (!lesson.transferBrief) return null
  const scene = TRANSFER_BRIEF_SCENES[lesson.transferBrief.scene]
  const selected = scene.conditions[condition] ?? scene.conditions[0]
  return <section className={s.brief} aria-label="Transfer Brief scenario">
    <header className={s.header}>
      <div><p className={s.kicker}>Explore the situation</p><h2>{scene.title}</h2></div>
      {scene.conditions.length > 1 && <div className={s.conditions} role="group" aria-label="Compare conditions in this scenario">
        {scene.conditions.map((item, index) => <button key={item.label} type="button" aria-pressed={condition === index} onClick={() => setCondition(index)}>{item.label}</button>)}
      </div>}
    </header>
    <figure className={s.figure}>
      <Image src={selected.image} alt={selected.description} width={900} height={420} unoptimized className={s.scene}/>
      <figcaption><span role="status">{selected.label}</span><span>Model sketch · Not to scale</span></figcaption>
    </figure>
    <div className={`${s.facts} ${selected.facts.length === 4 ? s.fourFacts : ''}`} aria-label="Given evidence">{selected.facts.map(fact => <div key={fact.label}><span>{fact.label}</span><strong>{fact.value}</strong><small>{fact.note}</small></div>)}</div>
    <p className={s.model}><strong>Model:</strong> {scene.model}</p>
    <p className={s.dataNote}>Illustrative classroom data. Use the model to support a decision, then consider its limits.</p>
    <details className={s.fullContext}><summary>Read the full scenario</summary><p>{lesson.sections[0].learn}</p></details>
  </section>
}
