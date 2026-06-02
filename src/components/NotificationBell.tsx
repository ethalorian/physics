"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { Bell, Star, FileText, Swords, Clock, Sigma, type LucideIcon } from 'lucide-react'

interface Notif {
  id: string
  type: 'mastery' | 'grade' | 'math' | 'duel' | 'due'
  title: string
  detail: string
  at: string
  href: string
  unread: boolean
}

const ICON: Record<Notif['type'], LucideIcon> = { mastery: Star, grade: FileText, math: Sigma, duel: Swords, due: Clock }
const TINT: Record<Notif['type'], string> = {
  mastery: 'var(--reward)', grade: 'var(--success)', math: 'var(--primary)', duel: 'var(--primary)', due: 'var(--destructive)',
}

function ago(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 0) return new Date(iso).toLocaleDateString()
  const m = Math.floor(ms / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return d < 7 ? `${d}d ago` : new Date(iso).toLocaleDateString()
}

export default function NotificationBell() {
  const [items, setItems] = useState<Notif[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const load = useCallback(() => {
    fetch('/api/notifications')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) { setItems(d.items ?? []); setUnread(d.unread ?? 0) } })
      .catch(() => {})
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [load])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const toggle = async () => {
    const next = !open
    setOpen(next)
    if (next && unread > 0) {
      setUnread(0)
      setItems((xs) => xs.map((i) => ({ ...i, unread: false })))
      await fetch('/api/notifications', { method: 'POST' }).catch(() => {})
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        aria-label={unread > 0 ? `Notifications, ${unread} new` : 'Notifications'}
        className="relative h-9 w-9 grid place-items-center rounded-full hover:bg-muted transition-colors"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold grid place-items-center"
            style={{ background: 'var(--destructive)', color: '#fff' }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden"
          style={{ boxShadow: '0 12px 40px color-mix(in oklch, var(--primary) 14%, transparent)' }}
        >
          <div className="px-4 py-3 border-b border-border text-sm font-semibold">Notifications</div>
          <div className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">You&apos;re all caught up.</div>
            ) : (
              items.map((n) => {
                const Icon = ICON[n.type] ?? Bell
                return (
                  <Link
                    key={n.id}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <span className="mt-0.5 shrink-0" style={{ color: TINT[n.type] }}><Icon className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground flex items-center gap-2">
                        {n.title}
                        {n.unread && <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: 'var(--destructive)' }} />}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{n.detail}</div>
                      <div className="text-[11px] text-muted-foreground/70 mt-0.5">{ago(n.at)}</div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
