import type { SimDefinition } from '@/components/simulations/lab/contract'
import { createProjectileEngine } from './engine'

export const projectileDef: SimDefinition = {
  slug: 'projectile-motion',
  title: 'Projectile motion',
  level: 'Core',
  summary: 'Launch projectiles and analyze 2D motion under gravity. Drag the targets, then dial in angle and speed to hit them.',
  canvasHeight: 420,
  params: [
    { key: 'speed', label: 'Launch speed', type: 'slider', min: 5, max: 50, step: 1, unit: 'm/s', default: 20 },
    { key: 'angle', label: 'Launch angle', type: 'slider', min: 0, max: 90, step: 1, unit: '°', default: 45 },
    { key: 'height', label: 'Launch height', type: 'slider', min: 0, max: 20, step: 0.5, unit: 'm', default: 0 },
  ],
  readouts: [
    { key: 'time', label: 'Time', unit: 's' },
    { key: 'x', label: 'X position', unit: 'm', precision: 1 },
    { key: 'y', label: 'Y position', unit: 'm', precision: 1 },
    { key: 'vx', label: 'Vx', unit: 'm/s', precision: 1, color: 'var(--primary)' },
    { key: 'vy', label: 'Vy', unit: 'm/s', precision: 1, color: 'var(--success)' },
  ],
  createEngine: createProjectileEngine,
  learning: {
    objectives: [
      'Analyze 2D projectile motion',
      'Separate horizontal and vertical velocity',
      'Predict range and maximum height',
    ],
    tryThis: [
      'Find the angle that gives the longest range',
      'Compare a 30° and a 60° launch at the same speed',
      'Raise the launch height and watch the range change',
    ],
  },
}
