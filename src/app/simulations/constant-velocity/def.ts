import type { SimDefinition } from '@/components/simulations/lab/contract'
import { createConstantVelocityEngine } from './engine'

export const constantVelocityDef: SimDefinition = {
  slug: 'constant-velocity',
  title: 'Constant velocity motion',
  level: 'Intro',
  summary: 'Control a walker along a track and collect position data over time. Watch how steady speed makes a straight position-time line.',
  canvasHeight: 230,
  params: [
    { key: 'speed', label: 'Walking speed', type: 'slider', min: 0.5, max: 3, step: 0.1, unit: 'm/s', default: 1 },
    {
      key: 'direction', label: 'Direction', type: 'select', live: true, default: 'stopped',
      options: [
        { value: 'backward', label: '← Backward' },
        { value: 'stopped', label: '■ Stopped' },
        { value: 'forward', label: 'Forward →' },
      ],
    },
  ],
  readouts: [
    { key: 'time', label: 'Time', unit: 's', precision: 0 },
    { key: 'position', label: 'Position', unit: 'm', precision: 2 },
    { key: 'velocity', label: 'Velocity', unit: 'm/s', precision: 1, color: 'var(--primary)' },
  ],
  createEngine: createConstantVelocityEngine,
  sensors: [
    { key: 'position', kind: 'motion', label: 'Motion Detector', quantity: 'Position', unit: 'm' },
    { key: 'velocity', kind: 'motion', label: 'Motion Detector', quantity: 'Velocity', unit: 'm/s' },
  ],
  learning: {
    objectives: [
      'Understand constant-velocity motion',
      'Read velocity as the slope of a position-time graph',
      'Collect and interpret position data',
    ],
    tryThis: [
      'Walk forward for 5 seconds, then switch to stopped',
      'Compare the line for forward vs. backward motion',
      'Export the data and find velocity from rise over run',
    ],
  },
}
