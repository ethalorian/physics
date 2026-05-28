"use client"

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useViewAs } from '@/lib/use-view-as'
import { ArrowLeft, Check, X, BookOpenCheck, Sparkles, Loader2, ArrowUp, ArrowDown, Trash2, Edit3 } from 'lucide-react'
import type { ContentBlock } from '@/data/content-blocks'

const BlockRenderer = dynamic(() => import('@/components/blocks/BlockRenderer'), { ssr: false, loading: () => null })

interface Q { q: string; choices: string[]; answerIndex: number; explanation: string }
interface Review { id: string; target_id: string; targetStatement: string; reteach: string; blocks: ContentBlock[] | null; questions: Q[]; created_by: string | null; created_at: string }
interface UnitOpt { id: string; name: string }
interface TargetOpt { id: string; statement: string; domain: string }

export default function ReviewQueuePage() {
  const { role } = useViewAs()
  const router = useRouter()
  const isAdmin = role === 'admin'
  // The review library is the ADMIN-only quality gate app-wide. Anyone else
  // (teachers included) gets bounced to their dashboard.
  useEffect(() => {
    if (role && role !== 'admin') router.replace('/admin/teacher')
  }, [role, router])

  const [pending, setPending] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  // Per-review edited block arrays. Populated lazily the first time the admin
  // touches a block (move / remove / edit). On approve, the edited array is
  // persisted in place of the original.
  const [edits, setEdits] = useState<Record<string, ContentBlock[]>>({})
  // Per-block markdown-edit toggles: key `${reviewId}|${blockId}`.
  const [editing, setEditing] = useState<Set<string>>(new Set())

  // Seed panel state
  const [units, setUnits] = useState<UnitOpt[]>([])
  const [unitId, setUnitId] = useState<string>('')
  const [targets, setTargets] = useState<TargetOpt[]>([])
  const [seeding, setSeeding] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number; failed: number } | null>(null)
  const [genOne, setGenOne] = useState<string | null>(null)
  const [genResult, setGenResult] = useState<Record<string, 'ok' | 'fail'>>({})

  const load = useCallback(() => {
    fetch('/api/admin/reviews')
      .then((r) => r.json())
      .then((d: { pending?: Review[] }) => { setPending(d.pending ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])
  useEffect(() => { if (isAdmin) load() }, [load, isAdmin])

  // Pull the unit list + first unit's targets from the mastery grid (it already
  // exposes both, scoped to the teacher's roster).
  const loadTargets = useCallback((uid: string) => {
    fetch(`/api/mastery/grid?unit_id=${encodeURIComponent(uid)}`)
      .then((r) => r.json())
      .then((d: { units?: UnitOpt[]; targets?: TargetOpt[] }) => {
        if (d.units && units.length === 0) setUnits(d.units)
        setTargets(d.targets ?? [])
      })
      .catch(() => {})
  }, [units.length])

  useEffect(() => {
    if (!isAdmin) return
    // Initial load: grid defaults to unit-1, gives us both units + targets.
    fetch('/api/mastery/grid')
      .then((r) => r.json())
      .then((d: { unitId?: string; units?: UnitOpt[]; targets?: TargetOpt[] }) => {
        setUnits(d.units ?? [])
        setUnitId(d.unitId ?? (d.units?.[0]?.id ?? ''))
        setTargets(d.targets ?? [])
      })
      .catch(() => {})
  }, [isAdmin])

  const pickUnit = (uid: string) => {
    setUnitId(uid)
    setProgress(null)
    setGenResult({})
    loadTargets(uid)
  }

  const generateOne = async (targetId: string) => {
    if (genOne || seeding) return
    setGenOne(targetId)
    let ok = false
    try {
      const res = await fetch('/api/admin/reviews/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: targetId }),
      })
      ok = res.ok
    } catch { ok = false }
    setGenResult((m) => ({ ...m, [targetId]: ok ? 'ok' : 'fail' }))
    setGenOne(null)
    if (ok) load()
  }

  const seed = async () => {
    if (targets.length === 0 || seeding) return
    setSeeding(true)
    setProgress({ done: 0, total: targets.length, failed: 0 })
    let done = 0
    let failed = 0
    for (const t of targets) {
      try {
        const res = await fetch('/api/admin/reviews/generate', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target_id: t.id }),
        })
        if (!res.ok) failed += 1
      } catch { failed += 1 }
      done += 1
      setProgress({ done, total: targets.length, failed })
    }
    setSeeding(false)
    load()
  }

  // Edit helpers — mutate the per-review edited array, seeding from the
  // original on first touch so the admin's tweaks are local until they approve.
  const blocksFor = (rv: Review): ContentBlock[] => edits[rv.id] ?? (rv.blocks ?? [])
  const touch = (rv: Review, mutate: (blocks: ContentBlock[]) => ContentBlock[]) => {
    setEdits((m) => ({ ...m, [rv.id]: mutate(blocksFor(rv)) }))
  }
  const moveBlock = (rv: Review, idx: number, dir: -1 | 1) => {
    touch(rv, (bs) => {
      const j = idx + dir
      if (j < 0 || j >= bs.length) return bs
      const next = [...bs]
      ;[next[idx], next[j]] = [next[j], next[idx]]
      return next
    })
  }
  const removeBlock = (rv: Review, idx: number) => {
    touch(rv, (bs) => bs.filter((_, i) => i !== idx))
  }
  const setBlockMarkdown = (rv: Review, idx: number, markdown: string) => {
    touch(rv, (bs) => bs.map((b, i) => (i === idx ? ({ ...b, markdown } as ContentBlock) : b)))
  }
  const toggleEditing = (rvId: string, blockId: string) => {
    const key = `${rvId}|${blockId}`
    setEditing((s) => {
      const next = new Set(s)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  const decide = async (rv: Review, decision: 'approve' | 'reject') => {
    setBusy(rv.id)
    const body: Record<string, unknown> = { id: rv.id, decision }
    // Only send blocks when approving AND the admin touched them.
    if (decision === 'approve' && edits[rv.id]) body.blocks = edits[rv.id]
    await fetch('/api/admin/reviews', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => {})
    setBusy(null)
    setEdits((m) => {
      const next = { ...m }
      delete next[rv.id]
      return next
    })
    load()
  }

  // Non-admins are being redirected; render nothing meaningful in the meantime.
  if (role && role !== 'admin') {
    return <div className="max-w-3xl mx-auto p-5 text-sm" style={{ color: 'var(--muted-foreground)' }}>Redirecting…</div>
  }

  return (
    <div className="max-w-3xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      <Link href="/admin/home" className="inline-flex items-center gap-1.5 text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
        <ArrowLeft size={15} /> Command center
      </Link>
      <div className="flex items-center gap-2 mb-1">
        <BookOpenCheck size={16} style={{ color: 'var(--primary)' }} />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>Review library</span>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Approve generated skill reviews</h1>
      <p className="text-sm mt-1 mb-5" style={{ color: 'var(--muted-foreground)' }}>
        When a student is weak on a skill, the app generates a re-teach + practice review. Approve the good ones — approved reviews are shared with every student who needs that skill.
      </p>

      {/* Seed panel — generate a starter batch so the library isn't empty on day one. */}
      <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: 'var(--border)', background: 'color-mix(in oklch, var(--primary) 6%, var(--card))' }}>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={15} style={{ color: 'var(--primary)' }} />
          <span className="text-sm font-semibold">Generate reviews to get started</span>
        </div>
        <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>
          Seed the library by generating a review for every skill in a unit. Each lands here as a draft for you to approve — nothing is shared with students until you say so.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={unitId}
            onChange={(e) => pickUnit(e.target.value)}
            disabled={seeding || units.length === 0}
            className="text-sm rounded-lg px-3 py-1.5"
            style={{ background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
          >
            {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {targets.length} skill{targets.length === 1 ? '' : 's'}
          </span>
          <button
            onClick={seed}
            disabled={seeding || targets.length === 0}
            className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-lg px-3 py-1.5 disabled:opacity-50"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}
          >
            {seeding ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {seeding ? 'Generating…' : `Generate a review for each skill`}
          </button>
        </div>
        {progress && (
          <p className="text-xs mt-3" style={{ color: 'var(--muted-foreground)' }}>
            {progress.done} of {progress.total} generated{progress.failed > 0 ? ` · ${progress.failed} failed` : ''}
            {!seeding && progress.done > 0 && ' — drafts added below.'}
          </p>
        )}

        {/* Per-skill generation — top up a single weak spot without re-seeding the whole unit. */}
        {targets.length > 0 && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>
              Or generate one skill at a time
            </div>
            <ul className="flex flex-col gap-1.5">
              {targets.map((t) => {
                const r = genResult[t.id]
                return (
                  <li key={t.id} className="flex items-center gap-2">
                    <span className="text-xs flex-1 min-w-0 truncate" title={t.statement}>{t.statement}</span>
                    {r === 'ok' && <span className="text-xs inline-flex items-center gap-1" style={{ color: 'var(--success)' }}><Check size={12} /> added</span>}
                    {r === 'fail' && <span className="text-xs" style={{ color: 'var(--destructive)' }}>failed</span>}
                    <button
                      onClick={() => generateOne(t.id)}
                      disabled={genOne !== null || seeding}
                      className="inline-flex items-center gap-1 text-xs font-medium rounded-md px-2 py-1 disabled:opacity-50 shrink-0"
                      style={{ background: 'transparent', color: 'var(--primary)', border: '1px solid var(--border)', cursor: 'pointer' }}
                    >
                      {genOne === t.id ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      {genOne === t.id ? 'Generating' : 'Generate'}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>

      {loading && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading the queue…</p>}
      {!loading && pending.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Nothing waiting for approval. Generated reviews will appear here.</p>
      )}

      <div className="flex flex-col gap-4">
        {pending.map((rv) => (
          <div key={rv.id} className="rounded-2xl border p-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <div className="text-xs font-semibold mb-1" style={{ color: 'var(--muted-foreground)' }}>SKILL</div>
            <div className="font-semibold text-sm mb-3">{rv.targetStatement}</div>

            {/* Re-teach: a rich ordered block array (prose, callout, diagram,
                graph, sim). Per-block toolbar (reorder / remove / edit text)
                lets the admin curate before sharing; the underlying block is
                rendered with the same BlockRenderer students will see. */}
            <div className="rounded-lg p-3 mb-3" style={{ background: 'color-mix(in oklch, var(--secondary) 50%, transparent)' }}>
              <div className="text-xs font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>RE-TEACH (preview — edit before approving)</div>
              {blocksFor(rv).length === 0 ? (
                <p className="text-sm italic" style={{ color: 'var(--muted-foreground)' }}>
                  {rv.reteach || 'No re-teach blocks. Reject and regenerate.'}
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {blocksFor(rv).map((b, bi) => {
                    const list = blocksFor(rv)
                    const editable = b.type === 'prose' || b.type === 'callout'
                    const editKey = `${rv.id}|${b.id}`
                    const isEditing = editing.has(editKey)
                    const labelMap: Record<string, string> = {
                      prose: 'Prose', callout: 'Callout', diagram: 'Diagram', graph: 'Graph', sim_embed: 'Simulation',
                    }
                    return (
                      <div key={b.id} className="rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
                        {/* Per-block toolbar */}
                        <div className="flex items-center gap-1 px-2 py-1 border-b" style={{ borderColor: 'var(--border)' }}>
                          <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--muted-foreground)' }}>{labelMap[b.type] ?? b.type}</span>
                          <div className="ml-auto flex items-center gap-1">
                            <button title="Move up" disabled={bi === 0} onClick={() => moveBlock(rv, bi, -1)} className="p-1 rounded disabled:opacity-30" style={{ background: 'transparent', border: 'none', color: 'var(--muted-foreground)', cursor: bi === 0 ? 'default' : 'pointer' }}><ArrowUp size={13} /></button>
                            <button title="Move down" disabled={bi === list.length - 1} onClick={() => moveBlock(rv, bi, 1)} className="p-1 rounded disabled:opacity-30" style={{ background: 'transparent', border: 'none', color: 'var(--muted-foreground)', cursor: bi === list.length - 1 ? 'default' : 'pointer' }}><ArrowDown size={13} /></button>
                            {editable && (
                              <button title={isEditing ? 'Done' : 'Edit text'} onClick={() => toggleEditing(rv.id, b.id)} className="p-1 rounded" style={{ background: 'transparent', border: 'none', color: isEditing ? 'var(--primary)' : 'var(--muted-foreground)', cursor: 'pointer' }}>
                                {isEditing ? <Check size={13} /> : <Edit3 size={13} />}
                              </button>
                            )}
                            <button title="Remove this block" onClick={() => removeBlock(rv, bi)} className="p-1 rounded" style={{ background: 'transparent', border: 'none', color: 'var(--destructive)', cursor: 'pointer' }}><Trash2 size={13} /></button>
                          </div>
                        </div>
                        {/* Block body — either inline-editing or rendered preview */}
                        <div className="p-2">
                          {editable && isEditing ? (
                            <textarea
                              value={(b as { markdown?: string }).markdown ?? ''}
                              onChange={(e) => setBlockMarkdown(rv, bi, e.target.value)}
                              className="w-full text-sm rounded-md p-2"
                              style={{ minHeight: 80, background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)', fontFamily: 'inherit' }}
                            />
                          ) : (
                            <BlockRenderer blocks={[b]} lessonId={`review-approval-${rv.id}`} />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {edits[rv.id] && (
                <p className="text-[11px] mt-2" style={{ color: 'var(--primary)' }}>You&rsquo;ve edited these blocks &mdash; they&rsquo;ll save when you approve.</p>
              )}
            </div>

            <div className="flex flex-col gap-2.5 mb-4">
              {rv.questions.map((q, qi) => (
                <div key={qi}>
                  <div className="text-sm font-medium">{qi + 1}. {q.q}</div>
                  <ul className="mt-1 ml-1 flex flex-col gap-0.5">
                    {q.choices.map((c, ci) => (
                      <li key={ci} className="text-xs flex items-center gap-1.5" style={{ color: ci === q.answerIndex ? 'var(--success)' : 'var(--muted-foreground)' }}>
                        {ci === q.answerIndex ? <Check size={12} /> : <span style={{ width: 12 }} />} {c}
                      </li>
                    ))}
                  </ul>
                  <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>{q.explanation}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => decide(rv, 'approve')} disabled={busy === rv.id}
                className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-lg px-3 py-1.5 disabled:opacity-50"
                style={{ background: 'var(--success)', color: 'var(--card)', border: 'none', cursor: 'pointer' }}>
                <Check size={15} /> Approve & share
              </button>
              <button onClick={() => decide(rv, 'reject')} disabled={busy === rv.id}
                className="inline-flex items-center gap-1.5 text-sm font-medium rounded-lg px-3 py-1.5 disabled:opacity-50"
                style={{ background: 'transparent', color: 'var(--muted-foreground)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                <X size={15} /> Reject
              </button>
              {rv.created_by && <span className="text-xs ml-auto" style={{ color: 'var(--muted-foreground)' }}>from {rv.created_by}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
