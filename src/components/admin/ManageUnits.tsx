'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Check, CircleDashed, FileText, DoorOpen } from 'lucide-react'

// Collapsible unit list for the admin Manage page. Server fetches + shapes the
// data; this component owns only the open/closed UI state. Units start
// collapsed (teacher's choice) — each header carries enough signal (progress
// bar + counts) to decide what to open without expanding it.

export interface ManageLesson {
  id: string
  slug: string
  title: string
  lessonNumber: number | null
  published: boolean
  blockCount: number
}
export interface ManageUnit {
  id: string
  name: string
  lessons: ManageLesson[]
}

function unitStats(u: ManageUnit) {
  const total = u.lessons.length
  const authored = u.lessons.filter((l) => l.blockCount > 0).length
  const drafts = u.lessons.filter((l) => !l.published).length
  const needsBlocks = total - authored
  const pct = total ? Math.round((authored / total) * 100) : 0
  return { total, authored, drafts, needsBlocks, pct }
}

function LessonRow({ l }: { l: ManageLesson }) {
  const n = l.blockCount
  const [pub, setPub] = useState(l.published)
  const [busy, setBusy] = useState(false)

  const togglePublish = async () => {
    if (busy) return
    const next = !pub
    setBusy(true)
    setPub(next) // optimistic
    const res = await fetch(`/api/lessons/${l.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: next }),
    }).catch(() => null)
    if (!res || !res.ok) setPub(!next) // revert on failure
    setBusy(false)
  }

  const [openMsg, setOpenMsg] = useState<string | null>(null)
  const [openBusy, setOpenBusy] = useState(false)
  const openAll = async (action: 'open' | 'close') => {
    if (openBusy) return
    setOpenBusy(true); setOpenMsg(null)
    const res = await fetch(`/api/lessons/${l.id}/open-all`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    }).then((r) => r.json()).catch(() => null)
    if (res?.ok) setOpenMsg(action === 'open' ? `Opened in ${res.count} class${res.count === 1 ? '' : 'es'} ✓` : `Closed in ${res.count} class${res.count === 1 ? '' : 'es'}`)
    else setOpenMsg('Could not update')
    setOpenBusy(false)
  }

  return (
    <div className="flex items-center gap-3 flex-wrap py-3" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="flex-1 min-w-[12rem]">
        <div className="text-sm font-medium">{l.lessonNumber ? `${l.lessonNumber}. ` : ''}{l.title}</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
          {n > 0
            ? <span style={{ color: 'var(--success)' }}>{n} block{n === 1 ? '' : 's'} authored</span>
            : <span style={{ color: 'var(--destructive)' }}>Needs blocks</span>}
          {!pub && <span> · draft</span>}
        </div>
      </div>
      <button
        onClick={togglePublish}
        disabled={busy}
        role="switch"
        aria-checked={pub}
        title={pub ? 'Published — click to unpublish (make it a draft)' : 'Draft — click to publish (mark it ready)'}
        className="text-xs font-semibold rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5"
        style={{
          border: `1px solid ${pub ? 'color-mix(in oklch, var(--success) 45%, var(--border))' : 'var(--border)'}`,
          background: pub ? 'color-mix(in oklch, var(--success) 16%, transparent)' : 'transparent',
          color: pub ? 'var(--success)' : 'var(--muted-foreground)',
          cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 99, background: pub ? 'var(--success)' : 'var(--muted-foreground)' }} />
        {busy ? 'Saving…' : pub ? 'Published' : 'Publish'}
      </button>
      {pub && (
        openMsg ? (
          <span className="text-xs inline-flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
            {openMsg}
            <button onClick={() => openAll('close')} disabled={openBusy} className="underline" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}>close all</button>
          </span>
        ) : (
          <button onClick={() => openAll('open')} disabled={openBusy}
            title="Open this lesson now for every class you own"
            className="text-xs font-semibold rounded-lg border px-3 py-1.5 inline-flex items-center gap-1.5"
            style={{ borderColor: 'color-mix(in oklch, var(--primary) 45%, var(--border))', color: 'var(--primary)', cursor: openBusy ? 'default' : 'pointer', opacity: openBusy ? 0.6 : 1 }}>
            <DoorOpen size={13} /> {openBusy ? 'Opening…' : 'Open for all classes'}
          </button>
        )
      )}
      <Link href={`/admin/lessons/${l.id}/build`} className="text-xs font-semibold rounded-lg px-3 py-1.5" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>Build blocks</Link>
      <Link href={`/lessons/${l.slug}`} target="_blank" className="text-xs font-semibold rounded-lg border px-3 py-1.5" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>Preview</Link>
      <Link href={`/admin/lessons/${l.id}/edit`} className="text-xs font-semibold rounded-lg border px-3 py-1.5" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>Settings</Link>
    </div>
  )
}

function UnitCard({ u }: { u: ManageUnit }) {
  const [open, setOpen] = useState(false)
  const { total, authored, drafts, needsBlocks, pct } = unitStats(u)
  const complete = needsBlocks === 0 && drafts === 0

  return (
    <div className="rounded-2xl border mb-3" style={{ borderColor: 'var(--border)', background: 'var(--card)', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        <ChevronRight size={18} style={{ color: 'var(--muted-foreground)', transition: 'transform .15s', transform: open ? 'rotate(90deg)' : 'none', flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold truncate">{u.name}</span>
            {complete ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5" style={{ background: 'color-mix(in oklch, var(--success) 14%, transparent)', color: 'var(--success)' }}>
                <Check size={11} /> Complete
              </span>
            ) : (
              <>
                {needsBlocks > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5" style={{ background: 'color-mix(in oklch, var(--destructive) 14%, transparent)', color: 'var(--destructive)' }}>
                    <CircleDashed size={11} /> {needsBlocks} need{needsBlocks === 1 ? 's' : ''} blocks
                  </span>
                )}
                {drafts > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5" style={{ background: 'color-mix(in oklch, var(--reward) 22%, transparent)', color: 'var(--reward-foreground)' }}>
                    <FileText size={11} /> {drafts} draft{drafts === 1 ? '' : 's'}
                  </span>
                )}
              </>
            )}
          </div>
          {/* progress bar — read the unit at a glance without opening it */}
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--secondary)' }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: complete ? 'var(--success)' : 'var(--primary)' }} />
            </div>
            <span className="text-[11px] whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{authored}/{total} authored</span>
          </div>
        </div>
      </button>
      {open && (
        <div className="px-4 pb-2">
          {u.lessons.map((l) => <LessonRow key={l.id} l={l} />)}
        </div>
      )}
    </div>
  )
}

export default function ManageUnits({ units, orphans }: { units: ManageUnit[]; orphans: ManageLesson[] }) {
  return (
    <div>
      {units.map((u) => <UnitCard key={u.id} u={u} />)}
      {orphans.length > 0 && <UnitCard u={{ id: '__orphans__', name: 'Other lessons', lessons: orphans }} />}
    </div>
  )
}
