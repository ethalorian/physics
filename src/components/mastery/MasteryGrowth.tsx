'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, ChevronDown, Compass, TrendingUp } from 'lucide-react'
import { DEFAULT_RECENCY_WEIGHT, domainScore, decayingAverage, type Domain, type LearningTarget, type MasteryRecord, type RubricDimension } from '@/data/curriculum-types'
import { DOMAIN_ORDER, DOMAIN_LABEL, buildRecordsByTarget, levelWord } from './mastery-display'
import { growthSnapshot, growthNextStep, growthDate, type GrowthTarget } from '@/components/growth/growth-model'
import s from '@/components/growth/growth.module.css'

export interface MasteryGrowthProps {
  studentName?: string
  unitName?: string
  targets: LearningTarget[]
  records: MasteryRecord[]
  taskResult?: { scores: Record<RubricDimension, number>; overall?: number }
  recencyWeight?: number
}
const DOMAIN_HINT: Record<Domain, string> = { knowledge: 'Know the ideas', reasoning: 'Explain the why', skill: 'Put it into practice', product: 'Bring it together' }
const DOMAINS: Record<Domain, string> = { knowledge: 'K', reasoning: 'R', skill: 'S', product: 'P' }

export default function MasteryGrowth({ targets, records, taskResult, recencyWeight = DEFAULT_RECENCY_WEIGHT }: MasteryGrowthProps) {
  const snapshot = growthSnapshot(targets, records, recencyWeight)
  const byTarget = buildRecordsByTarget(records)
  const [filter, setFilter] = useState<Domain | 'all'>('all')
  const [selected, setSelected] = useState<string | null>(null)
  const detailRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (selected && window.matchMedia('(max-width: 700px)').matches) detailRef.current?.focus()
  }, [selected])
  const visible = snapshot.items.filter(i => filter === 'all' || i.target.domain === filter)
  const item = visible.find(i => i.target.id === selected) ?? visible.find(i => i.target.id === snapshot.recent[0]?.target.id) ?? visible[0]
  function chooseDomain(domain: Domain | 'all') { setFilter(domain); setSelected(null) }
  return <div>
    <div className={s.domainMap} role="group" aria-label="Filter targets by kind of thinking">
      {DOMAIN_ORDER.map(domain => {
        const domainTargets = snapshot.items.filter(i => i.target.domain === domain)
        const value = domainScore(domain, targets, byTarget, recencyWeight)
        return <button type="button" key={domain} aria-pressed={filter === domain} onClick={() => chooseDomain(filter === domain ? 'all' : domain)} className={s.domainCard} data-selected={filter === domain}>
          <span className={s.domainBadge}>{DOMAINS[domain]}</span><span className={s.domainTitle}>{DOMAIN_LABEL[domain]}</span><span className={s.domainHint}>{DOMAIN_HINT[domain]}</span>
          <span className={s.domainValue}>{value === null ? '—' : value.toFixed(1)}<small>{value === null ? 'Awaiting evidence' : `${levelWord(value)} · out of 3`}</small></span>
          <span className={s.domainTrack} aria-hidden="true"><span style={{ width: `${value === null ? 0 : value / 3 * 100}%` }}/></span>
          <span className={s.domainCount}>{domainTargets.filter(t => t.value !== null).length} of {domainTargets.length} targets rated</span>
        </button>
      })}
    </div>
    <div className={s.targetToolbar}><h3>{filter === 'all' ? 'All learning targets' : `${DOMAIN_LABEL[filter]} targets`} <span>({visible.length})</span></h3>{filter !== 'all' && <button type="button" className={s.textButton} onClick={() => chooseDomain('all')}>Show all targets</button>}<p>Newer evidence counts more. Earlier work still matters.</p></div>
    {visible.length === 0 ? <div className={s.state}><Compass size={28} aria-hidden="true"/><h3>Your story starts with one target.</h3><p>Learning targets will appear here when they’re available. Continue with the lessons your teacher has opened.</p><Link className={s.primaryLink} href="/lessons">Go to lessons <ArrowRight size={16} aria-hidden="true"/></Link></div> : <div className={s.targetExplorer}>
      <div className={s.targetList} role="group" aria-label="Choose a learning target">{visible.map((t, index) => <button key={t.target.id} type="button" className={s.targetButton} aria-pressed={item?.target.id === t.target.id} aria-controls="growth-target-detail" data-selected={item?.target.id === t.target.id} onClick={() => setSelected(t.target.id)}>
        <span className={s.targetNode} data-rated={t.value !== null}>{t.value !== null && t.value >= 2.5 ? <Check size={17} aria-label="Got it"/> : String(index + 1).padStart(2, '0')}</span>
        <span><span className={s.targetType}>{DOMAIN_LABEL[t.target.domain]}</span><span className={s.targetStatement}>{t.target.statement}</span><span className={s.targetStatus}>{t.value === null ? 'Awaiting evidence' : `${levelWord(t.value)} · ${t.value.toFixed(1)} / 3`}{t.trend === 'up' && <span className={s.improving}><TrendingUp size={13} aria-hidden="true"/>Moving forward</span>}</span></span><ArrowRight className={s.targetArrow} size={16} aria-hidden="true"/>
      </button>)}</div>
      <div id="growth-target-detail" className={s.detailWrapper} ref={detailRef} tabIndex={-1}>{item && <TargetDetail key={item.target.id} item={item} weight={recencyWeight}/>}</div>
    </div>}
    {taskResult && <section className={s.transfer}><div><p className={s.eyebrow}>A different lens</p><h3>Your transfer task</h3><p>Scored separately from your mastery ratings, on a 0–4 scale.</p></div><dl>{(['science','reasoning','communication','transfer'] as RubricDimension[]).map(d => <div key={d}><dt>{d}</dt><dd>{taskResult.scores[d] ?? 0}<span> / 4</span></dd></div>)}</dl>{taskResult.overall !== undefined && <p>Overall: {taskResult.overall} / 4. Your lowest dimension sets this result.</p>}</section>}
  </div>
}

