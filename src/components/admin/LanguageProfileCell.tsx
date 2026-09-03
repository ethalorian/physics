"use client"

import { useEffect, useState } from 'react'
import type { LanguageProfile } from '@/lib/sei'

/**
 * Roster cell: the teacher sets a student's language profile — WIDA composite
 * (1–6), home language, and whether the L1 rendering is on by default. This is
 * the ONLY input to the SEI level dial; it is never read by mastery.
 */
const LANGS: { id: string; label: string }[] = [
  { id: '', label: '—' }, { id: 'es', label: 'Español' }, { id: 'pt', label: 'Português' }, { id: 'ht', label: 'Kreyòl' },
  { id: 'ar', label: 'العربية' }, { id: 'zh', label: '中文' }, { id: 'vi', label: 'Tiếng Việt' }, { id: 'fr', label: 'Français' },
]

export default function LanguageProfileCell({ userId }: { userId: string }) {
  const [p, setP] = useState<LanguageProfile | null>(null)
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    let active = true
    fetch(`/api/language-profile?user_id=${encodeURIComponent(userId)}`).then((r) => (r.ok ? r.json() : null)).then((d: { profile?: LanguageProfile } | null) => {
      if (active && d?.profile) setP(d.profile)
    }).catch(() => {})
    return () => { active = false }
  }, [userId])

  const save = async (patch: { wida?: number | null; home_lang?: string | null; l1_default?: boolean }) => {
    setState('saving')
    try {
      const r = await fetch('/api/language-profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, ...patch }) })
      const d = (await r.json()) as { profile?: LanguageProfile; error?: string }
      if (!r.ok || !d.profile) throw new Error(d.error ?? 'save failed')
      setP(d.profile); setState('saved'); setTimeout(() => setState('idle'), 1200)
    } catch { setState('error') }
  }

  const sel = 'rounded-md border px-1.5 py-1 text-xs'
  const style = { borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }
  const level = p?.wida ? (p.wida <= 2 ? 'full' : p.wida <= 4 ? 'partial' : 'bare') : 'bare'
  return (
    <div className="flex items-center gap-1.5" title="WIDA composite (1–6) · home language · show home language by default. Sets the scaffold level; never read by mastery.">
      <select value={p?.wida ?? ''} onChange={(e) => save({ wida: e.target.value ? Number(e.target.value) : null })} className={sel} style={style} aria-label="WIDA level">
        <option value="">WIDA —</option>
        {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>WIDA {n}</option>)}
      </select>
      <select value={p?.homeLang ?? ''} onChange={(e) => save({ home_lang: e.target.value || null })} className={sel} style={style} aria-label="Home language">
        {LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
      </select>
      <label className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
        <input type="checkbox" checked={Boolean(p?.l1Default)} onChange={(e) => save({ l1_default: e.target.checked })} disabled={!p?.homeLang} /> L1 on
      </label>
      <span className="text-[10px] rounded px-1.5 py-0.5" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>
        {state === 'saving' ? 'saving…' : state === 'saved' ? 'saved ✓' : state === 'error' ? 'error' : level}
      </span>
    </div>
  )
}
