"use client"

// Chapter 0 — A Kingdom of Confusion (1789)
// The student is a cloth merchant who gets burned by the fact that an "aune"
// in Lille is not an "aune" in Paris. Experiencing the problem IS the lesson.

import { useState } from 'react'
import { Scene, YearBanner, Narration, Speech, FactBox, NextButton, StepDots, MC, NumQ } from './ui'

const LILLE_AUNE = 0.70   // Flemish ell, meters
const PARIS_AUNE = 1.19   // Paris aune, meters
const BOUGHT = 20         // aunes bought in Lille
const CLOTH_M = LILLE_AUNE * BOUGHT // 14 m

function RodCompare() {
  // Visual: the two towns' "same-named" unit rods, drawn to scale, plus the cloth.
  const scale = 220 // px per meter, scaled into a 0..560 viewBox below
  const w = (m: number) => m * scale
  return (
    <svg viewBox="0 0 560 150" className="w-full max-w-xl mx-auto" role="img"
      aria-label="Comparison of the Lille aune (0.70 m) and the Paris aune (1.19 m)">
      <text x="0" y="18" fontSize="13" fill="currentColor" fontWeight="600">One aune in Lille</text>
      <rect x="0" y="26" width={w(LILLE_AUNE)} height="16" rx="3" fill="#b45309" />
      <text x={w(LILLE_AUNE) + 8} y="39" fontSize="12" fill="currentColor">0.70 m</text>

      <text x="0" y="72" fontSize="13" fill="currentColor" fontWeight="600">One aune in Paris</text>
      <rect x="0" y="80" width={w(PARIS_AUNE)} height="16" rx="3" fill="#92400e" />
      <text x={w(PARIS_AUNE) + 8} y="93" fontSize="12" fill="currentColor">1.19 m</text>

      <text x="0" y="126" fontSize="13" fill="currentColor" fontWeight="600">Your cloth (drawn to the same scale)</text>
      <rect x="0" y="132" width={w(2.5)} height="12" rx="3" fill="#6366f1" opacity="0.85" />
      <text x={w(2.5) + 8} y="142" fontSize="12" fill="currentColor">…and so on, 14 m total</text>
    </svg>
  )
}

const STEPS = 6

export default function Ch0Market({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const [solved, setSolved] = useState<Record<number, boolean>>({})
  const next = () => setStep(s => s + 1)
  const solve = (i: number) => () => setSolved(prev => ({ ...prev, [i]: true }))

  return (
    <Scene>
      <div className="flex items-center justify-between">
        <YearBanner year="1789" place="The roads of France" />
        <StepDots total={STEPS} index={step} />
      </div>

      {step === 0 && (
        <>
          <Narration lines={[
            'You are a cloth merchant in the last year of the old French kingdom. Business is good — if you can survive the units.',
            'Every town measures cloth in "aunes." The problem? Every town has its own idea of how long an aune is. The unit is named after a forearm, and apparently forearms differ.',
          ]} />
          <NextButton onClick={next} label="Head to the market in Lille" />
        </>
      )}

      {step === 1 && (
        <>
          <Speech who="Cloth seller, Lille" text="Fine wool, friend! Twenty aunes for forty livres. Measured fair against the town rod, I swear it." />
          <Narration lines={[
            `You pay 40 livres for ${BOUGHT} aunes of cloth. In Lille, one aune is the Flemish ell: 0.70 meters (in the units you know).`,
            'You load the cart and head south to Paris, where cloth fetches a better price.',
          ]} />
          <RodCompare />
          <NextButton onClick={next} label="Arrive in Paris" />
        </>
      )}

      {step === 2 && (
        <>
          <Speech who="Master draper, Paris" text="Aunes? Of course we trade in aunes. The aune of Paris — 1.19 meters. What else would an aune be?" />
          <NumQ
            prompt={`Your cloth is ${BOUGHT} Lille-aunes long: ${BOUGHT} × 0.70 m = ${CLOTH_M} m of cloth. How many PARIS aunes (1.19 m each) is that?`}
            unit="Paris aunes"
            answer={CLOTH_M / PARIS_AUNE}
            tolerance={0.04}
            hint="Divide the total length in meters by the length of one Paris aune: 14 ÷ 1.19."
            onDone={solve(2)}
          />
          <NextButton onClick={next} label="Face the damage" disabled={!solved[2]} />
        </>
      )}

      {step === 3 && (
        <>
          <Narration lines={[
            'You bought "20 aunes." You can sell only about 11.8 "aunes." Same cloth, same cart, same word — and nearly half your stock evaporated on the road between two towns.',
            'Multiply this by every market, every grain sack, every plot of land in France. Historians estimate the kingdom used roughly a quarter-million different local units.',
          ]} />
          <MC
            prompt="Who, in 1789, decides what an aune really is?"
            choices={[
              'The king sets one official aune for all of France',
              'Each town or local lord keeps its own — nobody agrees',
              'Merchants vote on a standard at an annual fair',
            ]}
            answer={1}
            explain="Exactly — and that was the problem. Units were local custom and local power. Landlords could even collect rent with a 'big' bushel and sell with a 'small' one. When the Revolution collected grievance lists from ordinary people, one demand appeared over and over: one weight, one measure."
            onDone={solve(3)}
          />
          <NextButton onClick={next} label="The Revolution answers" disabled={!solved[3]} />
        </>
      )}

      {step === 4 && (
        <>
          <Narration lines={[
            '1789: Revolution. The new National Assembly asks the Academy of Sciences — the best scientists in Europe — to invent a measurement system from scratch.',
            'Their slogan sets the bar impossibly high: "For all time, for all people." Not the king\'s system. Not Paris\'s system. Everyone\'s.',
          ]} />
          <FactBox title="Design challenge" text="If the new unit of length can't be based on any person or any city's tradition, where could it possibly come from?" />
          <MC
            prompt="What should the new standard of length be based on, so that it belongs to everyone?"
            choices={[
              'The length of the new king\'s arm',
              'The aune of Paris, since Paris leads the Revolution',
              'Something from nature itself, that anyone on Earth could in principle measure',
            ]}
            answer={2}
            explain="That was the Academy's reasoning too. A natural standard can't be lost, burned, or owned by anyone. The question of WHICH piece of nature is the next chapter."
            onDone={solve(4)}
          />
          <NextButton onClick={next} label="Finish the chapter" disabled={!solved[4]} />
        </>
      )}

      {step === 5 && (
        <>
          <Narration lines={[
            'Chapter complete. You have felt the problem the metric system was built to solve: measurement was chaos, and chaos was expensive and unfair.',
            'Next: the scientists choose their piece of nature — and it is enormous.',
          ]} />
          <NextButton onClick={onComplete} label="Continue to Chapter 1: Measuring the Earth" />
        </>
      )}
    </Scene>
  )
}
