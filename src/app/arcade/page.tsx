"use client"

import { useEffect, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowUpRight, Atom, Coins, Trophy, Gamepad2, Joystick, Target, Zap, Sigma, Search, X, Ruler, ArrowRight } from 'lucide-react'
import DailySpinWheel from '@/components/arcade/DailySpinWheel'
import GamePreview from '@/components/arcade/GamePreview'
import styles from './arcade.module.css'

type Cabinet = {
  slug: string
  srcPath: string
  name: string
  blurb: string | null
  unit: string | null
  accent: string | null
  costXp: number
  myBest: number
  myWeeklyRank: number | null
  weeklyLeader: { name: string; score: number } | null
  hallOfFame: { name: string; score: number } | null
}
type CabinetResponse = {
  balance: { balance: number; lifetimeEarned: number; spent: number }
  freeCreditAvailable: boolean
  games: Cabinet[]
}
type Category = 'all' | 'physics' | 'math' | 'workshop' | 'midway'
const CATEGORIES = [
  { id: 'all', label: 'All games', icon: Gamepad2 },
  { id: 'physics', label: 'Physics', icon: Atom },
  { id: 'math', label: 'Math', icon: Sigma },
  { id: 'workshop', label: 'Workshop', icon: Ruler },
  { id: 'midway', label: 'The Midway', icon: Joystick },
] as const
const FLOORS = {
  physics: { title: 'Physics in motion', desc: 'Put the concepts to work. Free to play; accuracy earns XP.', color: '#73dfca' },
  math: { title: 'Find your fluency', desc: 'Small challenges. Sharper math. Free to play and earn XP.', color: '#b9a3fa' },
  workshop: { title: 'Made for hands-on minds', desc: 'Practice the skills that bring precision to your work.', color: '#efc57f' },
  midway: { title: 'You’ve earned a little fun', desc: 'Spend your XP on a ranked run. Chase a new personal best.', color: '#f3a6ba' },
}

function CabinetCard({ game, category, balance, freeCredit }: { game: Cabinet; category: 'physics' | 'math' | 'midway'; balance: number; freeCredit: boolean }) {
  const free = game.costXp === 0
  const shortfall = Math.max(0, game.costXp - balance)
  return <article className={styles.gameCard} style={{ '--game-color': FLOORS[category].color } as CSSProperties}>
    <Link href={`/arcade/${game.slug}`} className={styles.gameLink}>
      <div className={styles.artWrap}><GamePreview srcPath={game.srcPath} name={game.name} /><span className={styles.price}>{free ? 'Free · earn XP' : freeCredit ? 'Free first run' : `${game.costXp} XP / run`}</span></div>
      <div className={styles.cardBody}>
        <span className={styles.eyebrow}>{game.unit || (free ? 'Learning cabinet' : 'The Midway')}</span>
        <h3>{game.name}<ArrowUpRight size={18} /></h3>
        <p>{game.blurb || 'Step up to the cabinet and set your next personal best.'}</p>
        <div className={styles.cardBottom}><span>{game.myBest ? `Best ${game.myBest.toLocaleString()}` : 'Set your first score'}{game.myWeeklyRank ? ` · #${game.myWeeklyRank}` : ''}</span><strong>{!free && !freeCredit && shortfall > 0 ? `Need ${shortfall} more XP` : 'Play'}<ArrowRight size={14} /></strong></div>
      </div>
    </Link>
    <details className={styles.records}><summary><Trophy size={13} /> Leaderboards</summary><dl><div><dt>This week</dt><dd>{game.weeklyLeader ? `${game.weeklyLeader.name} · ${game.weeklyLeader.score.toLocaleString()}` : 'Be the first'}</dd></div><div><dt>All time</dt><dd>{game.hallOfFame ? `${game.hallOfFame.name} · ${game.hallOfFame.score.toLocaleString()}` : 'Be the first'}</dd></div></dl></details>
  </article>
}

