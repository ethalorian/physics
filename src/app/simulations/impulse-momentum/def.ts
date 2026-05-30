import type { SimDefinition } from '@/components/simulations/lab/contract'
import { createImpulseMomentumEngine } from './engine'

export const impulseMomentumDef: SimDefinition = {
  slug: 'impulse-momentum',
  title: 'Impulse & Momentum — Area Under the Force Curve',
  level: 'Core',
  summary:
    'A cart slams into a force sensor and rebounds. Watch the force–time pulse build: the area under it is the impulse, and the impulse equals the cart’s change in momentum. Now soften the bumper (longer contact time) — same area, same Δp, but a far lower peak force. That’s the airbag, the crumple zone, and the egg-drop, all in one graph.',
  canvasHeight: 470,
  params: [
    { key: 'cartMass', label: 'Cart mass', type: 'slider', min: 0.5, max: 5, step: 0.5, unit: 'kg', default: 1 },
    { key: 'impactSpeed', label: 'Impact speed', type: 'slider', min: 0.5, max: 5, step: 0.5, unit: 'm/s', default: 3 },
    { key: 'contactTime', label: 'Contact time (bumper softness)', type: 'slider', min: 20, max: 400, step: 10, unit: 'ms', default: 100 },
    { key: 'bounce', label: 'Rebound (e)', type: 'slider', min: 0, max: 1, step: 0.05, unit: '', default: 0.5 },
  ],
  readouts: [
    { key: 'impulse', label: 'Impulse (area)', unit: 'N·s', precision: 2, color: 'var(--success)' },
    { key: 'deltaP', label: 'Change in momentum Δp', unit: 'kg·m/s', precision: 2, color: 'var(--success)' },
    { key: 'peakForce', label: 'Peak force', unit: 'N', precision: 0 },
    { key: 'vIn', label: 'Speed in', unit: 'm/s', precision: 1 },
    { key: 'vOut', label: 'Speed out', unit: 'm/s', precision: 1 },
    { key: 'contactMs', label: 'Contact time', unit: 'ms', precision: 0 },
  ],
  createEngine: createImpulseMomentumEngine,
  sensor: { kind: 'force', label: 'Dual-Range Force Sensor', quantity: 'Force', unit: 'N', xLabel: 'Time (ms)' },
  learning: {
    objectives: [
      'Calculate impulse as the area under a force–time graph',
      'State and apply the impulse–momentum theorem: J = ∫F dt = Δp',
      'Explain why extending contact time lowers the peak force for the same change in momentum',
      'Connect to the asteroid: a small force over a long time delivers the same impulse as a huge force briefly — the choice between a gravity tractor and a nuclear option',
    ],
    concepts: ['Impulse', 'Momentum change', 'Impulse–momentum theorem', 'Peak force vs contact time'],
    tryThis: [
      'Note the impulse and the peak force. Now drag Contact time from 20 ms to 400 ms. What stays the same — and what plummets?',
      'That falling peak force IS the airbag, the crumple zone, and the egg-drop crash pad. Same Δp, longer time, gentler stop.',
      'Set Rebound e = 0 (stops dead) vs e = 1 (bounces back elastically). Which delivers more impulse for the same impact speed — and why?',
      'Mirror lab 3.2: run an impact, read the impulse off the area, and confirm it equals m·(v_out − v_in).',
    ],
  },
}
