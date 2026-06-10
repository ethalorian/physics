/**
 * A2 · velocity-vector-3d — Day 4.
 * One velocity arrow (8,500 m/s at θ to the Earth-line) splits into a
 * toward-Earth component and a sideways component, then the parts rebuild the
 * whole tip-to-tail. The camera orbits slowly the entire time so students see
 * that the components are OBJECTS in space, not pen marks on one drawing.
 * KNOB: approach angle θ (0–45°).
 */

import * as THREE from 'three'
import type { AnimDefinition, AnimEngine } from '../contract'
import { PALETTE, createRenderer, addLights, addStarfield, makeAsteroid, makeArrow, setArrow, phase, ease, disposeScene } from '../scene-kit'

const SPEED = 8500            // m/s
const VEC = 1 / 500           // world units per m/s → main arrow 17 units long

const T_WHOLE = 0, T_TOWARD = 6, T_SIDE = 12, T_REBUILD = 18, T_END = 24

function createEngine(canvas: HTMLCanvasElement): AnimEngine {
  const renderer = createRenderer(canvas)
  const scene = new THREE.Scene()
  addLights(scene)
  addStarfield(scene, 500)

  const rock = makeAsteroid(1.5)
  scene.add(rock)

  // The Earth-line: a long dashed axis pointing toward a distant Earth glow.
  const earthDir = new THREE.Vector3(1, 0, 0)
  const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), earthDir.clone().multiplyScalar(60)])
  const earthLine = new THREE.Line(lineGeo, new THREE.LineDashedMaterial({ color: PALETTE.earthGlow, dashSize: 1.2, gapSize: 0.8, transparent: true, opacity: 0.65 }))
  earthLine.computeLineDistances()
  scene.add(earthLine)
  const earthGlow = new THREE.Mesh(new THREE.SphereGeometry(2.2, 16, 12), new THREE.MeshBasicMaterial({ color: PALETTE.earth, transparent: true, opacity: 0.8 }))
  earthGlow.position.copy(earthDir.clone().multiplyScalar(58))
  scene.add(earthGlow)

  const aWhole = makeArrow(PALETTE.vecMain)
  const aToward = makeArrow(PALETTE.vecA)
  const aSide = makeArrow(PALETTE.vecB)
  scene.add(aWhole, aToward, aSide)

  // Faint right-angle guides from the arrow tip down to each component tip.
  const guideMat = new THREE.LineBasicMaterial({ color: 0x55608a, transparent: true, opacity: 0.5 })
  const guide1 = new THREE.Line(new THREE.BufferGeometry(), guideMat)
  const guide2 = new THREE.Line(new THREE.BufferGeometry(), guideMat)
  scene.add(guide1, guide2)

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000)
  const origin = new THREE.Vector3(0, 0, 0)

  function vectors(knob: number) {
    const th = (knob * Math.PI) / 180
    // Velocity points toward Earth (+x) with a sideways part (+z).
    const v = new THREE.Vector3(Math.cos(th), 0, Math.sin(th)).multiplyScalar(SPEED * VEC)
    const toward = new THREE.Vector3(v.x, 0, 0)
    const side = new THREE.Vector3(0, 0, v.z)
    return { v, toward, side }
  }

  function render(t: number, knob: number): void {
    const { v, toward, side } = vectors(knob)
    rock.rotation.y = t * 0.3

    const pToward = ease(phase(t, T_TOWARD, T_TOWARD + 3))
    const pSide = ease(phase(t, T_SIDE, T_SIDE + 3))
    const pRebuild = ease(phase(t, T_REBUILD, T_REBUILD + 4))

    // Whole vector always anchored at the rock.
    setArrow(aWhole, origin, v)

    // Components grow out along their axes…
    const towardVec = toward.clone().multiplyScalar(pToward)
    setArrow(aToward, origin, towardVec)
    if (pToward < 0.02) aToward.visible = false

    // …then the sideways component LIFTS to ride tip-to-tail on the toward-part.
    const sideFrom = origin.clone().lerp(toward, pRebuild)
    const sideVec = side.clone().multiplyScalar(pSide)
    setArrow(aSide, sideFrom, sideVec)
    if (pSide < 0.02) aSide.visible = false

    // Right-angle guides (dashed feel via opacity) from v's tip to component tips.
    const tip = v.clone()
    guide1.visible = pToward > 0.95 && pRebuild < 0.05
    guide2.visible = pSide > 0.95 && pRebuild < 0.05
    if (guide1.visible) guide1.geometry.setFromPoints([tip, toward])
    if (guide2.visible) guide2.geometry.setFromPoints([tip, side])

    // Camera: slow continuous orbit — the whole point is multiple viewpoints.
    const az = 0.9 + t * 0.12
    const el = 0.35 + 0.1 * Math.sin(t * 0.2)
    const dist = 30
    const target = v.clone().multiplyScalar(0.4)
    camera.position.set(
      target.x + dist * Math.cos(el) * Math.cos(az),
      target.y + dist * Math.sin(el),
      target.z + dist * Math.cos(el) * Math.sin(az),
    )
    camera.lookAt(target)
    renderer.render(scene, camera)
  }

  return {
    render,
    readout(t: number, knob: number): string {
      const th = (knob * Math.PI) / 180
      const toward = Math.round(SPEED * Math.cos(th))
      const side = Math.round(SPEED * Math.sin(th))
      return `|v| = 8,500 m/s at ${knob}°   →   toward Earth: ${toward.toLocaleString()} m/s   ·   sideways: ${side.toLocaleString()} m/s`
    },
    resize(w: number, h: number): void {
      renderer.setSize(w, h, false)
      camera.aspect = w / Math.max(1, h)
      camera.updateProjectionMatrix()
    },
    dispose(): void { disposeScene(scene, renderer) },
  }
}

export const velocityVector3DDef: AnimDefinition = {
  slug: 'velocity-vector-3d',
  title: 'One Velocity, Two Components',
  duration: T_END,
  posterTime: 16,
  steps: [
    { label: 'One arrow: 2026-XJ moves at 8,500 m/s, angled off the Earth-line. Watch it from all sides.', atTime: T_WHOLE },
    { label: 'The toward-Earth part: how much of that speed is actually closing the distance?', atTime: T_TOWARD },
    { label: 'The sideways part: the rest of the speed slides PAST Earth, not toward it.', atTime: T_SIDE },
    { label: 'Tip-to-tail: the two parts rebuild the original exactly. Components ARE the vector.', atTime: T_REBUILD },
  ],
  knob: { label: 'Approach angle', min: 0, max: 45, step: 1, initial: 15, unit: '°' },
  create: createEngine,
}
