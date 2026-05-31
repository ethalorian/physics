import type { SimDefinition } from '@/components/simulations/lab/contract'
import { createAsteroidTrajectoryEngine } from './engine'

export const asteroidTrajectoryDef: SimDefinition = {
  slug: 'asteroid-trajectory',
  title: 'Reading 2026-XJ’s Trajectory',
  level: 'Core',
  summary:
    "Each week NASA reports a new distance to the asteroid. Far from Earth it coasts at near-constant velocity, so the distance-time data falls on a straight line. Fit the trend, read the slope (that's the closing speed), and extrapolate to distance zero to predict the impact day. Crank up the measurement scatter and watch the prediction get shakier — that's why a single observation isn't enough.",
  canvasHeight: 460,
  params: [
    { key: 'closingSpeed', label: 'Asteroid closing speed', type: 'slider', min: 5, max: 30, step: 1, unit: 'km/s', default: 17 },
    { key: 'startDistance', label: 'Distance at first detection', type: 'slider', min: 10, max: 150, step: 5, unit: 'M km', default: 50 },
    { key: 'scatter', label: 'Measurement scatter', type: 'slider', min: 0, max: 12, step: 1, unit: '%', default: 4 },
  ],
  readouts: [
    { key: 'predImpact', label: 'Predicted impact', unit: 'day', precision: 0, color: 'var(--reward)' },
    { key: 'daysLeft', label: 'Days until impact', unit: 'days', precision: 0 },
    { key: 'measSpeed', label: 'Closing speed (from slope)', unit: 'km/s', precision: 1 },
    { key: 'currentDist', label: 'Latest distance', unit: 'M km', precision: 1 },
    { key: 'observations', label: 'Observations', precision: 0 },
  ],
  createEngine: createAsteroidTrajectoryEngine,
  sensor: { kind: 'motion', label: 'Tracking — distance vs time', quantity: 'Distance', unit: 'M km', xLabel: 'Day' },
  learning: {
    objectives: [
      'Read velocity as the slope of a distance-time graph',
      'Extrapolate a linear trend to predict a future position (and arrival time)',
      'Explain why measurement scatter creates uncertainty in a prediction',
      'Apply the same graph-reading used on a walking lab (1.1) to real NASA trajectory data',
    ],
    concepts: ['Position-time graphs', 'Slope = velocity', 'Linear extrapolation', 'Constant velocity', 'Measurement uncertainty'],
    tryThis: [
      'Run it. The fit line crosses zero at the predicted impact day. What is the closing speed from the slope?',
      'Slide Measurement scatter from 0% up to 12%. The data spreads out — does your predicted impact day still land in the same place, or wander?',
      'Double the closing speed. The line gets steeper and the impact day moves — earlier or later? Predict before you run.',
      'Start farther out (150 M km). You get more lead time, but the impact is further beyond your data. Is the extrapolation more or less trustworthy?',
    ],
  },
}