export default function ArcadePage() {
  const [data, setData] = useState<CabinetResponse | null>(null)
  const [err, setErr] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [category, setCategory] = useState<Category>('all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const options = { signal: controller.signal }
    fetch('/api/arcade/cabinet', options)
      .then(async r => { if (!r.ok) throw new Error(r.status === 401 ? 'Sign in to load the arcade cabinets.' : 'The cabinets couldn’t load. Please try again.'); return r.json() })
      .then(setData).catch(e => { if (!controller.signal.aborted) setErr(e.message) })
    return () => controller.abort()
  }, [attempt])

  const groups = {
    physics: (data?.games ?? []).filter(g => g.costXp === 0 && g.unit !== 'Math Spine'),
    math: (data?.games ?? []).filter(g => g.costXp === 0 && g.unit === 'Math Spine'),
    midway: (data?.games ?? []).filter(g => g.costXp > 0),
  }
  const matches = (...values: (string | null)[]) => values.some(v => v?.toLowerCase().includes(query.trim().toLowerCase()))
  const counts = { all: (data?.games.length ?? 0) + 1, physics: groups.physics.length, math: groups.math.length, workshop: 1, midway: groups.midway.length }
  const visible = CATEGORIES.filter(c => c.id !== 'all' && (category === 'all' || c.id === category)).map(c => {
    const id = c.id as Exclude<Category, 'all'>
    const cabinets = id === 'physics' || id === 'math' || id === 'midway' ? groups[id].filter(g => matches(g.name, g.blurb, g.unit)) : []
    const workshop = id === 'workshop' && matches('Tape Workshop', 'measure ruler fractions inches metric trades')
    return { ...c, id, cabinets, workshop, count: cabinets.length + (workshop ? 1 : 0) }
  }).filter(c => c.count > 0)
  const resultCount = visible.reduce((sum, c) => sum + c.count, 0)

  return <div className={styles.arcade}>
    <header className={styles.masthead}><Link href="/arcade" className={styles.brand}><Joystick size={22} /><span>The Arcade<span className={styles.brandDot}>.</span></span></Link><span className={styles.mastheadNote}>A playground for curious minds</span></header>
    <section className={styles.hero} aria-labelledby="arcade-title">
      <div className={styles.heroCopy}><span className={styles.heroKicker}><span /> Learn. Play. Level up.</span><h1 id="arcade-title">A little practice.<br /><em>A new high score.</em></h1><p>Build your skills, bank some XP, and find your next favorite game. There’s a cabinet with your name on it.</p><a href="#game-library" className={styles.heroButton}>Find your game <ArrowDown size={16} /></a></div>
      <div className={styles.heroArt} aria-hidden="true"><div className={styles.orbitOne} /><div className={styles.orbitTwo} /><span className={styles.artStar}>✦</span><div className={styles.miniCabinet}><div className={styles.cabinetMarquee}>ANTOCCI / ARCADE</div><div className={styles.cabinetScreen}><Atom size={66} strokeWidth={1} /><span>READY, PLAYER?</span><i>PRESS PLAY</i></div><div className={styles.cabinetControls}><span /><i /><i /></div><div className={styles.cabinetBase}><span>01</span><i /></div></div><span className={styles.artCaption}>GOOD THINKING. GREAT PLAY.</span></div>
    </section>

    <div className={styles.playerBar} aria-label="Your arcade progress">
      <div><span className={styles.statIcon}><Coins size={19} /></span><span><small>Ready to spend</small><strong>{data ? `${data.balance.balance.toLocaleString()} XP` : '—'}</strong></span></div>
      <div><span className={styles.statIcon}><Zap size={19} /></span><span><small>Free to play</small><strong>{data ? groups.physics.length + groups.math.length + 1 : '—'} activities</strong></span></div>
      <div><span className={styles.statIcon}><Gamepad2 size={19} /></span><span><small>Your collection</small><strong>{data ? data.games.filter(g => g.myBest > 0).length : '—'} personal bests</strong></span></div>
      <div><span className={styles.statIcon}><Trophy size={19} /></span><span><small>This week</small><strong>{data ? data.games.filter(g => g.myWeeklyRank !== null).length : '—'} ranked cabinets</strong></span></div>
    </div>


    <div className={styles.libraryLayout}>
      <div className={styles.library} id="game-library">
        <div className={styles.libraryHeading}><div><span className={styles.eyebrow}>Pick your next challenge</span><h2>The game library</h2></div><span>{counts.all} games & activities</span></div>
        <div className={styles.browseTools}>
          <div className={styles.search}><Search size={17} /><input aria-label="Search games" placeholder="Search games, skills, or topics…" value={query} onChange={e => setQuery(e.target.value)} />{query && <button aria-label="Clear search" onClick={() => setQuery('')}><X size={16} /></button>}</div>
          <div className={styles.filters} role="group" aria-label="Game categories">{CATEGORIES.map(c => <button key={c.id} aria-pressed={category === c.id} onClick={() => setCategory(c.id)}><c.icon size={15} />{c.label}<span>{counts[c.id]}</span></button>)}</div>
        </div>
        {err && <div className={styles.empty} role="alert"><p>{err}</p><button onClick={() => { setErr(''); setAttempt(a => a + 1) }}>Try again</button></div>}
        {!data && !err && <div className={styles.loading} role="status">Powering on the cabinets…<div /><div /><div /></div>}
        <span className={styles.srOnly} role="status">{resultCount} matching games and activities</span>
        {visible.map(section => <section key={section.id} className={styles.floor} aria-labelledby={`floor-${section.id}`}>
          <div className={styles.floorHeading}><span className={styles.floorIcon} style={{ color: FLOORS[section.id].color }}><section.icon size={20} /></span><div><h3 id={`floor-${section.id}`}>{FLOORS[section.id].title}</h3><p>{FLOORS[section.id].desc}</p></div><span className={styles.floorCount}>{String(section.count).padStart(2, '0')}</span></div>
          <div className={styles.gameGrid}>
            {section.cabinets.map(g => <CabinetCard key={g.slug} game={g} category={section.id as 'physics' | 'math' | 'midway'} balance={data?.balance.balance ?? 0} freeCredit={!!data?.freeCreditAvailable} />)}
            {section.workshop && <article className={styles.gameCard} style={{ '--game-color': FLOORS.workshop.color } as CSSProperties}><Link href="/arcade/tape-measure" className={styles.gameLink}><div className={styles.artWrap}><GamePreview srcPath="/games/tape-workshop/index.html" name="Tape Workshop" /><span className={styles.price}>Free practice</span></div><div className={styles.cardBody}><span className={styles.eyebrow}>Trades workshop</span><h3>Tape Workshop<ArrowUpRight size={18} /></h3><p>Read the marks, align zero, and measure with confidence. Inch fractions, decimals, and metric.</p><div className={styles.cardBottom}><span>Real-world skills</span><strong>Explore <ArrowRight size={14} /></strong></div></div></Link></article>}
          </div>
        </section>)}
        {visible.length === 0 && (data || query || category === 'workshop') && <div className={styles.empty}><Search size={26} /><h3>{query ? 'No games found' : 'No cabinets here yet'}</h3><p>{query ? 'Try a different topic or explore the other categories.' : 'Explore another category while this floor gets ready.'}</p><button onClick={() => { setQuery(''); setCategory('all') }}>Show all games</button></div>}
      </div>
      <aside className={styles.sidebar} aria-label="Arcade guide and rewards">
        <section className={styles.dailyCard}><span className={styles.eyebrow}><Target size={14} /> Make your next move</span><h2>Practice. Earn. Play.</h2><p>Build your skills in Physics or Math. Accurate play earns XP for a trip to the Midway.</p><span className={styles.dailyFooter}>Your next personal best is waiting.</span></section>
        <DailySpinWheel onWon={xp => setData(d => d ? { ...d, balance: { ...d.balance, balance: d.balance.balance + xp, lifetimeEarned: d.balance.lifetimeEarned + xp } } : d)} />
        {data?.freeCreditAvailable && <section className={styles.creditCard}><Coins size={21} /><h2>Your first run is on us.</h2><p>One free ranked run on the Midway. Pick a game and make it count.</p><button onClick={() => { setCategory('midway'); setQuery(''); document.getElementById('game-library')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>Explore the Midway <ArrowRight size={15} /></button></section>}
        <details className={styles.howItWorks}><summary>How XP works</summary><p>Physics and math games are free. Accurate runs and completed math problems share a daily allowance of 10 XP, or 15 for Honors.</p><p>Spend your balance on ranked Midway runs. Each cabinet shows its price before you play.</p><Link href="/">View your unit requirements <ArrowUpRight size={13} /></Link></details>
      </aside>
    </div>
    <footer className={styles.footer}><Joystick size={16} /><span>Stay curious. Keep playing.</span><a href="#arcade-title">Back to top ↑</a></footer>
  </div>
}
