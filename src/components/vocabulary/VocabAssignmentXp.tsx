'use client'
import { useEffect, useState } from 'react'

export default function VocabAssignmentXp({ taskId, refreshKey = '' }: { taskId: string; refreshKey?: string }) {
  const [receipt, setReceipt] = useState<{ earned?: number; preview?: boolean; available:number } | null>(null)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setError(false)
    setReceipt(null)
    fetch(`/api/vocab/xp?task_id=${encodeURIComponent(taskId)}`, { signal: controller.signal, cache: 'no-store' })
      .then(async r => { const d = await r.json(); if (!r.ok || !d.preview && !Number.isFinite(d.earned)) throw new Error('XP unavailable'); return d })
      .then(d => { if (!controller.signal.aborted) { setReceipt(d); if (d.earned > 0) window.dispatchEvent(new CustomEvent('xp-updated')) } })
      .catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [taskId, refreshKey, retry])
  return <div role="status" className="rounded-xl border border-border bg-muted p-4 text-sm space-y-1">
    {error ? <><p>Your answers are saved separately. The XP receipt could not load.</p><button className="min-h-11 underline" onClick={() => setRetry(n => n + 1)}>Retry XP receipt</button></>
      : !receipt ? <p>Checking assignment XP…</p>
      : !receipt.available ? <p>This assignment does not earn unit XP.{!!receipt.earned && ' Previously earned wallet XP is kept.'}</p> : receipt.preview ? <p>Student reward: {receipt.available} XP for the first completed assignment check.</p>
      : receipt.earned ? <><strong>{receipt.earned} XP credited for this assignment</strong><p>This award counts toward your XP total and term requirement. Repeat checks and retakes do not award it again.</p></>
      : <><strong>Earn {receipt.available} XP for your first completed assignment check</strong><p>Once per assignment, separate from the vocabulary game daily limit. Your teacher rates mastery separately.</p></>}
  </div>
}
