import * as THREE from 'three'
import type { SimEngine, ParamValues, SimData } from '@/components/simulations/lab/contract'

// Riverboat crossing — 3D prototype. Same vector-addition physics as the 2D
// sim (src/app/simulations/riverboat-crossing), rendered with Three.js so the
// boat visibly "crabs" across a perspective river: its hull points along the
// resultant heading while the current sweeps it downstream. A `view` toggle
// swaps between a 3D perspective camera and a flat top-down camera so students
// can compare the spatial scene with the familiar map view.
//
// Physics is mirrored EXACTLY from the 2D engine:
//   across = world X (0 → RIVER_WIDTH), downstream = world Z, up = world Y.
//   boatVx = boatSpeed·cos(angle)  (across)
//   boatVy = boatSpeed·sin(angle)  (downstream-ish, the "heading" component)
//   resultantVx = boatVx ; resultantVy = boatVy + currentSpeed
//   complete when across (boatX) >= RIVER_WIDTH.

const RIVER_WIDTH = 100
const RIVER_LENGTH = 150
const START_Y = 50
const TARGET_Y = 50
const VEC = 2.2 // world units per m/s for the vector arrows

const COL = {
  water: 0x3f7fae, waterDeep: 0x2c5f86, bank: 0x5dcaa5, bankEdge: 0x49a888,
  dockStart: 0xe0a93c, dockTarget: 0xe0a93c, hull: 0x7f77dd, hullDark: 0x4a4392, prow: 0xe7e1f4,
  boatVec: 0x1d9e75, currentVec: 0x3fa59b, resultantVec: 0x7f77dd,
}

