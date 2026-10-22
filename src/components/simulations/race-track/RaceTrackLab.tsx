'use client'

import SimulationAvatar from '@/components/avatar/SimulationAvatar'
import AvatarCharacter from '@/components/avatar/AvatarCharacter'
import {InvestigationActor,useInvestigationParticipation} from '@/components/avatar/InvestigationParticipation'
import { useEffect, useId, useRef, useState, type ComponentProps } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Pause, Play, RotateCcw, Check, Download, Flag, FlaskConical, NotebookPen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSimEmbedded, useSimLesson } from '@/components/simulations/embed-context'
import { compass, DEFAULT_RACE, raceMeasurement, restoreRaceTrials, type RaceConditions, type RaceTrial } from './model'
import styles from './RaceTrackLab.module.css'

const fmt = (value: number, digits = 1) => value.toFixed(digits)
const lapLabel = (n: number) => ({ 0.25: '¼ lap', 0.5: '½ lap', 0.75: '¾ lap', 1: '1 lap', 1.5: '1½ laps', 2: '2 laps' }[n] ?? `${n} laps`)

/** A controlled experiment: exact endpoints, explicit vectors, and retained comparison trials. */
function RaceTrackContent({ savedTrials, onTrialsChange, readOnly = false, visible = true }: { savedTrials?: RaceTrial[]; onTrialsChange?: (trials: RaceTrial[]) => void; readOnly?: boolean; visible?: boolean } = {}) {
  const participant=useInvestigationParticipation()
  const embedded = useSimEmbedded()
  const lessonId = useSimLesson()
  const { data: session } = useSession()
  const staff = session?.user?.role === 'teacher' || session?.user?.role === 'admin'
  const marker = useId().replace(/:/g, '')
  const [conditions, setConditions] = useState<RaceConditions>(DEFAULT_RACE)
  const [progress, setProgress] = useState(0)
  const [running, setRunning] = useState(false)
  const [scratchTrials, setTrials] = useState<RaceTrial[]>([])
  const trials = savedTrials ?? scratchTrials
  const [notice, setNotice] = useState('')
  const [panel, setPanel] = useState<'experiment' | 'notebook'>('experiment')
  const [motionArrow, setMotionArrow] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [playback, setPlayback] = useState(4)
  const sequence = useRef(0)
  const frameProgress = useRef(0)
  const storageKey = session?.user?.id ? `race-trials:v1:${session.user.id}:${lessonId ?? 'exploration'}` : null
  const measurement = raceMeasurement(conditions, progress)

  useEffect(() => {
    if (savedTrials) { sequence.current = Math.max(0, ...savedTrials.map(t => t.id)); return }
    let saved: RaceTrial[] = []
    try { saved = storageKey ? restoreRaceTrials(JSON.parse(sessionStorage.getItem(storageKey) ?? '[]')) : [] } catch { /* Scratch storage is optional. */ }
    sequence.current = Math.max(0, ...saved.map(t => t.id)); setTrials(saved)
  }, [storageKey, savedTrials])

  useEffect(() => { if (!visible || panel === 'notebook' || participant?.active===false) setRunning(false) }, [visible, panel, participant?.active])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => setReducedMotion(media.matches)
    change(); media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [])
  useEffect(() => {
    if (!running) return
    let frame = 0, previous = 0
    // Playback is compressed for classroom use. Every reading uses physical time.
    const duration = raceMeasurement(conditions, 1).time / playback
    const tick = (now: number) => {
      if (previous) frameProgress.current = Math.min(1, frameProgress.current + Math.min((now - previous) / 1000, 0.1) / duration)
      previous = now
      setProgress(frameProgress.current)
      if (frameProgress.current < 1) frame = requestAnimationFrame(tick)
      else { setRunning(false); setNotice('Trial complete. Record it to compare with your next experiment.') }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [running, conditions, playback])

  function seek(value: number) { setRunning(false); frameProgress.current = value; setProgress(value); setNotice('') }
  function configure(patch: Partial<RaceConditions>) { seek(0); setConditions(current => ({ ...current, ...patch })) }
  function play() {
    if (running) { setRunning(false); return }
    if (reducedMotion) { seek(1); setNotice('Exact endpoint shown. Record this trial, or use the timeline to inspect intermediate positions.'); return }
    if (progress >= 1) { frameProgress.current = 0; setProgress(0) }
    setNotice(''); setRunning(true)
  }
  function record() {
    if (readOnly || progress < 1 || trials.length >= 12) return
    const id = ++sequence.current
    const next = [...trials, { id, conditions: { ...conditions } }]
    if (onTrialsChange) onTrialsChange(next); else setTrials(next)
    try { if (!savedTrials && storageKey) sessionStorage.setItem(storageKey, JSON.stringify(next)) } catch { /* Export and lesson evidence remain available. */ }
    setNotice(`Trial ${id} saved in Notebook. Change one condition and run again.`)
  }
  function removeLastTrial() {
    const next = trials.slice(0, -1)
    if (onTrialsChange) onTrialsChange(next); else setTrials(next)
    try { if (!savedTrials && storageKey) sessionStorage.setItem(storageKey, JSON.stringify(next)) } catch { /* Scratch storage is optional. */ }
    setNotice('Last trial removed.')
  }
  function exportTrials() {
    const rows = trials.map(trial => {
      const c = trial.conditions, m = raceMeasurement(c, 1)
      return [trial.id, c.radius, c.speed, c.laps, c.direction, m.time, m.distance, m.displacement, m.dx, m.dy, m.averageSpeed, m.averageVx, m.averageVy]
    })
    const csv = ['Trial,Radius (m),Speed (m/s),Laps,Direction,Time (s),Distance (m),Displacement magnitude (m),Delta x (m),Delta y (m),Average speed (m/s),Average vx (m/s),Average vy (m/s)', ...rows.map(row => row.join(','))].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a'); a.href = url; a.download = 'race-track-trials.csv'; a.click(); URL.revokeObjectURL(url)
  }
  const radius = 116, cx = 178, cy = 150
  const x = cx + radius * Math.cos(measurement.angle), y = cy - radius * Math.sin(measurement.angle)
  const sampleCount = Math.max(2, Math.ceil(Math.min(measurement.turns, 1) * 100) + 1)
  const path = Array.from({ length: sampleCount }, (_, i) => {
    const angle = (conditions.direction === 'clockwise' ? -1 : 1) * 2 * Math.PI * Math.min(measurement.turns, 1) * i / (sampleCount - 1)
    return `${i ? 'L' : 'M'} ${cx + radius * Math.cos(angle)} ${cy - radius * Math.sin(angle)}`
  }).join(' ')
  const svgLabel = `Car at ${fmt(measurement.turns, 2)} laps. Distance ${fmt(measurement.distance)} meters. Displacement ${fmt(measurement.displacement)} meters, ${compass(measurement.dx, measurement.dy)}.`
  return <div className={`${styles.lab} ${embedded ? styles.embedded : ''}`}>
    {!embedded && <header className={styles.heading}>
      <Link href="/simulations" className={styles.link}>← Simulation library</Link>
      <p className={styles.eyebrow}>Motion investigation · 25 minutes</p>
      <h1>A full lap. How far did you go?</h1>
      <p>The odometer says you traveled. Your position says you are back where you started. Investigate how both can be true.</p>
      <Link className={styles.link} href={staff ? '/admin/interactive-assignments?activity=simulation-race-track' : '/home'}>{staff ? 'Open interactive assignment & calendar →' : 'Open my assignments to save and submit your answers →'}</Link>
    </header>}
    <div className={styles.labBar}>
      <h2>{embedded ? 'Race Track' : 'Explore the track'}</h2>
      <div className={styles.tabs} role="group" aria-label="Simulation panel">
        <button type="button" aria-pressed={panel === 'experiment'} aria-controls={`${marker}-experiment`} onClick={() => setPanel('experiment')}><FlaskConical size={15} aria-hidden="true"/>Experiment</button>
        <button type="button" aria-pressed={panel === 'notebook'} aria-controls={`${marker}-notebook`} onClick={() => setPanel('notebook')}><NotebookPen size={15} aria-hidden="true"/>Notebook <span className={styles.count}>{trials.length}</span></button>
      </div>
    </div>
    <div id={`${marker}-experiment`} hidden={panel !== 'experiment'}>
      <div className={styles.conditions} aria-label="Trial conditions">
        <label>Stop after<select value={conditions.laps} disabled={running} onChange={e => configure({ laps: Number(e.target.value) })}>{[0.25, 0.5, 0.75, 1, 1.5, 2].map(n => <option key={n} value={n}>{lapLabel(n)}</option>)}</select></label>
        <label>Track radius<select value={conditions.radius} disabled={running} onChange={e => configure({ radius: Number(e.target.value) })}>{[25, 50, 100, 150].map(n => <option key={n} value={n}>{n} m</option>)}</select></label>
        <label>Car speed<select value={conditions.speed} disabled={running} onChange={e => configure({ speed: Number(e.target.value) })}>{[5, 10, 20, 40].map(n => <option key={n} value={n}>{n} m/s</option>)}</select></label>
        <label>Direction<select aria-label="Travel direction" value={conditions.direction} disabled={running} onChange={e => configure({ direction: e.target.value as RaceConditions['direction'] })}><option value="clockwise">Clockwise</option><option value="counterclockwise">Counterclockwise</option></select></label>
      </div>
      <div className={styles.experiment}>
        <div className={styles.scene}>
        <svg viewBox="0 0 370 305" role="img" aria-label={svgLabel}>
          <defs><marker id={`${marker}-displacement`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--viz-down)" /></marker><marker id={`${marker}-velocity`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--foreground)" /></marker></defs>
          <circle cx={cx} cy={cy} r={radius - 16} fill="var(--card)" opacity=".7" />
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--border)" strokeWidth="25" />
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--muted-foreground)" strokeWidth="1" strokeDasharray="3 7" />
          <line x1={cx} x2={cx + radius} y1={cy} y2={cy} stroke="var(--muted-foreground)" strokeDasharray="3 5" />
          <circle cx={cx} cy={cy} r="3" fill="var(--muted-foreground)" />
          <text x={cx + 16} y={cy - 12}>{conditions.radius} m</text>
          <text x={cx} y="20" textAnchor="middle">N · +y</text><text x="339" y={cy + 5} textAnchor="middle">E · +x</text>
          <path d={path} stroke="var(--primary)" strokeWidth="7" fill="none" strokeLinecap="round" />
          <line x1={cx + radius} y1={cy - 16} x2={cx + radius} y2={cy + 16} stroke="var(--foreground)" strokeWidth="3" />
          <text x={cx + radius - 10} y={cy - 25} textAnchor="end">START</text>
          {measurement.displacement > 0.01 && <line x1={cx + radius} y1={cy} x2={x} y2={y} stroke="var(--viz-down)" strokeWidth="3" markerEnd={`url(#${marker}-displacement)`} />}
          {motionArrow && <line x1={x} y1={y} x2={x + measurement.vx / conditions.speed * 42} y2={y - measurement.vy / conditions.speed * 42} stroke="var(--foreground)" strokeWidth="3" markerEnd={`url(#${marker}-velocity)`} />}
          <g transform={`translate(${x} ${y}) rotate(${-Math.atan2(measurement.vy, measurement.vx) * 180 / Math.PI})`}><rect x="-15" y="-9" width="30" height="18" rx="6" fill="var(--primary)" stroke="var(--background)" strokeWidth="2" /><rect x="1" y="-5" width="7" height="10" rx="2" fill="var(--primary-foreground)" /><InvestigationActor x={4} y={6} height={14} width={14} pose="head"/></g>
          <text x={cx} y="295" textAnchor="middle">{progress === 0 ? 'Ready at the starting line' : `${fmt(measurement.turns, 2)} of ${conditions.laps} laps · ${conditions.direction}`}</text>
        </svg>

        </div>
        <dl data-avatar-evidence className={styles.metrics} aria-label="Current measurements">
          <div className={styles.metric} data-tone="distance"><dt><i/>Distance traveled</dt><dd>{fmt(measurement.distance)} <small>m</small></dd><p>Length of the path</p></div>
          <div className={styles.metric} data-tone="displacement"><dt><i/>Displacement</dt><dd>{fmt(measurement.displacement)} <small>m</small></dd><p>{measurement.displacement ? compass(measurement.dx, measurement.dy) : 'Zero vector'}</p></div>
          <div className={styles.metric}><dt>Physical time</dt><dd>{fmt(measurement.time, 2)} <small>s</small></dd><p>{fmt(measurement.turns, 2)} of {conditions.laps} laps</p></div>
        </dl>
      </div>
      <div className={styles.timeline}><label htmlFor={`${marker}-timeline`}>Inspect the journey <span>{fmt(progress * 100, 0)}%</span></label><input id={`${marker}-timeline`} aria-valuetext={`${fmt(measurement.time,2)} s`} type="range" min="0" max="1000" step="1" value={Math.round(progress * 1000)} onChange={e => seek(Number(e.target.value) / 1000)} /></div>
      <div className={styles.actions}>
        <Button className={styles.runButton} onClick={play}>{running ? <Pause size={16} aria-hidden="true"/> : <Play size={16} aria-hidden="true"/>}{running ? 'Pause' : reducedMotion ? 'Show endpoint' : progress === 1 ? 'Replay trial' : progress > 0 ? 'Resume trial' : 'Run trial'}</Button>
        <Button variant="outline" onClick={record} disabled={readOnly || progress < 1 || running || trials.length >= 12}><Check size={16} aria-hidden="true"/>Record trial</Button>
        <Button variant="outline" aria-label="Jump to exact finish" title="Jump to exact finish" onClick={() => seek(1)} disabled={running}><Flag size={15} aria-hidden="true"/><span className={styles.optionalLabel}>Finish</span></Button>
        <Button variant="outline" aria-label="Reset current trial" title="Reset current trial" onClick={() => seek(0)}><RotateCcw size={15} aria-hidden="true"/><span className={styles.optionalLabel}>Reset</span></Button>
      </div>
      <p className={styles.status} role="status">{notice || (readOnly ? 'Submitted notebook is saved. You can still explore the model.' : trials.length >= 12 ? 'Notebook full (12 trials). Export your results or remove the last trial.' : progress === 1 ? 'At the endpoint. Record this trial, then change one condition.' : 'Predict first. Run a trial, then record your evidence.')}</p>
      <div className={styles.displayOptions}>
        <label><input type="checkbox" checked={motionArrow} onChange={e => setMotionArrow(e.target.checked)}/> Velocity arrow <span className={styles.arrowKey}>→</span></label>
        <label>Playback <select value={playback} disabled={running} onChange={e => setPlayback(Number(e.target.value))}><option value={1}>1×</option><option value={4}>4×</option><option value={8}>8×</option></select></label>
      </div>
      <details className={styles.details}><summary>Read the vectors & averages</summary><div className={styles.vectorReadout}><p><b>Displacement</b><span>Δx = {fmt(measurement.dx)} m<br/>Δy = {fmt(measurement.dy)} m</span></p><p><b>Average speed</b><span>{fmt(measurement.averageSpeed)} m/s</span></p><p><b>Average velocity</b><span>{fmt(measurement.averageVelocity)} m/s<br/>{compass(measurement.dx, measurement.dy)}</span></p><p><b>Instantaneous velocity</b><span>{conditions.speed} m/s<br/>{compass(measurement.vx, measurement.vy)}</span></p></div><p>Average quantities describe the journey so far. The tangent arrow shows the car’s velocity at that instant. Playback changes animation speed; the timer always reports physical time. The track drawing rescales with radius.</p></details>
    </div>
    <section id={`${marker}-notebook`} className={styles.notebook} aria-label="Trial notebook" hidden={panel !== 'notebook'}>
      {participant?.active&&<div className="flex items-start gap-4 py-3"><div className="w-20 shrink-0" aria-hidden="true"><AvatarCharacter portrait={participant.portrait} sampleStudent={participant.sample} pose="seated"/></div><p>Compare your avatar’s trips. Use distance, displacement, and physical time to explain which quantities change between trials.</p></div>}
      <div className={styles.notebookHeading}><p className={styles.eyebrow}>Your evidence</p><h3>Same track. Different journeys.</h3><p>{savedTrials ? 'Recorded trials are included with your submitted assignment.' : 'Trials stay in this browser tab. Export a copy to keep them.'}</p></div>
      {trials.length ? <><div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Recorded trial comparison"><table><caption className="sr-only">Recorded race track trials</caption><thead><tr><th scope="col">Trial / conditions</th><th scope="col">Time</th><th scope="col">Distance</th><th scope="col">Displacement</th><th scope="col">Avg. speed</th><th scope="col">Avg. velocity</th></tr></thead><tbody>{trials.map(trial => { const c = trial.conditions, m = raceMeasurement(c, 1); return <tr key={trial.id}><th scope="row">{trial.id} · {lapLabel(c.laps)}<small>r = {c.radius} m · {c.speed} m/s<br/>{c.direction}</small></th><td>{fmt(m.time, 2)} s</td><td>{fmt(m.distance)} m</td><td>{fmt(m.displacement)} m<small>Δx {fmt(m.dx)}<br/>Δy {fmt(m.dy)} m</small></td><td>{fmt(m.averageSpeed)} m/s</td><td>{fmt(m.averageVelocity)} m/s<small>{compass(m.dx, m.dy)}</small></td></tr> })}</tbody></table></div><p className={styles.tableHint}>Compare across each row. Scroll sideways for average speed and velocity.</p><div className={styles.actions}><Button variant="outline" onClick={exportTrials}><Download size={16} aria-hidden="true"/>Export table</Button><Button variant="outline" onClick={removeLastTrial} disabled={readOnly}>Remove last trial</Button></div></> : <div className={styles.emptyNotebook}><NotebookPen size={30} aria-hidden="true"/><h3>Your first comparison starts here.</h3><p>Try ¼, ½, and 1 lap with the same radius and speed. Finish each run and select <b>Record trial</b>.</p><Button onClick={() => setPanel('experiment')}>Start an experiment</Button></div>}
    </section>
    {!embedded && <section className={styles.guide}><div><p className={styles.eyebrow}>The investigation</p><h2>Same track. Different questions.</h2><ol><li>Predict distance and displacement for half a lap and a full lap. Explain how you decided.</li><li>Record ¼, ½, and 1 lap with radius 100 m and speed 20 m/s.</li><li>Repeat the full lap at 40 m/s. Which results change?</li><li>Compare clockwise and counterclockwise quarter laps. Use Δx and Δy to explain the difference.</li></ol></div><div><p className={styles.eyebrow}>Explain with evidence</p><h2>“Zero velocity means it never moved.”</h2><p>Use your full-lap results to explain what is wrong with this claim. Distinguish average velocity from instantaneous velocity and average speed.</p><p>Transfer: a runner completes 1½ laps on a 50 m radius track in 60 s. Find distance, displacement, average speed, and average velocity. Include directions.</p><Link className={styles.link} href={staff ? '/admin/interactive-assignments?activity=simulation-race-track' : '/home'}>{staff ? 'Open assignment calendar →' : 'Open my assignments →'}</Link></div></section>}
  </div>
}

export default function RaceTrackLab(props:ComponentProps<typeof RaceTrackContent>={}){return <SimulationAvatar id="race-track" title="Race Track" question="Can your avatar drive a full lap and have zero displacement?" actorInModel><RaceTrackContent {...props}/></SimulationAvatar>}
