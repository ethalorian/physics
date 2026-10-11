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
    if (ch === '₁') { push('sub', '1'); i++; continue; }
    if (ch === '₂') { push('sub', '2'); i++; continue; }
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

const ORDER = ['Title', 'Frame', 'Params', 'Results', 'Encounter', 'Compare', 'Exit', 'Scale', 'Hold'];
const endOf = (C, n) => C[ORDER[ORDER.indexOf(n) + 1]];
const STOPS = {
  Params: [1, 'GROUP WORK', 'Find 2026-XJ’s orbital period, perihelion distance and aphelion distance. Does its orbit reach 1 AU?'],
  Results: [2, 'DISCUSS', 'The orbit crosses Earth’s orbit. Does that mean 2026-XJ will hit Earth? What else would you need to know?'],
  Compare: [3, 'DISCUSS', 'What’s different from your Unit 1 prediction? Why is this one more trustworthy, and what is it still missing?'],
  Exit: [4, 'EXIT TICKET', 'Explain one result from today with a labeled sketch or calculation. Name the model you used and one assumption.'],
  Scale: [5, 'CHECK-IN', 'Where are you on R4? Rate yourself 0–4. Tomorrow: the transfer task.'],
};
const STOP_KEYS = Object.keys(STOPS), LAST = STOP_KEYS[STOP_KEYS.length - 1];
const CW = 2000, CH = 1040;
const shot = (cx, cy) => [cx, cy - CH / 2 + 526 / 0.8, 0.8];
const POS = { Frame: [0, -1300], Params: [2200, -1300], Results: [2200, 0], Encounter: [0, 0], Compare: [-2200, 0], Exit: [-2200, 1300], Scale: [0, 1300] };
const Scene = ({ n, T, C, children, ph = 0 }) => <Card x={POS[n][0]} y={POS[n][1]} w={CW} h={CH} T={T} at={C[n] - 0.9} ph={ph}>{children}</Card>;
const Big = ({ T, at, top, left = 60, s, c = INK, size = 64, italic = false, w }) => (
  <div style={{ position: 'absolute', left, top, width: w, whiteSpace: w ? 'normal' : 'nowrap', opacity: env(T, at, 0.6), transform: `translateY(${(1 - env(T, at, 0.6)) * 14}px)`, fontFamily: SERIF, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: 1.2, color: c }}>{M(s)}</div>
);
const SV = ({ x, y, s, c, size = 44, an = 'start', o = 1 }) => o > 0 ? <text x={x} y={y} textAnchor={an} fontFamily={SERIF} fontStyle="italic" fontSize={size} fill={c} opacity={o}>{MS(s)}</text> : null;
function kep(a, e, P, t) {
  const Mn = 2 * Math.PI * ((((t / P) % 1) + 1) % 1);
  let E = Mn;
  for (let i = 0; i < 10; i++) E -= (E - e * Math.sin(E) - Mn) / (1 - e * Math.cos(E));
  return [a * (Math.cos(E) - e), a * Math.sqrt(1 - e * e) * Math.sin(E)];
}
const ellD = (F, a, e) => Array.from({ length: 121 }, (_, k) => { const E = (k / 120) * Math.PI * 2; return (k ? 'L ' : 'M ') + (F[0] + a * (Math.cos(E) - e)).toFixed(1) + ' ' + (F[1] + a * Math.sqrt(1 - e * e) * Math.sin(E)).toFixed(1); }).join(' ') + ' Z';
function Sun({ x, y, r = 30, o = 1 }) {
  return <g opacity={o}><circle cx={x} cy={y} r={r} fill={CORAL_T} stroke={CORAL} strokeWidth={4} />{Array.from({ length: 8 }, (_, k) => { const q = (k / 8) * Math.PI * 2; return <line key={k} x1={x + (r + 8) * Math.cos(q)} y1={y + (r + 8) * Math.sin(q)} x2={x + (r + 18) * Math.cos(q)} y2={y + (r + 18) * Math.sin(q)} stroke={CORAL} strokeWidth={3} strokeLinecap="round" />; })}</g>;
}
// example orbital elements for the fictional 2026-XJ (swap in your supplied values)
const XJ = { a: 1.8, e: 0.48 };
const XJ_T = Math.pow(XJ.a, 1.5), XJ_q = XJ.a * (1 - XJ.e), XJ_Q = XJ.a * (1 + XJ.e);
const AU = 170, SUN = [700, 560], YR = 4, XJ_P = YR * XJ_T;
const CROSS_TH = Math.acos((XJ.a * (1 - XJ.e * XJ.e) - 1) / XJ.e);
// times (within one asteroid period) when 2026-XJ is exactly 1 AU from the Sun
const XJ_TC = (() => { const out = []; let prev = null; for (let t = 0; t <= XJ_P; t += 0.002) { const [x, y] = kep(XJ.a, XJ.e, XJ_P, t), r = Math.hypot(x, y) - 1; if (prev !== null && Math.sign(r) !== Math.sign(prev)) out.push(t); prev = r; } return out; })();
const EARTH0 = 2.4;
function Orbits({ T, o = 1, xjT, earthT, showEarthOrbit = true, showXJ = true, cross = 0 }) {
  const [x, y] = kep(XJ.a * AU, XJ.e, XJ_P, xjT);
  const th = EARTH0 + (2 * Math.PI * earthT) / YR;
  return (
    <g opacity={o}>
      {showEarthOrbit && <circle cx={SUN[0]} cy={SUN[1]} r={AU} fill="none" stroke={INDIGO} strokeWidth={3} />}
      <path d={ellD(SUN, XJ.a * AU, XJ.e)} fill="none" stroke={GREY} strokeWidth={3} strokeDasharray="12 8" />
      <Sun x={SUN[0]} y={SUN[1]} />
      {cross > 0 && [1, -1].map((sg) => <circle key={sg} cx={SUN[0] + AU * Math.cos(CROSS_TH)} cy={SUN[1] + sg * AU * Math.sin(CROSS_TH)} r={20} fill="none" stroke={CORAL} strokeWidth={5} opacity={cross} />)}
      {earthT !== null && <circle cx={SUN[0] + AU * Math.cos(th)} cy={SUN[1] + AU * Math.sin(th)} r={14} fill={INDIGO} />}
      {showXJ && <g transform={`translate(${SUN[0] + x} ${SUN[1] + y})`}><Rock x={0} y={0} r={13} spin={T * 30} /></g>}
    </g>
  );
}
function TitleN({ T, C }) {
  const a = C.Title - 1.2;
  return (
    <div style={{ position: 'absolute', left: -800, top: -3000, width: 1600, height: 800 }}>
      <Reveal T={T} at={a + 0.6} dur={1.0} style={{ left: 0, top: 70, fontFamily: MONO, fontSize: 34, fontWeight: 600, letterSpacing: '0.14em', color: CORAL }}>UNIT 2 · DAY 15 · BUILDING THE TOOLS</Reveal>
      <Reveal T={T} at={a + 1.0} dur={1.6} style={{ left: -4, top: 120, fontFamily: SERIF, fontSize: 150, lineHeight: 1.0, color: INK }}>2026-XJ’s orbit</Reveal>
      <Reveal T={T} at={a + 1.8} dur={1.6} style={{ left: -4, top: 280, fontFamily: SERIF, fontStyle: 'italic', fontSize: 72, lineHeight: 1.15, color: INDIGO, whiteSpace: 'normal', width: 1600 }}>Where is it going, and when?</Reveal>
      <Reveal T={T} at={a + 3.4} dur={1.6} style={{ left: 0, top: 460, fontFamily: SERIF, fontStyle: 'italic', fontSize: 48, color: INDIGO }}>R4 · Apply gravitation and orbits to predict closest approach.</Reveal>
      <div style={{ position: 'absolute', left: 0, top: 590, opacity: env(T, a + 4.4), fontFamily: MONO, fontSize: 30, fontWeight: 500, color: GREY }}>Space: play / continue · N: next section · B: back</div>
    </div>
  );
}
function Frame({ T, C }) {
  const f = C.Frame;
  return (
    <Scene n="Frame" T={T} C={C} ph={0.2}>
      <Kicker T={T} at={f + 0.3} top={44} s="THE ASTEROID MATH DAY" />
      <Big T={T} at={f + 0.6} top={150} s="We have the tools." size={90} />
      <div style={{ position: 'absolute', left: 60, top: 300, display: 'flex', gap: 24, flexWrap: 'wrap', width: 1880 }}>
        {['F = Gm₁m₂/r²', 'orbits are falling', 'Kepler 1: ellipses', 'Kepler 2: equal areas', 'Kepler 3: T² = a^3'].map((t, i) => <div key={i} style={{ opacity: env(T, f + 1.6 + i * 0.5, 0.4), padding: '14px 26px', borderRadius: 10, border: `3px solid ${INDIGO}`, background: '#ffffff', fontFamily: SERIF, fontStyle: 'italic', fontSize: 46, color: INK }}>{M(t)}</div>)}
      </div>
      <Big T={T} at={f + 4.6} top={540} s="We have the question." size={90} c={CORAL} />
    </Scene>
  );
}
function Params({ T, C }) {
  const p = C.Params, ax = SUN[0] - XJ.a * AU * (1 + XJ.e), cx = SUN[0] - XJ.a * XJ.e * AU, cur = kep(XJ.a * AU, XJ.e, XJ_P, XJ_P * 0.62);
  return (
    <Scene n="Params" T={T} C={C} ph={0.6}>
      <Kicker T={T} at={p + 0.3} top={44} s="2026-XJ · ORBITAL PARAMETERS (EXAMPLE VALUES)" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Orbits T={T} o={env(T, p + 0.8)} xjT={T - p} earthT={null} />
        <SV x={SUN[0] + AU + 10} y={SUN[1] - AU * 0.7} s="Earth’s orbit (1 AU)" c={INDIGO} size={32} o={env(T, p + 1.4)} />
        <g opacity={env(T, p + 3)}><line x1={ax} y1={SUN[1] + 300} x2={cx} y2={SUN[1] + 300} stroke={SAGE} strokeWidth={5} /><line x1={ax} y1={SUN[1] + 285} x2={ax} y2={SUN[1] + 315} stroke={SAGE} strokeWidth={5} /><line x1={cx} y1={SUN[1] + 285} x2={cx} y2={SUN[1] + 315} stroke={SAGE} strokeWidth={5} /><SV x={(ax + cx) / 2} y={SUN[1] + 350} s="a" c={SAGE} size={40} an="middle" /></g>
        <g opacity={env(T, p + 9)}><circle cx={SUN[0] + cur[0]} cy={SUN[1] + cur[1]} r={22} fill="none" stroke={INK} strokeWidth={3} strokeDasharray="5 5" /><SV x={SUN[0] + cur[0] - 34} y={SUN[1] + cur[1] - 26} s="today" c={INK} size={32} an="end" /></g>
      </svg>
      <Big T={T} at={p + 3} top={150} left={1220} w={720} s="a = 1.8 AU" size={66} c={SAGE} italic />
      <Big T={T} at={p + 3.6} top={240} left={1220} w={720} s="semi-major axis: half the long width" size={38} c={GREY} />
      <Big T={T} at={p + 5.6} top={340} left={1220} w={720} s="e = 0.48" size={66} c={INDIGO} italic />
      <Big T={T} at={p + 6.2} top={430} left={1220} w={720} s="eccentricity: how stretched (0 = a circle)" size={38} c={GREY} />
      <Big T={T} at={p + 9} top={530} left={1220} w={720} s="current position: marked “today”" size={42} />
      <Big T={T} at={p + 11.6} top={640} left={1220} w={720} s="perihelion: q = a(1 − e)" size={38} italic c={INDIGO} />
      <Big T={T} at={p + 12} top={700} left={1220} w={720} s="aphelion: Q = a(1 + e)" size={38} italic c={INDIGO} />
      <Big T={T} at={p + 12.4} top={760} left={1220} w={720} s="period: T² = a^3" size={38} italic c={INDIGO} />
    </Scene>
  );
}
function Results({ T, C }) {
  const r = C.Results;
  return (
    <Scene n="Results" T={T} C={C} ph={0.9}>
      <Kicker T={T} at={r + 0.3} top={44} s="ANSWERS" c={SAGE} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Orbits T={T} xjT={T - r} earthT={null} cross={env(T, r + 9.6, 0.6)} />
        <g opacity={env(T, r + 3)}><line x1={SUN[0]} y1={SUN[1]} x2={SUN[0] + XJ_q * AU} y2={SUN[1]} stroke={CORAL} strokeWidth={4} /><SV x={SUN[0] + XJ_q * AU + 14} y={SUN[1] + 46} s="q" c={CORAL} size={40} /></g>
        <g opacity={env(T, r + 5)}><line x1={SUN[0]} y1={SUN[1]} x2={SUN[0] - XJ_Q * AU} y2={SUN[1]} stroke={INDIGO} strokeWidth={4} strokeDasharray="10 8" /><SV x={SUN[0] - XJ_Q * AU} y={SUN[1] + 46} s="Q" c={INDIGO} size={40} /></g>
      </svg>
      <Big T={T} at={r + 1} top={140} left={1220} w={720} s="T = √(1.8^3) = √5.83 ≈ 2.4 years" size={46} italic />
      <Big T={T} at={r + 3} top={240} left={1220} w={720} s="q = 1.8(1 − 0.48) ≈ 0.94 AU" size={46} italic c={CORAL} />
      <Big T={T} at={r + 5} top={330} left={1220} w={720} s="Q = 1.8(1 + 0.48) ≈ 2.66 AU" size={46} italic c={INDIGO} />
      <div style={{ position: 'absolute', left: 1220, top: 450, width: 720, opacity: env(T, r + 7.4), padding: '14px 24px', borderRadius: 12, border: `4px solid ${SAGE}`, background: SAGE_T, fontFamily: SERIF, fontSize: 42, color: INK, boxSizing: 'border-box', whiteSpace: 'normal' }}>0.94 AU &lt; 1 AU &lt; 2.66 AU: the orbit does reach Earth’s orbital distance.</div>
      <Big T={T} at={r + 9.6} top={660} left={1220} w={720} s="In this flat sketch, the paths cross at two points." size={40} c={CORAL} />
    </Scene>
  );
}
function Encounter({ T, C }) {
  const en = C.Encounter, t0 = en + 1.5, xjT = T - t0 + XJ_P * 0.5, eT = T - t0;
  const occ = [];
  for (let n = -1; n <= 2; n++) for (const tc of XJ_TC) { const At = t0 - XJ_P * 0.5 + tc + n * XJ_P; if (At > t0 && At < en + 19) occ.push(At); }
  const checks = ['orientation: real orbits are tilted, so the paths may not meet in 3-D', 'both positions at the same moment', 'timing: is Earth there when 2026-XJ is?', 'uncertainty in every measured value'];
  return (
    <Scene n="Encounter" T={T} C={C} ph={0.4}>
      <Kicker T={T} at={en + 0.3} top={44} s="ANSWER · CROSSING ORBITS ≠ A COLLISION" c={SAGE} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Orbits T={T} xjT={xjT} earthT={eT} cross={1} />
        {occ.map((At, i) => { if (T < At || (occ[i + 1] !== undefined && T >= occ[i + 1])) return null; const [x, y] = kep(XJ.a * AU, XJ.e, XJ_P, At - t0 + XJ_P * 0.5), th = EARTH0 + (2 * Math.PI * (At - t0)) / YR; const ex = SUN[0] + AU * Math.cos(th), ey = SUN[1] + AU * Math.sin(th), px = SUN[0] + x, py = SUN[1] + y, d = Math.hypot(ex - px, ey - py) / AU; const o = env(T, At, 0.4); return (
          <g key={i} opacity={o}>
            <line x1={px} y1={py} x2={ex} y2={ey} stroke={CORAL} strokeWidth={3} strokeDasharray="6 6" />
            <circle cx={ex} cy={ey} r={18} fill="none" stroke={INDIGO} strokeWidth={3} />
            <text x={ex + Math.cos(th) * 48 + (Math.cos(th) >= 0 ? 16 : -16)} y={ey + Math.sin(th) * 48 + 10} textAnchor={Math.cos(th) >= 0 ? 'start' : 'end'} fontFamily={MONO} fontSize={28} fontWeight={600} fill={CORAL}>{`${d.toFixed(2)} AU`}</text>
          </g>
        ); })}
        <SV x={SUN[0]} y={SUN[1] + 450} s="Earth (blue) and 2026-XJ, moving at their real relative rates" c={GREY} size={30} an="middle" o={env(T, en + 1)} />
      </svg>
      <Big T={T} at={en + 1.4} top={130} left={1220} w={720} s="When 2026-XJ reaches Earth’s orbit, where is Earth?" size={44} />
      {occ.length > 2 && <div style={{ position: 'absolute', left: 60, top: 110, opacity: win(T, occ[0], occ[2], 0.4), fontFamily: SERIF, fontSize: 44, color: CORAL }}>Pass 1: Earth is about 1.9 AU away.</div>}
      {occ.length > 2 && <div style={{ position: 'absolute', left: 60, top: 110, opacity: env(T, occ[2], 0.4), fontFamily: SERIF, fontSize: 44, color: CORAL }}>Pass 2: only about 0.1 AU. Timing decides.</div>}
      <Kicker T={T} at={en + 7} top={300} left={1220} s="YOU ALSO NEED" />
      {checks.map((t, i) => <Big key={i} T={T} at={en + 7.6 + i * 1.6} top={350 + i * 110} left={1220} w={720} s={`${i + 1} · ${t}`} size={36} />)}
    </Scene>
  );
}
function Compare({ T, C }) {
  const c = C.Compare, o2 = env(T, c + 4);
  const L = [480, 640], R = [1480, 640];
  return (
    <Scene n="Compare" T={T} C={C} ph={0.5}>
      <Kicker T={T} at={c + 0.3} top={44} s="UNIT 1 vs UNIT 2" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, c + 1)}>
          <Sun x={L[0] - 200} y={L[1] + 60} r={22} />
          <Rock x={L[0] - 40} y={L[1] - 120} r={14} spin={T * 30} />
          <path d={arrowD(L[0] - 20, L[1] - 120, L[0] + 360, L[1] - 120, 24)} fill="none" stroke={GREY} strokeWidth={5} strokeDasharray="14 10" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <g opacity={o2}>
          <Sun x={R[0] - 200} y={R[1] + 60} r={22} />
          <path d={ellD([R[0] - 200, R[1] + 60], 300, 0.48)} fill="none" stroke={SAGE} strokeWidth={5} />
        </g>
      </svg>
      <Big T={T} at={c + 1} top={140} left={60} w={880} s="Unit 1: constant velocity" size={54} c={GREY} />
      <Big T={T} at={c + 1.8} top={220} left={60} w={880} s="a straight line: fine for days or weeks" size={40} c={GREY} italic />
      <Big T={T} at={c + 4} top={140} left={1060} w={880} s="Unit 2: gravity + Kepler" size={54} c={SAGE} />
      <Big T={T} at={c + 4.8} top={220} left={1060} w={880} s="the path curves; the whole orbit is timed" size={40} c={SAGE} italic />
    </Scene>
  );
}
function Exit({ T, C }) {
  const e = C.Exit;
  return (
    <Scene n="Exit" T={T} C={C} ph={0.3}>
      <div style={{ position: 'absolute', left: 60, top: 40, width: 1880, whiteSpace: 'normal', opacity: env(T, e + 0.3), fontFamily: MONO, fontSize: 32, fontWeight: 600, lineHeight: 1.35, color: SAGE }}>STOP 3 · It includes gravity, so the path curves and Kepler’s laws time the whole orbit. Still missing: tilt, Earth’s position, and uncertainty.</div>
      <Kicker T={T} at={e + 1.4} top={170} s="EXIT TICKET" />
      <Big T={T} at={e + 1.8} top={230} w={1880} s="Explain one result from today: a labeled sketch, a calculation, or an observation." size={52} />
      <div style={{ position: 'absolute', left: 60, top: 420, display: 'flex', gap: 30, opacity: env(T, e + 3) }}>
        {['the model or relationship you used', 'one assumption you made', 'your own evidence first'].map((t, i) => <div key={i} style={{ width: 590, padding: '20px 26px', borderRadius: 12, border: `3px solid ${[INDIGO, CORAL, SAGE][i]}`, background: '#ffffff', fontFamily: SERIF, fontSize: 42, color: INK, boxSizing: 'border-box', whiteSpace: 'normal' }}>{t}</div>)}
      </div>
      <Big T={T} at={e + 4.4} top={650} w={1880} s="e.g. “Perihelion is 0.94 AU (q = a(1 − e)), so the orbit reaches 1 AU. I assumed both orbits lie in the same plane.”" size={38} italic c={GREY} />
    </Scene>
  );
}
function Scale({ T, C }) {
  const s = C.Scale;
  const lv = [['0', 'not yet'], ['1', 'with help'], ['2', 'the simpler parts'], ['3', 'the target'], ['4', 'beyond it']];
  return (
    <Scene n="Scale" T={T} C={C} ph={0.7}>
      <Kicker T={T} at={s + 0.3} top={44} s="MARZANO CHECK-IN" />
      <div style={{ position: 'absolute', left: 60, top: 110, width: 1880, opacity: env(T, s + 0.6), padding: '20px 30px', borderRadius: 10, border: `3px solid ${INDIGO}`, background: '#ffffff', boxSizing: 'border-box' }}><div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 600, color: INDIGO }}>R4</div><div style={{ fontFamily: SERIF, fontSize: 44, color: INK, marginTop: 6 }}>Apply gravitation and orbits to predict closest approach.</div></div>
      <div style={{ position: 'absolute', left: 60, top: 380, display: 'flex', gap: 24 }}>
        {lv.map(([n, t], i) => <div key={i} style={{ width: 356, opacity: env(T, s + 1.2 + i * 0.3), padding: '20px 0', borderRadius: 10, background: ['#f7e1da', '#f3e6cf', '#eeeefa', SAGE_T, SAGE_T][i], border: `2px solid ${LINE}`, textAlign: 'center' }}><div style={{ fontFamily: MONO, fontSize: 60, fontWeight: 600, color: INK }}>{n}</div><div style={{ fontFamily: SERIF, fontSize: 38, color: GREY }}>{t}</div></div>)}
      </div>
      <Big T={T} at={s + 3.4} top={680} s="Tomorrow: the transfer task." size={56} c={INDIGO} italic />
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























