"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { LanguageProfile, ScaffoldLevel } from '@/lib/sei'
import { levelForWida } from '@/lib/sei'

/**
 * The student's language profile + their own scaffold dial, shared by every
 * block on the page. Fetched once per lesson view. The dial can only ADD
 * support over the teacher-set level (see effectiveLevel in lib/sei.ts) and is
 * remembered per browser so a student who turned frames on keeps them on.
 */
interface Ctx {
  profile: LanguageProfile | null
  loaded: boolean
  /** Student's own choice; null = follow the profile. */
  dial: ScaffoldLevel | null
  setDial: (d: ScaffoldLevel | null) => void
  /** Show the L1 rendering (student toggle; defaults from the profile). */
  showL1: boolean
  setShowL1: (v: boolean) => void
}

const LanguageProfileContext = createContext<Ctx>({
  profile: null, loaded: false, dial: null, setDial: () => {}, showL1: false, setShowL1: () => {},
})

const DIAL_KEY = 'sei-dial'
const L1_KEY = 'sei-l1'

export function LanguageProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<LanguageProfile | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [dial, setDialState] = useState<ScaffoldLevel | null>(null)
  const [showL1, setShowL1State] = useState(false)

  useEffect(() => {
    let active = true
    try {
      const d = localStorage.getItem(DIAL_KEY)
      if (d === 'full' || d === 'partial' || d === 'bare') setDialState(d)
      const l1 = localStorage.getItem(L1_KEY)
      if (l1 === '1') setShowL1State(true)
      if (l1 === '0') setShowL1State(false)
    } catch { /* storage unavailable */ }
    fetch('/api/language-profile')
      .then((r) => (r.ok ? r.json() : { profile: null }))
      .then((d: { profile?: LanguageProfile | null }) => {
        if (!active) return
        const p = d.profile ?? null
        setProfile(p)
        // L1 defaults from the profile unless the student has chosen.
        try { if (localStorage.getItem(L1_KEY) === null && p?.l1Default) setShowL1State(true) } catch { if (p?.l1Default) setShowL1State(true) }
        setLoaded(true)
      })
      .catch(() => { if (active) setLoaded(true) })
    return () => { active = false }
  }, [])

  const setDial = useCallback((d: ScaffoldLevel | null) => {
    setDialState(d)
    try { if (d) localStorage.setItem(DIAL_KEY, d); else localStorage.removeItem(DIAL_KEY) } catch { /* ignore */ }
  }, [])
  const setShowL1 = useCallback((v: boolean) => {
    setShowL1State(v)
    try { localStorage.setItem(L1_KEY, v ? '1' : '0') } catch { /* ignore */ }
    // Remember the preference on the profile too (students may set only this field).
    fetch('/api/language-profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ l1_default: v }) }).catch(() => {})
  }, [])

  const value = useMemo(() => ({ profile, loaded, dial, setDial, showL1, setShowL1 }), [profile, loaded, dial, setDial, showL1, setShowL1])
  return <LanguageProfileContext.Provider value={value}>{children}</LanguageProfileContext.Provider>
}

export function useLanguageProfile() { return useContext(LanguageProfileContext) }

/**
 * The visible dial (principle 7): the student sees which level they are on and
 * can add support. Rendered in the lesson header. Nothing here touches grading.
 */
export function LanguageDial() {
  const { profile, dial, setDial, showL1, setShowL1 } = useLanguageProfile()
  const base = levelForWida(profile?.wida)
  const current: ScaffoldLevel = dial ?? base
  const opts: { id: ScaffoldLevel; label: string; hint: string }[] = [
    { id: 'full', label: 'Full support', hint: 'Frames, word bank, pictures, home language' },
    { id: 'partial', label: 'Some support', hint: 'Open frames and word bank' },
    { id: 'bare', label: 'Just the prompt', hint: 'Frames available on request' },
  ]
  const canGoBelowBase = false // the teacher's level is a floor; students only add support
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs" aria-label="Language support">
      <span style={{ color: 'var(--muted-foreground)' }}>Language support · Apoyo de lenguaje</span>
      <div className="inline-flex rounded-full border p-0.5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        {opts.map((o) => {
          const on = o.id === current
          const disabled = !canGoBelowBase && rank(o.id) < rank(base)
          return (
            <button key={o.id} type="button" title={o.hint} disabled={disabled}
              onClick={() => setDial(o.id === base ? null : o.id)}
              className="rounded-full px-2.5 py-1 disabled:opacity-40"
              style={{ background: on ? 'var(--primary)' : 'transparent', color: on ? 'var(--primary-foreground)' : 'var(--foreground)', fontWeight: on ? 700 : 500 }}>
              {o.label}
            </button>
          )
        })}
      </div>
      {profile?.homeLang && (
        <label className="inline-flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={showL1} onChange={(e) => setShowL1(e.target.checked)} />
          <span>{LANG_LABEL[profile.homeLang] ?? profile.homeLang}</span>
        </label>
      )}
      <span style={{ color: 'var(--muted-foreground)' }}>Rated on the physics, not the English.</span>
    </div>
  )
}

function rank(l: ScaffoldLevel) { return l === 'bare' ? 0 : l === 'partial' ? 1 : 2 }
const LANG_LABEL: Record<string, string> = { es: 'Español', pt: 'Português', ht: 'Kreyòl', ar: 'العربية', zh: '中文', vi: 'Tiếng Việt', fr: 'Français' }
