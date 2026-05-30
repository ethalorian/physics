import type { SimDefinition } from '@/components/simulations/lab/contract'
import { createPicketFenceEngine } from './engine'

export const picketFenceGDef: SimDefinition = {
  slug: 'picket-fence-g',
  title: 'Picket-Fence g — Measuring Free-Fall Acceleration',
  level: 'Core',
  summary:
    'Drop a banded strip through a photogate. The gate times each band; equal spacing means each interval gives a velocity, and the slope of those velocities versus time is g. Change the mass, the spacing, the release height — the slope keeps coming out ≈ 9.8 m/s². That stubborn constant is why every object, including the asteroid, falls the same way.',
  canvasHeight: 440,
  params: [
    { key: 'bandSpacing', label: 'Band spacing', type: 'slider', min: 2, max: 8, step: 0.5, unit: 'cm', default: 5 },
    { key: 'releaseHeight', label: 'Release height above gate', type: 'slider', min: 0, max: 40, step: 5, unit: 'cm', default: 10 },
    { key: 'mass', label: 'Strip mass', type: 'slider', min: 10, max: 200, step: 10, unit: 'g', default: 50 },
  ],
  readouts: [
    { key: 'measuredG', label: 'Measured g (slope)', unit: 'm/s²', precision: 2, color: 'var(--reward)' },
    { key: 'bandsTimed', label: 'Bands timed', precision: 0 },
    { key: 'vGate', label: 'Velocity at gate', unit: 'm/s', precision: 2 },
    { key: 'spacing', label: 'Band spacing', unit: 'cm', precision: 1 },
    { key: 'mass', label: 'Strip mass', unit: 'g', precision: 0 },
    { key: 'fallTime', label: 'Fall time', unit: 's', precision: 3 },
  ],
  createEngine: createPicketFenceEngine,
  sensor: { kind: 'motion', label: 'Photogate (picket fence)', quantity: 'Velocity', unit: 'm/s', xLabel: 'Time (s)' },
  learning: {
    objectives: [
      'Measure g from photogate timing: equal spacing → each interval gives a velocity → slope of v vs t is g',
      'Explain why average velocity over an interval equals the instantaneous velocity at its midpoint (for constant acceleration)',
      'Argue from data that g is independent of mass — a heavy and a light object fall with the same acceleration',
      'Connect to the asteroid: the same g (and the same universal gravitation behind it) governs the asteroid’s motion',
    ],
    concepts: ['Free-fall acceleration', 'Photogate timing', 'Velocity from Δx/Δt', 'Slope of a v–t graph', 'Mass independence'],
    tryThis: [
      'Run it. The slope reads ≈ 9.8 m/s². Now drag Strip mass from 10 g to 200 g and run again — does the slope change at all?',
      'Change the band spacing. The points land in different places, but check the slope — still g.',
      'Raise the release height. The strip enters the gate already moving, so the points start higher up the line — but the slope (g) is unchanged.',
      'Mirror lab 2.1: read the velocities off the photogate trace and confirm each one equals √(2g·distance fallen).',
    ],
  },
}
