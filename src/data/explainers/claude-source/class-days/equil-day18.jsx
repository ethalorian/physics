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

const ORDER = ['Title', 'Recap', 'Scenarios', 'Ropes', 'Space', 'Exit', 'Hold'];
const endOf = (C, n) => C[ORDER[ORDER.indexOf(n) + 1]];
const STOPS = {
  Recap: [1, 'DISCUSS', 'Which are in equilibrium? A parked car · a car cruising straight at a steady 25 m/s · a car turning a corner at 25 m/s · a ball at the top of its throw.'],
  Scenarios: [2, 'YOUR TURN', 'A 3 kg box is pushed across a rough floor at constant velocity with 12 N. Find the friction force and the normal force.'],
  Ropes: [3, 'PAIRS', 'Same 10 kg sign, but both ropes at 60° above horizontal. Find T. Steeper or flatter ropes: which needs less tension?'],
  Exit: [4, 'EXIT TICKET', 'A 5 kg lamp hangs from a single rope. What is the tension in the rope?'],
};
const STOP_KEYS = Object.keys(STOPS), LAST = STOP_KEYS[STOP_KEYS.length - 1];
const CW = 2000, CH = 1040;
const shot = (cx, cy) => [cx, cy - CH / 2 + 526 / 0.8, 0.8];
const POS = { Recap: [0, -1300], Scenarios: [2200, -1300], Ropes: [2200, 0], Space: [0, 0], Exit: [-2200, 0] };
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

