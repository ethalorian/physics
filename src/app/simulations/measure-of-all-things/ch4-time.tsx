"use client"

// Chapter 4 — The Clock That Failed (1793)
// Decimal time: the metric system's most instructive failure.
// Ends with the second surviving into SI and a first derived unit (m/s).

import { useEffect, useState } from 'react'
import { Scene, YearBanner, Narration, Speech, FactBox, NextButton, StepDots, MC, NumQ } from './ui'

function hand(cx: number, cy: number, angleDeg: number, len: number, width: number, color: string) {
  const a = ((angleDeg - 90) * Math.PI) / 180
  return (
    <line
      x1={cx} y1={cy}
      x2={cx + len * Math.cos(a)} y2={cy + len * Math.sin(a)}
      stroke={color} strokeWidth={width} strokeLinecap="round"
    />
  )
}

function ClockFace({ divisions, label, hourAngle, minuteAngle, readout }: {
  divisions: number
  label: string
  hourAngle: number
  minuteAngle: number
  readout: string
}) {
  const ticks = Array.from({ length: divisions }, (_, i) => {
    const a = ((i * 360) / divisions - 90) * (Math.PI / 180)
    return (
      <g key={i}>
        <line
          x1={70 + 58 * Math.cos(a)} y1={70 + 58 * Math.sin(a)}
          x2={70 + 64 * Math.cos(a)} y2={70 + 64 * Math.sin(a)}
          stroke="currentColor" strokeWidth={1.5}
        />
        <text x={70 + 48 * Math.cos(a)} y={70 + 48 * Math.sin(a) + 4}
          fontSize="10" textAnchor="middle" fill="currentColor">
          {i === 0 ? divisions : i}
        </text>
      </g>
    )
  })
  return (
    <div className="text-center space-y-1">
      <svg viewBox="0 0 140 140" className="w-36 h-36 mx-auto" role="img" aria-label={label}>
        <circle cx="70" cy="70" r="66" fill="none" stroke="currentColor" strokeWidth="2.5" />
        {ticks}
        {hand(70, 70, hourAngle, 34, 4, '#b45309')}
        {hand(70, 70, minuteAngle, 50, 2.5, '#dc2626')}
        <circle cx="70" cy="70" r="3" fill="currentColor" />
      </svg>
      <div className="text-sm font-semibold">{label}</div>
      <div className="font-mono text-sm tabular-nums text-muted-foreground">{readout}</div>
    </div>
  )
}

function TwoClocks() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  if (!now) return <div className="h-44" />

  const secOfDay = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
  const frac = secOfDay / 86400

  // Standard 12-hour clock
  const stdH = (now.getHours() % 12) + now.getMinutes() / 60
  const stdM = now.getMinutes() + now.getSeconds() / 60

  // Decimal clock: 10 h/day, 100 min/h
  const decTotal = frac * 10 // decimal hours
  const decH = Math.floor(decTotal)
  const decM = Math.floor((decTotal - decH) * 100)

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="flex justify-center gap-10 flex-wrap">
      <ClockFace divisions={12} label="Your clock (24 h day)"
        hourAngle={stdH * 30} minuteAngle={stdM * 6}
        readout={`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`} />
      <ClockFace divisions={10} label="Revolutionary clock (10 h day)"
        hourAngle={decTotal * 36} minuteAngle={((decTotal - decH) * 100) * 3.6}
        readout={`${decH}:${pad(decM)} decimal time`} />
    </div>
  )
}

const STEPS = 6

