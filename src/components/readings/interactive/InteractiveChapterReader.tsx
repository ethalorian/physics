'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { READING_ASSIGNMENT_XP } from '@/lib/xp-policy'
import type { ReadingAssignment, ReadingQuestion } from '@/lib/textbook-assignments'
import { sectionAtReadingLine } from './reader-position'
import { assignmentScope, visibleQuestionSection } from './assignment-scope'
import { emptyMemory, parseMemory, type CheckAttempt, type ReaderMemory } from './reader-memory'
import type { InteractiveChapterDefinition } from './reader-contract'
import styles from './chapter-two.module.css'

export type ReaderProps = {
  definition: InteractiveChapterDefinition
  renderOpening: (onStart: () => void) => ReactNode
  renderSection: (id: string) => ReactNode
  assignment?: ReadingAssignment
  renderQuestion?: (question: ReadingQuestion, index: number) => ReactNode
  assignmentFooter?: ReactNode
  assignmentFeedback?: ReactNode
  assignmentNotice?: ReactNode
  answered?: number
  teacher?: boolean
  preview?: boolean
  storageKey: string
  backLink?: ReactNode
}

function Practice({ id, check, attempt, onAttempt }: { id: string; check: InteractiveChapterDefinition['sections'][number]['check']; attempt?: CheckAttempt; onAttempt: (a: CheckAttempt) => void }) {
  const [choice, setChoice] = useState<number | null>(attempt?.choice ?? null), [hint, setHint] = useState(attempt?.hinted ?? false), [show, setShow] = useState(!!attempt)
  useEffect(() => { if (attempt) { setChoice(attempt.choice); setHint(attempt.hinted); setShow(true) } }, [attempt])
  function submit() {
    if (choice === null) return
    onAttempt({ choice, firstChoice: attempt?.firstChoice ?? choice, attempts: (attempt?.attempts ?? 0) + 1, hinted: hint || !!attempt?.hinted, correct: choice === check.correct }); setShow(true)
  }
  return <div className={styles.practice}>
    <div className={styles.practiceEyebrow}><span>PAUSE & CHECK</span><span>Practice · not graded</span></div><h3>{check.title}</h3><p>{check.prompt}</p>
    <fieldset><legend className={styles.srOnly}>{check.title}</legend>{check.options.map((option, i) => <label key={option} className={styles.option} data-selected={choice === i}><input type="radio" name={`practice-${id}`} checked={choice === i} onChange={() => { setChoice(i); setShow(false) }} /><span>{option}</span>{show && choice === i && attempt?.correct ? <span aria-hidden="true">✓</span> : null}</label>)}</fieldset>
    <div className={styles.practiceActions}><button className={styles.primaryButton} disabled={choice === null || (show && attempt?.choice === choice)} onClick={submit}>Check my thinking</button><button className={styles.textButton} onClick={() => setHint(true)} disabled={hint}>Give me a hint</button></div>
    {hint ? <p className={styles.hint}><strong>A useful starting point:</strong> {check.hint}</p> : null}
    {show && choice !== null && attempt ? <p className={styles.feedback} data-correct={attempt.correct} role="status"><strong>{attempt.correct ? 'That reasoning works.' : 'Revisit the idea.'}</strong> {check.feedback[choice]}{!attempt.correct ? ' Choose again when you are ready.' : ''}</p> : null}
  </div>
}

function SourceLink({ page, url }: { page: number; url: string }) {
  return <a className={styles.sourceLink} href={url} target="_blank" rel="noopener noreferrer">Original textbook · p. {page} ↗</a>
}

export default function InteractiveChapterReader(props: ReaderProps) {
  return <ReaderWorkspace key={`${props.storageKey}:${props.assignment?.id ?? 'chapter'}`} {...props} />
}

