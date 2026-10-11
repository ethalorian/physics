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

const ORDER = ['Title', 'Recap', 'Net', 'Types', 'Car', 'Friction', 'Exit', 'Hold'];
const endOf = (C, n) => C[ORDER[ORDER.indexOf(n) + 1]];
const STOPS = {
  Recap: [1, 'QUICK CHECK', 'A 5 kg object is pushed with a 10 N force. What is its acceleration?'],
  Net: [2, 'YOUR TURN', 'A 4 kg box: pulled forward with 30 N, friction resists with 6 N. Find the net force, then a.'],
  Types: [3, 'PAIRS', 'Work the problem set. Every problem: list the forces, find the NET force, then use F = ma.'],
  Car: [4, 'YOUR TURN', 'Solve it: what net force stops the 1500 kg car in 5 s? Which direction does it point?'],
  Friction: [5, 'DISCUSS', 'A car cruises at a steady 25 m/s. How does the engine force compare with friction? How do you know?'],
  Exit: [6, 'EXIT TICKET', 'A 2 kg cart is pushed with 12 N; friction is 4 N. Find a. Did you find the NET force first?'],
};
const STOP_KEYS = Object.keys(STOPS), LAST = STOP_KEYS[STOP_KEYS.length - 1];
const CW = 2000, CH = 1040;
const shot = (cx, cy) => [cx, cy - CH / 2 + 526 / 0.8, 0.8];
const POS = { Recap: [0, -1300], Net: [2200, -1300], Types: [2200, 0], Car: [0, 0], Friction: [-2200, 0], Exit: [-2200, 1300] };
const Scene = ({ n, T, C, children, ph = 0 }) => <Card x={POS[n][0]} y={POS[n][1]} w={CW} h={CH} T={T} at={C[n] - 0.9} ph={ph}>{children}</Card>;
const Big = ({ T, at, top, left = 60, s, c = INK, size = 64, italic = false, w }) => (
  <div style={{ position: 'absolute', left, top, width: w, whiteSpace: w ? 'normal' : 'nowrap', opacity: env(T, at, 0.6), transform: `translateY(${(1 - env(T, at, 0.6)) * 14}px)`, fontFamily: SERIF, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: 1.2, color: c }}>{M(s)}</div>
);
const SV = ({ x, y, s, c, size = 44, an = 'start', o = 1 }) => o > 0 ? <text x={x} y={y} textAnchor={an} fontFamily={SERIF} fontStyle="italic" fontSize={size} fill={c} opacity={o}>{MS(s)}</text> : null;
const Arr = ({ x1, y1, x2, y2, c, w = 10, o = 1, h = 26, dash }) => o > 0 ? <path d={arrowD(x1, y1, x2, y2, h)} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} opacity={o} /> : null;
const PX = 16;
function Box({ x, y, s = 1, o = 1, label }) {
  return (
    <g opacity={o}>
      <rect x={x - 90 * s} y={y - 150 * s} width={180 * s} height={150 * s} rx={8} fill={CORAL_T} stroke={INK} strokeWidth={4} />
      <line x1={x - 90 * s} y1={y - 75 * s} x2={x + 90 * s} y2={y - 75 * s} stroke={INK} strokeWidth={2} opacity={0.3} />
      {label && <text x={x} y={y - 60 * s} textAnchor="middle" fontFamily={MONO} fontSize={34 * s} fontWeight={600} fill={INK}>{label}</text>}
    </g>
  );
}
function CarS({ x, y, s = 1, o = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <path d="M -90 -24 L -90 -58 L -44 -58 L -22 -90 L 40 -90 L 62 -58 L 90 -58 L 90 -24 Z" fill={SAGE_T} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d="M -14 -82 L 34 -82 L 50 -62 L -28 -62 Z" fill="#ffffff" stroke={INK} strokeWidth={2.5} />
      <circle cx={-52} cy={-22} r={20} fill="#ffffff" stroke={INK} strokeWidth={4} />
      <circle cx={54} cy={-22} r={20} fill="#ffffff" stroke={INK} strokeWidth={4} />
    </g>
  );
}
const Floor = ({ x0, x1, y, o = 1 }) => <g opacity={o}><line x1={x0} y1={y} x2={x1} y2={y} stroke={INK} strokeWidth={5} />{Array.from({ length: Math.floor((x1 - x0) / 60) }, (_, k) => <line key={k} x1={x0 + k * 60 + 10} y1={y + 4} x2={x0 + k * 60 - 14} y2={y + 26} stroke={GREY} strokeWidth={3} opacity={0.6} />)}</g>;

