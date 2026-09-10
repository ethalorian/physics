"use client"

import { useEffect, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowUpRight, Atom, BookOpen, Coins, Trophy, Gamepad2, Joystick, Flame, Target, Zap, Shuffle, Brain, ShoppingBasket, Swords, Feather, Sigma, Search, X, Ruler, ArrowRight } from 'lucide-react'
import DailySpinWheel from '@/components/arcade/DailySpinWheel'
import ChallengeCard from '@/components/gamification/ChallengeCard'
import VocabTaskCards from '@/components/vocabulary/VocabTaskCards'
import styles from './arcade.module.css'

type Cabinet = {
  slug: string
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
type HubData = {
  level: number
  xp: { into: number; forNext: number; total: number }
  streakDays: number
  daily: { gamesPlayed: number; gamesGoal: number; pointsToday: number; pointsGoal: number; complete: boolean }
  games: { id: string; best: number; plays: number }[]
  myRank: number | null
}

const VOCAB_GAMES = [
  // steer: solo games accept ?lesson_id=/?unit_id= and preload the focus vocab
  { id: 'word-shoot', title: 'Word shoot', desc: 'Blast the right term before it escapes', icon: Zap, href: '/vocabulary/word-shoot', steer: true },
  { id: 'quiz-bowl', title: 'Quiz bowl', desc: 'Rapid-fire physics questions', icon: Trophy, href: '/vocabulary/quiz-bowl', steer: true },
  { id: 'matching', title: 'Matching', desc: 'Pair terms with definitions, fast', icon: Shuffle, href: '/vocabulary/matching', steer: true },
  { id: 'concentration', title: 'Concentration', desc: 'Flip and remember the pairs', icon: Brain, href: '/vocabulary/concentration', steer: true },
  { id: 'letter-catch', title: 'Letter Catch', desc: 'Catch falling letters to spell the term', icon: ShoppingBasket, href: '/vocabulary/letter-catch', steer: true },
  { id: 'duel', title: 'Vocab Duel', desc: 'Race a classmate head-to-head', icon: Swords, href: '/vocabulary/duel', steer: false },
  { id: 'balderdash', title: 'Balderdash', desc: 'Fake definitions, real bluffing (3+)', icon: Feather, href: '/vocabulary/balderdash', steer: false },
]
type Focus = { scope: 'lesson' | 'unit' | null; id?: string; label?: string }

type Category = 'all' | 'physics' | 'math' | 'vocabulary' | 'workshop' | 'midway'
const CATEGORIES = [
  { id: 'all', label: 'All games', icon: Gamepad2 },
  { id: 'physics', label: 'Physics', icon: Atom },
  { id: 'math', label: 'Math', icon: Sigma },
  { id: 'vocabulary', label: 'Vocabulary', icon: BookOpen },
  { id: 'workshop', label: 'Workshop', icon: Ruler },
  { id: 'midway', label: 'The Midway', icon: Joystick },
] as const
const FLOORS = {
  physics: { title: 'Physics in motion', desc: 'Put the concepts to work. Free to play; accuracy earns XP.', color: '#73dfca' },
  math: { title: 'Find your fluency', desc: 'Small challenges. Sharper math. Free to play and earn XP.', color: '#b9a3fa' },
  vocabulary: { title: 'Make the words stick', desc: 'Build your physics vocabulary, solo or with friends.', color: '#8ebfff' },
  workshop: { title: 'Made for hands-on minds', desc: 'Practice the skills that bring precision to your work.', color: '#efc57f' },
  midway: { title: 'You’ve earned a little fun', desc: 'Spend your XP on a ranked run. Chase a new personal best.', color: '#f3a6ba' },
}

// Lightweight vector artwork keeps every cabinet crisp without image downloads.
function CabinetArt({ kind, seed = 0 }: { kind: Exclude<Category, 'all'>; seed?: number }) {
  return <svg viewBox="0 0 320 130" fill="none" aria-hidden="true" className={styles.art}>
    <path d="M0 105H320M0 75H320M0 45H320M40 0V130M100 0V130M160 0V130M220 0V130M280 0V130" stroke="currentColor" opacity=".08" />
    <g transform={`translate(${(seed % 3 - 1) * 18} 0)`}>
      {kind === 'physics' ? <>
        <ellipse cx="164" cy="65" rx="84" ry="28" transform={`rotate(${seed % 2 ? -28 : 28} 164 65)`} stroke="currentColor" strokeWidth="1.5" />
        <ellipse cx="164" cy="65" rx="84" ry="28" transform="rotate(-55 164 65)" stroke="currentColor" opacity=".4" />
        <circle cx="164" cy="65" r="19" fill="currentColor" opacity=".12" /><circle cx="164" cy="65" r="8" fill="currentColor" />
        <circle cx="239" cy={seed % 2 ? 34 : 101} r="5" fill="currentColor" /><path d="M64 25h12m-6-6v12M249 50h8m-4-4v8" stroke="currentColor" />
      </> : kind === 'math' ? <>
        {[0,1,2,3,4].map(i => <rect key={i} x={82+i*32} y={94-((i+seed)%5)*15} width="24" height={18+((i+seed)%5)*15} rx="4" fill="currentColor" opacity={.2+i*.15} />)}
        <path d="m83 60 40-25 32 10 50-26 28 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="205" cy="19" r="4" fill="currentColor" />
      </> : kind === 'vocabulary' ? <>
        {['A','B','C'].map((letter,i) => <g key={letter} transform={`translate(${92+i*49} ${35+(i===1?-10:8)}) rotate(${i===1?0:i===0?-10:10} 22 25)`}><rect width="44" height="52" rx="8" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeOpacity=".55" /><text x="22" y="34" fill="currentColor" textAnchor="middle" fontSize="26" fontWeight="600">{letter}</text></g>)}
      </> : kind === 'workshop' ? <>
        <g transform="rotate(-12 160 65)"><rect x="57" y="42" width="210" height="47" rx="5" fill="currentColor" fillOpacity=".12" stroke="currentColor" />{Array.from({length:19},(_,i)=><path key={i} d={`M${70+i*10} 43v${i%5===0?27:i%2===0?18:10}`} stroke="currentColor" />)}</g>
      </> : <>
        {[0,1,2,3].map(i => <g key={i} transform={`translate(${112+(i%2)*12} ${94-i*23})`}><path d="m0 0 57-17 43 12-57 17Z" fill="currentColor" fillOpacity={.35+i*.17} /><path d="m0 0 43 12v12L0 12Zm43 12 57-17V7L43 24Z" fill="currentColor" fillOpacity=".18" stroke="currentColor" strokeOpacity=".3" /></g>)}
        <path d="M75 32h14m-7-7v14m164 31h10m-5-5v10" stroke="currentColor" />
      </>}
    </g>
  </svg>
}

function CabinetCard({ game, category, index, balance, freeCredit }: { game: Cabinet; category: 'physics' | 'math' | 'midway'; index: number; balance: number; freeCredit: boolean }) {
  const free = game.costXp === 0
  const shortfall = Math.max(0, game.costXp - balance)
  return <article className={styles.gameCard} style={{ '--game-color': FLOORS[category].color } as CSSProperties}>
    <Link href={`/arcade/${game.slug}`} className={styles.gameLink}>
      <div className={styles.artWrap}><CabinetArt kind={category} seed={index} /><span className={styles.price}>{free ? 'Free · earn XP' : freeCredit ? 'Free first run' : `${game.costXp} XP / run`}</span></div>
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
  const [hub, setHub] = useState<HubData | null>(null)
  const [focus, setFocus] = useState<Focus | null>(null)
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
    fetch('/api/arcade/hub', options).then(r => r.ok ? r.json() : null)
      .then(d => { if (d && typeof d.level === 'number') setHub(d) }).catch(() => {})
    fetch('/api/arcade/focus', options).then(r => r.ok ? r.json() : null)
      .then(f => { if (f?.scope) setFocus(f) }).catch(() => {})
    return () => controller.abort()
  }, [attempt])

  const steerQS = focus?.scope && focus.id ? `?${focus.scope === 'lesson' ? 'lesson_id' : 'unit_id'}=${encodeURIComponent(focus.id)}` : ''
  const bestById = new Map((hub?.games ?? []).map(g => [g.id, g]))
  const dailyPct = hub ? Math.min(100, Math.round(Math.min(1, hub.daily.gamesPlayed / Math.max(1, hub.daily.gamesGoal)) * 50 + Math.min(1, hub.daily.pointsToday / Math.max(1, hub.daily.pointsGoal)) * 50)) : 0
  const groups = {
    physics: (data?.games ?? []).filter(g => g.costXp === 0 && g.unit !== 'Math Spine'),
    math: (data?.games ?? []).filter(g => g.costXp === 0 && g.unit === 'Math Spine'),
    midway: (data?.games ?? []).filter(g => g.costXp > 0),
  }
  const matches = (...values: (string | null)[]) => values.some(v => v?.toLowerCase().includes(query.trim().toLowerCase()))
  const counts = { all: (data?.games.length ?? 0) + VOCAB_GAMES.length + 1, physics: groups.physics.length, math: groups.math.length, vocabulary: VOCAB_GAMES.length, workshop: 1, midway: groups.midway.length }
  const visible = CATEGORIES.filter(c => c.id !== 'all' && (category === 'all' || c.id === category)).map(c => {
    const id = c.id as Exclude<Category, 'all'>
    const cabinets = id === 'physics' || id === 'math' || id === 'midway' ? groups[id].filter(g => matches(g.name, g.blurb, g.unit)) : []
    const vocab = id === 'vocabulary' ? VOCAB_GAMES.filter(g => matches(g.title, g.desc, 'vocabulary')) : []
    const workshop = id === 'workshop' && matches('Tape Workshop', 'measure ruler fractions inches metric trades')
    return { ...c, id, cabinets, vocab, workshop, count: cabinets.length + vocab.length + (workshop ? 1 : 0) }
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
      <div><span className={styles.statIcon}><Zap size={19} /></span><span><small>Your level</small><strong>{hub ? `Level ${hub.level}` : '—'}</strong></span>{hub && <progress aria-label="Progress to next level" max={Math.max(1, hub.xp.forNext)} value={hub.xp.into} />}</div>
      <div><span className={styles.statIcon}><Flame size={19} /></span><span><small>Play streak</small><strong>{hub ? `${hub.streakDays} ${hub.streakDays === 1 ? 'day' : 'days'}` : '—'}</strong></span></div>
      <div><span className={styles.statIcon}><Trophy size={19} /></span><span><small>This week</small><strong>{hub?.myRank ? `Rank #${hub.myRank}` : 'Make your mark'}</strong></span></div>
    </div>

    <div className={styles.assignmentArea}><VocabTaskCards /><ChallengeCard compact /></div>

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
          {section.id === 'vocabulary' && focus?.scope && <p className={styles.focusNote}><Target size={15} /> Current focus: <strong>{focus.label}</strong> · Solo games open with these words.</p>}
          <div className={styles.gameGrid}>
            {section.cabinets.map((g, i) => <CabinetCard key={g.slug} game={g} category={section.id as 'physics' | 'math' | 'midway'} index={i} balance={data?.balance.balance ?? 0} freeCredit={!!data?.freeCreditAvailable} />)}
            {section.vocab.map((g, i) => <article key={g.id} className={styles.gameCard} style={{ '--game-color': FLOORS.vocabulary.color } as CSSProperties}><Link href={g.steer ? g.href + steerQS : g.href} className={styles.gameLink}><div className={styles.artWrap}><CabinetArt kind="vocabulary" seed={i} /><span className={styles.price}>{g.steer ? 'Solo · earn XP' : g.id === 'duel' ? '2 players' : '3+ players'}</span></div><div className={styles.cardBody}><span className={styles.eyebrow}><g.icon size={12} /> Vocabulary</span><h3>{g.title}<ArrowUpRight size={18} /></h3><p>{g.desc}</p><div className={styles.cardBottom}><span>{bestById.get(g.id)?.best ? `Best ${bestById.get(g.id)!.best.toLocaleString()}` : g.steer && focus?.scope ? 'Current focus loaded' : 'Ready when you are'}</span><strong>Play <ArrowRight size={14} /></strong></div></div></Link></article>)}
            {section.workshop && <article className={styles.gameCard} style={{ '--game-color': FLOORS.workshop.color } as CSSProperties}><Link href="/arcade/tape-measure" className={styles.gameLink}><div className={styles.artWrap}><CabinetArt kind="workshop" /><span className={styles.price}>Free practice</span></div><div className={styles.cardBody}><span className={styles.eyebrow}>Trades workshop</span><h3>Tape Workshop<ArrowUpRight size={18} /></h3><p>Read the marks, align zero, and measure with confidence. Inch fractions, decimals, and metric.</p><div className={styles.cardBottom}><span>Real-world skills</span><strong>Explore <ArrowRight size={14} /></strong></div></div></Link></article>}
          </div>
        </section>)}
        {visible.length === 0 && (data || query || category === 'vocabulary' || category === 'workshop') && <div className={styles.empty}><Search size={26} /><h3>{query ? 'No games found' : 'No cabinets here yet'}</h3><p>{query ? 'Try a different topic or explore the other categories.' : 'Explore another category while this floor gets ready.'}</p><button onClick={() => { setQuery(''); setCategory('all') }}>Show all games</button></div>}
      </div>
      <aside className={styles.sidebar} aria-label="Daily goals and rewards">
        <section className={styles.dailyCard}><span className={styles.eyebrow}><Target size={14} /> Your daily goal</span><h2>{hub?.daily.complete ? 'Nicely played.' : 'A little better, every day.'}</h2><p>{hub ? `${hub.daily.gamesPlayed} / ${hub.daily.gamesGoal} games · ${hub.daily.pointsToday} / ${hub.daily.pointsGoal} points` : 'Play vocabulary games to build your daily progress.'}</p><progress aria-label="Daily challenge progress" max="100" value={dailyPct} /><span className={styles.dailyFooter}>{hub?.daily.complete ? 'Daily challenge complete ✓' : 'Every round is a fresh start.'}</span></section>
        <DailySpinWheel onWon={xp => setData(d => d ? { ...d, balance: { ...d.balance, balance: d.balance.balance + xp, lifetimeEarned: d.balance.lifetimeEarned + xp } } : d)} />
        {data?.freeCreditAvailable && <section className={styles.creditCard}><Coins size={21} /><h2>Your first run is on us.</h2><p>One free ranked run on the Midway. Pick a game and make it count.</p><button onClick={() => { setCategory('midway'); setQuery(''); document.getElementById('game-library')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>Explore the Midway <ArrowRight size={15} /></button></section>}
        <details className={styles.howItWorks}><summary>How XP works</summary><p>Physics and math games are free. Accurate runs and completed math problems share a daily allowance of 10 XP, or 15 for Honors. Vocabulary adds up to 5 XP a day.</p><p>Spend your balance on ranked Midway runs. Each cabinet shows its price before you play.</p><Link href="/">View your unit requirements <ArrowUpRight size={13} /></Link></details>
      </aside>
    </div>
    <footer className={styles.footer}><Joystick size={16} /><span>Stay curious. Keep playing.</span><a href="#arcade-title">Back to top ↑</a></footer>
  </div>
}
