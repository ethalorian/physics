'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight, Shuffle, Trophy } from 'lucide-react'
import Avatar from '@/components/avatar/Avatar'
import { Button } from '@/components/ui/button'
import type { AvatarSpotlightData } from '@/lib/avatar-spotlight'
import styles from './home.module.css'
import HomeSectionHeader from './HomeSectionHeader'

export default function AvatarSpotlight() {
  const [data, setData] = useState<AvatarSpotlightData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [draw, setDraw] = useState(0)
  const [active, setActive] = useState(0)
  useEffect(() => {
    let current = true
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    setLoading(true); setError(false)
    fetch('/api/avatar/spotlight', { signal: controller.signal, cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('spotlight')
        const result = await response.json()
        if (!Array.isArray(result.cards) || !Array.isArray(result.items)) throw new Error('spotlight')
        return result as AvatarSpotlightData
      })
      .then(result => { if (current) { setData(result); setActive(0) } })
      .catch(() => { if (current) setError(true) })
      .finally(() => { clearTimeout(timeout); if (current) setLoading(false) })
    return () => { current = false; clearTimeout(timeout); controller.abort() }
  }, [draw])
  const cards = data?.cards ?? []
  const step = (direction: number) => setActive(index => (index + direction + cards.length) % cards.length)
  return <section className={styles.spotlight} aria-labelledby="spotlight-heading">
    <HomeSectionHeader title="Meet the players" eyebrow="From the arcade" icon={Trophy} tone="rose" id="spotlight-heading" />
    {loading ? <p role="status" className="py-8 text-sm text-muted-foreground">Shuffling the avatar deck…</p>
      : error ? <div role="alert" className="space-y-3 py-5"><p className="text-sm">The avatar deck couldn’t load.</p><Button variant="outline" onClick={() => setDraw(n => n + 1)}>Retry avatar deck</Button></div>
      : !cards.length ? <p className="py-6 text-sm text-muted-foreground">No shared avatars with ranked game scores yet. Visit the gallery to share your look, or play a ranked game in the Arcade.</p>
      : <>
        <p className="mt-2 text-sm font-semibold">{data?.game?.name}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">All-time best score · ranked among {data?.rankedPlayers} gallery players</p>
        <div role="group" aria-roledescription="carousel" aria-label="Game ranking avatar sample" className={styles.avatarDeck}
          onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); step(event.key === 'ArrowRight' ? 1 : -1) } }}>
          {cards.map((card, index) => {
            const position = (index - active + cards.length) % cards.length
            return <button type="button" key={card.id} className={styles.playerCard} data-position={position} data-single={cards.length === 1} onClick={() => setActive(index)} aria-pressed={index === active} aria-label={`${card.name}, rank ${card.rank}, ${card.score.toLocaleString()} points. Show card.`}>
              <span className={styles.cardRank}>#{card.rank}</span>
              <Avatar traits={card.traits} equipped={card.equipped} items={data?.items} size={112} decorative />
              <span className="block w-full truncate text-sm font-bold">{card.name}</span>
              <span className="text-xs"><strong>{card.score.toLocaleString()}</strong> points</span>
            </button>
          })}
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="icon" className="min-h-11 min-w-11" disabled={cards.length < 2} aria-label="Previous avatar" onClick={() => step(-1)}><ChevronLeft /></Button>
          <p role="status" className="text-xs text-muted-foreground">Card {active + 1} of {cards.length}</p>
          <Button variant="outline" size="icon" className="min-h-11 min-w-11" disabled={cards.length < 2} aria-label="Next avatar" onClick={() => step(1)}><ChevronRight /></Button>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">A random sample, not the top three.</p>
      </>}
    <div className="mt-4 flex flex-wrap justify-center gap-2 border-t pt-4">
      <Button asChild className="min-h-11"><Link href="/avatar/gallery">Avatar gallery<ArrowRight aria-hidden="true" /></Link></Button>
      <Button variant="outline" className="min-h-11" disabled={loading} onClick={() => setDraw(n => n + 1)}><Shuffle aria-hidden="true" />New sample</Button>
    </div>
  </section>
}
