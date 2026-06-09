import { useEffect, useState } from 'react'

// A tiny client-side translation layer for the math warm-up. Any visible string
// flows through `t(s)`; unknown strings are batched (one debounced AI call),
// cached per language in memory + localStorage, and components re-render when the
// translations arrive. Words only — the endpoint preserves numbers/equations.
//
//   const t = useTranslator(active ? lang : '')   // '' = show English (no-op)
//   <span>{t('Today's problem')}</span>

const cache: Record<string, Record<string, string>> = {}
const pending: Record<string, Set<string>> = {}
const scheduled: Record<string, boolean> = {}
const subscribers = new Set<() => void>()
const notify = () => subscribers.forEach((f) => f())
const hasLetters = (s: string) => /\p{L}/u.test(s)

function loadCache(lang: string) {
  if (cache[lang]) return
  try { const c = localStorage.getItem(`mtr:${lang}`); cache[lang] = c ? JSON.parse(c) : {} } catch { cache[lang] = {} }
}

async function flush(lang: string) {
  const set = pending[lang]
  if (!set || set.size === 0) return
  const texts = [...set]
  pending[lang] = new Set()
  loadCache(lang)
  try {
    const res = await fetch('/api/math-spine/translate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, lang }),
    })
    const d = res.ok ? ((await res.json()) as { map?: Record<string, string> }) : null
    for (const tx of texts) cache[lang][tx] = d?.map?.[tx] ?? tx // fallback to original (prevents refetch loops)
  } catch {
    for (const tx of texts) cache[lang][tx] = tx
  }
  try { localStorage.setItem(`mtr:${lang}`, JSON.stringify(cache[lang])) } catch {}
  notify()
}

function translate(lang: string, s: string): string {
  if (!lang || !s || !hasLetters(s)) return s
  loadCache(lang)
  if (cache[lang][s] !== undefined) return cache[lang][s]
  pending[lang] = pending[lang] || new Set()
  pending[lang].add(s)
  if (!scheduled[lang]) {
    scheduled[lang] = true
    setTimeout(() => { scheduled[lang] = false; void flush(lang) }, 60)
  }
  return s
}

/** Returns a `t` that translates into `lang` (or returns the input when lang is ''). */
export function useTranslator(lang: string): (s: string) => string {
  const [, force] = useState(0)
  useEffect(() => {
    const f = () => force((n) => n + 1)
    subscribers.add(f)
    return () => { subscribers.delete(f) }
  }, [])
  return (s: string) => (lang ? translate(lang, s) : s)
}