export default function Ch4Time({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const [drills, setDrills] = useState(0)
  const [speedDrills, setSpeedDrills] = useState(0)
  const [solved, setSolved] = useState<Record<number, boolean>>({})
  const next = () => setStep(s => s + 1)
  const solve = (i: number) => () => setSolved(prev => ({ ...prev, [i]: true }))

  return (
    <Scene>
      <div className="flex items-center justify-between">
        <YearBanner year="1793" place="Paris — a city resetting its clocks" />
        <StepDots total={STEPS} index={step} />
      </div>

      {step === 0 && (
        <>
          <Narration lines={[
            'Drunk on the success of base ten, the revolutionaries go further: decimal TIME. The day is split into 10 hours, each hour into 100 minutes, each minute into 100 seconds. Clockmakers begin producing ten-hour faces.',
            'Both clocks below are showing you the real time, right now — one in your hours, one in revolutionary hours.',
          ]} />
          <TwoClocks />
          <NextButton onClick={next} label="Run the numbers" />
        </>
      )}

      {step === 1 && (
        <>
          <NumQ
            prompt="In the decimal system: 10 hours × 100 minutes × 100 seconds. How many decimal seconds are in one day?"
            unit="decimal s" answer={100000}
            hint="10 × 100 × 100 — multiply the tens, count the zeros."
            onDone={() => setDrills(d => d + 1)}
          />
          <NumQ
            prompt="In our system: 24 hours × 60 minutes × 60 seconds. How many ordinary seconds are in one day?"
            unit="s" answer={86400}
            hint="24 × 60 = 1,440 minutes; then × 60."
            onDone={() => setDrills(d => d + 1)}
          />
          <NextButton onClick={next} disabled={drills < 2} label={drills < 2 ? `Solve both (${drills}/2)` : 'Compare them'} />
        </>
      )}

      {step === 2 && (
        <>
          <MC
            prompt="The same day holds 86,400 ordinary seconds or 100,000 decimal seconds. So a decimal second is…"
            choices={[
              'Slightly LONGER than an ordinary second',
              'Slightly SHORTER than an ordinary second (86,400 ÷ 100,000 = 0.864 of one)',
              'Exactly the same length',
            ]}
            answer={1}
            explain="More slices of the same pie means thinner slices: one decimal second = 0.864 ordinary seconds. Notice what this drill really was — converting between unit systems by reasoning about totals. That skill is the whole game in physics."
            onDone={solve(2)}
          />
          <NextButton onClick={next} label="So why did it die?" disabled={!solved[2]} />
        </>
      )}

      {step === 3 && (
        <>
          <Speech who="A Paris shopkeeper, 1794" text="My clock on the wall works fine. My neighbor's clock agrees with mine. You want me to buy a new one — to fix a problem I do not have?" />
          <MC
            prompt="Decimal time was abandoned within about 17 months, while the meter conquered the world. What is the key difference?"
            choices={[
              'Base ten mathematically cannot describe time',
              'The meter solved real chaos (every town disagreed); clocks already agreed everywhere, so decimal time solved nothing and cost everyone a new clock',
              'The government forgot to make decimal time legally required',
            ]}
            answer={1}
            explain="A standard wins when the pain of switching is smaller than the pain of staying. Lengths were chaos, so switching paid off. Time was already standardized — same hours in Paris, Lille, and Barcelona — so decimal time was all cost, no benefit. The second survived, and centuries later became an SI base unit alongside the meter and kilogram."
            onDone={solve(3)}
          />
          <NextButton onClick={next} label="One last tool: combining units" disabled={!solved[3]} />
        </>
      )}

      {step === 4 && (
        <>
          <Narration lines={[
            'Meter, kilogram, second — m, kg, s. The real power move is COMBINING them. A courier rides 36 km in 2 hours. How fast is that in the physicist\'s unit, meters per second?',
          ]} />
          <NumQ
            prompt="First convert the distance: 36 km = ? m"
            unit="m" answer={36000}
            hint="Three rungs down the ladder: × 1,000."
            onDone={() => setSpeedDrills(d => d + 1)}
          />
          <NumQ
            prompt="Convert the time: 2 hours = ? s"
            unit="s" answer={7200}
            hint="2 × 3,600 seconds per hour."
            onDone={() => setSpeedDrills(d => d + 1)}
          />
          <NumQ
            prompt="Speed = distance ÷ time = 36,000 m ÷ 7,200 s = ? m/s"
            unit="m/s" answer={5}
            hint="36,000 ÷ 7,200. Cancel the zeros first: 36 ÷ 7.2."
            onDone={() => setSpeedDrills(d => d + 1)}
          />
          <NextButton onClick={next} disabled={speedDrills < 3} label={speedDrills < 3 ? `Solve all three (${speedDrills}/3)` : 'Continue'} />
        </>
      )}

      {step === 5 && (
        <>
          <Narration lines={[
            'That unit — m/s — is your first DERIVED unit: built by combining base units. Velocity, acceleration, force, energy: everything you will meet in physics this year is assembled from m, kg, and s the same way.',
            'One mission remains: prove you can wield all of it.',
          ]} />
          <FactBox title="SI today" text="The modern metric system (SI) has seven base units. You now know the big three for mechanics: the meter, the kilogram, and the second." />
          <NextButton onClick={onComplete} label="Continue to Chapter 5: The Final Mission" />
        </>
      )}
    </Scene>
  )
}
