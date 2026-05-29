import type { SimDefinition } from '@/components/simulations/lab/contract'
import { createCartsThirdLawEngine } from './engine'

export const cartsThirdLawDef: SimDefinition = {
  slug: 'carts-third-law',
  title: "Carts & Springs: Newton's Third Law",
  level: 'Core',
  summary:
    'Two carts with a compressed spring between them — when released, an equal-and-opposite force pushes them apart. Watch action-reaction pairs in action and see total momentum stay conserved (≈ 0) as the lighter cart speeds away faster.',
  canvasHeight: 300,
  params: [
    { key: 'massA', label: 'Cart A Mass', type: 'slider', min: 0.5, max: 5, step: 0.5, unit: 'kg', default: 2.0 },
    { key: 'massB', label: 'Cart B Mass', type: 'slider', min: 0.5, max: 5, step: 0.5, unit: 'kg', default: 1.0 },
    { key: 'interactionForce', label: 'Spring Force', type: 'slider', min: 10, max: 300, step: 10, unit: 'N', default: 100 },
  ],
  readouts: [
    { key: 'time', label: 'Time', unit: 's', precision: 2 },
    { key: 'velocityA', label: 'Cart A Velocity', unit: 'm/s', precision: 2, color: 'var(--primary)' },
    { key: 'velocityB', label: 'Cart B Velocity', unit: 'm/s', precision: 2, color: 'var(--destructive)' },
    { key: 'totalMomentum', label: 'Total Momentum', unit: 'kg·m/s', precision: 3 },
    { key: 'forceOnA', label: 'Force on A', unit: 'N', precision: 0, color: 'var(--success)' },
    { key: 'forceOnB', label: 'Force on B', unit: 'N', precision: 0 },
  ],
  createEngine: createCartsThirdLawEngine,
  sensors: [
    { key: 'velocityA', kind: 'motion', label: 'Motion Detector', quantity: 'Cart A velocity', unit: 'm/s' },
    { key: 'velocityB', kind: 'motion', label: 'Motion Detector', quantity: 'Cart B velocity', unit: 'm/s' },
    { key: 'totalMomentum', kind: 'motion', label: 'Motion Detector', quantity: 'Total momentum', unit: 'kg·m/s' },
  ],
  learning: {
    objectives: [
      'Identify action-reaction pairs: F(A→B) = −F(B→A)',
      'Explain why the same force gives different accelerations to different masses (F = ma)',
      'Show that total momentum is conserved when no external force acts: p_total = m_A·v_A + m_B·v_B ≈ 0',
    ],
    concepts: ["Newton's Third Law", 'Action-reaction pairs', 'Conservation of momentum', 'F = ma'],
    tryThis: [
      'Equal masses: watch the carts move at the same speed in opposite directions.',
      'Different masses: see the lighter cart move faster!',
      'Vary the spring force: observe how it affects the final velocities.',
      'Check the total-momentum trace: it should stay near zero (conserved!).',
      'Calculate: if m_A = 2 kg moves at 1 m/s left, how fast does m_B = 1 kg move?',
    ],
  },
}
