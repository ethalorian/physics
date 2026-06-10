"use client"

// Chapter 5 — The Final Mission (1799)
// The platinum meter and kilogram enter the Archives. The student, as a
// citizen-inspector, faces 10 randomized challenges. First-try answers score.
// >= MASTERY_THRESHOLD earns the mastery badge (two-tier completion).

import { useCallback, useMemo, useState } from 'react'
import { Scene, YearBanner, Narration, NextButton, MC, NumQ } from './ui'
import { Ch5Scene } from './scenes'
import { MASTERY_THRESHOLD } from './types'

type BankItem =
  | { kind: 'mc'; prompt: string; choices: string[]; answer: number; explain: string }
  | { kind: 'num'; prompt: string; unit: string; answer: number; tolerance?: number; hint: string }

const BANK: BankItem[] = [
  { kind: 'num', prompt: 'A grocer sells flour by the kilogram. How many grams in 1 kg?', unit: 'g', answer: 1000, hint: 'kilo means one thousand.' },
  { kind: 'num', prompt: 'A ribbon measures 2.4 m. Certify its length in centimeters.', unit: 'cm', answer: 240, hint: 'm to cm: two rungs down, ×100.' },
  { kind: 'num', prompt: 'The road marker says 5,000 m to Paris. How many kilometers?', unit: 'km', answer: 5, hint: 'm to km: ÷1,000.' },
  { kind: 'num', prompt: 'A bolt is 32 mm long. Record it in centimeters.', unit: 'cm', answer: 3.2, hint: 'mm to cm: ÷10.' },
  { kind: 'num', prompt: 'A wine merchant pours 0.85 L. How many milliliters is that?', unit: 'mL', answer: 850, hint: 'L to mL: ×1,000.' },
  { kind: 'num', prompt: 'A flask holds 600 mL of pure water. What is the water’s mass in grams?', unit: 'g', answer: 600, hint: '1 mL of water = 1 g.' },
  { kind: 'num', prompt: 'A sack of grain is 3.5 kg. Record its mass in grams.', unit: 'g', answer: 3500, hint: 'kg to g: ×1,000.' },
  { kind: 'num', prompt: 'You pour 750 g of pure water into a measuring vessel. What volume do you read, in mL?', unit: 'mL', answer: 750, hint: '1 g of water = 1 mL.' },
  { kind: 'num', prompt: 'A standard cube is 10 cm on each side. What is its volume in cm³?', unit: 'cm³', answer: 1000, hint: '10 × 10 × 10.' },
  { kind: 'num', prompt: 'A cart rolls 100 m in 20 s. Its speed, in m/s?', unit: 'm/s', answer: 5, hint: 'speed = distance ÷ time.' },
  { kind: 'num', prompt: 'A courier covers 18 km in exactly 1 hour. Convert that speed to m/s.', unit: 'm/s', answer: 5, hint: '18,000 m ÷ 3,600 s.' },
  { kind: 'mc', prompt: 'Instinct check: the thickness of a one-franc coin is about…', choices: ['2 mm', '2 cm', '2 dm'], answer: 0, explain: 'About 2 mm — coins are thin. A 2 cm coin would be a stack of ten.' },
  { kind: 'mc', prompt: 'Instinct check: a doorway is about how tall?', choices: ['2 cm', '2 m', '2 km'], answer: 1, explain: 'About 2 m — roughly one tall adult plus a hat.' },
  { kind: 'mc', prompt: 'A merchant claims his 1-liter jug of water weighs 5 kg. Your ruling?', choices: ['Plausible — water is heavy', 'Impossible — 1 L of water is 1 kg by definition', 'Impossible — 1 L of water is 100 g'], answer: 1, explain: 'The liter and kilogram are locked together: 1 L of water = 1 kg. His jug is either not water or not a liter.' },
  { kind: 'mc', prompt: 'Which length is the greatest?', choices: ['2,500 mm', '3 m', '0.0025 km'], answer: 1, explain: 'Put them all in meters: 2,500 mm = 2.5 m and 0.0025 km = 2.5 m. The 3 m rod wins. Converting to a common unit settles every dispute.' },
  { kind: 'mc', prompt: 'Why was the meter defined from the Earth rather than from the king’s arm?', choices: ['The Earth is easier to measure than an arm', 'A natural standard belongs to everyone, everywhere, for all time', 'The king refused to be measured'], answer: 1, explain: '"For all time, for all people." A standard taken from nature cannot be owned, lost, or changed by whoever is in power.' },
]

const MISSION_LENGTH = 10

function sample(): BankItem[] {
  const idx = BANK.map((_, i) => i)
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  return idx.slice(0, MISSION_LENGTH).map(i => BANK[i])
}

