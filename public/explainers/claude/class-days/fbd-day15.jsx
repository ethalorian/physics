const W = 1920, H = 1080;
const INK = '#22233a', CORAL = '#c9573f', INDIGO = '#4b4ba8', TINT = '#e4e4f2', BG = '#f6f6fb', GREY = '#5a5b73';
const SAGE = '#3d7a55', SAGE_T = '#dcece2', CORAL_T = '#f7e1da', LINE = '#cfd0e6';
const MONO = "'IBM Plex Mono', ui-monospace, monospace";
const SERIF = "'EB Garamond', Georgia, serif";
const SANS = "'IBM Plex Sans', system-ui, sans-serif";
const D2R = Math.PI / 180;
const lerp = (a, b, e) => a + (b - a) * e;
const eo = (u) => Easing.easeOutCubic(clamp(u, 0, 1));
const eio = (u) => Easing.easeInOutCubic(clamp(u, 0, 1));
const env = (T, a, d = 0.6) => eo((T - a) / d);
const win = (T, a, b, d = 0.5) => env(T, a, d) * (1 - env(T, b, d));
const fmt = (v, n = 3) => (v < -0.0005 ? '−' : '') + Math.abs(v).toFixed(n);

// ---------- physics: two ramp runs (cart released from rest, caught at 1.0 m) ----------
const RUNS = [{ a: 0.62, tr: 1.2, th: 6, k: 0, c: INDIGO }, { a: 0.95, tr: 1.0, th: 9.5, k: 3, c: CORAL }];
RUNS.forEach((r) => { r.tc = r.tr + Math.sqrt(2 / r.a); r.vc = r.a * (r.tc - r.tr); });
const nz = (t, k) => 0.035 * Math.sin(t * 37.1 + k) + 0.025 * Math.sin(t * 91.7 + 2 * k);
function sample(r, t) {
  if (t <= r.tr) return { x: 0, v: nz(t, r.k) * 0.08, a: nz(t, r.k) * 0.8 };
  if (t <= r.tc) { const d = t - r.tr; return { x: 0.5 * r.a * d * d, v: r.a * d + nz(t, r.k) * 0.25, a: r.a + nz(t, r.k) * 2.2 }; }
  const d = t - r.tc;
  if (d < 0.1) return { x: 1 + r.vc * d * (1 - d / 0.2), v: r.vc * (1 - d / 0.1), a: -r.vc / 0.1 };
  return { x: 1 + r.vc * 0.05, v: nz(t, r.k) * 0.08, a: nz(t, r.k) * 0.8 };
}

// ---------- world layout ----------
const AX = 700, AY = 0, AW = 1500, AH = 940;           // app window (world centre, local size)
const RX = -1850, RY = -60, RPX = 760;                   // ramp start line (s = 0) and px per metre
const OVER = [-360, 20, 0.5];
const rampPt = (s, th) => [RX + s * RPX * Math.cos(th * D2R), RY + s * RPX * Math.sin(th * D2R)];
const PANELS = [
  { k: 'x', y: 150, label: 'Position', unit: 'm', min: -0.1, max: 1.2, ticks: [0, 0.4, 0.8, 1.2] },
  { k: 'v', y: 380, label: 'Velocity', unit: 'm/s', min: -0.2, max: 1.6, ticks: [0, 0.5, 1, 1.5] },
  { k: 'a', y: 610, label: 'Acceleration', unit: 'm/s²', min: -2, max: 2, ticks: [-2, -1, 0, 1, 2] },
];
const PH = 220, PL = 150, PR = 1420;
const PY = (p, v) => p.y + 12 + ((p.max - clamp(v, p.min, p.max)) / (p.max - p.min)) * (PH - 44);

