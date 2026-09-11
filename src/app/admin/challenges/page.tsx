'use client'

import { useCallback, useEffect, useState, useRef, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, Check, ChevronDown, Coins, Gamepad2, GraduationCap, Minus, Pause, Play, Plus, Search, Sparkles, Target, Trash2, Trophy, Users, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BOUNTY_PERIODS, PERIOD_LABELS, bountyToday, bountyWindow, validBountyDate, type BountyPeriod } from '@/lib/xp-bounty-period'
import { BOUNTY_KIND_LABELS, VOCAB_BOUNTY_GAMES } from '@/lib/xp-bounty-catalog'
import styles from './challenges.module.css'

interface Course { id: string; label: string }
interface Student { id: string; name: string | null; email: string | null; courseIds: string[] }
interface Game { slug: string; name: string; enabled: boolean }
interface Challenge {
  id: string; title: string; kind: string; game_slug: string | null; metric: string
  target: number; bonus_xp: number; starts_on: string; ends_on: string; period: BountyPeriod
  active: boolean; is_global: boolean; completedPeriod: number; recipientCount: number
  window: { start: string; end: string }; assignments: { label: string }[]
}
interface Data { myCourses: Course[]; students: Student[]; games: Game[]; challenges: Challenge[]; teacherEmail: string }
const PERIOD_HELP: Record<BountyPeriod, string> = {
  daily: 'One bounty each day. Progress resets at midnight.',
  weekly: 'One bounty each calendar week. Progress resets Monday.',
  monthly: 'One bounty each calendar month. Progress resets on the first.',
  custom: 'One bounty for the entire selected date range. No resets.',
}
const toggleId = (values: string[], id: string) => values.includes(id) ? values.filter(value => value !== id) : [...values, id]

async function request(url: string, options?: RequestInit) {
  const response = await fetch(url, options)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Could not save changes. Please try again.')
  return data
}

