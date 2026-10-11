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

const ORDER = ['Title', 'Anchor', 'Detector', 'Slope', 'Worked', 'Far', 'Exit', 'Scale', 'Hold'];
const endOf = (C, n) => C[ORDER[ORDER.indexOf(n) + 1]];
const STOPS = {
  Anchor: [1, 'DISCUSS', 'A bowling ball and a tennis ball fall together (no air). Which has the bigger gravitational FORCE? Which has the bigger acceleration?'],
  Detector: [2, 'YOUR TURN', 'Read g off the graph: pick two points on the line and find the slope. Units?'],
  Worked: [3, 'PAIRS', 'Packet problems 1–4. Predict each fall time first, then check with a stopwatch drop (when safe).'],
  Exit: [4, 'EXIT TICKET', 'How long does it take a coin to fall 1 m from rest, ignoring air?'],
  Scale: [5, 'CHECK-IN', 'Where are you on K1 now? Rate yourself 0–4 and say what moved you.'],
};
const STOP_KEYS = Object.keys(STOPS), LAST = STOP_KEYS[STOP_KEYS.length - 1];
const CW = 2000, CH = 1040;
const shot = (cx, cy) => [cx, cy - CH / 2 + 526 / 0.8, 0.8];
const POS = { Anchor: [0, -1300], Detector: [2200, -1300], Slope: [2200, 0], Worked: [0, 0], Far: [-2200, 0], Exit: [-2200, 1300], Scale: [0, 1300] };
const Scene = ({ n, T, C, children, ph = 0 }) => <Card x={POS[n][0]} y={POS[n][1]} w={CW} h={CH} T={T} at={C[n] - 0.9} ph={ph}>{children}</Card>;
const Big = ({ T, at, top, left = 60, s, c = INK, size = 64, italic = false, w }) => (
  <div style={{ position: 'absolute', left, top, width: w, whiteSpace: w ? 'normal' : 'nowrap', opacity: env(T, at, 0.6), transform: `translateY(${(1 - env(T, at, 0.6)) * 14}px)`, fontFamily: SERIF, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: 1.2, color: c }}>{M(s)}</div>
);
const SV = ({ x, y, s, c, size = 44, an = 'start', o = 1 }) => o > 0 ? <text x={x} y={y} textAnchor={an} fontFamily={SERIF} fontStyle="italic" fontSize={size} fill={c} opacity={o}>{MS(s)}</text> : null;
const Arr = ({ x1, y1, x2, y2, c, w = 10, o = 1, h = 26, dash }) => o > 0 ? <path d={arrowD(x1, y1, x2, y2, h)} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} opacity={o} /> : null;
const G = 9.81;
function TitleN({ T, C }) {
  const a = C.Title - 1.2;
  return (
    <div style={{ position: 'absolute', left: -800, top: -3000, width: 1600, height: 800 }}>
      <Reveal T={T} at={a + 0.6} dur={1.0} style={{ left: 0, top: 70, fontFamily: MONO, fontSize: 34, fontWeight: 600, letterSpacing: '0.14em', color: CORAL }}>UNIT 2 · DAY 2 · BUILDING THE TOOLS</Reveal>
      <Reveal T={T} at={a + 1.0} dur={1.6} style={{ left: -4, top: 120, fontFamily: SERIF, fontStyle: 'italic', fontSize: 150, lineHeight: 1.0, color: INK }}>{M('g = 9.81 m/s²')}</Reveal>
      <Reveal T={T} at={a + 1.8} dur={1.6} style={{ left: -4, top: 290, fontFamily: SERIF, fontSize: 80, lineHeight: 1.1, color: INDIGO }}>coin, feather, asteroid: the same</Reveal>
      <Reveal T={T} at={a + 3.4} dur={1.6} style={{ left: 0, top: 460, fontFamily: SERIF, fontStyle: 'italic', fontSize: 46, color: INDIGO }}>K1 · Gravity as a constant acceleration near Earth.   S4 · Reading g off a v–t slope.</Reveal>
      <div style={{ position: 'absolute', left: 0, top: 590, opacity: env(T, a + 4.4), fontFamily: MONO, fontSize: 30, fontWeight: 500, color: GREY }}>Space: play / continue · N: next section · B: back</div>
    </div>
  );
}
function Anchor({ T, C }) {
  const a = C.Anchor, t = ((T - (a + 5)) % 2.4 + 2.4) % 2.4, y = 380 + Math.min(1, (t / 1.1) ** 2) * 420;
  return (
    <Scene n="Anchor" T={T} C={C} ph={0.2}>
      <Kicker T={T} at={a + 0.3} top={44} s="FROM DAY 1’S BEST EXIT TICKETS" />
      <div style={{ position: 'absolute', left: 60, top: 100, width: 1880, opacity: env(T, a + 0.6), padding: '20px 34px', borderRadius: 12, border: `4px solid ${SAGE}`, background: SAGE_T, boxSizing: 'border-box', fontFamily: SERIF, fontSize: 48, lineHeight: 1.25, color: INK, whiteSpace: 'normal' }}>Ignoring air resistance, objects near the same location have the same gravitational acceleration. Their gravitational forces depend on mass.</div>
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <line x1={300} y1={830} x2={1700} y2={830} stroke={INK} strokeWidth={5} opacity={env(T, a + 4)} />
        <circle cx={700} cy={y - 60} r={60} fill={INDIGO} stroke={INK} strokeWidth={4} opacity={env(T, a + 4)} />
        <circle cx={1300} cy={y - 24} r={24} fill="#d7e86a" stroke={INK} strokeWidth={3} opacity={env(T, a + 4)} />
        <SV x={700} y={890} s="bowling ball" c={INDIGO} size={36} an="middle" o={env(T, a + 4)} />
        <SV x={1300} y={890} s="tennis ball" c={INK} size={36} an="middle" o={env(T, a + 4)} />
      </svg>
    </Scene>
  );
}
const D1 = (t) => G * 0.998 * t, D2 = (t) => G * 1.002 * t;
function VTplot({ T, start, x, y, w, h, lines, tmax = 0.6, vmax = 6, ticks = true }) {
  const X = (t) => x + (t / tmax) * w, Y = (v) => y + h - (v / vmax) * h;
  return (
    <g>
      {[0, 2, 4, 6].map((v) => <g key={v}><line x1={x} y1={Y(v)} x2={x + w} y2={Y(v)} stroke={TINT} strokeWidth={2} /><text x={x - 14} y={Y(v) + 10} textAnchor="end" fontFamily={MONO} fontSize={28} fill={GREY}>{v}</text></g>)}
      {[0, 0.2, 0.4, 0.6].map((t) => <g key={t}><line x1={X(t)} y1={y} x2={X(t)} y2={y + h} stroke={TINT} strokeWidth={2} /><text x={X(t)} y={y + h + 40} textAnchor="middle" fontFamily={MONO} fontSize={28} fill={GREY}>{t}</text></g>)}
      <line x1={x} y1={y - 10} x2={x} y2={y + h} stroke={INK} strokeWidth={4} /><line x1={x} y1={y + h} x2={x + w + 10} y2={y + h} stroke={INK} strokeWidth={4} />
      <text x={x + 14} y={y + 6} fontFamily={SANS} fontSize={30} fontWeight={500} fill={INK}>v (m/s)</text>
      <text x={x + w} y={y + h + 84} textAnchor="end" fontFamily={SANS} fontSize={30} fontWeight={500} fill={INK}>t (s)</text>
      {lines.map(([f, c, at], i) => { const up = clamp(T - at, 0, tmax), n = Math.floor(up / 0.01); if (n < 1) return null; return <path key={i} d={Array.from({ length: n + 1 }, (_, k) => { const t = k * 0.01; return (k ? 'L ' : 'M ') + X(t).toFixed(1) + ' ' + Y(f(t) + 0.04 * Math.sin(t * 90 + i)).toFixed(1); }).join(' ')} fill="none" stroke={c} strokeWidth={5} />; })}
    </g>
  );
}
function Detector({ T, C }) {
  const d = C.Detector, t1 = clamp(T - (d + 3), 0, 0.6), t2 = clamp(T - (d + 7), 0, 0.6);
  const by = 280 + 900 * 0.5 * G * (T < d + 7 ? t1 : t2) ** 2 / 1.8 * 0.18;
  return (
    <Scene n="Detector" T={T} C={C} ph={0.6}>
      <div style={{ position: 'absolute', left: 60, top: 40, width: 1880, whiteSpace: 'normal', opacity: env(T, d + 0.3), fontFamily: MONO, fontSize: 32, fontWeight: 600, lineHeight: 1.35, color: SAGE }}>{M('STOP 1 · Bowling ball: bigger force (F = mg, more m). Same acceleration: a = F/m = g for both.')}</div>
      <Kicker T={T} at={d + 2.4} top={150} s="DEMO · MOTION DETECTOR ABOVE A DROPPED BALL" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, d + 2.6)}>
          <rect x={200} y={210} width={120} height={70} rx={10} fill={SAGE_T} stroke={INK} strokeWidth={4} />
          <circle cx={260} cy={290} r={28} fill="#ffffff" stroke={INK} strokeWidth={3} />
          <line x1={120} y1={900} x2={420} y2={900} stroke={INK} strokeWidth={5} />
          <circle cx={260} cy={Math.min(by + 40, 870)} r={30} fill={T < d + 7 ? INDIGO : CORAL} stroke={INK} strokeWidth={3} />
          <SV x={340} y={260} s="detector" c={GREY} size={32} />
        </g>
        <VTplot T={T} x={700} y={280} w={1100} h={520} lines={[[D1, INDIGO, d + 3], [D2, CORAL, d + 7]]} />
      </svg>
      <Big T={T} at={d + 4.4} top={880} left={700} s="ball 1" size={40} c={INDIGO} />
      <Big T={T} at={d + 8.4} top={880} left={900} s="ball 2 (heavier): the same line" size={40} c={CORAL} />
    </Scene>
  );
}
function Slope({ T, C }) {
  const s = C.Slope, X = (t) => 700 + (t / 0.6) * 1100, Y = (v) => 280 + 520 - (v / 6) * 520;
  const tri = env(T, s + 1.4, 0.6);
  return (
    <Scene n="Slope" T={T} C={C} ph={0.9}>
      <Kicker T={T} at={s + 0.3} top={44} s="ANSWER · SLOPE OF v–t = g" c={SAGE} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <VTplot T={T} x={700} y={280} w={1100} h={520} lines={[[D1, INDIGO, s - 10], [D2, CORAL, s - 10]]} />
        {tri > 0 && <g opacity={tri}><circle cx={X(0.1)} cy={Y(0.98)} r={10} fill={INK} /><circle cx={X(0.5)} cy={Y(4.9)} r={10} fill={INK} /><path d={`M ${X(0.1)} ${Y(0.98)} L ${X(0.5)} ${Y(0.98)} L ${X(0.5)} ${Y(4.9)}`} fill="none" stroke={SAGE} strokeWidth={5} strokeDasharray="12 8" /><SV x={X(0.3)} y={Y(0.98) + 50} s="Δt = 0.40 s" c={SAGE} size={36} an="middle" /><SV x={X(0.5) + 20} y={Y(3)} s="Δv = 3.92 m/s" c={SAGE} size={36} /></g>}
      </svg>
      <Big T={T} at={s + 3} top={300} w={600} s="g = Δv / Δt" size={64} italic c={INDIGO} />
      <Big T={T} at={s + 4.4} top={400} w={600} s="= 3.92 ÷ 0.40" size={50} italic />
      <Big T={T} at={s + 5.6} top={480} w={600} s="≈ 9.8 m/s²" size={72} c={INDIGO} />
      <Big T={T} at={s + 7.4} top={620} w={600} s="Units: (m/s) ÷ s = m/s²." size={40} c={GREY} />
      <Big T={T} at={s + 9} top={900} w={1880} s="Same slope for both balls: equal acceleration, even though the heavier ball feels a bigger force." size={42} italic c={GREY} />
    </Scene>
  );
}
function Worked({ T, C }) {
  const w = C.Worked;
  const col = (x, h, t, v, at) => (
    <React.Fragment>
      <Big T={T} at={at} top={180} left={x} s={`fall ${h} m from rest`} size={50} />
      <Big T={T} at={at + 1.2} top={260} left={x} s={`y = ½gt² → t = √(2y/g)`} size={42} italic c={GREY} />
      <Big T={T} at={at + 2.6} top={340} left={x} s={`t = √(2 × ${h} ÷ 9.81) ≈ ${t} s`} size={48} italic c={INDIGO} />
      <Big T={T} at={at + 4} top={430} left={x} s={`v = gt ≈ (9.81)(${t}) ≈ ${v} m/s`} size={48} italic c={INDIGO} />
    </React.Fragment>
  );
  return (
    <Scene n="Worked" T={T} C={C} ph={0.4}>
      <Kicker T={T} at={w + 0.3} top={44} s="WORKED EXAMPLES · y = ½gt²  ·  v = gt" />
      {col(60, 10, '1.43', '14.0', w + 0.8)}
      {col(1040, 100, '4.52', '44.3', w + 6)}
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <line x1={980} y1={180} x2={980} y2={540} stroke={LINE} strokeWidth={3} />
      </svg>
      <div style={{ position: 'absolute', left: 60, top: 620, opacity: env(T, w + 12), padding: '14px 30px', borderRadius: 10, border: `3px solid ${CORAL}`, background: CORAL_T, fontFamily: SERIF, fontSize: 46, color: INK, whiteSpace: 'normal', width: 1880, boxSizing: 'border-box' }}>10 times higher, but only about 3.2 times longer: the ball keeps speeding up.</div>
      <Big T={T} at={w + 14} top={780} w={1880} s="Air resistance ignored. Real falls of 100 m take a little longer." size={40} italic c={GREY} />
    </Scene>
  );
}
function Far({ T, C }) {
  const f = C.Far, E = [300, 560];
  return (
    <Scene n="Far" T={T} C={C} ph={0.5}>
      <Kicker T={T} at={f + 0.3} top={44} s="BACK TO 2026-XJ" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <circle cx={E[0]} cy={E[1]} r={110} fill="#d7d8ea" stroke={INK} strokeWidth={4} opacity={env(T, f + 0.6)} />
        <SV x={E[0]} y={E[1] + 160} s="Earth" c={INK} size={40} an="middle" o={env(T, f + 0.6)} />
        {[[640, 'near the surface: 9.81 m/s²', 1.4, 160], [1080, 'farther out: smaller', 3.2, 90], [1620, 'at 1.2 × 10^8 km: 2.8 × 10^−8 m/s²', 5, 20]].map(([x, l, at, len], i) => <g key={i} opacity={env(T, f + at)}><Rock x={x} y={E[1]} r={22} spin={T * 14} /><Arr x1={x - 30} y1={E[1]} x2={Math.max(x - 30 - len, E[0] + 130)} y2={E[1]} c={CORAL} w={7} h={18} /><SV x={i === 0 ? 470 : x} y={E[1] - 60 - (i % 2) * 50} s={l} c={CORAL} size={34} an={i === 0 ? 'start' : 'middle'} /></g>)}
      </svg>
      <Big T={T} at={f + 7} top={820} w={1880} s="Near Earth, the asteroid falls with the same g as a coin. Far away, Earth’s pull weakens with distance: coming up this unit." size={44} />
    </Scene>
  );
}
function Exit({ T, C }) {
  const e = C.Exit, t = ((T - e) % 2 + 2) % 2, y = 330 + Math.min(1, (t / 0.9) ** 2) * 400;
  return (
    <Scene n="Exit" T={T} C={C} ph={0.3}>
      <div style={{ position: 'absolute', left: 60, top: 40, width: 1880, whiteSpace: 'normal', opacity: env(T, e + 0.3), fontFamily: MONO, fontSize: 32, fontWeight: 600, color: SAGE }}>Check your packet answers with your partner before the exit ticket.</div>
      <Kicker T={T} at={e + 1.4} top={130} s="EXIT TICKET" />
      <Big T={T} at={e + 1.8} top={180} s="A coin falls 1 m from rest." size={72} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <line x1={1200} y1={330} x2={1200} y2={740} stroke={GREY} strokeWidth={3} strokeDasharray="8 8" opacity={env(T, e + 2.4)} />
        <SV x={1230} y={540} s="1 m" c={GREY} size={44} o={env(T, e + 2.4)} />
        <ellipse cx={1120} cy={y} rx={30} ry={10} fill="#e6c36a" stroke={INK} strokeWidth={3} opacity={env(T, e + 2.4)} />
        <line x1={900} y1={750} x2={1400} y2={750} stroke={INK} strokeWidth={5} opacity={env(T, e + 2.4)} />
      </svg>
      <Big T={T} at={e + 3.4} top={820} s="t = ?   (ignore air)" size={58} c={INDIGO} italic />
    </Scene>
  );
}
function Scale({ T, C }) {
  const s = C.Scale;
  const lv = [['0', 'not yet'], ['1', 'with help'], ['2', 'the simpler parts'], ['3', 'the target'], ['4', 'beyond it']];
  return (
    <Scene n="Scale" T={T} C={C} ph={0.7}>
      <Kicker T={T} at={s + 0.3} top={44} s="MARZANO CHECK-IN" />
      <div style={{ position: 'absolute', left: 60, top: 110, width: 1880, opacity: env(T, s + 0.6), padding: '20px 30px', borderRadius: 10, border: `3px solid ${INDIGO}`, background: '#ffffff', boxSizing: 'border-box' }}><div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 600, color: INDIGO }}>K1</div><div style={{ fontFamily: SERIF, fontSize: 44, color: INK, marginTop: 6 }}>Gravity as a constant acceleration near Earth.</div></div>
      <div style={{ position: 'absolute', left: 60, top: 380, display: 'flex', gap: 24 }}>
        {lv.map(([n, t], i) => <div key={i} style={{ width: 356, opacity: env(T, s + 2 + i * 0.4), padding: '20px 0', borderRadius: 10, background: ['#f7e1da', '#f3e6cf', '#eeeefa', SAGE_T, SAGE_T][i], border: `2px solid ${LINE}`, textAlign: 'center' }}><div style={{ fontFamily: MONO, fontSize: 60, fontWeight: 600, color: INK }}>{n}</div><div style={{ fontFamily: SERIF, fontSize: 38, color: GREY }}>{t}</div></div>)}
      </div>
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











