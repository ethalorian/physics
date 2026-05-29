import type { SimDefinition } from '@/components/simulations/lab/contract'
import { createRiverboatCrossingEngine } from './engine'

export const riverboatCrossingDef: SimDefinition = {
  slug: 'riverboat-crossing',
  title: 'Riverboat Crossing: Vector Addition',
  level: 'Core',
  summary: 'Navigate a boat across a 100 m river with a current — see how the boat’s velocity through the water adds as a vector to the current to give the resultant path over the ground, and how far you drift downstream.',
  canvasHeight: 500,
  params: [
    { key: 'boatSpeed', label: 'Boat Speed (through water)', type: 'slider', min: 2, max: 10, step: 0.5, unit: 'm/s', default: 5 },
    { key: 'boatAngle', label: 'Boat Heading Angle', type: 'slider', min: 60, max: 120, step: 5, unit: '°', default: 90 },
    { key: 'currentSpeed', label: 'River Current Speed', type: 'slider', min: 0, max: 5, step: 0.5, unit: 'm/s', default: 2 },
  ],
  readouts: [
    { key: 'time', label: 'Time', unit: 's', precision: 1 },
    { key: 'across', label: 'Distance Across', unit: 'm', precision: 1, color: 'var(--success)' },
    { key: 'drift', label: 'Downstream Drift', unit: 'm', precision: 1 },
    { key: 'resultantSpeed', label: 'Resultant Speed', unit: 'm/s', precision: 1, color: 'var(--reward)' },
    { key: 'resultantAngle', label: 'Resultant Angle', unit: '°', precision: 1 },
  ],
  createEngine: createRiverboatCrossingEngine,
  learning: {
    objectives: [
      'Add two velocities as vectors: boat-through-water + current = resultant over ground',
      'Predict downstream drift from crossing time × current speed',
      'Find the upstream heading that cancels the current to land straight across',
    ],
    concepts: ['Vector addition', 'Relative velocity', 'Resolving components', 'Crossing time vs. drift'],
    tryThis: [
      '90° heading: see how much you drift downstream',
      'Aim upstream: reduce drift by angling against the current',
      'Zero drift: find the exact angle to go straight across',
      'No current: set to 0 m/s — the boat goes where it aims',
      'Strong current: increase to 4 m/s — big drift!',
      'Calculate drift: use time × current speed',
    ],
  },
}
