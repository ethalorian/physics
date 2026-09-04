"use client"

/**
 * useVocabAttempts — per-WORD evidence from a vocabulary game.
 *
 * Every game already knows, word by word, whether the student got it. This hook
 * batches those moments and posts them to /api/vocab/attempts stamped with the SEI
 * state that was on (Spanish clue showing? support level?), so the teacher's grid can
 * say not just "knows displacement" but "knows displacement with the Spanish beside it"
 * vs "knows it bare". Flushes every 4 s, on game end (flush()), and on unmount.
 * Never blocks play; a failed post is dropped silently.
 */
import { useCallback, useEffect, useRef } from 'react'
import type { VocabularyTerm } from '@/types/assignment'
import { useVocabSei } from './VocabSei'

interface Pending { term_id: string; correct: boolean; ms?: number }

export function useVocabAttempts(setId: string | null | undefined, game: string) {
  const sei = useVocabSei()
  const queue = useRef<Pending[]>([])
  const timer = useRef<number | null>(null)
  const seiRef = useRef(sei)
  seiRef.current = sei

  const flush = useCallback(() => {
    if (timer.current) { window.clearTimeout(timer.current); timer.current = null }
    const attempts = queue.current.splice(0, queue.current.length)
    if (attempts.length === 0) return
    const body = JSON.stringify({ set_id: setId ?? null, game, l1_shown: seiRef.current.showL1, support_level: seiRef.current.level, attempts })
    try {
      if (navigator.sendBeacon) navigator.sendBeacon('/api/vocab/attempts', new Blob([body], { type: 'application/json' }))
      else void fetch('/api/vocab/attempts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true })
    } catch { /* dropped */ }
  }, [setId, game])

  const record = useCallback((term: Pick<VocabularyTerm, 'id'> | null | undefined, correct: boolean, ms?: number) => {
    if (!term?.id) return
    queue.current.push({ term_id: term.id, correct, ms })
    if (!timer.current) timer.current = window.setTimeout(flush, 4000)
  }, [flush])

  useEffect(() => () => flush(), [flush])
  return { record, flush }
}
