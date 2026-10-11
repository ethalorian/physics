'use client'
import { useCallback, useEffect, useState } from 'react'
import type { TextbookLanguage } from '@/data/textbook'
import { parseTextbookLanguage, TEXTBOOK_LANGUAGE_KEY, TEXTBOOK_LANGUAGE_NAMES, textbookLanguageTag } from '@/lib/textbook-language'

const EVENT = 'textbook-language-change'
export function useTextbookLanguage(requested?: string | null) {
  const [language, setLanguage] = useState<TextbookLanguage>(parseTextbookLanguage(requested) ?? 'en')
  const change = useCallback((next: TextbookLanguage) => {
    setLanguage(next)
    try { localStorage.setItem(TEXTBOOK_LANGUAGE_KEY, next) } catch {}
    window.dispatchEvent(new CustomEvent(EVENT, { detail: next }))
  }, [])
  useEffect(() => {
    const explicit = parseTextbookLanguage(requested)
    if (explicit) change(explicit)
    else { try { setLanguage(parseTextbookLanguage(localStorage.getItem(TEXTBOOK_LANGUAGE_KEY)) ?? 'en') } catch {} }
  }, [requested, change])
  useEffect(() => {
    const receive = (event: Event) => {
      const next = event instanceof StorageEvent ? (event.key === TEXTBOOK_LANGUAGE_KEY ? event.newValue : null) : (event as CustomEvent).detail
      const parsed = parseTextbookLanguage(next)
      if (parsed) setLanguage(parsed)
    }
    window.addEventListener(EVENT, receive)
    window.addEventListener('storage', receive)
    return () => { window.removeEventListener(EVENT, receive); window.removeEventListener('storage', receive) }
  }, [])
  return [language, change] as const
}

export default function TextbookLanguageToggle({ language, onChange }: { language: TextbookLanguage; onChange: (language: TextbookLanguage) => void }) {
  return <div role="group" aria-label="Textbook language / Idioma del libro / Idioma do livro" className="inline-flex flex-wrap rounded-lg border border-border p-1 bg-card gap-1">
    {(['en', 'es', 'pt'] as const).map(value => <button type="button" key={value} lang={textbookLanguageTag(value)} aria-pressed={value === language}
      onClick={() => onChange(value)} className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${value === language ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'}`}>
      {TEXTBOOK_LANGUAGE_NAMES[value]}
    </button>)}
  </div>
}
