"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, BookOpen, GraduationCap, type LucideIcon } from 'lucide-react'
import type { Tool } from './adminNav'

interface CommandItem {
  key: string
  label: string
  desc: string
  href: string
  icon: LucideIcon
  accent: string
  group: string
}

type SearchIndex = {
  lessons: { id: string; slug: string | null; title: string; published: boolean }[]
  students: { id: string; name: string | null; email: string | null }[]
}

/**
 * Global search / command palette for the admin shell. Opens on ⌘K / Ctrl+K (or
 * the header button). Empty query is a fast tool launcher; typing also searches
 * lessons and students, lazily fetched once from /api/admin/search (role-scoped
 * server-side: admins see all students, teachers only their roster). ↑/↓ + Enter
 * to jump. Self-contained, token-styled, no cmdk dependency.
 */
export default function AdminCommand({ tools }: { tools: Tool[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [index, setIndex] = useState<SearchIndex | null>(null)
  const fetchedRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // ⌘K / Ctrl+K toggles the palette anywhere in the shell.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Lazily pull the lesson/student index the first time the palette opens.
  useEffect(() => {
    if (!open || fetchedRef.current) return
    fetchedRef.current = true
    fetch('/api/admin/search')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: SearchIndex | null) => { if (d) setIndex(d) })
      .catch(() => { /* tools still work without the index */ })
  }, [open])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const toolItems = useMemo<CommandItem[]>(
    () => tools.map((t) => ({ key: `tool:${t.href}`, label: t.label, desc: t.desc, href: t.href, icon: t.icon, accent: t.accent, group: 'Go to' })),
    [tools],
  )
  const lessonItems = useMemo<CommandItem[]>(
    () => (index?.lessons ?? []).map((l) => ({
      key: `lesson:${l.id}`,
      label: l.title,
      desc: l.published ? 'Lesson' : 'Draft',
      href: `/admin/lessons/${l.id}/edit`,
      icon: BookOpen,
      accent: 'var(--primary)',
      group: 'Lessons',
    })),
    [index],
  )
  const studentItems = useMemo<CommandItem[]>(
    () => (index?.students ?? []).map((s) => ({
      key: `student:${s.id}`,
      label: s.name || s.email || 'Student',
      desc: s.email || '',
      href: `/admin/control-room?student=${encodeURIComponent(s.id)}`,
      icon: GraduationCap,
      accent: 'var(--muted-foreground)',
      group: 'Students',
    })),
    [index],
  )

  const results = useMemo<CommandItem[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return toolItems.slice(0, 50)
    const match = (it: CommandItem) => (it.label + ' ' + it.desc).toLowerCase().includes(q)
    return [...toolItems, ...lessonItems, ...studentItems].filter(match).slice(0, 50)
  }, [query, toolItems, lessonItems, studentItems])

  useEffect(() => { setActive(0) }, [query])

  const go = (it: CommandItem) => { setOpen(false); router.push(it.href) }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm w-full max-w-xs"
        style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--muted-foreground)' }}
        aria-label="Search tools, lessons, and students (Command or Control K)"
      >
        <Search size={15} />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="text-[11px] font-semibold rounded px-1.5 py-0.5" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>⌘K</kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center"
          style={{ background: 'color-mix(in oklch, var(--foreground) 28%, transparent)', padding: '12vh 16px 16px' }}
          onMouseDown={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Command palette"
            className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 24px 60px -12px color-mix(in oklch, var(--primary) 35%, transparent)' }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <Search size={17} style={{ color: 'var(--muted-foreground)' }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)) }
                  else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
                  else if (e.key === 'Enter') { e.preventDefault(); if (results[active]) go(results[active]) }
                }}
                placeholder="Tools, lessons, students…"
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: 'var(--foreground)' }}
              />
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 6, maxHeight: '50vh', overflowY: 'auto' }}>
              {results.length === 0 && (
                <li className="px-3 py-6 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  {query.trim() && !index ? 'Searching…' : 'No matches.'}
                </li>
              )}
              {results.map((it, i) => {
                const Ico = it.icon
                const isActive = i === active
                return (
                  <li key={it.key}>
                    <button
                      onClick={() => go(it)}
                      onMouseEnter={() => setActive(i)}
                      className="flex items-center gap-3 w-full text-left rounded-lg px-3 py-2"
                      style={{ background: isActive ? 'color-mix(in oklch, var(--primary) 10%, transparent)' : 'transparent', border: 'none', cursor: 'pointer' }}
                    >
                      <span className="grid place-items-center shrink-0" style={{ width: 30, height: 30, borderRadius: 8, background: `color-mix(in oklch, ${it.accent} 16%, transparent)`, color: it.accent }}>
                        <Ico size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{it.label}</span>
                        {it.desc && <span className="block text-[12px] truncate" style={{ color: 'var(--muted-foreground)' }}>{it.desc}</span>}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider shrink-0" style={{ color: 'var(--muted-foreground)' }}>{it.group}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