export function createRiverboat3DEngine(
  canvas: HTMLCanvasElement,
  initial: ParamValues,
  _opts?: { invalidate: () => void },
): SimEngine {
  let boatSpeed = Number(initial.boatSpeed ?? 5)
  let boatAngle = Number(initial.boatAngle ?? 90)
  let currentSpeed = Number(initial.currentSpeed ?? 2)
  let view = String(initial.view ?? '3d')

  let boatX = 0
  let boatZ = START_Y
  let t = 0
  let running = false
  let done = false
  const pathRows: number[][] = []
  let lastRow = -1

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(1) // canvas is already sized in device px by the shell
  renderer.setClearColor(0xf6f4ff, 1)

  const scene = new THREE.Scene()
  scene.add(new THREE.AmbientLight(0xffffff, 0.85))
  const sun = new THREE.DirectionalLight(0xffffff, 0.6)
  sun.position.set(-40, 90, -30)
  scene.add(sun)

  // River bed (water plane) spanning the width and a long downstream stretch.
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(RIVER_WIDTH, RIVER_LENGTH),
    new THREE.MeshStandardMaterial({ color: COL.water, roughness: 0.6, metalness: 0.1 }),
  )
  water.rotation.x = -Math.PI / 2
  water.position.set(RIVER_WIDTH / 2, 0, RIVER_LENGTH / 2)
  scene.add(water)

  // Banks (grass) on each shore.
  const bankMat = new THREE.MeshStandardMaterial({ color: COL.bank, roughness: 0.9 })
  for (const side of [-1, 1]) {
    const bank = new THREE.Mesh(new THREE.BoxGeometry(24, 2, RIVER_LENGTH), bankMat)
    bank.position.set(side < 0 ? -12 : RIVER_WIDTH + 12, 0, RIVER_LENGTH / 2)
    scene.add(bank)
  }

  // Flow stripes — thin bright bars that drift downstream to read "current".
  const stripes: THREE.Mesh[] = []
  const stripeMat = new THREE.MeshBasicMaterial({ color: 0xbfe0f0, transparent: true, opacity: 0.5 })
  for (let i = 0; i < 8; i++) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(RIVER_WIDTH - 8, 1.4), stripeMat)
    s.rotation.x = -Math.PI / 2
    s.position.set(RIVER_WIDTH / 2, 0.05, (i / 8) * RIVER_LENGTH)
    scene.add(s); stripes.push(s)
  }

  // Start dock (near bank, x=0) and target dock (far bank, x=RIVER_WIDTH).
  const dockMat = new THREE.MeshStandardMaterial({ color: COL.dockStart, roughness: 0.7 })
  const startDock = new THREE.Mesh(new THREE.BoxGeometry(8, 1.5, 14), dockMat)
  startDock.position.set(0, 0.5, START_Y)
  scene.add(startDock)
  const targetDock = new THREE.Mesh(new THREE.BoxGeometry(8, 1.5, 14), dockMat)
  targetDock.position.set(RIVER_WIDTH, 0.8, TARGET_Y)
  scene.add(targetDock)

  // Boat: a little group (hull + prow + sail post).
  const boat = new THREE.Group()
  const hull = new THREE.Mesh(new THREE.BoxGeometry(5, 2.2, 9), new THREE.MeshStandardMaterial({ color: COL.hull, roughness: 0.5 }))
  hull.position.y = 1.2
  boat.add(hull)
  const prow = new THREE.Mesh(new THREE.ConeGeometry(2.4, 4, 4), new THREE.MeshStandardMaterial({ color: COL.prow, roughness: 0.5 }))
  prow.rotation.x = Math.PI / 2
  prow.position.set(0, 1.2, 6)
  boat.add(prow)
  scene.add(boat)

  // Velocity arrows anchored at the boat.
  const mkArrow = (color: number, headLen = 2.4, headW = 1.6) =>
    new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(), 1, color, headLen, headW)
  const aBoat = mkArrow(COL.boatVec)
  const aCurrent = mkArrow(COL.currentVec)
  const aResultant = mkArrow(COL.resultantVec, 3, 2)
  scene.add(aBoat, aCurrent, aResultant)

  // Cameras — perspective (3D) and orthographic (top-down). One is active.
  const persp = new THREE.PerspectiveCamera(50, 1, 0.1, 1000)
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, -200, 600)
  const lookCenter = new THREE.Vector3(RIVER_WIDTH / 2, 0, START_Y + 10)

  function placeCameras(w: number, h: number) {
    const aspect = w / Math.max(1, h)
    persp.aspect = aspect
    persp.position.set(-30, 78, START_Y - 55)
    persp.lookAt(lookCenter)
    persp.updateProjectionMatrix()
    // ortho frames the river width (+margin) and matches aspect downstream.
    const halfW = (RIVER_WIDTH + 30) / 2
    const halfH = halfW / aspect
    ortho.left = -halfW; ortho.right = halfW; ortho.top = halfH; ortho.bottom = -halfH
    ortho.position.set(RIVER_WIDTH / 2, 120, START_Y + 10)
    ortho.up.set(0, 0, 1)
    ortho.lookAt(RIVER_WIDTH / 2, 0, START_Y + 10)
    ortho.updateProjectionMatrix()
  }

  const cam = () => (view === 'top' ? ortho : persp)

  const components = () => {
    const a = (boatAngle * Math.PI) / 180
    const boatVx = boatSpeed * Math.cos(a)
    const boatVy = boatSpeed * Math.sin(a)
    return { boatVx, boatVy, resultantVx: boatVx, resultantVy: boatVy + currentSpeed }
  }

  function updateArrows() {
    const { boatVx, boatVy, resultantVx, resultantVy } = components()
    const origin = new THREE.Vector3(boatX, 2.2, boatZ)
    const set = (arr: THREE.ArrowHelper, vx: number, vz: number) => {
      const len = Math.hypot(vx, vz) * VEC
      arr.position.copy(origin)
      if (len < 0.01) { arr.visible = false; return }
      arr.visible = true
      arr.setDirection(new THREE.Vector3(vx, 0, vz).normalize())
      arr.setLength(len, Math.min(3, len * 0.35), Math.min(2, len * 0.22))
    }
    set(aBoat, boatVx, boatVy)
    set(aCurrent, 0, currentSpeed)
    set(aResultant, resultantVx, resultantVy)
  }

  function updateBoat() {
    boat.position.set(boatX, 0, boatZ)
    const { resultantVx, resultantVy } = components()
    if (Math.hypot(resultantVx, resultantVy) > 0.01) {
      boat.rotation.y = Math.atan2(resultantVx, resultantVy)
    }
  }

  let lastW = 0, lastH = 0
  function ensureSize() {
    const w = canvas.width, h = canvas.height
    if (w === lastW && h === lastH) return
    lastW = w; lastH = h
    renderer.setSize(w, h, false)
    placeCameras(w, h)
  }

  function render() {
    ensureSize()
    // drift the flow stripes downstream
    for (const s of stripes) {
      s.position.z = (s.position.z + currentSpeed * 0.05) % RIVER_LENGTH
    }
    updateBoat()
    updateArrows()
    renderer.render(scene, cam())
  }

  const engine: SimEngine = {
    render,
    step(dt: number) {
      if (!running || done) return
      t += dt
      const { resultantVx, resultantVy } = components()
      boatX += resultantVx * dt
      boatZ += resultantVy * dt
      const sec = Math.floor(t)
      if (sec > lastRow) { pathRows.push([sec, Math.round(boatX * 10) / 10, Math.round((boatZ - START_Y) * 10) / 10]); lastRow = sec }
      if (boatX >= RIVER_WIDTH) { boatX = RIVER_WIDTH; done = true; running = false }
    },
    setParams(values: ParamValues) {
      boatSpeed = Number(values.boatSpeed ?? boatSpeed)
      boatAngle = Number(values.boatAngle ?? boatAngle)
      currentSpeed = Number(values.currentSpeed ?? currentSpeed)
      if (values.view !== undefined) view = String(values.view)
    },
    start(values: ParamValues) {
      this.setParams(values)
      running = true; done = false
    },
    reset() {
      boatX = 0; boatZ = START_Y; t = 0; running = false; done = false
      pathRows.length = 0; lastRow = -1
    },
    getReadouts() {
      const { resultantVx, resultantVy } = components()
      const resultantSpeed = Math.hypot(resultantVx, resultantVy)
      const resultantAngle = (Math.atan2(resultantVy, resultantVx) * 180) / Math.PI
      return {
        time: t,
        across: Math.round(boatX * 10) / 10,
        drift: Math.round((boatZ - TARGET_Y) * 10) / 10,
        resultantSpeed: Math.round(resultantSpeed * 10) / 10,
        resultantAngle: Math.round(resultantAngle * 10) / 10,
      }
    },
    getData(): SimData {
      return { columns: ['Time (s)', 'Across (m)', 'Drift (m)'], rows: pathRows, xCol: 1, yCol: 2 }
    },
    isComplete() { return done },
    destroy() {
      renderer.dispose()
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        if (m.geometry) m.geometry.dispose()
        const mat = (m as THREE.Mesh).material
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
        else if (mat) (mat as THREE.Material).dispose()
      })
    },
  }
  return engine
}
