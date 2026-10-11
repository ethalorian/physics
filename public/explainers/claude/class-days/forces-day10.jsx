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
    if (ch === '_') { push('sub', str[i + 1]); i += 2; continue; }
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

const ORDER = ['Title', 'Recap', 'Define', 'Sensor', 'Types', 'Book', 'Scenarios', 'Asteroid', 'Human', 'Exit', 'Hold'];
const endOf = (C, n) => C[ORDER[ORDER.indexOf(n) + 1]];
const STOPS = {
  Recap: [1, 'DISCUSS', 'Newton’s 1st Law says a force is needed to change motion. So what IS a force? Give an example you’ve felt today.'],
  Sensor: [2, 'PREDICT', 'What will the reading do when you pull on the hook? When you push?'],
  Book: [3, 'YOUR TURN', 'Sketch the book. Draw and label every force acting on it.'],
  Scenarios: [4, 'PAIRS', 'Practice scenarios: for each one, list every force and draw it as an arrow.'],
  Asteroid: [5, 'DISCUSS', 'Which forces could humans add to this picture? How would we apply them?'],
  Exit: [6, 'EXIT TICKET', 'List all the forces on a car coasting down a hill (no engine power, no brakes). Draw each as an arrow.'],
};
const STOP_KEYS = Object.keys(STOPS), LAST = STOP_KEYS[STOP_KEYS.length - 1];
const CW = 2000, CH = 1040, VIO = '#8a7bb8';
const shot = (cx, cy) => [cx, cy - CH / 2 + 526 / 0.8, 0.8];
const POS = { Recap: [0, -1300], Define: [2200, -1300], Sensor: [2200, 0], Types: [0, 0], Book: [-2200, 0], Scenarios: [-2200, 1300], Asteroid: [0, 1300], Human: [2200, 1300], Exit: [2200, 2600] };
const Scene = ({ n, T, C, children, ph = 0 }) => <Card x={POS[n][0]} y={POS[n][1]} w={CW} h={CH} T={T} at={C[n] - 0.9} ph={ph}>{children}</Card>;
const Big = ({ T, at, top, left = 60, s, c = INK, size = 64, italic = false, w }) => (
  <div style={{ position: 'absolute', left, top, width: w, whiteSpace: w ? 'normal' : 'nowrap', opacity: env(T, at, 0.6), transform: `translateY(${(1 - env(T, at, 0.6)) * 14}px)`, fontFamily: SERIF, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: 1.2, color: c }}>{M(s)}</div>
);
const SV = ({ x, y, s, c, size = 44, an = 'start', o = 1 }) => o > 0 ? <text x={x} y={y} textAnchor={an} fontFamily={SERIF} fontStyle="italic" fontSize={size} fill={c} opacity={o}>{MS(s)}</text> : null;
const Arr = ({ x1, y1, x2, y2, c, w = 10, o = 1, h = 26, dash }) => o > 0 ? <path d={arrowD(x1, y1, x2, y2, h)} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} opacity={o} /> : null;
function CarG({ x, y, c, s = 1, o = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <path d="M -70 -20 L -70 -46 L -34 -46 L -18 -70 L 30 -70 L 48 -46 L 70 -46 L 70 -20 Z" fill={c} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <path d="M -12 -64 L 26 -64 L 38 -48 L -22 -48 Z" fill="#ffffff" stroke={INK} strokeWidth={2} />
      <circle cx={-40} cy={-18} r={15} fill="#ffffff" stroke={INK} strokeWidth={3.5} />
      <circle cx={42} cy={-18} r={15} fill="#ffffff" stroke={INK} strokeWidth={3.5} />
    </g>
  );
}
function Sensor({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={0} y={-50} width={220} height={100} rx={16} fill={SAGE_T} stroke={INK} strokeWidth={4} />
      <text x={110} y={10} textAnchor="middle" fontFamily={MONO} fontSize={26} fontWeight={600} fill={INK}>GDX-FOR</text>
      <line x1={220} y1={0} x2={270} y2={0} stroke={INK} strokeWidth={6} />
      <circle cx={288} cy={0} r={18} fill="none" stroke={INK} strokeWidth={6} />
    </g>
  );
}

