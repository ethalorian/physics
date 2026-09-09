"use client"

import { useState, useEffect, useMemo, useRef } from 'react'
import { useSession } from 'next-auth/react'
import LessonEditorNav from './LessonEditorNav'
import { LessonStudentPreview } from './AdminLessonPreview'
import type { GlossaryEntry } from '@/components/MathMarkdown'
import { BlockSettingsEditor, QuestionEditor } from './BlockSettingsEditor'
import { BlockDocument, isCaptureBlock, type ContentBlock } from '@/data/content-blocks'
import BlockRenderer from '@/components/blocks/BlockRenderer'
import type { BlockResponseMap } from '@/components/blocks/useBlockResponses'
import PhysicsDiagram from '@/components/blocks/PhysicsDiagram'
import FigureGraph from '@/components/blocks/FigureGraph'
import { PHYSICS_FORMULAS, FORMULA_CATEGORIES, PHYSICS_VARIABLES } from '@/data/physics-reference'

// ---------------------------------------------------------------------------
// Field schema — drives a generic editor for each block type
// ---------------------------------------------------------------------------
import { BLOCK_DEFS, DEF_BY_TYPE, createBlock, validateBlockDocument, type FieldDef } from '@/data/block-registry'
const DAY_TYPES = ['ANCHOR', 'STANDARD', 'LAB', 'WORKSHOP', 'SYNTHESIS', 'TRANSFER']

interface BlockState { id: string; type: string; data: Record<string, unknown> }
interface TermRow { term: string; definition: string; cognate?: string }

const mkId = () => crypto.randomUUID()

function fromDocument(doc: BlockDocument | undefined): BlockState[] {
  const blocks = doc?.blocks ?? []
  return blocks.map((b): BlockState => {
    const { id, type, ...rest } = b as unknown as { id?: string; type: string } & Record<string, unknown>
    return { id: id || mkId(), type, data: rest }
  })
}

const inputStyle = { background: 'var(--card)', color: 'var(--foreground)', borderColor: 'var(--border)' } as const

type BuilderProps = { lessonId: string; lessonTitle: string; lessonSlug: string; initial?: BlockDocument; unitId?: string; day?: number; published?: boolean; targets?: {id:string;slug:string;statement:string}[]; previewDocument?: BlockDocument; glossary?: GlossaryEntry[]; rewardMaps?: import('@/lib/xp-policy').LessonRewardMaps }

export default function LessonBlockBuilder(props: BuilderProps) {
  const { data: session } = useSession()
  return <BuilderSession key={props.lessonId + ":" + (session?.user?.id ?? "anonymous")} {...props} />
}

