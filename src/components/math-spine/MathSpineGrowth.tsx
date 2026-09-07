'use client'
import { MathCompetencyRecord, MathStrand, DEFAULT_RECENCY_WEIGHT } from '@/data/curriculum-types'
import { STRAND_ORDER, STRAND_LABEL } from '@/lib/math-spine'
import { skillEvidence, OBSERVATION_LABEL } from '@/lib/math-student-view'
import { buildRecordsByCompetency } from './math-spine-display'
import MathFeedbackLoop from './MathFeedbackLoop'
import { useState } from 'react'

export interface SpineCompetency {
  id: string
  code: string
  statement: string
  strand: MathStrand
  /** ladder position; falls back to orderIndex when unset */
  sequenceOrder?: number | null
  orderIndex?: number
}

export interface SpineGrant {
  milestone: string
  competencyId?: string
  strand?: string
  points: number
  note?: string
  awardedAt?: string
}

export interface MathSpineGrowthProps {
  studentName?: string
  competencies: SpineCompetency[]
  records: MathCompetencyRecord[]
  grants?: SpineGrant[]
  mathPointsEarned?: number
  recencyWeight?: number
}

export default function MathSpineGrowth({ competencies, records, grants = [], mathPointsEarned = 0, recencyWeight = DEFAULT_RECENCY_WEIGHT }: MathSpineGrowthProps) {
  const bySkill = buildRecordsByCompetency(records)
  const [selected, setSelected] = useState<string | null>(null)
  const [workSkill, setWorkSkill] = useState<string | null>(null)
  const [submission, setSubmission] = useState<string | undefined>()
  const skill = competencies.find(c => c.id === selected)
  const evidence = skillEvidence(bySkill.get(selected ?? '') ?? [], recencyWeight)
  const assessed = competencies.filter(c => bySkill.has(c.id)).length
  function openSkill(id: string) { setSelected(id); setWorkSkill(null); setSubmission(undefined) }
  return <section className="space-y-5 rounded-xl border bg-card p-4 sm:p-6" aria-label="My math skills">
    <div><h2 className="text-xl font-semibold">What I can do</h2><p className="mt-1 text-sm text-muted-foreground">{assessed} of {competencies.length} skills have teacher observations. Choose a skill to see the evidence and your next step.</p></div>
    {competencies.length === 0 && <p>Your skills will appear here when they are available.</p>}
    <div className="grid gap-4 sm:grid-cols-2">{STRAND_ORDER.map(strand => {
      const skills = competencies.filter(c => c.strand === strand).sort((a,b) => (a.sequenceOrder ?? a.orderIndex ?? 0) - (b.sequenceOrder ?? b.orderIndex ?? 0))
      if (!skills.length) return null
      return <section key={strand} className="rounded-lg border p-3"><h3 className="mb-2 font-semibold">{STRAND_LABEL[strand]}</h3><ul className="space-y-1">{skills.map(c => {
        const e = skillEvidence(bySkill.get(c.id) ?? [], recencyWeight)
        return <li key={c.id}><button type="button" onClick={()=>openSkill(c.id)} aria-pressed={selected === c.id} aria-controls="math-skill-evidence" className={`min-h-11 w-full rounded-lg border p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${selected === c.id ? 'border-primary bg-muted' : 'border-transparent hover:bg-muted'}`}>
          <span className="block text-sm font-medium">{c.code} · {c.statement}</span>
          <span className="mt-1 block text-xs text-muted-foreground">{e.latest ? OBSERVATION_LABEL[e.latest.level] : 'Not assessed yet'}</span>
          {e.latest && <span className="mt-1 block text-xs text-muted-foreground">{e.ordered.length} teacher observation{e.ordered.length === 1 ? '' : 's'} · {e.ordered.length === 1 ? 'Initial evidence' : 'View evidence'}</span>}
        </button></li>
      })}</ul></section>
    })}</div>
    <div id="math-skill-evidence" aria-live="polite">
      {skill && <section className="space-y-4 rounded-lg border bg-muted/30 p-4">
        <h3 className="text-lg font-semibold">{skill.statement}</h3>
        <dl className="grid gap-3 sm:grid-cols-2"><div><dt className="text-xs text-muted-foreground">Latest performance</dt><dd className="font-medium">{evidence.latest ? OBSERVATION_LABEL[evidence.latest.level] : 'Not assessed yet'}</dd></div><div><dt className="text-xs text-muted-foreground">Evidence</dt><dd>{evidence.status}{evidence.latest && <> · last observed {new Date(evidence.latest.observedAt).toLocaleDateString()}</>}</dd></div></dl>
        <p><b>Next learning step:</b> {evidence.next}</p>
        <p className="text-sm text-muted-foreground">Your teacher looks at reasoning, accurate steps, units and representations, and applying the skill in another context. Language supports do not automatically mean you needed mathematical help.</p>
        <button type="button" onClick={()=>{setWorkSkill(skill.id);setSubmission(undefined)}} className="min-h-11 rounded border bg-background px-4">See my work and feedback for this skill</button>
        {evidence.ordered.length > 0 && <details><summary className="min-h-11 cursor-pointer py-3 font-medium">Teacher observation history ({evidence.ordered.length})</summary><ol className="space-y-3">{[...evidence.ordered].reverse().map((r,i)=><li key={`${r.observedAt}-${i}`} className="rounded border bg-background p-3 text-sm"><p>{new Date(r.observedAt).toLocaleDateString()} · {OBSERVATION_LABEL[r.level]}</p>{r.submissionId ? <button type="button" className="min-h-11 underline" onClick={()=>{setWorkSkill(skill.id);setSubmission(r.submissionId)}}>Open this work and feedback</button> : <p className="mt-1 text-muted-foreground">{r.evidenceSource ?? 'Teacher observation'} · No linked warm-up available.</p>}</li>)}</ol></details>}
        {workSkill === skill.id && <MathFeedbackLoop key={skill.id} competencyId={skill.id} submissionId={submission} embedded />}
        <details><summary className="min-h-11 cursor-pointer py-3 text-sm">How the practice placement is determined</summary><p className="text-sm">{evidence.value === null ? 'No rating has been recorded. Missing evidence is not a low score.' : `Your weighted rating is ${evidence.value.toFixed(1)} out of 3. Each new observation contributes ${Math.round(recencyWeight*100)}% to the updated value; earlier evidence contributes the rest. This guides practice. A single observation is still initial evidence.`} Time alone does not lower your rating.</p></details>
      </section>}
    </div>
    <details className="border-t pt-3"><summary className="min-h-11 cursor-pointer py-3 font-medium">Past celebrations · {mathPointsEarned} points earned</summary><p className="mb-3 text-sm text-muted-foreground">These recognize past milestones and practice. They are not your current mastery score.</p><ul className="space-y-2 text-sm">{grants.filter(g=>g.milestone !== 'practice-rep').slice(0,6).map((g,i)=><li key={i}>{g.awardedAt && `${new Date(g.awardedAt).toLocaleDateString()} · `}{g.note ?? ({'competency-fluent':'Skill milestone reached','strand-complete':'Strand milestone reached','levelup-almost':'Progress milestone reached','spotlight':'Teacher spotlight'}[g.milestone] ?? 'Math milestone')} · +{g.points} points</li>)}</ul></details>
  </section>
}