function ReaderWorkspace({ definition, renderOpening, renderSection, assignment, renderQuestion, assignmentFooter, assignmentFeedback, assignmentNotice, answered = 0, teacher = false, preview = false, storageKey, backLink }: ReaderProps) {
  const CHAPTER_SECTIONS = definition.sections
  const scope = assignmentScope(definition, assignment)
  const [showFullChapter, setShowFullChapter] = useState(!assignment)
  const visibleSections = assignment && !showFullChapter ? scope.sections : CHAPTER_SECTIONS
  const visibleSectionIds = new Set(visibleSections.map(section => section.id))
  const practiceSections = assignment ? scope.sections : CHAPTER_SECTIONS
  const [memory, setMemory] = useState<ReaderMemory>(emptyMemory), [ready, setReady] = useState(false), [active, setActive] = useState('opening'), [guide, setGuide] = useState(false), [notebook, setNotebook] = useState(false), [menu, setMenu] = useState(false), [storageError, setStorageError] = useState(false)
  const root = useRef<HTMLDivElement>(null), toolbar = useRef<HTMLElement>(null)
  const [resume, setResume] = useState('opening')
  const latest = useRef(memory)
  latest.current = memory
  const completed = practiceSections.filter(section => memory.checks[section.id]?.correct).length
  useEffect(() => { try { const next = parseMemory(localStorage.getItem(storageKey), definition); setMemory(next); setResume(next.last) } catch { setStorageError(true) } setReady(true) }, [storageKey, definition])
  useEffect(() => { if (!ready) return; const timer = setTimeout(() => { try { localStorage.setItem(storageKey, JSON.stringify(memory)) } catch { setStorageError(true) } }, 250); return () => clearTimeout(timer) }, [memory, ready, storageKey])
  useEffect(() => {
    if (!ready) return
    let frame = 0
    const update = () => {
      frame = 0
      const sections = Array.from(root.current?.querySelectorAll<HTMLElement>('[data-reading-section]') ?? []).map(element => {
        const { top, bottom } = element.getBoundingClientRect()
        return { id: element.id, top, bottom }
      })
      const id = sectionAtReadingLine(sections, Math.max(0, toolbar.current?.getBoundingClientRect().bottom ?? 0) + 24)
      setActive(id)
      setMemory(m => m.last === id ? m : { ...m, last: id })
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    const observer = new ResizeObserver(schedule)
    if (root.current) observer.observe(root.current)
    window.addEventListener('scroll', schedule, { passive: true, capture: true })
    window.addEventListener('resize', schedule)
    schedule()
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('scroll', schedule, true); window.removeEventListener('resize', schedule) }
  }, [ready, definition])
  useEffect(() => {
    if (!ready) return
    const save = () => { try { localStorage.setItem(storageKey, JSON.stringify(latest.current)) } catch { setStorageError(true) } }
    window.addEventListener('pagehide', save)
    document.addEventListener('visibilitychange', save)
    return () => { save(); window.removeEventListener('pagehide', save); document.removeEventListener('visibilitychange', save) }
  }, [ready, storageKey])
  useEffect(() => {
    if (!ready) return
    const id = location.hash.slice(1)
    if (assignment && !showFullChapter && (id === 'synthesis' || CHAPTER_SECTIONS.some(section => section.id === id && !definition.isSectionAssigned(assignment, section)))) {
      setShowFullChapter(true)
      return
    }
    if (id) document.getElementById(id)?.scrollIntoView({ block: 'start' })
  // Resolve the initial deep link after expanding an optional source section.
  // Subsequent view changes are explicitly handled by toggleChapter below.
  }, [ready, showFullChapter, assignment, CHAPTER_SECTIONS, definition])
  function toggleChapter() {
    history.replaceState(null, '', '#assignment-scope')
    setShowFullChapter(value => !value)
    go('assignment-scope')
  }
  function go(id: string) { const target = document.getElementById(id); target?.focus({ preventScroll: true }); target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); history.replaceState(null, '', `#${id}`); setMenu(false) }
  useEffect(() => { if (notebook) { const panel = document.getElementById('reader-notebook'); panel?.scrollIntoView({ block: 'start' }); panel?.focus({ preventScroll: true }) } }, [notebook])
  useEffect(() => { if (guide) { const panel = document.getElementById('reader-guide'); panel?.scrollIntoView({ block: 'start' }); panel?.focus({ preventScroll: true }) } }, [guide])
  function assignedQuestions(section: string | null) {
    if (!assignment || !renderQuestion) return null
    return assignment.questions.map((q, index) => visibleQuestionSection(definition, q, visibleSectionIds) === section ? <div key={q.id} id={`assigned-${q.id}`} tabIndex={-1} className={styles.assignedQuestion}><p className={styles.eyebrow}>YOUR ASSIGNMENT · RESPONSE {index + 1}</p>{renderQuestion(q, index)}</div> : null)
  }
  function sectionHeader(id: string, title: string, subtitle: string) {
    const s = CHAPTER_SECTIONS.find(s => s.id === id)!
    return <header className={styles.sectionHeader}><div className={styles.sectionMeta}><span className={styles.eyebrow}>SECTION {s.number}</span><span>{definition.isSectionAssigned(assignment, s) ? 'Required for this assignment' : assignment ? 'Optional · outside this assignment' : `Textbook pp. ${s.pages}`}</span></div><h2>{title}</h2><p>{subtitle}</p></header>
  }
  function afterSection(id: string) {
    return <><Practice id={id} check={definition.sections.find(s => s.id === id)!.check} attempt={memory.checks[id]} onAttempt={attempt => setMemory(m => ({ ...m, checks: { ...m.checks, [id]: attempt } }))} />{assignedQuestions(id)}<details className={styles.sectionNote}><summary>A thought worth keeping <span>+ Add a note</span></summary><label className={styles.srOnly} htmlFor={`note-${id}`}>My note for {CHAPTER_SECTIONS.find(s => s.id === id)?.number}</label><textarea id={`note-${id}`} maxLength={4000} rows={3} placeholder="An insight, a question, or an example from your own life…" value={memory.notes[id] || ''} onChange={e => setMemory(m => ({ ...m, notes: { ...m.notes, [id]: e.target.value } }))} /><p>Private note · {storageError ? 'storage unavailable' : 'saved on this device'}</p></details></>
  }
  const currentSection = CHAPTER_SECTIONS.find(s => s.id === active)
  const resumeSection = assignment && !scope.sections.some(section => section.id === resume) ? scope.first?.id : resume
  return <div ref={root} className={styles.reader} data-text-size={memory.size}>
    <a href="#chapter-content" className={styles.skip}>Skip to reading</a>
    <header ref={toolbar} className={styles.topbar}><a className={styles.brand} href="#opening" onClick={e => { e.preventDefault(); go('opening') }}><span className={styles.brandMark}>a<span>·</span></span><span>ANTOCCI<span>PHYSICS / FIELDNOTES</span></span></a><div className={styles.topActions}><span className={styles.previewLabel}>CONNECTED READING</span><button className={styles.iconButton} aria-pressed={memory.size === 'large'} aria-label="Larger reading text" onClick={() => setMemory(m => ({ ...m, size: m.size === 'normal' ? 'large' : 'normal' }))}>Aa</button><button className={styles.toolbarButton} aria-expanded={notebook} onClick={() => setNotebook(!notebook)}>My notes <span>{Object.values(memory.notes).filter(Boolean).length}</span></button>{teacher || preview ? <button className={styles.toolbarButton} aria-pressed={guide} onClick={() => setGuide(!guide)}>{guide ? 'Student reading' : 'Teaching guide'}</button> : null}<button className={`${styles.iconButton} ${styles.mobileMenu}`} aria-label="Chapter contents" aria-expanded={menu} onClick={() => setMenu(!menu)}>☰</button></div></header>
    {storageError ? <div className={styles.storageWarning} role="status">This browser cannot save private notes or practice progress. Keep this page open or copy your notes before leaving. Assignment saving is separate.</div> : null}
    {preview ? <div className={styles.previewBanner}>Working preview · sample assignment · answers and notes stay on this device.</div> : null}
    <div className={styles.layout}>
      <aside className={styles.sidebar} data-open={menu}><div className={styles.sidebarInner}>{backLink}<p className={styles.eyebrow}>{definition.bookTitle}</p><div className={styles.chapterIndex}><span>{String(definition.chapter).padStart(2, '0')}</span><div>{definition.title}</div></div><nav aria-label="Chapter contents">{assignment ? <button onClick={() => go('assignment-scope')}><span>▣</span><span>What to read<small>{scope.label}</small></span></button> : null}<button aria-current={active === 'opening' ? 'location' : undefined} onClick={() => go('opening')}><span>◎</span><span>The big idea</span></button>{visibleSections.map(s => <button key={s.id} aria-current={active === s.id ? 'location' : undefined} onClick={() => go(s.id)}><span>{s.number}</span><span>{s.title}<small>{definition.isSectionAssigned(assignment, s) ? 'ASSIGNED' : assignment ? 'OPTIONAL' : `pp. ${s.pages}`}</small></span><span className={styles.tocCheck}>{memory.checks[s.id]?.correct ? '✓' : ''}</span></button>)}{showFullChapter ? <button aria-current={active === 'synthesis' ? 'location' : undefined} onClick={() => go('synthesis')}><span>↗</span><span>Bring it together{assignment ? <small>OPTIONAL</small> : null}</span></button> : null}{assignment ? <button onClick={() => go('assignment-turn-in')}><span>✓</span><span>Review & submit</span></button> : null}</nav><div className={styles.sidebarProgress}><div><strong>{completed} / {practiceSections.length}</strong><span>{assignment ? 'assigned-section practice checks correct' : 'practice checks correct'}</span></div><progress max={practiceSections.length} value={completed} /><p>Practice helps you prepare.<br />Your explanations show your thinking.</p><p>Submit an assigned reading to earn {READING_ASSIGNMENT_XP} XP once. Practice checks and private notes help you prepare.</p></div><a className={styles.pdfLink} href={definition.pdfUrl} target="_blank" rel="noopener noreferrer">Read the original PDF ↗</a></div></aside>
      <main id="chapter-content" tabIndex={-1} className={styles.main}>
        {guide ? <section id="reader-guide" tabIndex={-1} className={styles.teacherGuide} aria-label="Teaching guide"><p className={styles.eyebrow}>TEACHING THROUGH THE READING</p><h2>Make thinking visible.</h2><p>Use the prediction to surface an idea, the explorations to test it, and the assigned explanations as evidence. A correct practice choice is useful feedback; it is not a mastery rating.</p><div className={styles.teachingSteps}><div><b>01 / Before</b><p>{definition.teaching.before}</p></div><div><b>02 / During</b><p>{definition.teaching.during}</p></div><div><b>03 / After</b><p>{definition.teaching.after}</p></div></div><h3>Checkpoints & instructional responses</h3>{CHAPTER_SECTIONS.map(s => <div key={s.id} className={styles.teachingRow}><b>{s.number} / {s.target}</b><p>{s.check.teacher}</p><small>{memory.checks[s.id] ? `This browser’s practice: ${memory.checks[s.id]!.correct ? 'currently correct' : 'revisit'} · ${memory.checks[s.id]!.attempts} attempt(s)${memory.checks[s.id]!.hinted ? ' · hint used' : ''}` : 'This browser: not attempted'}</small></div>)}<p className={styles.guideNote}>{definition.scopeNote} Class review and mastery ratings use the existing assignment workflow.</p></section> : null}
        {notebook ? <section id="reader-notebook" tabIndex={-1} className={styles.notebook} aria-label="My notebook"><div className={styles.sectionMeta}><h2>Your fieldnotes</h2><button className={styles.textButton} onClick={() => setNotebook(false)}>Close notes ×</button></div><p>Private thinking space. These notes are not submitted with your assignment.</p>{CHAPTER_SECTIONS.map(s => <label key={s.id}>{s.number} · {s.title}<textarea rows={3} maxLength={4000} value={memory.notes[s.id] || ''} placeholder="What do you want to remember?" onChange={e => setMemory(m => ({ ...m, notes: { ...m.notes, [s.id]: e.target.value } }))} /></label>)}</section> : null}
        {assignment ? <section className={styles.assignmentBanner} aria-label="Your reading assignment"><div><p className={styles.eyebrow}>{teacher ? 'ASSIGNMENT PREVIEW' : 'YOUR READING ASSIGNMENT'}</p><h2>{assignment.title}</h2><p>{assignment.reading}</p>{assignment.instructions ? <p className={styles.assignmentDirections}>{assignment.instructions}</p> : null}<span>{assignment.due_at ? `Due ${new Date(assignment.due_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : preview ? 'Sample reading · no deadline' : 'No due date'}</span></div><button className={styles.assignmentJump} onClick={() => go('assignment-turn-in')}><strong>{answered}<small> / {assignment.questions.length}</small></strong><span>{teacher ? 'View questions' : 'responses written'} →</span></button></section> : null}
        {assignment ? <section id="assignment-scope" tabIndex={-1} className={styles.assignmentScope} aria-label="What to read">
          <p className={styles.eyebrow}>YOUR ASSIGNMENT BOUNDARIES</p><h2>What to read</h2>
          <p><strong>{scope.label}</strong> · {assignment.questions.length} required {assignment.questions.length === 1 ? 'response' : 'responses'}</p>
          <nav aria-label="Required reading sections">{scope.sections.map((section, index) => <button key={section.id} onClick={() => go(section.id)}><span>{section.number}</span><span>{section.title}<small>{index === 0 && index === scope.sections.length - 1 ? 'START & END HERE' : index === 0 ? 'START HERE' : index === scope.sections.length - 1 ? 'END HERE' : 'REQUIRED'}</small></span><span aria-hidden="true">↗</span></button>)}</nav>
          <p>Read these sections and answer every assigned response. Practice checks help you prepare; they are not required for submission. Other chapter sections and the final reflection are optional.</p>
          <div className={styles.scopeActions}><button className={styles.primaryButton} onClick={() => go(scope.first?.id ?? 'assignment-turn-in')}>Start assigned reading →</button><button className={styles.textButton} aria-pressed={showFullChapter} onClick={toggleChapter}>{showFullChapter ? 'Show assigned sections only' : 'Explore full chapter (optional)'}</button></div>
        </section> : null}
        {ready && resume !== 'opening' && resumeSection ? <div className={styles.resumeBar}><span>Continue where you left off</span><button className={styles.textButton} onClick={() => { go(resumeSection); setResume('opening') }}>{CHAPTER_SECTIONS.find(s => s.id === resumeSection)?.title || 'Bring it together'} →</button></div> : null}
        {assignmentNotice}{assignmentFeedback}
        <section id="opening" data-reading-section tabIndex={-1} className={styles.opening}>{renderOpening(() => go(scope.first?.id ?? definition.sections[0].id))}</section>
        {visibleSections.map(s => <section key={s.id} id={s.id} data-reading-section data-assignment-section={assignment ? (definition.isSectionAssigned(assignment, s) ? 'required' : 'optional') : undefined} tabIndex={-1} className={styles.readingSection}>{assignment && s.id === scope.first?.id ? <div className={styles.assignmentBoundary}><p className={styles.eyebrow}>START OF ASSIGNMENT</p><h2>Assigned reading starts here</h2><p>{scope.label}. Follow the sections marked required, then review your responses.</p></div> : null}{sectionHeader(s.id, s.heading, s.subtitle)}{renderSection(s.id)}<SourceLink page={s.page} url={s.sourceUrl} />{afterSection(s.id)}{assignment && s.id === scope.last?.id ? <div className={styles.assignmentBoundary}><p className={styles.eyebrow}>END OF ASSIGNMENT</p><h2>Assigned reading ends here</h2><p>You have reached the end of {scope.label.toLowerCase()}. Review all {assignment.questions.length} assigned responses, then submit for teacher feedback and {READING_ASSIGNMENT_XP} XP once.</p><button className={styles.primaryButton} onClick={() => go('assignment-turn-in')}>Review & submit →</button><p className={styles.smallPrint}>Anything else in this chapter is optional. Reaching this marker does not submit your work.</p></div> : null}</section>)}
        {showFullChapter ? <section id="synthesis" data-reading-section tabIndex={-1} className={`${styles.readingSection} ${styles.synthesis}`}><p className={styles.eyebrow}>{assignment ? 'OPTIONAL · OUTSIDE THIS ASSIGNMENT' : 'BRING IT TOGETHER'}</p><h2>See the ordinary<br /><em>with new eyes.</em></h2><p className={styles.dek}>{definition.synthesisIntro}</p><div className={styles.synthesisRule}>{definition.reasoningRoutine}</div><div className={styles.prose}><h3>Your transfer challenge</h3><p>{definition.transfer.prompt}</p></div><label className={styles.reflectionLabel}>Explain it in your own words<textarea rows={5} maxLength={4000} value={memory.reflection} onChange={e => setMemory(m => ({ ...m, reflection: e.target.value }))} placeholder={definition.transfer.starter} /></label><p className={styles.smallPrint}>Private practice reflection · not part of your submitted assignment.</p><details className={styles.prediction}><summary>Compare your reasoning with a model</summary><p>{definition.transfer.model}</p></details><div className={styles.evidenceSummary}><b>{completed} of {practiceSections.length} {assignment ? 'assigned-section ' : ''}practice checks currently correct</b><p>{completed === practiceSections.length ? 'Now support your answers with explanations and apply the rule to a new situation.' : 'Revisit any unfinished checks when you are ready. You can keep reading at any time.'} Mastery is judged from evidence and teacher feedback, not scrolling or practice completion.</p></div></section> : null}
        {assignment ? <section id="assignment-turn-in" tabIndex={-1} className={styles.turnIn}><p className={styles.eyebrow}>{teacher ? 'REVIEW THE ASSIGNMENT' : 'YOUR WORK, READY TO REVIEW'}</p><h2>{teacher ? 'Questions in context.' : 'Bring your evidence together.'}</h2><p>{teacher ? 'Assigned questions appear beside their source sections. References without a verified section match appear below.' : 'Your assigned explanations are the work your teacher reviews. The practice checks and private notes are not submitted.'}</p><nav className={styles.answerLinks} aria-label="Assigned responses">{assignment.questions.map((q, i) => <button key={q.id} onClick={() => go(`assigned-${q.id}`)}>Response {i + 1} ↗</button>)}</nav>{assignedQuestions(null)}{assignmentFooter}</section> : null}
        <footer className={styles.readerFooter}><span>ANTOCCI PHYSICS</span><p>Chapter {String(definition.chapter).padStart(2, '0')} · Connected reading<br />{definition.scopeNote}</p><button className={styles.textButton} onClick={() => go('opening')}>Back to the big idea ↑</button></footer>
      </main>
      <aside className={styles.contextRail}><div className={styles.contextInner}><p className={styles.eyebrow}>YOUR FOCUS</p><h3>{currentSection ? currentSection.target : definition.focus}</h3><div className={styles.railLine} /><p className={styles.eyebrow}>READ WITH A QUESTION</p><p>{currentSection ? currentSection.check.title : definition.guidingQuestion}</p>{assignment ? <><div className={styles.railLine} /><span className={styles.railCount}>{answered}<small> / {assignment.questions.length}</small></span><p>assigned responses written</p><button className={styles.railButton} onClick={() => go('assignment-turn-in')}>{teacher ? 'View assignment' : 'Review & submit'} →</button></> : null}<div className={styles.railTip}>Make a prediction.<br />Change one thing.<br /><em>Explain what you notice.</em></div></div></aside>
    </div>
  </div>
}