function TitleN({ T, C }) {
  const a = C.Title - 1.2;
  return (
    <div style={{ position: 'absolute', left: -800, top: -3000, width: 1600, height: 800 }}>
      <Reveal T={T} at={a + 0.6} dur={1.0} style={{ left: 0, top: 70, fontFamily: MONO, fontSize: 34, fontWeight: 600, letterSpacing: '0.14em', color: CORAL }}>DAY 13 · BUILDING THE TOOLS</Reveal>
      <Reveal T={T} at={a + 1.0} dur={1.6} style={{ left: -4, top: 120, fontFamily: SERIF, fontSize: 150, lineHeight: 1.0, color: INK }}>F = ma in practice</Reveal>
      <Reveal T={T} at={a + 1.8} dur={1.6} style={{ left: -4, top: 270, fontFamily: SERIF, fontStyle: 'italic', fontSize: 110, lineHeight: 1.1, color: INDIGO }}>net force first</Reveal>
      <Reveal T={T} at={a + 3.4} dur={1.6} style={{ left: 0, top: 460, fontFamily: SERIF, fontStyle: 'italic', fontSize: 56, color: INDIGO }}>R7 · Solve with F = ma — always the NET force first.</Reveal>
      <div style={{ position: 'absolute', left: 0, top: 590, opacity: env(T, a + 4.4), fontFamily: MONO, fontSize: 30, fontWeight: 500, color: GREY }}>Space: play / continue · N: next section · B: back</div>
    </div>
  );
}
function Recap({ T, C }) {
  const rc = C.Recap, u = clamp((T - (rc + 4)) / 3, 0, 1), bx = 600 + 500 * u * u;
  return (
    <Scene n="Recap" T={T} C={C} ph={0.2}>
      <Kicker T={T} at={rc + 0.3} top={44} s="RECAP · DAYS 11–12" />
      <div style={{ position: 'absolute', left: 50, top: 100, opacity: env(T, rc + 0.6), padding: '6px 40px 14px', borderRadius: 12, border: `4px solid ${SAGE}`, background: SAGE_T, fontFamily: SERIF, fontStyle: 'italic', fontSize: 120, color: INK }}>F = ma</div>
      <Big T={T} at={rc + 2} top={140} left={620} s="found from our own data" size={54} italic c={GREY} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Floor x0={200} x1={1800} y={700} o={env(T, rc + 3)} />
        <Box x={bx} y={700} label="5 kg" o={env(T, rc + 3)} />
        <Arr x1={bx - 260} y1={625} x2={bx - 100} y2={625} c={CORAL} w={10} h={26} o={env(T, rc + 3.6)} />
        <SV x={bx - 180} y={595} s="10 N" c={CORAL} size={48} an="middle" o={env(T, rc + 3.6)} />
        <SV x={bx} y={500} s="a = ?" c={INDIGO} size={56} an="middle" o={env(T, rc + 7)} />
      </svg>
    </Scene>
  );
}
function Net({ T, C }) {
  const n = C.Net, bx = 900, by = 700;
  const sum = eio((T - (n + 11)) / 1.6);
  return (
    <Scene n="Net" T={T} C={C} ph={0.6}>
      <div style={{ position: 'absolute', left: 60, top: 40, opacity: env(T, n + 0.3), fontFamily: MONO, fontSize: 40, fontWeight: 600, color: SAGE }}>{M('STOP 1 · a = F / m = 10 N ÷ 5 kg = 2 m/s²')}</div>
      <Kicker T={T} at={n + 2.4} top={120} s="BUT WHICH F?" />
      <Big T={T} at={n + 2.8} top={170} w={1880} s="F = ma uses the NET force: the sum of ALL the forces, with their directions." size={52} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Floor x0={300} x1={1700} y={by} o={env(T, n + 4.4)} />
        <Box x={bx} y={by} label="5 kg" o={env(T, n + 4.4)} />
        <Arr x1={bx + 100} y1={by - 75} x2={bx + 100 + 20 * PX * (1 - sum)} y2={by - 75} c={CORAL} w={10} h={26} o={env(T, n + 5.4) * (1 - env(T, n + 13, 0.4))} />
        <SV x={bx + 100 + 10 * PX} y={by - 110} s="applied 20 N" c={CORAL} size={44} an="middle" o={env(T, n + 5.4) * (1 - env(T, n + 11, 0.4))} />
        <Arr x1={bx - 100} y1={by - 20} x2={bx - 100 - 5 * PX} y2={by - 20} c={INDIGO} w={10} h={24} o={env(T, n + 7) * (1 - env(T, n + 11, 0.4))} />
        <SV x={bx - 120 - 5 * PX} y={by - 6} s="friction 5 N" c={INDIGO} size={44} an="end" o={env(T, n + 7) * (1 - env(T, n + 11, 0.4))} />
        <Arr x1={bx + 100} y1={by - 75} x2={bx + 100 + 15 * PX * env(T, n + 12.6, 0.8)} y2={by - 75} c={SAGE} w={12} h={28} o={env(T, n + 12.6)} />
        <SV x={bx + 100 + 7.5 * PX} y={by - 110} s="net 15 N" c={SAGE} size={48} an="middle" o={env(T, n + 13.2)} />
      </svg>
      <Big T={T} at={n + 9} top={790} s="F_net = 20 N − 5 N = 15 N" size={58} italic />
      <Big T={T} at={n + 14.4} top={880} s="a = F_net / m = 15 N ÷ 5 kg = 3 m/s²" size={58} italic c={INDIGO} />
    </Scene>
  );
}
function Types({ T, C }) {
  const t = C.Types;
  const types = [['FIND a', 'given F and m', 'a = F / m'], ['FIND F', 'given a and m', 'F = ma'], ['NET FORCE', 'several forces', 'sum first, then F = ma']];
  return (
    <Scene n="Types" T={T} C={C} ph={0.4}>
      <div style={{ position: 'absolute', left: 60, top: 40, opacity: env(T, t + 0.3), fontFamily: MONO, fontSize: 38, fontWeight: 600, color: SAGE }}>{M('STOP 2 · F_net = 30 − 6 = 24 N → a = 24 ÷ 4 = 6 m/s²')}</div>
      <Kicker T={T} at={t + 2.4} top={120} s="THE PROBLEM SET · THREE KINDS" />
      <div style={{ position: 'absolute', left: 60, top: 170, display: 'flex', gap: 30 }}>
        {types.map(([k, g, e], i) => <div key={i} style={{ width: 590, opacity: env(T, t + 2.8 + i * 1.2), borderRadius: 10, border: `3px solid ${[INDIGO, CORAL, SAGE][i]}`, background: '#ffffff', padding: '22px 28px', boxSizing: 'border-box' }}>
          <div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 600, letterSpacing: '0.1em', color: [INDIGO, CORAL, SAGE][i] }}>{k}</div>
          <div style={{ fontFamily: SERIF, fontSize: 42, color: GREY, marginTop: 6 }}>{g}</div>
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 58, color: INK, marginTop: 8 }}>{M(e)}</div>
        </div>)}
      </div>
      <Kicker T={T} at={t + 7.6} top={470} s="WORKED · REVERSE PROBLEM" />
      <Big T={T} at={t + 8} top={520} s="A 60 kg runner accelerates at 2.5 m/s². What net force?" size={50} />
      <Big T={T} at={t + 10.4} top={610} s="F = ma = (60 kg)(2.5 m/s²) = 150 N" size={58} italic c={INDIGO} />
      <div style={{ position: 'absolute', left: 60, top: 740, opacity: env(T, t + 13), display: 'flex', gap: 24 }}>
        {['1 · List the forces', '2 · Find the NET force', '3 · Use F = ma', '4 · Units + direction'].map((s, i) => <div key={i} style={{ opacity: env(T, t + 13 + i * 0.6), padding: '12px 24px', borderRadius: 8, background: i === 1 ? SAGE_T : '#eeeefa', border: `2px solid ${i === 1 ? SAGE : LINE}`, fontFamily: SERIF, fontSize: 42, color: INK }}>{s}</div>)}
      </div>
    </Scene>
  );
}
function Car({ T, C }) {
  const c = C.Car, road = 600, u = clamp((T - (c + 3)) / 5, 0, 1);
  const x = 300 + 1200 * (1 - (1 - u) * (1 - u)), vl = 260 * (1 - u);
  return (
    <Scene n="Car" T={T} C={C} ph={0.9}>
      <Kicker T={T} at={c + 0.3} top={44} s="APPLICATION PROBLEM" />
      <Big T={T} at={c + 0.6} top={92} s="A 1500 kg car slows from 30 m/s to 0 in 5 s." size={66} />
      <Big T={T} at={c + 2} top={186} s="What net force acts on it?" size={58} c={INDIGO} italic />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Floor x0={120} x1={1880} y={road} o={env(T, c + 2.6)} />
        <CarS x={x} y={road} s={1.6} o={env(T, c + 2.6)} />
        {vl > 4 && <Arr x1={x - 60} y1={road - 200} x2={x - 60 + vl} y2={road - 200} c={INDIGO} w={9} h={22} o={env(T, c + 3)} />}
        <SV x={x - 60} y={road - 226} s="v" c={INDIGO} size={44} o={env(T, c + 3) * (vl > 4 ? 1 : 0)} />
        <SV x={300} y={road + 80} s="30 m/s" c={GREY} size={40} an="middle" o={env(T, c + 3)} />
        <SV x={1500} y={road + 80} s="0 m/s · 5 s later" c={GREY} size={40} an="middle" o={env(T, c + 8)} />
      </svg>
      <Big T={T} at={c + 9.4} top={760} w={1880} s="Hint: you need a before you can use F = ma." size={48} italic c={GREY} />
    </Scene>
  );
}
function Friction({ T, C }) {
  const f = C.Friction;
  const row = (y, at, eng, fr, label, c) => {
    const o = env(T, at, 0.6), net = eng - fr, cx = 760;
    return (
      <g opacity={o}>
        <line x1={300} y1={y} x2={1220} y2={y} stroke={INK} strokeWidth={4} />
        <CarS x={cx} y={y} s={1.1} />
        {eng > 0 && <Arr x1={cx + 110} y1={y - 60} x2={cx + 110 + eng * 18} y2={y - 60} c={CORAL} w={9} h={22} />}
        {eng > 0 && <SV x={cx + 136 + eng * 18} y={y - 48} s="engine" c={CORAL} size={36} />}
        <Arr x1={cx - 110} y1={y - 30} x2={cx - 110 - fr * 18} y2={y - 30} c={INDIGO} w={9} h={22} />
        <SV x={cx - 136 - fr * 18} y={y - 18} s="friction" c={INDIGO} size={36} an="end" />
        <text x={1290} y={y - 34} fontFamily={SERIF} fontSize={44} fill={c}>{label}</text>
        <text x={1290} y={y + 14} fontFamily={MONO} fontSize={30} fill={GREY}>{net > 0 ? 'net forward' : 'net backward'}</text>
      </g>
    );
  };
  return (
    <Scene n="Friction" T={T} C={C} ph={0.5}>
      <div style={{ position: 'absolute', left: 60, top: 40, opacity: env(T, f + 0.3), fontFamily: MONO, fontSize: 36, fontWeight: 600, color: SAGE }}>{M('STOP 4 · a = (0 − 30) ÷ 5 = −6 m/s² → F = (1500)(−6) = −9000 N')}</div>
      <Big T={T} at={f + 2.6} top={100} s="9000 N, pointing backward: opposite the motion." size={50} c={SAGE} italic />
      <Kicker T={T} at={f + 5} top={200} s="REAL CARS: FRICTION RESISTS" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        {row(420, f + 5.6, 12, 5, 'speeding up: engine > friction', CORAL)}
        {row(660, f + 9.6, 0, 6, 'coasting: only friction', INDIGO)}
        {row(900, f + 13.6, 0, 12, 'braking: brakes add friction', INDIGO)}
      </svg>
    </Scene>
  );
}
function Exit({ T, C }) {
  const e = C.Exit, by = 680;
  return (
    <Scene n="Exit" T={T} C={C} ph={0.3}>
      <div style={{ position: 'absolute', left: 60, top: 40, opacity: env(T, e + 0.3), fontFamily: MONO, fontSize: 38, fontWeight: 600, color: SAGE }}>STOP 5 · Equal. Constant velocity means a = 0, so the net force is 0.</div>
      <Kicker T={T} at={e + 2.4} top={120} s="EXIT TICKET" />
      <Big T={T} at={e + 2.8} top={170} s="2 kg cart · 12 N push · 4 N friction" size={72} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Floor x0={300} x1={1700} y={by} o={env(T, e + 3.4)} />
        <Box x={1000} y={by} label="2 kg" o={env(T, e + 3.4)} />
        <Arr x1={1100} y1={by - 75} x2={1100 + 12 * 20} y2={by - 75} c={CORAL} w={10} h={26} o={env(T, e + 4)} />
        <SV x={1100 + 6 * 20} y={by - 110} s="12 N" c={CORAL} size={46} an="middle" o={env(T, e + 4)} />
        <Arr x1={900} y1={by - 20} x2={900 - 4 * 20} y2={by - 20} c={INDIGO} w={10} h={24} o={env(T, e + 4.6)} />
        <SV x={772} y={by - 6} s="4 N" c={INDIGO} size={46} an="end" o={env(T, e + 4.6)} />
        <SV x={1000} y={by - 220} s="a = ?" c={INDIGO} size={58} an="middle" o={env(T, e + 5.4)} />
      </svg>
      <Big T={T} at={e + 6} top={790} s="Self-check: did I find the NET force first?" size={50} italic c={GREY} />
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



function shots13(C) {
  const o = (t, d, p, dip = 0.3, r = 0) => ({ t, d, x: p[0], y: p[1], z: p[2], r, dip });
  const S = (n) => shot(...POS[n]);
  return [
    { t: -1, d: 0, x: 0, y: -2700, z: 1.15, r: -2, dip: 0 }, { t: C.Title, d: 5, x: 0, y: -2680, z: 1.0, r: 0, dip: 0 },
    ...['Recap', 'Net', 'Types', 'Car', 'Friction', 'Exit'].map((n) => o(C[n], 1.9, S(n))),
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
  const cam = camAt(T, shots13(C));
  const tf = `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) rotate(${-cam.r}deg) translate(${-cam.x}px, ${-cam.y}px)`;
  const layer = { position: 'absolute', left: 0, top: 0, width: 0, height: 0, whiteSpace: 'nowrap', transformOrigin: '0 0', transform: tf };
  return (
    <div data-screen-label={`t=${Math.floor(time || 0)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG, fontVariantNumeric: 'lining-nums' }}>
      <div style={layer}><WorldGrid z={cam.z} on={tw.grid !== false} /></div>
      <Parallax cam={cam} T={T} />
      <div style={layer}>
        <TitleN T={T} C={C} />
        <Recap T={T} C={C} />
        <Net T={T} C={C} />
        <Types T={T} C={C} />
        <Car T={T} C={C} />
        <Friction T={T} C={C} />
        <Exit T={T} C={C} />
      </div>
      <StopBand T={T} C={C} />
    </div>
  );
}
function FmaDay13App() {
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
window.FmaDay13App = FmaDay13App;



