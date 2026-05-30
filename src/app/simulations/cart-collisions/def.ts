import type { SimDefinition } from '@/components/simulations/lab/contract'
import { createCartCollisionsEngine } from './engine'

export const cartCollisionsDef: SimDefinition = {
  slug: 'cart-collisions',
  title: 'Cart Collisions — Conservation of Momentum',
  level: 'Core',
  summary:
    'Two carts collide on a track. Set each mass and starting velocity, then slide from a bouncy (elastic) crash to a sticky (inelastic) one. Watch the two readouts: total momentum survives every collision, but kinetic energy only survives the perfectly elastic one — momentum and energy are independent conservation laws.',
  canvasHeight: 460,
  params: [
    { key: 'mass1', label: 'Cart A mass', type: 'slider', min: 0.5, max: 5, step: 0.5, unit: 'kg', default: 2 },
    { key: 'v1', label: 'Cart A velocity', type: 'slider', min: -4, max: 4, step: 0.5, unit: 'm/s', default: 2 },
    { key: 'mass2', label: 'Cart B mass', type: 'slider', min: 0.5, max: 5, step: 0.5, unit: 'kg', default: 1 },
    { key: 'v2', label: 'Cart B velocity', type: 'slider', min: -4, max: 4, step: 0.5, unit: 'm/s', default: -1.5 },
    { key: 'elasticity', label: 'Bounciness (e)', type: 'slider', min: 0, max: 1, step: 0.05, unit: '', default: 1 },
  ],
  readouts: [
    { key: 'type', label: 'Collision type' },
    { key: 'pBefore', label: 'Momentum before', unit: 'kg·m/s', precision: 2 },
    { key: 'pAfter', label: 'Momentum after', unit: 'kg·m/s', precision: 2, color: 'var(--success)' },
    { key: 'keBefore', label: 'KE before', unit: 'J', precision: 2 },
    { key: 'keAfter', label: 'KE after', unit: 'J', precision: 2 },
    { key: 'keLost', label: 'KE lost to heat', unit: '%', precision: 0 },
  ],
  createEngine: createCartCollisionsEngine,
  sensors: [
    { key: 'vA', kind: 'motion', label: 'Motion Detector — Cart A', quantity: 'Velocity', unit: 'm/s', color: 'var(--primary)' },
    { key: 'vB', kind: 'motion', label: 'Motion Detector — Cart B', quantity: 'Velocity', unit: 'm/s', color: 'var(--force)' },
  ],
  learning: {
    objectives: [
      'Predict the outcome of a 1D collision using conservation of momentum',
      'Distinguish elastic (KE conserved) from inelastic (KE not conserved) collisions',
      'Argue why momentum is conserved even when kinetic energy is not — they are independent principles',
      'Connect to the asteroid: a kinetic impactor’s deflection is set by momentum transfer, not by whether the crash is elastic',
    ],
    concepts: ['Momentum conservation', 'Elastic vs inelastic', 'Coefficient of restitution', 'Kinetic energy'],
    tryThis: [
      'Set e = 1 (fully bouncy). Note momentum AND energy after. Now drag e to 0 (sticky). Which readout changed — and which didn’t?',
      'Make the masses equal and send only Cart A moving (Cart B velocity = 0) at e = 1. Watch the velocities completely swap.',
      'At e = 0, the carts stick and move together. Predict their common speed from momentum before you run it.',
      'Mirror lab 3.1: run a bouncy and a sticky collision, read momentum-before vs momentum-after off the Motion Detector traces, and confirm they match.',
    ],
  },
}
