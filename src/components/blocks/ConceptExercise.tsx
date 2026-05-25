"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import type { ConceptChapter, ExSection, ExItem } from '@/data/content-blocks'

// Bundle the pdf.js worker locally (no CDN → no CSP headaches, version always matches).
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

// ---------------------------------------------------------------------------
// ConceptExercise — side-by-side textbook reader (left) + auto-graded digital
// exercise (right). As the reader scrolls, the right pane follows to the
// matching section (sections carry book-page anchors; pageOffset maps book page
// → PDF page). Answers are graded server-side (answer key never reaches here).
// Rendered behind a dynamic import (ssr:false) so react-pdf stays client-only.
// ---------------------------------------------------------------------------

type AnswerVal = string | string[]
interface ItemResult { correct: boolean; needsReview?: boolean; answered: boolean }
export interface ConceptValue {
  answers: Record<string, AnswerVal>
  submitted?: boolean
  results?: Record<string, ItemResult>
  summary?: { autoCorrect: number; autoTotal: number; reviewCount: number; answeredCount: number; itemCount: number }
}

const C = { ink: 'var(--foreground)', mute: 'var(--muted-foreground)', hair: 'var(--border)', primary: 'var(--primary)', success: 'var(--success)', card: 'var(--card)' }

export default function ConceptExercise({ chapter, value, onSave }: { chapter: number; value?: ConceptValue; onSave: (v: ConceptValue) => void }) {
  const [data, setData] = useState<ConceptChapter | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [pageWidth, setPageWidth] = useState(460)
  const [pdfFailed, setPdfFailed] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const [answers, setAnswers] = useState<Record<string, AnswerVal>>(value?.answers ?? {})
  const [results, setResults] = useState<Record<string, ItemResult> | undefined>(value?.results)
  const [summary, setSummary] = useState<ConceptValue['summary']>(value?.summary)
  const [submitted, setSubmitted] = useState(!!value?.submitted)
  const [grading, setGrading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [forceIframe, setForceIframe] = useState(false)

  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const pageEls = useRef<Map<number, HTMLDivElement>>(new Map())
  const sectionEls = useRef<Map<string, HTMLDivElement>>(new Map())
  const onSaveRef = useRef(onSave); onSaveRef.current = onSave
  const touched = useRef(false)

  // ---- save-and-resume: debounce-save draft answers so work isn't lost ----
  useEffect(() => {
    if (!touched.current || submitted) return
    const t = setTimeout(() => onSaveRef.current({ answers, submitted: false }), 800)
    return () => clearTimeout(t)
  }, [answers, submitted])

  // ---- load chapter ------------------------------------------------------
  useEffect(() => {
    let cancelled = false
    setData(null); setLoadErr(null)
    fetch(`/api/concept-exercises/${chapter}`)
      .then((r) => r.ok ? r.json() : r.json().then((j) => Promise.reject(new Error(j.error || 'load failed'))))
      .then((d: ConceptChapter) => { if (!cancelled) setData(d) })
      .catch((e) => { if (!cancelled) setLoadErr(e.message || 'Could not load the chapter') })
    return () => { cancelled = true }
  }, [chapter])

  // ---- measure the left column so PDF pages fit ---------------------------
  useEffect(() => {
    const el = leftRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setPageWidth(Math.max(260, Math.floor(el.clientWidth - 24))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [data])

  // ---- left scroll → which book page is in view → matching section --------
  const onLeftScroll = useCallback(() => {
    const cont = leftRef.current
    if (!cont || !data) return
    const mid = cont.scrollTop + cont.clientHeight * 0.33
    let current = 1
    for (const [pageNo, el] of pageEls.current) {
      if (el.offsetTop <= mid) current = Math.max(current, pageNo)
    }
    const bookPage = current + (data.pageOffset ?? 0)
    const sec = data.sections.find((s) => bookPage >= s.pageStart && bookPage <= s.pageEnd)
      ?? data.sections.filter((s) => s.pageStart <= bookPage).slice(-1)[0]
    if (sec && sec.id !== activeSection) {
      setActiveSection(sec.id)
      const target = sectionEls.current.get(sec.id)
      const rc = rightRef.current
      if (target && rc) rc.scrollTo({ top: target.offsetTop - 8, behavior: 'smooth' })
    }
  }, [data, activeSection])

  const setAnswer = (n: number, v: AnswerVal) => { touched.current = true; setAnswers((prev) => ({ ...prev, [String(n)]: v })) }

  const submit = async () => {
    setGrading(true)
    try {
      const res = await fetch(`/api/concept-exercises/${chapter}/grade`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers }),
      })
      const j = await res.json()
      if (!res.ok) { setGrading(false); return }
      const sum = { autoCorrect: j.autoCorrect, autoTotal: j.autoTotal, reviewCount: j.reviewCount, answeredCount: j.answeredCount, itemCount: j.itemCount }
      setResults(j.results); setSummary(sum); setSubmitted(true)
      onSave({ answers, submitted: true, results: j.results, summary: sum })
    } catch { /* leave un-submitted */ } finally { setGrading(false) }
  }

  if (loadErr) return <p className="text-sm" style={{ color: 'var(--destructive)' }}>Couldn&apos;t load this chapter ({loadErr}).</p>
  if (!data) return <p className="text-sm" style={{ color: C.mute }}>Loading the reader…</p>

  const useIframe = pdfFailed || forceIframe
  const paneH = expanded ? 'calc(100vh - 70px)' : '76vh'
  const wrapStyle = expanded
    ? { position: 'fixed' as const, inset: 0, zIndex: 1000, background: 'var(--background)', padding: '12px 16px', overflow: 'auto' }
    : undefined

  return (
    <div style={wrapStyle}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-sm font-semibold min-w-0 truncate" style={{ color: C.ink }}>Chapter {data.chapter}: {data.title}</div>
        <div className="flex items-center gap-2 shrink-0">
          {data.textPdfUrl && (
            <button onClick={() => setForceIframe((v) => !v)} className="text-xs font-medium rounded-lg border px-2.5 py-1" style={{ borderColor: C.hair, color: C.mute }}>
              {useIframe ? 'Rich reader' : 'Simple reader'}
            </button>
          )}
          <button onClick={() => setExpanded((v) => !v)} className="text-xs font-semibold rounded-lg border px-2.5 py-1" style={{ borderColor: C.hair, color: C.primary }}>
            {expanded ? '✕ Close full screen' : '⤢ Full screen'}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT — textbook reader */}
        {!data.textPdfUrl ? (
          <div className="rounded-xl border p-4 text-sm" style={{ borderColor: C.hair, background: C.card, color: C.mute }}>No chapter PDF is attached yet.</div>
        ) : useIframe ? (
          // Native-viewer fallback: always renders the PDF (no scroll-sync). Use the
          // section chips on the right to jump the reading.
          <iframe key="iframe" src={data.textPdfUrl} title={`Chapter ${data.chapter} reading`}
            style={{ width: '100%', height: paneH, border: `0.5px solid ${C.hair}`, borderRadius: 12, background: C.card }} />
        ) : (
          <div ref={leftRef} onScroll={onLeftScroll}
            className="rounded-xl border overflow-y-auto" style={{ borderColor: C.hair, background: C.card, maxHeight: paneH, position: 'relative' }}>
            <Document file={data.textPdfUrl} onLoadSuccess={({ numPages: n }) => setNumPages(n)} onLoadError={() => setPdfFailed(true)} onSourceError={() => setPdfFailed(true)}
              loading={<div className="p-4 text-sm" style={{ color: C.mute }}>Loading the reading…</div>}>
              {Array.from({ length: numPages }, (_, i) => (
                <div key={i} ref={(el) => { if (el) pageEls.current.set(i + 1, el) }} style={{ display: 'flex', justifyContent: 'center', padding: '6px 0', borderBottom: `0.5px solid ${C.hair}` }}>
                  <Page pageNumber={i + 1} width={pageWidth} renderTextLayer={false} renderAnnotationLayer={false} />
                </div>
              ))}
            </Document>
          </div>
        )}

        {/* RIGHT — digital exercise, scrolls to follow the reader */}
        <div ref={rightRef} className="rounded-xl border overflow-y-auto" style={{ borderColor: C.hair, background: C.card, maxHeight: paneH, position: 'relative' }}>
          <div className="p-3">
            {data.sections.map((s) => (
              <SectionView key={s.id} section={s} active={activeSection === s.id}
                answers={answers} results={submitted ? results : undefined} disabled={submitted}
                onAnswer={setAnswer}
                registerRef={(el) => { if (el) sectionEls.current.set(s.id, el) }} />
            ))}

            <div className="mt-3 border-t pt-3" style={{ borderColor: C.hair }}>
              {!submitted ? (
                <button onClick={submit} disabled={grading}
                  className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-bold"
                  style={{ background: C.primary, color: 'var(--primary-foreground)', opacity: grading ? 0.6 : 1 }}>
                  {grading ? 'Checking…' : 'Submit & check'}
                </button>
              ) : (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-sm" style={{ color: C.ink }}>
                    <span style={{ color: C.success, fontWeight: 700 }}>{summary?.autoCorrect}/{summary?.autoTotal}</span> auto-checked correct
                    {summary?.reviewCount ? <span style={{ color: C.mute }}> · {summary.reviewCount} written answer{summary.reviewCount === 1 ? '' : 's'} for your teacher to review</span> : null}
                  </div>
                  <button onClick={() => { setSubmitted(false); setResults(undefined) }}
                    className="text-xs font-semibold rounded-lg border px-3 py-1.5" style={{ borderColor: C.hair, color: C.primary }}>Edit answers</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
function SectionView({ section, active, answers, results, disabled, onAnswer, registerRef }: {
  section: ExSection; active: boolean; answers: Record<string, AnswerVal>; results?: Record<string, ItemResult>; disabled: boolean;
  onAnswer: (n: number, v: AnswerVal) => void; registerRef: (el: HTMLDivElement | null) => void
}) {
  return (
    <div ref={registerRef} className="mb-4 rounded-lg p-2" style={{ background: active ? 'color-mix(in oklch, var(--primary) 8%, var(--card))' : 'transparent', transition: 'background 200ms' }}>
      <div className="text-sm font-bold mb-2" style={{ color: 'var(--primary)' }}>{section.id} {section.label}</div>
      <div className="flex flex-col gap-3">
        {section.items.map((it) => (
          <ItemView key={it.n} item={it} value={answers[String(it.n)]} result={results?.[String(it.n)]} disabled={disabled} onAnswer={onAnswer} />
        ))}
      </div>
    </div>
  )
}

function ItemView({ item, value, result, disabled, onAnswer }: {
  item: ExItem; value?: AnswerVal; result?: ItemResult; disabled: boolean; onAnswer: (n: number, v: AnswerVal) => void
}) {
  const tag = result
    ? (result.needsReview
        ? <span className="text-xs" style={{ color: C.mute }}>✎ for teacher review</span>
        : result.correct
          ? <span className="text-xs font-semibold" style={{ color: C.success }}>✓ correct</span>
          : <span className="text-xs font-semibold" style={{ color: 'var(--destructive)' }}>✗ not yet</span>)
    : null

  return (
    <div>
      <div className="flex items-start gap-2">
        <span className="text-sm font-semibold shrink-0" style={{ color: C.ink }}>{item.n}.</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm" style={{ color: C.ink }}>{item.prompt} {tag}</div>
          <div className="mt-1.5">
            {item.type === 'fill_in' && <FillIn item={item} value={value} disabled={disabled} onAnswer={onAnswer} />}
            {item.type === 'true_false' && <TrueFalse n={item.n} value={value as string} disabled={disabled} onAnswer={onAnswer} />}
            {item.type === 'multiple_choice' && <Choice item={item} value={value} disabled={disabled} onAnswer={onAnswer} />}
            {item.type === 'short_answer' && (
              <textarea value={(value as string) ?? ''} disabled={disabled} onChange={(e) => onAnswer(item.n, e.target.value)} rows={3}
                className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: C.hair, background: C.card, color: C.ink }} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FillIn({ item, value, disabled, onAnswer }: { item: ExItem; value?: AnswerVal; disabled: boolean; onAnswer: (n: number, v: AnswerVal) => void }) {
  const n = item.blanks ?? 1
  const arr = Array.isArray(value) ? value : new Array(n).fill('')
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: n }, (_, i) => (
        <input key={i} value={arr[i] ?? ''} disabled={disabled}
          onChange={(e) => { const next = [...arr]; next[i] = e.target.value; onAnswer(item.n, next) }}
          placeholder={n > 1 ? `blank ${i + 1}` : 'your answer'}
          className="rounded-lg border px-2 py-1 text-sm" style={{ borderColor: C.hair, background: C.card, color: C.ink, minWidth: 120 }} />
      ))}
    </div>
  )
}

function TrueFalse({ n, value, disabled, onAnswer }: { n: number; value?: string; disabled: boolean; onAnswer: (n: number, v: AnswerVal) => void }) {
  return (
    <div className="flex gap-2">
      {['true', 'false'].map((v) => (
        <button key={v} disabled={disabled} onClick={() => onAnswer(n, v)}
          className="rounded-lg border px-3 py-1 text-sm font-medium capitalize"
          style={{ borderColor: C.hair, background: value === v ? 'var(--primary)' : C.card, color: value === v ? 'var(--primary-foreground)' : C.ink }}>{v}</button>
      ))}
    </div>
  )
}

function Choice({ item, value, disabled, onAnswer }: { item: ExItem; value?: AnswerVal; disabled: boolean; onAnswer: (n: number, v: AnswerVal) => void }) {
  const opts = item.options ?? []
  const selected = item.multi ? (Array.isArray(value) ? value : []) : (typeof value === 'string' ? [value] : [])
  const toggle = (letter: string) => {
    if (item.multi) {
      const set = new Set(selected); if (set.has(letter)) set.delete(letter); else set.add(letter)
      onAnswer(item.n, [...set])
    } else onAnswer(item.n, letter)
  }
  return (
    <div className="flex flex-col gap-1.5">
      {opts.map((o) => {
        const on = selected.includes(o.letter)
        return (
          <button key={o.letter} disabled={disabled} onClick={() => toggle(o.letter)}
            className="text-left rounded-lg border px-2.5 py-1.5 text-sm"
            style={{ borderColor: on ? 'var(--primary)' : C.hair, background: on ? 'color-mix(in oklch, var(--primary) 10%, var(--card))' : C.card, color: C.ink }}>
            <span className="font-semibold" style={{ color: 'var(--primary)' }}>{o.letter}.</span> {o.text}
          </button>
        )
      })}
    </div>
  )
}
