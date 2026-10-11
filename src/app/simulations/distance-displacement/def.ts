import type { SimDefinition } from '@/components/simulations/lab/contract'
import { createDistanceDisplacementEngine } from './engine'

export const distanceDisplacementDef: SimDefinition = {
  slug: 'distance-displacement',
  title: 'Distance vs. displacement',
  level: 'Intro',
  summary: 'Guide a survey rover across the field. Compare the green travelled route with the displacement arrow from base to its current position.',
  canvasHeight: 420,
  params: [{ key: 'route', label: 'Compare a route', type: 'select', live: true, default: 'free', options: [{value:'free',label:'Build your own route'},{value:'out-back',label:'4 m east, then back to base'},{value:'corner',label:'3 m east, then 4 m north'},{value:'direct',label:'Direct to (3 m, 4 m)'}] }],
  readouts: [
    { key: 'distance', label: 'Distance', unit: 'm', precision: 2, color: 'var(--success)' },
    { key: 'displacement', label: 'Displacement', unit: 'm', precision: 2, color: 'var(--primary)' },
    { key: 'dx', label: 'Δx', unit: 'm', precision: 2 },
    { key: 'dy', label: 'Δy', unit: 'm', precision: 2 },
  ],
  createEngine: createDistanceDisplacementEngine,
  showPlay: false,
  learning: {
    objectives: [
      'Distinguish distance (total path, a scalar) from displacement (change in position, a vector)',
      'See that displacement depends only on start and end points, not the route taken',
      'Read displacement as components Δx and Δy',
    ],
    concepts: [
      'Distance ≥ displacement always; they are equal only for a straight, non-reversing path',
      'Displacement is the straight arrow from start to finish',
    ],
    tryThis: [
      'Walk a big loop back to START — distance grows but displacement returns to 0',
      'Walk straight out and back partway — compare distance to displacement',
      'Make an L-shaped path, then check that displacement = √(Δx² + Δy²)',
    ],
  },
}
