import type { SimDefinition } from '@/components/simulations/lab/contract'
import { createClosingSpeedEngine } from './engine'

export const closingSpeedDef: SimDefinition = {
  slug: 'closing-speed',
  title: 'Closing Speed — How Fast Is It Really Coming?',
  level: 'Core',
  summary:
    "The asteroid has its own speed through space — but Earth is racing along its orbit at ~30 km/s too. What matters is the asteroid's velocity RELATIVE to Earth: subtract the vectors. The result (the impact speed) is usually bigger than the asteroid's own speed, and the closing speed along the line of approach tells you how fast the gap shrinks. A lesson in vectors, relative velocity, and reference frames.",
  canvasHeight: 440,
  params: [
    { key: 'asteroidSpeed', label: "Asteroid's own speed", type: 'slider', min: 10, max: 40, step: 1, unit: 'km/s', default: 25 },
    { key: 'earthSpeed', label: "Earth's orbital speed", type: 'slider', min: 0, max: 35, step: 1, unit: 'km/s', default: 30 },
    { key: 'earthAngle', label: 'Angle of Earth’s motion', type: 'slider', min: 0, max: 150, step: 5, unit: '°', default: 75 },
  ],
  readouts: [
    { key: 'impactSpeed', label: 'Closing / impact speed |v_rel|', unit: 'km/s', precision: 1, color: 'var(--reward)' },
    { key: 'ownSpeed', label: "Asteroid's own speed", unit: 'km/s', precision: 0 },
    { key: 'earthSpeed', label: "Earth's speed", unit: 'km/s', precision: 0 },
    { key: 'boost', label: 'Extra speed from Earth’s motion', unit: 'km/s', precision: 1 },
  ],
  createEngine: createClosingSpeedEngine,
  learning: {
    objectives: [
      'Find a relative velocity by subtracting velocity vectors (v_rel = v_asteroid − v_Earth)',
      'Read the closing/impact speed as the length of the relative-velocity vector',
      'Explain why the impact speed exceeds the asteroid’s own speed when Earth is moving',
      'Reason about motion in different reference frames (Sun frame vs Earth frame)',
    ],
    concepts: ['Relative velocity', 'Vector subtraction', 'Reference frames', 'Closing speed', 'Impact speed'],
    tryThis: [
      'Set Earth’s speed to 0 (pretend Earth holds still). Now the impact speed equals the asteroid’s own speed. Turn Earth’s speed back up — what happens?',
      'Keep the speeds fixed and sweep the angle of Earth’s motion. When is the impact speed biggest — Earth heading toward the asteroid, away, or sideways?',
      'Two asteroids have the SAME own speed but hit at different impact speeds. How? (It’s the direction Earth is moving relative to each.)',
      'The headline number combines both motions with the Pythagorean theorem when Earth moves at 90°. Check it: 25 and 30 → √(25²+30²) ≈ 39 km/s.',
    ],
  },
}
