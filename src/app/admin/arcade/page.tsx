"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Joystick, CheckCircle2, AlertTriangle, Coins } from 'lucide-react'

/**
 * Arcade cabinet controls (staff only).
 *
 * One row per cabinet: power toggle, coin price, and — the column that
 * exists because of a hard lesson — FILE status. A cabinet row lives in the
 * database (instant); its game file lives in public/ (ships with the next
 * deploy). This panel HEAD-checks every file so you can see the gap:
 * never enable a cabinet whose file shows MISSING.
 */

type Cab = {
  slug: string; name: string; unit: string | null; accent: string | null
  cost_xp: number; enabled: boolean; sort_order: number; src_path: string
}

export default function AdminArcadePage() {
  const [games, setGames] = useState<Cab[]>([])
  const [files, setFiles] = useState<Record<string, boolean | null>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch('/api/admin/arcade')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Staff access required'))))
      .then((d) => {
        const gs = d.games as Cab[]
        setGames(gs)
        for (const g of gs) {
          fetch(g.src_path, { method: 'HEAD' })
            .then((r) => setFiles((f) => ({ ...f, [g.slug]: r.ok })))
            .catch(() => setFiles((f) => ({ ...f, [g.slug]: false })))
        }
      })
      .catch((e) => setErr(e.message))
  }, [])

  const patch = async (slug: string, body: { enabled?: boolean; cost_xp?: number }) => {
    setBusy(slug)
    const r = await fetch('/api/admin/arcade', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, ...body }),
    })
    setBusy(null)
    if (r.ok) {
      const d = await r.json()
      setGames((gs) => gs.map((g) => g.slug === slug ? { ...g, ...d.game } : g))
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-5" style={{ color: 'var(--foreground)' }}>
      <div className="flex items-center gap-3 mt-2 mb-1">
        <Link href="/admin/home" className="flex items-center gap-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          <ArrowLeft size={16} /> Admin
        </Link>
        <div className="grid place-items-center" style={{ width: 40, height: 40, borderRadius: 10, background: 'color-mix(in oklch, var(--primary) 16%, transparent)', color: 'var(--primary)' }}>
          <Joystick size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Arcade cabinets</h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Power, pricing, and deploy status. Rule of thumb: never power a cabinet whose file is missing.
          </p>
        </div>
      </div>

      {err && <p className="text-sm mt-4" style={{ color: 'var(--destructive)' }}>{err}</p>}

      <div className="mt-5 grid gap-3">
        {games.map((g) => {
          const accent = g.accent || 'var(--primary)'
          const file = files[g.slug] // true | false | undefined(=checking)
          return (
            <div key={g.slug} className="rounded-2xl border p-4 flex items-center gap-4 flex-wrap"
              style={{ borderColor: 'var(--border)', background: 'var(--card)', boxShadow: `inset 3px 0 0 ${accent}`, opacity: g.enabled ? 1 : 0.75 }}>
              <div className="flex-1 min-w-[160px]">
                <div className="font-bold tracking-wide" style={{ color: accent }}>{g.name}</div>
                <div className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>{g.unit}</div>
              </div>

              {/* file/deploy status — the column today's bug paid for */}
              <div className="flex items-center gap-1.5 text-xs min-w-[120px]"
                style={{ color: file === true ? 'var(--success, #22c55e)' : file === false ? 'var(--destructive, #ef4444)' : 'var(--muted-foreground)' }}>
                {file === true ? <CheckCircle2 size={15} /> : file === false ? <AlertTriangle size={15} /> : null}
                {file === true ? 'file deployed' : file === false ? 'FILE MISSING — deploy first' : 'checking…'}
              </div>

              {/* coin price */}
              <label className="flex items-center gap-1.5 text-sm">
                <Coins size={14} style={{ color: accent }} />
                <input
                  type="number" min={0} max={500} defaultValue={g.cost_xp}
                  onBlur={(e) => { const v = parseInt(e.target.value, 10); if (Number.isFinite(v) && v !== g.cost_xp) patch(g.slug, { cost_xp: v }) }}
                  className="w-16 rounded-lg border px-2 py-1 text-sm"
                  style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                />
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>XP</span>
              </label>

              {/* the toggle */}
              <button
                onClick={() => patch(g.slug, { enabled: !g.enabled })}
                disabled={busy === g.slug}
                aria-label={g.enabled ? 'Disable ' + g.name : 'Enable ' + g.name}
                className="relative rounded-full transition-colors"
                style={{
                  width: 52, height: 28, border: 'none', cursor: 'pointer',
                  background: g.enabled ? 'var(--success, #22c55e)' : 'var(--muted, #374151)',
                  opacity: busy === g.slug ? 0.5 : 1,
                }}
              >
                <span className="absolute rounded-full transition-all"
                  style={{ top: 3, left: g.enabled ? 27 : 3, width: 22, height: 22, background: '#fff' }} />
              </button>
              <span className="text-xs w-8" style={{ color: g.enabled ? 'var(--success, #22c55e)' : 'var(--muted-foreground)' }}>
                {g.enabled ? 'ON' : 'OFF'}
              </span>
            </div>
          )
        })}
      </div>

      {games.length > 0 && (
        <p className="text-xs mt-5" style={{ color: 'var(--muted-foreground)' }}>
          Changes are live for students immediately. A cabinet that is ON but FILE MISSING shows students a
          “cabinet being installed” screen (no XP charged) — fine for an hour, embarrassing for a week.
        </p>
      )}
    </div>
  )
}
