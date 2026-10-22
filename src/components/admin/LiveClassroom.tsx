'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, BookOpen, Eye, MonitorPlay, NotebookPen, Users } from 'lucide-react'
import { classDayTool, classDayToolHref } from '@/lib/class-day-tools'
import { planTeachHref, type PlanPresentationChoice } from '@/lib/course-plan-presentation'
import { teachingHref } from '@/lib/teaching-navigation'
import s from './LiveClassroom.module.css'

export default function LiveClassroom({ classId, unitId }: { classId: string | null; unitId: string }) {
  if (!classId) return <section className={s.empty}><NotebookPen size={32} /><h2>Get ready for class</h2><p>Choose a class above to open guided practice, observations, and group activities.</p></section>
  if (['auto', 'all', 'unmapped'].includes(unitId)) return <section className={s.empty}><h2>Choose a course unit</h2><p>Select a unit above to prepare for teaching.</p></section>
  return <Classroom key={classId + unitId} classId={classId} unitId={unitId} />
}

function Classroom({ classId, unitId }: { classId: string; unitId: string }) {
  const params = useSearchParams(), router = useRouter()
  const [plans, setPlans] = useState<PlanPresentationChoice[]>([])
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [retry, setRetry] = useState(0)
  useEffect(() => {
    const abort = new AbortController()
    setLoading(true); setError('')
    fetch('/api/present/plans?course_id=' + encodeURIComponent(classId), { signal: abort.signal })
      .then(async response => { const data = await response.json(); if (!response.ok) throw Error(data.error || 'Guided activities could not load.'); return data })
      .then(data => { if (!abort.signal.aborted) setPlans(data.plans ?? []) })
      .catch(e => { if (!abort.signal.aborted) setError(e.message) })
      .finally(() => { if (!abort.signal.aborted) setLoading(false) })
    return () => abort.abort()
  }, [classId, retry])
  const days = plans.filter(plan => plan.unit_id === unitId)
  const requestedDay = Number(params.get('day'))
  const selected = days.find(plan => plan.day === requestedDay) ?? days.find(plan => plan.deck) ?? days[0]
  const teachingTool = selected ? classDayTool(selected.unit_id, selected.day) : null
  const context = new URLSearchParams({ class: classId, unit: unitId })
  return <div className={s.root}>
    <div className={s.intro}><div><p className={s.eyebrow}>IN THE CLASSROOM</p><h2>Work through the problems together.</h2><p>Guide worksheet and practice problems, make student thinking visible, and build explanations together.</p></div><Link href={teachingHref('guide', classId, unitId, selected?.day)}><BookOpen size={17} /> Course guide <ArrowRight size={16} /></Link></div>
    <section className={s.presenter} aria-labelledby="guided-practice-title">
      <div className={s.presenterCopy}><NotebookPen size={28} /><p className={s.eyebrow}>WORKSHEETS & PRACTICE</p><h3 id="guided-practice-title">Guided problem solving</h3><p>Work through worksheet and practice problems together. Pause for students to try a step, compare strategies, and explain their reasoning.</p></div>
      <div className={s.launch}>
        <label>Course day<select aria-label="Live classroom course day" disabled={loading || !days.length} value={selected?.day ?? ''} onChange={event => router.replace(teachingHref('live', classId, unitId, Number(event.target.value)), { scroll: false })}>{!days.length && <option value="">{loading ? 'Loading course days…' : 'No course days available'}</option>}{days.map(plan => <option key={plan.id} value={plan.day}>{plan.title.match(/^(Day|Meeting|Week|Session) /i) ? plan.title : `Day ${plan.day} · ${plan.title}`}{plan.deck ? '' : ' · guide only'}</option>)}</select></label>
        {error && <p role="alert">{error} <button onClick={() => setRetry(value => value + 1)}>Retry</button></p>}
        {!loading && <>
          <div className={s.actions}>
            {selected?.deck && <Link className={s.primary} href={planTeachHref(unitId, selected.day, classId)}>Open guided activity <ArrowRight size={18} /></Link>}
            {teachingTool && <Link className={s.secondary} href={classDayToolHref(teachingTool.day, classId, teachingTool.unit)} aria-describedby="live-teaching-tool-name"><MonitorPlay size={18} aria-hidden="true" />Open teaching tool <ArrowRight size={18} aria-hidden="true" /></Link>}
          </div>
          {selected && <p id="live-teaching-tool-name" className={s.toolName}>{teachingTool ? `Teaching tool: ${teachingTool.title}` : 'No teaching tool is available for this course day.'}</p>}
          {!selected?.deck && <p>{selected ? 'This day has no guided activity yet. Its teaching notes are in the course guide.' : 'Use the course guide, observations, and group activities for this unit.'}</p>}
        </>}
        <Link href={teachingHref('guide', classId, unitId, selected?.day)}>Read the teaching notes</Link>
      </div>
    </section>
    <div className={s.tools}>
      <section><Eye size={26} /><p className={s.eyebrow}>NOTICE & RESPOND</p><h3>Observe students</h3><p>Walk the room, record 1–2–3 mastery ratings, and leave feedback connected to learning targets.</p><Link href={'/admin/observe?' + context}>Open observations <ArrowRight size={17} /></Link></section>
      <section><Users size={26} /><p className={s.eyebrow}>THINK TOGETHER</p><h3>Group activities</h3><p>Set up groups, share a join code, and follow student responses, drawings, jigsaws, and escape rooms.</p><Link href={'/admin/lobby?' + context}>Open group activities <ArrowRight size={17} /></Link></section>
    </div>
    <div className={s.afterClass}><div><strong>After the lesson</strong><p>Bring classroom observations and student work together.</p></div><Link href={teachingHref('results', classId, unitId)}>Review results <ArrowRight size={17} /></Link></div>
  </div>
}
