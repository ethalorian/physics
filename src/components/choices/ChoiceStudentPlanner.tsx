'use client'
import { useRef, useState, type PointerEvent } from 'react'
import { ArrowLeft, ArrowRight, GripVertical, Undo2 } from 'lucide-react'
import { dateLabel } from '@/lib/learning-week'
import { choiceStepDate, type ChoiceOption, type ChoiceSection, type ChoiceStep } from '@/lib/choice-calendar'
import type { ChoiceSnapshot } from '@/lib/choice-calendar-server'
import s from './ChoiceCalendar.module.css'

type Item = { key: string; option: ChoiceOption; step?: ChoiceStep; title: string; day: string | null }
export default function ChoiceStudentPlanner({ section, data, userId, dates, disabled, open, schedule, remove }: {
  section: ChoiceSection; data: ChoiceSnapshot; userId: string; dates: string[]; disabled: boolean
  open: (id: string) => void; schedule: (option: string, day: string, step?: string) => void; remove: (id: string) => void
}) {
  const shelf = useRef<HTMLDivElement>(null), planner = useRef<HTMLDivElement>(null)
  const drag = useRef<{ item: Item; x: number; y: number; moved: boolean } | null>(null)
  const [ghost, setGhost] = useState<{ title: string; x: number; y: number } | null>(null), [over, setOver] = useState<string | null>(null)
  const items: Item[] = section.options.flatMap(option => {
    const selection = data.selections.find(v => v.section_id === section.id && v.option_id === option.id && v.user_id === userId)
    const steps = option.steps.filter(s => !s.followUp)
    return [
      ...steps.map(step => ({ key: option.id + ':' + step.id, option, step, title: steps.length === 1 && !option.lab ? option.title : step.title, day: choiceStepDate(option, selection, step.id) })),
      ...(option.lab ? [{ key: option.id + ':lab', option, title: option.title + ' · Lab time', day: selection?.selected ? selection.planned_on : null }] : []),
    ]
  })
  const available = items.filter(item => !item.day)
  const stop = () => { drag.current = null; setGhost(null); setOver(null) }
  const targetAt = (e: PointerEvent<HTMLElement>) => {
    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-choice-drop]')
    return target && planner.current?.contains(target) ? target.dataset.choiceDrop ?? null : null
  }
  const start = (e: PointerEvent<HTMLElement>, item: Item) => {
    if (disabled || e.button !== 0 || (e.target as HTMLElement).closest('button,a,input') && !(e.target as HTMLElement).closest('[data-choice-grip]') || e.pointerType === 'touch' && !(e.target as HTMLElement).closest('[data-choice-grip]')) return
    drag.current = { item, x: e.clientX, y: e.clientY, moved: false }; e.currentTarget.setPointerCapture(e.pointerId)
  }
  const move = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current; if (!d || disabled) return
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 7) return
    e.preventDefault(); d.moved = true; setGhost({ title: d.item.title, x: e.clientX, y: e.clientY }); setOver(targetAt(e))
    // Keep the calendar reachable while dragging on a phone or short screen.
    if (e.clientY > innerHeight - 80) window.scrollBy(0, 16)
    else if (e.clientY < 80) window.scrollBy(0, -16)
  }
  const end = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current, target = targetAt(e); stop()
    if (!d?.moved || disabled) return
    if (target === 'bank') { if (d.item.day) remove(d.item.option.id) }
    else if (target) { if (!d.item.step && d.item.option.lab) open(d.item.option.id); else schedule(d.item.option.id, target, d.item.step?.id) }
  }
  const show = (id: string) => open(id)
  const card = (item: Item) => {
    const state = data.progress[userId]?.[section.id]?.options.find(o => o.option.id === item.option.id)
    const selection = data.selections.find(v => v.section_id === section.id && v.option_id === item.option.id && v.user_id === userId)
    return <article key={item.key} className={s.card} data-complete={state?.completed} data-plannable={!disabled} draggable={false} onPointerDown={e => start(e, item)} onPointerMove={move} onPointerUp={end} onPointerCancel={stop} onLostPointerCapture={stop}>
      <div className={s.heading}><span className={s.badge}>{item.option.category}{state?.completed ? ' · Complete' : ''}</span><span data-choice-grip className={s.grip} aria-label="Drag handle"><GripVertical size={18} aria-hidden="true" /></span></div>
      <strong>{item.title}</strong>
      {item.option.steps.filter(s => !s.followUp).length > 1 && <span className={s.badge}>{item.option.title} · Choose your own order</span>}
      {selection?.swap_requested && <span className={s.badge}>Swap requested</span>}
      {!!state?.pendingQuizzes && <span className={s.badge}>{state.pendingQuizzes} attached quiz{state.pendingQuizzes === 1 ? '' : 'zes'} tracked separately</span>}
      <button type="button" className={s.button} onClick={() => show(item.option.id)}>{!item.step && item.option.lab ? 'Choose lab time' : item.day ? 'Open choice' : 'Choose & plan'}</button>
    </article>
  }
  return <div ref={planner} className={s.board} onKeyDown={e => { if (e.key === 'Escape') stop() }}>
    <section className={s.carouselSection} aria-label="Available choice activities">
      <div className={s.heading}><h3>Available choices</h3><div className={s.actions}><button className={s.button} type="button" aria-label="Previous choices" onClick={() => shelf.current?.scrollBy({ left: -Math.max(240, shelf.current.clientWidth * .8), behavior: 'auto' })}><ArrowLeft size={18}/></button><button className={s.button} type="button" aria-label="Next choices" onClick={() => shelf.current?.scrollBy({ left: Math.max(240, shelf.current.clientWidth * .8), behavior: 'auto' })}><ArrowRight size={18}/></button></div></div>
      <p className={s.muted}>Your teacher chooses the activities. You choose their dates and order. Drag a card onto a day, or choose a date in its details. Use the grip to drag on a touch screen.</p>
      <div ref={shelf} className={s.carousel} role="group" aria-roledescription="carousel" aria-label="Choice activity carousel" tabIndex={0}>{available.map(card)}{!available.length && <p className={s.empty}>All activities have a date. You can move them on the calendar.</p>}</div>
      <div data-choice-drop="bank" className={`${s.returnZone} ${over === 'bank' ? s.drop : ''}`}><Undo2 size={18} aria-hidden="true"/><span>Drop here to remove a choice. If it includes several activities, the whole choice is removed. Started work needs teacher approval.</span></div>
    </section>
    <div className={s.week}>{dates.map(day => <section key={day} data-choice-drop={day} className={`${s.day} ${over === day ? s.drop : ''}`} aria-label={dateLabel(day, true)}><h3>{dateLabel(day, true)}</h3>{items.filter(item => item.day === day).map(card)}{over === day && <p className={s.badge}>Drop to plan this activity</p>}</section>)}</div>
    {ghost && <div className={s.dragPreview} style={{ left: ghost.x + 12, top: ghost.y + 12 }} aria-hidden="true">{ghost.title}</div>}
  </div>
}
