'use client'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { commandRequest, type CommandSession } from '@/lib/classroom-command'

export type PresentationEvent = { type: 'session' | 'tools' | 'activity' | 'sync' }
type Listener = { event: (event: PresentationEvent) => void; connection: (ready: boolean) => void }
type Credentials = { realtime: { url: string; key: string; topic: string } | null }
const connections = new Map<string, { listeners: Set<Listener>; stop: () => void; ready: boolean }>()

/** Share one notification connection per session across the presenter and teaching hooks. */
export function watchPresentation(id: string, event: Listener['event'], connection: Listener['connection'] = () => {}) {
  let entry = connections.get(id)
  const listener = { event, connection }
  if (!entry) {
    let active = true
    let client: SupabaseClient | undefined
    let timer: ReturnType<typeof setTimeout>
    const abort = new AbortController()
    const listeners = new Set<Listener>()
    const current = { listeners, ready: false, stop: () => { active = false; abort.abort(); clearTimeout(timer); void client?.removeAllChannels() } }
    entry = current; connections.set(id, current)
    const emit = (value: PresentationEvent) => { if (active) for (const l of listeners) l.event(value) }
    const status = (ready: boolean) => { current.ready = ready; if (active) for (const l of listeners) l.connection(ready) }
    const connect = async () => {
      try {
        const { realtime } = await commandRequest<Credentials>(`/api/present/sessions/${id}/realtime`, { signal: abort.signal })
        if (!active) return
        if (!realtime) { status(false); return }
        if (!client) {
          client = createClient(realtime.url, realtime.key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
          if (!active) return
          client.channel(realtime.topic)
            .on('broadcast', { event: 'session' }, () => emit({ type: 'session' }))
            .on('broadcast', { event: 'tools' }, () => emit({ type: 'tools' }))
            .on('broadcast', { event: 'activity' }, () => emit({ type: 'activity' }))
            .subscribe(value => { status(value === 'SUBSCRIBED'); if (value === 'SUBSCRIBED') emit({ type: 'sync' }) })
        }
      } catch { status(false) }
      finally { if (active) timer = setTimeout(connect, 4 * 60 * 1000) }
    }
    void connect()
  }
  entry.listeners.add(listener); connection(entry.ready)
  const owned = entry
  return () => { owned.listeners.delete(listener); if (!owned.listeners.size) { owned.stop(); connections.delete(id) } }
}

/** Revisions prevent late poll responses / reconnect messages undoing a newer command. */
export function newerSession(next: CommandSession, previous?: CommandSession | null) {
  if (!previous || next.id !== previous.id) return true
  if (next.command_revision != null && previous.command_revision != null) return next.command_revision >= previous.command_revision
  return !next.updated_at || !previous.updated_at || next.updated_at >= previous.updated_at
}