const Fg = 'F_g', Fn = 'F_N';
function TitleN({ T, C }) {
  const a = C.Title - 1.2;
  return (
    <div style={{ position: 'absolute', left: -800, top: -3000, width: 1600, height: 800 }}>
      <Reveal T={T} at={a + 0.6} dur={1.0} style={{ left: 0, top: 70, fontFamily: MONO, fontSize: 34, fontWeight: 600, letterSpacing: '0.14em', color: CORAL }}>DAY 18 · BUILDING THE TOOLS</Reveal>
      <Reveal T={T} at={a + 1.0} dur={1.6} style={{ left: -4, top: 120, fontFamily: SERIF, fontSize: 150, lineHeight: 1.0, color: INK }}>Equilibrium</Reveal>
      <Reveal T={T} at={a + 1.8} dur={1.6} style={{ left: -4, top: 270, fontFamily: SERIF, fontStyle: 'italic', fontSize: 100, lineHeight: 1.1, color: INDIGO }}>when forces balance</Reveal>
      <Reveal T={T} at={a + 3.4} dur={1.6} style={{ left: 0, top: 460, fontFamily: SERIF, fontStyle: 'italic', fontSize: 56, color: INDIGO }}>R11 · Spot ΣF = 0 and use it to find an unknown force.</Reveal>
      <div style={{ position: 'absolute', left: 0, top: 590, opacity: env(T, a + 4.4), fontFamily: MONO, fontSize: 30, fontWeight: 500, color: GREY }}>Space: play / continue · N: next section · B: back</div>
    </div>
  );
}
function Recap({ T, C }) {
  const r = C.Recap;
  return (
    <Scene n="Recap" T={T} C={C} ph={0.2}>
      <Kicker T={T} at={r + 0.3} top={44} s="RECAP · F = ma" />
      <Big T={T} at={r + 0.6} top={100} s="If a = 0, then F_net = 0." size={80} />
      <div style={{ position: 'absolute', left: 50, top: 230, opacity: env(T, r + 2.6), padding: '6px 36px 12px', borderRadius: 12, border: `4px solid ${SAGE}`, background: SAGE_T, fontFamily: SERIF, fontSize: 90, color: INK }}>{M('Equilibrium: ΣF = 0')}</div>
      <div style={{ position: 'absolute', left: 60, top: 440, display: 'flex', gap: 40 }}>
        {[['AT REST', 'v = 0, stays 0'], ['CONSTANT VELOCITY', 'same speed, same direction']].map(([k, v], i) => <div key={i} style={{ width: 880, opacity: env(T, r + 4.6 + i * 1.4), borderRadius: 10, border: `3px solid ${INDIGO}`, background: '#ffffff', padding: '22px 30px', boxSizing: 'border-box' }}>
          <div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 600, letterSpacing: '0.1em', color: INDIGO }}>{k}</div>
          <div style={{ fontFamily: SERIF, fontSize: 50, color: INK, marginTop: 6 }}>{v}</div>
        </div>)}
      </div>
      <Big T={T} at={r + 7.4} top={660} s="Both have a = 0. Both are equilibrium." size={56} c={SAGE} italic />
    </Scene>
  );
}
function Scenarios({ T, C }) {
  const s = C.Scenarios, bx = 1460 + ((T - s) * 60) % 300;
  return (
    <Scene n="Scenarios" T={T} C={C} ph={0.6}>
      <div style={{ position: 'absolute', left: 60, top: 40, width: 1880, whiteSpace: 'normal', opacity: env(T, s + 0.3), fontFamily: MONO, fontSize: 32, fontWeight: 600, lineHeight: 1.35, color: SAGE }}>STOP 1 · Parked: yes. Cruising straight: yes. Turning: no (direction changes). Ball at the top: no (gravity is the only force).</div>
      <Kicker T={T} at={s + 3} top={160} s="1 · A BOOK AT REST" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <FBD x={300} y={560} T={T} at={s + 3.4} arrows={[[0, 200, INDIGO, 'F_g = 9.8 N', s + 3.8], [0, -200, SAGE, 'F_N = ?', s + 4.4]]} />
        <Floor x0={1180} x1={1900} y={720} o={env(T, s + 9)} />
        <rect x={bx - 70} y={600} width={140} height={120} rx={6} fill={CORAL_T} stroke={INK} strokeWidth={4} opacity={env(T, s + 9)} />
        <Arr x1={bx - 220} y1={660} x2={bx - 80} y2={660} c={CORAL} w={9} h={22} o={env(T, s + 10)} />
        <SV x={bx - 150} y={630} s="20 N" c={CORAL} size={38} an="middle" o={env(T, s + 10)} />
        <Arr x1={bx - 80} y1={705} x2={bx - 200} y2={705} c={GREY} w={9} h={22} o={env(T, s + 11)} />
        <SV x={bx - 230} y={712} s="f = ?" c={GREY} size={38} an="end" o={env(T, s + 11)} />
      </svg>
      <Big T={T} at={s + 5.6} top={400} left={520} w={600} s="ΣF_y = 0" size={56} italic c={INDIGO} />
      <Big T={T} at={s + 6.8} top={480} left={520} w={600} s="F_N − 9.8 N = 0 → F_N = 9.8 N" size={44} italic />
      <Kicker T={T} at={s + 8.6} top={160} left={1180} s="2 · A BOX AT CONSTANT VELOCITY" />
      <Big T={T} at={s + 12} top={800} left={1180} w={760} s="ΣF_x = 0 → friction = 20 N, whatever the mass." size={44} c={INDIGO} />
      <Big T={T} at={s + 15} top={900} w={1880} s="Equilibrium works in every direction at once: ΣF_x = 0 AND ΣF_y = 0." size={44} italic c={GREY} />
    </Scene>
  );
}
const KX = 760, KY = 560, RL = 440, A30 = 30 * D2R;
function Ropes({ T, C }) {
  const r = C.Ropes, swing = 2 * Math.sin(T * 1.4) * (1 - env(T, r + 4, 1));
  const L = [KX - RL * Math.cos(A30), KY - RL * Math.sin(A30)], R = [KX + RL * Math.cos(A30), KY - RL * Math.sin(A30)];
  const TL = 200, tx = TL * Math.cos(A30), ty = TL * Math.sin(A30);
  const lines = [
    [r + 7.6, 'ΣF_x = 0: the T cos 30° parts cancel ✓', GREY],
    [r + 10, 'ΣF_y = 0:  T sin 30° + T sin 30° − mg = 0', INDIGO],
    [r + 12.4, '2T(0.5) = (10)(9.8) → T = 98 N', INK],
  ];
  return (
    <Scene n="Ropes" T={T} C={C} ph={0.9}>
      <div style={{ position: 'absolute', left: 60, top: 40, opacity: env(T, r + 0.3), fontFamily: MONO, fontSize: 36, fontWeight: 600, color: SAGE }}>{M('STOP 2 · friction = 12 N (ΣF_x = 0) · F_N = (3)(9.8) = 29.4 N (ΣF_y = 0)')}</div>
      <Kicker T={T} at={r + 2.4} top={120} s="TOUGHER · A 10 kg SIGN ON TWO ROPES AT 30°" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, r + 2.8)} transform={`rotate(${swing} ${KX} ${L[1]})`}>
          <line x1={L[0] - 60} y1={L[1]} x2={R[0] + 60} y2={R[1]} stroke={INK} strokeWidth={8} />
          <line x1={L[0]} y1={L[1]} x2={KX} y2={KY} stroke={GREY} strokeWidth={5} />
          <line x1={R[0]} y1={R[1]} x2={KX} y2={KY} stroke={GREY} strokeWidth={5} />
          <line x1={KX} y1={KY} x2={KX} y2={KY + 80} stroke={GREY} strokeWidth={5} />
          <rect x={KX - 160} y={KY + 80} width={320} height={130} rx={8} fill={CORAL_T} stroke={INK} strokeWidth={4} />
          <text x={KX} y={KY + 160} textAnchor="middle" fontFamily={SERIF} fontSize={48} fill={INK}>OPEN</text>
          <path d={`M ${L[0] + 90} ${L[1]} A 90 90 0 0 1 ${L[0] + 90 * Math.cos(A30)} ${L[1] + 90 * Math.sin(A30)}`} fill="none" stroke={CORAL} strokeWidth={3} />
          <SV x={L[0] + 100} y={L[1] + 40} s="30°" c={CORAL} size={34} />
        </g>
        <circle cx={KX} cy={KY} r={12} fill={INK} opacity={env(T, r + 4)} />
        <Arr x1={KX} y1={KY} x2={KX - tx} y2={KY - ty} c={INDIGO} w={8} h={20} o={env(T, r + 4)} />
        <Arr x1={KX} y1={KY} x2={KX + tx} y2={KY - ty} c={INDIGO} w={8} h={20} o={env(T, r + 4)} />
        <SV x={KX - tx - 20} y={KY - ty - 16} s="T" c={INDIGO} size={40} an="end" o={env(T, r + 4)} />
        <SV x={KX + tx + 20} y={KY - ty - 16} s="T" c={INDIGO} size={40} o={env(T, r + 4)} />
        <Arr x1={KX + tx} y1={KY} x2={KX + tx} y2={KY - ty} c={SAGE} w={6} h={16} dash="10 8" o={env(T, r + 5.6)} />
        <Arr x1={KX} y1={KY + 4} x2={KX + tx} y2={KY + 4} c={GREY} w={6} h={16} dash="10 8" o={env(T, r + 5.6)} />
        <SV x={KX + tx + 14} y={KY - ty / 2 + 12} s="T sin 30°" c={SAGE} size={32} o={env(T, r + 5.6)} />
        <SV x={KX + tx / 2} y={KY + 44} s="T cos 30°" c={GREY} size={32} an="middle" o={env(T, r + 5.6)} />
      </svg>
      {lines.map(([at, t, c], k) => <Big key={k} T={T} at={at} top={330 + k * 92} left={1280} w={680} s={t} size={40} italic c={c} />)}
      <div style={{ position: 'absolute', left: 1270, top: 660, opacity: env(T, r + 14.6), padding: '8px 22px', borderRadius: 10, border: `3px solid ${SAGE}`, background: SAGE_T, fontFamily: SERIF, fontSize: 44, color: INK }}>T = 98 N in each rope</div>
      <Big T={T} at={r + 16.4} top={790} left={1280} w={680} s="That’s the full weight in EACH rope: shallow ropes need big tension." size={38} italic c={GREY} />
    </Scene>
  );
}
function Space({ T, C }) {
  const p = C.Space, S = [480, 600], ang = (T - p) * 0.12, R = 400;
  const ax = S[0] + R * Math.cos(ang - 0.5), ay = S[1] + R * Math.sin(ang - 0.5) * 0.55;
  return (
    <Scene n="Space" T={T} C={C} ph={0.4}>
      <div style={{ position: 'absolute', left: 60, top: 40, width: 1880, whiteSpace: 'normal', opacity: env(T, p + 0.3), fontFamily: MONO, fontSize: 32, fontWeight: 600, lineHeight: 1.35, color: SAGE }}>{M('STOP 3 · 2T sin 60° = 98 → T ≈ 56.6 N. Steeper ropes need less tension: more of each pull points up.')}</div>
      <Kicker T={T} at={p + 3} top={160} s="FORESHADOW · UNIT 2" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <circle cx={S[0]} cy={S[1]} r={80} fill={CORAL_T} stroke={CORAL} strokeWidth={4} opacity={env(T, p + 3.4)} />
        <SV x={S[0]} y={S[1] + 14} s="Sun" c={CORAL} size={40} an="middle" o={env(T, p + 3.4)} />
        <ellipse cx={S[0]} cy={S[1]} rx={R} ry={R * 0.55} fill="none" stroke={TINT} strokeWidth={3} strokeDasharray="10 10" opacity={env(T, p + 3.4)} />
        <Rock x={ax} y={ay} r={30} spin={T * 12} o={env(T, p + 3.4)} />
        <Arr x1={ax - 34 * Math.cos(Math.atan2(ay - S[1], ax - S[0]))} y1={ay - 34 * Math.sin(Math.atan2(ay - S[1], ax - S[0]))} x2={ax - 150 * Math.cos(Math.atan2(ay - S[1], ax - S[0]))} y2={ay - 150 * Math.sin(Math.atan2(ay - S[1], ax - S[0]))} c={CORAL} w={8} h={20} o={env(T, p + 5)} />
      </svg>
      <Big T={T} at={p + 4} top={230} left={1000} w={940} s="2026-XJ is NOT in equilibrium. The Sun’s gravity is always pulling on it." size={46} />
      <Big T={T} at={p + 8} top={420} left={1000} w={940} s="Its acceleration is small, so over minutes or hours its velocity barely changes." size={44} c={INDIGO} />
      <Big T={T} at={p + 12} top={600} left={1000} w={940} s="Over short times we can treat its velocity as constant. Over months, we can’t: that’s Unit 2." size={42} italic c={GREY} />
    </Scene>
  );
}
function Exit({ T, C }) {
  const e = C.Exit, sw = 3 * Math.sin(T * 1.2);
  return (
    <Scene n="Exit" T={T} C={C} ph={0.3}>
      <Kicker T={T} at={e + 0.3} top={44} s="EXIT TICKET" />
      <Big T={T} at={e + 0.6} top={110} s="A 5 kg lamp, one rope." size={80} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, e + 1.4)} transform={`rotate(${sw} 1000 300)`}>
          <line x1={800} y1={300} x2={1200} y2={300} stroke={INK} strokeWidth={8} />
          <line x1={1000} y1={300} x2={1000} y2={620} stroke={GREY} strokeWidth={5} />
          <path d="M 920 700 L 1080 700 L 1040 620 L 960 620 Z" fill={CORAL_T} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <circle cx={1000} cy={720} r={20} fill="#fff6c8" stroke={INK} strokeWidth={3} />
        </g>
        <SV x={1060} y={480} s="T = ?" c={INDIGO} size={58} o={env(T, e + 2.4)} />
        <SV x={1110} y={680} s="5 kg" c={GREY} size={44} o={env(T, e + 2.4)} />
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








