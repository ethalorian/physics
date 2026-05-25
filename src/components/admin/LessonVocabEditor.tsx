"use client"

import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2, ClipboardPaste, BookA, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'

interface VRow {
  id?: string
  term: string
  definition: string
  tier: number
  cognate: string
  part_of_speech: string
  example: string
  image_url: string
}

const TIERS = [
  { v: 1, label: 'Tier 1 · everyday' },
  { v: 2, label: 'Tier 2 · academic' },
  { v: 3, label: 'Tier 3 · physics' },
]
const TIER_COLOR: Record<number, string> = { 1: 'var(--success)', 2: 'var(--reward)', 3: 'var(--primary)' }
const POS = ['', 'noun', 'verb', 'adjective', 'adverb', 'phrase']

const blank = (tier = 3): VRow => ({ term: '', definition: '', tier, cognate: '', part_of_speech: '', example: '', image_url: '' })

export default function LessonVocabEditor({ lessonId }: { lessonId: string }) {
  const [rows, setRows] = useState<VRow[]>([])
  const [published, setPublished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showPaste, setShowPaste] = useState(false)
  const [paste, setPaste] = useState('')

  useEffect(() => {
    fetch(`/api/lessons/${lessonId}/vocab`).then((r) => r.json())
      .then((d: { terms?: Partial<VRow>[]; published?: boolean }) => {
        setPublished(Boolean(d.published))
        setRows((d.terms ?? []).map((t) => ({
          id: t.id, term: t.term ?? '', definition: t.definition ?? '', tier: t.tier ?? 3,
          cognate: t.cognate ?? '', part_of_speech: t.part_of_speech ?? '', example: t.example ?? '', image_url: t.image_url ?? '',
        })))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [lessonId])

  const update = (i: number, patch: Partial<VRow>) => { setSaved(false); setRows((p) => p.map((r, j) => (j === i ? { ...r, ...patch } : r))) }
  const remove = (i: number) => { setSaved(false); setRows((p) => p.filter((_, j) => j !== i)) }
  const add = (tier: number) => { setSaved(false); setRows((p) => [...p, blank(tier)]) }

  const applyPaste = useCallback(() => {
    // "term | definition | tier" per line (tier optional, defaults 3)
    const parsed: VRow[] = paste.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
      const [term, definition, tierStr] = line.split('|').map((s) => s.trim())
      const tier = Number(tierStr)
      return { ...blank(tier >= 1 && tier <= 3 ? tier : 3), term: term ?? '', definition: definition ?? '' }
    })
    setRows((p) => [...p, ...parsed])
    setPaste(''); setShowPaste(false); setSaved(false)
  }, [paste])

  const save = async (pub: boolean = published) => {
    setSaving(true); setSaved(false)
    try {
      const res = await fetch(`/api/lessons/${lessonId}/vocab`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terms: rows.filter((r) => r.term.trim()), published: pub }),
      })
      if (res.ok) setSaved(true)
    } finally { setSaving(false) }
  }

  // Flip publish state and persist it in the same write (also saves current terms).
  const togglePublished = async () => {
    const next = !published
    setPublished(next)
    await save(next)
  }

  const hasTerms = rows.some((r) => r.term.trim())

  const byTier = (t: number) => rows.map((r, i) => ({ r, i })).filter((x) => x.r.tier === t)

  return (
    <div className="rounded-2xl border p-5 mt-6" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}>
      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
        <div className="flex items-center gap-2">
          <BookA size={18} style={{ color: 'var(--primary)' }} />
          <span className="font-bold" style={{ fontSize: 15 }}>Lesson vocabulary (SEI tiers)</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={togglePublished} disabled={saving || (!hasTerms && !published)} title={!hasTerms && !published ? 'Add at least one term before publishing' : ''}
            className="inline-flex items-center gap-1.5 text-sm rounded-lg border px-2.5 py-1.5 font-medium"
            style={{ borderColor: published ? 'var(--success)' : 'var(--border)', color: published ? 'var(--success)' : 'var(--muted-foreground)', opacity: (saving || (!hasTerms && !published)) ? 0.5 : 1 }}>
            {published ? <Eye size={14} /> : <EyeOff size={14} />} {published ? 'Published' : 'Draft'}
          </button>
          <button onClick={() => setShowPaste((v) => !v)} className="inline-flex items-center gap-1 text-sm rounded-lg border px-2.5 py-1.5" style={{ borderColor: 'var(--border)' }}>
            <ClipboardPaste size={14} /> Bulk paste {showPaste ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <button onClick={() => save()} disabled={saving} className="text-sm rounded-lg px-3 py-1.5 font-medium" style={{ background: 'var(--primary)', color: 'var(--primary-foreground, white)', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : 'Save vocab'}
          </button>
          {saved && <span className="text-xs" style={{ color: 'var(--success)' }}>Saved ✓</span>}
        </div>
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>
        This list always shows in the lesson&apos;s vocab block. {published
          ? 'It’s published — students can also play it in the arcade.'
          : 'It’s a draft — hidden from the arcade until you publish.'}
      </p>

      {showPaste && (
        <div className="rounded-xl border p-3 mb-4" style={{ borderColor: 'var(--border)' }}>
          <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>One term per line: <code>term | definition | tier</code> (tier 1–3, optional)</div>
          <textarea value={paste} onChange={(e) => setPaste(e.target.value)} rows={5} placeholder={'inertia | resistance to a change in motion | 3\nrepresent | to show or stand for | 2'}
            className="w-full rounded-md border p-2 text-sm font-mono" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }} />
          <button onClick={applyPaste} disabled={!paste.trim()} className="mt-2 text-sm rounded-lg border px-3 py-1.5" style={{ borderColor: 'var(--border)' }}>Add {paste.split('\n').filter((l) => l.trim()).length || ''} terms</button>
        </div>
      )}

      {loading ? (
        <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading…</div>
      ) : (
        <div className="space-y-5">
          {TIERS.map((t) => (
            <div key={t.v}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: TIER_COLOR[t.v] }}>{t.label}</span>
                <button onClick={() => add(t.v)} className="inline-flex items-center gap-1 text-xs rounded-md border px-2 py-1" style={{ borderColor: 'var(--border)' }}><Plus size={13} /> term</button>
              </div>
              {byTier(t.v).length === 0 ? (
                <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No Tier {t.v} terms yet.</div>
              ) : (
                <div className="space-y-2">
                  {byTier(t.v).map(({ r, i }) => (
                    <div key={i} className="rounded-xl border p-3" style={{ borderColor: 'var(--border)', borderLeft: `3px solid ${TIER_COLOR[t.v]}` }}>
                      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                        <input value={r.term} onChange={(e) => update(i, { term: e.target.value })} placeholder="Term" className="rounded-md border px-2 py-1.5 text-sm font-medium" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }} />
                        <input value={r.cognate} onChange={(e) => update(i, { cognate: e.target.value })} placeholder="Cognate (Spanish)" className="rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }} />
                        <select value={r.part_of_speech} onChange={(e) => update(i, { part_of_speech: e.target.value })} className="rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}>
                          {POS.map((p) => <option key={p} value={p}>{p || 'part of speech'}</option>)}
                        </select>
                        <select value={r.tier} onChange={(e) => update(i, { tier: Number(e.target.value) })} className="rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}>
                          {TIERS.map((tt) => <option key={tt.v} value={tt.v}>Tier {tt.v}</option>)}
                        </select>
                      </div>
                      <textarea value={r.definition} onChange={(e) => update(i, { definition: e.target.value })} placeholder="Definition" rows={2} className="w-full rounded-md border px-2 py-1.5 text-sm mt-2" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }} />
                      <div className="grid gap-2 mt-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                        <input value={r.example} onChange={(e) => update(i, { example: e.target.value })} placeholder="Example sentence / frame" className="rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }} />
                        <input value={r.image_url} onChange={(e) => update(i, { image_url: e.target.value })} placeholder="Image URL (optional)" className="rounded-md border px-2 py-1.5 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }} />
                      </div>
                      <div className="flex justify-end mt-2">
                        <button onClick={() => remove(i)} className="inline-flex items-center gap-1 text-xs" style={{ color: '#C08B8B' }}><Trash2 size={13} /> remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