// ---------- camera ----------
function camShots(C) {
  const o = (t, d, x, y, z, r = 0, dip = 0) => ({ t, d, x, y, z, r, dip });
  const app = [AX, 20, 1.02], rm = [-760, -200, 0.66], meter = [250, -300, 1.45];
  return [
    o(-1, 0, 0, -2600, 1.3, -3), o(C.Title, 6.8, 0, -2600, 1.05, 0),
    o(C.Kit, 1.6, 0, -1500, 0.4, 0, 0.2), o(C.Kit + 2.4, 1.4, -1800, -1500, 1.35, -2, 0.2), o(C.Kit + 4.0, 1.4, -600, -1500, 1.35, 2, 0.3),
    o(C.Kit + 8.8, 1.4, 600, -1500, 1.35, -1.5, 0.3), o(C.Kit + 13.4, 1.4, 1800, -1500, 1.35, 1.5, 0.3),
    o(C.Connect, 1.8, -1900, -190, 1.6, -2, 0.45), o(C.Connect + 8.2, 1.6, AX, -10, 1.05, 0, 0.3), o(C.Connect + 17.6, 1.0, AX, 0, 1.3),
    o(C.Connect + 23.2, 1.6, ...OVER),
    o(C.Zero, 1.4, ...meter), o(C.Zero + 3.4, 1.3, ...rm), o(C.Zero + 5.0, 1.0, ...meter), o(C.Zero + 12.4, 1.2, ...rm), o(C.Zero + 16.8, 1.0, ...meter),
    o(C.Settings, 1.3, AX, 120, 1.15),
    o(C.Collect, 1.4, ...OVER), o(C.Collect + 22.6, 1.3, ...app),
    o(C.Read, 1.2, AX, -210, 1.35), o(C.Read + 5.4, 1.1, AX, 20, 1.35), o(C.Read + 10.8, 1.1, AX, 250, 1.35), o(C.Read + 16.0, 1.3, ...app),
    o(C.Fit, 1.2, AX, 30, 1.3), o(C.Fit + 16.2, 1.2, AX, -200, 1.3),
    o(C.Tangent, 1.0, AX, -200, 1.3), o(C.Tangent + 10.6, 1.2, ...app),
    o(C.Runs, 1.4, ...OVER), o(C.Runs + 9.6, 1.3, AX, 30, 1.3),
    o(C.Views, 1.2, AX, 20, 1.02),
    o(C.Photogate, 1.9, -1100, 1750, 0.95, 0, 0.4), o(C.Photogate + 5.2, 1.1, -1480, 1750, 1.3, -1), o(C.Photogate + 10.3, 1.3, -700, 1750, 1.3, 1),
    o(C.Export, 1.9, 1100, 1750, 1.05, 0, 0.35),
    o(C.Trouble, 1.9, 0, 3050, 0.52, 0, 0.3), o(C.Trouble + 3.8, 1.2, -1200, 3050, 1.25, -1.5), o(C.Trouble + 10.2, 1.2, 0, 3050, 1.25, 1.5), o(C.Trouble + 17.2, 1.2, 1200, 3050, 1.25, -1),
    o(C.Wrap, 1.9, 0, 4300, 0.88, 0, 0.4), o(C.Wrap + 2, 9, 0, 4300, 0.93),
  ];
}
function camAt(T, shots) {
  let cur = shots[0];
  for (const s of shots) {
    if (T >= s.t + s.d) { cur = s; continue; }
    if (T >= s.t) {
      const u = eio((T - s.t) / s.d);
      const z = Math.exp(lerp(Math.log(cur.z), Math.log(s.z), u)) * (1 - s.dip * Math.sin(Math.PI * u));
      cur = { x: lerp(cur.x, s.x, u), y: lerp(cur.y, s.y, u), z, r: lerp(cur.r, s.r, u) };
    }
    break;
  }
  return { x: cur.x + 6 * Math.sin(T * 0.41), y: cur.y + 4 * Math.sin(T * 0.53 + 1), z: cur.z * (1 + 0.005 * Math.sin(T * 0.37)), r: cur.r + 0.15 * Math.sin(T * 0.29) };
}

