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

const ORDER = ['Title', 'Return', 'Define', 'Examples', 'Chart', 'Direction', 'Exit', 'Marz', 'Hold'];
const endOf = (C, n) => C[ORDER[ORDER.indexOf(n) + 1]];
const STOPS = {
  Define: [1, 'YOUR TURN', 'A 1500 kg car moves at 30 m/s east. What is its momentum? Give units and a direction.'],
  Examples: [2, 'PREDICT', '2026-XJ: about 3.5 × 10^11 kg at 8,500 m/s. Estimate its momentum. How many cruise ships is that?'],
  Direction: [3, 'PRACTICE', 'Packet: 6 problems. Choose a + direction first, and keep the sign on every velocity.'],
  Exit: [4, 'EXIT TICKET', 'A 0.15 kg baseball at 40 m/s east bounces back at 50 m/s west. What is the CHANGE in its momentum?'],
  Marz: [5, 'CHECK-IN', 'Where are you on K1 and S1? Rate yourself 0–4.'],
};
const STOP_KEYS = Object.keys(STOPS), LAST = STOP_KEYS[STOP_KEYS.length - 1];
const CW = 2000, CH = 1040;
const shot = (cx, cy) => [cx, cy - CH / 2 + 526 / 0.8, 0.8];
const POS = { Return: [0, -1300], Define: [2200, -1300], Examples: [2200, 0], Chart: [0, 0], Direction: [-2200, 0], Exit: [-2200, 1300], Marz: [0, 1300] };
const Scene = ({ n, T, C, children, ph = 0 }) => <Card x={POS[n][0]} y={POS[n][1]} w={CW} h={CH} T={T} at={C[n] - 0.9} ph={ph}>{children}</Card>;
const Big = ({ T, at, top, left = 60, s, c = INK, size = 64, italic = false, w }) => (
  <div style={{ position: 'absolute', left, top, width: w, whiteSpace: w ? 'normal' : 'nowrap', opacity: env(T, at, 0.6), transform: `translateY(${(1 - env(T, at, 0.6)) * 14}px)`, fontFamily: SERIF, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: 1.2, color: c }}>{M(s)}</div>
);
const SV = ({ x, y, s, c, size = 44, an = 'start', o = 1 }) => o > 0 ? <text x={x} y={y} textAnchor={an} fontFamily={SERIF} fontStyle="italic" fontSize={size} fill={c} opacity={o}>{MS(s)}</text> : null;
const Arr2 = ({ x1, y1, x2, y2, c, w = 9, o = 1, h = 22 }) => o > 0 ? <path d={arrowD(x1, y1, x2, y2, h)} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={o} /> : null;
const ROWS = [
  ['car', '1500', '30', '45,000', 4.65, INDIGO],
  ['bullet', '0.05', '400', '20', 1.3, GREY],
  ['sprinter', '70', '10', '700', 2.85, SAGE],
  ['cruise ship', '5 × 10^6', '8', '4 × 10^7', 7.6, INDIGO],
  ['2026-XJ', '3.5 × 10^11', '8,500', '3.0 × 10^15', 15.5, CORAL],
];
function TitleN({ T, C }) {
  const a = C.Title - 1.2;
  return (
    <div style={{ position: 'absolute', left: -800, top: -3000, width: 1600, height: 800 }}>
      <Reveal T={T} at={a + 0.6} dur={1.0} style={{ left: 0, top: 70, fontFamily: MONO, fontSize: 34, fontWeight: 600, letterSpacing: '0.14em', color: CORAL }}>UNIT 3 · DAY 2 · BUILDING THE TOOLS</Reveal>
      <Reveal T={T} at={a + 1.0} dur={1.6} style={{ left: -4, top: 120, fontFamily: SERIF, fontStyle: 'italic', fontSize: 160, lineHeight: 1.0, color: INK }}>p = mv</Reveal>
      <Reveal T={T} at={a + 1.8} dur={1.6} style={{ left: -4, top: 300, fontFamily: SERIF, fontSize: 72, lineHeight: 1.15, color: INDIGO }}>kg·m/s · a vector: direction matters</Reveal>
      <Reveal T={T} at={a + 3.4} dur={1.6} style={{ left: 0, top: 450, fontFamily: SERIF, fontStyle: 'italic', fontSize: 46, color: INDIGO }}>K1 · Momentum and its vector nature.   S1 · Compute momentum.</Reveal>
      <div style={{ position: 'absolute', left: 0, top: 590, opacity: env(T, a + 4.4), fontFamily: MONO, fontSize: 30, fontWeight: 500, color: GREY }}>Space: play / continue · N: next section · B: back</div>
    </div>
  );
}
function Return({ T, C }) {
  const r = C.Return;
  return (
    <Scene n="Return" T={T} C={C} ph={0.2}>
      <Kicker T={T} at={r + 0.3} top={44} s="FROM DAY 1’S EXIT TICKETS" />
      <Big T={T} at={r + 0.8} top={160} w={1880} s="“Something that combines how heavy it is and how fast it goes.”" size={62} italic c={INDIGO} />
      <Big T={T} at={r + 3.4} top={380} s="Today we define it." size={80} />
    </Scene>
  );
}
function Define({ T, C }) {
  const d = C.Define;
  return (
    <Scene n="Define" T={T} C={C} ph={0.6}>
      <Kicker T={T} at={d + 0.3} top={44} s="MOMENTUM" />
      <div style={{ position: 'absolute', left: 50, top: 110, opacity: env(T, d + 0.6), padding: '6px 50px 18px', borderRadius: 12, border: `4px solid ${SAGE}`, background: SAGE_T, fontFamily: SERIF, fontStyle: 'italic', fontSize: 170, color: INK }}>p = mv</div>
      <div style={{ position: 'absolute', left: 60, top: 420, display: 'flex', gap: 30 }}>
        {[['p', 'momentum', 'kg·m/s', SAGE], ['m', 'mass', 'kg', INDIGO], ['v', 'velocity', 'm/s, with a direction', CORAL]].map(([k, a, b, c], i) => <div key={i} style={{ width: 590, opacity: env(T, d + 2 + i * 0.8), padding: '20px 28px', borderRadius: 12, border: `3px solid ${c}`, background: '#ffffff', boxSizing: 'border-box' }}><div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 64, color: c }}>{k}</div><div style={{ fontFamily: SERIF, fontSize: 42, color: INK }}>{a}</div><div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 600, color: GREY, marginTop: 6 }}>{b}</div></div>)}
      </div>
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, d + 5.6)}>
          <circle cx={200} cy={820} r={34} fill={SAGE_T} stroke={INK} strokeWidth={3} />
          <Arr2 x1={250} y1={820} x2={480} y2={820} c={CORAL} />
          <SV x={360} y={790} s="v" c={CORAL} size={40} an="middle" />
          <Arr2 x1={250} y1={880} x2={620} y2={880} c={SAGE} w={11} h={26} />
          <SV x={440} y={940} s="p" c={SAGE} size={40} an="middle" />
        </g>
      </svg>
      <Big T={T} at={d + 6.2} top={780} left={720} w={1220} s="Momentum points the same way as the velocity." size={48} />
    </Scene>
  );
}
function Examples({ T, C }) {
  const e = C.Examples, cols = [380, 380, 260, 420];
  return (
    <Scene n="Examples" T={T} C={C} ph={0.9}>
      <Kicker T={T} at={e + 0.3} top={44} s="ANSWER · CAR: p = (1500)(30) = 45,000 kg·m/s EAST" c={SAGE} />
      <div style={{ position: 'absolute', left: 60, top: 130, opacity: env(T, e + 1), border: `3px solid ${INK}`, borderRadius: 8, background: '#ffffff', overflow: 'hidden' }}>
        <div style={{ display: 'flex', background: '#eeeefa', padding: '12px 26px', fontFamily: SANS, fontSize: 32, fontWeight: 500, color: INK }}>{['object (all east)', 'm (kg)', 'v (m/s)', 'p = mv (kg·m/s)'].map((h, k) => <div key={k} style={{ width: cols[k] }}>{h}</div>)}</div>
        {ROWS.map((r, i) => { const last = i === 4, at = e + 1.6 + i * 2.6; return (
          <div key={i} style={{ display: 'flex', padding: '16px 26px', borderTop: `2px solid ${TINT}`, fontFamily: MONO, fontSize: 38, fontWeight: 500, opacity: env(T, at, 0.4) }}>
            <div style={{ width: cols[0], fontFamily: SERIF, fontSize: 44, color: r[5] }}>{r[0]}</div>
            <div style={{ width: cols[1], color: INK }}>{M(r[1])}</div>
            <div style={{ width: cols[2], color: INK }}>{r[2]}</div>
            <div style={{ width: cols[3], color: last ? CORAL : SAGE, fontWeight: 600 }}>{last ? '?' : M(r[3])}</div>
          </div>
        ); })}
      </div>
      <Big T={T} at={e + 14.6} top={880} w={1880} s="2026-XJ uses class scenario values: about 3.5 × 10^11 kg at 8,500 m/s." size={38} italic c={GREY} />
    </Scene>
  );
}
function Chart({ T, C }) {
  const c = C.Chart, X0 = 420, PX = 82;
  return (
    <Scene n="Chart" T={T} C={C} ph={0.4}>
      <div style={{ position: 'absolute', left: 60, top: 40, opacity: env(T, c + 0.3), fontFamily: MONO, fontSize: 34, fontWeight: 600, color: SAGE }}>{M('ANSWER · 2026-XJ: p ≈ (3.5 × 10^11)(8,500) ≈ 3.0 × 10^15 kg·m/s')}</div>
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        {Array.from({ length: 17 }, (_, k) => <g key={k} opacity={env(T, c + 0.8)}><line x1={X0 + k * PX} y1={150} x2={X0 + k * PX} y2={800} stroke={TINT} strokeWidth={2} />{k % 3 === 0 && <text x={X0 + k * PX} y={840} textAnchor="middle" fontFamily={MONO} fontSize={26} fill={GREY}>{MS(k === 0 ? '1' : `10^${k}`)}</text>}</g>)}
        {ROWS.map((r, i) => { const y = 200 + i * 120, w = r[4] * PX * eo((T - (c + 1.4 + i * 0.6)) / 1.2); return (
          <g key={i} opacity={env(T, c + 1.2 + i * 0.6)}>
            <text x={X0 - 20} y={y + 30} textAnchor="end" fontFamily={SERIF} fontSize={42} fill={r[5]}>{r[0]}</text>
            <rect x={X0} y={y} width={Math.max(w, 2)} height={44} rx={6} fill={r[5]} opacity={0.85} />
            <text x={X0 + Math.max(w, 2) + 16} y={y + 34} fontFamily={MONO} fontSize={30} fontWeight={600} fill={INK} opacity={env(T, c + 2.4 + i * 0.6)}>{MS(r[3])}</text>
          </g>
        ); })}
      </svg>
      <Big T={T} at={c + 5} top={870} w={1880} s="Each gridline is ×10. 2026-XJ ≈ 75 million cruise ships (3.0 × 10^15 ÷ 4 × 10^7)." size={40} c={CORAL} />
    </Scene>
  );
}
function Direction({ T, C }) {
  const d = C.Direction, y1 = 420, y2 = 700, O = 1000;
  return (
    <Scene n="Direction" T={T} C={C} ph={0.5}>
      <Kicker T={T} at={d + 0.3} top={44} s="DIRECTION MATTERS · PICK A + DIRECTION" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, d + 0.8)}>
          <line x1={200} y1={200} x2={1800} y2={200} stroke={INK} strokeWidth={3} />
          <Arr2 x1={O} y1={200} x2={1300} y2={200} c={INK} w={5} h={16} />
          <SV x={1320} y={262} s="east = +" c={INK} size={40} />
          <SV x={O - 20} y={262} s="west = −" c={INK} size={40} an="end" />
        </g>
        <g opacity={env(T, d + 2)}>
          <circle cx={O - 200} cy={y1} r={36} fill={SAGE_T} stroke={INK} strokeWidth={3} />
          <Arr2 x1={O - 150} y1={y1} x2={O + 150} y2={y1} c={SAGE} w={11} h={26} />
          <SV x={O + 180} y={y1 + 14} s="2 kg at +3 m/s → p = +6 kg·m/s" c={SAGE} size={42} />
        </g>
        <g opacity={env(T, d + 4)}>
          <circle cx={O + 200} cy={y2} r={36} fill={CORAL_T} stroke={INK} strokeWidth={3} />
          <Arr2 x1={O + 150} y1={y2} x2={O - 150} y2={y2} c={CORAL} w={11} h={26} />
          <SV x={O - 180} y={y2 + 14} s="2 kg at −3 m/s → p = −6 kg·m/s" c={CORAL} size={42} an="end" />
        </g>
      </svg>
      <Big T={T} at={d + 6} top={830} w={1880} s="Same mass, same speed, opposite momentum. The sign carries the direction." size={46} />
    </Scene>
  );
}
function Exit({ T, C }) {
  const e = C.Exit, y = 520, B = 1000, u = clamp((T - (e + 1.2)) / 3, 0, 1), bx = u < 0.5 ? lerp(300, B, u * 2) : lerp(B, 300, (u - 0.5) * 2);
  return (
    <Scene n="Exit" T={T} C={C} ph={0.3}>
      <Kicker T={T} at={e + 0.3} top={44} s="EXIT TICKET · EAST = +" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <rect x={B + 30} y={y - 160} width={40} height={320} rx={18} fill="#e9dcc4" stroke={INK} strokeWidth={3} opacity={env(T, e + 0.8)} transform={`rotate(-8 ${B + 50} ${y})`} />
        <circle cx={bx} cy={y} r={26} fill="#ffffff" stroke={INK} strokeWidth={3} opacity={env(T, e + 0.8)} />
        <g opacity={env(T, e + 2)}><Arr2 x1={300} y1={y - 120} x2={700} y2={y - 120} c={INDIGO} /><SV x={500} y={y - 150} s="before: 40 m/s east" c={INDIGO} size={40} an="middle" /></g>
        <g opacity={env(T, e + 4.4)}><Arr2 x1={700} y1={y + 120} x2={200} y2={y + 120} c={CORAL} /><SV x={450} y={y + 190} s="after: 50 m/s west" c={CORAL} size={40} an="middle" /></g>
      </svg>
      <Big T={T} at={e + 5} top={300} left={1240} w={700} s="m = 0.15 kg" size={52} />
      <Big T={T} at={e + 5.6} top={400} left={1240} w={700} s="Δp = p_f − p_i = ?" size={60} italic c={INDIGO} />
      <Big T={T} at={e + 6.4} top={530} left={1240} w={700} s="Keep the signs." size={44} c={CORAL} />
    </Scene>
  );
}
function Marz({ T, C }) {
  const s = C.Marz;
  const lv = [['0', 'not yet'], ['1', 'with help'], ['2', 'the simpler parts'], ['3', 'the target'], ['4', 'beyond it']];
  return (
    <Scene n="Marz" T={T} C={C} ph={0.7}>
      <Kicker T={T} at={s + 0.3} top={44} s="MARZANO CHECK-IN" />
      <div style={{ position: 'absolute', left: 60, top: 110, width: 1880, opacity: env(T, s + 0.6), padding: '20px 30px', borderRadius: 10, border: `3px solid ${INDIGO}`, background: '#ffffff', boxSizing: 'border-box' }}><div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 600, color: INDIGO }}>K1 · S1</div><div style={{ fontFamily: SERIF, fontSize: 42, color: INK, marginTop: 6 }}>Momentum definition and its vector nature · Compute momentum.</div></div>
      <div style={{ position: 'absolute', left: 60, top: 420, display: 'flex', gap: 24 }}>
        {lv.map(([n, t], i) => <div key={i} style={{ width: 356, opacity: env(T, s + 1.2 + i * 0.3), padding: '20px 0', borderRadius: 10, background: ['#f7e1da', '#f3e6cf', '#eeeefa', SAGE_T, SAGE_T][i], border: `2px solid ${LINE}`, textAlign: 'center' }}><div style={{ fontFamily: MONO, fontSize: 60, fontWeight: 600, color: INK }}>{n}</div><div style={{ fontFamily: SERIF, fontSize: 38, color: GREY }}>{t}</div></div>)}
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

























