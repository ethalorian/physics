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

const ORDER = ['Title', 'Hook', 'Law1', 'Law2', 'Law3', 'Practice', 'Exit', 'Scale', 'Hold'];
const endOf = (C, n) => C[ORDER[ORDER.indexOf(n) + 1]];
const STOPS = {
  Hook: [1, 'PREDICT', 'Is a planet’s orbit a perfect circle, with the Sun at the centre? Predict what Kepler found.'],
  Law1: [2, 'DISCUSS', 'Where on this orbit is the planet moving fastest? Slowest? Why might that be?'],
  Law3: [3, 'YOUR TURN', 'Mars orbits the Sun with a = 1.52 AU. Use T² = a³ (years and AU) to find its period.'],
  Practice: [4, 'PRACTICE', 'Worksheet: find the period of each orbit. The asteroid has a = 2.8 AU.'],
  Exit: [5, 'EXIT TICKET', 'Write each of Kepler’s three laws in one sentence, in your own words.'],
  Scale: [6, 'CHECK-IN', 'Where are you on K4? Rate yourself 0–4.'],
};
const STOP_KEYS = Object.keys(STOPS), LAST = STOP_KEYS[STOP_KEYS.length - 1];
const CW = 2000, CH = 1040;
const shot = (cx, cy) => [cx, cy - CH / 2 + 526 / 0.8, 0.8];
const POS = { Hook: [0, -1300], Law1: [2200, -1300], Law2: [2200, 0], Law3: [0, 0], Practice: [-2200, 0], Exit: [-2200, 1300], Scale: [0, 1300] };
const Scene = ({ n, T, C, children, ph = 0 }) => <Card x={POS[n][0]} y={POS[n][1]} w={CW} h={CH} T={T} at={C[n] - 0.9} ph={ph}>{children}</Card>;
const Big = ({ T, at, top, left = 60, s, c = INK, size = 64, italic = false, w }) => (
  <div style={{ position: 'absolute', left, top, width: w, whiteSpace: w ? 'normal' : 'nowrap', opacity: env(T, at, 0.6), transform: `translateY(${(1 - env(T, at, 0.6)) * 14}px)`, fontFamily: SERIF, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: 1.2, color: c }}>{M(s)}</div>
);
const SV = ({ x, y, s, c, size = 44, an = 'start', o = 1 }) => o > 0 ? <text x={x} y={y} textAnchor={an} fontFamily={SERIF} fontStyle="italic" fontSize={size} fill={c} opacity={o}>{MS(s)}</text> : null;
// position on an ellipse (focus at origin, perihelion on +x) after time t, from Kepler's equation
function kep(a, e, P, t) {
  const Mn = 2 * Math.PI * ((((t / P) % 1) + 1) % 1);
  let E = Mn;
  for (let i = 0; i < 10; i++) E -= (E - e * Math.sin(E) - Mn) / (1 - e * Math.cos(E));
  return [a * (Math.cos(E) - e), a * Math.sqrt(1 - e * e) * Math.sin(E)];
}
const ellD = (F, a, e) => Array.from({ length: 121 }, (_, k) => { const E = (k / 120) * Math.PI * 2; return (k ? 'L ' : 'M ') + (F[0] + a * (Math.cos(E) - e)).toFixed(1) + ' ' + (F[1] + a * Math.sqrt(1 - e * e) * Math.sin(E)).toFixed(1); }).join(' ') + ' Z';
function Sun({ x, y, r = 34, o = 1 }) {
  return <g opacity={o}><circle cx={x} cy={y} r={r} fill={CORAL_T} stroke={CORAL} strokeWidth={4} />{Array.from({ length: 8 }, (_, k) => { const q = (k / 8) * Math.PI * 2; return <line key={k} x1={x + (r + 8) * Math.cos(q)} y1={y + (r + 8) * Math.sin(q)} x2={x + (r + 20) * Math.cos(q)} y2={y + (r + 20) * Math.sin(q)} stroke={CORAL} strokeWidth={3} strokeLinecap="round" />; })}</g>;
}
const EL = { a: 480, e: 0.6, P: 8, F: [908, 560] };
function TitleN({ T, C }) {
  const a = C.Title - 1.2;
  return (
    <div style={{ position: 'absolute', left: -800, top: -3000, width: 1600, height: 800 }}>
      <Reveal T={T} at={a + 0.6} dur={1.0} style={{ left: 0, top: 70, fontFamily: MONO, fontSize: 34, fontWeight: 600, letterSpacing: '0.14em', color: CORAL }}>UNIT 2 · DAY 14 · BUILDING THE TOOLS</Reveal>
      <Reveal T={T} at={a + 1.0} dur={1.6} style={{ left: -4, top: 120, fontFamily: SERIF, fontSize: 150, lineHeight: 1.0, color: INK }}>Kepler’s three laws</Reveal>
      <Reveal T={T} at={a + 1.8} dur={1.6} style={{ left: -4, top: 280, fontFamily: SERIF, fontStyle: 'italic', fontSize: 80, lineHeight: 1.1, color: INDIGO }}>{M('ellipses · equal areas · T² ∝ a³')}</Reveal>
      <Reveal T={T} at={a + 3.4} dur={1.6} style={{ left: 0, top: 460, fontFamily: SERIF, fontStyle: 'italic', fontSize: 50, color: INDIGO }}>K4 · State and apply Kepler’s three laws.</Reveal>
      <div style={{ position: 'absolute', left: 0, top: 590, opacity: env(T, a + 4.4), fontFamily: MONO, fontSize: 30, fontWeight: 500, color: GREY }}>Space: play / continue · N: next section · B: back</div>
    </div>
  );
}
function Hook({ T, C }) {
  const h = C.Hook, F = [700, 540], a = 330, e = 0.25, n = 22;
  return (
    <Scene n="Hook" T={T} C={C} ph={0.2}>
      <Kicker T={T} at={h + 0.3} top={44} s="HOOK · PATTERNS BEFORE NEWTON" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Sun x={F[0]} y={F[1]} r={26} o={env(T, h + 0.6)} />
        {Array.from({ length: n }, (_, k) => { const [x, y] = kep(a, e, n, k + 0.3 * Math.sin(k * 7.1)); const o = env(T, h + 1.2 + k * 0.22, 0.3); return o > 0 ? <circle key={k} cx={F[0] + x} cy={F[1] + y} r={9} fill={INDIGO} opacity={0.8 * o} /> : null; })}
        <text x={F[0]} y={F[1] + 420} textAnchor="middle" fontFamily={MONO} fontSize={28} fill={GREY} opacity={env(T, h + 3)}>Tycho Brahe’s naked-eye positions of a planet (sketch)</text>
      </svg>
      <Big T={T} at={h + 1.4} top={160} left={1200} w={740} s="Johannes Kepler, 1609–1619." size={52} />
      <Big T={T} at={h + 3} top={250} left={1200} w={740} s="No telescope data from space. No calculus yet. Just years of careful measurements." size={42} />
      <Big T={T} at={h + 6} top={480} left={1200} w={740} s="He found three patterns that every orbit obeys." size={50} c={INDIGO} italic />
      <Big T={T} at={h + 8.4} top={680} left={1200} w={740} s="Newton explained WHY in 1687, with gravity." size={40} italic c={GREY} />
    </Scene>
  );
}
function Law1({ T, C }) {
  const l = C.Law1, { a, e, P, F } = EL, b = a * Math.sqrt(1 - e * e), cx = F[0] - a * e, F2 = [F[0] - 2 * a * e, F[1]];
  const [px, py] = kep(a, e, P, T - (l + 4));
  const p = [F[0] + px, F[1] + py], pins = env(T, l + 7, 0.6);
  return (
    <Scene n="Law1" T={T} C={C} ph={0.6}>
      <Kicker T={T} at={l + 0.3} top={44} s="LAW 1 · ANSWER: NOT A CIRCLE, AND THE SUN IS OFF-CENTRE" c={SAGE} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <path d={ellD(F, a, e)} fill="none" stroke={INK} strokeWidth={4} opacity={env(T, l + 0.8)} />
        <Sun x={F[0]} y={F[1]} o={env(T, l + 1.4)} />
        <SV x={F[0] - 50} y={F[1] + 80} s="Sun at a focus" c={CORAL} size={36} an="end" o={env(T, l + 1.8)} />
        <g opacity={env(T, l + 2.6)}><circle cx={F2[0]} cy={F2[1]} r={8} fill="none" stroke={GREY} strokeWidth={3} /><SV x={F2[0]} y={F2[1] - 26} s="empty focus" c={GREY} size={32} an="middle" /></g>
        <g opacity={env(T, l + 3.2)}><path d={`M ${cx - 10} ${F[1] - 10} L ${cx + 10} ${F[1] + 10} M ${cx + 10} ${F[1] - 10} L ${cx - 10} ${F[1] + 10}`} stroke={GREY} strokeWidth={3} /><SV x={cx} y={F[1] - 26} s="centre (not the Sun)" c={GREY} size={30} an="middle" /></g>
        {pins > 0 && <g opacity={pins}><line x1={F[0]} y1={F[1]} x2={p[0]} y2={p[1]} stroke={SAGE} strokeWidth={3} /><line x1={F2[0]} y1={F2[1]} x2={p[0]} y2={p[1]} stroke={SAGE} strokeWidth={3} /></g>}
        <circle cx={p[0]} cy={p[1]} r={16} fill={INDIGO} opacity={env(T, l + 4)} />
        <SV x={F[0] + a * (1 - e) + 14} y={F[1] + 10} s="perihelion" c={INDIGO} size={30} an="start" o={env(T, l + 3.6)} />
        <SV x={F[0] - a * (1 + e) - 14} y={F[1] + 10} s="aphelion" c={INDIGO} size={30} an="end" o={env(T, l + 3.8)} />
      </svg>
      <Big T={T} at={l + 1} top={160} left={1240} w={700} s="Orbits are ellipses, with the Sun at one focus." size={50} />
      <Big T={T} at={l + 3.6} top={330} left={1240} w={700} s="Perihelion: closest to the Sun. Aphelion: farthest." size={42} c={INDIGO} />
      <Big T={T} at={l + 7.4} top={500} left={1240} w={700} s="The two green lines always add to the same length." size={42} c={SAGE} />
      <Big T={T} at={l + 9.6} top={700} left={1240} w={700} s="Drawn stretched. Real planet orbits are close to circles (Earth: e = 0.017)." size={34} italic c={GREY} />
    </Scene>
  );
}
function Law2({ T, C }) {
  const l = C.Law2, { a, e, P, F } = EL, dt = 1;
  const [px, py] = kep(a, e, P, T - l);
  const sector = (t0) => 'M ' + F[0] + ' ' + F[1] + ' ' + Array.from({ length: 21 }, (_, k) => { const [x, y] = kep(a, e, P, t0 + (k / 20) * dt); return 'L ' + (F[0] + x).toFixed(1) + ' ' + (F[1] + y).toFixed(1); }).join(' ') + ' Z';
  const s1 = env(T, l + 4.4, 0.6), s2 = env(T, l + 7, 0.6);
  return (
    <Scene n="Law2" T={T} C={C} ph={0.9}>
      <Kicker T={T} at={l + 0.3} top={44} s="LAW 2 · ANSWER: FASTEST AT PERIHELION, SLOWEST AT APHELION" c={SAGE} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <path d={ellD(F, a, e)} fill="none" stroke={INK} strokeWidth={4} />
        {s1 > 0 && <path d={sector(-dt / 2)} fill={CORAL} opacity={0.35 * s1} stroke={CORAL} strokeWidth={2} />}
        {s2 > 0 && <path d={sector(P / 2 - dt / 2)} fill={INDIGO} opacity={0.3 * s2} stroke={INDIGO} strokeWidth={2} />}
        <Sun x={F[0]} y={F[1]} />
        <line x1={F[0]} y1={F[1]} x2={F[0] + px} y2={F[1] + py} stroke={GREY} strokeWidth={2} strokeDasharray="6 8" />
        <circle cx={F[0] + px} cy={F[1] + py} r={16} fill={INDIGO} />
        <SV x={F[0] + a * (1 - e) + 24} y={F[1] + 120} s="1 s" c={CORAL} size={40} o={s1} />
        <SV x={F[0] - a * (1 + e) + 60} y={F[1] - 60} s="1 s" c={INDIGO} size={40} o={s2} />
      </svg>
      <Big T={T} at={l + 1} top={160} left={1240} w={700} s="A line from the Sun to the planet sweeps equal areas in equal times." size={46} />
      <Big T={T} at={l + 4.8} top={380} left={1240} w={700} s="Near the Sun: short and wide." size={44} c={CORAL} />
      <Big T={T} at={l + 7.4} top={470} left={1240} w={700} s="Far away: long and thin." size={44} c={INDIGO} />
      <Big T={T} at={l + 9.6} top={580} left={1240} w={700} s="Same area, so the planet must move faster near the Sun." size={46} c={SAGE} />
    </Scene>
  );
}
function Law3({ T, C }) {
  const l = C.Law3;
  const rows = [['Earth', '1.00', '1.00', '1.00', '1.00'], ['Jupiter', '5.20', '11.86', '140.7', '140.6']];
  const cols = [260, 220, 220, 240, 240];
  return (
    <Scene n="Law3" T={T} C={C} ph={0.4}>
      <Kicker T={T} at={l + 0.3} top={44} s="LAW 3 · FOR ORBITS AROUND THE SAME BODY" />
      <Big T={T} at={l + 0.6} top={92} s="T² ∝ a³" size={84} italic c={INDIGO} />
      <Big T={T} at={l + 1.6} top={120} left={520} w={1420} s="T = period (one full orbit). a = semi-major axis: half the long width of the ellipse." size={38} c={GREY} />
      <div style={{ position: 'absolute', left: 60, top: 240, opacity: env(T, l + 3), border: `3px solid ${INK}`, borderRadius: 8, background: '#ffffff', overflow: 'hidden' }}>
        <div style={{ display: 'flex', background: '#eeeefa', padding: '10px 24px', fontFamily: SANS, fontSize: 30, fontWeight: 500, color: INK }}>{['around the Sun', 'a (AU)', 'T (years)', 'T²', 'a³'].map((h, k) => <div key={k} style={{ width: cols[k] }}>{M(h)}</div>)}</div>
        {rows.map((r, i) => <div key={i} style={{ display: 'flex', padding: '10px 24px', borderTop: `2px solid ${TINT}`, fontFamily: MONO, fontSize: 36, fontWeight: 500, opacity: env(T, l + 3.6 + i * 1.2, 0.4) }}>{r.map((v, k) => <div key={k} style={{ width: cols[k], color: k < 3 ? INK : SAGE, fontWeight: k > 2 ? 600 : 500 }}>{v}</div>)}</div>)}
      </div>
      <div style={{ position: 'absolute', left: 1320, top: 260, width: 620, opacity: env(T, l + 6.4), padding: '14px 26px', borderRadius: 12, border: `4px solid ${SAGE}`, background: SAGE_T, fontFamily: SERIF, fontSize: 46, color: INK, boxSizing: 'border-box', whiteSpace: 'normal' }}>{M('Around the Sun, in years and AU: T² = a³')}</div>
      <Kicker T={T} at={l + 9} top={520} s="SAME LAW AROUND EARTH · A DIFFERENT CONSTANT" />
      <Big T={T} at={l + 9.4} top={570} w={1880} s="Moon: a = 384,400 km, T = 27.3 days  ·  ISS: a = 6,770 km, T = 93 min" size={42} />
      <Big T={T} at={l + 11.6} top={650} w={1880} s="a is 57× bigger → T should be 57 × √57 ≈ 430× longer." size={46} italic c={INDIGO} />
      <Big T={T} at={l + 14} top={730} w={1880} s="Actual: 27.3 days ÷ 93 min ≈ 423× ✓" size={46} italic c={SAGE} />
      <div style={{ position: 'absolute', left: 60, top: 840, width: 1880, opacity: env(T, l + 16.4), padding: '10px 26px', borderRadius: 10, border: `3px solid ${CORAL}`, background: CORAL_T, fontFamily: SERIF, fontSize: 40, color: INK, boxSizing: 'border-box', whiteSpace: 'normal' }}>Don’t mix central bodies: the Moon (around Earth) and Mars (around the Sun) follow different constants.</div>
    </Scene>
  );
}
function Practice({ T, C }) {
  const p = C.Practice, S = [560, 580], AU = 110, yr = 4, t = T - p;
  const orbs = [['Earth', 1, 0, INDIGO, 12], ['Mars', 1.52, 0, CORAL, 11], ['asteroid', 2.8, 0.3, GREY, 9]];
  return (
    <Scene n="Practice" T={T} C={C} ph={0.5}>
      <div style={{ position: 'absolute', left: 60, top: 40, opacity: env(T, p + 0.3), fontFamily: MONO, fontSize: 34, fontWeight: 600, color: SAGE }}>{M('STOP 3 · Mars: T = √(1.52³) = √3.51 ≈ 1.87 years ✓ (measured: 1.88)')}</div>
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Sun x={S[0]} y={S[1]} r={26} o={env(T, p + 1)} />
        {orbs.map(([n, a, e, c, r], i) => { const A = a * AU, [x, y] = kep(A, e, yr * Math.pow(a, 1.5), t + i * 1.3), o = env(T, p + 1.6 + i * 0.8); return (
          <g key={i} opacity={o}>
            <path d={ellD(S, A, e)} fill="none" stroke={c} strokeWidth={3} strokeDasharray={i === 2 ? '12 8' : undefined} />
            <circle cx={S[0] + x} cy={S[1] + y} r={r} fill={c} />
          </g>
        ); })}
      </svg>
      {orbs.map(([n, a, e, c], i) => <Big key={i} T={T} at={p + 1.6 + i * 0.8} top={180 + i * 100} left={1100} w={840} s={`${n}: a = ${a} AU`} size={48} c={c} />)}
      <Big T={T} at={p + 5} top={520} left={1100} w={840} s="Bigger orbit → longer year. Watch the asteroid lag behind." size={44} />
      <Big T={T} at={p + 7.6} top={700} left={1100} w={840} s="Use T² = a³ to find each period (years, AU)." size={44} italic c={INDIGO} />
    </Scene>
  );
}
function Exit({ T, C }) {
  const e = C.Exit;
  const cards = [['LAW 1 · SHAPE', 0], ['LAW 2 · SPEED', 1], ['LAW 3 · TIMING', 2]];
  return (
    <Scene n="Exit" T={T} C={C} ph={0.3}>
      <div style={{ position: 'absolute', left: 60, top: 40, opacity: env(T, e + 0.3), fontFamily: MONO, fontSize: 34, fontWeight: 600, color: SAGE }}>{M('STOP 4 · asteroid: T = √(2.8³) = √22.0 ≈ 4.7 years')}</div>
      <Kicker T={T} at={e + 1.4} top={130} s="EXIT TICKET · ONE SENTENCE EACH, IN YOUR OWN WORDS" />
      {cards.map(([h, k], i) => (
        <div key={i} style={{ position: 'absolute', left: 60 + i * 640, top: 210, width: 600, height: 640, opacity: env(T, e + 1.8 + i * 0.5), border: `3px solid ${LINE}`, borderRadius: 12, background: '#ffffff' }}>
          <div style={{ position: 'absolute', left: 30, top: 24, fontFamily: MONO, fontSize: 32, fontWeight: 600, letterSpacing: '0.08em', color: [INDIGO, CORAL, SAGE][i] }}>{h}</div>
          <svg width={600} height={640} style={{ position: 'absolute', left: 0, top: 0 }}>
            {k === 0 && <g><path d={ellD([380, 260], 170, 0.6)} fill="none" stroke={INK} strokeWidth={3} /><circle cx={380} cy={260} r={14} fill={CORAL_T} stroke={CORAL} strokeWidth={3} /></g>}
            {k === 1 && <g><path d={ellD([380, 260], 170, 0.6)} fill="none" stroke={INK} strokeWidth={3} /><path d={`M 380 260 L 448 210 L 448 310 Z`} fill={CORAL} opacity={0.35} /><path d={`M 380 260 L 128 235 L 128 285 Z`} fill={INDIGO} opacity={0.3} /><circle cx={380} cy={260} r={14} fill={CORAL_T} stroke={CORAL} strokeWidth={3} /></g>}
            {k === 2 && <text x={300} y={290} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={110} fill={INDIGO}>T² ∝ a³</text>}
            {[460, 530, 600].map((y) => <line key={y} x1={30} y1={y} x2={570} y2={y} stroke={LINE} strokeWidth={3} />)}
          </svg>
        </div>
      ))}
    </Scene>
  );
}
function Scale({ T, C }) {
  const s = C.Scale;
  const lv = [['0', 'not yet'], ['1', 'with help'], ['2', 'the simpler parts'], ['3', 'the target'], ['4', 'beyond it']];
  return (
    <Scene n="Scale" T={T} C={C} ph={0.7}>
      <Kicker T={T} at={s + 0.3} top={44} s="MARZANO CHECK-IN" />
      <div style={{ position: 'absolute', left: 60, top: 110, width: 1880, opacity: env(T, s + 0.6), padding: '20px 30px', borderRadius: 10, border: `3px solid ${INDIGO}`, background: '#ffffff', boxSizing: 'border-box' }}><div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 600, color: INDIGO }}>K4</div><div style={{ fontFamily: SERIF, fontSize: 44, color: INK, marginTop: 6 }}>State and apply Kepler’s three laws.</div></div>
      <div style={{ position: 'absolute', left: 60, top: 380, display: 'flex', gap: 24 }}>
        {lv.map(([n, t], i) => <div key={i} style={{ width: 356, opacity: env(T, s + 1.2 + i * 0.3), padding: '20px 0', borderRadius: 10, background: ['#f7e1da', '#f3e6cf', '#eeeefa', SAGE_T, SAGE_T][i], border: `2px solid ${LINE}`, textAlign: 'center' }}><div style={{ fontFamily: MONO, fontSize: 60, fontWeight: 600, color: INK }}>{n}</div><div style={{ fontFamily: SERIF, fontSize: 38, color: GREY }}>{t}</div></div>)}
      </div>
      <Big T={T} at={s + 3.4} top={680} s="With one period and the orbit’s size, Law 3 times 2026-XJ’s whole orbit." size={46} c={INDIGO} italic />
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






















