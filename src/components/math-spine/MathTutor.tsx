'use client'
import { useId, useState } from 'react'
import { MATH_TEACHING_GUIDES, type TeachingExample, type TeachingGuide } from '@/lib/math-teaching-guides'
import { resolveMiniLessons } from '@/lib/math-spine-lessons'
import { useTranslator } from '@/lib/math-translate-store'
import MathSpineDiagram from './MathSpineDiagram'

interface Props {
 code: string; customTiers?: unknown; lang?: string; initiallyOpen?: boolean;
 onReturnToWork?: () => void;
}
function WorkedExample({ example, t }: { example: TeachingExample; t: (s: string)=>string }) {
  const [shown,setShown]=useState(1)
  return <section className="space-y-3 rounded-lg border bg-background p-3 sm:p-4" aria-label={t('Worked example')}>
    <p className="text-xs text-muted-foreground">{t('A teaching example. Use the method on your own problem.')}</p>
    <h4 className="font-semibold">{t(example.prompt)}</h4>
    <ol className="space-y-3">{example.steps.slice(0,shown).map((s,i)=><li key={i} className="border-l-2 border-primary pl-3"><p className="text-sm font-semibold">{i+1}. {t(s.action)}</p><p className="mt-1 text-sm text-muted-foreground"><b>{t('Why:')}</b> {t(s.why)}</p></li>)}</ol>
    {shown<example.steps.length && <div className="flex flex-wrap gap-2"><button type="button" className="min-h-11 rounded border px-3 text-sm" onClick={()=>setShown(n=>n+1)}>{t('Show the next step')}</button><button type="button" className="min-h-11 px-3 text-sm underline" onClick={()=>setShown(example.steps.length)}>{t('Show all steps')}</button></div>}
    {shown===example.steps.length && <p className="rounded bg-muted p-3 text-sm"><b>{t('Check the result:')}</b> {t(example.check)}</p>}
  </section>
}
function TeachingCheck({ practice, t }: { practice: TeachingGuide['practice']; t: (s:string)=>string }) {
  const id=useId()
  const [choice,setChoice]=useState<number | null>(null)
  const [checked,setChecked]=useState(false)
  return <fieldset className="space-y-3 rounded-lg border p-3 sm:p-4">
    <legend className="px-1 font-semibold">{t('Try a small step')}</legend>
    <p className="text-sm text-muted-foreground">{t('This is practice inside the lesson. It does not submit your warm-up, award XP, or change mastery.')}</p>
    <p className="font-medium">{t(practice.prompt)}</p>
    {practice.choices.map((answer,i)=><label key={i} className="flex min-h-11 cursor-pointer items-center gap-3 rounded border bg-background p-3"><input type="radio" name={id} checked={choice===i} onChange={()=>{setChoice(i);setChecked(false)}} /><span className="text-sm">{t(answer)}</span></label>)}
    <button type="button" className="min-h-11 rounded bg-primary px-4 text-sm text-primary-foreground disabled:opacity-50" disabled={choice===null} onClick={()=>setChecked(true)}>{t('Check this practice step')}</button>
    {checked && choice!==null && <div role="status" className="space-y-2 rounded bg-muted p-3 text-sm"><p><b>{t(choice===practice.correctIndex ? 'That reasoning fits.' : 'Let’s look at that step.')}</b> {t(practice.feedback[choice])}</p>{choice!==practice.correctIndex && <p>{t('You can change your choice and check again, or reopen the worked example.')}</p>}</div>}
    <label htmlFor={id+'-explain'} className="block text-sm font-medium">{t('Explain the choice in your own words (optional)')}</label>
    <textarea id={id+'-explain'} rows={2} className="w-full rounded border bg-background p-3 text-sm" placeholder={t('I chose this because…')} />
    <p className="text-xs text-muted-foreground">{t('This optional practice reflection is not saved or sent to your teacher.')}</p>
  </fieldset>
}
export default function MathTutor({code,customTiers,lang='',initiallyOpen=false,onReturnToWork}:Props) {
  const t=useTranslator(lang)
  const id=useId()
  const [open,setOpen]=useState(initiallyOpen)
  const [example,setExample]=useState(0)
  const [hints,setHints]=useState(0)
  const guide=MATH_TEACHING_GUIDES[code]
  const summaries=resolveMiniLessons(code,customTiers)
  const hasCustom=Array.isArray(customTiers) && customTiers.length>0
  if(!guide && !summaries?.length) return <aside className="rounded-lg border p-4 text-sm">{t('A how-to lesson is not available for this skill yet. Tell your teacher which step is unclear.')}</aside>
  return <section className="overflow-hidden rounded-xl border bg-card" aria-label={t('How to do it')}>
    <button type="button" className="flex min-h-11 w-full items-center justify-between gap-3 p-4 text-left" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(v=>!v)}><span><span className="block font-semibold">{t('How to do it')}</span><span className="mt-1 block text-xs text-muted-foreground">{t('Understand the idea · follow an example · try a step')}</span></span><span aria-hidden="true">{open ? '−' : '+'}</span></button>
    {open && <div id={id} className="space-y-5 border-t p-4">
      <p className="text-xs text-muted-foreground">{t('All support is available to everyone. Choose what helps; opening help does not lower your mastery rating.')}</p>
      {hasCustom && <section className="space-y-2"><h3 className="font-semibold">{t('Your teacher’s lesson notes')}</h3>{summaries?.map((s,i)=><details key={i}><summary className="min-h-11 cursor-pointer py-3 text-sm font-medium">{t(s.title)}</summary><ol className="list-decimal space-y-2 pl-5 text-sm">{s.steps.map((step,j)=><li key={j}>{t(step)}</li>)}</ol>{s.tip && <p className="mt-2 text-sm">{t(s.tip)}</p>}</details>)}</section>}
      {guide ? <>
        <nav className="flex flex-wrap gap-2 text-sm" aria-label={t('Choose the help you need')}><a className="inline-flex min-h-11 items-center rounded border px-3" href={'#'+id+'-example'}>{t('Show me an example')}</a><a className="inline-flex min-h-11 items-center rounded border px-3" href={'#'+id+'-hints'}>{t('I am stuck — help me start')}</a><a className="inline-flex min-h-11 items-center rounded border px-3" href={'#'+id+'-practice'}>{t('Let me try a step')}</a></nav>
        <section><h3 className="font-semibold">{t(guide.goal)}</h3><p className="mt-2 text-sm leading-relaxed">{t(guide.idea)}</p><details className="mt-2"><summary className="min-h-11 cursor-pointer py-3 text-sm font-medium">{t('Explain the words and symbols')}</summary><dl className="space-y-2 text-sm">{guide.words.map(w=><div key={w.term}><dt className="font-semibold">{t(w.term)}</dt><dd className="text-muted-foreground">{t(w.meaning)}</dd></div>)}</dl></details></section>
        <section id={id+'-example'} className="space-y-3 scroll-mt-20"><h3 className="font-semibold">{t('Follow a worked example')}</h3><div className="flex flex-wrap gap-2" aria-label={t('Choose an example')}>{guide.examples.map((e,i)=><button type="button" key={e.title} aria-pressed={example===i} onClick={()=>setExample(i)} className={`min-h-11 rounded border px-3 py-2 text-left text-sm ${example===i ? 'border-primary bg-muted font-semibold' : ''}`}>{t(e.title)}</button>)}</div><WorkedExample key={code+example} example={guide.examples[example] ?? guide.examples[0]} t={t} /></section>
        <details><summary className="min-h-11 cursor-pointer py-3 text-sm font-medium">{t('See another representation of this skill')}</summary><MathSpineDiagram code={code} lang={lang} /><p className="mt-2 text-xs text-muted-foreground">{t('This diagram is a separate illustration; its numbers may differ from the worked example.')}</p></details>
        <section className="space-y-2 rounded-lg bg-muted p-3"><h3 className="font-semibold">{t('A mistake to watch for')}</h3><p className="text-sm"><b>{t('Tempting but incorrect:')}</b> {t(guide.misconception.wrong)}</p><p className="text-sm"><b>{t('Repair the reasoning:')}</b> {t(guide.misconception.repair)}</p></section>
        <div id={id+'-practice'} className="scroll-mt-20"><TeachingCheck key={code} practice={guide.practice} t={t} /></div>
        <section id={id+'-hints'} className="space-y-3 scroll-mt-20"><h3 className="font-semibold">{t('I still need help getting started')}</h3>{hints===0 && <p className="text-sm text-muted-foreground">{t('Open one hint at a time, then try that step on your question.')}</p>}<ol className="list-decimal space-y-2 pl-5 text-sm">{guide.hints.slice(0,hints).map((hint,i)=><li key={i}>{t(hint)}</li>)}</ol>{hints<guide.hints.length && <button type="button" className="min-h-11 rounded border px-3 text-sm" onClick={()=>setHints(n=>n+1)}>{t(hints===0 ? 'Help me start' : 'Give me the next hint')}</button>}{hints===guide.hints.length && <p className="rounded bg-muted p-3 text-sm">{t('If this is still unclear, tell your teacher: “I understand ___, but I am stuck when ___.” You can show a sketch or point to a step instead of writing a long explanation.')}</p>}</section>
        <section className="space-y-2 border-t pt-4"><h3 className="font-semibold">{t('Now use it on your problem')}</h3><p className="text-sm">{t(guide.transfer)}</p>{onReturnToWork && <button type="button" className="min-h-11 rounded bg-primary px-4 text-sm text-primary-foreground" onClick={onReturnToWork}>{t('Return to my work')}</button>}</section>
      </> : summaries?.map((s,i)=><section key={i}><h3 className="font-semibold">{t(s.title)}</h3><ol className="list-decimal pl-5 text-sm">{s.steps.map((step,j)=><li key={j}>{t(step)}</li>)}</ol></section>)}
    </div>}
  </section>
}
