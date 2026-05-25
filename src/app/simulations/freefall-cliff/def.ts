import type { SimDefinition } from '@/components/simulations/lab/contract'
import { createFreefallEngine } from './engine'

export const freefallDef: SimDefinition = {
  slug: 'freefall-cliff',
  title: 'Freefall cliff',
  level: 'Core',
  summary: 'Drop a stone from the cliff and time its fall. Position traces stamp every 0.25 s and spread apart — the signature of acceleration. Use h = ½gt² to find the height.',
  canvasHeight: 380,
  params: [
    { key: 'cliffHeight', label: 'Cliff height', type: 'slider', min: 20, max: 70, step: 5, unit: 'm', default: 45 },
  ],
  readouts: [
    { key: 'time', label: 'Fall time', unit: 's', precision: 2 },
    { key: 'distance', label: 'Distance fallen', unit: 'm', precision: 1 },
    { key: 'velocity', label: 'Speed', unit: 'm/s', precision: 1, color: 'var(--primary)' },
  ],
  createEngine: createFreefallEngine,
  sensor: { kind: 'motion', label: 'Motion Detector', quantity: 'Downward speed', unit: 'm/s' },
  learning: {
    objectives: [
      'See free fall as constant downward acceleration g',
      'Recognize the t² spreading of position traces',
      'Use h = ½gt² to find a height from a measured time',
    ],
    tryThis: [
      'Predict the fall time for a 45 m cliff, then check it',
      'Double the height — does the fall time double? (No — it scales with √h)',
      'Read the slope of the speed-time line: it should be ≈ 9.8',
    ],
  },
}
