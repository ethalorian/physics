import type { SimEngine, ParamValues, SimData, SensorSample } from '@/components/simulations/lab/contract'
import { PAL, clearField, grid as drawGrid, axes as drawAxes, panel, groundShadow, chip, roundRectPath } from '@/components/simulations/lab/draw'

// Car race — two cars move at CONSTANT velocity with independent start delays
// down a straight track. The split canvas shows the race up top and a LIVE
// position-time graph below: two straight lines whose SLOPE is each car's speed,
// and whose INTERSECTION is the overtake (same position at the same time). The
// overtake time/position is also solved in closed form so the live event can be
// checked against the algebra: v_A(t−d_A) = v_B(t−d_B).
// Exact constant-velocity kinematics; idealized (instant start, no acceleration).

const RACE = 1000 // race length (m)

// Scene tokens; structural/semantic tones come from the shared PAL so the sim
// matches every other lab. grass/road/lane/edge are scene-specific.
const COL = {
  bg: PAL.bg, grass: '#5DCAA5', road: '#3A3550', lane: '#FAC775', edge: '#FFFFFF',
  a: PAL.primary, aWin: '#CFCBF4', b: PAL.force, bWin: '#FBD9CC', wheel: PAL.ink,
  text: PAL.ink, mute: PAL.mute, grid: PAL.grid, cross: PAL.accent, card: PAL.surface,
}

interface Samp { t: number; a: number; b: number }

