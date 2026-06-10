"use client"

// Chapter 3 — Water Ties It Together (1795)
// Volume and mass are DERIVED from the meter via water:
// a 10 cm cube = 1,000 cm³ = 1 L, and that much water = 1 kg.

import { useState } from 'react'
import { Scene, YearBanner, Narration, FactBox, NextButton, StepDots, MC, NumQ } from './ui'
import { Ch3Scene } from './scenes'

function CubeBuilder({ onBuilt }: { onBuilt: () => void }) {
  const [side, setSide] = useState(4)
  const volume = side * side * side
  const hit = side === 10
  const px = 8 + side * 9 // visual size

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-6 flex-wrap">
        <div className="h-[140px] flex items-end">
          <div
            className={`rounded-md border-2 transition-all duration-300 ${hit ? 'border-green-500 bg-green-100 dark:bg-green-900/40' : 'border-amber-500 bg-amber-100 dark:bg-amber-900/30'}`}
            style={{ width: px, height: px }}
            aria-label={`Cube with side ${side} centimeters`}
          />
        </div>
        <div className="space-y-1 text-[15px]">
          <div>side = <span className="font-mono font-semibold">{side} cm</span></div>
          <div>volume = {side} × {side} × {side} = <span className="font-mono font-semibold">{volume.toLocaleString()} cm³</span></div>
          {hit && <div className="text-green-600 dark:text-green-400 font-semibold">1,000 cm³ — exactly the target.</div>}
        </div>
      </div>
      <input
        type="range" min={1} max={15} step={1} value={side}
        onChange={e => setSide(Number(e.target.value))}
        className="w-full max-w-sm accent-amber-500"
        aria-label="Cube side length in centimeters"
      />
      <p className="text-sm text-muted-foreground">Drag until the cube holds exactly 1,000 cm³.</p>
      {hit && <NextButton onClick={onBuilt} label="Name this volume" />}
    </div>
  )
}

function FillAndWeigh({ onWeighed }: { onWeighed: () => void }) {
  const [poured, setPoured] = useState(false)
  const [weighed, setWeighed] = useState(false)
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-8 flex-wrap">
        {/* the liter cube, filling with water */}
        <div className="relative w-[98px] h-[98px] rounded-md border-2 border-slate-500 overflow-hidden bg-background">
          <div
            className="absolute bottom-0 left-0 right-0 bg-sky-400/80 transition-all duration-[1500ms] ease-out"
            style={{ height: poured ? '100%' : '0%' }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-200">
            1 L cube
          </span>
        </div>
        {/* balance readout */}
        <div className="rounded-lg border border-border px-4 py-3 text-center min-w-[130px]">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">balance</div>
          <div className="text-2xl font-mono font-bold tabular-nums">
            {weighed ? '1.000 kg' : poured ? '?' : '0.000 kg'}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        {!poured && (
          <button type="button" onClick={() => setPoured(true)}
            className="px-3 py-2 rounded-lg bg-sky-500 text-white font-medium hover:bg-sky-600 transition">
            Pour in pure water
          </button>
        )}
        {poured && !weighed && (
          <button type="button" onClick={() => { setWeighed(true); onWeighed() }}
            className="px-3 py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 transition">
            Place on the balance
          </button>
        )}
        {weighed && (
          <span className="self-center text-green-600 dark:text-green-400 font-semibold">
            One liter of water is exactly one kilogram. By design.
          </span>
        )}
      </div>
    </div>
  )
}

const STEPS = 6

export default function Ch3Water({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const [weighed, setWeighed] = useState(false)
  const [drills, setDrills] = useState(0)
  const [whyWater, setWhyWater] = useState(false)
  const next = () => setStep(s => s + 1)

  return (
    <Scene>
      <div className="flex items-center justify-between">
        <YearBanner year="1795" place="A laboratory in Paris" />
        <StepDots total={STEPS} index={step} />
      </div>
      <Ch3Scene step={step} />

      {step === 0 && (
        <>
          <Narration lines={[
            'Length is settled. But markets also sell by volume (wine, grain) and by weight (flour, iron). Invent two more unrelated units and the old chaos creeps back.',
            'The Academy\'s most elegant move: do not invent new standards at all. Build volume FROM length, and mass FROM volume — using the one substance found everywhere on Earth: water.',
          ]} />
          <NextButton onClick={next} label="Build the volume unit" />
        </>
      )}

      {step === 1 && (
        <>
          <Narration lines={['Start with the meter\'s little sibling, the centimeter. Build a cube.']} />
          <CubeBuilder onBuilt={next} />
        </>
      )}

      {step === 2 && (
        <>
          <Narration lines={[
            'That 10 cm × 10 cm × 10 cm cube — 1,000 cm³, also called one cubic decimeter — gets a name of its own: the LITER. The soda bottle in your fridge is measured in a unit built from the meter.',
            'Now the masterstroke. Fill it.',
          ]} />
          <FillAndWeigh onWeighed={() => setWeighed(true)} />
          <NextButton onClick={next} disabled={!weighed} />
        </>
      )}

      {step === 3 && (
        <>
          <Narration lines={[
            'The KILOGRAM is defined as the mass of one liter of water. Slice both by a thousand: one cubic centimeter of water — a sugar-cube of it — is one milliliter, and weighs one GRAM.',
          ]} />
          <div className="rounded-lg border border-border p-3 text-center font-mono text-lg">
            1 cm³ &nbsp;=&nbsp; 1 mL &nbsp;=&nbsp; 1 g <span className="text-muted-foreground text-sm">(of water)</span>
          </div>
          <FactBox title="Why this matters" text="Length, volume, and mass lock together in one web. Measure any one of them and you can reason about the others — no conversion tables, ever." />
          <NextButton onClick={next} label="Use the web" />
        </>
      )}

      {step === 4 && (
        <>
          <NumQ
            prompt="A beaker holds 250 mL of water. What is the water's mass in grams?"
            unit="g" answer={250}
            hint="1 mL of water = 1 g. The numbers match."
            onDone={() => setDrills(d => d + 1)}
          />
          <NumQ
            prompt="A 2-liter bottle of water: what is its mass in kilograms (ignoring the bottle)?"
            unit="kg" answer={2}
            hint="1 L of water = 1 kg."
            onDone={() => setDrills(d => d + 1)}
          />
          <NextButton onClick={next} disabled={drills < 2} label={drills < 2 ? `Solve both (${drills}/2)` : 'Continue'} />
        </>
      )}

      {step === 5 && (
        <>
          <MC
            prompt="Why did the Academy pick water as the bridge between volume and mass?"
            choices={[
              'Water is found and purifiable everywhere on Earth — anyone can recreate the standard',
              'Water is the heaviest common liquid, so the standard is robust',
              'France\'s rivers made water politically symbolic',
            ]}
            answer={0}
            explain="The same logic as the meter: a standard from nature that no person or nation owns. Anyone, anywhere, with clean water and a good cube, can rebuild the kilogram. (Today the kilogram is fixed by a constant of nature — Planck’s constant — for the same reason, only more precise.)"
            onDone={() => setWhyWater(true)}
          />
          <NextButton onClick={onComplete} disabled={!whyWater} label="Continue to Chapter 4: The Clock That Failed" />
        </>
      )}
    </Scene>
  )
}
