import type { SimDefinition } from '@/components/simulations/lab/contract'
import { createSumoForcesEngine } from './engine'

export const sumoForcesDef: SimDefinition = {
  slug: 'sumo-forces',
  title: 'Sumo Wrestling Forces',
  level: 'Core',
  summary:
    "Explore Newton's Second Law through sumo wrestling. Set each wrestler's force and mass, then start the bout: the net force accelerates the pair across the dohyo, and the stronger push wins by shoving the other out of the ring.",
  canvasHeight: 400,
  params: [
    { key: 'redMass', label: 'Red mass', type: 'slider', min: 80, max: 250, step: 5, unit: 'kg', default: 150, live: true },
    { key: 'redForce', label: 'Red force', type: 'slider', min: 0, max: 1000, step: 10, unit: 'N', default: 500, live: true },
    { key: 'blueMass', label: 'Blue mass', type: 'slider', min: 80, max: 250, step: 5, unit: 'kg', default: 150, live: true },
    { key: 'blueForce', label: 'Blue force', type: 'slider', min: 0, max: 1000, step: 10, unit: 'N', default: 500, live: true },
  ],
  readouts: [
    { key: 'netForce', label: 'Net Force (ΣF)', unit: 'N', precision: 0 },
    { key: 'advantage', label: 'Advantage' },
    { key: 'totalMass', label: 'Total Mass', unit: 'kg', precision: 0 },
    { key: 'acceleration', label: 'Acceleration', unit: 'm/s²', precision: 2 },
    { key: 'velocity', label: 'Velocity', precision: 2 },
    { key: 'position', label: 'Position', precision: 1 },
    { key: 'time', label: 'Time', unit: 's', precision: 1 },
    { key: 'winner', label: 'Winner', color: 'var(--reward)' },
  ],
  createEngine: createSumoForcesEngine,
  sensor: {
    kind: 'force',
    label: 'Dual-Range Force Sensor',
    quantity: 'Net force',
    unit: 'N',
  },
  learning: {
    objectives: [
      "Apply Newton's Second Law: the net force equals total mass times acceleration",
      'See how balanced forces produce no acceleration and unbalanced forces drive motion',
      'Relate constant acceleration to a parabolic position curve and a linear velocity curve',
    ],
    concepts: ["Newton's Second Law", 'Net force', 'Acceleration', 'Kinematics'],
    tryThis: [
      'Match both forces — with ΣF = 0 there is no acceleration and nobody moves.',
      'Make Red stronger and watch the net force push the pair toward Blue’s edge.',
      'David vs. Goliath: give Blue more mass AND more force — does extra mass slow the win?',
    ],
  },
}