function shotsU2D2(C) {
  const o = (t, d, p, dip = 0.3, r = 0) => ({ t, d, x: p[0], y: p[1], z: p[2], r, dip });
  const S = (n) => shot(...POS[n]);
  return [
    { t: -1, d: 0, x: 0, y: -2700, z: 1.15, r: -2, dip: 0 }, { t: C.Title, d: 5, x: 0, y: -2680, z: 1.0, r: 0, dip: 0 },
    ...['Anchor', 'Detector', 'Slope', 'Worked', 'Far', 'Exit', 'Scale'].map((n) => o(C[n], 1.9, S(n))),
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
  const cam = camAt(T, shotsU2D2(C));
  const tf = `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) rotate(${-cam.r}deg) translate(${-cam.x}px, ${-cam.y}px)`;
  const layer = { position: 'absolute', left: 0, top: 0, width: 0, height: 0, whiteSpace: 'nowrap', transformOrigin: '0 0', transform: tf };
  return (
    <div data-screen-label={`t=${Math.floor(time || 0)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG, fontVariantNumeric: 'lining-nums' }}>
      <div style={layer}><WorldGrid z={cam.z} on={tw.grid !== false} /></div>
      <Parallax cam={cam} T={T} />
      <div style={layer}>
        <TitleN T={T} C={C} />
        <Anchor T={T} C={C} />
        <Detector T={T} C={C} />
        <Slope T={T} C={C} />
        <Worked T={T} C={C} />
        <Far T={T} C={C} />
        <Exit T={T} C={C} />
        <Scale T={T} C={C} />
      </div>
      <StopBand T={T} C={C} />
    </div>
  );
}
function U2Day2App() {
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
window.U2Day2App = U2Day2App;











