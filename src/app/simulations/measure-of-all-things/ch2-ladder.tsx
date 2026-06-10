"use client"

// Chapter 2 — The Ladder of Ten (1795)
// Prefixes as rungs on a ladder; conversion as decimal-point sliding.
// Part A: explore every rung. Part B: convert by physically walking the ladder.

import { useMemo, useState } from 'react'
import { Scene, YearBanner, Narration, FactBox, NextButton, StepDots, MC, NumQ } from './ui'

interface Rung {
  symbol: string
  name: string
  power: number // 1 unit = 10^power meters
  example: string
}

// Ordered from largest to smallest. Index 0 = km.
const RUNGS: Rung[] = [
  { symbol: 'km', name: 'kilometer', power: 3, example: 'a 12-minute walk across town' },
  { symbol: 'hm', name: 'hectometer', power: 2, example: 'the length of a soccer field' },
  { symbol: 'dam', name: 'dekameter', power: 1, example: 'a classroom wall-to-wall, three times over' },
  { symbol: 'm', name: 'meter', power: 0, example: 'a doorway, or one big step' },
  { symbol: 'dm', name: 'decimeter', power: -1, example: 'the width of your hand, fingers spread' },
  { symbol: 'cm', name: 'centimeter', power: -2, example: 'the width of your pinky fingernail' },
  { symbol: 'mm', name: 'millimeter', power: -3, example: 'the thickness of a dime' },
]

const fmt = (n: number): string =>
  Number(n.toPrecision(12)).toLocaleString('en-US', { maximumFractionDigits: 7 })

/* ------------------------- Part A: rung explorer ------------------------- */

function RungExplorer({ onAllVisited }: { onAllVisited: () => void }) {
  const [idx, setIdx] = useState(3) // start at the meter
  const [visited, setVisited] = useState<Set<number>>(new Set([3]))
  const allSeen = visited.size === RUNGS.length

  const go = (delta: number) => {
    const n = Math.min(RUNGS.length - 1, Math.max(0, idx + delta))
    setIdx(n)
    setVisited(prev => {
      const s = new Set(prev).add(n)
      if (s.size === RUNGS.length && prev.size !== RUNGS.length) onAllVisited()
      return s
    })
  }

  const r = RUNGS[idx]
  return (
    <div className="grid sm:grid-cols-[auto_1fr] gap-4 items-start">
      {/* ladder rail */}
      <div className="flex sm:flex-col gap-1" role="list" aria-label="Prefix ladder">
        {RUNGS.map((rg, i) => (
          <button
            key={rg.symbol}
            type="button"
            onClick={() => { setIdx(i); setVisited(prev => { const s = new Set(prev).add(i); if (s.size === RUNGS.length && prev.size !== RUNGS.length) onAllVisited(); return s }) }}
            className={`px-2.5 py-1 rounded-md text-sm font-mono border transition
              ${i === idx ? 'bg-amber-500 text-white border-amber-500' :
                visited.has(i) ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700' :
                'bg-background border-border hover:border-amber-400'}`}
          >
            {rg.symbol}
          </button>
        ))}
      </div>

      {/* current rung detail */}
      <div className="rounded-lg border border-border p-4 space-y-3 min-h-[170px]">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-2xl font-bold">1 {r.symbol}</span>
          <span className="text-muted-foreground">{r.name}</span>
          <span className="font-mono text-sm px-2 py-0.5 rounded bg-muted">
            = 10{r.power >= 0 ? <sup>{r.power}</sup> : <sup>{r.power}</sup>} m{r.power === 0 ? ' (the base unit)' : ''}
          </span>
        </div>
        <p className="text-[15px]">About: <span className="font-medium">{r.example}</span></p>
        {/* relative-size bar: current unit vs one rung smaller */}
        {idx < RUNGS.length - 1 && (
          <div className="space-y-1">
            <div className="h-4 rounded bg-amber-500" style={{ width: '100%' }} />
            <div className="flex gap-[2px]">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} className="h-3 rounded-sm bg-amber-300 dark:bg-amber-700" style={{ width: '9.6%' }} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              One {r.symbol} holds exactly ten {RUNGS[idx + 1].symbol} — every rung is a factor of ten.
            </p>
          </div>
        )}
        <div className="flex gap-2">
          <button type="button" onClick={() => go(-1)} disabled={idx === 0}
            className="px-3 py-1.5 rounded-lg border border-border hover:border-amber-400 disabled:opacity-40 text-sm">
            ↑ bigger ×10
          </button>
          <button type="button" onClick={() => go(1)} disabled={idx === RUNGS.length - 1}
            className="px-3 py-1.5 rounded-lg border border-border hover:border-amber-400 disabled:opacity-40 text-sm">
            ↓ smaller ÷10
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {allSeen ? 'You have visited every rung.' : `Visit every rung to continue (${visited.size}/${RUNGS.length}).`}
        </p>
      </div>
    </div>
  )
}

/* --------------------- Part B: walk-the-ladder converter --------------------- */

