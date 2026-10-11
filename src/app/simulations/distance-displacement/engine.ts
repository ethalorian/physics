import type {
  SimEngine,
  ParamValues,
  SimData,
} from "@/components/simulations/lab/contract";
import { arrow, chip, label } from "@/components/simulations/lab/draw";
import { rover } from "@/components/simulations/lab/scene-art";
export interface RoutePoint {
  x: number;
  y: number;
}
export function routeMeasurements(path: RoutePoint[]) {
  let distance = 0;
  for (let i = 1; i < path.length; i++)
    distance += Math.hypot(
      path[i].x - path[i - 1].x,
      path[i].y - path[i - 1].y,
    );
  const start = path[0] ?? { x: 0, y: 0 },
    end = path.at(-1) ?? start;
  return {
    distance,
    dx: end.x - start.x,
    dy: end.y - start.y,
    displacement: Math.hypot(end.x - start.x, end.y - start.y),
  };
}
export function createDistanceDisplacementEngine(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  initial: ParamValues,
  opts?: { invalidate: () => void },
): SimEngine {
  let path: RoutePoint[] = [{ x: 0, y: 0 }],
    params = { ...initial };
  const dims = () => ({
    w: canvas.width / (window.devicePixelRatio || 1),
    h: canvas.height / (window.devicePixelRatio || 1),
  });
  const scale = () => {
    const { w, h } = dims();
    return Math.min((w - 60) / 16, (h - 90) / 12);
  };
  const screen = (p: RoutePoint) => {
    const { w, h } = dims(),
      s = scale();
    return { x: w / 2 + p.x * s, y: h / 2 - p.y * s };
  };
  function render() {
    const { w, h } = dims(),
      s = scale();
    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#172A39");
    bg.addColorStop(1, "#31474C");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    // Survey contours are scenery; the numbered grid is the measurement reference.
    ctx.strokeStyle = "rgba(156,191,179,.08)";
    ctx.lineWidth = 1;
    for (let ring = 0; ring < 12; ring++) {
      ctx.beginPath();
      ctx.ellipse(
        w * 0.13,
        h * 0.1,
        80 + ring * 16,
        40 + ring * 12,
        -0.4,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(
        w * 0.87,
        h * 0.8,
        35 + ring * 15,
        30 + ring * 11,
        0.6,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }
    for (let x = -8; x <= 8; x++) {
      const a = screen({ x, y: 0 });
      ctx.strokeStyle = x === 0 ? "#91ADB1" : "rgba(203,220,215,.13)";
      ctx.beginPath();
      ctx.moveTo(a.x, 35);
      ctx.lineTo(a.x, h - 45);
      ctx.stroke();
      if (x % 2 === 0)
        label(ctx, String(x), a.x, h - 27, {
          color: "#BDCFCE",
          size: 11,
          align: "center",
        });
    }
    for (let y = -5; y <= 5; y++) {
      const a = screen({ x: 0, y });
      ctx.strokeStyle = y === 0 ? "#91ADB1" : "rgba(203,220,215,.13)";
      ctx.beginPath();
      ctx.moveTo(25, a.y);
      ctx.lineTo(w - 25, a.y);
      ctx.stroke();
      if (y % 2 === 0)
        label(ctx, String(y), 13, a.y + 4, { color: "#BDCFCE", size: 10 });
    }
    label(ctx, "SURVEY FIELD / 1 SQUARE = 1 m", 18, 22, {
      color: "#D5E2DC",
      size: 10,
    });
    label(ctx, "x (m) · east →", w - 18, h - 10, {
      color: "#D5E2DC",
      size: 10,
      align: "right",
    });
    label(ctx, "↑ north", w - 18, 22, {
      color: "#D5E2DC",
      size: 10,
      align: "right",
    });
    if (path.length > 1) {
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      for (const [width, color] of [
        [10, "rgba(132,207,170,.14)"],
        [3, "#88D6AE"],
      ] as const) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        path.forEach((p, i) => {
          const q = screen(p);
          if (!i) ctx.moveTo(q.x, q.y);
          else ctx.lineTo(q.x, q.y);
        });
        ctx.stroke();
      }
      path.forEach((p, i) => {
        if (!i) return;
        const q = screen(p);
        ctx.fillStyle = "#88D6AE";
        ctx.beginPath();
        ctx.arc(q.x, q.y, 4, 0, Math.PI * 2);
        ctx.fill();
        label(ctx, String(i), q.x + 8, q.y - 8, { color: "#D8EBDA", size: 11 });
      });
      const start = screen(path[0]),
        end = screen(path.at(-1)!);
      arrow(ctx, start.x, start.y, end.x, end.y, {
        color: "#C4BEFF",
        width: 3,
        head: 11,
        dash: [6, 4],
      });
    }
    const origin = screen({ x: 0, y: 0 });
    ctx.strokeStyle = "#E3BF71";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(origin.x, origin.y, 10, 0, Math.PI * 2);
    ctx.stroke();
    chip(ctx, "BASE / (0, 0)", origin.x, origin.y + 25, {
      bg: "#213541",
      color: "#E9D69D",
      size: 10,
    });
    const p = path.at(-1)!,
      q = screen(p);
    rover(
      ctx,
      q.x,
      q.y - 3,
      Math.min(0.55, s / 50),
      path.length > 1 && p.x < path[path.length - 2].x ? -1 : 1,
      path.length * 0.8,
    );
  }
  function add(p: RoutePoint) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
    path = [
      ...path,
      { x: Math.max(-7, Math.min(7, p.x)), y: Math.max(-5, Math.min(5, p.y)) },
    ];
    render();
    opts?.invalidate();
  }
  const pointer = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect(),
      { w, h } = dims(),
      s = scale();
    add({
      x:
        Math.round(((((e.clientX - r.left) * w) / r.width - w / 2) / s) * 4) /
        4,
      y:
        Math.round(((h / 2 - ((e.clientY - r.top) * h) / r.height) / s) * 4) /
        4,
    });
  };
  const key = (e: KeyboardEvent) => {
    const p = path.at(-1)!;
    const d: Record<string, RoutePoint> = {
      ArrowRight: { x: 1, y: 0 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowUp: { x: 0, y: 1 },
      ArrowDown: { x: 0, y: -1 },
    };
    if (d[e.key]) {
      e.preventDefault();
      add({ x: p.x + d[e.key].x, y: p.y + d[e.key].y });
    }
  };
  canvas.addEventListener("click", pointer as EventListener);
  canvas.addEventListener("keydown", key);
  canvas.tabIndex = 0;
  canvas.style.cursor = "crosshair";
  return {
    render,
    setParams(next) {
      if (next.route !== params.route) {
        const route = String(next.route);
        if (route === "out-back")
          path = [
            { x: 0, y: 0 },
            { x: 4, y: 0 },
            { x: 0, y: 0 },
          ];
        if (route === "corner")
          path = [
            { x: 0, y: 0 },
            { x: 3, y: 0 },
            { x: 3, y: 4 },
          ];
        if (route === "direct")
          path = [
            { x: 0, y: 0 },
            { x: 3, y: 4 },
          ];
        if (route === "free") path = [{ x: 0, y: 0 }];
      }
      params = { ...next };
      render();
    },
    reset() {
      path = [{ x: 0, y: 0 }];
      params = { ...params, route: "" };
    },
    getReadouts() {
      return routeMeasurements(path);
    },
    getData(): SimData {
      let d = 0;
      return {
        columns: ["Stop", "x (m)", "y (m)", "Distance (m)"],
        rows: path.map((p, i) => {
          if (i) d += Math.hypot(p.x - path[i - 1].x, p.y - path[i - 1].y);
          return [i, p.x, p.y, d];
        }),
        xCol: 1,
        yCol: 2,
      };
    },
    destroy() {
      canvas.removeEventListener("click", pointer as EventListener);
      canvas.removeEventListener("keydown", key);
    },
  };
}