function Certificate({ score, mastery }: { score: number; mastery: boolean }) {
  return (
    <div className={`rounded-xl border-4 ${mastery ? 'border-amber-400' : 'border-border'} p-6 text-center space-y-2 bg-gradient-to-b from-amber-50 to-transparent dark:from-amber-950/30`}>
      <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">République Française · An VII</div>
      <div className="text-xl font-bold">Certificate of the Republic of Measures</div>
      <p className="text-sm text-muted-foreground">This certifies that the bearer has journeyed from the chaos of 1789 to the metric system, and inspected the new measures with a score of</p>
      <div className="text-4xl font-mono font-bold tabular-nums">{score}%</div>
      {mastery ? (
        <div className="inline-block px-3 py-1 rounded-full bg-amber-400 text-amber-950 font-semibold text-sm">
          ★ Master Inspector — for all time, for all people ★
        </div>
      ) : (
        <p className="text-sm">Score {MASTERY_THRESHOLD}% or higher to earn the Master Inspector badge. You may re-run the mission as many times as you like.</p>
      )}
    </div>
  )
}

export default function Ch5Mission({ onFinish, finished, bestScore }: {
  /** Called every time a mission run ends, with the run's score (0–100). */
  onFinish: (score: number) => void
  finished: boolean
  bestScore: number | null
}) {
  const [items, setItems] = useState<BankItem[]>(() => sample())
  const [phase, setPhase] = useState<'brief' | 'run' | 'done'>(finished ? 'done' : 'brief')
  const [qIndex, setQIndex] = useState(0)
  const [firstTries, setFirstTries] = useState(0)
  const [solved, setSolved] = useState(false)
  const [lastScore, setLastScore] = useState<number | null>(bestScore)

  const score = useMemo(() => Math.round((firstTries / MISSION_LENGTH) * 100), [firstTries])

  const handleDone = useCallback((firstTry: boolean) => {
    if (firstTry) setFirstTries(n => n + 1)
    setSolved(true)
  }, [])

  const nextQuestion = () => {
    if (qIndex + 1 >= MISSION_LENGTH) {
      setLastScore(score)
      setPhase('done')
      onFinish(score)
    } else {
      setQIndex(i => i + 1)
      setSolved(false)
    }
  }

  const retry = () => {
    setItems(sample())
    setQIndex(0)
    setFirstTries(0)
    setSolved(false)
    setPhase('run')
  }

  const item = items[qIndex]

  return (
    <Scene>
      <YearBanner year="1799" place="The National Archives, Paris" />
      <Ch5Scene
        phase={phase}
        mastery={Math.max(lastScore ?? 0, bestScore ?? 0) >= MASTERY_THRESHOLD}
      />

      {phase === 'brief' && (
        <>
          <Narration lines={[
            'June 1799. Two platinum objects — the definitive meter bar and the definitive kilogram — are locked into the National Archives. The survey is over. The system is law.',
            'You are appointed citizen-inspector. Ten challenges await: lengths, volumes, masses, speeds, and your instinct for scale. Only FIRST-TRY answers count toward your score. You may retry the whole mission, but never a single question.',
            `Score ${MASTERY_THRESHOLD}% or better to earn the Master Inspector badge.`,
          ]} />
          <NextButton onClick={() => setPhase('run')} label="Begin the inspection" />
        </>
      )}

      {phase === 'run' && item && (
        <>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Challenge {qIndex + 1} of {MISSION_LENGTH}</span>
            <span className="tabular-nums">first-try correct: {firstTries}</span>
          </div>
          <div key={qIndex}>
            {item.kind === 'mc' ? (
              <MC prompt={item.prompt} choices={item.choices} answer={item.answer}
                explain={item.explain} onDone={handleDone} />
            ) : (
              <NumQ prompt={item.prompt} unit={item.unit} answer={item.answer}
                tolerance={item.tolerance} hint={item.hint} onDone={handleDone} />
            )}
          </div>
          <NextButton onClick={nextQuestion} disabled={!solved}
            label={qIndex + 1 >= MISSION_LENGTH ? 'Finish the inspection' : 'Next challenge'} />
        </>
      )}

      {phase === 'done' && (
        <>
          <Certificate
            score={lastScore ?? 0}
            mastery={(lastScore ?? 0) >= MASTERY_THRESHOLD || (bestScore ?? 0) >= MASTERY_THRESHOLD}
          />
          {bestScore !== null && lastScore !== bestScore && (
            <p className="text-sm text-center text-muted-foreground">Best score so far: {Math.max(bestScore, lastScore ?? 0)}%</p>
          )}
          <div className="flex justify-center">
            <NextButton onClick={retry} label="Run the mission again" />
          </div>
        </>
      )}
    </Scene>
  )
}
