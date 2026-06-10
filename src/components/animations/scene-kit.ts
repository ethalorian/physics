/**
 * scene-kit — tiny shared helpers for the instructional animations.
 * Keeps each engine focused on its script, and keeps the visual language
 * consistent (palette, starfield, Earth, arrows) across all five.
 */

import * as THREE from 'three'

export const PALETTE = {
  bg: 0x0b0e1d,            // deep space — these are space scenes; lessons stay light
  star: 0xbfc6e0,
  earth: 0x4f8fd0,
  earthGlow: 0x7fb3e8,
  moonRing: 0x6f7aa8,
  asteroid: 0x9a8f7f,
  asteroidDark: 0x6e6557,
  path: 0xe0a93c,          // gold — matches the app's reward accent family
  vecMain: 0x7f77dd,       // lavender — primary vector
  vecA: 0x1d9e75,          // sage — component / first vector
  vecB: 0x3fa59b,          // teal — second component
  cone: 0xd06a6a,          // warning red for the uncertainty cone
  thrust: 0xe8845a,
  grid: 0x2a3052,
}

export function createRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
  renderer.setPixelRatio(1) // canvas is pre-sized in device px by AnimationStage
  renderer.setClearColor(PALETTE.bg, 1)
  return renderer
}

export function addLights(scene: THREE.Scene): void {
  scene.add(new THREE.AmbientLight(0xffffff, 0.55))
  const sun = new THREE.DirectionalLight(0xffffff, 1.1)
  sun.position.set(-60, 40, 80)
  scene.add(sun)
}

/** A deterministic starfield (seeded LCG, so every student sees the same sky). */
export function addStarfield(scene: THREE.Scene, count = 700, radius = 900): THREE.Points {
  let seed = 42
  const rand = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296 }
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    // uniform on a sphere shell
    const u = rand() * 2 - 1
    const phi = rand() * Math.PI * 2
    const r = radius * (0.55 + 0.45 * rand())
    const s = Math.sqrt(1 - u * u)
    positions[i * 3] = r * s * Math.cos(phi)
    positions[i * 3 + 1] = r * u
    positions[i * 3 + 2] = r * s * Math.sin(phi)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: PALETTE.star, size: 1.6, sizeAttenuation: false }))
  scene.add(pts)
  return pts
}

export function makeEarth(radius: number): THREE.Group {
  const g = new THREE.Group()
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 24),
    new THREE.MeshStandardMaterial({ color: PALETTE.earth, roughness: 0.7, metalness: 0.05 }),
  )
  g.add(body)
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.18, 24, 18),
    new THREE.MeshBasicMaterial({ color: PALETTE.earthGlow, transparent: true, opacity: 0.18 }),
  )
  g.add(glow)
  return g
}

/** A lumpy rock: a sphere with vertices pushed in/out deterministically. */
export function makeAsteroid(radius: number, seed = 7): THREE.Mesh {
  const geo = new THREE.SphereGeometry(radius, 18, 14)
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  let s = seed
  const rand = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296 }
  const bumps: number[] = []
  for (let i = 0; i < pos.count; i++) bumps.push(0.82 + rand() * 0.36)
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize().multiplyScalar(radius * bumps[i])
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  geo.computeVertexNormals()
  return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: PALETTE.asteroid, roughness: 0.95, flatShading: true }))
}

export function makeArrow(color: number, headLen = 2.0, headW = 1.2): THREE.ArrowHelper {
  return new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(), 1, color, headLen, headW)
}

/** Set an arrow from a start point along a vector (hides near-zero arrows). */
export function setArrow(a: THREE.ArrowHelper, from: THREE.Vector3, vec: THREE.Vector3): void {
  const len = vec.length()
  if (len < 1e-4) { a.visible = false; return }
  a.visible = true
  a.position.copy(from)
  a.setDirection(vec.clone().normalize())
  a.setLength(len, Math.min(len * 0.3, 2.4), Math.min(len * 0.18, 1.4))
}

/** Map t into [t0,t1] → 0..1, clamped. The basic script-phase helper. */
export function phase(t: number, t0: number, t1: number): number {
  if (t1 <= t0) return t >= t1 ? 1 : 0
  return Math.min(1, Math.max(0, (t - t0) / (t1 - t0)))
}

/** Smooth ease for camera moves and reveals. */
export function ease(x: number): number {
  return x * x * (3 - 2 * x)
}

export function disposeScene(scene: THREE.Scene, renderer: THREE.WebGLRenderer): void {
  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (mesh.geometry) mesh.geometry.dispose()
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
    else if (mat) mat.dispose()
  })
  renderer.dispose()
}
