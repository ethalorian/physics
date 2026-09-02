"use client"

// Workshop — the admin curriculum studio (Workshop.dc.html): Shelf of units →
// Unit board → Target workbench. Reviews are approved through the existing
// /api/admin/reviews gate; generation through /api/admin/reviews/generate.
// Admin-only: this is where curriculum is SHAPED, not taught. Lessons are
// created by the seed scripts (scripts/seed-*.ts), never from inside the app. The server gate
// lives in app/admin/workshop/page.tsx (same pattern as /admin/collaborators).

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { FlaskConical, Hammer, ArrowRight, Check } from 'lucide-react'

interface ShelfRow { id: string; name: string; published: number; drafts: number; targets: number; covered: number; pending: number; questions: number; teachingSections: string[]; status: string }
interface ShelfData { shelf: ShelfRow[]; gap: { unitId: string; unitName: string; missing: number } | null; desk: number; year: { published: number; lessons: number; covered: number; targets: number } }
interface UnitLesson { id: string; number: number | null; title: string; published: boolean; blockCount: number; exitTickets: number; honorsBlocks: number; track: string | null; openIn: string[] }
interface UnitTarget { id: string; slug: string; statement: string; approved: boolean; pending: number; avg: number | null; rated: number }
interface UnitData { unit: { id: string; name: string } | null; teachingSections: string[]; lessons: UnitLesson[]; targets: UnitTarget[] }
interface TargetData {
  target: { id: string; slug: string; statement: string }
  sections: { label: string; teacher: string; avg: number; n: number }[]
  evidence: number; approvedCount: number; approvedQuestions: number
  pending: { id: string; title: string; questions: number }[]
}

const bandColor = (v: number | null) => v === null ? 'var(--muted-foreground)' : v >= 2.45 ? 'var(--success)' : v >= 1.7 ? 'var(--reward-foreground)' : 'var(--destructive)'

