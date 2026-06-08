"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'

type Area = string
interface Collaborator { email: string; areas: Area[] }

const AREA_LABEL: Record<string, string> = {
  lessons: 'Lessons',
  simulations: 'Simulations',
  vocabulary: 'Vocabulary',
  reading: 'Reading',
  question_bank: 'Question bank',
}

export default function CollaboratorManager() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [newEmail, setNewEmail] = useState('')

  const load = useCallback(() => {
    fetch('/api/admin/collaborators')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setMsg(d.error)
        else { setCollaborators(d.collaborators ?? []); setAreas(d.areas ?? []) }
        setLoading(false)
      })
      .catch(() => { setMsg('Could not load collaborators'); setLoading(false) })
  }, [])
  useEffect(() => { load() }, [load])

  const toggle = async (email: string, area: Area, grant: boolean) => {
    const key = `${email}|${area}`
    setBusy(key); setMsg(null)
    // optimistic
    setCollaborators((prev) => prev.map((c) =>
      c.email === email ? { ...c, areas: grant ? [...new Set([...c.areas, area])] : c.areas.filter((a) => a !== area) } : c,
    ))
    try {
      const res = await fetch('/api/admin/collaborators', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, area, grant }),
      })
      const d = await res.json()
      if (!res.ok) { setMsg(d.error || 'Could not save'); load() }
    } catch { setMsg('Could not save'); load() } finally { setBusy(null) }
  }

  const addPerson = () => {
    const email = newEmail.trim().toLowerCase()
    setMsg(null)
    if (!email.includes('@')) { setMsg('Enter a valid email'); return }
    if (collaborators.some((c) => c.email === email)) { setMsg('That person is already listed'); return }
    setCollaborators((prev) => [...prev, { email, areas: [] }])
    setNewEmail('')
  }

  const sorted = useMemo(() => [...collaborators].sort((a, b) => a.email.localeCompare(b.email)), [collaborators])

  return (
    <div style={{ color: 'var(--foreground)' }}>
      <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
        Collaborators can edit only the curriculum areas you check below — nothing else. You and other admins always edit everything;
        teachers (without a grant) can assign curriculum but never author it. The email must match the person&apos;s Google sign-in.
      </p>

      {/* add a person */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <input
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addPerson() }}
          placeholder="colleague@school.org"
          className="rounded-lg text-sm px-3 py-2"
          style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', minWidth: 260 }}
        />
        <button
          onClick={addPerson}
          className="text-sm font-semibold rounded-lg px-3 py-2"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}
        >
          Add collaborator
        </button>
      </div>

      {msg && <div className="text-sm rounded-md px-3 py-2 mb-3" style={{ background: 'var(--secondary)', color: 'var(--foreground)' }}>{msg}</div>}
      {loading && <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading…</p>}

      {!loading && sorted.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          No collaborators yet. Add someone above, then check the areas they may edit.
        </p>
      )}

      {sorted.length > 0 && (
        <div className="rounded-xl border overflow-x-auto" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 12, color: 'var(--muted-foreground)', fontWeight: 600 }}>Collaborator</th>
                {areas.map((a) => (
                  <th key={a} style={{ padding: '10px 12px', fontSize: 12, color: 'var(--muted-foreground)', fontWeight: 600, textAlign: 'center', minWidth: 96 }}>
                    {AREA_LABEL[a] ?? a}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr key={c.email} style={{ borderBottom: '0.5px solid var(--border)' }}>
                  <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {c.email}
                    {c.areas.length === 0 && <span className="text-xs" style={{ color: 'var(--muted-foreground)', marginLeft: 8 }}>· no areas yet</span>}
                  </td>
                  {areas.map((a) => {
                    const has = c.areas.includes(a)
                    const key = `${c.email}|${a}`
                    return (
                      <td key={a} style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={has}
                          disabled={busy === key}
                          onChange={(e) => toggle(c.email, a, e.target.checked)}
                          style={{ width: 18, height: 18, accentColor: 'var(--primary)', cursor: busy === key ? 'wait' : 'pointer' }}
                          aria-label={`${AREA_LABEL[a] ?? a} for ${c.email}`}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs mt-3" style={{ color: 'var(--muted-foreground)' }}>
        Unchecking every area removes that person&apos;s access entirely. Changes take effect on their next page load.
      </p>
    </div>
  )
}
