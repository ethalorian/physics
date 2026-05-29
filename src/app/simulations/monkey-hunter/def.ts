import type { SimDefinition } from '@/components/simulations/lab/contract'
import { createMonkeyHunterEngine } from './engine'

export const monkeyHunterDef: SimDefinition = {
  slug: 'monkey-hunter',
  title: 'Monkey Hunter: Projectile Motion',
  level: 'Core',
  summary: 'A classroom demonstration on a coordinate grid — aim a dart at a monkey that drops the instant you fire, and watch projectile motion and free fall interact.',
  canvasHeight: 450,
  params: [
    { key: 'monkeyHeight', label: 'Monkey Height', type: 'slider', min: 5, max: 14, step: 0.5, unit: 'm', default: 12 },
    { key: 'monkeyDistance', label: 'Horizontal Distance', type: 'slider', min: 8, max: 18, step: 0.5, unit: 'm', default: 13 },
    { key: 'dartSpeed', label: 'Dart Launch Speed', type: 'slider', min: 10, max: 30, step: 1, unit: 'm/s', default: 20 },
    {
      key: 'aimMode', label: 'Aiming Mode', type: 'select', default: 'direct',
      options: [
        { value: 'direct', label: 'At Monkey (hits!)' },
        { value: 'above', label: 'Above / Compensate (misses!)' },
      ],
    },
  ],
  readouts: [
    { key: 'time', label: 'Time', unit: 's' },
    { key: 'dartY', label: 'Dart Height', unit: 'm', precision: 1, color: 'var(--reward)' },
    { key: 'monkeyY', label: 'Monkey Height', unit: 'm', precision: 1, color: 'var(--success)' },
    { key: 'hitTime', label: 'Hit Time', unit: 's' },
    { key: 'status', label: 'Status', precision: 0 },
  ],
  createEngine: createMonkeyHunterEngine,
  learning: {
    objectives: [
      'Analyze 2D projectile motion alongside free fall',
      'See why a dart aimed at the monkey always hits, regardless of speed',
      'Recognize that gravity affects both objects at the same rate g = 9.8 m/s²',
    ],
    concepts: [
      'Dart: horizontal motion (constant) + vertical fall (accelerated)',
      'Monkey: no horizontal motion + vertical fall (accelerated)',
      'Both fall at g = 9.8 m/s² — the dart drops the same amount as the monkey, so the aim stays true',
    ],
    tryThis: [
      'Aim at the monkey: watch it drop — the dart still hits!',
      'Vary the monkey height — it still hits.',
      'Vary the horizontal distance — it still hits.',
      'Vary the dart speed, faster or slower — it still hits!',
      'Switch to "Above (Compensate)" and overcorrect for the drop — you will miss!',
    ],
  },
}
