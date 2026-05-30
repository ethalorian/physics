// Per-sim render scenes for the headless harness.
//   params:    slider overrides (defaults from def.ts are used otherwise)
//   frames:    number of 1/120 s steps to advance before rendering (0 = initial)
//   width:     CSS width in px (default 760); height comes from def.canvasHeight
//   dpr:       device-pixel-ratio (default 2)
//   tolerance: max differing pixels allowed in `check` (default 200)
//
// Frame counts are chosen to land each sim in a representative mid-run state —
// e.g. monkey-hunter after the hit, atwood near the target line, riverboat
// mid-river. Keep them stable so golden diffs stay meaningful.

export const SCENES = {
  // dynamics
  'sumo-forces': { params: { redForce: 1000, blueForce: 990, redMass: 250, blueMass: 80 }, frames: 120 },
  'monkey-hunter': { frames: 110 },
  'atwood-machine': { frames: 200 },
  'carts-third-law': { frames: 150 },
  'cart-collisions': { frames: 260 }, // approach → collision → ~2 s after
  'astronaut-thrust': { params: { thrustMagnitude: 60, thrustAngle: 30, initialVelocity: 5, velocityAngle: 0 }, frames: 300 },
  'vacuum-chamber': { frames: 150 },
  'dart-deflection': { frames: 820 }, // ~6.5 s animation → arrival/outcome

  // projectile / kinematics
  'impulse-momentum': { frames: 380 }, // approach + full contact pulse
  'projectile-motion': { frames: 120 },
  'freefall-cliff': { frames: 170 },
  'uniformly-accelerated-motion': { frames: 170 },
  'constant-velocity': { frames: 100 },
  'picket-fence-g': { frames: 460 }, // full strip falls through the gate
  'car-race': { frames: 150 },
  'race-track': { frames: 150 },

  // vectors
  'riverboat-crossing': { frames: 1500 },

  // static / input-driven (render initial state)
  'free-body-diagram': {},
  'slope-calculator': {},
  'distance-displacement': {},
  'area-under-curve': {},
  'measurement-precision': {},
}