function LadderConverter({ startValue, fromIdx, toIdx, onDone }: {
  startValue: number
  fromIdx: number
  toIdx: number
  onDone: () => void
}) {
  const [pos, setPos] = useState(fromIdx)
  const [locked, setLocked] = useState(false)
  const value = useMemo(
    () => startValue * Math.pow(10, RUNGS[fromIdx].power - RUNGS[pos].power),
    [startValue, fromIdx, pos],
  )
  const atTarget = pos === toIdx

  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <p className="font-medium">
        Convert {fmt(startValue)} {RUNGS[fromIdx].symbol} into {RUNGS[toIdx].symbol} by walking the ladder.
        Each step multiplies or divides by 10 — watch the decimal point slide.
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-2xl font-mono font-bold tabular-nums">{fmt(value)}</span>
        <span className="text-xl font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40">{RUNGS[pos].symbol}</span>
        <span className="text-sm text-muted-foreground">target: {RUNGS[toIdx].symbol}</span>
      </div>
      <div className="flex gap-2">
        <button type="button" disabled={locked || pos === 0} onClick={() => setPos(p => p - 1)}
          className="px-3 py-1.5 rounded-lg border border-border hover:border-amber-400 disabled:opacity-40 text-sm">
          ↑ to {pos > 0 ? RUNGS[pos - 1].symbol : '—'} (÷10)
        </button>
        <button type="button" disabled={locked || pos === RUNGS.length - 1} onClick={() => setPos(p => p + 1)}
          className="px-3 py-1.5 rounded-lg border border-border hover:border-amber-400 disabled:opacity-40 text-sm">
          ↓ to {pos < RUNGS.length - 1 ? RUNGS[pos + 1].symbol : '—'} (×10)
        </button>
        {atTarget && !locked && (
          <button type="button" onClick={() => { setLocked(true); onDone() }}
            className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700">
            Lock it in: {fmt(value)} {RUNGS[toIdx].symbol}
          </button>
        )}
        {locked && <span className="text-green-600 dark:text-green-400 font-semibold self-center">Recorded</span>}
      </div>
    </div>
  )
}

/* --------------------------------- chapter -------------------------------- */

const STEPS = 6

export default function Ch2Ladder({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const [explored, setExplored] = useState(false)
  const [conv1, setConv1] = useState(false)
  const [conv2, setConv2] = useState(false)
  const [drills, setDrills] = useState(0)
  const [instinct, setInstinct] = useState(false)
  const next = () => setStep(s => s + 1)

  return (
    <Scene>
      <div className="flex items-center justify-between">
        <YearBanner year="1795" place="The new Republic of France" />
        <StepDots total={STEPS} index={step} />
      </div>

      {step === 0 && (
        <>
          <Narration lines={[
            'One base unit is not enough. A tailor needs lengths smaller than a meter; a courier needs lengths far larger. The old system invented a new unrelated unit for every size — inches, feet, leagues, each with its own conversion to memorize.',
            'The Academy does something smarter: ONE unit, stretched and shrunk by tens, with a prefix to say which power of ten. Greek prefixes scale up (kilo = ×1000). Latin prefixes scale down (milli = ÷1000).',
          ]} />
          <NextButton onClick={next} label="Climb the ladder" />
        </>
      )}

      {step === 1 && (
        <>
          <RungExplorer onAllVisited={() => setExplored(true)} />
          <NextButton onClick={next} disabled={!explored} label={explored ? 'Now use it' : 'Visit every rung first'} />
        </>
      )}

      {step === 2 && (
        <>
          <Narration lines={[
            'Here is the payoff of base ten: converting units is not arithmetic, it is a walk. One rung = one slide of the decimal point.',
          ]} />
          <LadderConverter startValue={3.5} fromIdx={3} toIdx={5} onDone={() => setConv1(true)} />
          <NextButton onClick={next} disabled={!conv1} />
        </>
      )}

      {step === 3 && (
        <>
          <LadderConverter startValue={1200} fromIdx={3} toIdx={0} onDone={() => setConv2(true)} />
          <FactBox title="Compare" text="In the old units: 1,200 yards to miles means dividing by 1,760. On the ladder: three rungs up, slide the decimal three places. That asymmetry is why science went metric." />
          <NextButton onClick={next} disabled={!conv2} label="Drills, no ladder" />
        </>
      )}

      {step === 4 && (
        <>
          <Narration lines={['Now without the ladder in front of you. Picture it.']} />
          <NumQ prompt="A beetle is 45 mm long. How many centimeters is that?" unit="cm" answer={4.5}
            hint="mm to cm is one rung up the ladder: divide by 10." onDone={() => setDrills(d => d + 1)} />
          <NumQ prompt="A race is 0.75 km. How many meters?" unit="m" answer={750}
            hint="km to m is three rungs down: multiply by 1,000." onDone={() => setDrills(d => d + 1)} />
          <NumQ prompt="A spool holds 2,500,000 mm of thread. How many kilometers? (mm to km crosses the whole ladder.)" unit="km" answer={2.5}
            hint="mm to m: divide by 1,000 (gives 2,500 m). Then m to km: divide by 1,000 again." onDone={() => setDrills(d => d + 1)} />
          <NextButton onClick={next} disabled={drills < 3} label={drills < 3 ? `Solve all three (${drills}/3)` : 'One last instinct check'} />
        </>
      )}

      {step === 5 && (
        <>
          <MC
            prompt="No measuring, just instinct — a new pencil is about 18 what?"
            choices={['18 mm', '18 cm', '18 dm', '18 m']}
            answer={1}
            explain="18 cm — almost two hand-widths. Building this instinct for which unit FITS a thing matters as much as converting. 18 mm is a fingernail; 18 m is a house. If your answer to a physics problem says a pencil is 18 m long, the ladder is how you catch it."
            onDone={() => setInstinct(true)}
          />
          <NextButton onClick={onComplete} disabled={!instinct} label="Continue to Chapter 3: Water Ties It Together" />
        </>
      )}
    </Scene>
  )
}
