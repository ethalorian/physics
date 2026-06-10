/**
 * A1 · approach-geometry — Day 1 anchor (reused Day 20).
 * Earth + Moon's orbit at true relative scale (1 unit = 10⁴ km), then an
 * exponential camera pull-back until 2026-XJ's whole trajectory is visible,
 * then nine months fast-forward along the path to the June 2027 window.
 * KNOB: camera orbit angle — the geometry is real 3D; walk around it.
 */

import * as THREE from 'three'
import type { AnimDefinition, AnimEngine } from '../contract'
import { PALETTE, createRenderer, addLights, addStarfield, makeEarth, makeAsteroid, phase, ease, disposeScene } from '../scene-kit'

// Scale: 1 world unit = 10,000 km.
const EARTH_R = 0.64          // 6,371 km — honestly tiny at this scale
const MOON_ORBIT = 38.4       // 384,000 km
const START_DIST = 12000      // 1.2 × 10⁸ km
const APPROACH_DEG = 15

const T_NEIGHBORHOOD = 0, T_PULLBACK = 8, T_FASTFWD = 18, T_ARRIVAL = 30, T_END = 36
const MONTHS = 9

function trajectoryPoint(u: number): THREE.Vector3 {
  // Slightly bowed path (gravity bends it late) from deep space to near Earth.
  const a = (APPROACH_DEG * Math.PI) / 180
  const start = new THREE.Vector3(Math.cos(a) * START_DIST, START_DIST * 0.04, Math.sin(a) * START_DIST)
  const end = new THREE.Vector3(MOON_ORBIT * 0.7, 0, -MOON_ORBIT * 0.2) // inside the Moon's orbit
  const mid = start.clone().lerp(end, 0.6).add(new THREE.Vector3(0, -START_DIST * 0.015, START_DIST * 0.02))
  const p1 = start.clone().lerp(mid, u)
  const p2 = mid.clone().lerp(end, u)
  return p1.lerp(p2, u) // quadratic bézier
}

