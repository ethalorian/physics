'use client'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useSession } from 'next-auth/react'
import type { VocabularyTerm } from '@/types/assignment'
import { UUID } from '@/lib/vocab-learning'
import { useVocabSei } from './VocabSei'
interface Pending {
 event_id: string; term_id: string; correct: boolean; ms?: number
 occurred_at: string; l1_shown: boolean; support_level: string
}
/** User-scoped, acknowledged outbox. Late responses cannot mutate a new user's queue. */
export function useVocabAttempts(_setId: string | null | undefined, game: string) {
 const { data: session } = useSession()
 const sei = useVocabSei(), state = useRef(sei)
 state.current = sei
 const owner = session?.user?.id
 const key = owner ? `vocab:outbox:${owner}:${game}` : null
 const outbox = useMemo(() => ({ key, events: [] as Pending[], sending: false }), [key])
 const readStored = useCallback((): Pending[] => {
  if (!key) return []
  try {
   const rows = JSON.parse(localStorage.getItem(key) ?? '[]')
   return Array.isArray(rows) ? rows.filter(r => r && typeof r.event_id === 'string' && UUID.test(r.term_id) && typeof r.correct === 'boolean') : []
  } catch { return [] }
 }, [key])
 const persist = useCallback((acknowledged: string[] = []) => {
  const removed = new Set(acknowledged)
  outbox.events = [...new Map([...readStored(), ...outbox.events].filter(a => !removed.has(a.event_id)).map(a => [a.event_id, a])).values()]
  if (key) { try { localStorage.setItem(key, JSON.stringify(outbox.events)) } catch { /* memory queue stays until acknowledged */ } }
 }, [key, outbox, readStored])
 const flush = useCallback(async () => {
  if (!key || outbox.sending) return
  persist()
  if (!outbox.events.length) return
  outbox.sending = true
  const batch = outbox.events.slice(0, 100)
  try {
   const r = await fetch('/api/vocab/attempts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ owner_id: owner, game, attempts: batch }), keepalive: true })
   if (!r.ok) throw new Error('save')
   const ack = await r.json() as { recorded?: number; skipped?: string }
   if (ack.recorded !== batch.length && !ack.skipped) throw new Error('ack')
   persist(batch.map(a => a.event_id))
   window.dispatchEvent(new CustomEvent('vocab-save-status', { detail: outbox.events.length ? 'Saving word practice…' : 'Word practice saved' }))
  } catch {
   window.dispatchEvent(new CustomEvent('vocab-save-status', { detail: 'Word practice waiting to save. We will retry when connected.' }))
  } finally { outbox.sending = false }
 }, [key, owner, game, outbox, persist])
 const record = useCallback((term: Pick<VocabularyTerm, 'id'> | null | undefined, correct: boolean, ms?: number, eventId?: string) => {
  if (!term?.id || !UUID.test(term.id) || !owner) return
  const event_id = eventId ?? crypto.randomUUID()
  outbox.events.push({ event_id, term_id: term.id, correct, ms, occurred_at: new Date().toISOString(), l1_shown: state.current.showL1, support_level: state.current.level })
  persist()
 }, [owner, outbox, persist])
 useEffect(() => {
  void flush()
  const timer = window.setInterval(() => void flush(), 4000)
  const save = () => { persist(); void flush() }
  window.addEventListener('online', save); window.addEventListener('pagehide', save)
  return () => { clearInterval(timer); window.removeEventListener('online', save); window.removeEventListener('pagehide', save); save() }
 }, [flush, persist])
 return { record, flush }
}