// ---------- shared pieces ----------
function WorldGrid({ z, on }) {
  if (!on) return null;
  const minor = clamp((z - 0.3) / 0.5, 0, 1);
  const base = { position: 'absolute', left: -4200, top: -3800, width: 8400, height: 10000, pointerEvents: 'none' };
  return (
    <React.Fragment>
      <div style={{ ...base, opacity: minor, backgroundImage: `linear-gradient(to right, ${TINT} 1.5px, transparent 1.5px), linear-gradient(to bottom, ${TINT} 1.5px, transparent 1.5px)`, backgroundSize: '40px 40px' }}></div>
      <div style={{ ...base, backgroundImage: 'linear-gradient(to right, #d3d4ea 2.5px, transparent 2.5px), linear-gradient(to bottom, #d3d4ea 2.5px, transparent 2.5px)', backgroundSize: '200px 200px' }}></div>
    </React.Fragment>
  );
}
const MARKS = Array.from({ length: 80 }, (_, i) => ({ x: -2600 + ((i * 733) % 5200), y: -2000 + ((i * 419) % 6800), k: i % 3, s: 0.6 + ((i * 7) % 5) / 6, ph: i * 1.7 }));
function Parallax({ cam, T }) {
  const f = 0.45;
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0, transformOrigin: '0 0', transform: `translate(${W / 2}px, ${H / 2}px) scale(${Math.pow(cam.z, 0.6)}) rotate(${-cam.r * 0.5}deg) translate(${-cam.x * f}px, ${-cam.y * f}px)`, pointerEvents: 'none' }}>
      <svg width="1" height="1" style={{ overflow: 'visible' }}>
        {MARKS.map((m, i) => (
          <g key={i} transform={`translate(${(m.x + 18 * Math.sin(T * 0.3 + m.ph)).toFixed(1)} ${(m.y + 14 * Math.cos(T * 0.26 + m.ph)).toFixed(1)}) rotate(${(T * 12 + m.ph * 30).toFixed(1)}) scale(${m.s})`} opacity={0.3}>
            {m.k === 0 ? <path d="M -12 0 L 12 0 M 0 -12 L 0 12" stroke={INDIGO} strokeWidth={3} strokeLinecap="round" />
              : m.k === 1 ? <circle r={7} fill="none" stroke={CORAL} strokeWidth={3} />
              : <path d="M -9 -9 L 9 -9 L 9 9 L -9 9 Z" fill="none" stroke={INDIGO} strokeWidth={2.5} />}
          </g>
        ))}
      </svg>
    </div>
  );
}
function Reveal({ T, at, dur = 1.2, children, style = {} }) {
  const p = Easing.easeInOutSine(clamp((T - at) / dur, 0, 1));
  if (p <= 0) return null;
  return <div style={{ position: 'absolute', clipPath: `inset(-20% ${(1 - p) * 100 - 6 * p}% -20% -2%)`, whiteSpace: 'nowrap', ...style }}>{children}</div>;
}
function Card({ x, y, w, h, T, at, r = 0, ph = 0, children }) {
  const e = env(T, at, 0.8);
  if (e <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, transform: `translateY(${5 * Math.sin(T * 0.8 + ph)}px) rotate(${r}deg) scale(${0.94 + 0.06 * e})`, opacity: e, background: '#ffffff', border: `2px solid ${LINE}`, borderRadius: 8, boxShadow: '0 40px 80px rgba(34,35,58,0.10)' }}>
      {children}
    </div>
  );
}
function CardHead({ T, at, kicker, title, sub }) {
  return (
    <React.Fragment>
      <div style={{ position: 'absolute', left: 60, top: 44, opacity: env(T, at), fontFamily: MONO, fontSize: 24, fontWeight: 600, letterSpacing: '0.12em', color: CORAL }}>{kicker}</div>
      <Reveal T={T} at={at + 0.2} dur={1.0} style={{ left: 58, top: 80, fontFamily: SERIF, fontSize: 64, lineHeight: 1.05, color: INK }}>{title}</Reveal>
      {sub && <div style={{ position: 'absolute', left: 60, top: 160, opacity: env(T, at + 0.8), fontFamily: SERIF, fontStyle: 'italic', fontSize: 38, color: INDIGO }}>{sub}</div>}
    </React.Fragment>
  );
}
function Ripple({ T, at, x, y, c = CORAL, R = 60 }) {
  const u = (T - at) / 0.8;
  if (u <= 0 || u >= 1) return null;
  return <circle cx={x} cy={y} r={12 + R * eo(u)} fill="none" stroke={c} strokeWidth={4} opacity={1 - u} />;
}

