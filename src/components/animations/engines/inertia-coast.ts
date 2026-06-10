/**
 * A4 · inertia-coast — Day 9.
 * A probe coasts through empty space dead straight, dropping a breadcrumb
 * marker every second — equal spacing, constant velocity, no force needed.
 * At t=14s a one-second thrust fires sideways; the path kinks ONCE and is
 * immediately straight again at the new velocity. Set the knob to zero and
 * nothing ever changes — that IS Newton's first law.
 * KNOB: thrust Δv (0–10 m/s, sideways).
 */

import * as THREE from 'three'
import type { AnimDefinition, AnimEngine } from '../contract'
import { PALETTE, createRenderer, addLights, addStarfield, makeArrow, setArrow, phase, ease, disposeScene } from '../scene-kit'

const V0 = 5                   // m/s along +x (1 world unit = 1 m)
const BURN_START = 14, BURN_END = 15
const T_END = 28

// Deterministic kinematics: position at script-time t for a given Δv knob.
function positionAt(t: number, dv: number): THREE.Vector3 {
  const x = V0 * t
  let z = 0
  if (t > BURN_START) {
    const tb = Math.min(t, BURN_END) - BURN_START      // time inside the burn
    const a = dv / (BURN_END - BURN_START)             // constant accel during burn
    z += 0.5 * a * tb * tb
    if (t > BURN_END) z += dv * (t - BURN_END)         // coast at the new vz
  }
  return new THREE.Vector3(x, 0, z)
}

function velocityAt(t: number, dv: number): THREE.Vector3 {
  const vz = t <= BURN_START ? 0 : t >= BURN_END ? dv : dv * (t - BURN_START) / (BURN_END - BURN_START)
  return new THREE.Vector3(V0, 0, vz)
}

function createEngine(canvas: HTMLCanvasElement): AnimEngine {
  const renderer = createRenderer(canvas)
  const scene = new THREE.Scene()
  addLights(scene)
  addStarfield(scene, 650)

  // The probe: a small capsule-ish body (cylinder + nose cone).
  const probe = new THREE.Group()
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.8, 12), new THREE.MeshStandardMaterial({ color: 0xd8d4ec, roughness: 0.4, metalness: 0.3 }))
  body.rotation.z = Math.PI / 2
  probe.add(body)
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.9, 12), new THREE.MeshStandardMaterial({ color: PALETTE.vecMain, roughness: 0.5 }))
  nose.rotation.z = -Math.PI / 2
  nose.position.x = 1.35
  probe.add(nose)
  scene.add(probe)

  // Thrust plume (visible only during the burn).
  const plume = new THREE.Mesh(new THREE.ConeGeometry(0.4, 2.2, 10), new THREE.MeshBasicMaterial({ color: PALETTE.thrust, transparent: true, opacity: 0.85 }))
  scene.add(plume)

  // Breadcrumbs: one marker per elapsed second (up to T_END).
  const crumbs: THREE.Mesh[] = []
  const crumbMat = new THREE.MeshBasicMaterial({ color: PALETTE.path })
  for (let i = 0; i < T_END; i++) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), crumbMat)
    c.visible = false
    scene.add(c)
    crumbs.push(c)
  }

  const vArrow = makeArrow(PALETTE.vecA)
  scene.add(vArrow)

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000)

  function render(t: number, knob: number): void {
    const pos = positionAt(t, knob)
    const vel = velocityAt(t, knob)
    probe.position.copy(pos)
    // Nose points along velocity.
    probe.rotation.y = -Math.atan2(vel.z, vel.x)

    // Breadcrumbs at each whole second already passed.
    for (let i = 0; i < crumbs.length; i++) {
      const visible = t >= i + 1
      crumbs[i].visible = visible
      if (visible) crumbs[i].position.copy(positionAt(i + 1, knob))
    }

    // Velocity arrow rides the probe (length ∝ speed).
    setArrow(vArrow, pos.clone().add(new THREE.Vector3(0, 1.4, 0)), vel.clone().multiplyScalar(0.8))

    // Plume during the burn, firing OPPOSITE the gained velocity (−z side).
    const burning = t >= BURN_START && t <= BURN_END && knob > 0
    plume.visible = burning
    if (burning) {
      plume.position.copy(pos.clone().add(new THREE.Vector3(0, 0, -1.6)))
      plume.rotation.x = -Math.PI / 2
      const flicker = 0.8 + 0.2 * Math.sin(t * 40)
      plume.scale.setScalar(flicker)
    }

    // Camera: trails the probe from above-side; eases wider as the path grows.
    const wide = ease(phase(t, 0, T_END))
    const dist = 16 + wide * 26
    camera.position.set(pos.x - dist * 0.45, dist * 0.62, pos.z + dist * 0.78)
    camera.lookAt(pos.x - 4, 0, pos.z * 0.6)
    renderer.render(scene, camera)
  }

  return {
    render,
    readout(t: number, knob: number): string {
      const vel = velocityAt(t, knob)
      const speed = vel.length()
      const ang = (Math.atan2(vel.z, vel.x) * 180) / Math.PI
      const phaseWord = t < BURN_START ? 'coasting — no force' : t <= BURN_END ? 'THRUST FIRING' : 'coasting again — no force'
      return `|v| = ${speed.toFixed(2)} m/s at ${ang.toFixed(1)}°   ·   ${phaseWord}`
    },
    resize(w: number, h: number): void {
      renderer.setSize(w, h, false)
      camera.aspect = w / Math.max(1, h)
      camera.updateProjectionMatrix()
    },
    dispose(): void { disposeScene(scene, renderer) },
  }
}

export const inertiaCoastDef: AnimDefinition = {
  slug: 'inertia-coast',
  title: 'Coasting: Newton’s First Law in the Only Place You Can See It',
  duration: T_END,
  posterTime: 20,
  steps: [
    { label: 'Deep space. No engine, no friction, no air. The probe is just… moving.', atTime: 0 },
    { label: 'A marker drops every second. Equal spacing — the velocity is NOT changing. Nothing is making it move.', atTime: 6 },
    { label: 'One second of sideways thrust — the only force in this whole story.', atTime: BURN_START },
    { label: 'New velocity, and instantly straight again. One force, one change. Set thrust to 0 and replay.', atTime: BURN_END + 1 },
  ],
  knob: { label: 'Thrust Δv', min: 0, max: 10, step: 0.5, initial: 4, unit: ' m/s' },
  create: createEngine,
}
