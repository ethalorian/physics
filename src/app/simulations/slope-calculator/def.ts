import type { SimDefinition } from '@/components/simulations/lab/contract'
import { createSlopeCalculatorEngine } from './engine'

export const slopeCalculatorDef: SimDefinition = {
  slug: 'slope-calculator',
  title: 'Slope Calculator & Kinematics Visualizer',
  level: 'Core',
  summary:
    'Calculate slope and understand the relationships between position, velocity, and acceleration in kinematics. Drag two points on the graph — the rise/run triangle and the slope appear live; the slope of a position-time graph IS the velocity.',
  canvasHeight: 420,
  params: [
    {
      key: 'context',
      label: 'Mode',
      type: 'select',
      options: [
        { value: 'kinematics', label: 'Kinematics (Position-Time)' },
        { value: 'generic', label: 'Generic (x, y)' },
      ],
      default: 'kinematics',
      live: true,
    },
    {
      key: 'inputMode',
      label: 'Input Method',
      type: 'select',
      options: [
        { value: 'points', label: 'Points (drag)' },
        { value: 'equation', label: 'Equation (UAM)' },
      ],
      default: 'points',
      live: true,
    },
    {
      key: 'graphView',
      label: 'Graph',
      type: 'select',
      options: [
        { value: 'position', label: 'Position vs Time' },
        { value: 'velocity', label: 'Velocity vs Time' },
        { value: 'acceleration', label: 'Acceleration vs Time' },
      ],
      default: 'position',
      live: true,
    },
    { key: 'x0', label: 'Initial Position (x₀)', type: 'slider', min: -10, max: 10, step: 0.1, unit: 'm', default: 0, live: true },
    { key: 'v0', label: 'Initial Velocity (v₀)', type: 'slider', min: -10, max: 10, step: 0.1, unit: 'm/s', default: 2, live: true },
    { key: 'acceleration', label: 'Acceleration (a)', type: 'slider', min: -5, max: 5, step: 0.1, unit: 'm/s²', default: 0, live: true },
    { key: 'timeRange', label: 'Time Duration (t)', type: 'slider', min: 0.5, max: 10, step: 0.1, unit: 's', default: 4, live: true },
  ],
  readouts: [
    { key: 'slope', label: 'Slope (m)', precision: 3, color: 'var(--primary)' },
    { key: 'rise', label: 'Rise (Δy)', unit: 'm', precision: 2, color: 'var(--success)' },
    { key: 'run', label: 'Run (Δx)', unit: 's', precision: 2 },
    { key: 'intercept', label: 'y-intercept (b)', precision: 3 },
    { key: 'velocity', label: 'Velocity', unit: 'm/s', precision: 3, color: 'var(--success)' },
    { key: 'acceleration', label: 'Acceleration', unit: 'm/s²', precision: 3, color: 'var(--reward)' },
  ],
  createEngine: createSlopeCalculatorEngine,
  showPlay: false,
  learning: {
    objectives: [
      'Calculate slope from two points using m = (y₂ − y₁) / (x₂ − x₁)',
      'Read the slope of a position-time graph as velocity',
      'See how position, velocity, and acceleration graphs are linked',
      'Write a line in slope-intercept and point-slope form',
    ],
    concepts: [
      'The slope of a position-time graph IS the velocity',
      'The slope of a velocity-time graph IS the acceleration',
      'Positive slope → upward line; negative slope → downward line; zero slope → flat line',
      'Constant velocity → straight position-time line; acceleration → a parabola',
    ],
    tryThis: [
      'Drag the two points to make a steeper line — watch the velocity readout grow',
      'Drag a point so the line goes downward — the slope (velocity) turns negative',
      'Switch to Equation mode and add acceleration to curve the position-time line into a parabola',
      'Compare the Position, Velocity, and Acceleration graphs for the same motion',
    ],
  },
}
