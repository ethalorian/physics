/**
 * A3 · prediction-cone — Day 5 (reused Day 21).
 * displacement = velocity × time fast-forwards 2026-XJ six months to a single
 * predicted point — then measurement uncertainty turns that point into a CONE
 * of possible positions that may or may not contain Earth.
 * KNOB: velocity uncertainty (±%). Cone width responds live.
 */

import * as THREE from 'three'
import type { AnimDefinition, AnimEngine } from '../contract'
import { PALETTE, createRenderer, addLights, addStarfield, makeEarth, makeAsteroid, makeArrow, setArrow, phase, ease, disposeScene } from '../scene-kit'

// Compressed didactic scale: 1 unit = 1 million km (this scene is about the
// SHAPE of the prediction, not the neighborhood scale A1 already taught).
const START = new THREE.Vector3(-90, 6, 18)   // ~120 million km out, angled
const EARTH_POS = new THREE.Vector3(0, 0, 0)
const TRAVEL_FRAC = 0.92                      // 6 months brings it MOST of the way in this scene
const EARTH_R = 2                             // exaggerated so "hit or miss" is readable; readout stays honest

const T_NOW = 0, T_FFWD = 6, T_UNCERT = 14, T_CONE = 20, T_QUESTION = 27, T_END = 32

function createEngine(canvas: HTMLCanvasElement): AnimEngine {
  const renderer = createRenderer(canvas)
  const scene = new THREE.Scene()
  addLights(scene)
  addStarfield(scene, 600)

  const earth = makeEarth(EARTH_R)
  earth.position.copy(EARTH_POS)
  scene.add(earth)

  const rock = makeAsteroid(1.1)
  rock.position.copy(START)
  scene.add(rock)

  // Ghost = the predicted future asteroid.
  const ghost = makeAsteroid(1.1, 11)
  ;(ghost.material as THREE.MeshStandardMaterial).transparent = true
  ;(ghost.material as THREE.MeshStandardMaterial).opacity = 0.45
  scene.add(ghost)

  const vArrow = makeArrow(PALETTE.vecMain)
  scene.add(vArrow)

  // Predicted path.
  const pathGeo = new THREE.BufferGeometry()
  const path = new THREE.Line(pathGeo, new THREE.LineBasicMaterial({ color: PALETTE.path, transparent: true, opacity: 0.9 }))
  scene.add(path)

  // The uncertainty cone: apex at the CURRENT position, opening toward the prediction.
  const coneMat = new THREE.MeshBasicMaterial({ color: PALETTE.cone, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })
  let cone: THREE.Mesh | null = null
  const coneRim = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.06, 8, 64),
    new THREE.MeshBasicMaterial({ color: PALETTE.cone, transparent: true, opacity: 0.8 }),
  )
  scene.add(coneRim)

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000)

  const predicted = START.clone().lerp(EARTH_POS, TRAVEL_FRAC)
  const dirToPred = predicted.clone().sub(START)
  const travelLen = dirToPred.length()

  function render(t: number, knob: number): void {
    const pF = ease(phase(t, T_FFWD, T_UNCERT - 1))     // fast-forward 0→1
    const pC = ease(phase(t, T_CONE, T_CONE + 4))       // cone growth 0→1
    const wobble = phase(t, T_UNCERT, T_CONE)           // velocity-arrow wobble during "uncertainty" beat

    rock.rotation.y = t * 0.35

    // Velocity arrow at the current rock, wobbling ±knob% in direction during the uncertainty beat.
    const wob = wobble > 0 && wobble < 1 ? Math.sin(t * 6) * (knob / 100) * 0.5 : 0
    const vDir = dirToPred.clone().normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), wob)
    setArrow(vArrow, START, vDir.multiplyScalar(14))

    // Ghost travels to the predicted point during fast-forward.
    const ghostPos = START.clone().lerp(predicted, pF)
    ghost.position.copy(ghostPos)
    ghost.visible = pF > 0.01
    path.geometry.setFromPoints([START, ghostPos])

    // Cone: half-angle from ±knob% velocity uncertainty (didactic mapping).
    const halfAngle = Math.atan((knob / 100) * 1.2)
    const coneLen = travelLen * pC
    const coneR = Math.tan(halfAngle) * travelLen
    if (cone) { cone.geometry.dispose(); scene.remove(cone); cone = null }
    if (pC > 0.02 && coneR > 0.01) {
      const geo = new THREE.ConeGeometry(coneR * pC, coneLen, 48, 1, true)
      cone = new THREE.Mesh(geo, coneMat)
      // Cone's axis: from apex (START) toward predicted. ConeGeometry points -y→+y with center mid-height.
      const axis = predicted.clone().sub(START).normalize()
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), axis)
      cone.position.copy(START.clone().add(axis.clone().multiplyScalar(coneLen / 2)))
      scene.add(cone)
    }
    coneRim.visible = pC > 0.6
    if (coneRim.visible) {
      const axis = predicted.clone().sub(START).normalize()
      coneRim.geometry.dispose()
      coneRim.geometry = new THREE.TorusGeometry(Math.max(0.05, coneR * pC), 0.08, 8, 64)
      coneRim.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), axis)
      coneRim.position.copy(START.clone().add(axis.clone().multiplyScalar(coneLen)))
    }

    // Camera: drifts from a wide three-quarter view to looking down the cone axis
    // at the end — the "does it contain Earth?" shot.
    const pQ = ease(phase(t, T_QUESTION, T_END))
    const wide = new THREE.Vector3(-30, 38, 95)
    const down = START.clone().add(new THREE.Vector3(0, 10, 0)).multiplyScalar(1.15)
    camera.position.lerpVectors(wide, down, pQ)
    camera.lookAt(pQ > 0.5 ? EARTH_POS : predicted.clone().multiplyScalar(0.5))
    renderer.render(scene, camera)
  }

  return {
    render,
    readout(t: number, knob: number): string {
      // Honest numbers: 6 months at ~8.5 km/s ≈ 1.3×10⁸ km traveled; cone radius
      // at Earth range grows with uncertainty.
      const radiusKm = Math.round(1.32e8 * (knob / 100) * 1.2)
      return `±${knob}% velocity uncertainty   →   possible-position circle at Earth range: ≈ ${radiusKm.toLocaleString()} km across   ·   Earth is 12,742 km wide`
    },
    resize(w: number, h: number): void {
      renderer.setSize(w, h, false)
      camera.aspect = w / Math.max(1, h)
      camera.updateProjectionMatrix()
    },
    dispose(): void {
      if (cone) { cone.geometry.dispose(); scene.remove(cone) }
      disposeScene(scene, renderer)
    },
  }
}

export const predictionConeDef: AnimDefinition = {
  slug: 'prediction-cone',
  title: 'Prediction + Uncertainty = a Cone',
  duration: T_END,
  posterTime: 24,
  steps: [
    { label: 'Now: we know 2026-XJ’s position and velocity… as well as our instruments can measure them.', atTime: T_NOW },
    { label: 'displacement = velocity × time. Fast-forward six months: ONE predicted point.', atTime: T_FFWD },
    { label: 'But the measured velocity isn’t exact. Watch the arrow — every direction inside the wobble is possible.', atTime: T_UNCERT },
    { label: 'Run EVERY possible velocity forward and the point becomes a cone of possible positions.', atTime: T_CONE },
    { label: 'The only question that matters: is Earth inside the cone? Turn the knob. Watch the readout.', atTime: T_QUESTION },
  ],
  knob: { label: 'Velocity uncertainty', min: 0, max: 10, step: 0.5, initial: 3, unit: '%', display: (v) => `±${v}%` },
  create: createEngine,
}