function TargetDetail({ item, weight }: { item: GrowthTarget; weight: number }) {
  const [allHistory, setAllHistory] = useState(false)
  const shown = [...item.history].reverse().slice(0, allHistory ? undefined : 3)
  return <article className={s.detail} aria-label="Selected target evidence">
    <div className={s.detailTop}><p className={s.eyebrow}>Your evidence, up close</p>{item.latest && <span>Updated {growthDate(item.latest.observedAt)}</span>}</div>
    <h3>{item.target.statement}</h3>
    <div className={s.rating}><strong>{item.value === null ? '—' : item.value.toFixed(1)}</strong><div><b>{item.value === null ? 'Awaiting evidence' : levelWord(item.value)}</b><span>{item.value === null ? 'No teacher rating yet' : 'Current weighted rating · out of 3'}</span></div></div>
    {item.history.length > 1 ? <EvidenceChart item={item} weight={weight}/> : <div className={s.firstEvidence}>{item.history.length === 1 ? 'Your first point is on the map. Another teacher rating will start your growth line.' : 'Your work matters before it has a rating. Once your teacher reviews it, you’ll see that evidence here.'}</div>}
    <div className={s.nextStep}><span className={s.nextIcon}><Compass size={19} aria-hidden="true"/></span><div><h4>One next step</h4><p>{growthNextStep(item)}</p><a href="#growth-feedback">Read my teacher’s feedback <ArrowRight size={15} aria-hidden="true"/></a></div></div>
    <div className={s.historyHeading}><h4>Teacher ratings</h4><span>{item.history.length} recorded</span></div>
    {shown.length ? <ol className={s.history}>{shown.map((r, i) => <li key={`${r.observedAt}-${i}`}><span className={s.historyDot} aria-hidden="true"/><div><b>{growthDate(r.observedAt)}</b><span>{evidenceLabel(r.evidenceSource)}</span></div><span className={s.historyScore}>{r.level} / 3<span>{levelWord(r.level)}</span></span></li>)}</ol> : <p className={s.help}>No rated evidence yet. This is not a zero or a missing assignment.</p>}
    {item.history.length > 3 && <button type="button" className={s.historyButton} onClick={() => setAllHistory(v => !v)} aria-expanded={allHistory}>{allHistory ? 'Show recent ratings' : `See all ${item.history.length} ratings`}<ChevronDown size={15} aria-hidden="true"/></button>}
    <p className={s.help}>Each new rating contributes {Math.round(weight * 100)}% to your updated score. Earlier evidence contributes the rest. This is a mastery rating, not a percentage grade.</p>
  </article>
}
// Some evidence_source strings are machine references. Expose the activity,
// not a database UUID; the feedback card carries the detailed review.
function evidenceLabel(source?: string) {
  if (!source) return 'Teacher observation'
  if (source.toLowerCase().includes('lesson')) return 'Lesson evidence'
  if (source.toLowerCase().includes('quiz')) return 'Quiz evidence'
  if (source.toLowerCase().includes('reading')) return 'Reading evidence'
  if (source.toLowerCase().includes('simulation')) return 'Investigation evidence'
  if (/[a-f0-9]{8}-[a-f0-9-]{27}/i.test(source)) return 'Reviewed work'
  return source.replaceAll('_', ' ')
}
function EvidenceChart({ item, weight }: { item: GrowthTarget; weight: number }) {
  const history = item.history
  const series = history.map((_, i) => decayingAverage(history.slice(0, i + 1).map(r => r.level), weight)!)
  const x = (i: number) => 35 + i / (series.length - 1) * 345
  const y = (v: number) => 132 - (v - 1) * 53
  const points = series.map((v, i) => `${x(i)},${y(v)}`).join(' ')
  return <figure className={s.chart}>
    <figcaption>How this target is growing <span>Weighted rating after each review</span></figcaption>
    <svg viewBox="0 0 400 160" role="img" aria-label={`Weighted rating from ${series[0].toFixed(1)} to ${series.at(-1)!.toFixed(1)} across ${series.length} teacher ratings. Individual ratings are listed below.`}>
      {[1,2,3].map(v => <g key={v}><line className={s.chartGrid} x1="35" x2="380" y1={y(v)} y2={y(v)}/><text x="12" y={y(v) + 4}>{v}</text></g>)}
      <polyline className={s.chartLine} points={points}/>{series.map((v,i) => <circle className={s.chartDot} key={i} cx={x(i)} cy={y(v)} r={i === series.length - 1 ? 5 : 3}/>)}
    </svg><div className={s.chartDates}><span>{growthDate(history[0].observedAt)}</span><span>{growthDate(history.at(-1)!.observedAt)}</span></div>
  </figure>
}
