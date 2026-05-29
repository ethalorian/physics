import type { SimDefinition } from '@/components/simulations/lab/contract'
import { createAreaUnderCurveEngine } from './engine'

export const areaUnderCurveDef: SimDefinition = {
  slug: 'area-under-curve',
  title: 'Area under the curve',
  level: 'Challenge',
  summary:
    'Discover how the area under a motion graph reveals a physics quantity. Drag the two points to shape the line on a velocity-time, acceleration-time, or position-time graph — the shaded area equals displacement, change in velocity, or (for a curve) is approximated with Riemann rectangles.',
  canvasHeight: 450,
  params: [
    {
      key: 'graphType',
      label: 'Graph type',
      type: 'select',
      default: 'velocity-time',
      options: [
        { value: 'velocity-time', label: 'Velocity vs Time' },
        { value: 'acceleration-time', label: 'Acceleration vs Time' },
        { value: 'position-time', label: 'Position vs Time' },
      ],
      live: true,
    },
    { key: 'numRectangles', label: 'Number of rectangles', type: 'slider', min: 1, max: 50, step: 1, default: 4, live: true },
    { key: 'v0', label: 'Initial velocity v₀ (curve)', type: 'slider', min: -10, max: 10, step: 0.5, unit: 'm/s', default: 0, live: true },
    { key: 'acceleration', label: 'Acceleration a (curve)', type: 'slider', min: -5, max: 5, step: 0.5, unit: 'm/s²', default: 0, live: true },
  ],
  readouts: [
    { key: 'area', label: 'Area', precision: 2, color: 'var(--primary)' },
    { key: 'physics', label: 'Represents' },
    { key: 'shape', label: 'Shape' },
    { key: 'width', label: 'Width', unit: 's', precision: 2 },
  ],
  createEngine: createAreaUnderCurveEngine,
  showPlay: false,
  learning: {
    objectives: [
      'Find the area under a velocity-time graph and read it as displacement (Δx = v × t)',
      'Read the area under an acceleration-time graph as change in velocity (Δv = a × t)',
      'Decompose a trapezoid into a rectangle plus a triangle to compute its area',
      'Approximate the area under a curve with thin rectangles (the Riemann idea)',
    ],
    concepts: [
      'Area under velocity-time = displacement; area under acceleration-time = change in velocity',
      'A trapezoid splits cleanly into a rectangle (the smaller height) plus a triangle (the difference)',
      'For a curved position-time graph, more (thinner) rectangles give a better approximation — in the limit, the exact area',
      'For position-time graphs we use the slope (velocity), not the area',
    ],
    tryThis: [
      'Make a flat line (equal heights) to see the area as a simple rectangle = constant velocity × time',
      'Drag one point to zero so the region becomes a triangle, then check ½ × base × height',
      'Drag both points to different heights to get a rectangle + triangle, and add the two pieces',
      'Switch to Position vs Time, set an acceleration, and slide the rectangle count from 1 to 50 to watch the approximation tighten',
    ],
  },
}