function shotsU2D15(C) {
  const o = (t, d, p, dip = 0.3, r = 0) => ({ t, d, x: p[0], y: p[1], z: p[2], r, dip });
  const S = (n) => shot(...POS[n]);
  return [
    { t: -1, d: 0, x: 0, y: -2700, z: 1.15, r: -2, dip: 0 }, { t: C.Title, d: 5, x: 0, y: -2680, z: 1.0, r: 0, dip: 0 },
    ...['Frame', 'Params', 'Results', 'Encounter', 'Compare', 'Exit', 'Scale'].map((n) => o(C[n], 1.9, S(n))),
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
  const cam = camAt(T, shotsU2D15(C));
  const tf = `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) rotate(${-cam.r}deg) translate(${-cam.x}px, ${-cam.y}px)`;
  const layer = { position: 'absolute', left: 0, top: 0, width: 0, height: 0, whiteSpace: 'nowrap', transformOrigin: '0 0', transform: tf };
  return (
    <div data-screen-label={`t=${Math.floor(time || 0)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG, fontVariantNumeric: 'lining-nums' }}>
      <div style={layer}><WorldGrid z={cam.z} on={tw.grid !== false} /></div>
      <Parallax cam={cam} T={T} />
      <div style={layer}>
        <TitleN T={T} C={C} />
        <Frame T={T} C={C} />
        <Params T={T} C={C} />
        <Results T={T} C={C} />
        <Encounter T={T} C={C} />
        <Compare T={T} C={C} />
        <Exit T={T} C={C} />
        <Scale T={T} C={C} />
      </div>
      <StopBand T={T} C={C} />
    </div>
  );
}
function U2Day15App() {
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
window.U2Day15App = U2Day15App;























