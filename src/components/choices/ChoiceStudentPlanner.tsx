'use client'
import { useMemo, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, GripVertical, Undo2 } from 'lucide-react'
import { dateLabel } from '@/lib/learning-week'
import { choiceStepDate, type ChoiceOption, type ChoiceSection, type ChoiceStep } from '@/lib/choice-calendar'
import type { ChoiceSnapshot } from '@/lib/choice-calendar-server'
import { useCalendarDragPreview, type CalendarPointer } from '@/lib/use-calendar-drag-preview'
import s from './ChoiceCalendar.module.css'

type Item = { key: string; section: ChoiceSection; number: number; option: ChoiceOption; step?: ChoiceStep; title: string; day: string | null }
export interface ChoiceCalendarContent {
  dragging: boolean
  over: string | null
  renderDay: (day: string) => ReactNode
  hasDay: (day: string) => boolean
}
export default function ChoiceStudentPlanner({ section, data, userId, dates, disabled, open, schedule, remove, renderCalendar }: {
  section: ChoiceSection; data: ChoiceSnapshot; userId: string; dates: string[]; disabled: boolean
  open: (id: string, sectionId?: string) => void; schedule: (option: string, day: string, step?: string, sectionId?: string) => void; remove: (id: string, sectionId?: string) => void
  renderCalendar?: (choices?: ChoiceCalendarContent) => ReactNode
}) {
  const shelf = useRef<HTMLDivElement>(null), planner = useRef<HTMLDivElement>(null)
  const drag = useRef<{ item: Item; x: number; y: number; moved: boolean } | null>(null)
  const [ghost, setGhost] = useState<{ title: string } | null>(null), [over, setOver] = useState<string | null>(null)
  const hover = useRef<string | null>(null)
  const { selections: savedSelections, bookings: savedBookings, slots: savedSlots, progress: savedProgress } = data
  const lookup = useMemo(() => {
    const key = (sectionId: string, optionId: string) => JSON.stringify([sectionId, optionId])
    const selections = new Map<string, typeof savedSelections[number]>()
    const bookings = new Map<string, typeof savedBookings[number]>()
    const slots = new Map<string, typeof savedSlots[number]>()
    for (const item of savedSelections) if (item.user_id === userId && !selections.has(key(item.section_id, item.option_id))) selections.set(key(item.section_id, item.option_id), item)
    for (const item of savedBookings) if (item.user_id === userId && !bookings.has(key(item.section_id, item.option_id))) bookings.set(key(item.section_id, item.option_id), item)
    for (const item of savedSlots) if (!slots.has(item.id)) slots.set(item.id, item)
    const progress = new Map(Object.entries(savedProgress[userId] ?? {}).map(([id, value]) => [id, new Map(value.options.slice().reverse().map(item => [item.option.id, item]))]))
    return { key, selections, bookings, slots, progress }
  }, [savedSelections, savedBookings, savedSlots, savedProgress, userId])
  // The carousel follows the selected menu; the calendar keeps every menu's planned work.
  const items: Item[] = useMemo(() => data.sections.flatMap(menu => menu.options.flatMap(option => {
    const selection = lookup.selections.get(lookup.key(menu.id, option.id))
    const steps = option.steps.filter(s => !s.followUp)
    return [
      ...steps.map(step => ({ key: menu.id + ':' + option.id + ':' + step.id, section: menu, option, step, title: steps.length === 1 && !option.lab ? option.title : step.title, day: choiceStepDate(option, selection, step.id) })),
      ...(option.lab ? [{ key: menu.id + ':' + option.id + ':lab', section: menu, option, title: option.title + (option.labType === 'problem-solving' ? ' · Problem-solving lab' : ' · Lab time'), day: selection?.selected ? selection.planned_on : null }] : []),
    ]
  }).map((item, index) => ({ ...item, number: index + 1 }))), [data.sections, lookup])
  const byDay = useMemo(() => {
    const days = new Map<string, Item[]>()
    for (const item of items) if (item.day) { const group = days.get(item.day) ?? []; group.push(item); days.set(item.day, group) }
    return days
  }, [items])
  const available = items.filter(item => item.section.id === section.id && !item.day)
  const stop = () => { preview.cancel(); hover.current = null; drag.current = null; setGhost(null); setOver(null) }
  const targetAt = (e: CalendarPointer) => {
    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-choice-drop]')
    return target && planner.current?.contains(target) ? target.dataset.choiceDrop ?? null : null
  }
  const preview = useCalendarDragPreview(point => {
    if (!drag.current?.moved || disabled) return
    const target = targetAt(point)
    if (target !== hover.current) { hover.current = target; setOver(target) }
    // Keep the same edge-scroll distance, bounded to one update per frame.
    if (point.clientY > innerHeight - 80) window.scrollBy(0, 16)
    else if (point.clientY < 80) window.scrollBy(0, -16)
  }, undefined, 12)
  const start = (e: PointerEvent<HTMLElement>, item: Item) => {
    if (disabled || e.button !== 0 || (e.target as HTMLElement).closest('button,a,input') && !(e.target as HTMLElement).closest('[data-choice-grip]') || e.pointerType === 'touch' && !(e.target as HTMLElement).closest('[data-choice-grip]')) return
    drag.current = { item, x: e.clientX, y: e.clientY, moved: false }; e.currentTarget.setPointerCapture(e.pointerId)
  }
  const move = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current; if (!d || disabled) return
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 7) return
    e.preventDefault(); preview.move(e)
    if (!d.moved) { d.moved = true; setGhost({ title: d.item.title }) }
  }
  const end = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current, target = targetAt(e); stop()
    if (!d?.moved || disabled) return
    if (target === 'bank') { if (d.item.day) remove(d.item.option.id, d.item.section.id) }
    else if (target) { if (!d.item.step && d.item.option.lab) open(d.item.option.id, d.item.section.id); else schedule(d.item.option.id, target, d.item.step?.id, d.item.section.id) }
  }
  const card = (item: Item, compact = false) => {
    const state = lookup.progress.get(item.section.id)?.get(item.option.id)
    const selection = lookup.selections.get(lookup.key(item.section.id, item.option.id))
    const booking = lookup.bookings.get(lookup.key(item.section.id, item.option.id))
    const slot = !item.step && lookup.slots.get(booking?.slot_id ?? '')
    const grip = <span data-choice-grip className={s.grip} aria-label="Drag handle"><GripVertical size={compact ? 18 : 24} aria-hidden="true" /></span>
    const status = state?.grade === 'missing' ? 'Missing · Required choice' : state?.completed ? 'Complete' : item.day ? 'Planned' : 'Not planned'
    return <article key={item.key} className={`${s.card} ${compact ? s.calendarCard : ''}`} data-complete={state?.completed} data-plannable={!disabled} draggable={false} onPointerDown={e => start(e, item)} onPointerMove={move} onPointerUp={end} onPointerCancel={stop} onLostPointerCapture={stop}>
      {compact ? <><div className={s.calendarCardHeading}><span>Student choice</span>{grip}</div><strong>{item.title}</strong><span className={s.badge}>{status}</span></> : <div className={s.sequenceTitle}>{grip}<div><strong>{item.number}. {item.title}</strong><p className={s.badge}>{status}</p></div></div>}
      {slot && <span className={s.badge}>{new Date(slot.starts_at).toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' })} · Group {slot.group_number}</span>}
      {item.option.steps.filter(s => !s.followUp).length > 1 && <span className={s.badge}>{item.option.title} · Choose your own order</span>}
      {selection?.swap_requested && <span className={s.badge}>Swap requested</span>}
      {!!state?.pendingQuizzes && <span className={s.badge}>{state.pendingQuizzes} attached quiz{state.pendingQuizzes === 1 ? '' : 'zes'} tracked separately</span>}
      <button type="button" className={s.button} onClick={() => open(item.option.id, item.section.id)}>{!item.step && item.option.lab ? 'Choose lab time' : item.day ? 'Open choice' : 'Choose & plan'}</button>
    </article>
  }
  return <div ref={planner} className={s.board} onKeyDown={e => { if (e.key === 'Escape') stop() }}>
    <section className={s.carouselSection} aria-label="Available choice activities">
      <div className={s.heading}><h3>Available choices</h3><div className={s.actions}><button className={s.button} type="button" aria-label="Previous choices" onClick={() => shelf.current?.scrollBy({ left: -Math.max(240, shelf.current.clientWidth * .8), behavior: 'auto' })}><ArrowLeft size={18}/></button><button className={s.button} type="button" aria-label="Next choices" onClick={() => shelf.current?.scrollBy({ left: Math.max(240, shelf.current.clientWidth * .8), behavior: 'auto' })}><ArrowRight size={18}/></button></div></div>
      <p className={s.muted}>Your teacher chooses the activities. You choose their dates and order. Drag a card onto a day, or choose a date in its details. Use the grip to drag on a touch screen.</p>
      <div ref={shelf} className={s.carousel} role="group" aria-roledescription="carousel" aria-label="Choice activity carousel" tabIndex={0}>{available.map(item => card(item))}{!available.length && <p className={s.empty}>All activities have a date. You can move them on the calendar.</p>}</div>
      <div data-choice-drop="bank" className={`${s.returnZone} ${over === 'bank' ? s.drop : ''}`}><Undo2 size={18} aria-hidden="true"/><span>Drop here to remove a choice. If it includes several activities, the whole choice is removed. Started work needs teacher approval.</span></div>
    </section>
    {renderCalendar ? renderCalendar({ dragging: !!ghost, over, hasDay: day => byDay.has(day), renderDay: day => (byDay.get(day) ?? []).map(item => card(item, true)) }) : <div className={s.week}>{dates.map(day => <section key={day} data-choice-drop={day} className={`${s.day} ${over === day ? s.drop : ''}`} aria-label={dateLabel(day, true)}><h3>{dateLabel(day, true)}</h3>{(byDay.get(day) ?? []).map(item => card(item))}{over === day && <p className={s.badge}>Drop to plan this activity</p>}</section>)}</div>}
    {ghost && <div ref={preview.ref} className={s.dragPreview} aria-hidden="true">{ghost.title}</div>}
  </div>
}
