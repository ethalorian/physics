/**
 * A5 · push-the-asteroid — Day 11 (echoed Days 12–13).
 * The SAME thruster (F = 5.0 × 10⁴ N, 10 s burn) fires on three targets:
 * a 1 m boulder (visible kick), a 100 m rock (millimeters), and 2026-XJ
 * itself (micrometers — motion you can only see on the instrument readout).
 * Same force, twelve orders of magnitude of mass. a = F/m is the whole story,
 * and it's why deflection missions need YEARS of lead time.
 * KNOB: which target (0 = boulder, 1 = 100 m rock, 2 = 2026-XJ).
 */

import * as THREE from 'three'
import type { AnimDefinition, AnimEngine } from '../contract'
import { PALETTE, createRenderer, addLights, addStarfield, makeAsteroid, phase, ease, disposeScene } from '../scene-kit'

const F = 5.0e4               // N
const BURN_START = 8, BURN_END = 18
const T_END = 30

interface Target { name: string; diameter: number; mass: number; viewDist: number }
const TARGETS: Target[] = [
  { name: '1 m boulder',  diameter: 1,   mass: 1.8e3,    viewDist: 6 },
  { name: '100 m rock',   diameter: 100, mass: 1.8e9,    viewDist: 320 },
  { name: '2026-XJ (400 m)', diameter: 400, mass: 3.5e11, viewDist: 1250 },
]

// Displacement along +x at script-time t (real physics, real numbers).
function dispAt(t: number, tg: Target): number {
  const a = F / tg.mass
  if (t <= BURN_START) return 0
  const tb = Math.min(t, BURN_END) - BURN_START
  let d = 0.5 * a * tb * tb
  if (t > BURN_END) d += a * (BURN_END - BURN_START) * (t - BURN_END)
  return d
}

function fmtDist(m: number): string {
  if (m >= 1) return `${m.toFixed(2)} m`
  if (m >= 1e-3) return `${(m * 1e3).toFixed(2)} mm`
  return `${(m * 1e6).toFixed(2)} µm`
}

function createEngine(canvas: HTMLCanvasElement): AnimEngine {
  const renderer = createRenderer(canvas)
  const scene = new THREE.Scene()
  addLights(scene)
  addStarfield(scene, 600)

  // One rock mesh per target, shown/hidden by the knob (scaled to diameter).
  const rocks = TARGETS.map((tg, i) => {
    const r = makeAsteroid(tg.diameter / 2, 7 + i * 3)
    scene.add(r)
    return r
  })

  // The thruster: a small rig + plume on the −x side of the target.
  const rig = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.7, 1.6, 10),
    new THREE.MeshStandardMaterial({ color: 0xd8d4ec, roughness: 0.4, metalness: 0.4 }),
  )
  rig.rotation.z = Math.PI / 2
  scene.add(rig)
  const plume = new THREE.Mesh(new THREE.ConeGeometry(0.5, 3, 10), new THREE.MeshBasicMaterial({ color: PALETTE.thrust, transparent: true, opacity: 0.85 }))
  plume.rotation.z = Math.PI / 2
  scene.add(plume)

  // A start-line: where the surface was before the burn (the honest ruler).
  const startLine = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 8), new THREE.MeshBasicMaterial({ color: PALETTE.vecA, transparent: true, opacity: 0.9, side: THREE.DoubleSide }))
  scene.add(startLine)

  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 50000)

  function render(t: number, knob: number): void {
    const idx = Math.min(TARGETS.length - 1, Math.max(0, Math.round(knob)))
    const tg = TARGETS[idx]
    const d = dispAt(t, tg)
    // Visual displacement: real meters in world units (1 unit = 1 m) — the
    // boulder visibly moves; the big bodies honestly DON'T. The readout carries it.
    const x = d

    rocks.forEach((r, i) => {
      r.visible = i === idx
      if (i === idx) { r.position.set(x, 0, 0); r.rotation.y = t * 0.05 }
    })

    // Rig sits at the target's −x surface; scaled with the scene so it stays visible.
    const rigScale = Math.max(1, tg.diameter / 18)
    const surfX = x - tg.diameter / 2
    rig.scale.setScalar(rigScale)
    rig.position.set(surfX - rigScale * 0.9, 0, 0)

    const burning = t >= BURN_START && t <= BURN_END
    plume.visible = burning
    if (burning) {
      const flicker = (0.85 + 0.15 * Math.sin(t * 40)) * rigScale
      plume.scale.setScalar(flicker)
      plume.position.set(surfX - rigScale * 0.9 - flicker * 1.9, 0, 0)
    }

    // Start-line marks the surface's pre-burn position, scaled to stay readable.
    startLine.scale.setScalar(Math.max(1, tg.diameter / 8))
    startLine.position.set(-tg.diameter / 2, 0, 0.01)

    // Camera: frames the current target; gentle drift, slight push-in at the end.
    const pEnd = ease(phase(t, BURN_END + 4, T_END))
    const dist = tg.viewDist * (1 - 0.15 * pEnd)
    const az = -0.5 + t * 0.012
    camera.position.set(x - tg.diameter / 2 + dist * Math.sin(az) * 0.4, dist * 0.3, dist * Math.cos(az))
    camera.lookAt(x - tg.diameter / 2, 0, 0)
    renderer.render(scene, camera)
  }

  return {
    render,
    readout(t: number, knob: number): string {
      const idx = Math.min(TARGETS.length - 1, Math.max(0, Math.round(knob)))
      const tg = TARGETS[idx]
      const a = F / tg.mass
      const d = dispAt(t, tg)
      const burnWord = t < BURN_START ? 'standing by' : t <= BURN_END ? 'BURN' : 'burn complete'
      return `${tg.name}   ·   m = ${tg.mass.toExponential(1)} kg   ·   a = F/m = ${a.toExponential(2)} m/s²   ·   moved: ${fmtDist(d)}   ·   ${burnWord}`
    },
    resize(w: number, h: number): void {
      renderer.setSize(w, h, false)
      camera.aspect = w / Math.max(1, h)
      camera.updateProjectionMatrix()
    },
    dispose(): void { disposeScene(scene, renderer) },
  }
}

export const pushTheAsteroidDef: AnimDefinition = {
  slug: 'push-the-asteroid',
  title: 'Same Force, Three Targets — Why Deflection Is Hard',
  duration: T_END,
  posterTime: 17,
  steps: [
    { label: 'One thruster: 50,000 newtons — about the push of a small rocket engine.', atTime: 0 },
    { label: 'Burn: ten full seconds at maximum thrust. Watch the green start-line.', atTime: BURN_START },
    { label: 'Burn complete. How far did it move? Check the readout, not your eyes.', atTime: BURN_END },
    { label: 'Now switch targets and replay. Same F. Only m changes. THAT is F = ma.', atTime: 24 },
  ],
  knob: {
    label: 'Target',
    min: 0, max: 2, step: 1, initial: 0,
    display: (v) => TARGETS[Math.min(2, Math.max(0, Math.round(v)))].name,
  },
  create: createEngine,
}