export default function ChallengesPage() {
  const [step, setStep] = useState(0)
  const [gameSearch, setGameSearch] = useState('')
  const stepHeading = useRef<HTMLHeadingElement>(null)
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState('')
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState('arcade-game')
  const [slug, setSlug] = useState('')
  const [metric, setMetric] = useState('plays')
  const [target, setTarget] = useState('3')
  const [bonus, setBonus] = useState('25')
  const [period, setPeriod] = useState<BountyPeriod>('weekly')
  const [starts, setStarts] = useState(bountyToday)
  const [ends, setEnds] = useState(() => bountyWindow({ period: 'weekly', starts_on: bountyToday(), ends_on: '9999-12-31' }).end)
  const [courses, setCourses] = useState<string[]>([])
  const [students, setStudents] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const load = useCallback(async () => setData(await request('/api/teacher/challenges')), [])
  useEffect(() => { load().catch(e => setError(e.message)) }, [load])

  const today = bountyToday()
  const recipients = data?.students.filter(s => students.includes(s.id) || s.courseIds.some(id => courses.includes(id))) ?? []
  const gameName = kind === 'arcade-game' ? data?.games.find(g => g.slug === slug)?.name ?? 'Choose a game'
    : kind === 'vocab-games' && slug ? VOCAB_BOUNTY_GAMES.find(g => g.slug === slug)?.name ?? slug : BOUNTY_KIND_LABELS[kind]
  const autoTitle = `${metric === 'plays' ? 'Complete' : 'Earn'} ${target || '0'} ${metric === 'plays' ? 'runs' : 'XP'} · ${gameName}`
  const stateOf = (c: Challenge) => c.ends_on < today ? 'Ended' : !c.active ? 'Paused' : c.starts_on > today ? 'Scheduled' : 'Live'
  const visible = data?.challenges.filter(c => filter === 'all' || stateOf(c).toLowerCase() === filter) ?? []

  async function create(event: FormEvent) {
    event.preventDefault();
    if (step < 2) { if (stepReady) goToStep(step + 1); return }
    if (!ready) return
    setBusy('create'); setError(''); setNotice('')
    try {
      await request('/api/teacher/challenges', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        title: title.trim() || autoTitle, kind, game_slug: slug || null, metric, target: Number(target), bonus_xp: Number(bonus),
        period, starts_on: starts, ends_on: ends, course_ids: courses, student_ids: students,
      }) })
      setTitle(''); setSlug(''); setKind('arcade-game'); setMetric('plays'); setTarget('3'); goToStep(0)
      setNotice('Bounty launched! Your students have a new challenge to look forward to.')
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not assign bounty') }
    finally { setBusy('') }
  }

  async function manage(c: Challenge, remove = false) {
    if (remove && !confirm(`Delete “${c.title}”? XP already earned stays with students.`)) return
    setBusy(c.id); setError(''); setNotice('')
    try {
      await request(remove ? `/api/teacher/challenges?id=${c.id}` : '/api/teacher/challenges', remove
        ? { method: 'DELETE' } : { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, active: !c.active }) })
      setNotice(remove ? 'Bounty deleted. Earned XP is preserved.' : c.active ? 'Bounty paused.' : 'Bounty resumed.')
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not update bounty') }
    finally { setBusy('') }
  }

  const datesValid = validBountyDate(starts) && validBountyDate(ends) && ends >= starts
    && Date.parse(ends) - Date.parse(starts) <= 366 * 86400000
  const targetValid = Number.isInteger(Number(target)) && Number(target) >= 1 && Number(target) <= 1000
  const rewardValid = Number.isInteger(Number(bonus)) && Number(bonus) >= 1 && Number(bonus) <= 100
  const gameChosen = kind !== 'arcade-game' || !!slug
  const stepReady = step === 0 ? gameChosen && targetValid : step === 1 ? datesValid : recipients.length > 0 && rewardValid
  const ready = gameChosen && targetValid && datesValid && recipients.length > 0 && rewardValid
  const missing = !gameChosen ? 'Pick a game to get started.' : !targetValid ? 'Choose a target from 1 to 1,000.'
    : !datesValid ? 'Choose valid dates, up to one year apart.' : !recipients.length ? 'Choose a class or a student.'
    : !rewardValid ? 'Choose a reward from 1 to 100 XP.' : ''
  const prettyDate = (value: string) => validBountyDate(value) ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: value.slice(0, 4) !== today.slice(0, 4) ? 'numeric' : undefined, timeZone: 'UTC' }).format(new Date(value + 'T12:00:00Z')) : 'Choose a date'
  const dateLabel = starts === ends ? prettyDate(starts) : prettyDate(starts) + ' – ' + prettyDate(ends)
  const gameOptions = kind === 'vocab-games' ? VOCAB_BOUNTY_GAMES : data?.games.filter(g => g.enabled) ?? []
  const filteredGames = gameOptions.filter(g => g.name.toLowerCase().includes(gameSearch.toLowerCase()))
  const liveCount = data?.challenges.filter(c => stateOf(c) === 'Live').length ?? 0
  function goToStep(next: number) {
    setStep(next)
    requestAnimationFrame(() => stepHeading.current?.focus())
  }
  function chooseCategory(next: string) {
    if (next === kind || next === 'arcade-game' && kind === 'arcade-any') return
    setKind(next); setSlug(''); setGameSearch('')
    setMetric(next === 'math' ? 'xp' : 'plays'); setTarget(next === 'math' ? '25' : '3')
  }
  function choosePeriod(next: BountyPeriod) {
    setPeriod(next)
    if (next !== 'custom') {
      setStarts(today)
      setEnds(bountyWindow({ period: next, starts_on: today, ends_on: '9999-12-31' }, today).end)
    }
  }

  return <div className={styles.page}>
    <header className={styles.header}>
      <div className={styles.heroCopy}><div className={styles.eyebrow}><Sparkles size={15} /> XP CHALLENGES · YOUR TEACHER STUDIO</div>
        <h1>Small challenges.<br /><em>Big motivation.</em></h1>
        <p>Pick a game. Set a goal. Give your students something to go for.</p>
        <div className={styles.scope}><span><Users size={14} /> Only your students</span><span><span className={styles.liveDot} />{liveCount} live {liveCount === 1 ? 'bounty' : 'bounties'}</span></div>
      </div>
      <div className={styles.heroArt} aria-hidden="true"><span className={styles.artSpark}>✦</span><span className={styles.artOrbit} /><div className={styles.artCoin}><Trophy size={42} strokeWidth={1.6} /></div><span className={styles.artChip}><Zap size={15} fill="currentColor" /> XP</span><span className={styles.artSparkSmall}>✧</span></div>
    </header>
    {error && <div role="alert" className={styles.error}>{error} {!data && <Button variant="outline" onClick={() => { setError(''); load().catch(e => setError(e.message)) }}>Try again</Button>}</div>}
    {notice && <div role="status" className={styles.notice}><span className={styles.noticeIcon}><Check size={20} /></span><div><b>{notice}</b><p>You can manage it in your bounty board below.</p></div><a href="#bounty-board">View board <ArrowRight size={16} /></a></div>}
    {!data ? <div className={styles.loading} aria-live="polite"><Gamepad2 size={28} /><p>{error ? 'Your workspace is unavailable.' : 'Getting your bounty studio ready…'}</p></div> : <>
      <form onSubmit={create} className={styles.composer}>
        <div className={styles.formMain}>
          <div className={styles.studioHeader}><h2>Build a bounty <Sparkles size={17} /></h2><span>A few clicks. A fresh challenge.</span></div>
          <nav className={styles.steps} aria-label="Bounty setup">{['Pick the play', 'Set the pace', 'Send it out'].map((label, index) => <button type="button" key={label} onClick={() => goToStep(index)} aria-current={step === index ? 'step' : undefined}><span>{index !== step && (index === 0 ? gameChosen && targetValid : index === 1 ? datesValid : ready) ? <Check size={15} /> : index + 1}</span><b>{label}</b></button>)}</nav>
          <div className={styles.stepBody}>
            <div className={styles.stepIntro}><span className={styles.eyebrow}>STEP {step + 1} OF 3</span><h3 ref={stepHeading} tabIndex={-1}>{['What are we playing?', 'How long is the challenge?', 'Who’s in? What’s the prize?'][step]}</h3><p>{['Choose an activity and a finish line.', 'One day, a weekly rhythm, or a window of your own.', 'Your classes and students. A little extra XP to aim for.'][step]}</p></div>
            {step === 0 && <>
              <div className={styles.categories} aria-label="Activity type">{[{kind:'arcade-game',label:'Arcade',icon:Gamepad2},{kind:'vocab-games',label:'Word games',icon:BookOpen},{kind:'math',label:'Math practice',icon:GraduationCap}].map(item => <button type="button" key={item.kind} aria-pressed={kind === item.kind || item.kind === 'arcade-game' && kind === 'arcade-any'} onClick={() => chooseCategory(item.kind)}><item.icon size={19} />{item.label}</button>)}</div>
              {kind !== 'math' ? <>
                {gameOptions.length > 6 && <div className={styles.search}><Search size={17} /><Input aria-label="Find a game" placeholder="Find a game…" value={gameSearch} onChange={e => setGameSearch(e.target.value)} /></div>}
                <div className={styles.gameGrid} aria-label="Choose a game">
                  {!gameSearch && <button type="button" className={styles.gameTile} data-tone="0" aria-pressed={kind === 'arcade-any' || kind === 'vocab-games' && !slug} onClick={() => { if (kind !== 'vocab-games') setKind('arcade-any'); setSlug('') }}><span className={styles.gameIcon}><Sparkles size={23} /></span><span><b>Let them choose</b><small>{kind === 'vocab-games' ? 'Any word game' : 'Any arcade game'}</small></span><span className={styles.selection}>{(kind === 'arcade-any' || kind === 'vocab-games' && !slug) && <Check size={13} />}</span></button>}
                  {filteredGames.map((game, index) => <button type="button" className={styles.gameTile} data-tone={(index % 4) + 1} key={game.slug} aria-pressed={slug === game.slug} onClick={() => { setSlug(game.slug); if (kind === 'arcade-any') setKind('arcade-game') }}><span className={styles.gameIcon}>{kind === 'vocab-games' ? <BookOpen size={23} /> : index % 3 === 0 ? <Zap size={23} /> : index % 3 === 1 ? <Target size={23} /> : <Gamepad2 size={23} />}</span><span><b>{game.name.replace(/\b\w+/g, word => word[0].toUpperCase() + word.slice(1).toLowerCase())}</b><small>{kind === 'vocab-games' ? 'Word game' : 'Arcade game'}</small></span><span className={styles.selection}>{slug === game.slug && <Check size={13} />}</span></button>)}
                  {!filteredGames.length && gameSearch && <p className={styles.help}>No games found. Try another name.</p>}
                </div>
              </> : <div className={styles.mathCard}><GraduationCap size={28} /><div><b>A little practice adds up.</b><p>Set a goal for XP earned through math practice.</p></div></div>}
              <div className={styles.goalRow}><div><label htmlFor="bounty-target">The finish line</label><span className={styles.help}>{metric === 'plays' ? 'Completed runs count.' : 'Activity XP counts toward this goal.'}</span></div><div className={styles.goalControls}><div className={styles.stepper}><button type="button" aria-label="Decrease target" disabled={Number(target) <= 1} onClick={() => setTarget(String(Math.max(1, Number(target) - 1)))}><Minus size={16} /></button><Input id="bounty-target" type="number" min={1} max={1000} step={1} required value={target} onChange={e => setTarget(e.target.value)} /><button type="button" aria-label="Increase target" disabled={Number(target) >= 1000} onClick={() => setTarget(String(Math.min(1000, Number(target) + 1)))}><Plus size={16} /></button></div><select aria-label="Target measure" value={metric} disabled={kind === 'math'} onChange={e => { setMetric(e.target.value); setTarget(e.target.value === 'plays' ? '3' : '25') }}><option value="plays">completed runs</option><option value="xp">XP earned</option></select></div></div>
            </>}
            {step === 1 && <>
              <div className={styles.periods}>{BOUNTY_PERIODS.map(p => <button type="button" key={p} aria-pressed={period === p} onClick={() => choosePeriod(p)}><span className={styles.periodIcon}>{p === 'daily' ? <Zap size={21} /> : p === 'custom' ? <Sparkles size={21} /> : <CalendarDays size={21} />}</span><b>{p === 'custom' ? 'My own dates' : PERIOD_LABELS[p]}</b><small>{p === 'daily' ? 'A quick daily win' : p === 'weekly' ? 'Build a weekly habit' : p === 'monthly' ? 'Keep the momentum' : 'Make room for your plan'}</small><span className={styles.selection}>{period === p && <Check size={13} />}</span></button>)}</div>
              <div className={styles.scheduleSummary}><CalendarDays size={20} /><div><b>{dateLabel}</b><p>{PERIOD_HELP[period]}</p></div></div>
              <details className={styles.options} open={period === 'custom' ? true : undefined} key={period}><summary>Adjust dates <ChevronDown size={15} /></summary><div className={styles.grid}><label>Start date<Input type="date" required value={starts} onChange={e => setStarts(e.target.value)} /></label><label>Last day (included)<Input type="date" required min={starts} value={ends} onChange={e => setEnds(e.target.value)} /></label></div><p className={styles.help}>Choose up to one year. Repeating targets reset within these dates. All times are Eastern.</p></details>
            </>}
            {step === 2 && <>
              <div className={styles.fieldHeader}><label>Your classes</label>{data.myCourses.length > 1 && <button type="button" onClick={() => setCourses(courses.length === data.myCourses.length ? [] : data.myCourses.map(c => c.id))}>{courses.length === data.myCourses.length ? 'Clear classes' : 'Select all'}</button>}</div>
              <div className={styles.classes}>{data.myCourses.map(c => <button type="button" key={c.id} aria-pressed={courses.includes(c.id)} onClick={() => setCourses(previous => toggleId(previous, c.id))}><span className={styles.classIcon}><Users size={20} /></span><span><b>{c.label}</b><small>{data.students.filter(s => s.courseIds.includes(c.id)).length} students</small></span><span className={styles.selection}>{courses.includes(c.id) && <Check size={13} />}</span></button>)}</div>
              {!data.myCourses.length && <p className={styles.help}>Add a class and enroll students to launch your first bounty.</p>}
              <details className={styles.studentPicker}><summary>Or choose individual students {students.length > 0 && `(${students.length})`}<ChevronDown size={15} /></summary><Input aria-label="Find a student" placeholder="Search your roster…" value={search} onChange={e => setSearch(e.target.value)} /><div className={styles.studentList}>{data.students.filter(s => `${s.name} ${s.email}`.toLowerCase().includes(search.toLowerCase())).map(s => { const covered = s.courseIds.some(id => courses.includes(id)); return <label key={s.id}><input type="checkbox" checked={covered || students.includes(s.id)} disabled={covered} onChange={() => setStudents(previous => toggleId(previous, s.id))} /><span>{s.name || s.email || 'Student'}<small>{covered ? 'Included with your class' : s.email}</small></span></label>})}{!data.students.filter(s => `${s.name} ${s.email}`.toLowerCase().includes(search.toLowerCase())).length && <p className={styles.help}>No students found.</p>}</div></details>
              <div className={styles.rewardSection}><label htmlFor="bounty-reward"><Coins size={18} /> Make it rewarding</label><div className={styles.rewardChoices}>{[10,25,50].map(value => <button type="button" key={value} aria-pressed={Number(bonus) === value} onClick={() => setBonus(String(value))}>+{value}<small>XP</small></button>)}<label className={styles.customReward}>Your amount<Input id="bounty-reward" aria-label="XP bounty" type="number" required min={1} max={100} step={1} value={bonus} onChange={e => setBonus(e.target.value)} /></label></div><p className={styles.help}>Each student earns this bonus once per {period === 'custom' ? 'selected period' : period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month'} when they meet the goal.</p></div>
              <details className={styles.options}><summary>Give it a name <span>Optional</span><ChevronDown size={15} /></summary><Input aria-label="Bounty title" value={title} maxLength={120} placeholder={autoTitle} onChange={e => setTitle(e.target.value)} /></details>
            </>}
          </div>
          <p className={styles.validationHint} role="status">{step === 2 && !ready ? missing : ''}</p>
          <footer className={styles.stepFooter}><Button type="button" variant="ghost" onClick={() => goToStep(Math.max(0, step - 1))} disabled={step === 0 || !!busy}><ArrowLeft size={17} /> Back</Button><div>{step === 2 ? <><span className={styles.footerHint} aria-live="polite">{ready ? `${recipients.length} ${recipients.length === 1 ? 'student' : 'students'} · ready to go!` : missing}</span><Button type="submit" className={styles.launchButton} disabled={!!busy || !ready}>{busy === 'create' ? 'Launching…' : 'Launch bounty'}<Sparkles size={17} /></Button></> : <><span className={styles.footerHint}>{stepReady ? 'Looking good.' : step === 0 ? missing : 'Check your dates.'}</span><Button type="submit" disabled={!!busy || !stepReady}>Next: {step === 0 ? 'the timing' : 'your students'}<ArrowRight size={17} /></Button></>}</div></footer>
        </div>
        <aside className={styles.preview}><div className={styles.previewSticky}><div className={styles.eyebrow}>THEIR NEXT LITTLE WIN</div><div className={styles.ticket}><div className={styles.ticketTop}><span><Gamepad2 size={16} /> XP BOUNTY</span><Sparkles size={18} /></div><div className={styles.ticketBody}><div className={styles.ticketMedal}><Trophy size={30} /></div><div className={styles.bigReward}>+{bonus || '0'} <span>XP</span></div><h3>{title.trim() || (gameChosen ? gameName : 'A new challenge awaits')}</h3><p>{gameChosen ? `${metric === 'plays' ? 'Complete' : 'Earn'} ${target || '0'} ${metric === 'plays' ? 'runs' : 'XP'} to earn your reward.` : 'Pick the play. We’ll make it a challenge.'}</p></div><div className={styles.ticketBottom}><CalendarDays size={15} /><span>{dateLabel}</span></div></div><div className={styles.previewNotes}><div><span className={styles.noteCheck} data-done={gameChosen}><Check size={13} /></span><span>{gameChosen ? 'Activity selected' : 'Choose an activity'}</span><button type="button" onClick={() => goToStep(0)} aria-label="Edit activity">Edit</button></div><div><span className={styles.noteCheck} data-done={datesValid}><Check size={13} /></span><span>{PERIOD_LABELS[period]} reward</span><button type="button" onClick={() => goToStep(1)} aria-label="Edit timing">Edit</button></div><div><span className={styles.noteCheck} data-done={!!recipients.length}><Check size={13} /></span><span>{recipients.length ? `${recipients.length} ${recipients.length === 1 ? 'student' : 'students'} included` : 'Choose your students'}</span><button type="button" onClick={() => goToStep(2)} aria-label="Edit students and reward">Edit</button></div></div><p className={styles.previewFoot}><Users size={14} /> A challenge just for your classroom.</p></div></aside>
      </form>
      <section className={styles.manage} id="bounty-board"><div className={styles.manageHeader}><div><div className={styles.eyebrow}>KEEP THE GOOD THINGS GOING</div><h2>Your bounty board <span>{data.challenges.length}</span></h2></div><select aria-label="Filter bounties" value={filter} onChange={e => setFilter(e.target.value)}>{['all','live','scheduled','paused','ended'].map(value => <option key={value} value={value}>{value === 'all' ? 'All bounties' : value[0].toUpperCase() + value.slice(1)}</option>)}</select></div>
        {!visible.length && <div className={styles.empty}><span><Trophy size={27} /></span><h3>{data.challenges.length ? 'Nothing here just yet.' : 'Make room for your first little win.'}</h3><p>{data.challenges.length ? 'Try another filter to see your bounties.' : 'Your assigned challenges will land right here.'}</p></div>}
        <div className={styles.bountyGrid}>{visible.map(c => <article key={c.id} className={styles.bounty}><div className={styles.bountyTop}><span className={styles.status} data-live={stateOf(c) === 'Live'}>{stateOf(c) === 'Live' && <span />}{stateOf(c)}</span><strong>+{c.bonus_xp} <small>XP</small></strong></div><h3>{c.title}</h3><p>{c.target} {c.metric === 'plays' ? 'runs' : 'XP'} · {PERIOD_LABELS[c.period]} · {c.assignments.length === 1 ? c.assignments[0].label : `${c.assignments.length} assigned groups / students`}</p><div className={styles.completionLabel}><span>{c.completedPeriod} of {c.recipientCount} students earned it</span><span>{c.recipientCount ? Math.round(c.completedPeriod / c.recipientCount * 100) : 0}%</span></div><progress aria-label={`Completion for ${c.title}`} max={Math.max(1,c.recipientCount)} value={c.completedPeriod} /><div className={styles.bountyBottom}><span><CalendarDays size={14} />{prettyDate(c.window.start)} – {prettyDate(c.window.end)}</span><div className={styles.actions}>{stateOf(c) !== 'Ended' && <Button type="button" size="sm" variant="ghost" disabled={!!busy} onClick={() => manage(c)} aria-label={`${c.active ? 'Pause' : 'Resume'} ${c.title}`}>{c.active ? <Pause size={14} /> : <Play size={14} />}{c.active ? 'Pause' : 'Resume'}</Button>}<Button type="button" size="icon" variant="ghost" disabled={!!busy} aria-label={`Delete ${c.title}`} onClick={() => manage(c,true)}><Trash2 size={15} /></Button></div></div><details className={styles.bountyDetails}><summary>Assignment details <ChevronDown size={13} /></summary><p>{c.is_global ? 'All your active classes' : c.assignments.map(a => a.label).join(' · ')}</p><p>{c.game_slug ? data.games.find(g => g.slug === c.game_slug)?.name ?? VOCAB_BOUNTY_GAMES.find(g => g.slug === c.game_slug)?.name ?? c.game_slug : BOUNTY_KIND_LABELS[c.kind]}</p><p>Full schedule: {c.starts_on} → {c.ends_on} · Eastern time</p></details></article>)}</div>
      </section>
    </>}
  </div>
}
