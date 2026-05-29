import type { SimDefinition } from '@/components/simulations/lab/contract'
import { createFreeBodyDiagramEngine } from './engine'

export const freeBodyDiagramDef: SimDefinition = {
  slug: 'free-body-diagram',
  title: 'Free Body Diagram Lab',
  level: 'Core',
  summary:
    "Explore Newton's Second Law, F = ma. Add force arrows to the box and drag their arrowheads to set magnitude and direction. The green dashed arrow is the net force; the amber dotted arrow is the resulting acceleration.",
  canvasHeight: 500,
  params: [
    { key: 'mass', label: 'Mass', type: 'slider', min: 1, max: 20, step: 0.5, unit: 'kg', default: 5, live: true },
    {
      key: 'addForce',
      label: 'Add a force',
      type: 'select',
      default: 'none',
      live: true,
      options: [
        { value: 'none', label: 'Choose a force to add…' },
        { value: 'applied', label: 'Applied Force' },
        { value: 'gravity', label: 'Gravity (Weight)' },
        { value: 'normal', label: 'Normal Force' },
        { value: 'friction', label: 'Friction' },
        { value: 'tension', label: 'Tension' },
        { value: 'air-resistance', label: 'Air Resistance' },
        { value: 'spring', label: 'Spring Force' },
        { value: 'custom', label: 'Custom Force' },
      ],
    },
    {
      key: 'preset',
      label: 'Preset',
      type: 'select',
      default: 'custom',
      live: true,
      options: [
        { value: 'custom', label: 'Custom' },
        { value: 'balanced', label: 'Balanced Forces' },
        { value: 'unbalanced', label: 'Unbalanced Forces' },
        { value: 'gravity', label: 'Gravity Only' },
        { value: 'friction', label: 'With Friction' },
      ],
    },
    { key: 'showGrid', label: 'Show grid', type: 'toggle', default: true, live: true },
    { key: 'showLabels', label: 'Show labels', type: 'toggle', default: true, live: true },
    { key: 'showAcceleration', label: 'Show acceleration', type: 'toggle', default: true, live: true },
  ],
  readouts: [
    { key: 'mass', label: 'Mass', unit: 'kg', precision: 1 },
    { key: 'netF', label: 'Net Force', unit: 'N', precision: 2, color: 'var(--success)' },
    { key: 'accel', label: 'Acceleration', unit: 'm/s²', precision: 2, color: 'var(--reward)' },
    { key: 'netFx', label: 'ΣFx', unit: 'N', precision: 2 },
    { key: 'netFy', label: 'ΣFy', unit: 'N', precision: 2 },
    { key: 'forceCount', label: 'Forces', precision: 0 },
  ],
  createEngine: createFreeBodyDiagramEngine,
  showPlay: false,
  learning: {
    objectives: [
      "Apply Newton's Second Law: the net force on an object equals its mass times its acceleration (F = ma)",
      'Add up force vectors to find the net force on an object',
      'Predict the magnitude and direction of acceleration from the net force',
    ],
    concepts: [
      'The net force is the vector sum of every force acting on the object',
      'Balanced forces give zero net force and zero acceleration; unbalanced forces accelerate the object',
      'Acceleration points in the same direction as the net force, with magnitude a = F_net / m',
    ],
    tryThis: [
      'Add an Applied Force and a Friction force of equal size — watch the net force (and acceleration) drop to zero',
      'Drag a force arrowhead to change its magnitude and angle, and watch the net-force arrow respond',
      'Increase the mass with the same net force, and see the acceleration shrink',
      'Load the "Gravity Only" preset to see free-fall acceleration near 9.8 m/s²',
    ],
  },
}