function BuilderSession({
  lessonId, lessonTitle, initial, unitId, day, published, targets = [], previewDocument, glossary, rewardMaps,
}: BuilderProps) {
  const { data: session } = useSession()
  const [preview, setPreview] = useState(false)
  const [playVersion, setPlayVersion] = useState(0)
  const [dayType, setDayType] = useState<string>(initial?.dayType ?? 'STANDARD')
  const [blocks, setBlocks] = useState<BlockState[]>(fromDocument(initial))
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const doc = useMemo<BlockDocument>(() => ({ schemaVersion: 1, dayType: dayType as BlockDocument['dayType'], blocks: blocks.map((b) => ({ id: b.id, type: b.type, ...(DEF_BY_TYPE.get(b.type)?.capture ? { capture: true } : {}), ...b.data } as ContentBlock)) }), [blocks, dayType])
  const documentJSON = JSON.stringify(doc)
  const [savedJSON, setSavedJSON] = useState(documentJSON)
  const dirty = documentJSON !== savedJSON
  const currentJSON = useRef(documentJSON); currentJSON.current = documentJSON
  const savingRef = useRef(false)
  const [recovery, setRecovery] = useState<BlockDocument | null>(null)
  const recoveryKey = session?.user?.id ? 'lesson-builder:v1:' + session.user.id + ':' + lessonId : null
  useEffect(() => {
    if (!recoveryKey) return
    try {
      const cached = localStorage.getItem(recoveryKey)
      if (cached && cached !== currentJSON.current && validateBlockDocument(JSON.parse(cached)).length === 0) setRecovery(JSON.parse(cached))
    } catch { /* Invalid cached drafts are not restored. */ }
  }, [recoveryKey])
  useEffect(() => {
    if (!dirty || !recoveryKey) return
    try { localStorage.setItem(recoveryKey, documentJSON) } catch { /* Saving to the server is still available. */ }
  }, [dirty, documentJSON, recoveryKey])
  useEffect(() => {
    if (!dirty) return
    const unload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    const navigate = (e: MouseEvent) => {
      const a = (e.target as Element)?.closest?.('a')
      if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || a.getAttribute('href')?.startsWith('#')) return
      if (!window.confirm('You have unsaved lesson changes. Leave this page? Your draft is kept on this browser.')) { e.preventDefault(); e.stopPropagation() }
    }
    window.addEventListener('beforeunload', unload)
    document.addEventListener('click', navigate, true)
    return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', navigate, true) }
  }, [dirty])
  const [sims, setSims] = useState<{ slug: string; title: string }[]>([])
  // Transient UI feedback: which block just changed (pulse) / is leaving (collapse).
  const [flashId, setFlashId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const flash = (id: string) => { setFlashId(id); window.setTimeout(() => setFlashId((c) => (c === id ? null : c)), 850) }

  // ── Canvas: each block renders live & interactive; play state is throwaway ──
  const [viewAs, setViewAs] = useState<'author' | 'cpa' | 'honors'>('author')
  const [saveIssues, setSaveIssues] = useState<{blockId?:string;message:string}[]>([])
  const [moreActivities, setMoreActivities] = useState(false)
  const previewDoc = useMemo(() => ({ ...doc, blocks: doc.blocks.map(b => { const stored = previewDocument?.blocks.find(p => p.type === 'transfer_prompt' && b.type === 'transfer_prompt' && p.masteryTaskSlug === b.masteryTaskSlug); return b.type === 'transfer_prompt' && stored?.type === 'transfer_prompt' ? {...b, task:stored.task} : b }) }), [doc,previewDocument])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [play, setPlay] = useState<BlockResponseMap>({})
  const playSave = (id: string, _type: string, value: unknown) =>
    setPlay((m) => ({ ...m, [id]: { response: value, created_at: new Date().toISOString() } }))

  // ── Drag-to-reorder + clickable outline ──
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const reorder = (srcId: string, destId: string) => setBlocks((prev) => {
    const from = prev.findIndex((b) => b.id === srcId); const to = prev.findIndex((b) => b.id === destId)
    if (from < 0 || to < 0 || from === to) return prev
    const next = prev.slice(); const [moved] = next.splice(from, 1); next.splice(to, 0, moved); return next
  })
  const jumpTo = (id: string) => { document.querySelector(`[data-bid="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); flash(id) }
  const snippetOf = (d: Record<string, unknown>): string => {
    const raw = (d.title ?? d.statement ?? d.prompt ?? (typeof d.markdown === 'string' ? (d.markdown as string).replace(/[#*_`>]/g, '') : '')) as string
    return raw ? raw.trim().slice(0, 30) : ''
  }

  const liveOf = (b: BlockState): ContentBlock => {
    const def = DEF_BY_TYPE.get(b.type)
    return { id: b.id, type: b.type, ...(def?.capture ? { capture: true } : {}), ...b.data } as unknown as ContentBlock
  }
  const seesBlock = (track: 'cpa' | 'honors', b: BlockState) => {
    const g = b.data.visibilityTrack as string | undefined
    return !g || g === track
  }
  // Track identity colors — used on the card rail, the corner badge, the
  // outline chips, and the toggle buttons, so CPA vs Honors reads at a glance.
  const TRACK_UI: Record<'cpa' | 'honors', { label: string; color: string; fg: string }> = {
    cpa: { label: 'CPA only', color: 'var(--success)', fg: 'var(--success)' },
    honors: { label: 'Honors only', color: 'var(--reward)', fg: 'var(--reward-foreground)' },
  }
  const trackOf = (b: BlockState): 'cpa' | 'honors' | undefined => {
    const g = b.data.visibilityTrack as string | undefined
    return g === 'cpa' || g === 'honors' ? g : undefined
  }

  useEffect(() => {
    fetch('/api/simulations')
      .then((r) => r.json())
      .then((d: { simulations?: { slug: string; title: string }[] }) => {
        setSims((d.simulations ?? []).map((s) => ({ slug: s.slug, title: s.title })))
      })
      .catch(() => {})
  }, [])

  const addBlock = (type: string) => {
    const id = mkId()
    setBlocks((prev) => [...prev, ...fromDocument({ schemaVersion: 1, blocks: [createBlock(type, id)] })])
    flash(id)
    // Let it mount, then scroll the new card into view so the add is unmistakable.
    window.setTimeout(() => { document.querySelector(`[data-bid="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, 40)
  }
  const removeBlock = (id: string) => {
    // Play the collapse-out, then actually drop it from state.
    setRemovingId(id)
    setSelectedId((c) => (c === id ? null : c))
    window.setTimeout(() => {
      setBlocks((prev) => prev.filter((b) => b.id !== id))
      setRemovingId((c) => (c === id ? null : c))
    }, 260)
  }
  const setField = (id: string, key: string, value: unknown) =>
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, data: { ...b.data, [key]: value } } : b)))

  const save = async () => {
    if (savingRef.current) return
    const issues = validateBlockDocument(doc, Boolean(published))
    setSaveIssues(issues)
    if (issues.length) { setMsg('Fix the activities listed below before saving.'); return }
    const sent = documentJSON
    savingRef.current = true; setSaving(true); setMsg(null)
    try {
      const res = await fetch(`/api/lessons/${lessonId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content_blocks: JSON.parse(sent) }),
      })
      const result = await res.json().catch(() => ({}))
      if (!res.ok) { setSaveIssues(result.block_issues ?? result.sei_issues ?? []); setMsg(result.error || 'Could not save. Your draft is kept on this browser.'); return }
      setSaveIssues(result.sei_warnings ?? [])
      setSavedJSON(sent)
      if (currentJSON.current === sent && recoveryKey) { try { localStorage.removeItem(recoveryKey) } catch {} }
      setRecovery(null)
    } catch { setMsg('Could not save. Please retry.') } finally { savingRef.current = false; setSaving(false) }
  }

  return (
    <div className="max-w-7xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      <LessonEditorNav lessonId={lessonId} title={lessonTitle} unitId={unitId} day={day} published={published} active="build" />
      <style>{`
        @keyframes bbFlash { 0% { box-shadow: 0 0 0 0 color-mix(in oklch, var(--primary) 70%, transparent); background: color-mix(in oklch, var(--primary) 9%, var(--card)); } 100% { box-shadow: 0 0 0 12px transparent; background: var(--card); } }
        @keyframes bbOut { from { opacity: 1; max-height: 1200px; } to { opacity: 0; transform: translateX(12px); max-height: 0; margin-top: -12px; padding-top: 0; padding-bottom: 0; } }
        @keyframes bbPress { 50% { transform: scale(0.94); } }
        .bb-btn:active { animation: bbPress 0.15s ease; }
      `}</style>
      {/* header */}
      <div className="flex flex-col gap-4 mb-3">
        <div>

          <h2 className="text-xl font-semibold tracking-tight mt-1">Lesson content</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 [&>button]:h-10 [&>button]:shrink-0 [&>button]:whitespace-nowrap [&>button]:rounded-md [&>button]:text-sm [&>button]:font-medium">
          <select aria-label="Lesson day type" value={dayType} onChange={(e) => setDayType(e.target.value)} className="h-10 shrink-0 rounded-md border px-3 text-sm" style={inputStyle}>
            {DAY_TYPES.map((d) => <option key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</option>)}
          </select>
          <span className="order-last w-full text-xs tabular-nums py-1" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }} title="Blocks every track shares · CPA-only · Honors-only">
            {blocks.filter((b) => !trackOf(b)).length} shared
            <span style={{ color: 'var(--success)' }}> · {blocks.filter((b) => trackOf(b) === 'cpa').length} CPA</span>
            <span style={{ color: 'var(--reward-foreground)' }}> · {blocks.filter((b) => trackOf(b) === 'honors').length} Honors</span>
          </span>
          <div className="flex h-10 shrink-0 rounded-md border overflow-hidden" style={{ borderColor: 'var(--border)' }} title="Preview the canvas as a student of this track">
            {(['author', 'cpa', 'honors'] as const).map((v) => {
              const on = viewAs === v
              return (
                <button key={v} onClick={() => setViewAs(v)} aria-pressed={on} className="rounded-none text-sm font-medium px-3"
                  style={{ background: on ? 'var(--primary)' : 'transparent', color: on ? 'var(--primary-foreground)' : 'var(--muted-foreground)' }}>
                  {v === 'author' ? 'Author' : v === 'cpa' ? 'CPA' : 'Honors'}
                </button>
              )
            })}
          </div>
          <button onClick={() => { setPlay({}); setPlayVersion((n) => n + 1) }} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }} title="Clear your play answers">Reset play</button>
          <button type="button" aria-pressed={preview} onClick={() => setPreview((v) => !v)} className="rounded-lg border px-3 py-2 text-sm">{preview ? 'Back to editing' : 'Student preview'}</button>

          <button onClick={save} disabled={saving} className={`${selectedId && !preview ? 'hidden 2xl:inline-flex ' : ''}rounded-lg px-4 py-2 text-sm font-bold`} style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>{saving ? 'Saving…' : 'Save content'}</button>
          <span role={msg ? 'alert' : 'status'} className="text-sm basis-full sm:basis-auto" style={{ color: msg ? 'var(--destructive)' : dirty ? 'var(--foreground)' : 'var(--success)' }}>{msg ?? (saving ? 'Saving this version…' : dirty ? 'Unsaved changes' : 'Content saved ✓')}</span>
        </div>
      </div>
      <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>Select a block to edit it. Use Student preview to try the lesson, then save your changes.</p>

      {recovery && <div role="status" className="mb-4 rounded-xl border p-4 text-sm">
        A recoverable draft is available from this browser.
        <button type="button" className="ml-3 underline" onClick={() => { setBlocks(fromDocument(recovery)); setDayType(recovery.dayType ?? 'STANDARD'); setRecovery(null) }}>Restore draft</button>
        <button type="button" className="ml-3 underline" onClick={() => { if (recoveryKey) localStorage.removeItem(recoveryKey); setRecovery(null) }}>Dismiss</button>
      </div>}
      {saveIssues.length > 0 && <ul className="my-3 space-y-2 rounded-xl border p-3">{saveIssues.map((issue,i) => <li key={i} className="text-sm">{issue.message} {issue.blockId && <button type="button" className="underline" onClick={() => { setPreview(false); setSelectedId(issue.blockId!); window.setTimeout(() => jumpTo(issue.blockId!), 0) }}>Go to activity</button>}</li>)}</ul>}
      {preview ? <div className="rounded-xl border p-3">
        <p className="mb-3 text-sm text-muted-foreground">Try the current content without saving student work.</p>
        <LessonStudentPreview key={playVersion} lesson={{ id: lessonId, title: lessonTitle, content_blocks: previewDoc, key_terms: glossary, targets, rewardMaps }} />
      </div> : <div className={`grid gap-5 items-start grid-cols-1 lg:grid-cols-[minmax(0,1fr)_196px] ${selectedId ? '2xl:grid-cols-[minmax(0,1fr)_196px_360px]' : ''}`}>
        {/* CANVAS — the lesson as students see it, the star */}
        <div className="flex flex-col gap-3">
          {blocks.length === 0 && <p className="text-sm rounded-xl border p-10 text-center" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>No blocks yet — add one from the palette on the right.</p>}
          {blocks.map((b) => {
            const removing = removingId === b.id
            const flashing = flashId === b.id
            const sel = selectedId === b.id
            const hidden = viewAs !== 'author' && !seesBlock(viewAs, b)
            return (
              <div key={`${b.id}:${playVersion}`} data-bid={b.id} className="group relative rounded-xl"
                onClick={() => setSelectedId(b.id)}
                onDragOver={(e) => { if (dragId && dragId !== b.id) { e.preventDefault(); if (overId !== b.id) setOverId(b.id) } }}
                onDrop={(e) => { e.preventDefault(); if (dragId) reorder(dragId, b.id); setDragId(null); setOverId(null) }}
                style={{
                  border: `1px solid ${sel || overId === b.id ? 'var(--primary)' : trackOf(b) ? `color-mix(in oklch, ${TRACK_UI[trackOf(b)!].color} 45%, transparent)` : 'transparent'}`,
                  borderLeft: trackOf(b) ? `4px solid ${TRACK_UI[trackOf(b)!].color}` : undefined,
                  boxShadow: sel ? '0 0 0 1px var(--primary)' : overId === b.id ? '0 -3px 0 0 var(--primary)' : undefined,
                  opacity: dragId === b.id ? 0.4 : hidden ? 0.42 : 1,
                  background: trackOf(b) ? `color-mix(in oklch, ${TRACK_UI[trackOf(b)!].color} 4%, var(--card))` : 'var(--card)', padding: 12, cursor: 'pointer',
                  overflow: removing ? 'hidden' : undefined,
                  animation: removing ? 'bbOut 0.26s ease forwards' : flashing ? 'bbFlash 0.85s ease' : undefined,
                }}>
                {/* hover / selected chrome */}
                <div className={`absolute right-2 top-2 z-10 flex items-center gap-1 rounded-lg border px-1 py-0.5 transition-opacity ${sel ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  style={{ borderColor: 'var(--border)', background: 'var(--card)' }} onClick={(e) => e.stopPropagation()}>
                  <button draggable
                    onDragStart={(e) => { setDragId(b.id); const card = e.currentTarget.closest('[data-bid]') as HTMLElement | null; if (card) e.dataTransfer.setDragImage(card, 16, 16); e.dataTransfer.effectAllowed = 'move' }}
                    onDragEnd={() => { setDragId(null); setOverId(null) }}
                    title="Drag to reorder" aria-label="drag to reorder"
                    className="bb-btn text-base px-1 leading-none" style={{ cursor: 'grab', color: 'var(--muted-foreground)', border: 'none', background: 'none' }}>⠿</button>
                  <div className="flex rounded border overflow-hidden" style={{ borderColor: 'var(--border)' }} title="Who sees this block">
                    {([['All', undefined], ['CPA', 'cpa'], ['Honors', 'honors']] as const).map(([lbl, val]) => {
                      const on = ((b.data.visibilityTrack as string | undefined) ?? undefined) === val
                      const onBg = val === 'cpa' ? 'var(--success)' : val === 'honors' ? 'var(--reward)' : 'var(--primary)'
                      const onFg = val === 'honors' ? 'var(--reward-foreground)' : '#fff'
                      return <button key={lbl} type="button" onClick={() => setField(b.id, 'visibilityTrack', val)} className="text-[10px] font-semibold px-1.5 py-0.5" style={{ background: on ? onBg : 'transparent', color: on ? onFg : 'var(--muted-foreground)' }}>{lbl}</button>
                    })}
                  </div>
                  <button onClick={() => removeBlock(b.id)} className="bb-btn text-sm px-1.5 rounded" style={{ border: 'none', background: 'none', color: 'var(--destructive)' }} aria-label="remove">✕</button>
                </div>
                <BlockRenderer blocks={[liveOf(b)]} lessonId={`play:${lessonId}`} responses={play} save={playSave} />
                {hidden && <div className="absolute left-2 top-2 z-10 text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5" style={{ background: 'var(--card)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}>hidden for {viewAs}</div>}
                {!hidden && trackOf(b) && (
                  <div className="absolute left-2 top-2 z-10 text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5"
                    style={{ background: `color-mix(in oklch, ${TRACK_UI[trackOf(b)!].color} 18%, var(--card))`, color: TRACK_UI[trackOf(b)!].fg, border: `1px solid color-mix(in oklch, ${TRACK_UI[trackOf(b)!].color} 50%, transparent)` }}>
                    {TRACK_UI[trackOf(b)!].label}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* RIGHT RAIL — outline + palette */}
        <div className="lg:sticky lg:top-20 flex flex-col gap-3" style={{ maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto' }}>
          <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>Outline · {blocks.length}</div>
            {blocks.length === 0
              ? <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No blocks yet.</p>
              : <ol className="flex flex-col gap-0.5">
                  {blocks.map((b, i) => {
                    const def = DEF_BY_TYPE.get(b.type); const snip = snippetOf(b.data); const ht = b.data.visibilityTrack as string | undefined
                    const sel = selectedId === b.id
                    return (
                      <li key={b.id}>
                        <button onClick={() => { setSelectedId(b.id); jumpTo(b.id) }} className="w-full text-left text-xs rounded px-1.5 py-1 flex items-center gap-1.5"
                          style={{ background: sel ? 'color-mix(in oklch, var(--primary) 16%, transparent)' : flashId === b.id ? 'color-mix(in oklch, var(--primary) 10%, transparent)' : 'transparent', border: 'none', cursor: 'pointer', color: 'var(--foreground)' }}>
                          <span style={{ color: 'var(--muted-foreground)', minWidth: 14 }}>{i + 1}</span>
                          <span className="truncate flex-1"><span style={{ fontWeight: 600 }}>{def?.label ?? b.type}</span>{snip && <span style={{ color: 'var(--muted-foreground)' }}> · {snip}</span>}</span>
                          {ht === 'honors' && <span title="Honors only" className="rounded px-1" style={{ background: 'color-mix(in oklch, var(--reward) 22%, transparent)', color: 'var(--reward-foreground)', fontWeight: 700 }}>H</span>}
                          {ht === 'cpa' && <span title="CPA only" className="rounded px-1" style={{ background: 'color-mix(in oklch, var(--success) 22%, transparent)', color: 'var(--success)', fontWeight: 700 }}>C</span>}
                        </button>
                      </li>
                    )
                  })}
                </ol>}
          </div>
          <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>Add an activity</div><button type="button" className="my-2 min-h-11 w-full rounded-lg border p-2 text-left text-sm" onClick={() => { const next = ['prose','question','exit_ticket'].map(type => createBlock(type, mkId())); setBlocks(old => [...old,...fromDocument({schemaVersion:1,blocks:next})]); }}>+ Reading, checkpoint &amp; exit ticket starter</button><button type="button" className="min-h-11 text-sm underline" onClick={() => setMoreActivities(v => !v)}>{moreActivities ? 'Common activities' : 'More activities'}</button>
            {(['Teach', 'Practice'] as const).map((group) => (
              <div key={group} className="mb-3">
                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--muted-foreground)' }}>{group}</div>
                <div className="flex flex-col gap-1.5">
                  {BLOCK_DEFS.filter((d) => d.group === group && (moreActivities || ['prose','question','exit_ticket','image','sketch'].includes(d.type))).map((d) => (
                    <button key={d.type} onClick={() => addBlock(d.type)} className="bb-btn text-left text-sm rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>+ {d.label}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SIDE PANEL — edit the selected block */}
        {selectedId && (() => {
          const b = blocks.find((x) => x.id === selectedId)
          if (!b) return null
          const def = DEF_BY_TYPE.get(b.type)
          return (
            <div role="dialog" aria-label="Edit block" className="fixed inset-x-3 top-3 bottom-3 z-50 overflow-y-auto rounded-xl border bg-background shadow-xl sm:left-auto sm:w-[360px] 2xl:sticky 2xl:top-20 2xl:bottom-auto 2xl:z-auto 2xl:w-auto 2xl:shadow-none" style={{ borderColor: 'var(--primary)', background: 'var(--card)', maxHeight: 'calc(100vh - 6rem)', overflowY: 'auto' }}>
              <div className="flex items-center justify-between gap-2 p-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="text-sm font-bold truncate">Edit · {def?.label ?? b.type}{def?.capture ? <span className="ml-1.5 text-xs font-semibold" style={{ color: 'var(--reward-foreground)' }}>captures work</span> : null}</span>
                <button onClick={() => setSelectedId(null)} className="bb-btn text-sm px-2 rounded" style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)' }} aria-label="close editor">✕</button>
              </div>
              <div className="2xl:hidden border-b p-3 space-y-2">
                <button type="button" onClick={save} disabled={saving} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">{saving ? 'Saving…' : 'Save content'}</button>
                <p role="status" className="text-sm">{msg ?? (saving ? 'Saving this version…' : dirty ? 'Unsaved changes' : 'Content saved ✓')}</p>
              </div>
              <div className="p-3 flex flex-col gap-3">
                <div>
                  <div className="text-xs font-semibold mb-1" style={{ color: 'var(--muted-foreground)' }}>Who sees this block</div>
                  <div className="flex rounded-md border overflow-hidden w-max" style={{ borderColor: 'var(--border)' }}>
                    {([['All tracks', undefined], ['CPA only', 'cpa'], ['Honors only', 'honors']] as const).map(([lbl, val]) => {
                      const on = ((b.data.visibilityTrack as string | undefined) ?? undefined) === val
                      const onBg = val === 'cpa' ? 'var(--success)' : val === 'honors' ? 'var(--reward)' : 'var(--primary)'
                      const onFg = val === 'honors' ? 'var(--reward-foreground)' : '#fff'
                      return <button key={lbl} type="button" onClick={() => setField(b.id, 'visibilityTrack', val)} className="text-xs font-semibold px-2.5 py-1" style={{ background: on ? onBg : 'transparent', color: on ? onFg : 'var(--muted-foreground)' }}>{lbl}</button>
                    })}
                  </div>
                </div>
                <BlockSettingsEditor targets={targets} data={b.data} capture={isCaptureBlock(liveOf(b))} onPatch={(patch) => Object.entries(patch).forEach(([k, v]) => setField(b.id, k, v))} />
                {(def?.fields ?? []).length === 0
                  ? <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>This block has no editable fields.</p>
                  : (def?.fields ?? []).map((f) => (
                      <FieldEditor key={f.key} field={f} value={b.data[f.key]} sims={sims} blockType={b.type} blockData={b.data}
                        onChange={(v) => setField(b.id, f.key, v)}
                        onPatch={(patch) => Object.entries(patch).forEach(([k, v]) => setField(b.id, k, v))} />
                    ))}
                <button onClick={() => removeBlock(b.id)} className="mt-1 text-xs font-semibold rounded-lg border px-3 py-2 self-start" style={{ borderColor: 'color-mix(in oklch, var(--destructive) 40%, var(--border))', color: 'var(--destructive)', background: 'transparent' }}>Delete block</button>
              </div>
            </div>
          )
        })()}
      </div>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Field editors
// ---------------------------------------------------------------------------
// Image field: paste a URL OR upload a file to the lesson-media bucket. On a
// successful upload we drop the returned public URL straight into the field.
function ImageUploadField({ value, placeholder, onChange }: { value: string; placeholder?: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const upload = async (file: File) => {
    setBusy(true); setErr(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'figures')
      const res = await fetch('/api/media/upload', { method: 'POST', body: fd })
      const d = await res.json()
      if (!res.ok) { setErr(d.error || 'Upload failed'); return }
      onChange(d.url)
    } catch {
      setErr('Could not upload the file')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="flex-1 rounded-lg border p-2 text-sm" style={inputStyle} />
        <label className="text-xs font-semibold rounded-lg border px-3 py-2 whitespace-nowrap" style={{ borderColor: 'var(--border)', color: 'var(--primary)', background: 'color-mix(in oklch, var(--primary) 8%, transparent)', cursor: busy ? 'default' : 'pointer' }}>
          {busy ? 'Uploading…' : 'Upload'}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" disabled={busy}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }} style={{ display: 'none' }} />
        </label>
      </div>
      {err && <div className="text-xs mt-1" style={{ color: 'var(--destructive)' }}>{err}</div>}
      {value && !err && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" style={{ marginTop: 8, maxHeight: 120, borderRadius: 8, border: '1px solid var(--border)' }} />
      )}
    </div>
  )
}

function FieldEditor({ field, value, onChange, sims, blockType, blockData, onPatch }: {
  field: FieldDef; value: unknown; onChange: (v: unknown) => void;
  sims?: { slug: string; title: string }[];
  blockType?: string; blockData?: Record<string, unknown>; onPatch?: (patch: Record<string, unknown>) => void;
}) {
  const label = <div className="text-xs font-semibold mb-1" style={{ color: 'var(--secondary-foreground)' }}>{field.label}</div>

  if (field.kind === 'question') return <QuestionEditor value={value} onChange={onChange} />
  if (field.kind === 'numberlist') return <NumberListEditor key={field.key} label={field.label} value={value} onChange={onChange} />
  if (field.kind === 'visualgen') {
    return (
      <div>{label}
        <VisualGenField
          prompt={String(value ?? '')}
          placeholder={field.placeholder}
          target={blockType === 'graph' ? 'graph' : 'diagram'}
          diagramKind={String(blockData?.kind ?? 'free_body')}
          data={blockData ?? {}}
          onPromptChange={(p) => onChange(p)}
          onPatch={(patch) => onPatch?.(patch)}
        />
      </div>
    )
  }

  if (field.kind === 'imageupload') {
    return <div>{label}<ImageUploadField value={String(value ?? '')} placeholder={field.placeholder} onChange={(v) => onChange(v)} /></div>
  }

  if (field.kind === 'simref') {
    const cur = String(value ?? '')
    const list = sims ?? []
    return (
      <div>{label}
        <select value={cur} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border p-2 text-sm" style={inputStyle}>
          <option value="">Choose a simulation…</option>
          {cur && !list.some((s) => s.slug === cur) && <option value={cur}>{cur} (current)</option>}
          {list.map((s) => <option key={s.slug} value={s.slug}>{s.title}</option>)}
        </select>
      </div>
    )
  }

  if (field.kind === 'textarea') {
    return <div>{label}<textarea value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full rounded-lg border p-2 text-sm" style={inputStyle} /></div>
  }
  if (field.kind === 'number') {
    return <div>{label}<input type="number" value={value == null ? '' : String(value)} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} className="w-full rounded-lg border p-2 text-sm" style={inputStyle} /></div>
  }
  if (field.kind === 'select') {
    return <div>{label}<select value={String(value ?? field.options?.[0] ?? '')} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border p-2 text-sm" style={inputStyle}>{(field.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}</select></div>
  }
  if (field.kind === 'solvefor') {
    return (
      <div>{label}
        <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value || undefined)} className="w-full rounded-lg border p-2 text-sm" style={inputStyle}>
          <option value="">(auto — the formula&apos;s own subject)</option>
          {PHYSICS_VARIABLES.map((v) => <option key={v.symbol} value={v.symbol}>{v.symbol} — {v.name}{v.unit ? ` (${v.unit})` : ''}</option>)}
        </select>
      </div>
    )
  }
  if (field.kind === 'formulapicker') {
    const ids = Array.isArray(value) ? (value as string[]) : []
    const toggle = (id: string) => onChange(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])
    return (
      <div>{label}
        <p className="text-[11px] mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Check the formulas relevant to this unit — only those appear in the student&apos;s bank. Leave all unchecked to show every formula.</p>
        <div className="flex flex-col gap-2">
          {FORMULA_CATEGORIES.map((cat) => (
            <div key={cat}>
              <div className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--primary)' }}>{cat}</div>
              <div className="flex flex-wrap gap-1.5">
                {PHYSICS_FORMULAS.filter((f) => f.category === cat).map((f) => {
                  const on = ids.includes(f.id)
                  return (
                    <button key={f.id} type="button" onClick={() => toggle(f.id)} title={f.name} className="rounded-md px-2 py-1 text-xs"
                      style={{ border: `1px solid ${on ? 'var(--primary)' : 'var(--border)'}`, background: on ? 'color-mix(in oklch, var(--primary) 14%, var(--card))' : 'var(--card)', color: 'var(--foreground)', fontFamily: 'Georgia, serif' }}>
                      {on ? '✓ ' : ''}{f.display}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  if (field.kind === 'toggle') {
    return (
      <label className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--secondary-foreground)', cursor: 'pointer' }}>
        <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
        {field.label}
      </label>
    )
  }
  if (field.kind === 'svggen') {
    return <div>{label}<SvgGenField value={String(value ?? '')} onChange={(v) => onChange(v || undefined)} /></div>
  }
  if (field.kind === 'stringlist') {
    const list = Array.isArray(value) ? (value as string[]) : []
    return (
      <div>{label}
        <div className="flex flex-col gap-1.5">
          {list.map((item, i) => (
            <div key={i} className="flex gap-1.5">
              <input value={item} onChange={(e) => { const next = list.slice(); next[i] = e.target.value; onChange(next) }} className="flex-1 rounded-lg border p-2 text-sm" style={inputStyle} />
              <button onClick={() => onChange(list.filter((_, j) => j !== i))} className="px-2 rounded" style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>✕</button>
            </div>
          ))}
        </div>
        <button onClick={() => onChange([...list, ''])} className="mt-1.5 text-xs font-semibold rounded-lg border px-3 py-1.5" style={{ borderColor: 'var(--border)', color: 'var(--primary)', borderStyle: 'dashed' }}>+ Add item</button>
      </div>
    )
  }
  if (field.kind === 'terms') {
    const terms = Array.isArray(value) ? (value as TermRow[]) : []
    const setTerm = (i: number, patch: Partial<TermRow>) => { const next = terms.map((t, j) => (j === i ? { ...t, ...patch } : t)); onChange(next) }
    return (
      <div>{label}
        <div className="flex flex-col gap-2">
          {terms.map((t, i) => (
            <div key={i} className="rounded-lg border p-2" style={{ borderColor: 'var(--border)' }}>
              <div className="flex gap-1.5 mb-1.5">
                <input value={t.term ?? ''} onChange={(e) => setTerm(i, { term: e.target.value })} placeholder="term" className="flex-1 rounded border p-1.5 text-sm" style={inputStyle} />
                <input value={t.cognate ?? ''} onChange={(e) => setTerm(i, { cognate: e.target.value })} placeholder="cognate (optional)" className="rounded border p-1.5 text-sm" style={{ ...inputStyle, width: 150 }} />
                <button onClick={() => onChange(terms.filter((_, j) => j !== i))} className="px-2 rounded" style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>✕</button>
              </div>
              <input value={t.definition ?? ''} onChange={(e) => setTerm(i, { definition: e.target.value })} placeholder="definition" className="w-full rounded border p-1.5 text-sm" style={inputStyle} />
            </div>
          ))}
        </div>
        <button onClick={() => onChange([...terms, { term: '', definition: '' }])} className="mt-1.5 text-xs font-semibold rounded-lg border px-3 py-1.5" style={{ borderColor: 'var(--border)', color: 'var(--primary)', borderStyle: 'dashed' }}>+ Add term</button>
      </div>
    )
  }
  // text
  return <div>{label}<input value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} className="w-full rounded-lg border p-2 text-sm" style={inputStyle} /></div>
}

// ---------------------------------------------------------------------------
// Visual generator — describe a diagram/graph in plain English, Claude builds
// the structured data, and a live preview renders right here. No JSON.
// ---------------------------------------------------------------------------
// Generate (or paste) a faint, traceable SVG that sits behind a sketch canvas —
// e.g. a race-track oval the student traces to show distance vs. displacement.
function SvgGenField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const generate = async () => {
    if (!prompt.trim()) { setErr('Describe what to trace over first.'); return }
    setBusy(true); setErr(null)
    try {
      const res = await fetch('/api/blocks/generate-visual', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'scaffold', prompt }),
      })
      const j = await res.json()
      if (!res.ok) { setErr(j.error || 'Could not generate'); return }
      if (typeof j.block?.scaffoldSvg === 'string') onChange(j.block.scaffoldSvg)
      else setErr('No SVG returned')
    } catch { setErr('Could not generate') } finally { setBusy(false) }
  }
  return (
    <div>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2}
        placeholder="Describe a faint drawing to trace over — e.g. “an oval race track seen from above with a start/finish line at the top”"
        className="w-full rounded-lg border p-2 text-sm" style={inputStyle} />
      <div className="flex items-center gap-2 mt-1.5">
        <button onClick={generate} disabled={busy} className="text-xs font-bold rounded-lg px-3 py-1.5" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', opacity: busy ? 0.6 : 1 }}>
          {busy ? 'Drawing…' : (value ? 'Regenerate SVG' : 'Generate SVG')}
        </button>
        {value && <button onClick={() => onChange('')} className="text-xs rounded-lg border px-2 py-1.5" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>Clear</button>}
        {err && <span className="text-xs" style={{ color: 'var(--destructive)' }}>{err}</span>}
        {!err && value && <span className="text-xs" style={{ color: 'var(--success)' }}>Set ✓ — students trace over this.</span>}
      </div>
      {value && (
        <div className="mt-2 rounded-lg border" style={{ borderColor: 'var(--border)', maxWidth: 360, aspectRatio: '16 / 9', overflow: 'hidden', background: '#fff' }} dangerouslySetInnerHTML={{ __html: value }} />
      )}
      <details className="mt-2">
        <summary className="text-xs" style={{ color: 'var(--muted-foreground)', cursor: 'pointer' }}>or paste your own SVG</summary>
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} placeholder="<svg …>…</svg>" className="w-full rounded-lg border p-2 text-xs mt-1" style={{ ...inputStyle, fontFamily: 'monospace' }} />
      </details>
    </div>
  )
}

function VisualGenField({
  prompt, placeholder, target, diagramKind, data, onPromptChange, onPatch,
}: {
  prompt: string
  placeholder?: string
  target: 'diagram' | 'graph'
  diagramKind: string
  data: Record<string, unknown>
  onPromptChange: (p: string) => void
  onPatch: (patch: Record<string, unknown>) => void
}) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const generate = async () => {
    if (!prompt.trim()) { setErr('Describe the visual first.'); return }
    setBusy(true); setErr(null)
    try {
      const res = await fetch('/api/blocks/generate-visual', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, diagramKind, prompt }),
      })
      const j = await res.json()
      if (!res.ok) { setErr(j.error || 'Could not generate'); return }
      onPatch((j.block ?? {}) as Record<string, unknown>)
    } catch { setErr('Could not generate') } finally { setBusy(false) }
  }

  // live preview from whatever structured data is on the block now
  const forces = Array.isArray(data.forces) ? (data.forces as Parameters<typeof PhysicsDiagram>[0]['forces']) : undefined
  const vectors = Array.isArray(data.vectors) ? (data.vectors as Parameters<typeof PhysicsDiagram>[0]['vectors']) : undefined
  const dots = Array.isArray(data.dots) ? (data.dots as number[]) : undefined
  const components = Array.isArray(data.components) ? (data.components as Parameters<typeof PhysicsDiagram>[0]['components']) : undefined
  const links = Array.isArray(data.links) ? (data.links as Parameters<typeof PhysicsDiagram>[0]['links']) : undefined
  const hasFrictionMags = typeof data.leftMag === 'number' && typeof data.rightMag === 'number'
  const series = Array.isArray(data.series) ? (data.series as Parameters<typeof FigureGraph>[0]['series']) : undefined
  const hasDiagram = !!(forces?.length || vectors?.length || dots?.length || components?.length || links?.length || hasFrictionMags)
  const hasGraph = !!series?.length

  return (
    <div>
      <textarea
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-lg border p-2 text-sm"
        style={inputStyle}
      />
      <div className="flex items-center gap-2 mt-1.5">
        <button
          onClick={generate}
          disabled={busy}
          className="text-xs font-bold rounded-lg px-3 py-1.5"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', opacity: busy ? 0.6 : 1 }}
        >
          {busy ? 'Building…' : (hasDiagram || hasGraph ? 'Regenerate' : 'Generate')}
        </button>
        {err && <span className="text-xs" style={{ color: 'var(--destructive)' }}>{err}</span>}
        {!err && (hasDiagram || hasGraph) && <span className="text-xs" style={{ color: 'var(--success)' }}>Built ✓ — edit the prompt and regenerate, or tweak the title below.</span>}
      </div>
      {(hasDiagram || hasGraph) && (
        <div className="mt-2 rounded-lg border p-2" style={{ borderColor: 'var(--border)' }}>
          <div className="text-xs font-semibold mb-1" style={{ color: 'var(--muted-foreground)' }}>Preview</div>
          {target === 'diagram' && hasDiagram && (
            <PhysicsDiagram
              kind={(data.kind as 'free_body' | 'vectors' | 'motion_map' | 'circuit' | 'energy_chain' | 'friction_asymmetry') ?? 'free_body'}
              title={typeof data.title === 'string' ? data.title : undefined}
              caption={typeof data.caption === 'string' ? data.caption : undefined}
              forces={forces}
              vectors={vectors}
              dots={dots}
              showResultant={data.showResultant === true}
              components={Array.isArray(data.components) ? (data.components as Parameters<typeof PhysicsDiagram>[0]['components']) : undefined}
              links={Array.isArray(data.links) ? (data.links as Parameters<typeof PhysicsDiagram>[0]['links']) : undefined}
              leftMag={typeof data.leftMag === 'number' ? data.leftMag : undefined}
              rightMag={typeof data.rightMag === 'number' ? data.rightMag : undefined}
              veerDir={data.veerDir === 'left' || data.veerDir === 'right' ? data.veerDir : undefined}
            />
          )}
          {target === 'graph' && hasGraph && (
            <FigureGraph
              title={typeof data.title === 'string' ? data.title : undefined}
              xLabel={typeof data.xLabel === 'string' ? data.xLabel : undefined}
              yLabel={typeof data.yLabel === 'string' ? data.yLabel : undefined}
              series={series!}
            />
          )}
        </div>
      )}
    </div>
  )
}

function NumberListEditor({ label, value, onChange }: { label: string; value: unknown; onChange: (value: number[]) => void }) {
  const numbers = Array.isArray(value) ? value as number[] : []
  return <fieldset className="space-y-2"><legend className="text-xs font-semibold">{label}</legend>{numbers.map((number, index) => <div key={index} className="flex gap-2"><input type="number" min={1} step={1} aria-label={label + ' ' + (index + 1)} value={number} className="min-w-0 flex-1 rounded-md border p-2" onChange={(event) => { const next = Number(event.target.value); if (Number.isInteger(next) && next > 0) onChange(numbers.map((n, i) => i === index ? next : n)) }} /><button type="button" className="text-sm underline" onClick={() => onChange(numbers.filter((_, i) => i !== index))}>Remove</button></div>)}<button type="button" className="text-sm underline" onClick={() => onChange([...numbers, (numbers[numbers.length - 1] ?? 0) + 1])}>Add problem number</button></fieldset>
}
