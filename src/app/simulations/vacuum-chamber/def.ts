import type { SimDefinition } from '@/components/simulations/lab/contract'
import { createVacuumChamberEngine } from './engine'

export const vacuumChamberDef: SimDefinition = {
  slug: 'vacuum-chamber',
  title: 'Vacuum Chamber: Feather vs. Bowling Ball',
  level: 'Intro',
  summary: 'Watch how air resistance affects falling objects — see what happens in a vacuum! Drop a feather and a bowling ball together and compare.',
  canvasHeight: 500,
  params: [
    { key: 'vacuum', label: 'Vacuum (no air)', type: 'toggle', default: true },
  ],
  readouts: [
    { key: 'time', label: 'Time', unit: 's', precision: 2 },
    { key: 'featherY', label: 'Feather position', unit: 'm', precision: 2, color: '#a855f7' },
    { key: 'featherVy', label: 'Feather speed', unit: 'm/s', precision: 2, color: '#a855f7' },
    { key: 'ballY', label: 'Ball position', unit: 'm', precision: 2, color: '#f97316' },
    { key: 'ballVy', label: 'Ball speed', unit: 'm/s', precision: 2, color: '#f97316' },
  ],
  createEngine: createVacuumChamberEngine,
  sensors: [
    { key: 'feather', kind: 'motion', label: 'Motion Detector', quantity: 'Feather downward speed', unit: 'm/s', color: '#a855f7' },
    { key: 'ball', kind: 'motion', label: 'Motion Detector', quantity: 'Ball downward speed', unit: 'm/s', color: '#f97316' },
  ],
  learning: {
    objectives: [
      'See that without air resistance, all objects fall at the same rate regardless of mass',
      'Understand drag force F = ½ρv²C_dA and how it depends on speed, area, and shape',
      'Explain why a feather and a bowling ball reach the floor at different times in air',
    ],
    concepts: [
      'In a vacuum, a = g = 9.8 m/s² for all objects',
      'With air, drag opposes motion and the feather reaches terminal velocity quickly',
      'Apollo 15 astronaut David Scott demonstrated this on the Moon in 1971',
    ],
    tryThis: [
      'Vacuum first: keep air off and watch them land together',
      'Add air: turn vacuum off and see the difference',
      'Compare curves: the feather flattens out (terminal velocity)',
      'Calculate: in vacuum, time to fall ~9.2 m = √(2h/g) ≈ 1.37 s',
      'Observe: feather acceleration drops as its speed increases',
    ],
  },
}