function shots18(C) {
  const o = (t, d, p, dip = 0.3, r = 0) => ({ t, d, x: p[0], y: p[1], z: p[2], r, dip });
  const S = (n) => shot(...POS[n]);
  return [
    { t: -1, d: 0, x: 0, y: -2700, z: 1.15, r: -2, dip: 0 }, { t: C.Title, d: 5, x: 0, y: -2680, z: 1.0, r: 0, dip: 0 },
    ...['Recap', 'Scenarios', 'Ropes', 'Space', 'Exit'].map((n) => o(C[n], 1.9, S(n))),
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
  const cam = camAt(T, shots18(C));
  const tf = `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) rotate(${-cam.r}deg) translate(${-cam.x}px, ${-cam.y}px)`;
  const layer = { position: 'absolute', left: 0, top: 0, width: 0, height: 0, whiteSpace: 'nowrap', transformOrigin: '0 0', transform: tf };
  return (
    <div data-screen-label={`t=${Math.floor(time || 0)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG, fontVariantNumeric: 'lining-nums' }}>
      <div style={layer}><WorldGrid z={cam.z} on={tw.grid !== false} /></div>
      <Parallax cam={cam} T={T} />
      <div style={layer}>
        <TitleN T={T} C={C} />
        <Recap T={T} C={C} />
        <Scenarios T={T} C={C} />
        <Ropes T={T} C={C} />
        <Space T={T} C={C} />
        <Exit T={T} C={C} />
      </div>
      <StopBand T={T} C={C} />
    </div>
  );
}
function EquilDay18App() {
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
window.EquilDay18App = EquilDay18App;








