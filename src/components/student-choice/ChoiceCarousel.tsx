'use client'
import { useEffect, useRef, useState } from 'react'
import { choicePracticePrintPath, type BinderDay } from '@/lib/student-choice'
import s from '@/components/quizzes/Quiz.module.css'
import c from './StudentChoice.module.css'

/** A manual carousel: the original page is previewed without changing its print layout. */
export default function ChoiceCarousel({ packet, selected = [], onToggle, disabled = false, required = 3 }: { packet: BinderDay; selected?: number[]; onToggle?: (option: number) => void; disabled?: boolean; required?: number }) {
  const [index, setIndex] = useState(0), [width, setWidth] = useState(340)
  const frame = useRef<HTMLDivElement>(null), swipe = useRef<number | null>(null)
  useEffect(() => {
    const node = frame.current
    if (!node) return
    const observer = new ResizeObserver(entries => setWidth(entries[0].contentRect.width))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  const page = packet.options[index], chosen = selected.includes(index + 1)
  const supportLabels: Record<string, string> = { B: 'Doodle Notes', H: 'Frayer Model', K: 'Picture Dictionary' }
  const supports = packet.options.flatMap((opt,i) => supportLabels[opt.style ?? ''] ? [{ label: supportLabels[opt.style!], i }] : [])
  const move = (offset: number) => setIndex(i => (i + offset + packet.options.length) % packet.options.length)
  return <section className={c.carousel} aria-label="Practice options" aria-roledescription="carousel">
    {supports.length > 0 && <div className={c.supportLinks} aria-label="Visual and vocabulary supports"><strong>Visual and vocabulary supports</strong>{supports.map(({ label, i }) => <button key={i} type="button" aria-pressed={index === i} onClick={() => setIndex(i)}>{label} · {i + 1}</button>)}</div>}
    <div className={c.carouselNav} onKeyDown={e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); move(e.key === 'ArrowRight' ? 1 : -1) } }}>
      <button type="button" className={s.secondary} aria-label="Previous practice option" onClick={() => move(-1)}>← Previous</button>
      <span aria-live="polite">Option {index + 1} of {packet.options.length}</span>
      <button type="button" className={s.secondary} aria-label="Next practice option" onClick={() => move(1)}>Next →</button>
    </div>
    <article className={c.slide} aria-roledescription="slide" aria-label={`Option ${index + 1}: ${page.title}`}>
      <div className={c.paperPreview} ref={frame} onTouchStart={e => { swipe.current = e.touches[0].clientX }} onTouchEnd={e => { if (swipe.current !== null) { const distance = e.changedTouches[0].clientX - swipe.current; if (Math.abs(distance) > 50) move(distance < 0 ? 1 : -1) } swipe.current = null }}>
        <iframe key={page.path} title={`Visual preview of option ${index + 1}`} src={page.previewPath ?? page.path} tabIndex={-1} aria-hidden="true" loading="lazy" style={{ transform: `scale(${width / 816})` }} />
      </div>
      <div className={s.stack}><p className={s.eyebrow}>OPTION {index + 1}{page.sei ? ' · LANGUAGE SUPPORT' : ''}{chosen ? ' · SELECTED' : ''}</p><h3>{page.title}</h3>
        <a className={s.link} href={choicePracticePrintPath(packet, [index + 1])} download>Download option {index + 1} (PDF)</a>
        {onToggle && <button type="button" className={chosen ? s.secondary : s.button} aria-pressed={chosen} disabled={disabled || (!chosen && selected.length >= required)} onClick={() => onToggle(index + 1)}>{chosen ? `Remove option ${index + 1}` : `Choose option ${index + 1}`}</button>}
        {onToggle && selected.length >= required && !chosen && <p className={s.muted}>{selected.length} selected. Remove a page to choose this option.</p>}
        {!onToggle && <p className={s.muted}>Students choose {required} of these {packet.options.length} pages.</p>}
      </div>
    </article>
    <div className={c.optionNav} aria-label="Go to a practice option">{packet.options.map((p, i) => <button type="button" key={p.path} aria-label={`Show option ${i + 1}${selected.includes(i + 1) ? ', selected' : ''}`} aria-current={i === index ? 'true' : undefined} onClick={() => setIndex(i)}>{i + 1}{selected.includes(i + 1) ? ' ✓' : ''}</button>)}</div>
  </section>
}
