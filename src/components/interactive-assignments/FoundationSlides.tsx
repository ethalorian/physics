'use client'
import {useFoundationLanguage} from './FoundationLanguage'
import QuizContent from '@/components/quizzes/QuizContent'

import {useEffect, useRef, useState} from 'react'
import {foundationBinderMaterials} from '@/lib/foundation-binder-materials'
import {foundationSlides} from '@/lib/interactive-assignments/foundations/slides'
import type {FoundationKey} from '@/lib/interactive-assignments/foundations/checkpoints'
import FoundationReadingGuide from './FoundationReadingGuide'
import readingGuides from '@/data/foundations/reading-guides.json'
import type {LessonSection} from '@/lib/interactive-assignments/catalog'
import s from './Foundation.module.css'


const guidesByLesson: Partial<Record<FoundationKey, Record<string, string>>> = readingGuides

type SlideProps = {foundation?: FoundationKey; sections: LessonSection[]}

export default function FoundationSlides({foundation = 'day-one', sections}: SlideProps) {
  const {edition, locale} = useFoundationLanguage()
  const [showGuide, setShowGuide] = useState(false)
  const day = foundationSlides[foundation].day
  const materials = foundationBinderMaterials(day, edition ?? 'cpa')

  if (locale !== 'en') return <AssignmentSlideGuide foundation={foundation} sections={sections} />

  return <div id="assignment-teaching-tool">
    <div className={s.projectorActions}>
      <button type="button" aria-pressed={!showGuide} onClick={() => setShowGuide(false)}>Foundation lesson A–E</button>
      <button type="button" aria-pressed={showGuide} onClick={() => setShowGuide(true)}>Assignment slide guide</button>
      <a href={materials.projector} target="_blank" rel="noreferrer">Open projector in a new tab ↗</a>
    </div>
    <div hidden={showGuide}>
      <iframe className={s.binderProjector} title={`Day ${day} Foundation lesson, sections A through E`}
        key={materials.projector} src={materials.projector + '&embed=1'} allowFullScreen
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" />
    </div>
    {showGuide && <AssignmentSlideGuide foundation={foundation} sections={sections} embedded />}
  </div>
}

