'use client'
import { useRef, useState, type KeyboardEvent } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { DueDateDraft } from '@/lib/assignment-due-input'
import s from './assignment-due-input.module.css'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const pad = (n: number) => String(n).padStart(2, '0')
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const calendarDate = (value: string) => value ? new Date(`${value}T12:00:00`) : new Date()
const dateLabel = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
function timeLabel(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  return Number.isFinite(hour) && Number.isFinite(minute) ? `${hour % 12 || 12}:${pad(minute)} ${hour < 12 ? 'AM' : 'PM'}` : 'Choose time'
}

export default function AssignmentDueInput({ value, onChange, label = 'Due', disabled = false }: {
  value: DueDateDraft; onChange: (value: DueDateDraft) => void; label?: string; disabled?: boolean
}) {
  const [dateOpen, setDateOpen] = useState(false), [timeOpen, setTimeOpen] = useState(false)
  const [cursor, setCursor] = useState(() => calendarDate(value.date))
  const [pendingTime, setPendingTime] = useState(value.time || '23:59')
  const dayButtons = useRef(new Map<string, HTMLButtonElement>())
  const today = dayKey(new Date()), year = cursor.getFullYear(), month = cursor.getMonth()
  const start = new Date(year, month, 1, 12), offset = start.getDay()
  const days = Array.from({ length: 42 }, (_, i) => new Date(year, month, 1 - offset + i, 12))
  const [hour, minute] = pendingTime.split(':').map(Number)
  function openDate(open: boolean) { if (open) setCursor(calendarDate(value.date)); setDateOpen(open) }
  function openTime(open: boolean) { if (open) setPendingTime(value.time || '23:59'); setTimeOpen(open) }
  function chooseDate(date: string) { onChange({ ...value, date }); setDateOpen(false) }
  function chooseTime(time: string) { onChange({ ...value, time }); setTimeOpen(false) }
  function changeMonth(nextYear: number, nextMonth: number) {
    const first = new Date(nextYear, nextMonth, 1, 12)
    if (first.getFullYear() < 2000 || first.getFullYear() > 2100) return
    setCursor(new Date(first.getFullYear(), first.getMonth(), Math.min(cursor.getDate(), new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()), 12))
  }
  function navigateDay(event: KeyboardEvent<HTMLButtonElement>, date: Date) {
    const next = new Date(date), step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key]
    if (step !== undefined) next.setDate(next.getDate() + step)
    else if (event.key === 'Home') next.setDate(next.getDate() - next.getDay())
    else if (event.key === 'End') next.setDate(next.getDate() + 6 - next.getDay())
    else if (event.key === 'PageUp' || event.key === 'PageDown') {
      const target = new Date(date.getFullYear(), date.getMonth() + (event.key === 'PageUp' ? -1 : 1) * (event.shiftKey ? 12 : 1), 1, 12)
      next.setDate(1); next.setFullYear(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()))
    } else return
    event.preventDefault()
    if (next.getFullYear() < 2000 || next.getFullYear() > 2100) return
    setCursor(next)
    requestAnimationFrame(() => dayButtons.current.get(dayKey(next))?.focus())
  }
  return <fieldset disabled={disabled} className={s.fieldset}>
    <legend className={s.legend}>{label} date & time (optional)</legend>
    <div className={s.fields}>
      <div className={s.field}><span>Date</span><Dialog open={dateOpen && !disabled} onOpenChange={openDate}>
        <DialogTrigger asChild><button type="button" className={s.trigger} aria-label={`${label} date`} disabled={disabled}><CalendarDays size={18} aria-hidden="true"/><span>{value.date ? calendarDate(value.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Choose date'}</span></button></DialogTrigger>
        <DialogContent className={s.picker} onOpenAutoFocus={event => { event.preventDefault(); dayButtons.current.get(dayKey(cursor))?.focus() }}>
          <DialogTitle>Choose due date</DialogTitle><DialogDescription>Choose a day on the calendar.</DialogDescription>
          <div className={s.monthBar}>
            <button type="button" className={s.arrow} aria-label="Previous month" disabled={year === 2000 && month === 0} onClick={() => changeMonth(year, month - 1)}><ChevronLeft size={20}/></button>
            <div className={s.monthSelects}><select aria-label="Calendar month" value={month} onChange={e => changeMonth(year, Number(e.target.value))}>{MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}</select><select aria-label="Calendar year" value={year} onChange={e => changeMonth(Number(e.target.value), month)}>{Array.from({ length: 101 }, (_, i) => <option key={i} value={2000 + i}>{2000 + i}</option>)}</select></div>
            <button type="button" className={s.arrow} aria-label="Next month" disabled={year === 2100 && month === 11} onClick={() => changeMonth(year, month + 1)}><ChevronRight size={20}/></button>
          </div>
          <p className="sr-only" aria-live="polite">{MONTHS[month]} {year}</p>
          <table className={s.calendar} aria-label={`${MONTHS[month]} ${year}`}><thead><tr>{WEEKDAYS.map(d => <th scope="col" key={d} abbr={d}>{d.slice(0, 2)}</th>)}</tr></thead><tbody>{Array.from({ length: 6 }, (_, row) => <tr key={row}>{days.slice(row * 7, row * 7 + 7).map(d => {
            const key = dayKey(d)
            return <td key={key}><button type="button" ref={el => { if (el) dayButtons.current.set(key, el); else dayButtons.current.delete(key) }} className={s.day} data-outside={d.getMonth() !== month} aria-label={dateLabel(d)} aria-pressed={value.date === key} aria-current={today === key ? 'date' : undefined} disabled={d.getFullYear() < 2000 || d.getFullYear() > 2100} tabIndex={key === dayKey(cursor) ? 0 : -1} onKeyDown={e => navigateDay(e, d)} onClick={() => chooseDate(key)}>{d.getDate()}</button></td>
          })}</tr>)}</tbody></table>
          <div className={s.footer}><Button type="button" variant="outline" onClick={() => chooseDate(today)}>Today</Button><Button type="button" variant="ghost" onClick={() => chooseDate('')}>No due date</Button></div>
        </DialogContent>
      </Dialog></div>
      <div className={s.field}><span>Time</span><Dialog open={timeOpen && !disabled} onOpenChange={openTime}>
        <DialogTrigger asChild><button type="button" className={s.trigger} aria-label={`${label} time`} disabled={disabled}><Clock3 size={18} aria-hidden="true"/><span>{timeLabel(value.time)}</span></button></DialogTrigger>
        <DialogContent className={s.picker}>
          <DialogTitle>Choose due time</DialogTitle><DialogDescription>Click an hour, minute, and AM or PM.</DialogDescription>
          <div className={s.timePreview} aria-live="polite">{timeLabel(pendingTime)}</div>
          <div className={s.timeChoices}>
            <label>Hour<select aria-label="Hour" size={5} value={hour % 12 || 12} onChange={e => setPendingTime(`${pad(Number(e.target.value) % 12 + (hour >= 12 ? 12 : 0))}:${pad(minute)}`)}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label>
            <label>Minute<select aria-label="Minute" size={5} value={minute} onChange={e => setPendingTime(`${pad(hour)}:${pad(Number(e.target.value))}`)}>{Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{pad(i)}</option>)}</select></label>
            <div className={s.period}><span>AM / PM</span>{['AM', 'PM'].map((p, i) => <button type="button" key={p} aria-pressed={Number(hour >= 12) === i} onClick={() => setPendingTime(`${pad(hour % 12 + i * 12)}:${pad(minute)}`)}>{p}</button>)}</div>
          </div>
          <div className={s.presets}><span>Quick choices</span>{['08:00', '15:00', '23:59'].map(time => <button type="button" key={time} onClick={() => setPendingTime(time)}>{timeLabel(time)}</button>)}</div>
          <div className={s.footer}><Button type="button" variant="ghost" onClick={() => setTimeOpen(false)}>Cancel</Button><Button type="button" onClick={() => chooseTime(pendingTime)}>Use time</Button></div>
        </DialogContent>
      </Dialog></div>
    </div>
    <p className={s.hint}>{Intl.DateTimeFormat().resolvedOptions().timeZone} · Choose “No due date” to remove the deadline.</p>
  </fieldset>
}
