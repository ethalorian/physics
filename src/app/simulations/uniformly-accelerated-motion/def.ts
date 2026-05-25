import type { SimDefinition } from '@/components/simulations/lab/contract'
import { createUAMEngine } from './engine'

export const uamDef: SimDefinition = {
  slug: 'uniformly-accelerated-motion',
  title: 'Uniformly accelerated motion',
  level: 'Core',
  summary: 'A car drops an oil spot every second. Watch the spacing grow as it speeds up — and read the straight velocity-time line whose slope is the acceleration.',
  canvasHeight: 280,
  params: [
    { key: 'v0', label: 'Initial velocity', type: 'slider', min: 0, max: 20, step: 1, unit: 'm/s', default: 5 },
    { key: 'a', label: 'Acceleration', type: 'slider', min: -5, max: 5, step: 0.5, unit: 'm/s²', default: 2 },
  ],
  readouts: [
    { key: 'time', label: 'Time', unit: 's' },
    { key: 'position', label: 'Position', unit: 'm', precision: 1 },
    { key: 'velocity', label: 'Velocity', unit: 'm/s', precision: 1, color: 'var(--success)' },
  ],
  createEngine: createUAMEngine,
  sensor: { kind: 'motion', label: 'Motion Detector', quantity: 'Velocity', unit: 'm/s' },
  learning: {
    objectives: [
      'See constant acceleration as evenly-changing spot spacing',
      'Read acceleration as the slope of a velocity-time line',
      'Connect v₀, a, and t to position and velocity',
    ],
    tryThis: [
      'Set acceleration to 0 — the spots become evenly spaced',
      'Compare a = +2 and a = +4: how does the spacing differ?',
      'Use a negative acceleration and watch the car brake to a stop',
    ],
  },
}