function shotsU3D2(C) {
  const o = (t, d, p, dip = 0.3, r = 0) => ({ t, d, x: p[0], y: p[1], z: p[2], r, dip });
  const S = (n) => shot(...POS[n]);
  return [
    { t: -1, d: 0, x: 0, y: -2700, z: 1.15, r: -2, dip: 0 }, { t: C.Title, d: 5, x: 0, y: -2680, z: 1.0, r: 0, dip: 0 },
    ...['Return', 'Define', 'Examples', 'Chart', 'Direction', 'Exit', 'Marz'].map((n) => o(C[n], 1.9, S(n))),
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
  const cam = camAt(T, shotsU3D2(C));
  const tf = `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) rotate(${-cam.r}deg) translate(${-cam.x}px, ${-cam.y}px)`;
  const layer = { position: 'absolute', left: 0, top: 0, width: 0, height: 0, whiteSpace: 'nowrap', transformOrigin: '0 0', transform: tf };
  return (
    <div data-screen-label={`t=${Math.floor(time || 0)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG, fontVariantNumeric: 'lining-nums' }}>
      <div style={layer}><WorldGrid z={cam.z} on={tw.grid !== false} /></div>
      <Parallax cam={cam} T={T} />
      <div style={layer}>
        <TitleN T={T} C={C} />
        <Return T={T} C={C} />
        <Define T={T} C={C} />
        <Examples T={T} C={C} />
        <Chart T={T} C={C} />
        <Direction T={T} C={C} />
        <Exit T={T} C={C} />
        <Marz T={T} C={C} />
      </div>
      <StopBand T={T} C={C} />
    </div>
  );
}
function U3Day2App() {
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
window.U3Day2App = U3Day2App;

























