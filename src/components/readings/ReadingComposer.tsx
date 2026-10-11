'use client'
import { useAssignmentLeaveGuard } from '@/hooks/useAssignmentLeaveGuard'
import AssignmentDueInput from '@/components/ui/assignment-due-input'
import { dueDateDraft, dueDateValue, dueDatePreview } from '@/lib/assignment-due-input'
import ReadingSourceEditor from './ReadingSourceEditor'
import { useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown, Circle, Eye, FileText, ListChecks, Plus, Search, Settings2, Sparkles, Target, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TEXTBOOK_PARTS, textbookChapter } from '@/data/textbook'
import { TEXTBOOK_SECTIONS } from '@/data/textbook-sections'
import pageMapData from '@/data/textbook-page-map.json'
import { questionNumbers, validateReading, type ReadingAssignment, type ReadingCourse, type ReadingQuestion, type ReadingTarget } from '@/lib/textbook-assignments'
import { matchReadingTarget, numberedReadingReference, READING_QUESTION_SETS, TEXTBOOK_TARGET_MAP } from '@/lib/textbook-target-mapping'
import { dueLabel, readingFetch } from './ReadingShared'
import ReadingAssignmentResources, { ReadingQuestionText } from './ReadingAssignmentResources'
import shared from './readings.module.css'
import styles from './ReadingComposer.module.css'

const BookPreview = dynamic(() => import('./ReadingBookPreview'), { ssr: false, loading: () => <p className={styles.previewMessage}>Opening your textbook…</p> })
const pageMap = pageMapData as Record<string, { offset: number; pages: number; questions: Record<string, number> }>
export type ReadingCatalog = { courses: ReadingCourse[]; targets: ReadingTarget[]; units: { id: string; name: string; program: string }[]; readOnly: boolean }
const steps = ['Choose reading', 'Pick questions', 'Preview & assign']