function TitleF({ T, C }) {
  const a = C.Title - 1.2;
  return (
    <div style={{ position: 'absolute', left: -800, top: -3000, width: 1600, height: 800 }}>
      <Reveal T={T} at={a + 0.6} dur={1.0} style={{ left: 0, top: 70, fontFamily: MONO, fontSize: 34, fontWeight: 600, letterSpacing: '0.14em', color: CORAL }}>DAY 10 · BUILDING THE TOOLS</Reveal>
      <Reveal T={T} at={a + 1.0} dur={1.6} style={{ left: -4, top: 120, fontFamily: SERIF, fontSize: 150, lineHeight: 1.0, color: INK }}>Forces</Reveal>
      <Reveal T={T} at={a + 1.8} dur={1.6} style={{ left: -4, top: 270, fontFamily: SERIF, fontSize: 150, lineHeight: 1.0, color: INK }}>what pushes and pulls</Reveal>
      <Reveal T={T} at={a + 3.4} dur={1.6} style={{ left: 0, top: 460, fontFamily: SERIF, fontStyle: 'italic', fontSize: 52, color: INDIGO }}>K2 · Name the forces in a scenario: gravity, normal, friction, applied, tension.</Reveal>
      <div style={{ position: 'absolute', left: 0, top: 590, opacity: env(T, a + 4.4), fontFamily: MONO, fontSize: 30, fontWeight: 500, color: GREY }}>Space: play / continue · N: next section · B: back</div>
    </div>
  );
}
function Recap({ T, C }) {
  const rc = C.Recap, u = clamp(T - (rc + 2), 0, 7.6);
  const P = (q) => [200 + 160 * q, 560 - (q > 5 ? 25 * (q - 5) ** 2 : 0)];
  const [px, py] = P(u);
  const trail = Array.from({ length: 40 }, (_, k) => { const p = P((u * k) / 39); return (k ? 'L ' : 'M ') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
  const push = win(T, rc + 6.8, rc + 8.4, 0.3);
  return (
    <Scene n="Recap" T={T} C={C} ph={0.2}>
      <Kicker T={T} at={rc + 0.3} top={44} s="RECAP · NEWTON’S 1ST LAW" />
      <Big T={T} at={rc + 0.6} top={92} s="An object keeps doing what it’s doing…" size={64} />
      <Big T={T} at={rc + 1.6} top={175} s="…unless a net force acts on it." size={64} c={INDIGO} italic />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        {u > 0 && <path d={trail} fill="none" stroke={GREY} strokeWidth={4} strokeDasharray="10 12" opacity={0.6} />}
        <ellipse cx={px} cy={py} rx={40} ry={16} fill={INK} opacity={env(T, rc + 1.6)} />
        <SV x={500} y={630} s="constant velocity: no net force" c={GREY} size={38} o={env(T, rc + 3.4)} />
        <Arr x1={px} y1={py + 140} x2={px} y2={py + 34} c={CORAL} w={9} h={22} o={push} />
        <SV x={px + 30} y={py + 120} s="force" c={CORAL} size={38} o={push} />
        <SV x={1460} y={560} s="net force → motion changes" c={CORAL} size={40} o={env(T, rc + 8.2)} />
      </svg>
      <Big T={T} at={rc + 9.4} top={760} s="Today: what IS a force?" size={72} />
    </Scene>
  );
}
function Define({ T, C }) {
  const d = C.Define, l2 = 160 * eo((T - (d + 9)) / 0.8), l5 = 400 * eo((T - (d + 10)) / 0.8);
  const rot = eio((T - (d + 15)) / 1.2) * -22 * D2R;
  return (
    <Scene n="Define" T={T} C={C} ph={0.7}>
      <Kicker T={T} at={d + 0.3} top={44} s="A FORCE IS…" />
      <Big T={T} at={d + 0.6} top={92} s="a push or a pull." size={80} />
      <Big T={T} at={d + 2.4} top={200} s="Measured in newtons (N)." size={56} c={INDIGO} italic />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, d + 3.6)}>
          <circle cx={360} cy={470} r={64} fill={CORAL_T} stroke={INK} strokeWidth={4} />
          <path d="M 360 408 q 6 -26 22 -34" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
          <path d="M 368 396 q 26 -18 44 -4 q -22 14 -44 4 Z" fill={SAGE_T} stroke={INK} strokeWidth={3} />
        </g>
        <Arr x1={360} y1={548} x2={360} y2={548 + 130 * eo((T - (d + 4.4)) / 0.8)} c={CORAL} w={9} h={22} o={env(T, d + 4.4)} />
        <SV x={390} y={650} s="≈ 1 N" c={CORAL} size={48} o={env(T, d + 5)} />
        <Arr x1={1040} y1={440} x2={1040 + l2} y2={440} c={INDIGO} w={10} o={env(T, d + 9)} />
        <SV x={1070 + l2} y={454} s="2 N" c={INDIGO} size={44} o={env(T, d + 9.6)} />
        <Arr x1={1040} y1={660} x2={1040 + l5 * Math.cos(rot)} y2={660 + l5 * Math.sin(rot)} c={INDIGO} w={10} o={env(T, d + 10)} />
        <SV x={1070 + l5 * Math.cos(rot)} y={674 + l5 * Math.sin(rot)} s="5 N" c={INDIGO} size={44} o={env(T, d + 10.6)} />
      </svg>
      <Big T={T} at={d + 5.6} top={720} left={60} w={760} s="1 N is about the weight of a small apple." size={44} italic c={GREY} />
      <Kicker T={T} at={d + 8.4} top={330} left={1000} s="FORCES ARE VECTORS" />
      <Big T={T} at={d + 12} top={740} left={1000} w={940} s="Length = magnitude (in N). Arrowhead = direction." size={46} />
      <Big T={T} at={d + 16.4} top={870} left={1000} w={940} s="Same 5 N, new direction: a different force." size={42} italic c={GREY} />
    </Scene>
  );
}
function Sensor0({ T, C }) {
  const s = C.Sensor, pulse = 1 + 0.08 * Math.sin(T * 5);
  return (
    <Scene n="Sensor" T={T} C={C} ph={0.4}>
      <Kicker T={T} at={s + 0.3} top={44} s="DEMO · FORCE SENSOR" />
      <Big T={T} at={s + 0.6} top={92} s="Pull on the hook. Then push." size={70} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, s + 1.4)}><Sensor x={260} y={540} s={1.6} /></g>
        <circle cx={260 + 288 * 1.6} cy={540} r={60 * pulse} fill="none" stroke={CORAL} strokeWidth={4} strokeDasharray="10 10" opacity={env(T, s + 2.4)} />
        <SV x={260 + 288 * 1.6} y={650} s="your hand" c={CORAL} size={40} an="middle" o={env(T, s + 2.4)} />
        <g opacity={env(T, s + 3.2)}>
          <rect x={1060} y={380} width={820} height={300} rx={14} fill="#ffffff" stroke={INK} strokeWidth={4} />
          <text x={1100} y={440} fontFamily={SANS} fontSize={32} fontWeight={500} fill={GREY}>Force (N)</text>
          <text x={1470} y={530} textAnchor="middle" fontFamily={MONO} fontSize={84} fontWeight={600} fill={INK}>0.0 N</text>
          <line x1={1110} y1={610} x2={1830} y2={610} stroke={INK} strokeWidth={3} />
          <line x1={1470} y1={590} x2={1470} y2={630} stroke={INK} strokeWidth={4} />
          <text x={1110} y={660} textAnchor="middle" fontFamily={MONO} fontSize={26} fill={GREY}>−5</text>
          <text x={1830} y={660} textAnchor="middle" fontFamily={MONO} fontSize={26} fill={GREY}>+5</text>
        </g>
      </svg>
    </Scene>
  );
}
const FT = [
  ['Gravity', CORAL, 'Pulls toward the center of a big body: Earth, the Sun.'],
  ['Normal', SAGE, 'A surface pushes back, straight out from the surface.'],
  ['Friction', INK, 'Resists sliding, along the surface.'],
  ['Tension', VIO, 'A rope or string pulls along its length.'],
  ['Applied', INDIGO, 'Any push or pull you supply.'],
];
function FIcon({ i }) {
  const box = (x, y, w = 100, h = 50) => <rect x={x} y={y} width={w} height={h} rx={6} fill="#d7d8ea" stroke={INK} strokeWidth={3} />;
  if (i === 0) return <g><line x1={40} y1={180} x2={316} y2={180} stroke={INK} strokeWidth={4} /><circle cx={178} cy={60} r={26} fill="#d7d8ea" stroke={INK} strokeWidth={3} /><Arr x1={178} y1={92} x2={178} y2={168} c={CORAL} w={7} h={18} /></g>;
  if (i === 1) return <g><line x1={30} y1={170} x2={326} y2={170} stroke={INK} strokeWidth={4} />{box(128, 120)}<Arr x1={178} y1={118} x2={178} y2={30} c={SAGE} w={7} h={18} /></g>;
  if (i === 2) return <g><line x1={30} y1={170} x2={326} y2={170} stroke={INK} strokeWidth={4} />{box(128, 120)}<Arr x1={240} y1={90} x2={320} y2={90} c={GREY} w={4} h={14} dash="8 6" /><text x={276} y={74} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={28} fill={GREY}>v</text><Arr x1={124} y1={158} x2={40} y2={158} c={INK} w={7} h={18} /></g>;
  if (i === 3) return <g><line x1={100} y1={18} x2={256} y2={18} stroke={INK} strokeWidth={5} /><line x1={178} y1={18} x2={178} y2={110} stroke={GREY} strokeWidth={4} />{box(138, 110, 80, 60)}<Arr x1={244} y1={150} x2={244} y2={40} c={VIO} w={7} h={18} /></g>;
  return <g><line x1={30} y1={170} x2={326} y2={170} stroke={INK} strokeWidth={4} />{box(178, 120)}<Arr x1={50} y1={145} x2={170} y2={145} c={INDIGO} w={7} h={18} /></g>;
}
function Types({ T, C }) {
  const t = C.Types, p1 = win(T, t + 1, t + 4.2, 0.4), p2 = win(T, t + 4.6, t + 7.8, 0.4);
  const val = 4.2 * p1 - 3.1 * p2 + (p1 + p2 > 0.5 ? 0.05 * Math.sin(T * 9) : 0);
  return (
    <Scene n="Types" T={T} C={C} ph={0.9}>
      <Kicker T={T} at={t + 0.3} top={44} s="ANSWER · WATCH THE READING" c={SAGE} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Sensor x={80} y={180} />
        <Arr x1={410} y1={180} x2={580} y2={180} c={INDIGO} w={9} h={22} o={p1} />
        <SV x={600} y={194} s="pull" c={INDIGO} size={40} o={p1} />
        <Arr x1={590} y1={180} x2={414} y2={180} c={CORAL} w={9} h={22} o={p2} />
        <SV x={610} y={194} s="push" c={CORAL} size={40} o={p2} />
        <text x={900} y={130} fontFamily={SANS} fontSize={30} fontWeight={500} fill={GREY}>Force (N)</text>
        <text x={1290} y={130} textAnchor="middle" fontFamily={MONO} fontSize={56} fontWeight={600} fill={val >= 0 ? SAGE : CORAL}>{`${val < -0.05 ? '−' : '+'}${Math.abs(val).toFixed(1)} N`}</text>
        <line x1={890} y1={200} x2={1690} y2={200} stroke={INK} strokeWidth={3} />
        <line x1={1290} y1={176} x2={1290} y2={224} stroke={INK} strokeWidth={4} />
        <rect x={Math.min(1290, 1290 + val * 80)} y={180} width={Math.abs(val) * 80} height={40} rx={4} fill={val >= 0 ? SAGE : CORAL} />
        <text x={890} y={254} textAnchor="middle" fontFamily={MONO} fontSize={24} fill={GREY}>−5</text>
        <text x={1690} y={254} textAnchor="middle" fontFamily={MONO} fontSize={24} fill={GREY}>+5</text>
      </svg>
      <Big T={T} at={t + 8.2} top={300} s="Pull → positive. Push → negative. The sign shows the direction." size={44} italic c={INDIGO} />
      {FT.map(([name, c, desc], i) => { const at = t + 9.4 + i * 2.6, e = env(T, at, 0.6); return (
        <div key={i} style={{ position: 'absolute', left: 60 + i * 380, top: 440, width: 356, height: 480, opacity: e, transform: `translateY(${(1 - e) * 20}px)`, borderRadius: 10, border: `3px solid ${c}`, background: '#ffffff', boxSizing: 'border-box' }}>
          <div style={{ position: 'absolute', left: 24, top: 20, fontFamily: SERIF, fontSize: 50, color: c }}>{name}</div>
          <svg width="356" height="200" style={{ position: 'absolute', left: 0, top: 90 }}><FIcon i={i} /></svg>
          <div style={{ position: 'absolute', left: 24, top: 300, width: 308, whiteSpace: 'normal', fontFamily: SERIF, fontStyle: 'italic', fontSize: 32, lineHeight: 1.2, color: INK }}>{desc}</div>
        </div>
      ); })}
    </Scene>
  );
}
function Book({ T, C }) {
  const b = C.Book;
  return (
    <Scene n="Book" T={T} C={C} ph={0.5}>
      <Kicker T={T} at={b + 0.3} top={44} s="SCENARIO 1" />
      <Big T={T} at={b + 0.6} top={92} s="A book resting on a desk." size={76} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g opacity={env(T, b + 1.2)}>
          <rect x={560} y={640} width={880} height={28} fill="#ffffff" stroke={INK} strokeWidth={4} />
          <rect x={600} y={668} width={30} height={250} fill="#ffffff" stroke={INK} strokeWidth={4} />
          <rect x={1370} y={668} width={30} height={250} fill="#ffffff" stroke={INK} strokeWidth={4} />
          <rect x={860} y={570} width={280} height={70} rx={6} fill="#d7d8ea" stroke={INK} strokeWidth={4} />
          <line x1={880} y1={570} x2={880} y2={640} stroke={INK} strokeWidth={3} />
        </g>
      </svg>
    </Scene>
  );
}
function Scenarios({ T, C }) {
  const s = C.Scenarios, a = (k) => env(T, s + k, 0.5);
  const L = (x, y, t, c, an = 'start', at = 0) => <SV x={x} y={y} s={t} c={c} size={34} an={an} o={a(at)} />;
  return (
    <Scene n="Scenarios" T={T} C={C} ph={1.0}>
      <Kicker T={T} at={s + 0.3} top={44} s="ANSWER · THE BOOK" c={SAGE} />
      <Kicker T={T} at={s + 5.6} top={44} left={700} s="SCENARIO 2 · A CAR ON A ROAD" />
      <Kicker T={T} at={s + 11.6} top={44} left={1360} s="SCENARIO 3 · ON A ROPE" />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <g>
          <rect x={120} y={500} width={440} height={22} fill="#ffffff" stroke={INK} strokeWidth={3} />
          <rect x={150} y={522} width={20} height={150} fill="#ffffff" stroke={INK} strokeWidth={3} />
          <rect x={510} y={522} width={20} height={150} fill="#ffffff" stroke={INK} strokeWidth={3} />
          <rect x={250} y={450} width={180} height={50} rx={5} fill="#d7d8ea" stroke={INK} strokeWidth={3} />
          <Arr x1={340} y1={475} x2={340} y2={640} c={CORAL} w={8} h={20} o={a(1)} />
          {L(360, 630, 'gravity', CORAL, 'start', 1)}
          <Arr x1={340} y1={475} x2={340} y2={310} c={SAGE} w={8} h={20} o={a(1.8)} />
          {L(360, 330, 'normal', SAGE, 'start', 1.8)}
        </g>
        <g opacity={a(5.4)}>
          <line x1={720} y1={480} x2={1300} y2={480} stroke={INK} strokeWidth={4} />
          <CarG x={1010} y={480} c={CORAL_T} s={1.5} />
        </g>
        <Arr x1={1010} y1={430} x2={1010} y2={600} c={CORAL} w={8} h={20} o={a(6.4)} />
        {L(1030, 600, 'gravity', CORAL, 'start', 6.4)}
        <Arr x1={1010} y1={400} x2={1010} y2={250} c={SAGE} w={8} h={20} o={a(7.2)} />
        {L(1030, 270, 'normal', SAGE, 'start', 7.2)}
        <Arr x1={1130} y1={430} x2={1290} y2={430} c={INDIGO} w={8} h={20} o={a(8)} />
        {L(1290, 400, 'applied (engine)', INDIGO, 'end', 8)}
        <Arr x1={890} y1={430} x2={730} y2={430} c={INK} w={8} h={20} o={a(8.8)} />
        {L(730, 400, 'friction + drag', INK, 'start', 8.8)}
        <g opacity={a(11.4)}>
          <line x1={1460} y1={180} x2={1840} y2={180} stroke={INK} strokeWidth={6} />
          <line x1={1650} y1={180} x2={1650} y2={400} stroke={GREY} strokeWidth={5} />
          <circle cx={1650} cy={450} r={24} fill="#ffffff" stroke={INK} strokeWidth={5} />
          <path d="M 1650 474 L 1650 580 M 1650 490 L 1638 404 M 1650 490 L 1662 404 M 1650 580 L 1624 680 M 1650 580 L 1676 680" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        </g>
        <Arr x1={1720} y1={540} x2={1720} y2={300} c={VIO} w={8} h={20} o={a(12.4)} />
        {L(1740, 330, 'tension', VIO, 'start', 12.4)}
        <Arr x1={1580} y1={530} x2={1580} y2={720} c={CORAL} w={8} h={20} o={a(13.2)} />
        {L(1560, 720, 'gravity', CORAL, 'end', 13.2)}
      </svg>
      <Big T={T} at={s + 2.6} top={720} left={60} w={580} s="Equal and opposite: the book stays at rest." size={38} italic />
      <Big T={T} at={s + 9.8} top={720} left={700} w={600} s="Moving at steady speed: forward and backward balance." size={38} italic />
      <Big T={T} at={s + 14.2} top={760} left={1360} w={580} s="Hanging still: tension balances gravity." size={38} italic />
      <Big T={T} at={s + 17.4} top={880} w={1880} s="Not forces: “momentum,” “speed,” “inertia.” A force always has something doing the pushing or pulling." size={40} italic c={GREY} />
    </Scene>
  );
}
const ROWS = [
  ['Solar gravity', 'toward the Sun · by far the biggest', CORAL, 280],
  ['Earth’s gravity', 'toward Earth · tiny now, growing', CORAL, 10],
  ['Other planets’ gravity', 'negligible', GREY, 4],
  ['Friction', 'zero: no air in space', INK, 0],
  ['Solar radiation pressure', 'sunlight pushes · very small, but real', VIO, 6],
];
function Asteroid({ T, C }) {
  const a = C.Asteroid, R = [640, 470], S = [200, 560], E = [820, 760];
  const u = (P, k) => { const dx = P[0] - R[0], dy = P[1] - R[1], d = Math.hypot(dx, dy); return [k * dx / d, k * dy / d]; };
  const toS = (k) => u(S, k), toE = (k) => u(E, k), away = (k) => u(S, -k);
  const row = (i) => env(T, a + 3 + i * 2.2, 0.5);
  return (
    <Scene n="Asteroid" T={T} C={C} ph={0.8}>
      <Kicker T={T} at={a + 0.3} top={44} s="THE FORCES ON 2026-XJ" />
      <Big T={T} at={a + 0.6} top={92} s="What is pushing or pulling it right now?" size={62} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <circle cx={S[0]} cy={S[1]} r={90} fill={CORAL_T} stroke={CORAL} strokeWidth={4} opacity={env(T, a + 1.4)} />
        <text x={S[0]} y={S[1] + 14} textAnchor="middle" fontFamily={SERIF} fontSize={42} fill={CORAL} opacity={env(T, a + 1.4)}>Sun</text>
        <circle cx={E[0]} cy={E[1]} r={30} fill="#d7d8ea" stroke={INK} strokeWidth={3} opacity={env(T, a + 1.4)} />
        <text x={E[0]} y={E[1] + 70} textAnchor="middle" fontFamily={SERIF} fontSize={36} fill={INK} opacity={env(T, a + 1.4)}>Earth</text>
        {[-30, 0, 30].map((dy, k) => <line key={k} x1={300} y1={S[1] - 30 + dy} x2={560} y2={R[1] + dy * 0.6} stroke={VIO} strokeWidth={2.5} strokeDasharray="6 12" opacity={0.6 * row(4)} />)}
        <Rock x={R[0]} y={R[1]} r={36} spin={T * 16} o={env(T, a + 1.4)} />
        <Arr x1={R[0] + toS(46)[0]} y1={R[1] + toS(46)[1]} x2={R[0] + toS(260)[0]} y2={R[1] + toS(260)[1]} c={CORAL} w={9} h={22} o={row(0)} />
        <SV x={420} y={440} s="solar gravity" c={CORAL} size={34} an="middle" o={row(0)} />
        <Arr x1={R[0] + toE(46)[0]} y1={R[1] + toE(46)[1]} x2={R[0] + toE(80)[0]} y2={R[1] + toE(80)[1]} c={CORAL} w={5} h={12} o={row(1)} />
        <SV x={700} y={600} s="Earth: tiny" c={CORAL} size={32} o={row(1)} />
        <Arr x1={R[0] + away(46)[0]} y1={R[1] + away(46)[1]} x2={R[0] + away(70)[0]} y2={R[1] + away(70)[1]} c={VIO} w={4} h={10} o={row(4)} />
        <SV x={700} y={410} s="light pressure" c={VIO} size={30} o={row(4)} />
        {ROWS.map(([, , c, w], i) => <g key={i} opacity={row(i)}>{w > 0 ? <rect x={1640} y={208 + i * 118} width={w * eo((T - (a + 3 + i * 2.2)) / 0.8)} height={30} rx={4} fill={c} /> : <text x={1650} y={234 + i * 118} fontFamily={MONO} fontSize={32} fontWeight={600} fill={INK}>0</text>}</g>)}
        <text x={1920} y={808} textAnchor="end" fontFamily={MONO} fontSize={24} fill={GREY} opacity={row(4)}>bars not to scale</text>
      </svg>
      {ROWS.map(([name, note], i) => (
        <div key={i} style={{ position: 'absolute', left: 1000, top: 190 + i * 118, opacity: row(i), transform: `translateX(${(1 - row(i)) * -16}px)` }}>
          <div style={{ fontFamily: SERIF, fontSize: 42, color: INK, lineHeight: 1.1 }}>{name}</div>
          <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 30, color: GREY, lineHeight: 1.2 }}>{note}</div>
        </div>
      ))}
      <Big T={T} at={a + 15.6} top={850} w={1880} s="We can’t switch any of these off. To deflect 2026-XJ, we have to add a force of our own." size={44} c={INDIGO} />
    </Scene>
  );
}
function Human({ T, C }) {
  const h = C.Human, hit = h + 3.8, sx = lerp(120, 690, eio((T - (h + 1.4)) / 2.4));
  const fl = clamp((T - hit) / 0.8, 0, 1), bl = clamp((T - (h + 7.6)) / 1.2, 0, 1);
  return (
    <Scene n="Human" T={T} C={C} ph={0.3}>
      <Kicker T={T} at={h + 0.3} top={44} s="ANSWER · ADD AN APPLIED FORCE" c={SAGE} />
      <Big T={T} at={h + 0.8} top={110} s="Kinetic impactor" size={60} c={INDIGO} />
      <Big T={T} at={h + 6.8} top={110} left={1040} s="Nuclear option" size={60} c={CORAL} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <line x1={760} y1={500} x2={960} y2={500} stroke={GREY} strokeWidth={4} strokeDasharray="10 10" opacity={env(T, h + 4.4)} />
        <path d="M 760 500 Q 860 490 960 450" fill="none" stroke={INDIGO} strokeWidth={5} opacity={env(T, h + 4.8)} />
        <SV x={960} y={430} s="new path" c={INDIGO} size={32} an="end" o={env(T, h + 4.8)} />
        <Rock x={760} y={500} r={40} spin={T * 14} o={env(T, h + 0.8)} />
        {T < hit && T > h + 1 && <g transform={`translate(${sx} 500)`}><rect x={-30} y={-14} width={60} height={28} rx={4} fill="#ffffff" stroke={INK} strokeWidth={3} /><rect x={-20} y={-44} width={40} height={26} fill="#d7d8ea" stroke={INK} strokeWidth={2} /><rect x={-20} y={18} width={40} height={26} fill="#d7d8ea" stroke={INK} strokeWidth={2} /></g>}
        {fl > 0 && fl < 1 && <circle cx={720} cy={500} r={14 + 70 * fl} fill="none" stroke={INDIGO} strokeWidth={5} opacity={1 - fl} />}
        <Arr x1={620} y1={500} x2={710} y2={500} c={INDIGO} w={9} h={22} o={win(T, hit, hit + 2.4, 0.3)} />
        <Rock x={1640} y={500} r={40} spin={T * 14} o={env(T, h + 6.8)} />
        {bl > 0 && bl < 1 && <circle cx={1380} cy={500} r={20 + 160 * bl} fill={CORAL_T} stroke={CORAL} strokeWidth={4} opacity={1 - bl} />}
        <Arr x1={1480} y1={500} x2={1590} y2={500} c={CORAL} w={12} h={30} o={env(T, h + 8.2)} />
      </svg>
      <Big T={T} at={h + 5} top={640} left={60} w={880} s="Crash a spacecraft into it: a short push, a small change in velocity." size={40} italic />
      <Big T={T} at={h + 6.2} top={760} left={60} w={880} s="Real example: NASA’s DART spacecraft hit the asteroid Dimorphos in 2022." size={32} c={GREY} />
      <Big T={T} at={h + 8.6} top={640} left={1040} w={880} s="A brief but enormous push from a nearby blast." size={40} italic />
      <Big T={T} at={h + 10.4} top={880} w={1880} s="Either way: no force, no change in path." size={46} c={INDIGO} />
    </Scene>
  );
}
function Exit({ T, C }) {
  const e = C.Exit, ang = Math.atan2(440, 1600) / D2R, k = clamp((T - (e + 1.4)) / 6, 0, 1), f = 0.12 + 0.6 * k * k;
  const px = 200 + 1600 * f, py = 420 + 440 * f;
  return (
    <Scene n="Exit" T={T} C={C} ph={1.0}>
      <Kicker T={T} at={e + 0.3} top={44} s="EXIT TICKET" />
      <Big T={T} at={e + 0.6} top={92} s="A car coasting down a hill." size={76} />
      <Big T={T} at={e + 1.4} top={190} s="No engine power. No brakes." size={50} italic c={GREY} />
      <svg width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <path d="M 200 420 L 1800 860 L 1800 960 L 200 960 Z" fill={TINT} opacity={0.6 * env(T, e + 1)} />
        <line x1={200} y1={420} x2={1800} y2={860} stroke={INK} strokeWidth={5} opacity={env(T, e + 1)} />
        <g transform={`rotate(${ang} ${px} ${py})`}><CarG x={px} y={py} c={CORAL_T} s={1.4} o={env(T, e + 1.2)} /></g>
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
function shots10(C) {
  const o = (t, d, p, dip = 0.3, r = 0) => ({ t, d, x: p[0], y: p[1], z: p[2], r, dip });
  const S = (n) => shot(...POS[n]);
  return [
    { t: -1, d: 0, x: 0, y: -2700, z: 1.15, r: -2, dip: 0 }, { t: C.Title, d: 5, x: 0, y: -2680, z: 1.0, r: 0, dip: 0 },
    ...['Recap', 'Define', 'Sensor', 'Types', 'Book', 'Scenarios', 'Asteroid', 'Human', 'Exit'].map((n) => o(C[n], 1.9, S(n))),
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
  const cam = camAt(T, shots10(C));
  const tf = `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) rotate(${-cam.r}deg) translate(${-cam.x}px, ${-cam.y}px)`;
  const layer = { position: 'absolute', left: 0, top: 0, width: 0, height: 0, whiteSpace: 'nowrap', transformOrigin: '0 0', transform: tf };
  return (
    <div data-screen-label={`t=${Math.floor(time || 0)}s`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG, fontVariantNumeric: 'lining-nums' }}>
      <div style={layer}><WorldGrid z={cam.z} on={tw.grid !== false} /></div>
      <Parallax cam={cam} T={T} />
      <div style={layer}>
        <TitleF T={T} C={C} />
        <Recap T={T} C={C} />
        <Define T={T} C={C} />
        <Sensor0 T={T} C={C} />
        <Types T={T} C={C} />
        <Book T={T} C={C} />
        <Scenarios T={T} C={C} />
        <Asteroid T={T} C={C} />
        <Human T={T} C={C} />
        <Exit T={T} C={C} />
      </div>
      <StopBand T={T} C={C} />
    </div>
  );
}
function ForcesDay10App() {
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
window.ForcesDay10App = ForcesDay10App;