function shotsU2D14(C) {
  const o = (t, d, p, dip = 0.3, r = 0) => ({ t, d, x: p[0], y: p[1], z: p[2], r, dip });
  const S = (n) => shot(...POS[n]);
  return [
    { t: -1, d: 0, x: 0, y: -2700, z: 1.15, r: -2, dip: 0 }, { t: C.Title, d: 5, x: 0, y: -2680, z: 1.0, r: 0, dip: 0 },
    ...['Hook', 'Law1', 'Law2', 'Law3', 'Practice', 'Exit', 'Scale'].map((n) => o(C[n], 1.9, S(n))),
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
  const cam = camAt(T, shotsU2D14(C));
  const tf = `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) rotate(${-cam.r}deg) translate(${-cam.x}px, ${-cam.y}px)`;
  const layer = { position: 'absolute', left: 0, top: 0, width: 0, height: 0, whiteSpace: 'nowrap', transformOrigin: '0 0', transform: tf };
  return (
    <div data-screen-label={`t=${Math.floor(time || 0)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG, fontVariantNumeric: 'lining-nums' }}>
      <div style={layer}><WorldGrid z={cam.z} on={tw.grid !== false} /></div>
      <Parallax cam={cam} T={T} />
      <div style={layer}>
        <TitleN T={T} C={C} />
        <Hook T={T} C={C} />
        <Law1 T={T} C={C} />
        <Law2 T={T} C={C} />
        <Law3 T={T} C={C} />
        <Practice T={T} C={C} />
        <Exit T={T} C={C} />
        <Scale T={T} C={C} />
      </div>
      <StopBand T={T} C={C} />
    </div>
  );
}
function U2Day14App() {
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
window.U2Day14App = U2Day14App;






















