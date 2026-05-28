"use client"

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useViewAs } from '@/lib/use-view-as'
import { ArrowLeft, Users, Merge, Check, AlertTriangle } from 'lucide-react'
import type { DuplicateGroup, DuplicateRow } from '@/app/api/admin/duplicates/route'

// Admin-only ongoing surface for finding student rows that look like the same
// person spread across multiple records. After the sign-in self-heal landed,
// this should normally be empty; it's the safety net + monitoring view.

export default function DuplicatesPage() {
  const { role } = useViewAs()
  const router = useRouter()
  const [groups, setGroups] = useState<DuplicateGroup[] | null>(null)
  const [totalStudents, setTotalStudents] = useState<number>(0)
  const [busy, setBusy] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (role && role !== 'admin') router.replace('/admin/home')
  }, [role, router])

  const load = useCallback(() => {
    fetch('/api/admin/duplicates')
      .then((r) => r.json())
      .then((d: { groups?: DuplicateGroup[]; totalStudents?: number }) => {
        setGroups(d.groups ?? [])
        setTotalStudents(d.totalStudents ?? 0)
      })
      .catch(() => setGroups([]))
  }, [])
  useEffect(() => { if (role === 'admin') load() }, [role, load])

  const merge = async (canonical: DuplicateRow, dup: DuplicateRow) => {
    setBusy(dup.id); setErr(null)
    const res = await fetch('/api/admin/duplicates/merge', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canonical_id: canonical.id, dup_id: dup.id }),
    }).catch(() => null)
    setBusy(null)
    if (!res?.ok) {
      const body = await res?.json().catch(() => null) as { error?: string } | null
      setErr(body?.error ?? 'Merge failed')
      return
    }
    setFlash(`Merged ${dup.email ?? 'duplicate'} into ${canonical.email ?? 'canonical'}.`)
    setTimeout(() => setFlash(null), 2500)
    load()
  }

  if (role && role !== 'admin') {
    return <div className="max-w-3xl mx-auto p-5 text-sm" style={{ color: 'var(--muted-foreground)' }}>Redirecting…</div>
  }

  return (
    <div className="max-w-5xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      <Link href="/admin/home" className="inline-flex items-center gap-1.5 text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
        <ArrowLeft size={15} /> Command center
      </Link>

      <div className="flex items-center gap-2 mb-1">
        <Users size={16} style={{ color: 'var(--primary)' }} />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>App oversight</span>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Duplicate accounts</h1>
      <p className="text-sm mt-1 mb-6" style={{ color: 'var(--muted-foreground)' }}>
        Student rows that look like the same person spread across multiple records &mdash; usually a Google Classroom import + a sign-in row. Sign-in now self-heals these automatically, so this list should mostly stay empty. Pick the row to keep (the one with the real school email and the student&rsquo;s work), then merge.
      </p>

      {flash && (
        <div className="rounded-xl mb-4 px-4 py-2.5 text-sm" style={{ background: 'color-mix(in oklch, var(--success) 18%, transparent)', color: 'var(--success)' }}>
          <Check size={14} className="inline mr-1.5" /> {flash}
        </div>
      )}
      {err && (
        <div className="rounded-xl mb-4 px-4 py-2.5 text-sm" style={{ background: 'color-mix(in oklch, var(--destructive) 14%, transparent)', color: 'var(--destructive)' }}>
          <AlertTriangle size={14} className="inline mr-1.5" /> {err}
        </div>
      )}

      {groups === null && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading…</p>}

      {groups && groups.length === 0 && (
        <div className="rounded-2xl border p-6 text-center" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <div className="text-lg font-semibold">No duplicates found.</div>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            All {totalStudents} student records look unique by name.
          </p>
        </div>
      )}

      {groups && groups.length > 0 && (
        <div className="flex flex-col gap-4">
          {groups.map((g) => (
            <div key={g.name} className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} />
                <span className="font-semibold">{g.name}</span>
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{g.rows.length} rows</span>
              </div>
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(g.rows.length, 3)}, minmax(0, 1fr))` }}>
                {g.rows.map((r) => {
                  const activity = r.block_responses + r.lesson_progress + r.game_scores
                  return (
                    <div key={r.id} className="rounded-xl border p-3 text-xs" style={{ borderColor: r.enrolled ? 'color-mix(in oklch, var(--success) 30%, var(--border))' : 'var(--border)', background: 'var(--card)' }}>
                      <div className="font-mono truncate" title={r.email ?? '—'}>{r.email ?? '—'}</div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {r.enrolled && (
                          <span className="rounded-md px-1.5 py-0.5" style={{ background: 'color-mix(in oklch, var(--success) 14%, transparent)', color: 'var(--success)' }}>Enrolled</span>
                        )}
                        {r.is_classroom_stub && (
                          <span className="rounded-md px-1.5 py-0.5" style={{ background: 'color-mix(in oklch, var(--reward) 14%, transparent)', color: 'var(--reward-foreground)' }}>Classroom stub</span>
                        )}
                        {activity > 0 && (
                          <span className="rounded-md px-1.5 py-0.5" style={{ background: 'color-mix(in oklch, var(--primary) 12%, transparent)', color: 'var(--primary)' }}>{activity} activity</span>
                        )}
                        {activity === 0 && !r.enrolled && (
                          <span className="rounded-md px-1.5 py-0.5" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>empty</span>
                        )}
                      </div>
                      <div className="mt-1.5" style={{ color: 'var(--muted-foreground)' }}>
                        {r.block_responses} blocks &middot; {r.lesson_progress} lessons &middot; {r.game_scores} games
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {g.rows.filter((other) => other.id !== r.id).map((other) => (
                          <button
                            key={other.id}
                            onClick={() => merge(r, other)}
                            disabled={busy === other.id}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium disabled:opacity-40"
                            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}
                            title={`Keep this row; merge ${other.email ?? 'duplicate'} into it`}
                          >
                            <Merge size={11} /> Keep this &middot; merge {(other.email ?? '').split('@')[0].slice(0, 12) || '…'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