export default function ReadingComposer({ initial, catalog, onSaved, onCancel }: { initial: ReadingAssignment; catalog: ReadingCatalog; onSaved: (assignment: ReadingAssignment) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState(() => ({ ...initial, title: initial.title || textbookChapter(initial.chapter)?.title || 'Textbook reading' }))
  const [step, setStep] = useState(initial.passage || initial.honors_reading ? 2 : 0), [busy, setBusy] = useState(false), [error, setError] = useState('')
  const [chapterPicker, setChapterPicker] = useState(false), [search, setSearch] = useState('')
  const [page, setPage] = useState(1), [mobilePreview, setMobilePreview] = useState(false)
  const [set, setSet] = useState<string>('Check Concepts'), [numbers, setNumbers] = useState(''), [kind, setKind] = useState('auto')
  const [mappingMode, setMappingMode] = useState('auto'), [mappingStatus, setMappingStatus] = useState('')
  const [unit, setUnit] = useState(''), [target, setTarget] = useState(''), [openQuestions, setOpenQuestions] = useState<string[]>([])
  const [editDetails, setEditDetails] = useState(false), [customDue, setCustomDue] = useState(!!initial.due_at)
  const [due, setDue] = useState(() => dueDateDraft(initial.due_at))
  const [original] = useState(() => JSON.stringify(draft))
  const canLeave = useAssignmentLeaveGuard(JSON.stringify(draft) !== original || JSON.stringify(due) !== JSON.stringify(dueDateDraft(initial.due_at)))
  const heading = useRef<HTMLHeadingElement>(null)
  const course = catalog.courses.find(c => c.id === draft.course_id), program = course?.program ?? 'physics'
  const chapter = textbookChapter(draft.chapter)!, sections = TEXTBOOK_SECTIONS[draft.chapter]?.sections ?? []
  const metadata = pageMap[draft.chapter], availableTargets = catalog.targets.filter(t => (t.program ?? 'physics') === program)
  const units = catalog.units.filter(u => (u.program ?? 'physics') === program)
  const linkedTarget = (id: string) => availableTargets.find(t => t.id === id)
  const missingTargets = draft.questions.filter(q => !linkedTarget(q.target_id)).length
  const targetCount = new Set(draft.questions.filter(q => linkedTarget(q.target_id)).map(q => q.target_id)).size
  const selectedSections = sections.filter(s => draft.section_ids.includes(s.id))
  const chapterSets = TEXTBOOK_TARGET_MAP.chapters[draft.chapter]?.sets ?? {}
  const patch = (value: Partial<ReadingAssignment>) => setDraft(d => ({ ...d, ...value }))
  function go(next: number) { setStep(next); setError(''); requestAnimationFrame(() => { heading.current?.focus(); heading.current?.scrollIntoView({ block: 'start' }) }) }
  function changeClass(id: string) {
    const changesProgram = (catalog.courses.find(c => c.id === id)?.program ?? 'physics') !== program
    if (changesProgram && draft.questions.length && !window.confirm('This class uses a different curriculum. Clear the existing questions and choose new mastery targets?')) return
    patch({ course_id: id, ...(catalog.courses.find(c => c.id === id)?.track !== 'honors' ? { honors_reading: null } : {}), ...(changesProgram ? { questions: [] } : {}) })
    if (changesProgram) { setTarget(''); setUnit(''); setMappingStatus(''); setOpenQuestions([]) }
  }
  function changeChapter(n: number) {
    if (n === draft.chapter) { setChapterPicker(false); return }
    if (draft.questions.length && !window.confirm('Changing the chapter clears the question list. Continue?')) return
    patch({ passage: null, honors_reading: null, chapter: n, section_ids: [], reading: `Chapter ${n}`, questions: [], ...(draft.title === chapter.title ? { title: textbookChapter(n)!.title } : {}) })
    setPage(1); setSet('Check Concepts'); setKind('auto'); setNumbers(''); setOpenQuestions([]); setMappingStatus(''); setChapterPicker(false); setError('')
  }
  function selectSection(id: string, checked: boolean) {
    const selected = checked ? [...draft.section_ids, id] : draft.section_ids.filter(s => s !== id)
    patch({ section_ids: selected, reading: selected.length ? `Sections ${sections.filter(s => selected.includes(s.id)).map(s => s.id).join(', ')}` : `Chapter ${draft.chapter}` })
    setPage(Math.max(1, sections.find(s => s.id === id)!.page - metadata.offset))
  }
  const updateQuestion = (id: string, value: Partial<ReadingQuestion>) => setDraft(d => ({ ...d, questions: d.questions.map(q => q.id === id ? { ...q, ...value } : q) }))
  function add(questions: Omit<ReadingQuestion, 'id'>[], batch = false) {
    const fresh = questions.filter(q => !q.reference || !draft.questions.some(old => old.reference === q.reference))
    if (!fresh.length) { setMappingStatus('Those questions are already selected.'); return }
    if (draft.questions.length + fresh.length > 30) { setError('Keep each reading to 30 questions or fewer.'); return }
    if (batch && mappingMode === 'manual' && !linkedTarget(target)) { setError('Choose a target for this batch, or switch to automatic mapping.'); return }
    const added = fresh.map(q => ({ ...q, id: crypto.randomUUID(), target_id: batch && mappingMode === 'manual' ? target : matchReadingTarget(draft.chapter, q.reference, catalog.targets, program, q.prompt).target?.id ?? '' }))
    patch({ questions: [...draft.questions, ...added] }); setError('')
    setOpenQuestions(ids => [...ids, ...added.filter(q => !q.reference).map(q => q.id)])
    const linked = added.filter(q => q.target_id).length
    setMappingStatus(`${added.length} added · ${linked} targets matched${linked < added.length ? ` · ${added.length - linked} need your choice` : ''}.`)
  }
  function previewQuestion(q: Pick<ReadingQuestion, 'reference'>) {
    const number = q.reference.match(/#(\d+)$/)?.[1], section = q.reference.match(/^Section ([\d.]+) · Concept Check$/)?.[1]
    if (number && metadata.questions[number]) setPage(metadata.questions[number])
    else if (section) setPage(Math.max(1, (sections.find(s => s.id === section)?.page ?? metadata.offset + 1) - metadata.offset))
  }
  function toggleNumber(n: number) {
    const reference = numberedReadingReference(draft.chapter, n), existing = draft.questions.find(q => q.reference === reference)
    previewQuestion({ reference })
    if (existing) patch({ questions: draft.questions.filter(q => q.id !== existing.id) })
    else add([{ reference, prompt: '', target_id: '' }])
  }
  function mapUnlinked() {
    let mapped = 0
    const questions = draft.questions.map(q => {
      if (linkedTarget(q.target_id)) return q
      const match = matchReadingTarget(draft.chapter, q.reference, catalog.targets, program, q.prompt)
      if (!match.target) return q
      mapped++; return { ...q, target_id: match.target.id }
    })
    patch({ questions }); setMappingStatus(`${mapped} targets filled in. Your existing choices were kept.`)
  }
  async function save(status: 'draft' | 'published') {
    setBusy(true); setError('')
    try {
      if (missingTargets) { setStep(1); setOpenQuestions(draft.questions.filter(q => !linkedTarget(q.target_id)).map(q => q.id)); throw new Error(`Choose a mastery target for ${missingTargets === 1 ? 'the highlighted question' : `all ${missingTargets} highlighted questions`} before saving.`) }
      const payload = validateReading({ ...draft, due_at: dueDateValue(due), status })
      const result = await readingFetch<{ assignment: ReadingAssignment }>('/api/readings', { method: 'POST', body: JSON.stringify(payload) })
      onSaved(result.assignment)
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  return <div className={styles.composer}>
    <div className={styles.header}><div><p className={`text-overline ${styles.eyebrow}`}>Textbook studio</p><h1 className="text-title-1" ref={heading} tabIndex={-1}>{initial.version ? 'Edit your reading' : 'Build a reading'}</h1></div><Button type="button" variant="ghost" onClick={() => { if (canLeave()) onCancel() }} disabled={busy}><ArrowLeft />All readings</Button></div>
    <fieldset disabled={busy || catalog.readOnly} className={styles.composer}>
      <nav aria-label="Assignment steps" className={styles.steps}>{steps.map((label, index) => <button type="button" key={label} className={styles.step} aria-current={step === index ? 'step' : undefined} onClick={() => go(index)}><span className={styles.stepNumber}>{index < step ? <Check size={15} /> : index + 1}</span><span>{label}</span></button>)}</nav>
      <div className={styles.layout}>
        <div className={styles.main}>
          {step === 0 && <>
            <div className={styles.between}><label className={shared.field}><span className={styles.row}><Users size={16} />Assign to</span><select aria-label="Class" value={draft.course_id} disabled={initial.version > 0} onChange={e => changeClass(e.target.value)}>{catalog.courses.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ` · ${c.section}` : ''}</option>)}</select></label></div>
            <ReadingSourceEditor draft={draft} honors={course?.track === 'honors'} onChange={patch}/>
            {!draft.honors_reading && draft.passage == null && <>
            <div className={styles.chapter}><span className={styles.chapterNumber} aria-hidden="true">{String(draft.chapter).padStart(2, '0')}</span><div className={styles.chapterText}><p className={`text-overline ${styles.eyebrow}`}>Conceptual Physics · Chapter {draft.chapter}</p><h2 className="text-title-2">{chapter.title}</h2><Button type="button" variant="outline" onClick={() => { setChapterPicker(p => !p); setSearch('') }} aria-expanded={chapterPicker}>Change chapter<ChevronDown /></Button></div></div>
            {chapterPicker && <div className={styles.panel}><label className={shared.field}><span className={styles.row}><Search size={16} />Find a chapter</span><input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Chapter number or topic" /></label><div className={styles.chapterSearch}>{TEXTBOOK_PARTS.map(part => { const chapters = part.chapters.filter(c => `${c.n} ${c.title}`.toLowerCase().includes(search.toLowerCase())); return !!chapters.length && <div key={part.part}><p className="text-overline mb-2 text-muted-foreground">{part.part}</p><div className={styles.chapterGroup}>{chapters.map(c => <button type="button" className={styles.chapterChoice} key={c.n} aria-pressed={c.n === draft.chapter} onClick={() => changeChapter(c.n)}><strong>{String(c.n).padStart(2, '0')}</strong><span>{c.title}</span></button>)}</div></div> })}</div></div>}
            <div className={styles.between}><div><h2 className="text-title-3">What should they read?</h2><p className={styles.muted}>Tap sections to select and preview them.</p></div><Button type="button" variant={!draft.section_ids.length ? 'secondary' : 'ghost'} aria-pressed={!draft.section_ids.length} onClick={() => { patch({ section_ids: [], reading: `Chapter ${draft.chapter}` }); setPage(1) }}>Whole chapter</Button></div>
            <div className={styles.sectionGrid}>{sections.map(s => <label className={styles.section} key={s.id}><input type="checkbox" aria-label={`${s.id} ${s.title}`} checked={draft.section_ids.includes(s.id)} onChange={e => selectSection(s.id, e.target.checked)} /><span className={styles.sectionBody}><span className={styles.sectionId}>{s.id}</span><strong>{s.title}</strong><span className={styles.muted}>Page {s.page}</span></span>{draft.section_ids.includes(s.id) ? <CheckCircle2 className={styles.selectionIcon} /> : <Circle className={styles.selectionIcon} />}</label>)}</div>
            </>}
          </>}
          {step === 1 && <>
            <div><p className={`text-overline ${styles.eyebrow}`}>Chapter {draft.chapter} · {chapter.title}</p><h2 className="text-title-2 mt-2">Tap the questions you want.</h2><p className={`${styles.muted} mt-1`}>Each tile opens its textbook page. Tap again to remove.</p></div>
            <div className={styles.tabs} aria-label="Question sets">{READING_QUESTION_SETS.filter(k => chapterSets[k]?.length).map(k => <button type="button" key={k} className={styles.tab} aria-pressed={set === k} onClick={() => { setSet(k); setPage(metadata.questions[chapterSets[k][0]] ?? 1) }}>{k}</button>)}<button type="button" className={styles.tab} aria-pressed={set === 'sections'} onClick={() => setSet('sections')}><ListChecks size={15} />Section checks</button></div>
            {set === 'sections' ? <div className={styles.tray}>{!selectedSections.length ? <div className={styles.empty}><BookOpen size={28} /><p>Choose sections to see their concept checks.</p><Button type="button" variant="outline" onClick={() => go(0)}>Choose sections</Button></div> : selectedSections.filter(s => s.conceptCheck).map(s => { const reference = `Section ${s.id} · Concept Check`, existing = draft.questions.find(q => q.reference === reference); return <button type="button" className={styles.conceptCard} key={s.id} aria-pressed={!!existing} onClick={() => { previewQuestion({ reference }); if (existing) patch({ questions: draft.questions.filter(q => q.id !== existing.id) }); else add([{ reference, prompt: s.conceptCheck!, target_id: '' }]) }}><span className={styles.between}><strong>{s.id} · {s.title}</strong>{existing ? <CheckCircle2 size={18} /> : <Plus size={18} />}</span><p>{s.conceptCheck}</p></button> })}</div> : <><div className={styles.questionGrid}>{(chapterSets[set] ?? []).map(n => { const reference = numberedReadingReference(draft.chapter, n), selected = draft.questions.some(q => q.reference === reference), match = matchReadingTarget(draft.chapter, reference, catalog.targets, program); return <button type="button" key={n} className={styles.tile} aria-label={`${set} question ${n}`} aria-pressed={selected} data-unmapped={!match.target} title={match.target?.statement ?? 'Choose a target after adding'} onClick={() => toggleNumber(n)}>{selected ? <Check size={13} /> : !match.target ? <Target size={11} /> : null}{n}</button> })}</div><p className={styles.legend}><Target size={14} />Dashed tiles need a mastery target.</p></>}
            <div className={styles.between}><h3 className="text-title-3">Your questions <span className="text-muted-foreground">{draft.questions.length}/30</span></h3><span className={styles.status} data-needs={!!missingTargets}>{missingTargets ? <Target size={15} /> : <Sparkles size={15} />}{missingTargets ? `${missingTargets} need a target` : 'Targets auto-matched'}</span></div>
            <div className={styles.tray}>{!draft.questions.length && <div className={styles.empty}><ListChecks size={28} /><p>Your selected questions will appear here.</p></div>}{draft.questions.map((q, i) => { const linked = linkedTarget(q.target_id), open = openQuestions.includes(q.id); return <div className={styles.selectedQuestion} key={q.id} data-needs={!linked} data-question-id={q.id}><div className={styles.questionRow}><button type="button" className={styles.questionInfo} aria-label={`Edit question ${i + 1}`} aria-expanded={open} onClick={() => setOpenQuestions(ids => open ? ids.filter(id => id !== q.id) : [...ids, q.id])}><strong>{i + 1}. {q.reference || 'Custom question'}</strong><span className={styles.targetLine}><Target size={13} /><span>{linked?.statement ?? 'Choose a mastery target'}</span></span></button><Button type="button" variant="ghost" size="icon" aria-label={`Preview question ${i + 1} in textbook`} disabled={!q.reference.match(/#\d+$|^Section [\d.]+ · Concept Check$/)} onClick={() => { previewQuestion(q); setMobilePreview(true) }}><Eye /></Button><Button type="button" variant="ghost" size="icon" aria-label={`Remove question ${i + 1}`} onClick={() => patch({ questions: draft.questions.filter(x => x.id !== q.id) })}><Trash2 /></Button></div>{open && <div className={styles.editor}><label className={shared.field}>Question {i + 1} reference<input maxLength={160} value={q.reference} onChange={e => updateQuestion(q.id, { reference: e.target.value, target_id: '' })} placeholder="Textbook reference or question title" /></label><label className={shared.field}>Question {i + 1} prompt<textarea rows={2} maxLength={3000} value={q.prompt} onChange={e => updateQuestion(q.id, { prompt: e.target.value, target_id: '' })} placeholder="Optional wording or extra instructions" /></label>{!linked && <p className={styles.muted}>{matchReadingTarget(draft.chapter, q.reference, catalog.targets, program, q.prompt).reason}</p>}<label className={shared.field}>Question {i + 1} mastery target<select value={q.target_id} onChange={e => updateQuestion(q.id, { target_id: e.target.value })}><option value="">Choose a mastery target…</option>{availableTargets.map(t => <option key={t.id} value={t.id}>{t.unit_id} · {t.statement}</option>)}</select></label></div>}</div> })}</div>
            <div className={styles.row}><Button type="button" variant="outline" onClick={() => add([{ reference: '', prompt: '', target_id: '' }])}><Plus />Write a question</Button>{!!missingTargets && <Button type="button" variant="ghost" onClick={mapUnlinked}>Map unlinked questions</Button>}</div>
            <details className={styles.tools}><summary><Settings2 size={16} />Quick add numbers & batch options<ChevronDown size={15} /></summary><div className={styles.toolFields}><div className={shared.grid}><label className={shared.field}>Question numbers<input value={numbers} onChange={e => setNumbers(e.target.value)} placeholder="1–5, 8, 12" /></label><label className={shared.field}>Question set<select value={kind} onChange={e => setKind(e.target.value)}><option value="auto">Find automatically</option>{READING_QUESTION_SETS.filter(k => chapterSets[k]?.length).map(k => <option key={k}>{k}</option>)}</select></label></div><label className={shared.field}>Target selection<select value={mappingMode} onChange={e => setMappingMode(e.target.value)}><option value="auto">Map each question automatically</option><option value="manual">Use one target for this batch</option></select></label>{mappingMode === 'manual' && <div className={shared.grid}><label className={shared.field}>Unit<select value={unit} onChange={e => { setUnit(e.target.value); setTarget('') }}><option value="">All units</option>{units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label><label className={shared.field}>Target for new questions<select value={target} onChange={e => setTarget(e.target.value)}><option value="">Choose a target…</option>{availableTargets.filter(t => !unit || t.unit_id === unit).map(t => <option key={t.id} value={t.id}>{t.statement}</option>)}</select></label></div>}<Button type="button" variant="outline" onClick={() => { try { const ns = questionNumbers(numbers); if (!ns.length) throw new Error('Enter the question numbers.'); const questions = ns.map(n => ({ reference: numberedReadingReference(draft.chapter, n, kind), prompt: '', target_id: '' })); add(questions, true); previewQuestion(questions[0]) } catch (e) { setError((e as Error).message) } }}>Add numbered questions</Button></div></details>
            <p className="sr-only" role="status">{mappingStatus}</p>
          </>}
          {step === 2 && <>
            <div className={styles.between}><h2 className="text-title-2"><Eye className="inline mr-2 text-primary" size={22} />Student preview</h2><span className={styles.muted}>Before you publish</span></div>
            <div className={styles.studentCard} data-testid="student-assignment-preview"><div className={styles.studentHero}><p className={`text-overline ${styles.eyebrow}`}>{course?.name}{course?.section ? ` · ${course.section}` : ''}</p><h3 className="text-title-1">{draft.title}</h3><p className={styles.row}><BookOpen size={18} /><span>{draft.reading}</span></p><p className={styles.muted}>{dueLabel(dueDatePreview(due))}</p>{draft.instructions && <p className="whitespace-pre-wrap text-sm">{draft.instructions}</p>}</div><div className={styles.studentBody}><ReadingAssignmentResources key={`${draft.chapter}:${draft.section_ids.join(",")}`} assignment={draft} />{draft.questions.length ? draft.questions.map((q, i) => <div className={styles.previewQuestion} key={q.id}><strong>{i + 1}. {q.reference || 'Your question'}</strong><ReadingQuestionText chapter={draft.chapter} question={q} /><p className={`${styles.row} ${styles.muted}`}><Target size={15} />{linkedTarget(q.target_id)?.statement ?? 'Mastery target needed'}</p><div className={styles.answerGhost}>Your answer and reasoning…</div></div>) : <div className={styles.empty}><ListChecks /><p>Add questions to complete this reading.</p><Button type="button" variant="outline" onClick={() => go(1)}>Pick questions</Button></div>}<p className={styles.legend}><CheckCircle2 size={16} />Students submit answers for your mastery review.</p></div></div>
          </>}
        </div>
        {step < 2 ? <aside className={styles.aside} data-preview="book" data-open={mobilePreview}><div className={styles.previewHeader}><strong><BookOpen size={18} className="text-primary" />Inside the textbook</strong><Button type="button" variant="outline" className={styles.mobilePreview} aria-expanded={mobilePreview} onClick={() => setMobilePreview(p => !p)}><Eye />{mobilePreview ? 'Hide preview' : 'Preview pages'}</Button></div><div className={styles.bookShell}>{draft.passage != null || draft.honors_reading ? <ReadingAssignmentResources key={draft.honors_reading?.from ?? 'note'} assignment={draft}/> : <BookPreview key={draft.chapter} chapter={draft.chapter} page={page} offset={metadata.offset} onPage={setPage} />}</div><p className={`${styles.muted} ${styles.previewCaption}`}>The same textbook pages your students will read.</p></aside> : <aside className={styles.aside}><div className={styles.panel}><div className={styles.between}><h2 className="text-title-3">Ready for your class</h2><Users className="text-primary" size={22} /></div><p className="font-semibold text-sm">{course?.name}{course?.section ? ` · ${course.section}` : ''}</p><div className={styles.metrics}><div className={styles.metric}><strong>{selectedSections.length || 'All'}</strong><span>sections</span></div><div className={styles.metric}><strong>{draft.questions.length}</strong><span>questions</span></div><div className={styles.metric}><strong>{targetCount}</strong><span>targets</span></div></div><div><h3 className="text-sm font-semibold mb-2">Due</h3><div className={styles.tabs}><button type="button" className={styles.tab} aria-pressed={!due.date && !customDue} onClick={() => { setDue(dueDateDraft(null)); setCustomDue(false) }}>No due date</button><button type="button" className={styles.tab} onClick={() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(23, 59, 0, 0); setDue(dueDateDraft(d.toISOString())); setCustomDue(true) }}>Tomorrow</button><button type="button" className={styles.tab} aria-pressed={customDue} onClick={() => setCustomDue(true)}>Pick date</button></div>{customDue && <AssignmentDueInput value={due} onChange={setDue} />}</div><Button type="button" variant="outline" onClick={() => setEditDetails(p => !p)} aria-expanded={editDetails}><FileText />Edit title & directions</Button>{editDetails && <div className={styles.toolFields}><label className={shared.field}>Assignment title<input value={draft.title} maxLength={160} onChange={e => patch({ title: e.target.value })} /></label><label className={shared.field}>Reading pages or sections<input value={draft.reading} maxLength={500} onChange={e => patch({ reading: e.target.value })} /></label><label className={shared.field}>Directions<textarea value={draft.instructions} maxLength={3000} rows={3} placeholder="Add instructions for your students…" onChange={e => patch({ instructions: e.target.value })} /></label></div>}<span className={styles.status} data-needs={!!missingTargets}>{missingTargets ? <Target size={16} /> : <CheckCircle2 size={16} />}{missingTargets ? `${missingTargets} questions still need targets` : `${draft.questions.length} questions · targets linked`}</span><Button type="button" variant="ghost" onClick={() => go(1)}>Review questions & targets<ArrowLeft /></Button></div></aside>}
      </div>
    </fieldset>
    {error && <p className={shared.error} role="alert">{error}</p>}
    <div className={styles.footer}><div className={styles.footerSummary}><strong>{draft.reading}</strong><span className={styles.muted}>{draft.questions.length} questions · {targetCount} mastery targets</span></div><div className={styles.footerActions}><Button type="button" variant="ghost" disabled={busy} onClick={() => step ? go(step - 1) : onCancel()}><ArrowLeft />{step ? 'Back' : 'Cancel'}</Button>{step === 2 ? <><Button type="button" variant="outline" disabled={busy || catalog.readOnly} onClick={() => void save('draft')}>Save draft</Button><Button type="button" disabled={busy || catalog.readOnly} onClick={() => void save('published')}>{busy ? 'Saving…' : 'Publish reading'}</Button></> : <Button type="button" disabled={busy} onClick={() => go(step + 1)}>{step === 0 ? 'Pick questions' : 'Preview assignment'}<ArrowRight /></Button>}</div></div>
  </div>
}
