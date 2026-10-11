import { terrain, rover } from "@/components/simulations/lab/scene-art";
import type {
  SimEngine,
  ParamValues,
  SimData,
} from "@/components/simulations/lab/contract";
import { PAL, arrow } from "@/components/simulations/lab/draw";

// Constant-velocity walker. The canvas shows the overhead track (the scene); the
// shared mock sensor carries the position/velocity graph — same as every other
// sim, so the sensor behaves consistently everywhere. Direction is a LIVE control;
// speed is fixed per run. Physics is exact.

type Dir = "forward" | "backward" | "stopped";
interface Pt {
  time: number;
  position: number;
  velocity: number;
}

// Structural/semantic tones come from the shared PAL so the sim matches every
// other lab. track = position, origin = secondary highlight, walker = primary
// ink, fwd = motion/velocity, back = secondary direction, stop = muted.

export function createConstantVelocityEngine(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  initial: ParamValues,
): SimEngine {
  let speed = Number(initial.speed ?? 1);
  let dir = String(initial.direction ?? "stopped") as Dir;
  let position = 0;
  let t = 0;
  let nextSample = 1;
  let lastSamp = -1;
  let pts: Pt[] = [];
  let samp: { t: number; p: number; v: number }[] = [];
  let trail: number[] = [];

  const vel = () =>
    dir === "forward" ? speed : dir === "backward" ? -speed : 0;
  const dims = () => {
    const dpr = window.devicePixelRatio || 1;
    return { w: canvas.width / dpr, h: canvas.height / dpr };
  };

  function render() {
    const { w, h } = dims();
    terrain(ctx, w, h);
    const y = h * 0.72;
    const min = Math.min(-10, Math.floor(position / 10) * 10 - 10),
      max = Math.max(10, Math.ceil(position / 10) * 10 + 10),
      span = max - min;
    const toX = (m: number) => 45 + ((m - min) / span) * (w - 90);
    ctx.fillStyle = "#485E61";
    ctx.fillRect(0, y - 6, w, 28);
    ctx.fillStyle = "#233C44";
    ctx.fillRect(0, y + 18, w, 7);
    ctx.strokeStyle = "#D5D7BB";
    ctx.lineWidth = 2;
    ctx.setLineDash([16, 18]);
    ctx.beginPath();
    ctx.moveTo(0, y + 6);
    ctx.lineTo(w, y + 6);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#2D4852";
    ctx.font = "11px ui-monospace,monospace";
    ctx.textAlign = "center";
    const tick = span > 100 ? 20 : span > 40 ? 10 : 5;
    for (let m = Math.ceil(min / tick) * tick; m <= max; m += tick) {
      const px = toX(m);
      ctx.fillRect(px, y + 29, 1, 7);
      ctx.fillText(m + " m", px, y + 52);
    }
    ctx.textAlign = "left";
    pts.slice(-35).forEach((p) => {
      ctx.fillStyle = "rgba(38,102,100,.48)";
      ctx.beginPath();
      ctx.arc(toX(p.position), y + 11, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    const rx = toX(position);
    rover(ctx, rx, y - 10, 0.92, dir === "backward" ? -1 : 1, position * 1.7);
    if (vel()) {
      arrow(ctx, rx, y - 89, rx + vel() * 22, y - 89, {
        color: PAL.velocity,
        width: 3,
        head: 9,
      });
    }
    ctx.fillStyle = "#314B52";
    ctx.font = "12px ui-monospace,monospace";
    ctx.fillText("MOTION TEST RANGE / POSITION REFERENCE", 20, 28);
    ctx.fillText("Each marker records one second.", 20, h - 16);
    ctx.fillStyle = "#3A5960";
    ctx.fillText(
      "x = " + position.toFixed(2) + " m",
      Math.max(18, Math.min(w - 140, rx - 40)),
      y - 113,
    );
  }

  const sample = () => {
    pts.push({ time: Math.round(t), position, velocity: vel() });
  };

  const engine: SimEngine = {
    render,
    step(dt: number) {
      const oldTime = t,
        oldPosition = position,
        velocity = vel();
      position += velocity * dt;
      t += dt;
      while (t + 1e-9 >= nextSample) {
        pts.push({
          time: nextSample,
          position: oldPosition + velocity * (nextSample - oldTime),
          velocity,
        });
        nextSample++;
      }
      if (t - lastSamp >= 0.05) {
        samp.push({ t, p: position, v: vel() });
        lastSamp = t;
      }
      trail.push(position);
      if (trail.length > 40) trail.shift();
    },
    setParams(values: ParamValues) {
      speed = Number(values.speed ?? speed);
      dir = String(values.direction ?? dir) as Dir;
    },
    start() {
      if (samp.length === 0) {
        samp.push({ t: 0, p: position, v: vel() });
        sample();
      }
    },
    reset() {
      position = 0;
      t = 0;
      nextSample = 1;
      lastSamp = -1;
      pts = [];
      samp = [];
      trail = [];
      dir = "stopped";
    },
    getReadouts() {
      return { time: t, position, velocity: vel() };
    },
    getData(): SimData {
      return {
        columns: ["Time (s)", "Position (m)", "Velocity (m/s)"],
        rows: pts.map((p) => [p.time, p.position, p.velocity]),
        xCol: 0,
        yCol: 1,
      };
    },
    getSensorTrace(key?: string) {
      return samp.map((s) => ({ x: s.t, y: key === "velocity" ? s.v : s.p }));
    },
    destroy() {},
  };
  return engine;
}
