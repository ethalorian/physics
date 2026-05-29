import type { SimDefinition } from '@/components/simulations/lab/contract'
import { createRiverboat3DEngine } from './engine3d'

// 3D prototype of the riverboat-crossing sim. Same physics as the 2D version,
// rendered with Three.js (renderMode: 'webgl'). The `view` toggle swaps between
// a perspective 3D scene and a flat top-down camera.
export const riverboatCrossing3DDef: SimDefinition = {
  slug: 'riverboat-crossing-3d',
  title: 'Riverboat Crossing (3D prototype)',
  level: 'Core',
  summary: 'The riverboat vector-addition lab in 3D — watch the boat point along its heading while the current sweeps it downstream. Toggle the camera between a 3D perspective view and the familiar flat top-down map.',
  canvasHeight: 460,
  renderMode: 'webgl',
  createEngineGL: createRiverboat3DEngine,
  params: [
    { key: 'view', label: 'Camera', type: 'select', default: '3d', live: true, options: [
      { value: '3d', label: '3D perspective' },
      { value: 'top', label: 'Top-down' },
    ] },
    { key: 'boatSpeed', label: 'Boat Speed (through water)', type: 'slider', min: 2, max: 10, step: 0.5, unit: 'm/s', default: 5, live: true },
    { key: 'boatAngle', label: 'Boat Heading Angle', type: 'slider', min: 60, max: 120, step: 5, unit: '°', default: 90, live: true },
    { key: 'currentSpeed', label: 'River Current Speed', type: 'slider', min: 0, max: 5, step: 0.5, unit: 'm/s', default: 2, live: true },
  ],
  readouts: [
    { key: 'time', label: 'Time', unit: 's', precision: 1 },
    { key: 'across', label: 'Distance Across', unit: 'm', precision: 1, color: 'var(--success)' },
    { key: 'drift', label: 'Downstream Drift', unit: 'm', precision: 1 },
    { key: 'resultantSpeed', label: 'Resultant Speed', unit: 'm/s', precision: 1, color: 'var(--reward)' },
    { key: 'resultantAngle', label: 'Resultant Angle', unit: '°', precision: 1 },
  ],
  learning: {
    objectives: [
      'See vector addition spatially: boat-through-water + current = resultant over ground',
      'Compare the 3D scene with the top-down map view of the same crossing',
      'Relate the boat’s heading to the path it actually travels',
    ],
    concepts: ['Vector addition', 'Relative velocity', '3D vs. top-down representation'],
    tryThis: [
      'Switch the camera to Top-down — it matches the 2D lab exactly.',
      'Raise the current and watch the boat crab downstream in 3D.',
      'Angle upstream to fight the current and reduce drift.',
    ],
  },
}
