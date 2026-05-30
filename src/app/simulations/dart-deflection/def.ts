import type { SimDefinition } from '@/components/simulations/lab/contract'
import { createDartDeflectionEngine } from './engine'

export const dartDeflectionDef: SimDefinition = {
  slug: 'dart-deflection',
  title: 'Kinetic Impactor — Deflecting the Asteroid',
  level: 'Challenge',
  summary:
    "Fire a DART-style spacecraft at the asteroid. Momentum transfer (boosted by ejecta, factor β) gives it a tiny cross-track Δv; over years of lead time that nudge grows into a miss distance at Earth. Find a deflection that turns a direct hit into a clean miss — and feel why lead time is everything and why a bigger rock fights back.",
  canvasHeight: 460,
  params: [
    { key: 'asteroidSize', label: 'Asteroid diameter', type: 'slider', min: 50, max: 500, step: 10, unit: 'm', default: 300 },
    { key: 'impactorMass', label: 'Impactor mass', type: 'slider', min: 500, max: 50000, step: 500, unit: 'kg', default: 20000 },
    { key: 'impactorSpeed', label: 'Impactor speed', type: 'slider', min: 1, max: 20, step: 0.5, unit: 'km/s', default: 10 },
    { key: 'beta', label: 'Momentum boost β', type: 'slider', min: 1, max: 5, step: 0.1, unit: '×', default: 3.6 },
    { key: 'leadTime', label: 'Lead time before arrival', type: 'slider', min: 1, max: 50, step: 1, unit: 'yr', default: 20 },
  ],
  readouts: [
    { key: 'outcome', label: 'Outcome', color: 'var(--reward)' },
    { key: 'miss', label: 'Miss distance', unit: 'km', precision: 0 },
    { key: 'missR', label: 'vs Earth radius', unit: '×', precision: 2 },
    { key: 'deltaV', label: 'Asteroid Δv', unit: 'mm/s', precision: 2 },
    { key: 'deltaP', label: 'Momentum given', unit: '×10⁶ kg·m/s', precision: 0 },
    { key: 'massBn', label: 'Asteroid mass', unit: '×10⁹ kg', precision: 1 },
  ],
  createEngine: createDartDeflectionEngine,
  learning: {
    objectives: [
      'Apply conservation of momentum to a kinetic-impactor deflection: Δp = β·m·v transfers to the asteroid',
      'Explain why the asteroid Δv is determined by the impactor’s momentum (and ejecta β), not its kinetic energy',
      'Reason about the lead-time lever: a sub-mm/s nudge applied years early becomes a miss of thousands of km',
      'Argue why a larger asteroid (mass ∝ diameter³) is dramatically harder to deflect',
    ],
    concepts: ['Momentum conservation', 'Impulse', 'Momentum enhancement (β)', 'Deflection Δv', 'Lead time'],
    tryThis: [
      'Start with the defaults — Earth is missed. Now drag Lead time down until it becomes a hit. How many years do you need?',
      'Put lead time back. Crank Asteroid diameter to 500 m. Why does the same impactor suddenly fail? (Hint: mass ∝ size³.)',
      'Match the real DART mission: ~600 kg impactor, ~6 km/s, β ≈ 3.6. Against a 300 m asteroid, what lead time would it take to matter?',
      'Compare two strategies with the SAME momentum: a heavy slow impactor vs. a light fast one. Does the asteroid care which?',
    ],
  },
}
