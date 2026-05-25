import type { SimDefinition } from '@/components/simulations/lab/contract'
import { createRaceTrackEngine } from './engine'

export const raceTrackDef: SimDefinition = {
  slug: 'race-track',
  title: 'Race track: distance vs. displacement',
  level: 'Intro',
  summary: 'A car laps a circular track. The traveled arc (distance) keeps growing, but the displacement arrow from the start rises and falls back to zero each lap — distance vs. displacement made visible.',
  canvasHeight: 360,
  params: [
    { key: 'speed', label: 'Car speed', type: 'slider', min: 5, max: 40, step: 5, unit: 'm/s', default: 20 },
  ],
  readouts: [
    { key: 'time', label: 'Time', unit: 's', precision: 1 },
    { key: 'distance', label: 'Distance', unit: 'm', precision: 0, color: 'var(--success)' },
    { key: 'displacement', label: 'Displacement', unit: 'm', precision: 0, color: 'var(--primary)' },
    { key: 'laps', label: 'Laps', precision: 0 },
  ],
  createEngine: createRaceTrackEngine,
  sensors: [
    { key: 'displacement', kind: 'motion', label: 'Motion Detector', quantity: 'Displacement from start', unit: 'm' },
    { key: 'distance', kind: 'motion', label: 'Motion Detector', quantity: 'Distance travelled', unit: 'm' },
    { key: 'speed', kind: 'motion', label: 'Motion Detector', quantity: 'Speed', unit: 'm/s' },
    { key: 'velocity', kind: 'motion', label: 'Motion Detector', quantity: 'Velocity (rate of displacement)', unit: 'm/s' },
  ],
  learning: {
    objectives: [
      'Distinguish distance (scalar path) from displacement (vector from start)',
      'See why displacement returns to zero after a full lap',
      'Connect constant speed with continuously changing velocity direction',
    ],
    tryThis: [
      'Run exactly one lap — distance ≈ 628 m, displacement back to 0',
      'Watch the displacement reading peak at the far side (≈ 200 m = the diameter)',
      'Ask: if the speed never changes, why is the velocity always changing?',
    ],
  },
}
