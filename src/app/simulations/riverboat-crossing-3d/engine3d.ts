import * as THREE from 'three'
import type { SimEngine, ParamValues, SimData } from '@/components/simulations/lab/contract'

// Riverboat crossing — 3D. REBUILT 2026-06-10.
//
// Physics mirrors the 2D engine EXACTLY (it previously didn't — cos/sin were
// swapped, so the default 90° heading had zero across-velocity):
//   across (world X) : boatVx = boatSpeed · sin(angle)      (sin 90° = 1 → straight across)
//   downstream (Z)   : boatVz = −boatSpeed · cos(angle)     (<90° aims upstream)
//   ground velocity  : (boatVx, boatVz + currentSpeed)
//   complete when boatX ≥ RIVER_WIDTH.
//
// THE LESSON IS THE CRAB. The hull points along the HEADING (where the motor
// pushes); the boat MOVES along the resultant (gold trail). The dashed line off
// the bow shows where the nose points; the trail shows where you actually went.
// The gap between them is vector addition, visible.
//
// Visual contract:
//   - labeled, color-coded arrows (boat = sage, current = teal, resultant = lavender)
//   - chase camera in 3D view (the boat can never wander out of frame)
//   - dt-based water motion (stripes pause when physics pauses — honest)
//   - wake puffs at the stern along the heading axis, then swept by the current

const RIVER_WIDTH = 100
const RIVER_LENGTH = 240
const START_Z = 70           // boat starts here; target dock directly across
const TARGET_Z = 70
const VEC = 2.2              // world units per m/s for arrows

const COL = {
  water: 0x3f7fae, bank: 0x5dcaa5, bankSide: 0x49a888, dock: 0xe0a93c,
  hull: 0xf2efe9, hullTrim: 0x7f77dd, cabin: 0xffffff, stack: 0x4a4392,
  boatVec: 0x1d9e75, currentVec: 0x3fa59b, resultantVec: 0x7f77dd,
  trail: 0xe0a93c, headingGhost: 0xffffff, wake: 0xeaf4fa,
  tree: 0x3f8f6a, treeTrunk: 0x8a6f4d, drift: 0xd06a6a,
}

// --- tiny helpers -----------------------------------------------------------