export function createCarRaceEngine(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, initial: ParamValues): SimEngine {
  let vA = Number(initial.vA ?? 20)
  let vB = Number(initial.vB ?? 25)
  let startA = Number(initial.startA ?? 0)
  let startB = Number(initial.startB ?? 5)

  let t = 0
  let running = false
  let posA = 0
  let posB = 0
  let lastSample = -1
  let lastRow = -1
  let samp: Samp[] = []
  let rows: number[][] = []
  let overtakeT: number | null = null
  let overtakePos = 0
  let prevDiff = 0 // posB - posA at previous step (for crossing detection)

  const effA = () => Math.max(0, t - startA)
  const effB = () => Math.max(0, t - startB)
  const finished = () => posA >= RACE || posB >= RACE
  const leader = () => (posB > posA ? 'B' : posA > posB ? 'A' : 'Tie')

  // Closed-form overtake (where the P-T lines cross), for the marker + checking.
  const predictOvertake = (): { t: number; pos: number } | null => {
    const denom = vA - vB
    if (Math.abs(denom) < 1e-6) return null
    const tt = (vA * startA - vB * startB) / denom
    if (tt > Math.max(startA, startB) && tt >= 0) {
      const pos = vA * (tt - startA)
      if (pos >= 0 && pos <= RACE) return { t: tt, pos }
    }
    return null
  }

  const dims = () => {
    const dpr = window.devicePixelRatio || 1
    return { w: canvas.width / dpr, h: canvas.height / dpr }
  }

  function drawCar(x: number, y: number, fill: string, win: string, tag: string) {
    groundShadow(ctx, x, y + 15, 24, 5)
    ctx.fillStyle = fill
    roundRectPath(ctx, x - 22, y - 11, 44, 22, 6); ctx.fill()
    ctx.fillStyle = win; roundRectPath(ctx, x + 3, y - 8, 14, 16, 3); ctx.fill()
    ctx.fillStyle = COL.wheel
    ctx.beginPath(); ctx.arc(x - 12, y + 12, 4.5, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(x + 12, y + 12, 4.5, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 12px ui-sans-serif, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(tag, x - 5, y)
    ctx.textBaseline = 'alphabetic'
  }

  function render() {
    const { w, h } = dims()
    clearField(ctx, w, h)

    const sceneH = Math.round(h * 0.46)
    const pad = 30

    // ---- top: race scene -------------------------------------------------
    ctx.fillStyle = COL.grass; ctx.fillRect(0, 0, w, sceneH)
    const roadY = 44, roadH = sceneH - 70, laneH = roadH / 2
    ctx.fillStyle = COL.road; ctx.fillRect(0, roadY, w, roadH)
    ctx.strokeStyle = COL.lane; ctx.lineWidth = 3; ctx.setLineDash([18, 14])
    ctx.beginPath(); ctx.moveTo(0, roadY + laneH); ctx.lineTo(w, roadY + laneH); ctx.stroke(); ctx.setLineDash([])
    ctx.strokeStyle = COL.edge; ctx.lineWidth = 3
    ctx.beginPath(); ctx.moveTo(0, roadY); ctx.lineTo(w, roadY); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, roadY + roadH); ctx.lineTo(w, roadY + roadH); ctx.stroke()

    const trackX = (m: number) => pad + (m / RACE) * (w - 2 * pad)

    // distance markers
    ctx.fillStyle = COL.edge; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'
    for (let d = 0; d <= RACE; d += 200) ctx.fillText(`${d}`, trackX(d), roadY - 6)

    // finish line (checkered tick)
    const fx = trackX(RACE)
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3; ctx.setLineDash([7, 7])
    ctx.beginPath(); ctx.moveTo(fx, roadY); ctx.lineTo(fx, roadY + roadH); ctx.stroke(); ctx.setLineDash([])

    // overtake marker (vertical line where B crossed A)
    if (overtakeT !== null) {
      const ox = trackX(overtakePos)
      ctx.strokeStyle = COL.cross; ctx.lineWidth = 2; ctx.setLineDash([4, 4])
      ctx.beginPath(); ctx.moveTo(ox, roadY); ctx.lineTo(ox, roadY + roadH); ctx.stroke(); ctx.setLineDash([])
    }

    const aY = roadY + laneH / 2, bY = roadY + laneH + laneH / 2
    if (effA() > 0) {
      drawCar(trackX(Math.min(posA, RACE)), aY, COL.a, COL.aWin, 'A')
      chip(ctx, `${posA.toFixed(0)} m`, trackX(Math.min(posA, RACE)), aY - 20, { bg: COL.aWin, color: COL.text })
    } else {
      ctx.fillStyle = COL.a; ctx.font = '11px sans-serif'; ctx.textAlign = 'left'
      ctx.fillText(`A starts in ${(startA - t).toFixed(1)} s`, pad, aY)
    }
    if (effB() > 0) {
      drawCar(trackX(Math.min(posB, RACE)), bY, COL.b, COL.bWin, 'B')
      chip(ctx, `${posB.toFixed(0)} m`, trackX(Math.min(posB, RACE)), bY - 20, { bg: COL.bWin, color: COL.text })
    } else {
      ctx.fillStyle = COL.b; ctx.font = '11px sans-serif'; ctx.textAlign = 'left'
      ctx.fillText(`B starts in ${(startB - t).toFixed(1)} s`, pad, bY)
    }

    // ---- bottom: live position-time graph --------------------------------
    const gx0 = pad + 28, gy0 = sceneH + 18, gx1 = w - 12, gy1 = h - 26
    panel(ctx, gx0 - 22, gy0 - 12, gx1 - gx0 + 30, gy1 - gy0 + 34, 10)

    const tMax = Math.max(8, Math.ceil(t))
    const px = (tt: number) => gx0 + (tt / tMax) * (gx1 - gx0)
    const py = (pos: number) => gy1 - (pos / RACE) * (gy1 - gy0)

    // grid + axes (shared visual language)
    drawGrid(ctx, gx1, gy1, (gy1 - gy0) / 4, { x0: gx0, y0: gy0, x1: gx1, y1: gy1, originX: gx0, originY: gy0, color: COL.grid })
    drawAxes(ctx, gx0, gy0, gx1, gy1)
    ctx.fillStyle = COL.mute; ctx.font = '10px sans-serif'; ctx.textAlign = 'right'
    ctx.fillText(`${RACE}`, gx0 - 5, gy0 + 4)
    ctx.fillText('0', gx0 - 5, gy1)
    ctx.textAlign = 'center'; ctx.fillText(`t = ${tMax}s`, (gx0 + gx1) / 2, h - 8)
    ctx.save(); ctx.translate(gx0 - 20, (gy0 + gy1) / 2); ctx.rotate(-Math.PI / 2)
    ctx.fillText('position (m)', 0, 0); ctx.restore()

    const line = (sel: (s: Samp) => number, color: string) => {
      if (samp.length < 1) return
      ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.beginPath()
      samp.forEach((s, i) => {
        const X = px(s.t), Y = py(Math.min(sel(s), RACE))
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y)
      })
      ctx.stroke()
    }
    line((s) => s.a, COL.a)
    line((s) => s.b, COL.b)

    // intersection dot (the overtake), if it has happened
    if (overtakeT !== null && overtakeT <= t) {
      ctx.fillStyle = COL.cross; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(px(overtakeT), py(overtakePos), 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    }

    // legend
    ctx.textAlign = 'left'; ctx.font = '11px sans-serif'
    ctx.fillStyle = COL.a; ctx.fillText('■ Car A', gx1 - 130, gy0 + 6)
    ctx.fillStyle = COL.b; ctx.fillText('■ Car B', gx1 - 70, gy0 + 6)
  }

  const engine: SimEngine = {
    render,
    step(dt: number) {
      if (!running || finished()) { running = running && !finished(); return }
      t += dt
      posA = vA * effA()
      posB = vB * effB()
      const diff = posB - posA
      // overtake = B crosses A (diff changes sign through 0) after both started
      if (overtakeT === null && effA() > 0 && effB() > 0 && prevDiff <= 0 && diff > 0) {
        const pred = predictOvertake()
        if (pred) { overtakeT = pred.t; overtakePos = pred.pos } else { overtakeT = t; overtakePos = posB }
      }
      prevDiff = diff
      if (t - lastSample >= 0.05) { samp.push({ t, a: posA, b: posB }); lastSample = t }
      const sec = Math.floor(t)
      if (sec > lastRow) { rows.push([sec, Math.round(posA), Math.round(posB), Math.round(posB - posA)]); lastRow = sec }
      if (finished()) running = false
    },
    setParams(values: ParamValues) {
      vA = Number(values.vA ?? vA); vB = Number(values.vB ?? vB)
      startA = Number(values.startA ?? startA); startB = Number(values.startB ?? startB)
    },
    start(values: ParamValues) {
      this.setParams(values)
      running = true
      if (samp.length === 0) { samp.push({ t: 0, a: 0, b: 0 }); rows.push([0, 0, 0, 0]) }
    },
    reset() {
      t = 0; running = false; posA = 0; posB = 0; lastSample = -1; lastRow = -1
      samp = []; rows = []; overtakeT = null; overtakePos = 0; prevDiff = 0
    },
    getReadouts() {
      return {
        time: t,
        posA: Math.round(posA),
        posB: Math.round(posB),
        gap: Math.round(posB - posA),
        leader: effA() <= 0 && effB() <= 0 ? '—' : leader(),
      }
    },
    getData(): SimData {
      return {
        columns: ['Time (s)', 'Pos A (m)', 'Pos B (m)', 'Gap B−A (m)'],
        rows,
        xCol: 0, yCol: 1,
      }
    },
    getSensorTrace(key?: string): SensorSample[] {
      return samp.map((s) => {
        let y = s.b - s.a
        if (key === 'posA') y = s.a
        else if (key === 'posB') y = s.b
        return { x: s.t, y }
      })
    },
    isComplete() { return finished() },
    destroy() {},
  }
  return engine
}
