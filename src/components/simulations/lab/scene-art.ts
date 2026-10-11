import { roundRectPath, label } from "./draw";

/** Procedural scientific illustration. Fixed seed keeps scenery stable while physics moves. */
export function terrain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  night = false,
) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, night ? "#111C32" : "#DCE6EA");
  sky.addColorStop(0.55, night ? "#23364D" : "#EEF1E8");
  sky.addColorStop(1, night ? "#35434D" : "#D8DBC9");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  if (night) {
    for (let i = 0; i < 75; i++) {
      const x = (((i * 137.508) % 997) / 997) * w,
        y = (((i * 71.13) % 499) / 499) * h * 0.54;
      ctx.fillStyle = i % 3 ? "#B8CBCF" : "#FFF2CB";
      ctx.globalAlpha = 0.25 + (i % 5) * 0.12;
      ctx.fillRect(x, y, i % 9 === 0 ? 2 : 1, i % 9 === 0 ? 2 : 1);
    }
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = "#FCF8DC";
    ctx.beginPath();
    ctx.arc(w * 0.82, h * 0.18, 26, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let layer = 0; layer < 3; layer++) {
    ctx.fillStyle = night
      ? ["#25384B", "#30434E", "#3D4C50"][layer]
      : ["#BACBC8", "#A9BCB5", "#96ACA3"][layer];
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w + 30; x += 30) {
      const y =
        h * (0.45 + layer * 0.09) -
        Math.sin(x * 0.009 + layer) * 18 -
        Math.sin(x * 0.023 + layer * 7) * 11;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  }
  const floor = ctx.createLinearGradient(0, h * 0.67, 0, h);
  floor.addColorStop(0, night ? "#36464C" : "#BCC6B6");
  floor.addColorStop(1, night ? "#182B39" : "#E8E5D7");
  ctx.fillStyle = floor;
  ctx.fillRect(0, h * 0.7, w, h * 0.3);
}

export function rover(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size = 1,
  heading = 1,
  wheelPhase = 0,
  color = "#D9E7DF",
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size * heading, size);
  ctx.fillStyle = "rgba(9,20,29,.24)";
  ctx.beginPath();
  ctx.ellipse(0, 13, 47, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const wx of [-28, 27]) {
    ctx.fillStyle = "#172B36";
    ctx.beginPath();
    ctx.arc(wx, 6, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#647F88";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(wx, 6, 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.save();
    ctx.translate(wx, 6);
    ctx.rotate(wheelPhase);
    ctx.strokeStyle = "#A2B4B5";
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(-7, 0);
      ctx.lineTo(7, 0);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = "#D4DECD";
    ctx.beginPath();
    ctx.arc(wx, 6, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  const body = ctx.createLinearGradient(0, -36, 0, 6);
  body.addColorStop(0, "#F2F4E4");
  body.addColorStop(0.5, color);
  body.addColorStop(1, "#87A6A5");
  ctx.fillStyle = body;
  roundRectPath(ctx, -40, -23, 79, 25, 6);
  ctx.fill();
  ctx.fillStyle = "#2B4B59";
  ctx.beginPath();
  ctx.moveTo(-22, -24);
  ctx.lineTo(-15, -45);
  ctx.lineTo(15, -45);
  ctx.lineTo(28, -24);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#83B9BE";
  ctx.beginPath();
  ctx.moveTo(-11, -41);
  ctx.lineTo(11, -41);
  ctx.lineTo(21, -27);
  ctx.lineTo(-16, -27);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#EBF7E8";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-8, -39);
  ctx.lineTo(9, -39);
  ctx.stroke();
  ctx.fillStyle = "#D47751";
  ctx.fillRect(-33, -16, 21, 5);
  ctx.fillStyle = "#263F4A";
  ctx.fillRect(5, -15, 19, 6);
  ctx.fillStyle = "#FFF2BA";
  ctx.fillRect(34, -17, 5, 8);
  ctx.strokeStyle = "#415C61";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-28, -23);
  ctx.lineTo(-29, -55);
  ctx.stroke();
  ctx.fillStyle = "#D47751";
  ctx.beginPath();
  ctx.arc(-29, -56, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
export function instrumentLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
) {
  label(ctx, text, x, y, { size: 11, color: "#DDE7E0" });
}
