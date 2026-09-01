"use client"

// Check Lab — the instant checker's repair bench. Every student answer the
// parser couldn't confirm, replayed against the CURRENT parser and keys, so
// only still-failing pairs show. Promote a real phrasing into the item's
// accepted forms with one click, or dismiss answers that are simply wrong.

import { useCallback, useEffect, useState } from 'react'
import { FlaskConical, Check, X, RefreshCw } from 'lucide-react'

interface MissAnswer { answer: string; verdict: string; count: number; ids: string[] }
interface MissGroup {
  itemId: string; prompt: string; answerKey: string | null; checkMode: string
  code: string | null; hasTemplate: boolean; answers: MissAnswer[]
}

export default function CheckLabPage() {
  const [groups, setGroups] = useState<MissGroup[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/check-misses')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Load failed — admin only'))))
      .then((d) => { setGroups(d.items ?? []); setTotal(d.totalMisses ?? 0); setError(null) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  const act = async (key: string, body: Record<string, unknown>, okMsg: string) => {
    setBusy(key)
    try {
      const res = await fetch('/api/admin/check-misses', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error || 'Failed')
      setFlash(d.nowMatches === false ? 'Form added, but it still doesn’t parse — this one may need a parser fix.' : okMsg)
      setTimeout(() => setFlash(null), 4000)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      <div className="flex items-center gap-3 mb-1">
        <div className="grid place-items-center" style={{ width: 44, height: 44, borderRadius: 12, background: 'color-mix(in oklch, var(--primary) 14%, transparent)', color: 'var(--primary)' }}>
          <FlaskConical size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Check Lab</h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Student answers the instant checker couldn&apos;t confirm — still failing under the current parser and keys.
          </p>
        </div>
        <button onClick={load} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold" style={{ borderColor: 'var(--border)', background: 'var(--card)', cursor: 'pointer', color: 'var(--foreground)' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>
      <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
        <b className="tabular-nums">{total}</b> failing answers across <b className="tabular-nums">{groups.length}</b> items.
        Accept a phrasing to add it to the item&apos;s answer key; dismiss answers that are simply wrong.
      </p>

      {flash && <div className="mb-3 rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: 'color-mix(in oklch, var(--success) 12%, transparent)', color: 'var(--success)' }}>{flash}</div>}
      {error && <div className="mb-3 rounded-lg px-3 py-2 text-sm" style={{ background: 'color-mix(in oklch, var(--destructive) 10%, transparent)', color: 'var(--destructive)' }}>{error}</div>}
      {loading && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Replaying misses through the parser…</p>}
      {!loading && groups.length === 0 && !error && (
        <div className="rounded-xl border p-8 text-center" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <div className="text-3xl mb-2">✓</div>
          <p className="font-semibold">Nothing failing</p>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Every logged answer now parses, matches, or was dismissed.</p>
        </div>
      )}

      <div className="space-y-4">
        {groups.map((g) => (
          <div key={g.itemId} className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <div className="flex items-start gap-2 mb-1">
              {g.code && <span className="text-xs font-bold rounded px-2 py-0.5 tabular-nums shrink-0" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>{g.code}</span>}
              <span className="text-[15px] font-semibold" style={{ lineHeight: 1.4 }}>{g.prompt}</span>
              {g.hasTemplate && <span className="ml-auto text-[11px] rounded-full px-2 py-0.5 shrink-0" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>template</span>}
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>
              Key: <code style={{ background: 'var(--secondary)', padding: '1px 5px', borderRadius: 4 }}>{g.answerKey ?? '—'}</code> · {g.checkMode}
            </p>
            <div className="space-y-1.5">
              {g.answers.map((a) => (
                <div key={a.answer} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'color-mix(in oklch, var(--secondary) 45%, transparent)' }}>
                  <span className="text-[11px] font-bold rounded-full px-2 py-0.5 shrink-0" style={{
                    background: a.verdict === 'mismatch' ? 'color-mix(in oklch, var(--destructive) 12%, transparent)' : 'color-mix(in oklch, var(--reward) 16%, transparent)',
                    color: a.verdict === 'mismatch' ? 'var(--destructive)' : 'var(--reward-foreground)',
                  }}>{a.verdict === 'mismatch' ? '✗ judged wrong' : '? unreadable'}</span>
                  <span className="text-sm font-medium truncate" style={{ fontFamily: 'ui-monospace, monospace' }}>{a.answer}</span>
                  {a.count > 1 && <span className="text-xs tabular-nums shrink-0" style={{ color: 'var(--muted-foreground)' }}>×{a.count}</span>}
                  <span className="ml-auto flex gap-1.5 shrink-0">
                    <button
                      disabled={busy !== null || g.hasTemplate}
                      title={g.hasTemplate ? 'Template item — numbers vary per student; fix the template instead' : 'Add this phrasing to the accepted forms'}
                      onClick={() => act(`${g.itemId}:${a.answer}`, { item_id: g.itemId, add_form: a.answer }, 'Accepted — future answers in this form will match.')}
                      className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold disabled:opacity-40"
                      style={{ background: 'color-mix(in oklch, var(--success) 14%, transparent)', color: 'var(--success)', border: 'none', cursor: 'pointer' }}>
                      <Check size={13} /> Accept
                    </button>
                    <button
                      disabled={busy !== null}
                      title="This answer is simply wrong — remove it from the lab"
                      onClick={() => act(`dismiss:${a.answer}`, { dismiss_ids: a.ids }, 'Dismissed.')}
                      className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold disabled:opacity-40"
                      style={{ background: 'transparent', color: 'var(--muted-foreground)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                      <X size={13} /> Dismiss
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
