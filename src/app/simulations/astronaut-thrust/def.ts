import type { SimDefinition } from '@/components/simulations/lab/contract'
import { createAstronautThrustEngine } from './engine'

export const astronautThrustDef: SimDefinition = {
  slug: 'astronaut-thrust',
  title: "Astronaut Thrust: Newton's Laws in Space",
  level: 'Core',
  summary:
    "Apply thrust vectors to a 100 kg astronaut floating in space — no friction, no gravity — and watch Newton's First and Second Laws play out. Zero thrust means constant velocity (equilibrium); a steady thrust gives a steady acceleration a = F/m. Change the thrust direction mid-run to curve the path.",
  canvasHeight: 500,
  params: [
    { key: 'initialVelocity', label: 'Initial velocity', type: 'slider', min: 0, max: 10, step: 0.5, unit: 'm/s', default: 0 },
    { key: 'velocityAngle', label: 'Velocity direction', type: 'slider', min: 0, max: 360, step: 15, unit: '°', default: 0 },
    { key: 'thrustMagnitude', label: 'Thrust force', type: 'slider', min: 0, max: 500, step: 10, unit: 'N', default: 0, live: true },
    { key: 'thrustAngle', label: 'Thrust direction', type: 'slider', min: 0, max: 360, step: 15, unit: '°', default: 0, live: true },
  ],
  readouts: [
    { key: 'time', label: 'Time', unit: 's', precision: 1 },
    { key: 'speed', label: 'Speed', unit: 'm/s', precision: 2, color: 'var(--primary)' },
    { key: 'acceleration', label: 'Acceleration', unit: 'm/s²', precision: 2 },
    { key: 'force', label: 'Force', unit: 'N', precision: 0, color: 'var(--destructive)' },
  ],
  createEngine: createAstronautThrustEngine,
  sensor: {
    kind: 'motion',
    label: 'Motion Detector',
    quantity: 'Speed',
    unit: 'm/s',
  },
  learning: {
    objectives: [
      "Apply Newton's First Law: with no net force, an object stays at rest or moves at constant velocity",
      "Apply Newton's Second Law: a = F/m, so a steady force gives a steady acceleration",
      'Resolve a thrust force into x and y components and relate it to the resulting motion',
    ],
    concepts: ["Newton's First Law (inertia)", "Newton's Second Law (F = ma)", 'Mechanical equilibrium', 'Acceleration vs. velocity', 'Frictionless / gravity-free motion'],
    tryThis: [
      'Zero thrust: watch equilibrium (constant velocity)',
      'Apply 200 N thrust: see acceleration begin (a = 200/100 = 2 m/s²)',
      'Change the angle while running: observe the curved path',
      'Compare the speed graph with and without thrust',
    ],
  },
}