function AssignmentSlideGuide({foundation = 'day-one', sections, embedded = false}: SlideProps & {embedded?: boolean}) {
  const {t,locale,map}=useFoundationLanguage()
  const {slides,day,src,channel}=foundationSlides[foundation]
  const [index, setIndex] = useState(0)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [enlarged, setEnlarged] = useState(false)
  const frame = useRef<HTMLIFrameElement>(null)
  const panel = useRef<HTMLElement>(null)
  const guide = useRef<HTMLElement>(null)
  const enlargeButton = useRef<HTMLButtonElement>(null)
  const slide = slides[index]
  const teachingStep = 'teachingStep' in slide && typeof slide.teachingStep === 'string'
    ? slide.teachingStep : guidesByLesson[foundation]?.[slide.title]

  useEffect(() => { if (guide.current) guide.current.scrollTop = 0 }, [index])

  const chapter = sections.find(section => {
    const [first, last = first] = section.stop.match(/\d+/g)?.map(Number) ?? []
    return slide.number >= first && slide.number <= last
  })

  useEffect(() => {
    function receive(event: MessageEvent) {
      // An allow-scripts-only iframe has an opaque origin. Authenticate its
      // exact Window, and accept only navigation state, never assessment data.
      if (event.source !== frame.current?.contentWindow || event.origin !== 'null' || event.data?.channel !== channel) return
      const data = event.data
      if (data.type === 'slide' && data.total === slides.length && Number.isInteger(data.index) && data.index >= 0 && data.index < slides.length) {
        setIndex(data.index)
        setReady(true)
        setError('')
      } else if (data.type === 'error') {
        setError('The slideshow encountered a problem. Reload the slides to try again.')
      }
    }
    window.addEventListener('message', receive)
    return () => window.removeEventListener('message', receive)
  }, [channel, slides])

  useEffect(() => {
    if (ready) return
    // A one-shot loading timeout, not a refresh/polling loop.
    const timeout = window.setTimeout(() => setError('The slideshow could not finish loading. Try reloading the slides.'), 20000)
    return () => window.clearTimeout(timeout)
  }, [ready, attempt])

  useEffect(() => {
    function changed() {
      const isFull = document.fullscreenElement === panel.current
      setEnlarged(isFull)
      if (!isFull) enlargeButton.current?.focus({preventScroll: true})
    }
    document.addEventListener('fullscreenchange', changed)
    return () => document.removeEventListener('fullscreenchange', changed)
  }, [])

  function navigate(next: number) {
    // '*' is required for the sandbox's opaque target; only the slide index is sent.
    frame.current?.contentWindow?.postMessage({channel, type: 'navigate', index: next}, '*')
  }

  useEffect(() => {
    if (ready) frame.current?.contentWindow?.postMessage({channel, type: 'language', locale, map}, '*')
  }, [channel, locale, map, ready, attempt])

  async function toggleEnlarged() {
    try {
      if (document.fullscreenElement === panel.current) await document.exitFullscreen()
      else await panel.current?.requestFullscreen()
    } catch {
      setError('This browser could not enlarge the slideshow. You can still use the slides here.')
    }
  }

  function retry() {
    setReady(false)
    setError('')
    setIndex(0)
    setAttempt(value => value + 1)
  }

  return <section ref={panel} id={embedded ? undefined : "assignment-teaching-tool"} className={s.viewer} data-guided={chapter ? true : undefined} aria-label={`Day ${day} slide viewer`}>
    <div className={s.slideHeader}>
      {chapter ? <h2>{t('Day')} {day} · {t(chapter.title)}</h2> : <div><p>{t('Day')} {day} · {t('Foundational slides')}</p><h2>{t(slide.title)}</h2></div>}
      <button ref={enlargeButton} type="button" onClick={toggleEnlarged}>{t(enlarged ? 'Close enlarged slides' : 'Enlarge')}</button>
    </div>
    {/* Keep this one iframe mounted through slide changes, Work and fullscreen. */}
    <div className={teachingStep ? s.guidedBody : s.slideOnly}>
    <div className={s.slideFrame}>
      <iframe key={attempt} ref={frame} className={s.originalSlides} title={`Original Day ${day} interactive slideshow`}
        src={src} sandbox="allow-scripts"
        onLoad={() => frame.current?.contentWindow?.postMessage({channel, type: 'status'}, '*')}
        onError={() => setError('The slideshow could not load. Try reloading the slides.')}/>
    </div>
    {teachingStep && <aside ref={guide} className={s.teachingNote} tabIndex={0} aria-label={locale==='es'?'Guía de lectura':locale==='pt-BR'?'Guia de leitura':'Reading guide'}>
      <small>{locale === 'es' ? 'Guía de lectura' : locale === 'pt-BR' ? 'Guia de leitura' : 'Reading guide'}</small>
      <h3>{t(slide.title)}</h3>
      <FoundationReadingGuide foundation={foundation} number={slide.number} title={slide.title} step={teachingStep} previous={slides[index-1]?.title} next={slides[index+1]?.title}/>
      {'comicPage' in slide && typeof slide.comicPage === 'string' && <a href={slide.comicPage} target="_blank" rel="noopener noreferrer" style={{textDecoration:'underline'}}>{locale==='es'?'Abrir página completa de la novela gráfica':locale==='pt-BR'?'Abrir página inteira da história em quadrinhos':'Open full graphic novel page'}</a>}
    </aside>}
    </div>
    {!ready && !error && <p className={s.slideCount} role="status">{t("Loading interactive slides…")}</p>}
    {error && <div className={s.slideError}><p role="alert">{error}</p><button type="button" onClick={retry}>{t("Reload slides")}</button></div>}
    <div className={s.slideControls}>
      <button type="button" disabled={!ready || index === 0} onClick={() => navigate(index - 1)} aria-label={t("Previous slide")}>{t("← Previous")}</button>
      <label>{t("Slide")}<select disabled={!ready} value={index} onChange={event => navigate(Number(event.target.value))}>
        {slides.map((item, i) => <option value={i} key={item.number}>{item.number}. {t(item.title)}</option>)}
      </select></label>
      <button type="button" disabled={!ready || index === slides.length - 1} onClick={() => navigate(index + 1)} aria-label={t("Next slide")}>{t("Next →")}</button>
    </div>
    <p className={s.slideCount} aria-live="polite">{index + 1} {t('of')} {slides.length} · {t("Use Work for your responses and group discussion.")}</p>
    {locale!=='en'&&<p className={s.slideCount}>{t('Words inside pictures stay in the original art. Read the translated slide text below.')}</p>}
    <details className={s.companion}><summary>{t('Read slide text')}</summary><QuizContent content={t(slide.text)} questionEmphasis/></details>
  </section>
}