// cart drawn in its own frame: contact point at (0,0), body above
function Cart({ x, y, th = 0, led = null, T = 0, o = 1, flag = false, s = 1 }) {
  const blink = Math.floor(T * 2.5) % 2 ? 1 : 0.25;
  const wheel = (cx) => (
    <g transform={`translate(${cx} -16)`}>
      <circle r={16} fill="#ffffff" stroke={INK} strokeWidth={3.5} />
      <line x1={-10} y1={0} x2={10} y2={0} stroke={INK} strokeWidth={2} transform={`rotate(${(x / 16 / D2R) % 360})`} />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) rotate(${th}) scale(${s})`} opacity={o}>
      {flag && <rect x={-6} y={-150} width={12} height={84} fill={INK} />}
      <rect x={-92} y={-70} width={184} height={46} rx={10} fill={SAGE_T} stroke={INK} strokeWidth={3.5} />
      <rect x={-60} y={-60} width={82} height={24} rx={3} fill="#ffffff" stroke={INK} strokeWidth={2} />
      <text x={-19} y={-42} textAnchor="middle" fontFamily={MONO} fontSize={13} fontWeight={600} fill={INK}>0F1043A7</text>
      <circle cx={48} cy={-47} r={8} fill="#ffffff" stroke={INK} strokeWidth={2.5} />
      {led && <circle cx={72} cy={-47} r={6} fill={led} opacity={blink} />}
      {!led && <circle cx={72} cy={-47} r={6} fill="none" stroke={GREY} strokeWidth={2} />}
      {wheel(-58)}{wheel(58)}
    </g>
  );
}

// ---------- math type: ^7 superscript, _x subscript, ₀ ² ----------
function toks(str) {
  const out = []; let i = 0, buf = '';
  const push = (t, s) => { if (buf) { out.push(['n', buf]); buf = ''; } out.push([t, s]); };
  while (i < str.length) {
    const ch = str[i];
    if (ch === '^') { let j = i + 1, s = ''; if (str[j] === '−' || str[j] === '-') { s += '−'; j++; } while (j < str.length && /\d/.test(str[j])) { s += str[j]; j++; } push('sup', s); i = j; continue; }
    if (ch === '_') { if (str.slice(i + 1, i + 4) === 'net') { push('sub', 'net'); i += 4; continue; } push('sub', str[i + 1]); i += 2; continue; }
    if (ch === '₀') { push('sub', '0'); i++; continue; }
    if (ch === '²') { push('sup', '2'); i++; continue; }
    buf += ch; i++;
  }
  if (buf) out.push(['n', buf]);
  return out;
}
function M(str) {
  return toks(str).map(([t, s], k) => t === 'n' ? <React.Fragment key={k}>{s}</React.Fragment>
    : <span key={k} style={{ fontSize: '0.62em', verticalAlign: t === 'sup' ? '0.55em' : '-0.25em', lineHeight: 0, fontStyle: /\d|−/.test(s) ? 'normal' : 'inherit' }}>{s}</span>);
}
function MS(str) {
  const out = []; let k = 0;
  for (const [t, s] of toks(str)) {
    if (t === 'n') { out.push(<tspan key={k++}>{s}</tspan>); continue; }
    const d = t === 'sup' ? -0.5 : 0.28;
    out.push(<tspan key={k++} fontSize="0.62em" fontStyle={/\d|−/.test(s) ? 'normal' : undefined} dy={d + 'em'}>{s}</tspan>);
    out.push(<tspan key={k++} dy={(-d * 0.62) + 'em'}>{'\u200b'}</tspan>);
  }
  return out;
}
const arrowD = (x1, y1, x2, y2, h = 18) => { const a = Math.atan2(y2 - y1, x2 - x1); return `M ${x1} ${y1} L ${x2} ${y2} M ${x2 - h * Math.cos(a - 0.45)} ${y2 - h * Math.sin(a - 0.45)} L ${x2} ${y2} L ${x2 - h * Math.cos(a + 0.45)} ${y2 - h * Math.sin(a + 0.45)}`; };
const AST = [1, 0.82, 0.96, 0.74, 1, 0.86, 0.93, 0.78, 0.98, 0.8];
function Rock({ x, y, r = 22, spin = 0, o = 1 }) {
  const d = AST.map((k, i) => { const t = (i / AST.length) * Math.PI * 2; return (i ? 'L ' : 'M ') + (Math.cos(t) * k * r).toFixed(1) + ' ' + (Math.sin(t) * k * r).toFixed(1); }).join(' ') + ' Z';
  return <g transform={`translate(${x} ${y}) rotate(${spin})`} opacity={o}><path d={d} fill="#d7d8ea" stroke={INK} strokeWidth={3} strokeLinejoin="round" /><circle cx={-r * 0.3} cy={-r * 0.2} r={r * 0.18} fill="none" stroke={INK} strokeWidth={2} /></g>;
}
const Line = ({ T, at, top, left = 60, s, c = INK, size = 50, italic = true, mono = false }) => (
  <Reveal T={T} at={at} dur={1.0} style={{ left, top, fontFamily: mono ? MONO : SERIF, fontStyle: italic && !mono ? 'italic' : 'normal', fontWeight: mono ? 600 : 400, fontSize: size, color: c }}>{M(s)}</Reveal>
);
const Kicker = ({ T, at, top, left = 60, s, c = CORAL }) => <div style={{ position: 'absolute', left, top, opacity: env(T, at), fontFamily: MONO, fontSize: 30, fontWeight: 600, letterSpacing: '0.12em', color: c }}>{s}</div>;

const ORDER = ['Title', 'Intro', 'Rules', 'Box', 'Peak', 'Curve', 'Asteroid', 'Exit', 'Hold'];
const endOf = (C, n) => C[ORDER[ORDER.indexOf(n) + 1]];
const STOPS = {
  Intro: [1, 'PREDICT', 'A book rests on a desk. What forces act ON the book? Name each one and its direction.'],
  Rules: [2, 'WHITEBOARDS', 'A box is pushed to the right across a rough floor at constant speed. Draw its FBD.'],
  Box: [3, 'WHITEBOARDS', 'A ball is thrown straight up. Draw its FBD at the very top of its flight.'],
  Peak: [4, 'WHITEBOARDS', 'A car goes around a curve at constant speed. Draw its FBD. (A top view helps.)'],
  Asteroid: [5, 'DISCUSS', 'A deflection spacecraft hits 2026-XJ. What arrow does that add to the FBD, and which way does it point?'],
  Exit: [6, 'EXIT TICKET', 'Draw an FBD for a box pulled across a floor by a rope, with friction resisting the motion.'],
};
const STOP_KEYS = Object.keys(STOPS), LAST = STOP_KEYS[STOP_KEYS.length - 1];
const CW = 2000, CH = 1040;
const shot = (cx, cy) => [cx, cy - CH / 2 + 526 / 0.8, 0.8];
const POS = { Intro: [0, -1300], Rules: [2200, -1300], Box: [2200, 0], Peak: [0, 0], Curve: [-2200, 0], Asteroid: [-2200, 1300], Exit: [0, 1300] };
const Scene = ({ n, T, C, children, ph = 0 }) => <Card x={POS[n][0]} y={POS[n][1]} w={CW} h={CH} T={T} at={C[n] - 0.9} ph={ph}>{children}</Card>;
const Big = ({ T, at, top, left = 60, s, c = INK, size = 64, italic = false, w }) => (
  <div style={{ position: 'absolute', left, top, width: w, whiteSpace: w ? 'normal' : 'nowrap', opacity: env(T, at, 0.6), transform: `translateY(${(1 - env(T, at, 0.6)) * 14}px)`, fontFamily: SERIF, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: 1.2, color: c }}>{M(s)}</div>
);
const SV = ({ x, y, s, c, size = 44, an = 'start', o = 1 }) => o > 0 ? <text x={x} y={y} textAnchor={an} fontFamily={SERIF} fontStyle="italic" fontSize={size} fill={c} opacity={o}>{MS(s)}</text> : null;
const Arr = ({ x1, y1, x2, y2, c, w = 10, o = 1, h = 26, dash }) => o > 0 ? <path d={arrowD(x1, y1, x2, y2, h)} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} opacity={o} /> : null;
const Floor = ({ x0, x1, y, o = 1 }) => <g opacity={o}><line x1={x0} y1={y} x2={x1} y2={y} stroke={INK} strokeWidth={5} />{Array.from({ length: Math.floor((x1 - x0) / 60) }, (_, k) => <line key={k} x1={x0 + k * 60 + 10} y1={y + 4} x2={x0 + k * 60 - 14} y2={y + 26} stroke={GREY} strokeWidth={3} opacity={0.6} />)}</g>;
// FBD: dot + arrows [dx, dy, color, label, at]; label sits past the arrow tip
function FBD({ x, y, T, at, arrows, r = 18, off = 50 }) {
  const o = env(T, at, 0.6);
  if (o <= 0) return null;
  return (
    <g opacity={o}>
      {arrows.map(([dx, dy, c, lab, a], i) => { const e = eo((T - a) / 0.7); if (e <= 0) return null; const L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L; const lp = arrows[i][5]; const lx = lp ? x + lp[0] : x + ux * r + dx + ux * off, ly = lp ? y + lp[1] : y + uy * r + dy + uy * off + (Math.abs(uy) > 0.5 ? (uy > 0 ? 20 : 8) : 12); return <g key={i}><Arr x1={x + ux * r} y1={y + uy * r} x2={x + ux * r + dx * e} y2={y + uy * r + dy * e} c={c} w={9} h={22} /><SV x={lx} y={ly} s={lab} c={c} size={38} an={lp ? 'middle' : Math.abs(ux) > 0.5 ? (ux > 0 ? 'start' : 'end') : 'middle'} o={e} /></g>; })}
      <circle cx={x} cy={y} r={r} fill={INK} />
    </g>
  );
}
const Fg = 'F_g (gravity)', Fn = 'F_N (normal)';
function TitleN({ T, C }) {
  const a = C.Title - 1.2;
  return (
    <div style={{ position: 'absolute', left: -800, top: -3000, width: 1600, height: 800 }}>
      <Reveal T={T} at={a + 0.6} dur={1.0} style={{ left: 0, top: 70, fontFamily: MONO, fontSize: 34, fontWeight: 600, letterSpacing: '0.14em', color: CORAL }}>DAY 15 · BUILDING THE TOOLS</Reveal>
      <Reveal T={T} at={a + 1.0} dur={1.6} style={{ left: -4, top: 120, fontFamily: SERIF, fontSize: 150, lineHeight: 1.0, color: INK }}>Free body diagrams</Reveal>
      <Reveal T={T} at={a + 1.8} dur={1.6} style={{ left: -4, top: 270, fontFamily: SERIF, fontStyle: 'italic', fontSize: 110, lineHeight: 1.1, color: INDIGO }}>part 1</Reveal>
      <Reveal T={T} at={a + 3.4} dur={1.6} style={{ left: 0, top: 460, fontFamily: SERIF, fontStyle: 'italic', fontSize: 56, color: INDIGO }}>S5 · Draw a complete FBD — every force, arrows sized to strength.</Reveal>
      <div style={{ position: 'absolute', left: 0, top: 590, opacity: env(T, a + 4.4), fontFamily: MONO, fontSize: 30, fontWeight: 500, color: GREY }}>Space: play / continue · N: next section · B: back</div>
    </div>
  );
}
function Intro({ T, C }) {
  const i = C.Intro, shrink = eio((T - (i + 5)) / 1.4), bx = 1000, by = 640;
  const w = lerp(240, 36, shrink), h = lerp(70, 36, shrink);
  return (
    <Scene n="Intro" T={T} C={C} ph={0.2}>
      <Kicker T={T} at={i + 0.3} top={44} s="WHY FBDs?" />
      <Big T={T} at={i + 0.6} top={92} w={1880} s="A free body diagram shows every force acting on ONE object. Once you can draw the forces, you can use F = ma." size={52} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={(1 - shrink) * env(T, i + 2)}><rect x={620} y={by + 0} width={760} height={40} fill="#d7d8ea" stroke={INK} strokeWidth={4} /><line x1={680} y1={by + 40} x2={680} y2={by + 240} stroke={INK} strokeWidth={8} /><line x1={1320} y1={by + 40} x2={1320} y2={by + 240} stroke={INK} strokeWidth={8} /></g>
        <rect x={bx - w / 2} y={by - h} width={w} height={h} rx={lerp(6, 18, shrink)} fill={shrink > 0.9 ? INK : CORAL_T} stroke={INK} strokeWidth={4} opacity={env(T, i + 2)} />
        <SV x={bx} y={by - 110} s="book" c={INK} size={44} an="middle" o={env(T, i + 2) * (1 - shrink)} />
        <SV x={bx + 60} y={by - 4} s="the book, as a dot" c={GREY} size={40} o={env(T, i + 6.6)} />
      </svg>
      <Big T={T} at={i + 4} top={300} s="Step 1: draw just the object." size={54} c={INDIGO} italic />
    </Scene>
  );
}
const RULES = ['Draw just the object (or a dot).', 'One arrow for EACH force on it.', 'Arrows point the way the force acts.', 'Arrow length ∝ force size.', 'Label every arrow.', 'Only forces ON the object.'];
function Rules({ T, C }) {
  const r = C.Rules;
  return (
    <Scene n="Rules" T={T} C={C} ph={0.6}>
      <Kicker T={T} at={r + 0.3} top={44} s="ANSWER · TWO FORCES" c={SAGE} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <FBD x={1480} y={520} T={T} at={r + 0.6} arrows={[[0, 220, INDIGO, Fg, r + 1], [0, -220, SAGE, Fn, r + 2.4]]} />
        <SV x={1480} y={940} s="equal lengths: forces balance" c={GREY} size={38} an="middle" o={env(T, r + 3.6)} />
        <g opacity={win(T, r + 15, C.Box, 0.5)}><Arr x1={1180} y1={720} x2={1180} y2={860} c={CORAL} w={8} h={20} dash="12 10" /><path d="M 1140 700 L 1220 880 M 1220 700 L 1140 880" stroke={CORAL} strokeWidth={6} /><SV x={1160} y={690} s="book on desk: NOT on the book" c={CORAL} size={34} an="end" /></g>
      </svg>
      <Kicker T={T} at={r + 4.6} top={130} s="THE RULES" />
      <div style={{ position: 'absolute', left: 60, top: 180, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {RULES.map((t, k) => <div key={k} style={{ opacity: env(T, r + 5 + k * 1.4, 0.5), transform: `translateX(${(1 - env(T, r + 5 + k * 1.4, 0.5)) * -20}px)`, display: 'flex', alignItems: 'center', gap: 22 }}>
          <div style={{ width: 54, height: 54, borderRadius: 27, flex: 'none', background: k === 5 ? CORAL : INDIGO, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 28, fontWeight: 600 }}>{k + 1}</div>
          <div style={{ fontFamily: SERIF, fontSize: 50, color: k === 5 ? CORAL : INK }}>{M(t)}</div>
        </div>)}
      </div>
    </Scene>
  );
}
function Box({ T, C }) {
  const b = C.Box;
  return (
    <Scene n="Box" T={T} C={C} ph={0.9}>
      <Kicker T={T} at={b + 0.3} top={44} s="ANSWER · BOX PUSHED AT CONSTANT SPEED" c={SAGE} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <FBD x={700} y={540} T={T} at={b + 0.6} arrows={[[0, 220, INDIGO, Fg, b + 1], [0, -220, SAGE, Fn, b + 2], [260, 0, CORAL, 'F_a (push)', b + 3], [-260, 0, GREY, 'F_f (friction)', b + 4]]} />
      </svg>
      <Big T={T} at={b + 5.4} top={180} left={1180} w={760} s="Constant speed: a = 0, so the net force is 0." size={48} />
      <Big T={T} at={b + 8} top={340} left={1180} w={760} s="Push = friction (same length). Gravity = normal (same length)." size={46} c={INDIGO} italic />
      <Big T={T} at={b + 12} top={560} left={1180} w={760} s="If the box sped up, the push arrow would be longer than friction." size={42} italic c={GREY} />
    </Scene>
  );
}
function Peak({ T, C }) {
  const p = C.Peak, loop = ((T - p) % 3.4 + 3.4) % 3.4 / 3.4, by = 820 - 560 * (1 - (2 * loop - 1) ** 2);
  return (
    <Scene n="Peak" T={T} C={C} ph={0.4}>
      <Kicker T={T} at={p + 0.3} top={44} s="ANSWER · ONE FORCE" c={SAGE} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, p + 0.4)}><line x1={300} y1={850} x2={700} y2={850} stroke={INK} strokeWidth={5} /><circle cx={500} cy={by} r={26} fill={CORAL_T} stroke={INK} strokeWidth={4} /><line x1={460} y1={260} x2={540} y2={260} stroke={GREY} strokeWidth={3} strokeDasharray="8 8" /><SV x={560} y={270} s="the top: v = 0" c={GREY} size={36} /></g>
        <FBD x={1100} y={420} T={T} at={p + 2} arrows={[[0, 240, INDIGO, Fg, p + 2.6]]} />
      </svg>
      <Big T={T} at={p + 4} top={180} left={1300} w={640} s="Only gravity. No “upward force from the throw”: that push ended when the ball left your hand." size={44} />
      <Kicker T={T} at={p + 9} top={620} left={1300} s="COMMON ERRORS" c={CORAL} />
      <Big T={T} at={p + 9.4} top={670} left={1300} w={640} s="Momentum and inertia are NOT forces. Never draw them as arrows." size={44} c={CORAL} />
      <Big T={T} at={p + 12.6} top={850} left={1300} w={640} s="Also watch for a missing normal or friction force." size={40} italic c={GREY} />
    </Scene>
  );
}
function Curve({ T, C }) {
  const c = C.Curve, ang = (T - c) * 0.9, R = 220, cx = 520, cy = 560;
  const px = cx + R * Math.cos(ang), py = cy + R * Math.sin(ang);
  return (
    <Scene n="Curve" T={T} C={C} ph={0.5}>
      <Kicker T={T} at={c + 0.3} top={44} s="ANSWER · CAR ON A CURVE" c={SAGE} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, c + 0.6)}>
          <circle cx={cx} cy={cy} r={R} fill="none" stroke={TINT} strokeWidth={50} />
          <circle cx={cx} cy={cy} r={6} fill={GREY} />
          <SV x={cx} y={cy - 280} s="top view" c={GREY} size={36} an="middle" />
          <rect x={px - 30} y={py - 18} width={60} height={36} rx={8} fill={SAGE_T} stroke={INK} strokeWidth={3} transform={`rotate(${ang / D2R + 90} ${px} ${py})`} />
          <Arr x1={px} y1={py} x2={px + (cx - px) * 0.55} y2={py + (cy - py) * 0.55} c={CORAL} w={8} h={20} o={env(T, c + 2)} />
        </g>
        <SV x={cx} y={cy + 320} s="friction points to the centre" c={CORAL} size={38} an="middle" o={env(T, c + 2)} />
        <FBD x={1300} y={560} T={T} at={c + 4} arrows={[[0, 200, INDIGO, Fg, c + 4.4], [0, -200, SAGE, Fn, c + 5.2], [-240, 0, CORAL, 'F_f (toward centre)', c + 6.2]]} />
      </svg>
      <Big T={T} at={c + 8} top={130} left={1000} w={940} s="Constant speed, but changing direction: the car is accelerating, so the net force isn’t zero." size={42} />
      <Big T={T} at={c + 12} top={880} left={1000} w={940} s="That sideways friction is what turns the car." size={42} italic c={GREY} />
    </Scene>
  );
}
function Asteroid({ T, C }) {
  const a = C.Asteroid;
  return (
    <Scene n="Asteroid" T={T} C={C} ph={0.8}>
      <Kicker T={T} at={a + 0.3} top={44} s="FBD · 2026-XJ AS IT APPROACHES" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <circle cx={200} cy={300} r={70} fill={CORAL_T} stroke={CORAL} strokeWidth={4} opacity={env(T, a + 0.6)} />
        <SV x={200} y={314} s="Sun" c={CORAL} size={38} an="middle" o={env(T, a + 0.6)} />
        <circle cx={1700} cy={300} r={40} fill="#d7d8ea" stroke={INK} strokeWidth={4} opacity={env(T, a + 0.6)} />
        <SV x={1700} y={380} s="Earth" c={INK} size={38} an="middle" o={env(T, a + 0.6)} />
        <FBD x={1000} y={560} T={T} at={a + 1.4} r={28} arrows={[[-300, -95, CORAL, 'F_g Sun (dominant)', a + 2, [-200, -150]], [56, -19, INDIGO, 'F_g Earth', a + 4, [90, -70]]]} />
      </svg>
      <Big T={T} at={a + 6} top={760} w={1880} s="Other planets: so small we leave them off. No friction, no normal force: it’s in space." size={46} />
      <Big T={T} at={a + 9.4} top={860} w={1880} s="Arrow lengths here are not to scale: the Sun’s pull is far bigger." size={40} italic c={GREY} />
    </Scene>
  );
}
function Exit({ T, C }) {
  const e = C.Exit, by = 760;
  return (
    <Scene n="Exit" T={T} C={C} ph={0.3}>
      <div style={{ position: 'absolute', left: 60, top: 40, width: 1880, whiteSpace: 'normal', opacity: env(T, e + 0.3), fontFamily: MONO, fontSize: 34, fontWeight: 600, lineHeight: 1.35, color: SAGE }}>STOP 5 · An applied force from the impact, pointing the way the spacecraft was moving.</div>
      <Kicker T={T} at={e + 2.4} top={160} s="EXIT TICKET" />
      <Big T={T} at={e + 2.8} top={210} s="A box pulled by a rope. Friction resists." size={66} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Floor x0={300} x1={1700} y={by} o={env(T, e + 3.4)} />
        <rect x={720} y={by - 150} width={200} height={150} rx={8} fill={CORAL_T} stroke={INK} strokeWidth={4} opacity={env(T, e + 3.4)} />
        <line x1={920} y1={by - 75} x2={1260} y2={by - 75} stroke={GREY} strokeWidth={5} opacity={env(T, e + 3.4)} />
        <SV x={1280} y={by - 64} s="rope" c={GREY} size={40} o={env(T, e + 3.4)} />
        <SV x={1500} y={by - 220} s="draw its FBD" c={INDIGO} size={52} an="middle" o={env(T, e + 4.4)} />
      </svg>
    </Scene>
  );
}
function StopBand({ T, C }) {
  for (const n of STOP_KEYS) {
    const end = endOf(C, n), o = clamp((T - (end - 3)) / 0.5, 0, 1) * (n === LAST ? 1 : clamp((end + 0.3 - T) / 0.3, 0, 1));
    if (o <= 0) continue;
    const [num, kind, q] = STOPS[n];
    return (
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 300, opacity: o, transform: `translateY(${(1 - o) * 40}px)`, background: INK, padding: '26px 70px 32px', display: 'flex', alignItems: 'center', gap: 50, boxSizing: 'border-box' }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ padding: '6px 18px', borderRadius: 6, background: CORAL, color: '#ffffff', fontFamily: MONO, fontSize: 30, fontWeight: 600, letterSpacing: '0.1em' }}>{`STOP ${num}`}</div>
            <div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 600, letterSpacing: '0.12em', color: '#f0a58a' }}>{kind}</div>
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 50, lineHeight: 1.2, color: '#f6f6fb', whiteSpace: 'normal', textWrap: 'pretty' }}>{M(q)}</div>
        </div>
        <div style={{ flex: 'none', fontFamily: MONO, fontSize: 26, fontWeight: 500, color: '#b9bad6', textAlign: 'right', lineHeight: 1.5 }}>Space · continue<br></br>B · replay section</div>
      </div>
    );
  }
  return null;
}





function shots15(C) {
  const o = (t, d, p, dip = 0.3, r = 0) => ({ t, d, x: p[0], y: p[1], z: p[2], r, dip });
  const S = (n) => shot(...POS[n]);
  return [
    { t: -1, d: 0, x: 0, y: -2700, z: 1.15, r: -2, dip: 0 }, { t: C.Title, d: 5, x: 0, y: -2680, z: 1.0, r: 0, dip: 0 },
    ...['Intro', 'Rules', 'Box', 'Peak', 'Curve', 'Asteroid', 'Exit'].map((n) => o(C[n], 1.9, S(n))),
  ];
}
function Piece({ tw }) {
  const { T, CUES: C, time } = useComposition();
  const tl = useTimeline();
  const prev = React.useRef(T), live = React.useRef({});
  live.current = { T, C, tl };
  React.useEffect(() => {
    const p = prev.current; prev.current = T;
    if (tw.stops === false || !tl.playing || T - p > 1 || T <= p) return;
    for (const n of STOP_KEYS) { const st = endOf(C, n) - 0.4; if (p < st && T >= st) { tl.setPlaying(false); break; } }
  });
  React.useEffect(() => {
    const h = (e) => {
      const { T, C, tl } = live.current;
      if (e.code === 'KeyN') { const n = ORDER.find((k) => C[k] > T + 0.05); if (n) { tl.setTime(C[n]); tl.setPlaying(true); } }
      if (e.code === 'KeyB') { const cur = [...ORDER].reverse().find((k) => C[k] <= T - 0.6); if (cur) { tl.setTime(C[cur]); tl.setPlaying(true); } }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  const cam = camAt(T, shots15(C));
  const tf = `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) rotate(${-cam.r}deg) translate(${-cam.x}px, ${-cam.y}px)`;
  const layer = { position: 'absolute', left: 0, top: 0, width: 0, height: 0, whiteSpace: 'nowrap', transformOrigin: '0 0', transform: tf };
  return (
    <div data-screen-label={`t=${Math.floor(time || 0)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG, fontVariantNumeric: 'lining-nums' }}>
      <div style={layer}><WorldGrid z={cam.z} on={tw.grid !== false} /></div>
      <Parallax cam={cam} T={T} />
      <div style={layer}>
        <TitleN T={T} C={C} />
        <Intro T={T} C={C} />
        <Rules T={T} C={C} />
        <Box T={T} C={C} />
        <Peak T={T} C={C} />
        <Curve T={T} C={C} />
        <Asteroid T={T} C={C} />
        <Exit T={T} C={C} />
      </div>
      <StopBand T={T} C={C} />
    </div>
  );
}
function FbdDay15App() {
  const [tw, setTweak] = useTweaks(window.TWEAK_DEFAULTS);
  return (
    <React.Fragment>
      <CompositionStage width={1920} height={1080} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg="#22233a">
        <Piece tw={tw} />
      </CompositionStage>
      <TweaksPanel>
        <TweakSection label="Teaching" />
        <TweakToggle label="Pause at stop points" value={tw.stops !== false} onChange={(v) => setTweak('stops', v)} />
        <TweakToggle label="Coordinate grid" value={tw.grid !== false} onChange={(v) => setTweak('grid', v)} />
      </TweaksPanel>
    </React.Fragment>
  );
}
window.FbdDay15App = FbdDay15App;





