'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { FlaskConical, Search, ArrowUpRight, Clock } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { SIMULATION_CATALOG } from '@/data/simulations-catalog'

const RECENT_KEY = 'physics:sim-launcher-recent'
const simulations = SIMULATION_CATALOG.filter((sim) => sim.published)
const searchable = simulations.map((sim) => ({
  ...sim,
  searchText: [sim.title, sim.description, sim.topic, sim.unit.replace('-', ' '), ...sim.key_concepts, ...sim.tags].join(' ').toLowerCase().replace(/-/g, ' '),
}))

/** Available throughout the signed-in app; launches in a new tab to preserve lesson work. */
export default function SimulationLauncher() {
  const { status } = useSession()
  const pathname = usePathname() ?? ''
  const enabled = status === 'authenticated' && !pathname.startsWith('/embed/')
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [recent, setRecent] = useState<string[]>([])
  const [shortcut, setShortcut] = useState('Ctrl+Shift+K')
  const inputRef = useRef<HTMLInputElement>(null)
  const linksRef = useRef<(HTMLAnchorElement | null)[]>([])
  const resultsId = useId()

  const changeOpen = useCallback((next: boolean) => {
    setOpen(next)
    if (!next) return
    setQuery('')
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
      setRecent(Array.isArray(saved) ? saved.filter((slug): slug is string => typeof slug === 'string').slice(0, 6) : [])
    } catch { setRecent([]) }
  }, [])

  useEffect(() => {
    setShortcut(/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘⇧K' : 'Ctrl+Shift+K')
  }, [])

  useEffect(() => {
    if (!enabled) return
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.isComposing || event.altKey) return
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        changeOpen(!open)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [enabled, open, changeOpen])

  const results = useMemo(() => {
    const words = query.toLowerCase().replace(/-/g, ' ').trim().split(/\s+/).filter(Boolean)
    return searchable.filter((sim) => words.every((word) => sim.searchText.includes(word)))
      .sort((a, b) => {
        if (!words.length) {
          const aRecent = recent.indexOf(a.slug), bRecent = recent.indexOf(b.slug)
          const rank = (aRecent < 0 ? Infinity : aRecent) - (bRecent < 0 ? Infinity : bRecent)
          if (rank && !Number.isNaN(rank)) return rank
        }
        return a.sort_order - b.sort_order || a.title.localeCompare(b.title)
      })
  }, [query, recent])

  const remember = (slug: string) => {
    const next = [slug, ...recent.filter((item) => item !== slug)].slice(0, 6)
    setRecent(next)
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)) } catch { /* Search works without storage. */ }
    changeOpen(false)
  }

  if (!enabled) return null

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <button type="button" aria-keyshortcuts="Meta+Shift+K Control+Shift+K"
          className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-lg hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title={`Open simulation launcher (${shortcut})`}>
          <FlaskConical size={17} aria-hidden="true" /> Simulations
          <kbd className="hidden rounded bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground sm:inline">{shortcut}</kbd>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl gap-3 rounded-2xl p-5"
        onOpenAutoFocus={(event) => { event.preventDefault(); inputRef.current?.focus() }}>
        <DialogTitle className="flex items-center gap-2 pr-6"><FlaskConical size={20} aria-hidden="true" /> Launch a simulation</DialogTitle>
        <DialogDescription>Find a title or physics concept. Opens in a new tab, keeping your lesson here.</DialogDescription>
        <div className="flex items-center gap-2 rounded-xl border bg-card px-3 focus-within:ring-2 focus-within:ring-ring">
          <Search size={18} className="shrink-0 text-muted-foreground" aria-hidden="true" />
          <input ref={inputRef} type="search" value={query} aria-label="Search simulations" aria-controls={resultsId}
            placeholder="Try projectile, momentum, forces, or measurement…"
            className="min-w-0 flex-1 bg-transparent py-3 text-base outline-none"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return
              if (event.key === 'ArrowDown' && results.length) { event.preventDefault(); linksRef.current[0]?.focus() }
              if (event.key === 'Enter' && results.length) { event.preventDefault(); linksRef.current[0]?.click() }
            }} />
        </div>
        <p role="status" className="text-xs text-muted-foreground">{results.length} simulations{!query.trim() && recent.length > 0 ? ' · Recently opened first' : ''}</p>
        <ul id={resultsId} aria-label="Simulation results" className="max-h-[min(52vh,420px)] space-y-1 overflow-y-auto overscroll-contain">
          {results.map((sim, index) => (
            <li key={sim.slug}>
              <a ref={(node) => { linksRef.current[index] = node }} href={`/simulations/${sim.slug}`} target="_blank" rel="noopener noreferrer"
                onClick={() => remember(sim.slug)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown') { event.preventDefault(); linksRef.current[(index + 1) % results.length]?.focus() }
                  if (event.key === 'ArrowUp') { event.preventDefault(); if (index === 0) inputRef.current?.focus(); else linksRef.current[index - 1]?.focus() }
                }}
                className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 hover:bg-secondary focus-visible:border-primary focus-visible:bg-secondary focus-visible:outline-none">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><FlaskConical size={18} aria-hidden="true" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{sim.title}</span>
                  <span className="block text-xs text-muted-foreground">{sim.topic} · {sim.unit.replace('unit-', 'Unit ')}{recent.includes(sim.slug) ? ' · Recent' : ''}</span>
                </span>
                {recent.includes(sim.slug) && <Clock size={14} className="shrink-0 text-muted-foreground" aria-hidden="true" />}
                <ArrowUpRight size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="sr-only">Opens in a new tab</span>
              </a>
            </li>
          ))}
          {results.length === 0 && <li className="px-3 py-8 text-center text-sm text-muted-foreground">No simulations match “{query}”. Try a broader concept such as motion or forces.</li>}
        </ul>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
          <span>↑ ↓ to choose · Enter to open · Esc to close</span>
          <a href="/simulations" target="_blank" rel="noopener noreferrer" onClick={() => changeOpen(false)} className="font-medium text-primary underline underline-offset-4">Browse all simulations <span className="sr-only">in a new tab</span></a>
        </div>
      </DialogContent>
    </Dialog>
  )
}
