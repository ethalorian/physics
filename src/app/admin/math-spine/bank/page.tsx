'use client'

/**
 * Warm-Up Bank — author warm-up items and their mini-lessons in one place,
 * instead of writing SQL. Items tab: create/edit/delete warm-ups, set the prompt,
 * answer key, difficulty, unit, and which competency(s) each tests. Lessons tab:
 * edit the "how to do it" mini-lesson shown to students per competency.
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, ArrowLeft, Lightbulb } from 'lucide-react'
import { tieredLessonsForCode, TIER_LABELS } from '@/lib/math-spine-lessons'

interface MiniLesson { title: string; steps: string[]; tip?: string }
interface Comp { id: string; code: string; statement: string; strand: string; mini_lesson: { tiers: MiniLesson[] } | null }
interface Item {
  id: string
  competencyId: string
  prompt: string
  answerKey: string | null
  firstUnitId: string | null
  difficulty: string | null
  testedCompetencyIds: string[]
}

const UNITS = ['unit-1', 'unit-2', 'unit-3', 'unit-4', 'unit-5', 'unit-6', 'unit-7']
const DIFFICULTIES = ['easy', 'medium', 'hard']
const inputCls = 'w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground'

interface ItemForm {
  prompt: string
  answerKey: string
  difficulty: string
  firstUnitId: string
  competencyId: string
  tested: string[]
}
const emptyForm = (competencyId = ''): ItemForm => ({
  prompt: '', answerKey: '', difficulty: 'easy', firstUnitId: 'unit-1', competencyId, tested: [],
})

export default function WarmupBankPage() {
  const [comps, setComps] = useState<Comp[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'items' | 'lessons'>('items')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null) // null = no editor; 'new' = create
  const [form, setForm] = useState<ItemForm>(emptyForm())

  const codeById = useCallback((id: string) => comps.find((c) => c.id === id)?.code ?? '?', [comps])

  const load = useCallback(() => {
    fetch('/api/math-spine/bank')
      .then((r) => r.json())
      .then((d) => {
        if (d?.error) throw new Error(d.error)
        setComps(d.competencies ?? [])
        setItems(d.items ?? [])
        setLoading(false)
      })
      .catch((e) => { setError(e instanceof Error ? e.message : 'Could not load'); setLoading(false) })
  }, [])

  useEffect(() => { load() }, [load])

  function startNew() {
    setForm(emptyForm(comps[0]?.id ?? ''))
    setEditingId('new')
  }
  function startEdit(it: Item) {
    setForm({
      prompt: it.prompt,
      answerKey: it.answerKey ?? '',
      difficulty: it.difficulty ?? 'easy',
      firstUnitId: it.firstUnitId ?? 'unit-1',
      competencyId: it.competencyId,
      tested: it.testedCompetencyIds.filter((c) => c !== it.competencyId),
    })
    setEditingId(it.id)
  }
  function cancel() { setEditingId(null); setError(null) }

  function toggleTested(cid: string) {
    setForm((f) => ({ ...f, tested: f.tested.includes(cid) ? f.tested.filter((c) => c !== cid) : [...f.tested, cid] }))
  }

  async function saveItem() {
    if (!form.prompt.trim() || !form.competencyId) { setError('A prompt and a primary competency are required.'); return }
    setBusy(true); setError(null)
    try {
      const payload = {
        id: editingId !== 'new' ? editingId : undefined,
        prompt: form.prompt,
        answer_key: form.answerKey || null,
        difficulty: form.difficulty,
        first_unit_id: form.firstUnitId,
        competency_id: form.competencyId,
        tested_competency_ids: form.tested,
      }
      const res = await fetch('/api/math-spine/bank', {
        method: editingId === 'new' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || 'Save failed') }
      setEditingId(null)
      load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed') } finally { setBusy(false) }
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this warm-up? Past student submissions are kept.')) return
    setBusy(true)
    try {
      const res = await fetch(`/api/math-spine/bank?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || 'Delete failed') }
      load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Delete failed') } finally { setBusy(false) }
  }

  if (loading) return <div className="max-w-3xl mx-auto p-4"><p className="text-sm text-muted-foreground">Loading the bank…</p></div>

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <Link href="/admin/math-spine" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to math spine
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Warm-Up Bank</h1>
        <p className="text-sm text-muted-foreground mt-1">Author the daily warm-ups and their mini-lessons — no SQL required.</p>
      </div>

      <div className="flex gap-2">
        {(['items', 'lessons'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold border"
            style={{ borderColor: 'var(--border)', background: tab === t ? 'var(--primary)' : 'var(--card)', color: tab === t ? 'var(--primary-foreground)' : 'var(--foreground)' }}
          >
            {t === 'items' ? `Warm-up items · ${items.length}` : `Mini-lessons · ${comps.length}`}
          </button>
        ))}
      </div>

      {error && <div className="text-sm rounded-md px-3 py-2 bg-red-50 text-red-700">{error}</div>}

      {tab === 'items' && (
        <>
          {editingId === null && (
            <Button onClick={startNew} className="rounded-full"><Plus className="h-4 w-4 mr-1.5" /> New warm-up</Button>
          )}

          {editingId !== null && (
            <Card className="apple-card">
              <CardHeader><CardTitle className="text-base text-foreground">{editingId === 'new' ? 'New warm-up' : 'Edit warm-up'}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Prompt</label>
                  <textarea rows={3} className={inputCls} value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} placeholder="The warm-up question…" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Answer key (teacher / self-check)</label>
                  <input className={inputCls} value={form.answerKey} onChange={(e) => setForm({ ...form, answerKey: e.target.value })} />
                </div>
                <div className="flex flex-wrap gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Difficulty</label>
                    <select className={inputCls} value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                      {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Earliest unit</label>
                    <select className={inputCls} value={form.firstUnitId} onChange={(e) => setForm({ ...form, firstUnitId: e.target.value })}>
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Primary competency</label>
                    <select className={inputCls} value={form.competencyId} onChange={(e) => setForm({ ...form, competencyId: e.target.value })}>
                      {comps.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.statement.slice(0, 40)}…</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Also tests (each adds a rating to review)</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {comps.filter((c) => c.id !== form.competencyId).map((c) => (
                      <label key={c.id} className="inline-flex items-center gap-1.5 text-xs rounded-md border border-border px-2 py-1 cursor-pointer">
                        <input type="checkbox" checked={form.tested.includes(c.id)} onChange={() => toggleTested(c.id)} />
                        {c.code}
                      </label>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Keep this lean — every tested competency is a separate rating per student.</p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button onClick={saveItem} disabled={busy} className="rounded-full">{busy ? 'Saving…' : 'Save'}</Button>
                  <Button onClick={cancel} variant="ghost" className="rounded-full">Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {items.map((it) => (
              <Card key={it.id} className="apple-card">
                <CardContent className="py-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        {it.testedCompetencyIds.map((cid) => (
                          <Badge key={cid} variant="outline" className="text-[10px]">{codeById(cid)}</Badge>
                        ))}
                        {it.difficulty && <span className="text-[11px] text-muted-foreground">· {it.difficulty}</span>}
                        {it.firstUnitId && <span className="text-[11px] text-muted-foreground">· {it.firstUnitId}</span>}
                      </div>
                      <p className="text-sm text-foreground">{it.prompt}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="rounded-full" onClick={() => startEdit(it)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" className="rounded-full text-red-600" onClick={() => deleteItem(it.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {tab === 'lessons' && (
        <div className="space-y-3">
          {comps.map((c) => (
            <LessonEditor key={c.id} comp={c} onSaved={load} />
          ))}
        </div>
      )}
    </div>
  )
}

interface TierDraft { title: string; stepsText: string; tip: string }

function LessonEditor({ comp, onSaved }: { comp: Comp; onSaved: () => void }) {
  const defaults: MiniLesson[] = comp.mini_lesson?.tiers ?? (tieredLessonsForCode(comp.code) ?? [])
  const usingDefault = !comp.mini_lesson
  const [open, setOpen] = useState(false)
  const [tiers, setTiers] = useState<TierDraft[]>(
    [0, 1, 2].map((i) => ({
      title: defaults[i]?.title ?? '',
      stepsText: (defaults[i]?.steps ?? []).join('\n'),
      tip: defaults[i]?.tip ?? '',
    })),
  )
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  const setTier = (i: number, patch: Partial<TierDraft>) =>
    setTiers((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)))

  async function save() {
    setBusy(true)
    try {
      const res = await fetch('/api/math-spine/competency-lesson', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competency_id: comp.id,
          tiers: tiers.map((t) => ({ title: t.title, steps: t.stepsText.split('\n').map((s) => s.trim()).filter(Boolean), tip: t.tip })),
        }),
      })
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 1500); onSaved() }
    } finally { setBusy(false) }
  }

  return (
    <Card className="apple-card">
      <CardContent className="py-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-reward" />
          <Badge variant="outline" className="text-[10px]">{comp.code}</Badge>
          <span className="text-sm text-foreground flex-1">{defaults[0]?.title ?? '(no lesson)'}</span>
          {usingDefault && <span className="text-[10px] text-muted-foreground">default</span>}
          <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setOpen((o) => !o)}>{open ? 'Close' : 'Edit'}</Button>
        </div>
        {open && (
          <div className="space-y-4 mt-3">
            <p className="text-[11px] text-muted-foreground">Three tiers: students see the one matching their mastery (Start here for new/struggling, Fluent once they’re strong).</p>
            {tiers.map((t, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-border p-3">
                <div className="text-xs font-semibold text-foreground">{TIER_LABELS[i]} · tier {i + 1}</div>
                <input className={inputCls} value={t.title} onChange={(e) => setTier(i, { title: e.target.value })} placeholder="Tier title" />
                <textarea rows={3} className={inputCls} value={t.stepsText} onChange={(e) => setTier(i, { stepsText: e.target.value })} placeholder="One step per line" />
                <input className={inputCls} value={t.tip} onChange={(e) => setTier(i, { tip: e.target.value })} placeholder="Optional tip" />
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Button size="sm" className="rounded-full" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save all tiers'}</Button>
              {saved && <span className="text-xs text-success">Saved ✓</span>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
