"use client"

/**
 * VocabSei — the SEI layer for the vocabulary arcade (SEI-1…SEI-10 applied to games).
 *
 * The games are where the ENGLISH word is the content, so the language load moves
 * differently than in a lesson: the target is still the English term, but the CLUE
 * can be carried by a picture and by Spanish. Three things, all driven by the same
 * language profile + dial the lesson reader uses (LanguageProfileProvider):
 *
 *   picture   — every term card shows its icon (vocabulary_terms.icon) at every level.
 *               A picture that carries the meaning is the WIDA-1 route; it costs nothing
 *               for anyone else.
 *   L1        — with the student's home language on, a term card also shows the Spanish
 *               equivalent (cognate ≈ / false friend ≠) and a definition card also shows
 *               the Spanish definition. Spanish is the clue, English is the answer.
 *   time      — timed games stretch their clocks at full support (×1.6) and partial (×1.3).
 *               A Level-1 student reading a clue twice is not slower at physics.
 *   say it    — a speaker button reads the English term aloud (browser TTS, en-US) so an
 *               Entering student hears the word they are matching.
 *
 * Games call useVocabSei() for {showL1, level, timeScale, speak} and render terms through
 * <TermLabel> / <DefinitionLabel> so every cabinet gets the same route.
 */
import { useCallback } from 'react'
import { Volume2 } from 'lucide-react'
import type { VocabularyTerm } from '@/types/assignment'
import type { ScaffoldLevel } from '@/lib/sei'
import { levelForWida } from '@/lib/sei'
import { useLanguageProfile } from '@/components/lessons/LanguageProfileProvider'

export function useVocabSei() {
  const { profile, dial, showL1 } = useLanguageProfile()
  const base = levelForWida(profile?.wida)
  const level: ScaffoldLevel = dial && rank(dial) > rank(base) ? dial : base
  const timeScale = level === 'full' ? 1.6 : level === 'partial' ? 1.3 : 1
  const speak = useCallback((text: string) => {
    try {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'en-US'; u.rate = 0.85
      window.speechSynthesis.speak(u)
    } catch { /* no TTS on this device */ }
  }, [])
  return { level, showL1: showL1 && Boolean(profile?.homeLang), homeLang: profile?.homeLang ?? null, timeScale, speak }
}
function rank(l: ScaffoldLevel) { return l === 'bare' ? 0 : l === 'partial' ? 1 : 2 }

/** The English term with its picture, its Spanish beneath when L1 is on, and a say-it button. */
export function TermLabel({ term, size = 'md', speakable = true, className = '' }: { term: VocabularyTerm; size?: 'sm' | 'md' | 'lg'; speakable?: boolean; className?: string }) {
  const { showL1, speak } = useVocabSei()
  const iconSize = size === 'lg' ? 34 : size === 'md' ? 24 : 18
  return (
    <span className={`inline-flex items-center gap-2 min-w-0 ${className}`}>
      {term.icon && <span aria-hidden style={{ fontSize: iconSize, lineHeight: 1 }}>{term.icon}</span>}
      <span className="min-w-0">
        <span className="block truncate">{term.term}</span>
        {showL1 && term.cognate && <span className="block text-xs font-normal opacity-75 truncate">{term.cognate}</span>}
      </span>
      {speakable && (
        <button type="button" aria-label={`Say ${term.term}`} title="Say it · Escúchalo"
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); speak(term.term) }}
          className="shrink-0 rounded-full p-1 opacity-60 hover:opacity-100" style={{ minWidth: 28, minHeight: 28 }}>
          <Volume2 size={14} />
        </button>
      )}
    </span>
  )
}

/** The English definition, with the Spanish definition beneath when L1 is on. */
export function DefinitionLabel({ term, className = '' }: { term: VocabularyTerm; className?: string }) {
  const { showL1 } = useVocabSei()
  return (
    <span className={`block ${className}`}>
      <span className="block">{term.definition}</span>
      {showL1 && term.definitionEs && <span className="block text-xs opacity-75 mt-0.5">{term.definitionEs}</span>}
    </span>
  )
}

/** Plain-string helpers for games that render into canvas / non-JSX surfaces. */
export function clueText(term: VocabularyTerm, showL1: boolean): string {
  const icon = term.icon ? `${term.icon} ` : ''
  return showL1 && term.definitionEs ? `${icon}${term.definition} · ${term.definitionEs}` : `${icon}${term.definition}`
}
