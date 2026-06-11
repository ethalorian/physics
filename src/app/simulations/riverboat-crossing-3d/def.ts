import type { SimDefinition } from '@/components/simulations/lab/contract'
import { createRiverboat3DEngine } from './engine3d'

// Riverboat crossing in 3D — rebuilt 2026-06-10. Same physics as the 2D sim
// (verified against its engine: sin → across, −cos → downstream). The hull
// points along the HEADING while the gold trail shows the path actually
// traveled — the "crab" IS the vector addition, made visible.
export const riverboatCrossing3DDef: SimDefinition = {
  slug: 'riverboat-crossing-3d',
  title: 'Riverboat Crossing in 3D — See the Crab',
  level: 'Core',
  summary: 'The boat’s nose points where the motor pushes (white dashed line). The river adds its own velocity. The gold trail is where the boat ACTUALLY goes. The gap between nose and trail is vector addition, visible from the deck of a moving world.',
  canvasHeight: 480,
  renderMode: 'webgl',
  createEngineGL: createRiverboat3DEngine,
  params: [
    { key: 'view', label: 'Camera', type: 'select', default: '3d', live: true, options: [
      { value: '3d', label: '3D chase camera' },
      { value: 'top', label: 'Top-down map (matches the 2D lab)' },
    ] },
    { key: 'boatSpeed', label: 'Boat speed (through the water)', type: 'slider', min: 2, max: 10, step: 0.5, unit: 'm/s', default: 5, live: true },
    { key: 'boatAngle', label: 'Heading — 90° = straight across, less = aim upstream', type: 'slider', min: 60, max: 120, step: 5, unit: '°', default: 90, live: true },
    { key: 'currentSpeed', label: 'River current', type: 'slider', min: 0, max: 5, step: 0.5, unit: 'm/s', default: 2, live: true },
  ],
  readouts: [
    { key: 'time', label: 'Time', unit: 's', precision: 1 },
    { key: 'across', label: 'Distance across', unit: 'm', precision: 1, color: 'var(--success)' },
    { key: 'drift', label: 'Drift from target dock', unit: 'm', precision: 1 },
    { key: 'resultantSpeed', label: 'Speed over ground', unit: 'm/s', precision: 1, color: 'var(--reward)' },
    { key: 'resultantAngle', label: 'Actual travel angle', unit: '°', precision: 1 },
  ],
  learning: {
    objectives: [
      'See the crab: the hull points along the heading while the boat travels along the resultant',
      'Read three labeled vectors live: boat-through-water + current = actual path',
      'Explain why aiming upstream (< 90°) lands you closer to the target dock',
    ],
    concepts: ['Vector addition', 'Relative velocity', 'Heading vs. track', 'Components'],
    tryThis: [
      'Run the default crossing and watch the white dashed nose-line versus the gold trail — they disagree. That disagreement is the current.',
      'Set the current to 0 and replay: nose-line and trail agree perfectly. Bring the current back and say what changed, in vector words.',
      'Find the heading that lands you ON the dock (drift ≈ 0). Then check: is your crossing TIME longer or shorter than heading straight across? Why must it be?',
      'Switch to the top-down map — it is exactly the 2D lab you already know, drawn by the same physics.',
    ],
  },
}
