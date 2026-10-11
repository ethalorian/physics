import { terrain, rover } from "@/components/simulations/lab/scene-art";
import type {
  SimEngine,
  ParamValues,
  SimData,
} from "@/components/simulations/lab/contract";
import { arrow, label } from "@/components/simulations/lab/draw";

// Uniformly accelerated motion — the "oil-drop ticker": a car drops a spot every
// second, and the growing/shrinking spacing reveals constant acceleration. The
// canvas shows the ticker; the shell's Motion Detector shows velocity vs time
// (a straight line of slope = a). Physics is exact closed-form kinematics.

interface Spot {
  t: number;
  x: number;
  v: number;
}

// Scene tokens; structural/semantic tones come from the shared PAL so the sim
// matches every other lab. road/lane are scene-specific.

export function createUAMEngine(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  initial: ParamValues,
): SimEngine {
  let v0 = Number(initial.v0 ?? 5);
  let a = Number(initial.a ?? 2);
  let t = 0,
    x = 0,
    v = v0;
  let done = false;
  let lastSecond = -1;
  let lastTrace = -1;
  let spots: Spot[] = [];
  let samp: { t: number; v: number; x: number }[] = [];

  const dims = () => {
    const dpr = window.devicePixelRatio || 1;
    return { w: canvas.width / dpr, h: canvas.height / dpr };
  };

  function render() {
    const { w, h } = dims();
    terrain(ctx, w, h, true);
    const y = h * 0.72;
    const min = Math.min(-10, ...spots.map((s) => s.x), x) - 5,
      max = Math.max(25, ...spots.map((s) => s.x), x) + 5;
    const toX = (m: number) => 50 + ((m - min) / (max - min)) * (w - 100);
    ctx.fillStyle = "#263B45";
    ctx.fillRect(0, y - 4, w, 35);
    ctx.strokeStyle = "#A8BAAD";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y + 30);
    ctx.lineTo(w, y + 30);
    ctx.stroke();
    let lastX = -Infinity;
    spots.forEach((s) => {
      const px = toX(s.x);
      ctx.fillStyle = "#E2C279";
      ctx.beginPath();
      ctx.arc(px, y + 17, 4, 0, Math.PI * 2);
      ctx.fill();
      if (Math.abs(px - lastX) > 34) {
        label(ctx, s.t + " s", px, y + 53, {
          color: "#D8DDD2",
          size: 11,
          align: "center",
        });
        lastX = px;
      }
    });
    const rx = toX(x);
    rover(ctx, rx, y - 9, 0.92, v < 0 ? -1 : 1, x * 0.65);
    if (Math.abs(v) > 0.05)
      arrow(ctx, rx, y - 92, rx + Math.max(-95, Math.min(95, v * 5)), y - 92, {
        color: "#88D6AE",
        width: 3,
        head: 10,
      });
    if (Math.abs(a) > 0.05)
      arrow(ctx, rx, y - 119, rx + a * 14, y - 119, {
        color: "#E79775",
        width: 3,
        head: 9,
      });
    label(ctx, "v", Math.min(w - 20, rx + 105), y - 88, {
      color: "#88D6AE",
      size: 12,
    });
    label(ctx, "a", Math.min(w - 20, rx + 105), y - 115, {
      color: "#E79775",
      size: 12,
    });
    label(ctx, "EQUAL-TIME MOTION MAP / 1 DOT PER SECOND", 20, 28, {
      color: "#D8E3DD",
      size: 11,
    });
    const hint =
      Math.abs(v) < 0.05
        ? "At the turning point"
        : Math.abs(a) < 0.01
          ? "Constant velocity"
          : v * a > 0
            ? "Speed increasing"
            : "Speed decreasing";
    label(ctx, hint + " · x = " + x.toFixed(1) + " m", 20, h - 15, {
      color: "#D8E3DD",
      size: 12,
    });
  }

  const engine: SimEngine = {
    render,
    step(dt: number) {
      if (done) return;
      t = Math.min(15, t + dt);
      v = v0 + a * t;
      x = v0 * t + 0.5 * a * t * t;
      const sec = Math.floor(t + 1e-9);
      while (lastSecond < sec) {
        lastSecond++;
        spots.push({
          t: lastSecond,
          x: v0 * lastSecond + 0.5 * a * lastSecond * lastSecond,
          v: v0 + a * lastSecond,
        });
      }
      if (t - lastTrace >= 0.05) {
        samp.push({ t, v, x });
        lastTrace = t;
      }
      if (t >= 15) done = true;
    },
    setParams(values: ParamValues) {
      v0 = Number(values.v0 ?? v0);
      a = Number(values.a ?? a);
      v = v0;
    },
    start(values: ParamValues) {
      this.setParams(values);
      t = 0;
      x = 0;
      v = v0;
      done = false;
      lastSecond = 0;
      lastTrace = 0;
      spots = [{ t: 0, x: 0, v: v0 }];
      samp = [{ t: 0, v: v0, x: 0 }];
    },
    reset() {
      t = 0;
      x = 0;
      v = v0;
      done = false;
      lastSecond = -1;
      lastTrace = -1;
      spots = [];
      samp = [];
    },
    getReadouts() {
      return { time: t, position: x, velocity: v };
    },
    getData(): SimData {
      return {
        columns: ["Time (s)", "Position (m)", "Velocity (m/s)"],
        rows: spots.map((s) => [s.t, s.x, s.v]),
        xCol: 0,
        yCol: 2,
      };
    },
    getSensorTrace(key?: string) {
      return samp.map((s) => ({ x: s.t, y: key === "position" ? s.x : s.v }));
    },
    isComplete() {
      return done;
    },
    destroy() {},
  };
  return engine;
}
