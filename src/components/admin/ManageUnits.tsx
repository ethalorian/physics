'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Check, CircleDashed, FileText } from 'lucide-react'

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
  /** 'physics' | 'trades' — which course this unit belongs to (units.program). */
  program?: string | null
  lessons: ManageLesson[]
}

// Both courses number their units from 1, so "Unit 1" alone is ambiguous.
// The list is grouped by program and every card carries a program chip.
const PROGRAMS: { id: string; label: string; color: string; fg: string }[] = [
  { id: 'physics', label: 'Physics', color: 'var(--primary)', fg: 'var(--primary)' },
  { id: 'trades', label: 'Trades', color: 'var(--reward)', fg: 'var(--reward-foreground)' },
]
function programMeta(id: string | null | undefined) {
  return PROGRAMS.find((p) => p.id === id) ?? { id: id ?? 'other', label: id ? id[0].toUpperCase() + id.slice(1) : 'Other', color: 'var(--muted-foreground)', fg: 'var(--muted-foreground)' }
}

function unitStats(u: ManageUnit) {
  const total = u.lessons.length
  const authored = u.lessons.filter((l) => l.blockCount > 0).length
  const drafts = u.lessons.filter((l) => !l.published).length
  const needsBlocks = total - authored
  const pct = total ? Math.round((authored / total) * 100) : 0
  return { total, authored, drafts, needsBlocks, pct }
}

function LessonRow({ l, canPublish }: { l: ManageLesson; canPublish: boolean }) {
  const n = l.blockCount
  const [pub, setPub] = useState(l.published)
  const [busy, setBusy] = useState(false)

  const togglePublish = async () => {
    if (busy || !canPublish) return
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

  const pubStyle: React.CSSProperties = {
    border: `1px solid ${pub ? 'color-mix(in oklch, var(--success) 45%, var(--border))' : 'var(--border)'}`,
    background: pub ? 'color-mix(in oklch, var(--success) 16%, transparent)' : 'transparent',
    color: pub ? 'var(--success)' : 'var(--muted-foreground)',
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
      {canPublish ? (
        <button
          onClick={togglePublish}
          disabled={busy}
          role="switch"
          aria-checked={pub}
          title={pub ? 'Published — click to unpublish (make it a draft)' : 'Draft — click to publish (mark it ready)'}
          className="text-xs font-semibold rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5"
          style={{ ...pubStyle, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}
        >
          <span style={{ width: 8, height: 8, borderRadius: 99, background: pub ? 'var(--success)' : 'var(--muted-foreground)' }} />
          {busy ? 'Saving…' : pub ? 'Published' : 'Publish'}
        </button>
      ) : (
        <span className="text-xs font-semibold rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5" title="Only the super admin can publish" style={pubStyle}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: pub ? 'var(--success)' : 'var(--muted-foreground)' }} />
          {pub ? 'Published' : 'Draft'}
        </span>
      )}
      <Link href={`/admin/lessons/${l.id}/build`} className="text-xs font-semibold rounded-lg px-3 py-1.5" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>Build blocks</Link>
      <Link href={`/lessons/${l.slug}`} target="_blank" className="text-xs font-semibold rounded-lg border px-3 py-1.5" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>Preview</Link>
      <Link href={`/admin/lessons/${l.id}/edit`} className="text-xs font-semibold rounded-lg border px-3 py-1.5" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>Settings</Link>
    </div>
  )
}

function UnitCard({ u, canPublish }: { u: ManageUnit; canPublish: boolean }) {
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
            {u.id !== '__orphans__' && (() => { const pm = programMeta(u.program); return (
              <span className="text-[10px] font-bold uppercase tracking-widest rounded-md px-1.5 py-0.5" style={{ background: `color-mix(in oklch, ${pm.color} 16%, transparent)`, color: pm.fg }}>{pm.label}</span>
            ) })()}
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
          {u.lessons.map((l) => <LessonRow key={l.id} l={l} canPublish={canPublish} />)}
        </div>
      )}
    </div>
  )
}

export default function ManageUnits({ units, orphans, canPublish }: { units: ManageUnit[]; orphans: ManageLesson[]; canPublish: boolean }) {
  // Group by program in a fixed order (physics, trades, then anything else),
  // preserving the server's order_index sort inside each group.
  const groups: { meta: ReturnType<typeof programMeta>; units: ManageUnit[] }[] = []
  const known = PROGRAMS.map((p) => p.id)
  for (const id of [...known, ...Array.from(new Set(units.map((u) => u.program ?? 'other'))).filter((id) => !known.includes(id))]) {
    const inGroup = units.filter((u) => (u.program ?? 'other') === id)
    if (inGroup.length > 0) groups.push({ meta: programMeta(id), units: inGroup })
  }
  return (
    <div>
      {groups.map((g) => (
        <section key={g.meta.id} className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block rounded-full" style={{ width: 8, height: 8, background: g.meta.color }} />
            <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: g.meta.fg }}>{g.meta.label}</h3>
            <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{g.units.length} unit{g.units.length === 1 ? '' : 's'}</span>
          </div>
          {g.units.map((u) => <UnitCard key={u.id} u={u} canPublish={canPublish} />)}
        </section>
      ))}
      {orphans.length > 0 && <UnitCard u={{ id: '__orphans__', name: 'Other lessons', lessons: orphans }} canPublish={canPublish} />}
    </div>
  )
}
