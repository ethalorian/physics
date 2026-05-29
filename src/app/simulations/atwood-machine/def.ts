import type { SimDefinition } from '@/components/simulations/lab/contract'
import { createAtwoodMachineEngine } from './engine'

export const atwoodMachineDef: SimDefinition = {
  slug: 'atwood-machine',
  title: 'Atwood Machine: Forces & Equilibrium',
  level: 'Core',
  summary: 'Study balanced and unbalanced forces using a classic pulley system. Two masses share one acceleration, a = g(M₁ − M₂)/(M₁ + M₂), and the rope tension always lands between the two weights.',
  canvasHeight: 500,
  params: [
    { key: 'mass1', label: 'Mass 1 (M₁) — Blue', type: 'slider', min: 0.5, max: 5, step: 0.1, unit: 'kg', default: 2.0 },
    { key: 'mass2', label: 'Mass 2 (M₂) — Red', type: 'slider', min: 0.5, max: 5, step: 0.1, unit: 'kg', default: 1.5 },
    { key: 'targetDistance', label: 'Target Distance', type: 'slider', min: 0.5, max: 2.5, step: 0.1, unit: 'm', default: 2.0 },
  ],
  readouts: [
    { key: 'time', label: 'Time', unit: 's', precision: 2 },
    { key: 'position', label: 'Displacement', unit: 'm', precision: 2, color: 'var(--success)' },
    { key: 'velocity', label: 'Velocity', unit: 'm/s', precision: 2 },
    { key: 'acceleration', label: 'Acceleration', unit: 'm/s²', precision: 2, color: 'var(--reward)' },
    { key: 'tension', label: 'Tension', unit: 'N', precision: 1 },
    { key: 'netForce', label: 'Net Force', unit: 'N', precision: 1 },
    { key: 'state', label: 'State' },
  ],
  createEngine: createAtwoodMachineEngine,
  sensor: {
    kind: 'motion',
    label: 'Motion Detector',
    quantity: 'Displacement',
    unit: 'm',
  },
  learning: {
    objectives: [
      'Relate the net force from unequal weights to the shared acceleration a = g(M₁ − M₂)/(M₁ + M₂)',
      'Find rope tension from either mass: T = M₁(g − a) = M₂(g + a)',
      'Predict the fall time t = √(2d/a) and verify it against the run',
      'Distinguish static equilibrium, dynamic equilibrium, and accelerated motion',
    ],
    concepts: ['Newton’s second law', 'Tension', 'Net force', 'Equilibrium', 'Pulley systems'],
    tryThis: [
      'Equal masses (2.0, 2.0): static equilibrium — no motion.',
      'Unequal masses (2.0, 1.5): accelerated motion.',
      'Calculate the time before running, then verify with the data.',
      'Large difference (4.0, 1.0): fast acceleration.',
      'Small difference (2.0, 1.9): slow acceleration.',
      'Check the tension — it is always between the two weights!',
    ],
  },
}
