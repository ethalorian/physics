import type { SimDefinition } from '@/components/simulations/lab/contract'
import { createCarRaceEngine } from './engine'

export const carRaceDef: SimDefinition = {
  slug: 'car-race',
  title: 'Car race: relative motion & kinematics',
  level: 'Core',
  summary: 'Two cars move at constant velocity with different start times over a 1000 m track. The live position-time graph shows two straight lines whose slope is each car’s speed — and whose intersection is the overtake. Predict it with kinematics, then watch it happen.',
  canvasHeight: 440,
  params: [
    { key: 'vA', label: 'Car A speed', type: 'slider', min: 5, max: 40, step: 5, unit: 'm/s', default: 20 },
    { key: 'startA', label: 'Car A start delay', type: 'slider', min: 0, max: 10, step: 0.5, unit: 's', default: 0 },
    { key: 'vB', label: 'Car B speed', type: 'slider', min: 5, max: 40, step: 5, unit: 'm/s', default: 25 },
    { key: 'startB', label: 'Car B start delay', type: 'slider', min: 0, max: 10, step: 0.5, unit: 's', default: 5 },
  ],
  readouts: [
    { key: 'time', label: 'Time', unit: 's', precision: 1 },
    { key: 'posA', label: 'Car A', unit: 'm', precision: 0, color: 'var(--primary)' },
    { key: 'posB', label: 'Car B', unit: 'm', precision: 0, color: 'var(--destructive)' },
    { key: 'gap', label: 'Gap (B − A)', unit: 'm', precision: 0 },
    { key: 'leader', label: 'Leader' },
  ],
  createEngine: createCarRaceEngine,
  sensors: [
    { key: 'gap', kind: 'motion', label: 'Motion Detector', quantity: 'Gap (B − A)', unit: 'm' },
    { key: 'posA', kind: 'motion', label: 'Motion Detector', quantity: 'Car A position', unit: 'm' },
    { key: 'posB', kind: 'motion', label: 'Motion Detector', quantity: 'Car B position', unit: 'm' },
  ],
  learning: {
    objectives: [
      'Read a position-time graph: slope = velocity, intersection = same place at the same time',
      'Predict an overtake with kinematics: v_A(t − d_A) = v_B(t − d_B)',
      'Reason about a head start vs. a speed advantage (relative velocity)',
    ],
    concepts: ['Constant velocity', 'Position-time graphs', 'Relative velocity', 'Solving for intersection'],
    tryThis: [
      'Give B a 5 s delay but more speed — does it still catch A before the finish?',
      'Match the speeds: the lines stay parallel and never cross (constant gap).',
      'Use the gap sensor — the overtake is exactly where the gap crosses zero.',
    ],
  },
}
