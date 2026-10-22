'use client'
import { useState, type ReactNode } from 'react'
import s from './ReflectionWorkspace.module.css'
/** Presentation only. All responses, draft saving and submission come from the lesson reader. */
export default function ReflectionWorkspace({ title, brief, work, footer, toolbar }: { title: string; brief: ReactNode; work: ReactNode; footer: ReactNode; toolbar: ReactNode }) {
  const [view, setView] = useState<'brief' | 'work' | 'side'>('side')
  return <main className={s.workspace}>
    <header className={s.header}><div><p className={s.eyebrow}>Learning about learning</p><h1>{title}</h1></div>{toolbar}</header>
    <div className={s.tabs} aria-label="Reflection workspace views">{(['brief', 'work', 'side'] as const).map(v => <button type="button" key={v} aria-pressed={view === v} onClick={() => setView(v)}>{v === 'brief' ? 'Assignment' : v === 'work' ? 'Work' : 'Side by side'}</button>)}</div>
    <div className={s.columns} data-view={view}><aside hidden={view === 'work'} className={s.brief} aria-label="Assignment and reflection criteria">{brief}</aside><section hidden={view === 'brief'} className={s.work} aria-label="Your creative work and reflection">{work}</section></div>
    {footer}
  </main>
}