function createEngine(canvas: HTMLCanvasElement): AnimEngine {
  const renderer = createRenderer(canvas)
  const scene = new THREE.Scene()
  addLights(scene)
  // Star shell must sit beyond the fully pulled-back camera (~9,000 units).
  addStarfield(scene, 700, 30000)

  const earth = makeEarth(EARTH_R)
  scene.add(earth)

  const moonRing = new THREE.Mesh(
    new THREE.TorusGeometry(MOON_ORBIT, 0.18, 8, 128),
    new THREE.MeshBasicMaterial({ color: PALETTE.moonRing, transparent: true, opacity: 0.7 }),
  )
  moonRing.rotation.x = Math.PI / 2
  scene.add(moonRing)
  const moon = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), new THREE.MeshStandardMaterial({ color: 0xc9c4ba, roughness: 0.9 }))
  scene.add(moon)

  // Trajectory line (revealed during pull-back) + the asteroid.
  const PATH_N = 160
  const pathGeo = new THREE.BufferGeometry()
  const pathPos = new Float32Array((PATH_N + 1) * 3)
  pathGeo.setAttribute('position', new THREE.BufferAttribute(pathPos, 3))
  for (let i = 0; i <= PATH_N; i++) {
    const p = trajectoryPoint(i / PATH_N)
    pathPos[i * 3] = p.x; pathPos[i * 3 + 1] = p.y; pathPos[i * 3 + 2] = p.z
  }
  pathGeo.attributes.position.needsUpdate = true
  const path = new THREE.Line(pathGeo, new THREE.LineBasicMaterial({ color: PALETTE.path }))
  scene.add(path)

  const rock = makeAsteroid(1)
  scene.add(rock)
  const rockGlow = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 10), new THREE.MeshBasicMaterial({ color: PALETTE.path, transparent: true, opacity: 0.3 }))
  scene.add(rockGlow)

  const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 80000)

  function render(t: number, knob: number): void {
    // ----- script state -----
    const pull = ease(phase(t, T_PULLBACK, T_FASTFWD))                 // 0 near → 1 far
    const travel = ease(phase(t, T_FASTFWD, T_ARRIVAL))                // months 0 → 9
    const arrive = ease(phase(t, T_ARRIVAL, T_END))                    // settle near Earth

    // Moon position (one lap ≈ 27 days; over 9 fast-forwarded months it laps ~10×).
    const moonAng = 1.1 + travel * MONTHS * (2 * Math.PI / 0.9)
    moon.position.set(Math.cos(moonAng) * MOON_ORBIT, 0, Math.sin(moonAng) * MOON_ORBIT)

    // Asteroid along the trajectory.
    const u = travel
    const rockPos = trajectoryPoint(u)
    rock.position.copy(rockPos)
    rockGlow.position.copy(rockPos)
    rock.rotation.y = t * 0.4
    // Path + rock only visible once the pull-back has begun to reveal scale.
    const reveal = phase(t, T_PULLBACK + 1, T_FASTFWD)
    ;(path.material as THREE.LineBasicMaterial).opacity = reveal
    ;(path.material as THREE.LineBasicMaterial).transparent = true
    rock.visible = reveal > 0.05
    rockGlow.visible = rock.visible
    // The rock is 400 m — invisible at true scale. We draw a beacon sized by
    // camera distance so it stays a visible POINT, honestly labeled in the readout.
    const camDist = 42 + pull * (START_DIST * 0.75) - arrive * (START_DIST * 0.55)
    const beacon = Math.max(0.4, camDist * 0.004)
    rock.scale.setScalar(beacon)
    rockGlow.scale.setScalar(beacon)

    // ----- camera: orbit angle is the knob; distance follows the script -----
    const az = (knob * Math.PI) / 180
    const el = 0.45 - pull * 0.12
    const target = new THREE.Vector3().lerpVectors(
      new THREE.Vector3(0, 0, 0),
      rockPos.clone().multiplyScalar(0.45),
      pull * (1 - arrive),
    )
    camera.position.set(
      target.x + camDist * Math.cos(el) * Math.cos(az),
      target.y + camDist * Math.sin(el),
      target.z + camDist * Math.cos(el) * Math.sin(az),
    )
    camera.lookAt(target)
    renderer.render(scene, camera)
  }

  return {
    render,
    readout(t: number): string {
      const travel = ease(phase(t, T_FASTFWD, T_ARRIVAL))
      const months = (travel * MONTHS).toFixed(1)
      const dist = trajectoryPoint(travel).length() * 1e4 // km
      return `t = ${months} months   ·   distance to Earth ≈ ${dist >= 1e6 ? (dist / 1e6).toFixed(2) + ' million km' : Math.round(dist).toLocaleString() + ' km'}   ·   2026-XJ is ~400 m wide (drawn as a beacon — it would be invisible at true scale)`
    },
    resize(w: number, h: number): void {
      renderer.setSize(w, h, false)
      camera.aspect = w / Math.max(1, h)
      camera.updateProjectionMatrix()
    },
    dispose(): void { disposeScene(scene, renderer) },
  }
}

export const approachGeometryDef: AnimDefinition = {
  slug: 'approach-geometry',
  title: 'The Approach of 2026-XJ — Geometry at Scale',
  duration: 36,
  posterTime: 14,
  steps: [
    { label: 'This is our neighborhood: Earth, and the ring the Moon rides — 384,000 km out.', atTime: T_NEIGHBORHOOD },
    { label: 'Pull back. Keep pulling. 2026-XJ is 120 MILLION km away — over 300 times the Moon’s distance.', atTime: T_PULLBACK },
    { label: 'Fast-forward nine months. Watch the Moon lap Earth while the asteroid closes in.', atTime: T_FASTFWD },
    { label: 'June 2027: the trajectory threads inside the Moon’s orbit. THIS is the question our year answers.', atTime: T_ARRIVAL },
  ],
  knob: { label: 'Camera orbit', min: 0, max: 360, step: 5, initial: 30, unit: '°' },
  create: createEngine,
}