function textSprite(text: string, color: string): THREE.Sprite {
  const cv = document.createElement('canvas')
  cv.width = 256; cv.height = 80
  const ctx = cv.getContext('2d')!
  ctx.font = '600 44px system-ui, sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(11,14,29,0.85)'
  ctx.strokeText(text, 128, 40)
  ctx.fillStyle = color
  ctx.fillText(text, 128, 40)
  const tex = new THREE.CanvasTexture(cv)
  tex.anisotropy = 2
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }))
  sp.scale.set(10, 3.1, 1)
  return sp
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
  let boatZ = START_Z
  let t = 0
  let running = false
  let done = false
  const pathRows: number[][] = []
  let lastRow = -1

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(1)
  renderer.setClearColor(0xf6f4ff, 1)

  const scene = new THREE.Scene()
  scene.add(new THREE.AmbientLight(0xffffff, 0.8))
  const sun = new THREE.DirectionalLight(0xffffff, 0.75)
  sun.position.set(-50, 100, -40)
  scene.add(sun)

  // --- river & shores ---------------------------------------------------------
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(RIVER_WIDTH, RIVER_LENGTH),
    new THREE.MeshStandardMaterial({ color: COL.water, roughness: 0.55, metalness: 0.12 }),
  )
  water.rotation.x = -Math.PI / 2
  water.position.set(RIVER_WIDTH / 2, 0, RIVER_LENGTH / 2)
  scene.add(water)

  const bankMat = new THREE.MeshStandardMaterial({ color: COL.bank, roughness: 0.95 })
  const bankSideMat = new THREE.MeshStandardMaterial({ color: COL.bankSide, roughness: 0.95 })
  for (const side of [-1, 1]) {
    const bank = new THREE.Mesh(new THREE.BoxGeometry(30, 3, RIVER_LENGTH), bankMat)
    bank.position.set(side < 0 ? -15 : RIVER_WIDTH + 15, 0.4, RIVER_LENGTH / 2)
    scene.add(bank)
    const lip = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.4, RIVER_LENGTH), bankSideMat)
    lip.position.set(side < 0 ? 0 : RIVER_WIDTH, 0.2, RIVER_LENGTH / 2)
    scene.add(lip)
  }
  // a few trees so the shores read as land, not abstract slabs
  const treeTop = new THREE.MeshStandardMaterial({ color: COL.tree, roughness: 0.9 })
  const treeTrunk = new THREE.MeshStandardMaterial({ color: COL.treeTrunk, roughness: 0.9 })
  const treeSpots: [number, number][] = [[-12, 28], [-19, 96], [-9, 150], [-16, 205], [RIVER_WIDTH + 11, 40], [RIVER_WIDTH + 18, 120], [RIVER_WIDTH + 10, 185]]
  for (const [tx, tz] of treeSpots) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 4, 6), treeTrunk)
    trunk.position.set(tx, 3.5, tz)
    scene.add(trunk)
    const top = new THREE.Mesh(new THREE.ConeGeometry(3.6, 8, 7), treeTop)
    top.position.set(tx, 9.5, tz)
    scene.add(top)
  }

  // docks: start (near bank) and target (far bank, straight across)
  const dockMat = new THREE.MeshStandardMaterial({ color: COL.dock, roughness: 0.7 })
  const startDock = new THREE.Mesh(new THREE.BoxGeometry(10, 1.6, 14), dockMat)
  startDock.position.set(-1, 1.2, START_Z)
  scene.add(startDock)
  const targetDock = new THREE.Mesh(new THREE.BoxGeometry(10, 1.6, 14), dockMat)
  targetDock.position.set(RIVER_WIDTH + 1, 1.2, TARGET_Z)
  scene.add(targetDock)
  // target flag
  const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 9, 6), new THREE.MeshStandardMaterial({ color: 0xd8d4ec }))
  flagPole.position.set(RIVER_WIDTH + 1, 6, TARGET_Z)
  scene.add(flagPole)
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 2.6), new THREE.MeshBasicMaterial({ color: COL.dock, side: THREE.DoubleSide }))
  flag.position.set(RIVER_WIDTH + 3.4, 9.2, TARGET_Z)
  scene.add(flag)

  // flow stripes — moved in step(dt), so the river pauses when physics pauses
  const stripes: THREE.Mesh[] = []
  const stripeMat = new THREE.MeshBasicMaterial({ color: 0xbfe0f0, transparent: true, opacity: 0.45 })
  for (let i = 0; i < 12; i++) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(RIVER_WIDTH - 10, 1.2), stripeMat)
    s.rotation.x = -Math.PI / 2
    s.position.set(RIVER_WIDTH / 2, 0.06, (i / 12) * RIVER_LENGTH)
    scene.add(s); stripes.push(s)
  }

  // --- the boat (hull points along the HEADING — that's the whole lesson) ----
  const boat = new THREE.Group()
  const hull = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.8, 10), new THREE.MeshStandardMaterial({ color: COL.hull, roughness: 0.5 }))
  hull.position.y = 1.1
  boat.add(hull)
  const trim = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.5, 10.2), new THREE.MeshStandardMaterial({ color: COL.hullTrim, roughness: 0.5 }))
  trim.position.y = 0.5
  boat.add(trim)
  const bow = new THREE.Mesh(new THREE.ConeGeometry(2.3, 4.4, 4), new THREE.MeshStandardMaterial({ color: COL.hull, roughness: 0.5 }))
  bow.rotation.x = Math.PI / 2
  bow.rotation.y = Math.PI / 4
  bow.position.set(0, 1.1, 7.1)
  boat.add(bow)
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 4), new THREE.MeshStandardMaterial({ color: COL.cabin, roughness: 0.4 }))
  cabin.position.set(0, 3, -0.5)
  boat.add(cabin)
  const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 2.6, 8), new THREE.MeshStandardMaterial({ color: COL.stack, roughness: 0.5 }))
  stack.position.set(0, 5, -2)
  boat.add(stack)
  scene.add(boat)

  // wake puffs: spawned at the stern, swept downstream by the current, fading
  interface Puff { mesh: THREE.Mesh; age: number }
  const puffs: Puff[] = []
  const puffGeo = new THREE.CircleGeometry(0.9, 10)
  let puffTimer = 0

  // gold trail = the path actually traveled (the resultant, made visible)
  const TRAIL_MAX = 900
  const trailPos = new Float32Array(TRAIL_MAX * 3)
  const trailGeo = new THREE.BufferGeometry()
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3))
  trailGeo.setDrawRange(0, 0)
  const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: COL.trail, linewidth: 2 }))
  trail.position.y = 0.25
  scene.add(trail)
  let trailCount = 0
  let trailTimer = 0

  // white dashed ghost off the bow = where the NOSE points (the heading)
  const ghostGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, 1)])
  const ghost = new THREE.Line(ghostGeo, new THREE.LineDashedMaterial({ color: COL.headingGhost, dashSize: 2, gapSize: 1.6, transparent: true, opacity: 0.85 }))
  ghost.position.y = 1.6
  scene.add(ghost)

  // drift indicator on the far bank: target dock → actual landing point
  const driftGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, 1)])
  const driftLine = new THREE.Line(driftGeo, new THREE.LineBasicMaterial({ color: COL.drift }))
  driftLine.position.y = 1.8
  driftLine.visible = false
  scene.add(driftLine)

  // labeled velocity arrows
  const mkArrow = (color: number) => new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(), 1, color, 2.6, 1.7)
  const aBoat = mkArrow(COL.boatVec)
  const aCurrent = mkArrow(COL.currentVec)
  const aResultant = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(), 1, COL.resultantVec, 3.2, 2.1)
  scene.add(aBoat, aCurrent, aResultant)
  const lBoat = textSprite('boat', '#1d9e75')
  const lCurrent = textSprite('current', '#3fa59b')
  const lResultant = textSprite('actual path', '#9a91f0')
  scene.add(lBoat, lCurrent, lResultant)

  // --- cameras ----------------------------------------------------------------
  const persp = new THREE.PerspectiveCamera(50, 1, 0.1, 1200)
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, -200, 600)
  const chasePos = new THREE.Vector3(-34, 40, START_Z - 46)
  const chaseLook = new THREE.Vector3(RIVER_WIDTH * 0.35, 0, START_Z)
  let lastRenderMs = 0

  function placeCameras(w: number, h: number) {
    const aspect = w / Math.max(1, h)
    persp.aspect = aspect
    persp.updateProjectionMatrix()
    const halfW = (RIVER_WIDTH + 36) / 2
    const halfH = halfW / aspect
    ortho.left = -halfW; ortho.right = halfW; ortho.top = halfH; ortho.bottom = -halfH
    ortho.up.set(0, 0, 1)
    ortho.updateProjectionMatrix()
  }

  // --- physics (EXACTLY the 2D engine's) ---------------------------------------
  const components = () => {
    const a = (boatAngle * Math.PI) / 180
    const boatVx = boatSpeed * Math.sin(a)        // across — sin(90°) = 1
    const boatVz = -boatSpeed * Math.cos(a)       // <90° aims upstream (−z)
    return { boatVx, boatVz, resVx: boatVx, resVz: boatVz + currentSpeed }
  }

  function updateScene() {
    const { boatVx, boatVz, resVx, resVz } = components()

    boat.position.set(boatX, 0, boatZ)
    // THE CRAB: hull along the HEADING (motor direction), NOT the path.
    boat.rotation.y = Math.atan2(boatVx, boatVz)

    // arrows from the masthead
    const origin = new THREE.Vector3(boatX, 2.4, boatZ)
    const setArr = (arr: THREE.ArrowHelper, vx: number, vz: number, label: THREE.Sprite) => {
      const len = Math.hypot(vx, vz) * VEC
      if (len < 0.05) { arr.visible = false; label.visible = false; return }
      arr.visible = true; label.visible = true
      arr.position.copy(origin)
      const dir = new THREE.Vector3(vx, 0, vz).normalize()
      arr.setDirection(dir)
      arr.setLength(len, Math.min(3.4, len * 0.32), Math.min(2.2, len * 0.2))
      label.position.copy(origin).add(dir.multiplyScalar(len + 4)).add(new THREE.Vector3(0, 2.2, 0))
    }
    setArr(aBoat, boatVx, boatVz, lBoat)
    setArr(aCurrent, 0, currentSpeed, lCurrent)
    setArr(aResultant, resVx, resVz, lResultant)

    // heading ghost off the bow
    const hLen = 22
    const hd = new THREE.Vector3(boatVx, 0, boatVz).normalize().multiplyScalar(hLen)
    ghost.geometry.setFromPoints([new THREE.Vector3(boatX, 0, boatZ), new THREE.Vector3(boatX + hd.x, 0, boatZ + hd.z)])
    ghost.computeLineDistances()
    ghost.visible = boatSpeed > 0.01

    // drift indicator once landed
    driftLine.visible = done
    if (done) {
      driftLine.geometry.setFromPoints([
        new THREE.Vector3(RIVER_WIDTH - 0.5, 0, TARGET_Z),
        new THREE.Vector3(RIVER_WIDTH - 0.5, 0, boatZ),
      ])
    }
  }

  function render() {
    const w = canvas.width, h = canvas.height
    renderer.setSize(w, h, false)
    placeCameras(w, h)

    updateScene()

    // chase camera (3D): exponential smoothing, time-based so frame rate doesn't matter
    const now = performance.now()
    const dtMs = lastRenderMs ? Math.min(100, now - lastRenderMs) : 16
    lastRenderMs = now
    const alpha = 1 - Math.exp(-dtMs / 280)
    const wantPos = new THREE.Vector3(boatX - 34, 40, boatZ - 46)
    const wantLook = new THREE.Vector3(Math.min(boatX + 26, RIVER_WIDTH), 0, boatZ + 6)
    chasePos.lerp(wantPos, alpha)
    chaseLook.lerp(wantLook, alpha)
    persp.position.copy(chasePos)
    persp.lookAt(chaseLook)

    // top-down: static across, follows the boat downstream only when it strays
    const oz = Math.max(START_Z - 30, Math.min(boatZ, RIVER_LENGTH - 40))
    ortho.position.set(RIVER_WIDTH / 2, 140, oz + 10)
    ortho.lookAt(RIVER_WIDTH / 2, 0, oz + 10)

    renderer.render(scene, view === 'top' ? ortho : persp)
  }

  const engine: SimEngine = {
    render,
    step(dt: number) {
      // river flows only when physics runs — stripes are dt-based, not cosmetic
      if (running && !done) {
        for (const s of stripes) s.position.z = (s.position.z + currentSpeed * dt * 2.2 + RIVER_LENGTH) % RIVER_LENGTH
      }
      if (!running || done) return
      t += dt
      const { resVx, resVz, boatVx, boatVz } = components()
      boatX += resVx * dt
      boatZ = Math.min(RIVER_LENGTH - 6, Math.max(6, boatZ + resVz * dt))

      // gold trail point every 0.15 s
      trailTimer += dt
      if (trailTimer >= 0.15 && trailCount < TRAIL_MAX) {
        trailTimer = 0
        trailPos[trailCount * 3] = boatX
        trailPos[trailCount * 3 + 1] = 0
        trailPos[trailCount * 3 + 2] = boatZ
        trailCount++
        trailGeo.setDrawRange(0, trailCount)
        trailGeo.attributes.position.needsUpdate = true
      }

      // wake puffs at the stern, opposite the heading, then swept by the current
      puffTimer += dt
      if (puffTimer >= 0.22 && boatSpeed > 0.01) {
        puffTimer = 0
        const back = new THREE.Vector3(boatVx, 0, boatVz).normalize().multiplyScalar(-6)
        const m = new THREE.Mesh(puffGeo, new THREE.MeshBasicMaterial({ color: COL.wake, transparent: true, opacity: 0.7 }))
        m.rotation.x = -Math.PI / 2
        m.position.set(boatX + back.x, 0.12, boatZ + back.z)
        scene.add(m)
        puffs.push({ mesh: m, age: 0 })
      }
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i]
        p.age += dt
        p.mesh.position.z += currentSpeed * dt
        p.mesh.scale.setScalar(1 + p.age * 1.4)
        const mat = p.mesh.material as THREE.MeshBasicMaterial
        mat.opacity = Math.max(0, 0.7 - p.age * 0.45)
        if (p.age > 1.6) {
          scene.remove(p.mesh); mat.dispose()
          puffs.splice(i, 1)
        }
      }

      const sec = Math.floor(t)
      if (sec > lastRow) { pathRows.push([sec, Math.round(boatX * 10) / 10, Math.round((boatZ - START_Z) * 10) / 10]); lastRow = sec }
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
      boatX = 0; boatZ = START_Z; t = 0; running = false; done = false
      pathRows.length = 0; lastRow = -1
      trailCount = 0; trailTimer = 0; trailGeo.setDrawRange(0, 0)
      for (const p of puffs) { scene.remove(p.mesh); (p.mesh.material as THREE.Material).dispose() }
      puffs.length = 0
      chasePos.set(-34, 40, START_Z - 46)
      chaseLook.set(RIVER_WIDTH * 0.35, 0, START_Z)
      driftLine.visible = false
    },
    getReadouts() {
      const { resVx, resVz } = components()
      const resultantSpeed = Math.hypot(resVx, resVz)
      const resultantAngle = (Math.atan2(resVx, resVz + 1e-9) * 180) / Math.PI
      return {
        time: t,
        across: Math.round(boatX * 10) / 10,
        drift: Math.round((boatZ - TARGET_Z) * 10) / 10,
        resultantSpeed: Math.round(resultantSpeed * 10) / 10,
        resultantAngle: Math.round(resultantAngle * 10) / 10,
      }
    },
    getData(): SimData {
      return { columns: ['Time (s)', 'Across (m)', 'Drift (m)'], rows: pathRows, xCol: 1, yCol: 2 }
    },
    isComplete() { return done },
    destroy() {
      for (const p of puffs) { scene.remove(p.mesh); (p.mesh.material as THREE.Material).dispose() }
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        if (m.geometry) m.geometry.dispose()
        const mat = m.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
        else if (mat) mat.dispose()
      })
      renderer.dispose()
    },
  }
  return engine
}