export default function WorkshopStudio() {
  const [shelf, setShelf] = useState<ShelfData | null>(null)
  const [unit, setUnit] = useState<UnitData | null>(null)
  const [target, setTarget] = useState<TargetData | null>(null)
  const [view, setView] = useState<'shelf' | 'unit' | 'target'>('shelf')
  const [flash, setFlash] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const toast = (m: string) => { setFlash(m); setTimeout(() => setFlash(null), 3000) }
  const loadShelf = useCallback(() => {
    fetch('/api/admin/workshop').then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) setShelf(d) }).catch(() => {})
  }, [])
  useEffect(() => { loadShelf() }, [loadShelf])

  const openUnit = (id: string) => {
    setView('unit'); setUnit(null)
    fetch(`/api/admin/workshop?unit=${id}`).then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) setUnit(d) }).catch(() => {})
  }
  const openTarget = (id: string) => {
    setView('target'); setTarget(null)
    fetch(`/api/admin/workshop?target=${id}`).then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) setTarget(d) }).catch(() => {})
  }
  const approve = async (id: string) => {
    setBusy(true)
    await fetch('/api/admin/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, decision: 'approve' }) }).catch(() => {})
    setBusy(false)
    toast('Approved — live app-wide for students')
    if (target) openTarget(target.target.id)
    loadShelf()
  }
  const generate = async () => {
    if (!target) return
    setBusy(true)
    toast('Generating a review from this target…')
    const res = await fetch('/api/admin/reviews/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target_id: target.target.id }) }).catch(() => null)
    setBusy(false)
    if (res?.ok) { toast('Generated — awaiting your approval below'); openTarget(target.target.id) }
    else toast('Generation failed — try again')
  }

  const covBar = (covered: number, total: number, pending: number) => {
    const pct = total ? (covered / total) * 100 : 0
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: 'var(--secondary)' }}>
          <div style={{ width: `${pct}%`, height: '100%', borderRadius: 9999, background: pct >= 99 ? 'var(--success)' : 'var(--reward)' }} />
        </div>
        <span className="text-xs whitespace-nowrap tabular-nums" style={{ color: pending ? 'var(--reward-foreground)' : 'var(--muted-foreground)', fontWeight: pending ? 700 : 400 }}>
          {covered}/{total}{pending ? ` · ${pending} pending` : ''}
        </span>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      {/* header */}
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <button onClick={() => setView('shelf')} className="flex items-center gap-2.5" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--foreground)' }}>
          <span className="grid place-items-center" style={{ width: 34, height: 34, borderRadius: 10, background: 'color-mix(in oklch, var(--primary) 14%, transparent)', color: 'var(--primary)' }}><Hammer size={17} /></span>
          <span className="text-lg font-bold">Workshop</span>
        </button>
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Admin · curriculum studio</span>
        <div className="ml-auto flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5" style={{ border: '1px solid var(--border)', background: 'var(--card)' }}>
            Desk <b style={{ color: shelf?.desk ? 'var(--destructive)' : 'var(--muted-foreground)' }}>{shelf?.desk ?? 0}</b>
          </span>
          <Link href="/admin/dashboard" className="text-sm font-semibold rounded-lg px-3.5 py-2" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>Lessons &amp; builder →</Link>
        </div>
      </div>

      {flash && <div className="fixed left-1/2 -translate-x-1/2 rounded-xl px-5 py-2.5 text-sm font-medium" style={{ bottom: 40, background: 'var(--foreground)', color: 'var(--background)', zIndex: 60, boxShadow: '0 8px 30px color-mix(in oklch, var(--primary) 30%, transparent)' }}>{flash}</div>}

      {/* ============ SHELF ============ */}
      {view === 'shelf' && (
        <div className="flex flex-col gap-2.5">
          {shelf?.gap && (
            <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ border: '1px solid color-mix(in oklch, var(--reward) 45%, var(--border))', background: 'color-mix(in oklch, var(--reward) 7%, transparent)' }}>
              <span className="text-sm flex-1"><b>Next gap:</b> {shelf.gap.unitName} has fewer published lessons than targets — {shelf.gap.missing} short. Lessons are seeded from the scripts, then shaped here — seed before your fastest section arrives.</span>
              <button onClick={() => openUnit(shelf.gap!.unitId)} className="text-xs font-bold rounded-lg px-3.5 py-2" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}>Open {shelf.gap.unitName.split('·')[0].trim()} →</button>
            </div>
          )}
          <div className="grid gap-3.5 px-4 pt-1 text-[10.5px] font-bold uppercase tracking-widest" style={{ gridTemplateColumns: '1.5fr 1fr 1.3fr 0.7fr auto', color: 'var(--muted-foreground)' }}>
            <span>Unit</span><span>Lessons</span><span>Review coverage</span><span>Questions</span><span></span>
          </div>
          {!shelf && <p className="text-sm px-4" style={{ color: 'var(--muted-foreground)' }}>Loading the shelf…</p>}
          {shelf?.shelf.map((u) => {
            const teaching = u.status === 'teaching'
            return (
              <button key={u.id} onClick={() => openUnit(u.id)} className="grid gap-3.5 items-center rounded-xl border px-4 py-3 text-left"
                style={{
                  gridTemplateColumns: '1.5fr 1fr 1.3fr 0.7fr auto', cursor: 'pointer',
                  borderColor: teaching ? 'var(--primary)' : u.status === 'building' ? 'color-mix(in oklch, var(--reward) 40%, var(--border))' : 'var(--border)',
                  borderWidth: teaching ? 1.5 : 1,
                  background: teaching ? 'radial-gradient(120% 200% at 95% -40%, color-mix(in oklch, var(--primary) 9%, transparent), transparent 55%), var(--card)' : 'var(--card)',
                  opacity: u.status === 'complete' ? 0.75 : 1,
                }}>
                <div>
                  <div className="text-sm font-bold">{u.name}</div>
                  <div className="text-[11.5px] font-semibold mt-0.5" style={{ color: teaching ? 'var(--primary)' : u.status === 'complete' ? 'var(--success)' : u.status === 'building' ? 'var(--reward-foreground)' : 'var(--muted-foreground)' }}>
                    {teaching ? `● teaching now · ${u.teachingSections.join(' · ')}` : u.status === 'complete' ? '✓ complete' : u.status === 'building' ? `◐ ${Math.max(0, u.targets - u.published)} lessons short` : '○ outline'}
                  </div>
                </div>
                <span className="text-sm" style={{ color: 'var(--foreground)' }}>{u.published} published{u.drafts ? <span style={{ color: 'var(--reward-foreground)', fontWeight: 600 }}> · {u.drafts} draft{u.drafts > 1 ? 's' : ''}</span> : ''}</span>
                {covBar(u.covered, u.targets, u.pending)}
                <span className="text-sm tabular-nums" style={{ color: 'var(--muted-foreground)' }}>{u.questions}</span>
                <span className="text-sm font-semibold inline-flex items-center gap-1" style={{ color: 'var(--primary)' }}>Open <ArrowRight size={13} /></span>
              </button>
            )
          })}
        </div>
      )}

      {/* ============ UNIT BOARD ============ */}
      {view === 'unit' && (
        <div>
          <div className="flex items-center gap-3 mb-3.5 flex-wrap">
            <button onClick={() => setView('shelf')} className="text-sm" style={{ color: 'var(--muted-foreground)', border: 'none', background: 'transparent', cursor: 'pointer' }}>← Workshop /</button>
            <span className="text-[15px] font-bold">{unit?.unit?.name ?? '…'}</span>
            {(unit?.teachingSections.length ?? 0) > 0 && (
              <span className="ml-auto text-xs" style={{ color: 'var(--muted-foreground)' }}>Teaching now: <b style={{ color: 'var(--primary)' }}>{unit?.teachingSections.join(' · ')}</b></span>
            )}
          </div>
          {!unit && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading the unit…</p>}
          {unit && (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'minmax(0,1fr) 330px' }}>
              <div className="flex flex-col gap-2">
                {unit.lessons.map((l) => (
                  <div key={l.id} className="flex items-center gap-3 rounded-xl border px-4 py-3" style={{ borderColor: l.published ? 'var(--border)' : 'color-mix(in oklch, var(--primary) 40%, var(--border))', background: l.published ? 'var(--card)' : 'color-mix(in oklch, var(--primary) 4%, var(--card))' }}>
                    <span className="text-xs font-bold shrink-0" style={{ width: 32, color: 'var(--muted-foreground)' }}>{l.number ?? '—'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{l.title}</div>
                      <div className="text-[11.5px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                        {l.blockCount} blocks{l.exitTickets ? ` · ${l.exitTickets} exit ticket${l.exitTickets > 1 ? 's' : ''}` : ''}{l.honorsBlocks ? ' · honors layer ✓' : ''}
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold rounded-full px-2.5 py-0.5 shrink-0" style={{
                      color: l.published ? 'var(--success)' : 'var(--primary)',
                      background: l.published ? 'color-mix(in oklch, var(--success) 12%, transparent)' : 'color-mix(in oklch, var(--primary) 12%, transparent)',
                    }}>{l.published ? 'published' : 'draft'}</span>
                    <span className="text-[11.5px] shrink-0" style={{ color: l.openIn.length ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                      {l.openIn.length ? <>open: <b>{l.openIn.slice(0, 2).join(' · ')}</b>{l.openIn.length > 2 ? ` +${l.openIn.length - 2}` : ''}</> : 'closed everywhere'}
                    </span>
                    <Link href={`/admin/lessons/${l.id}/build`} className="text-xs font-semibold shrink-0" style={{ color: 'var(--primary)' }}>Blocks</Link>
                    <Link href={`/admin/lessons/${l.id}/edit`} className="text-xs font-semibold shrink-0" style={{ color: 'var(--muted-foreground)' }}>Settings</Link>
                  </div>
                ))}
                {unit.lessons.length === 0 && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No lessons yet — this unit is an outline.</p>}
              </div>
              <div className="flex flex-col gap-3">
                <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                  <div className="text-[11px] font-bold uppercase tracking-widest mb-2.5" style={{ color: 'var(--muted-foreground)' }}>Targets · review coverage</div>
                  <div className="flex flex-col gap-2">
                    {unit.targets.map((t) => (
                      <button key={t.id} onClick={() => openTarget(t.id)} className="flex items-center gap-2.5 text-left" style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
                        <span className="text-xs font-bold shrink-0" style={{ width: 74, color: bandColor(t.avg), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.slug}</span>
                        <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: 'var(--secondary)' }}>
                          <div style={{ width: t.approved ? '100%' : t.pending ? '30%' : '0%', height: '100%', borderRadius: 9999, background: t.approved ? 'var(--success)' : 'var(--reward)' }} />
                        </div>
                        <span className="text-[11px] font-semibold whitespace-nowrap" style={{ color: t.pending ? 'var(--reward-foreground)' : t.approved ? 'var(--success)' : 'var(--muted-foreground)' }}>
                          {t.pending ? `${t.pending} pending ↗` : t.approved ? 'covered' : 'none yet'}
                        </span>
                      </button>
                    ))}
                  </div>
                  {(() => {
                    const weak = unit.targets.filter((t) => t.avg !== null && t.rated >= 3).sort((a, b) => (a.avg ?? 9) - (b.avg ?? 9))[0]
                    return weak && (weak.avg ?? 3) < 2.2 ? (
                      <div className="text-xs mt-3 pt-2.5" style={{ color: 'var(--muted-foreground)', borderTop: '1px solid color-mix(in oklch, var(--border) 55%, transparent)' }}>
                        {weak.slug} averages <b style={{ color: bandColor(weak.avg) }}>{weak.avg}</b> app-wide. <button onClick={() => openTarget(weak.id)} style={{ color: 'var(--primary)', fontWeight: 600, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>Open the workbench →</button>
                      </div>
                    ) : null
                  })()}
                </div>
                <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                  <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>Honors thread</div>
                  <p className="text-sm" style={{ lineHeight: 1.5 }}>
                    {unit.lessons.filter((l) => l.honorsBlocks > 0).length} of {unit.lessons.length} lessons carry honors layers. Honors classes see the thread automatically.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============ TARGET WORKBENCH ============ */}
      {view === 'target' && (
        <div>
          <div className="flex items-center gap-3 mb-3.5 flex-wrap">
            <button onClick={() => setView('unit')} className="text-sm" style={{ color: 'var(--muted-foreground)', border: 'none', background: 'transparent', cursor: 'pointer' }}>← Unit / Targets /</button>
            <span className="text-[15px] font-bold">{target ? `${target.target.slug} · ${target.target.statement.slice(0, 70)}` : '…'}</span>
          </div>
          {!target && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading the workbench…</p>}
          {target && (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
              <div className="flex flex-col gap-3">
                <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                  <div className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--muted-foreground)' }}>Where it stands · by section</div>
                  {target.sections.length === 0 && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No ratings on this target yet.</p>}
                  <div className="flex flex-col gap-2">
                    {target.sections.map((s) => (
                      <div key={s.label} className="flex items-center gap-2.5">
                        <span className="text-xs shrink-0 truncate" style={{ width: 130 }}>{s.teacher} · {s.label}</span>
                        <div className="flex-1 rounded-full overflow-hidden" style={{ height: 8, background: 'var(--secondary)' }}>
                          <div style={{ width: `${(s.avg / 3) * 100}%`, height: '100%', borderRadius: 9999, background: bandColor(s.avg) }} />
                        </div>
                        <span className="text-xs font-bold tabular-nums shrink-0" style={{ width: 28, textAlign: 'right', color: bandColor(s.avg) }}>{s.avg.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs mt-3 pt-2.5" style={{ color: 'var(--muted-foreground)', borderTop: '1px solid color-mix(in oklch, var(--border) 55%, transparent)' }}>
                    From {target.evidence} mastery observations. Compare sections to find the pattern that&apos;s working, then share it through the lesson.
                  </div>
                </div>
                <div className="rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">Dig into the answers</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Mastery analytics has the per-question evidence behind these bars.</div>
                  </div>
                  <Link href="/admin/analytics" className="text-xs font-semibold rounded-lg px-3 py-2" style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}>Open analytics</Link>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="rounded-xl border p-4" style={{ borderColor: 'color-mix(in oklch, var(--primary) 35%, var(--border))', background: 'var(--card)' }}>
                  <div className="flex justify-between items-baseline mb-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>AI reviews awaiting approval</span>
                    <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>{target.pending.length}</span>
                  </div>
                  {target.pending.length > 0 ? (
                    <>
                      <div className="flex flex-col gap-2">
                        {target.pending.map((r) => (
                          <div key={r.id} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5" style={{ border: '1px solid var(--border)' }}>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold truncate">{r.title}</div>
                              <div className="text-[11.5px]" style={{ color: 'var(--muted-foreground)' }}>{r.questions} questions</div>
                            </div>
                            <button onClick={() => approve(r.id)} disabled={busy} className="inline-flex items-center gap-1 text-[11.5px] font-bold rounded-md px-2.5 py-1.5 disabled:opacity-50" style={{ background: 'var(--success)', color: '#fff', border: 'none', cursor: 'pointer' }}><Check size={12} /> Approve</button>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs mt-2.5" style={{ color: 'var(--muted-foreground)' }}>Approved reviews go live app-wide — every teacher&apos;s students see them.</p>
                    </>
                  ) : (
                    <p className="text-sm" style={{ color: 'var(--foreground)' }}>✓ All approved — {target.approvedCount} review{target.approvedCount === 1 ? '' : 's'} live on this target.</p>
                  )}
                </div>
                <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Question depth</span>
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{target.approvedQuestions} live questions</span>
                  </div>
                  <p className="text-sm mb-3" style={{ lineHeight: 1.5 }}>
                    {target.approvedQuestions < 8 ? 'Thin — a couple more reviews would give the spiral more to draw from.' : 'Healthy depth for spaced review.'}
                  </p>
                  <button onClick={generate} disabled={busy} className="inline-flex items-center gap-1.5 text-xs font-bold rounded-lg px-3.5 py-2 disabled:opacity-50" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}>
                    <FlaskConical size={13} /> {busy ? 'Working…' : 'Generate a review with AI'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ops status bar */}
      {shelf && (
        <div className="flex items-center gap-5 flex-wrap mt-6 pt-3 text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>
          <span>Year: <b style={{ color: 'var(--foreground)' }}>{shelf.year.published}</b> of {shelf.year.lessons} lessons published · <b style={{ color: 'var(--foreground)' }}>{shelf.year.covered}</b> of {shelf.year.targets} targets review-covered</span>
          <Link href="/admin/check-lab" className="font-semibold" style={{ color: 'var(--primary)' }}>Check Lab →</Link>
          <Link href="/admin/oversight" className="font-semibold" style={{ color: 'var(--primary)' }}>App Oversight →</Link>
        </div>
      )}
    </div>
  )
}
