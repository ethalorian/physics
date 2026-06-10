"use client"

// Chapter 1 — Measuring the Earth (1792)
// The meter is defined as 1/10,000,000 of the pole-to-equator quadrant.
// Students derive the meter from the Earth, and see why a power of ten.

import { useState } from 'react'
import { Scene, YearBanner, Narration, Speech, FactBox, NextButton, StepDots, MC, NumQ } from './ui'
import { Ch1Scene } from './scenes'

function MeridianGlobe() {
  // Simple globe with the Paris meridian quadrant (pole -> equator) highlighted
  // and the surveyed arc (Dunkirk -> Barcelona) marked.
  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-xs mx-auto" role="img"
      aria-label="Globe showing the meridian quadrant from the North Pole to the Equator through Paris">
      <circle cx="150" cy="150" r="120" fill="#dbeafe" stroke="#64748b" strokeWidth="2" />
      {/* equator */}
      <line x1="30" y1="150" x2="270" y2="150" stroke="#64748b" strokeWidth="1.5" strokeDasharray="5 4" />
      <text x="236" y="166" fontSize="11" fill="currentColor">Equator</text>
      {/* quadrant: pole to equator along the left meridian */}
      <path d="M 150 30 A 120 120 0 0 0 30 150" fill="none" stroke="#dc2626" strokeWidth="5" strokeLinecap="round" />
      <circle cx="150" cy="30" r="5" fill="#1e293b" />
      <text x="158" y="28" fontSize="11" fill="currentColor">North Pole</text>
      {/* surveyed arc portion (roughly Dunkirk -> Barcelona) */}
      <path d="M 92 47 A 120 120 0 0 0 44 105" fill="none" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round" opacity="0.9" />
      <text x="18" y="60" fontSize="11" fill="currentColor" fontWeight="600">surveyed arc</text>
      <text x="18" y="74" fontSize="10" fill="currentColor">Dunkirk to Barcelona</text>
      <text x="52" y="230" fontSize="12" fill="#dc2626" fontWeight="600">quadrant = pole to equator</text>
    </svg>
  )
}

function DivisionLadder() {
  // 10,000 km divided by ten, seven times, lands on 1 m.
  const rows = [
    ['10,000 km', 'the whole quadrant'],
    ['1,000 km', '÷ 10'],
    ['100 km', '÷ 10'],
    ['10 km', '÷ 10'],
    ['1 km', '÷ 10'],
    ['100 m', '÷ 10'],
    ['10 m', '÷ 10'],
    ['1 m', '÷ 10  — the meter'],
  ]
  return (
    <div className="rounded-lg border border-border overflow-hidden text-sm">
      {rows.map(([v, note], i) => (
        <div key={i} className={`flex justify-between px-3 py-1.5 ${i % 2 ? 'bg-muted/50' : ''} ${i === rows.length - 1 ? 'font-semibold text-amber-700 dark:text-amber-400' : ''}`}>
          <span className="tabular-nums">{v}</span>
          <span className="text-muted-foreground">{note}</span>
        </div>
      ))}
    </div>
  )
}

const STEPS = 6

export default function Ch1Meridian({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const [solved, setSolved] = useState<Record<number, boolean>>({})
  const next = () => setStep(s => s + 1)
  const solve = (i: number) => () => setSolved(prev => ({ ...prev, [i]: true }))

  return (
    <Scene>
      <div className="flex items-center justify-between">
        <YearBanner year="1792" place="Academy of Sciences, Paris" />
        <StepDots total={STEPS} index={step} />
      </div>
      <Ch1Scene step={step} />

      {step === 0 && (
        <>
          <Narration lines={[
            'The Academy makes its choice. The new unit of length will come from the largest thing everyone shares: the Earth itself.',
            'The definition: one meter is one ten-millionth (1/10,000,000) of the distance from the North Pole to the Equator, along the meridian line passing through Paris.',
          ]} />
          <MeridianGlobe />
          <NextButton onClick={next} />
        </>
      )}

      {step === 1 && (
        <>
          <Narration lines={[
            'Nobody can survey from the pole to the equator. So two astronomers, Delambre and Méchain, are sent to measure a piece of that meridian — from Dunkirk in the north to Barcelona in Spain — and calculate the rest from geometry.',
            'It was supposed to take a year. It took seven. France was at war; men on hilltops with telescopes and strange instruments kept getting arrested as spies.',
          ]} />
          <Speech who="Méchain, in a letter south of the border" text="I am detained again. They cannot decide if I am a spy or merely a madman measuring the world." />
          <NextButton onClick={next} label="Do the math they were chasing" />
        </>
      )}

      {step === 2 && (
        <>
          <Narration lines={[
            'Time to derive the meter yourself. Use the round numbers the definition was designed to produce.',
          ]} />
          <NumQ
            prompt="The full distance around the Earth (through the poles) is about 40,000 km. The quadrant — pole to equator — is one quarter of that. How long is the quadrant, in kilometers?"
            unit="km"
            answer={10000}
            hint="One quarter of 40,000."
            onDone={solve(2)}
          />
          <NextButton onClick={next} disabled={!solved[2]} />
        </>
      )}

      {step === 3 && (
        <>
          <NumQ
            prompt="Convert: 10,000 km is how many meters? (1 km = 1,000 m)"
            unit="m"
            answer={10000000}
            hint="10,000 × 1,000. Count the zeros: it should have seven."
            onDone={solve(3)}
          />
          <FactBox title="Check it" text="Quadrant = 10,000,000 m. Divide by 10,000,000 and you get exactly 1 m. The definition was rigged to make the numbers clean — on purpose." />
          <NextButton onClick={next} disabled={!solved[3]} />
        </>
      )}

      {step === 4 && (
        <>
          <DivisionLadder />
          <MC
            prompt="The Academy chose 1/10,000,000 — a power of ten — rather than, say, 1/12,345,678. Why does the power of ten matter so much?"
            choices={[
              'Ten was the Revolution\'s lucky number',
              'Our number system is base ten, so every conversion becomes just sliding a decimal point',
              'Powers of ten are easier to engrave on a metal bar',
            ]}
            answer={1}
            explain="This is the heart of the whole system. We write numbers in base ten, so if units also step by tens, converting between them never needs hard arithmetic — only moving a decimal point. The next chapter is entirely about exploiting that."
            onDone={solve(4)}
          />
          <NextButton onClick={next} disabled={!solved[4]} />
        </>
      )}

      {step === 5 && (
        <>
          <Narration lines={[
            'Seven years of surveying produced a platinum bar: the meter. Modern measurements show their Earth-based value was off by only about 0.2 millimeters — because the Earth is slightly squashed, not a perfect sphere.',
            'The meter outlived its own definition. Today it is defined by the speed of light, but it is still, within a hair, the bar Delambre and Méchain bled for.',
          ]} />
          <FactBox title="Today" text="1 meter = the distance light travels in 1/299,792,458 of a second. Nature-based, just like the Academy wanted — only a more reliable piece of nature." />
          <NextButton onClick={onComplete} label="Continue to Chapter 2: The Ladder of Ten" />
        </>
      )}
    </Scene>
  )
}
